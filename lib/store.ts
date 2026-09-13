import { create } from "zustand";
import type {
  ChatMessage,
  DownloadState,
  FrameEntry,
  Hit,
  Phase,
  SegmentEntry,
  TextEngine,
  WhisperSize,
} from "./types";
import { uid } from "./utils";

export interface SeekRequest {
  t: number;
  nonce: number;
  autoplay: boolean;
}

interface StudioState {
  // --- video ---
  file: File | null;
  videoUrl: string | null;
  videoName: string | null;
  duration: number;
  currentTime: number;
  isPlaying: boolean;

  // --- scan pipeline ---
  phase: Phase;
  progress: number; // 0..100 across the whole scan
  statusText: string;
  download: DownloadState | null; // current model download, if any
  error: string | null;

  // --- index ---
  frames: FrameEntry[];
  segments: SegmentEntry[];
  speechAvailable: boolean;

  // --- settings ---
  textEngine: TextEngine;
  whisperSize: WhisperSize;
  gpu: boolean; // WebGPU detected

  // --- chat ---
  messages: ChatMessage[];
  pending: boolean;
  hits: Hit[]; // last results, drawn on the timeline
  seek: SeekRequest | null;

  // --- actions ---
  loadFile: (file: File) => void;
  clearVideo: () => void;
  setDuration: (d: number) => void;
  setTime: (t: number) => void;
  setPlaying: (p: boolean) => void;
  setGpu: (g: boolean) => void;
  analyze: () => Promise<void>;
  reembed: () => Promise<void>;
  ask: (q: string) => Promise<void>;
  jumpTo: (t: number, autoplay?: boolean) => void;
  setTextEngine: (e: TextEngine) => void;
  setWhisperSize: (w: WhisperSize) => void;
}

let scanToken = 0; // guards against double-scans / file swaps mid-run

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text:
    "Hey — drop a video on the left and I'll scan it. I watch the frames, transcribe the speech, and index everything so you can just ask.",
  createdAt: Date.now(),
};

