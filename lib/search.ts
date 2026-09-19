/**
 * Search: one question, two channels.
 *
 *  - visual  -> CLIP text tower vs. sampled frame embeddings
 *  - speech  -> text engine vs. transcript embeddings (+ keyword boost,
 *               so "where does he say hello" still lands even when the
 *               sentence embedding is meh)
 *
 * Scores from the two channels live on different scales, so each is mapped
 * into a rough 0..1 confidence before merging.
 */
import { embedClipText, embedText } from "./models";
import type { DownloadState, FrameEntry, Hit, SegmentEntry, TextEngine } from "./types";
import { clamp, dot, keywords, uid } from "./utils";

type ProgressFn = (d: DownloadState | null) => void;

const TOP_PER_CHANNEL = 8;
const MAX_HITS = 6;
const DEDUPE_WINDOW = 5; // seconds

function visualScore(cos: number): number {
  // CLIP text/image cosine usually sits between ~0.10 and ~0.40 for us
  return clamp((cos - 0.1) / 0.25, 0, 1);
}

/**
 * Cosine distributions differ a lot between the two text engines:
 *   minilm:  unrelated ~0.00-0.02, related ~0.48-0.64
 *   gemma:   unrelated ~0.56-0.61, related ~0.81-0.87  <- high baseline!
 * so each gets its own low/high mapping, otherwise gemma would score a
 * random sentence 0.75 and outrank an actual visual match.
 */
function speechScore(cos: number, engine: TextEngine): number {
  if (engine === "gemma") return clamp((cos - 0.55) / 0.33, 0, 1);
  return clamp((cos - 0.15) / 0.6, 0, 1);
}

export async function runQuery(
  query: string,
  frames: FrameEntry[],
  segments: SegmentEntry[],
  engine: "minilm" | "gemma",
  onDownload: ProgressFn,
): Promise<Hit[]> {
  const kws = keywords(query);
  const candidates: Hit[] = [];

  // ---- speech channel ------------------------------------------------
  if (segments.length > 0) {
    const [qVec] = await embedText([query], engine, onDownload, "query");
    const lower = kws.map((k) => k.toLowerCase());

    for (const seg of segments) {
      let score = speechScore(dot(qVec, seg.vec), engine);

      // exact-word hits: "where he says hello" shouldn't lose to a
      // paraphrase that doesn't contain the word at all
      const text = seg.text.toLowerCase();
      const hitsKw = lower.filter((k) => text.includes(k)).length;
      if (lower.length > 0) score = clamp(score + 0.4 * (hitsKw / lower.length), 0, 1);

      candidates.push({
        id: uid(),
        t: seg.start,
        score,
        channel: "speech",
        quote: seg.text.trim(),
      });
    }
    candidates.sort((a, b) => b.score - a.score);
  }

  const speechTop = candidates.slice(0, TOP_PER_CHANNEL);

  // ---- visual channel ------------------------------------------------
  let visualTop: Hit[] = [];
  if (frames.length > 0) {
    const [qVec] = await embedClipText([query], onDownload);
    visualTop = frames
      .map((f) => ({
        id: uid(),
        t: f.t,
        score: visualScore(dot(qVec, f.vec)),
        channel: "visual" as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_PER_CHANNEL);
  }

  // ---- merge + dedupe ------------------------------------------------
  const merged = [...speechTop, ...visualTop].sort((a, b) => b.score - a.score);
  const final: Hit[] = [];
  for (const hit of merged) {
    if (final.length >= MAX_HITS) break;
    if (final.some((f) => Math.abs(f.t - hit.t) < DEDUPE_WINDOW)) continue;
    final.push(hit);
  }
  return final;
}
