/**
 * Lazy wrappers around transformers.js.
 *
 * Everything is dynamically imported so the landing page never pays for
 * onnxruntime, and models are cached per-session so switching videos
 * doesn't re-download anything.
 *
 * Runtime strategy (see README "How it works"):
 *   - WebGPU first (fp16 weights), fall back to WASM (q8 weights).
 *   - EmbeddingGemma 2 always uses fp16: its quantized exports contain a
 *     GatherBlockQuantized node that onnxruntime-web's WASM build has no
 *     kernel for ("Could not find an implementation ... node_embedding_Quant").
 *   - Any session/kernel error retries once on the next rung of the ladder
 *     with caches invalidated.
 */
import type { ProgressCallback } from "@huggingface/transformers";
import type { DownloadState, TextEngine, WhisperSize } from "./types";
import { normalize } from "./utils";

type Transformers = typeof import("@huggingface/transformers");
type TensorLike = { dims: number[]; data: Float32Array };
type PoolOpts = { pooling: "mean"; normalize: true };
type ClipVision = Awaited<
  ReturnType<Transformers["CLIPVisionModelWithProjection"]["from_pretrained"]>
>;
type ClipText = Awaited<
  ReturnType<Transformers["CLIPTextModelWithProjection"]["from_pretrained"]>
>;
type ClipProcessor = Awaited<ReturnType<Transformers["AutoProcessor"]["from_pretrained"]>>;
type ClipTokenizer = Awaited<ReturnType<Transformers["AutoTokenizer"]["from_pretrained"]>>;
type TextEncoder = {
  engine: TextEngine;
  run: (texts: string[], opts: PoolOpts) => Promise<TensorLike>;
};
type AsrFn = (audio: Float32Array, opts: Record<string, unknown>) => Promise<{
  chunks?: { text?: string; timestamp?: [number, number] }[];
}>;

export const CLIP_ID = "Xenova/clip-vit-base-patch32";
export const WHISPER_IDS = {
  tiny: "Xenova/whisper-tiny.en", // english-only, ~40 MB
  base: "Xenova/whisper-base", // multilingual, ~80 MB
} as const;
export const TEXT_IDS = {
  minilm: "Xenova/all-MiniLM-L6-v2", // q8 ~23 MB
  gemma: "onnx-community/embeddinggemma-2-ONNX", // fp16 ~540 MB
} as const;

type ProgressFn = (d: DownloadState | null) => void;

// --------------------------------------------------------------- ladder

const DEVICE_ORDER: ("webgpu" | "wasm")[] =
  typeof navigator !== "undefined" && "gpu" in navigator ? ["webgpu", "wasm"] : ["wasm"];
let ladderIdx = 0;

function device(): "webgpu" | "wasm" {
  return DEVICE_ORDER[Math.min(ladderIdx, DEVICE_ORDER.length - 1)];
}

/** fp16 weights run on both providers; q8 is the small WASM-only choice. */
function dtypeFor(engine?: TextEngine): "fp16" | "q8" {
  if (engine === "gemma") return "fp16"; // quantized gemma needs kernels ORT-wasm lacks
  return device() === "webgpu" ? "fp16" : "q8";
}

/** Errors that mean "wrong runtime for this graph", not "bug in the app". */
const INFRA_ERROR =
  /can't create a session|could not find an implementation|does not support fp16|device lost|adapter|execution provider|webgpu/i;

/**
 * Run `fn` on the current device; on a session/kernel error advance to the
 * next rung (wasm), drop every cached session and try again.
 */
async function runAttempts<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  while (ladderIdx < DEVICE_ORDER.length) {
    try {
      return await fn();
    } catch (err) {
      if (!INFRA_ERROR.test(String(err))) throw err;
      last = err;
      ladderIdx++;
      invalidate();
      if (ladderIdx < DEVICE_ORDER.length) {
        console.warn(
          `[vidseek] model runtime failed on ${DEVICE_ORDER[ladderIdx - 1]}, retrying on ${device()}:`,
          err,
        );
      }
    }
  }
  throw last;
}

// --------------------------------------------------------------- caches

let clipVision: ClipVision | null = null;
let clipProcessor: ClipProcessor | null = null;
let clipTextModel: ClipText | null = null;
let clipTokenizer: ClipTokenizer | null = null;
let asr: AsrFn | null = null;
let asrSize: WhisperSize | null = null;
let textEncoder: TextEncoder | null = null;
let modCache: Transformers | null = null;

function invalidate() {
  clipVision = null;
  clipProcessor = null;
  clipTextModel = null;
  clipTokenizer = null;
  asr = null;
  asrSize = null;
  textEncoder = null;
}

export function gpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

/** Progress callback that transformers.js fires while fetching model files. */
function track(label: string, onProgress?: ProgressFn): ProgressCallback {
  return (data) => {
    if (!onProgress) return;
    if (data.status === "progress" && "file" in data && data.file) {
      const file = String(data.file).split("/").pop() ?? String(data.file);
      onProgress({ label, file, pct: Math.round(data.progress ?? 0) });
    } else if (data.status === "ready" || data.status === "done") {
      onProgress(null);
    }
  };
}

async function transformers(): Promise<Transformers> {
  if (!modCache) {
    modCache = await import("@huggingface/transformers");
    modCache.env.allowLocalModels = false;
    modCache.env.useBrowserCache = true;
  }
  return modCache;
}

// ---------------------------------------------------------------- CLIP

