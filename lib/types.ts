export type Phase =
  | "idle" // no file loaded
  | "ready-to-scan" // file loaded, scan not started yet
  | "decoding" // extracting audio from the container
  | "transcribing" // whisper is running
  | "sampling" // pulling frames + CLIP embeddings
  | "embedding" // embedding transcript lines
  | "ready" // index built, chat is live
  | "error";

export type TextEngine = "minilm" | "gemma";
export type WhisperSize = "tiny" | "base";

/** A sampled video frame + its CLIP image embedding. */
export interface FrameEntry {
  t: number;
  vec: Float32Array; // L2-normalized, dim 512
}

/** One line of the whisper transcript + its text embedding. */
export interface SegmentEntry {
  start: number;
  end: number;
  text: string;
  vec: Float32Array; // L2-normalized
}

export type HitChannel = "speech" | "visual";

/** A search result the user can click to jump to. */
export interface Hit {
  id: string;
  t: number;
  score: number; // 0..1 confidence-ish
  channel: HitChannel;
  quote?: string; // transcript excerpt (speech hits)
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  hits?: Hit[];
  createdAt: number;
}

/** Progress of a single model file download. */
export interface DownloadState {
  label: string;
  file: string;
  pct: number;
}
