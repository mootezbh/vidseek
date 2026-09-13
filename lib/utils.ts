/** Format seconds as m:ss or h:mm:ss. */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** L2-normalize a raw embedding row in place-ish (returns a new array). */
export function normalize(vec: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < vec.length; i++) sum += vec[i] * vec[i];
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) out[i] = vec[i] / norm;
  return out;
}

/** Dot product of two equal-length vectors. */
export function dot(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) sum += a[i] * b[i];
  return sum;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "is", "are",
  "was", "were", "be", "me", "my", "i", "you", "it", "that", "this", "with",
  "for", "when", "where", "who", "what", "how", "does", "do", "find", "show",
  "search", "look", "please", "tell", "going", "go", "someone", "somebody",
  "says", "say", "said", "he", "she", "they", "them", "his", "her", "there",
  "video", "moment", "part", "scene", "timestamp", "chapter", "timestamped",
]);

/** Pull content words out of a question for keyword boosting. */
export function keywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}