interface ClipBundle {
  vision: ClipVision;
  processor: ClipProcessor;
  tokenizer: ClipTokenizer;
  text: ClipText;
}

async function loadClip(onProgress?: ProgressFn): Promise<ClipBundle> {
  const T = await transformers();
  const common = {
    device: device(),
    dtype: dtypeFor(),
    progress_callback: track("CLIP", onProgress),
  };

  if (!clipProcessor) clipProcessor = await T.AutoProcessor.from_pretrained(CLIP_ID, common);
  if (!clipVision) {
    clipVision = await T.CLIPVisionModelWithProjection.from_pretrained(CLIP_ID, common);
  }
  if (!clipTokenizer) clipTokenizer = await T.AutoTokenizer.from_pretrained(CLIP_ID, common);
  if (!clipTextModel) {
    clipTextModel = await T.CLIPTextModelWithProjection.from_pretrained(CLIP_ID, common);
  }
  onProgress?.(null);
  return { vision: clipVision, processor: clipProcessor, tokenizer: clipTokenizer, text: clipTextModel };
}

/** Embed a batch of canvases with CLIP's vision tower (normalized). */
export async function embedFrames(
  canvases: HTMLCanvasElement[],
  onProgress?: ProgressFn,
): Promise<Float32Array[]> {
  return runAttempts(async () => {
    const { vision, processor } = await loadClip(onProgress);
    const T = await transformers();
    const images = canvases.map((c) => T.RawImage.fromCanvas(c));
    const { pixel_values } = (await processor(images)) as { pixel_values: unknown };
    const { image_embeds } = (await vision({ pixel_values } as never)) as {
      image_embeds: TensorLike;
    };
    return rowsOf(image_embeds, canvases.length);
  });
}

/** Embed texts in CLIP's text tower — shares space with embedFrames. */
export async function embedClipText(
  texts: string[],
  onProgress?: ProgressFn,
): Promise<Float32Array[]> {
  return runAttempts(async () => {
    const { tokenizer, text } = await loadClip(onProgress);
    const inputs = tokenizer(texts, { padding: true, truncation: true });
    const { text_embeds } = (await text(inputs)) as { text_embeds: TensorLike };
    return rowsOf(text_embeds, texts.length);
  });
}

// ---------------------------------------------------------------- ASR

async function loadAsr(
  size: WhisperSize,
  onProgress?: ProgressFn,
): Promise<AsrFn> {
  const T = await transformers();
  if (!asr || asrSize !== size) {
    const pipe = await T.pipeline("automatic-speech-recognition", WHISPER_IDS[size], {
      device: device(),
      dtype: dtypeFor(),
      progress_callback: track("Whisper", onProgress),
    });
    asr = pipe as unknown as AsrFn;
    asrSize = size;
  }
  onProgress?.(null);
  return asr;
}

/** Load whisper (if needed) and transcribe — one retry unit. */
export async function transcribeAudio(
  audio: Float32Array,
  size: WhisperSize,
  onProgress?: ProgressFn,
): Promise<{ chunks?: { text?: string; timestamp?: [number, number] }[] }> {
  return runAttempts(async () => {
    const pipe = await loadAsr(size, onProgress);
    // note: no `task` — english-only whisper models refuse it,
    // multilingual ones default to transcribe anyway
    return pipe(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    });
  });
}

// ------------------------------------------------------- text embeddings

async function loadTextEncoder(
  engine: TextEngine,
  onProgress?: ProgressFn,
): Promise<TextEncoder> {
  const T = await transformers();
  // gemma is big — don't let a stale cached minilm share the slot
  if (!textEncoder || textEncoder.engine !== engine) {
    const pipe = (await T.pipeline("feature-extraction", TEXT_IDS[engine], {
      device: device(),
      dtype: dtypeFor(engine),
      progress_callback: track(engine === "gemma" ? "Gemma" : "MiniLM", onProgress),
    })) as unknown as TextEncoder["run"];
    textEncoder = { engine, run: pipe };
  }
  onProgress?.(null);
  return textEncoder;
}

/** EmbeddingGemma 2 is trained with task prefixes — using them keeps
 *  cross-topic similarity scores low enough to rank correctly. */
function applyPrefix(text: string, role: "doc" | "query"): string {
  return role === "query"
    ? `task: search result | query: ${text}`
    : `title: none | text: ${text}`;
}

/** Embed transcript lines / queries with the chosen text engine. */
export async function embedText(
  texts: string[],
  engine: TextEngine,
  onProgress?: ProgressFn,
  role: "doc" | "query" = "doc",
): Promise<Float32Array[]> {
  const prepared = engine === "gemma" ? texts.map((t) => applyPrefix(t, role)) : texts;
  return runAttempts(async () => {
    const encoder = await loadTextEncoder(engine, onProgress);
    const out = await encoder.run(prepared, { pooling: "mean", normalize: true });
    return rowsOf(out, prepared.length);
  });
}

// ---------------------------------------------------------------- utils

/** Split a [N, dim] tensor into N normalized row vectors. */
function rowsOf(tensor: TensorLike, n: number): Float32Array[] {
  const dim = tensor.dims[tensor.dims.length - 1];
  const data = tensor.data;
  const rows: Float32Array[] = [];
  for (let i = 0; i < n; i++) {
    rows.push(normalize(data.slice(i * dim, (i + 1) * dim)));
  }
  return rows;
}

export function currentDevice(): "webgpu" | "wasm" {
  return device();
}