export const useStore = create<StudioState>((set, get) => ({
  file: null,
  videoUrl: null,
  videoName: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,

  phase: "idle",
  progress: 0,
  statusText: "",
  download: null,
  error: null,

  frames: [],
  segments: [],
  speechAvailable: false,

  textEngine: "minilm",
  whisperSize: "tiny",
  gpu: false,

  messages: [WELCOME],
  pending: false,
  hits: [],
  seek: null,

  loadFile: (file) => {
    const prev = get().videoUrl;
    if (prev) URL.revokeObjectURL(prev);
    scanToken++;
    set({
      file,
      videoUrl: URL.createObjectURL(file),
      videoName: file.name,
      duration: 0,
      currentTime: 0,
      phase: "ready-to-scan",
      progress: 0,
      statusText: "",
      download: null,
      error: null,
      frames: [],
      segments: [],
      speechAvailable: false,
      hits: [],
      pending: false,
      messages: [WELCOME],
      seek: null,
    });
    void get().analyze();
  },

  clearVideo: () => {
    scanToken++;
    const prev = get().videoUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      file: null,
      videoUrl: null,
      videoName: null,
      duration: 0,
      currentTime: 0,
      phase: "idle",
      progress: 0,
      statusText: "",
      download: null,
      error: null,
      frames: [],
      segments: [],
      hits: [],
      messages: [WELCOME],
      seek: null,
    });
  },

  setDuration: (d) => set({ duration: d }),
  setTime: (t) => set({ currentTime: t }),
  setPlaying: (p) => set({ isPlaying: p }),
  setGpu: (g) => set({ gpu: g }),

  analyze: async () => {
    const { file, videoUrl, whisperSize, textEngine } = get();
    if (!file || !videoUrl) return;
    const token = ++scanToken;
    set({ hits: [], error: null, progress: 0 });

    try {
      const { runScan } = await import("./indexer");
      await runScan({
        token,
        isCurrent: () => scanToken === token,
        file,
        videoUrl,
        whisperSize,
        textEngine,
        onPhase: (phase, progress, statusText) => {
          if (scanToken !== token) return;
          set({ phase, progress, statusText });
        },
        onDownload: (d) => {
          if (scanToken !== token) return;
          set({ download: d });
        },
        onSegments: (segments) => {
          if (scanToken !== token) return;
          set({ segments, speechAvailable: segments.length > 0 });
        },
        onFrames: (frames) => {
          if (scanToken !== token) return;
          set({ frames });
        },
        onDone: (summary) => {
          if (scanToken !== token) return;
          set((s) => ({
            phase: "ready",
            progress: 100,
            statusText: "index ready",
            download: null,
            pending: false,
            messages: [
              ...s.messages,
              {
                id: uid(),
                role: "assistant",
                text: summary,
                createdAt: Date.now(),
              },
            ],
          }));
        },
      });
    } catch (err) {
      if (scanToken !== token) return;
      console.error(err);
      set({
        phase: "error",
        error: err instanceof Error ? err.message : "Scan failed — check the console.",
        download: null,
      });
    }
  },

  // Re-run just the text-embedding step (when the user swaps MiniLM <-> Gemma).
  reembed: async () => {
    const { segments, textEngine, phase } = get();
    if (phase !== "ready" || segments.length === 0) return;
    const token = scanToken;
    set({ phase: "embedding", statusText: "re-embedding transcript", progress: 92 });
    try {
      const { embedTranscript } = await import("./indexer");
      const reembedded = await embedTranscript(
        segments.map((s) => s.text),
        textEngine,
        (d) => set({ download: d }),
      );
      if (scanToken !== token) return;
      set({
        segments: segments.map((s, i) => ({ ...s, vec: reembedded[i] })),
        phase: "ready",
        statusText: "index ready",
        download: null,
      });
    } catch (err) {
      if (scanToken !== token) return;
      console.error(err);
      set((s) => ({
        phase: "ready",
        download: null,
        textEngine: "minilm",
        messages: [
          ...s.messages,
          {
            id: uid(),
            role: "assistant",
            text:
              "EmbeddingGemma didn't start in this browser (" +
              (err instanceof Error ? err.message.slice(0, 160) : "runtime error") +
              ") — switched you back to MiniLM. Try that question again.",
            createdAt: Date.now(),
          },
        ],
      }));
    }
  },

  ask: async (q) => {
    const query = q.trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      text: query,
      createdAt: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], pending: true }));

    const { phase, progress, frames, segments } = get();

    if (phase !== "ready") {
      const reply =
        phase === "idle"
          ? "Load a video first — then I can scan it and answer."
          : phase === "error"
            ? "The last scan failed. Try dropping the video again."
            : `Still scanning (${Math.round(progress)}%). I'll be able to answer once it finishes.`;
      set((s) => ({
        pending: false,
        messages: [
          ...s.messages,
          { id: uid(), role: "assistant", text: reply, createdAt: Date.now() },
        ],
      }));
      return;
    }

    if (frames.length === 0 && segments.length === 0) {
      set((s) => ({
        pending: false,
        messages: [
          ...s.messages,
          {
            id: uid(),
            role: "assistant",
            text: "This video came back empty — I couldn't read any frames or speech from it.",
            createdAt: Date.now(),
          },
        ],
      }));
      return;
    }

    try {
      const { runQuery } = await import("./search");
      const hits = await runQuery(query, frames, segments, get().textEngine, (d) =>
        set({ download: d }),
      );

      const speechHits = hits.filter((h) => h.channel === "speech");
      const visualHits = hits.filter((h) => h.channel === "visual");

      let reply: string;
      if (hits.length === 0) {
        reply = "No confident match for that one. Try different wording?";
      } else {
        const parts: string[] = [];
        if (speechHits.length > 0) {
          parts.push(
            `${speechHits.length} spoken moment${speechHits.length > 1 ? "s" : ""} matched what you asked`,
          );
        }
        if (visualHits.length > 0) {
          parts.push(
            `${visualHits.length} scene${visualHits.length > 1 ? "s" : ""} look${visualHits.length > 1 ? "" : "s"} like it`,
          );
        }
        reply = `Found ${hits.length} candidate${hits.length > 1 ? "s" : ""} — ${parts.join(", ")}. Click a timestamp to jump.`;
      }

      set((s) => ({
        pending: false,
        hits,
        messages: [
          ...s.messages,
          { id: uid(), role: "assistant", text: reply, hits, createdAt: Date.now() },
        ],
      }));
    } catch (err) {
      console.error(err);
      const gemmaBroke = get().textEngine === "gemma";
      if (gemmaBroke) set({ textEngine: "minilm" });
      set((s) => ({
        pending: false,
        messages: [
          ...s.messages,
          {
            id: uid(),
            role: "assistant",
            text: gemmaBroke
              ? "Gemma failed to run in this browser — I switched back to MiniLM, ask again."
              : "Search blew up — check the console for details.",
            createdAt: Date.now(),
          },
        ],
      }));
    }
  },

  jumpTo: (t, autoplay = true) =>
    set((s) => ({ seek: { t, nonce: (s.seek?.nonce ?? 0) + 1, autoplay } })),

  setTextEngine: (e) => {
    set({ textEngine: e });
    void get().reembed();
  },

  setWhisperSize: (w) => set({ whisperSize: w }),
}));
