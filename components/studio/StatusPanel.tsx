"use client";

import { useStore } from "@/lib/store";

const PHASE_COPY: Record<string, string> = {
  decoding: "Reading audio track",
  transcribing: "Transcribing speech",
  sampling: "Watching frames",
  embedding: "Building the index",
};

export default function StatusPanel() {
  const phase = useStore((s) => s.phase);
  const progress = useStore((s) => s.progress);
  const statusText = useStore((s) => s.statusText);
  const download = useStore((s) => s.download);
  const error = useStore((s) => s.error);
  const frames = useStore((s) => s.frames);
  const segments = useStore((s) => s.segments);
  const speechAvailable = useStore((s) => s.speechAvailable);
  const analyze = useStore((s) => s.analyze);

  const scanning =
    phase === "decoding" ||
    phase === "transcribing" ||
    phase === "sampling" ||
    phase === "embedding";

  if (phase === "error") {
    return (
      <div className="shrink-0 border-t-2 border-bone bg-coral px-4 py-3 text-black">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-sm font-bold uppercase">scan failed</span>
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{error}</span>
          <button className="btn-brute !border-black !py-1.5 text-xs" onClick={() => void analyze()}>
            try again
          </button>
        </div>
      </div>
    );
  }

  if (scanning) {
    const title = PHASE_COPY[phase] ?? "Scanning";
    return (
      <div className="shrink-0 border-t-2 border-bone bg-ink px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-display text-sm font-bold uppercase">
            <span className="inline-block h-2.5 w-2.5 animate-pulse bg-acid" />
            {title}
          </span>
          <span className="font-mono text-xs tabular-nums text-ash">
            {Math.round(progress)}%
          </span>
        </div>

        {/* progress */}
        <div className="h-4 border-2 border-bone bg-void">
          <div
            className="h-full bg-acid transition-[width] duration-300"
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-ash">
          <span className="truncate">{statusText}</span>
          {download && (
            <span className="text-azure">
              ↓ {download.label} · {download.file} · {download.pct}%
            </span>
          )}
        </div>

        <p className="mt-1 font-mono text-[10px] tracking-wider text-ash uppercase">
          first run downloads the models — afterwards they&apos;re cached in your browser
        </p>
      </div>
    );
  }

  if (phase === "ready") {
    return (
      <div className="shrink-0 border-t-2 border-bone bg-ink px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] tracking-wider uppercase">
          <span className="border-2 border-bone bg-acid px-1.5 py-0.5 font-bold text-black">
            index ready
          </span>
          <span className="text-ash">{frames.length} frames</span>
          <span className="text-ash">
            {segments.length} speech lines{speechAvailable ? "" : " (none found)"}
          </span>
          <span className="ml-auto hidden text-ash sm:block">ask me anything →</span>
        </div>
      </div>
    );
  }

  return null;
}
