/**
 * The scan: decode audio -> whisper transcript -> sample frames -> embed
 * everything. Runs entirely in the tab; a "scan" for a 10 minute video is
 * usually a model download the first time, then ~30-60s of work.
 */
import { decodeAudio } from "./audio";
import { embedFrames, embedText, transcribeAudio } from "./models";
import type { FrameEntry, Phase, SegmentEntry, TextEngine, WhisperSize } from "./types";
import { drawFrame, frameTimes, getDuration, openVideo, seekVideo } from "./video";
import type { DownloadState } from "./types";

const FRAME_BATCH = 6;
const TEXT_BATCH = 32;

export interface ScanArgs {
  token: number;
  isCurrent: () => boolean;
  file: File;
  videoUrl: string;
  whisperSize: WhisperSize;
  textEngine: TextEngine;
  onPhase: (phase: Phase, progress: number, statusText: string) => void;
  onDownload: (d: DownloadState | null) => void;
  onSegments: (segments: SegmentEntry[]) => void;
  onFrames: (frames: FrameEntry[]) => void;
  onDone: (summary: string) => void;
}

export async function runScan(args: ScanArgs): Promise<void> {
  const started = Date.now();
  const { isCurrent, onPhase, onDownload } = args;

  // ---------------------------------------------------------- 1. speech
  let segments: SegmentEntry[] = [];
  let speechSkipped = "";
  let speechPhaseRan = false;

  onPhase("decoding", 2, "reading the audio track");
  const audio = await decodeAudio(args.file);

  if (audio && isCurrent()) {
    speechPhaseRan = true;
    const minutes = audio.length / 16_000 / 60;
    onPhase(
      "transcribing",
      5,
      `transcribing ${minutes < 1 ? "<1" : Math.round(minutes)} min of speech with whisper`,
    );
    try {
      const out = await transcribeAudio(audio, args.whisperSize, onDownload);
      if (!isCurrent()) return;

      const chunks: { text?: string; timestamp?: [number, number] }[] = out?.chunks ?? [];
      const clean = chunks.filter(
        (c) => typeof c.text === "string" && c.text.trim().length > 0 && c.timestamp,
      );

      if (clean.length > 0) {
        onPhase("embedding", 58, `embedding ${clean.length} transcript lines`);
        const vecs = await embedText(
          clean.map((c) => c.text!.trim()),
          args.textEngine,
          onDownload,
        );
        segments = clean.map((c, i) => ({
          start: c.timestamp![0] ?? 0,
          end: c.timestamp![1] ?? c.timestamp![0] ?? 0,
          text: c.text!.trim(),
          vec: vecs[i],
        }));
      }
    } catch (err) {
      // speech indexing is nice-to-have — never kill the whole scan over it
      console.warn("[vidseek] transcription failed, continuing without speech:", err);
      speechSkipped = "transcription failed, so speech search is off";
    }
    if (isCurrent()) args.onSegments(segments);
  } else if (isCurrent()) {
    speechSkipped = "no decodable audio, so speech search is off";
    args.onSegments([]);
  }

  if (!isCurrent()) return;

  // ----------------------------------------------------------- 2. vision
  const progressBase = speechPhaseRan ? 60 : 5;
  onPhase("sampling", progressBase, "sampling frames");

  const duration = (await getDuration(args.videoUrl)) || 0;
  const times = frameTimes(duration);
  const video = await openVideo(args.videoUrl);

  const frames: FrameEntry[] = [];
  let batch: HTMLCanvasElement[] = [];
  let timesBatch: number[] = [];

  const flushBatch = async () => {
    if (batch.length === 0) return;
    const vecs = await embedFrames(batch, onDownload);
    frames.push(...timesBatch.map((t, i) => ({ t, vec: vecs[i] })));
    batch = [];
    timesBatch = [];
  };

  for (let i = 0; i < times.length; i++) {
    if (!isCurrent()) return;
    await seekVideo(video, times[i]);
    batch.push(drawFrame(video));
    timesBatch.push(times[i]);

    if (batch.length >= FRAME_BATCH) await flushBatch();

    const pct = progressBase + ((i + 1) / times.length) * (90 - progressBase);
    onPhase("sampling", pct, `scanning frame ${i + 1} / ${times.length}`);
  }
  await flushBatch();
  if (!isCurrent()) return;
  args.onFrames(frames);

  // ------------------------------------------------------- 3. wrap-up
  const secs = Math.round((Date.now() - started) / 1000);
  const speechBit =
    segments.length > 0
      ? `${segments.length} speech lines`
      : speechSkipped || "no speech found";

  const summary =
    `Scanned "${args.file.name}" — ${frames.length} frames, ${speechBit}, took ${secs}s.` +
    (segments.length === 0 && speechSkipped ? ` (${speechSkipped}.)` : "") +
    " Ask me things like \u201cwhere do they mention the budget\u201d or \u201cfind a shot of a city at night\u201d.";

  onPhase("ready", 100, "index ready");
  args.onDone(summary);
}

/** Re-embed an existing transcript (engine swap in settings). */
export async function embedTranscript(
  texts: string[],
  engine: TextEngine,
  onDownload: (d: DownloadState | null) => void,
): Promise<Float32Array[]> {
  const out: Float32Array[] = [];
  for (let i = 0; i < texts.length; i += TEXT_BATCH) {
    const slice = texts.slice(i, i + TEXT_BATCH);
    out.push(...(await embedText(slice, engine, onDownload)));
  }
  return out;
}
