"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Phase, TextEngine, WhisperSize } from "@/lib/types";

const PHASE_LABEL: Record<Phase, string> = {
  idle: "no video",
  "ready-to-scan": "queued",
  decoding: "reading audio",
  transcribing: "transcribing",
  sampling: "scanning frames",
  embedding: "embedding",
  ready: "ready",
  error: "error",
};

const PHASE_COLOR: Record<Phase, string> = {
  idle: "bg-panel-hi text-ash",
  "ready-to-scan": "bg-panel-hi text-bone",
  decoding: "bg-azure text-black",
  transcribing: "bg-azure text-black",
  sampling: "bg-grape text-white",
  embedding: "bg-grape text-white",
  ready: "bg-acid text-black",
  error: "bg-coral text-black",
};

export default function Header() {
  const phase = useStore((s) => s.phase);
  const videoName = useStore((s) => s.videoName);
  const gpu = useStore((s) => s.gpu);
  const textEngine = useStore((s) => s.textEngine);
  const whisperSize = useStore((s) => s.whisperSize);
  const setTextEngine = useStore((s) => s.setTextEngine);
  const setWhisperSize = useStore((s) => s.setWhisperSize);
  const clearVideo = useStore((s) => s.clearVideo);
  const analyze = useStore((s) => s.analyze);

  const [openSettings, setOpenSettings] = useState(false);

  return (
    <header className="relative z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b-2 border-bone bg-void px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/" className="flex items-center gap-2" title="Back to landing page">
          <span className="grid h-8 w-8 shrink-0 place-items-center border-2 border-bone bg-acid text-sm font-bold text-black shadow-[2px_2px_0_0_#000]">
            ▶
          </span>
          <span className="hidden font-display text-base font-bold uppercase sm:block">
            VidSeek
          </span>
        </Link>

        {videoName && (
          <span className="min-w-0 max-w-[38vw] truncate border-2 border-bone bg-panel px-2 py-1 font-mono text-[11px] sm:max-w-none">
            {videoName}
          </span>
        )}

        <span
          className={`hidden shrink-0 border-2 border-bone px-2 py-1 font-mono text-[10px] font-bold tracking-widest uppercase sm:block ${PHASE_COLOR[phase]}`}
        >
          {PHASE_LABEL[phase]}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden border-2 border-bone bg-void px-2 py-1 font-mono text-[10px] tracking-widest text-ash uppercase md:block">
          {gpu ? "webgpu" : "wasm"}
        </span>

        {videoName && (
          <button
            className="btn-brute !px-2.5 !py-1.5 text-[11px]"
            onClick={() => {
              clearVideo();
              setOpenSettings(false);
            }}
          >
            new video
          </button>
        )}

        <button
          className="btn-brute !px-2.5 !py-1.5 text-[11px]"
          aria-expanded={openSettings}
          onClick={() => setOpenSettings((v) => !v)}
        >
          settings
        </button>
      </div>

      {openSettings && (
        <div className="brute absolute top-[calc(100%+8px)] right-3 z-50 w-72 p-4 pop">
          <div className="mb-3 font-mono text-[10px] font-bold tracking-widest text-ash uppercase">
            models (all local)
          </div>

          <label className="mb-1 block font-mono text-[11px] uppercase">Text engine</label>
          <select
            className="mb-4 w-full border-2 border-bone bg-ink px-2 py-1.5 font-mono text-xs"
            value={textEngine}
            onChange={(e) => setTextEngine(e.target.value as TextEngine)}
          >
            <option value="minilm">MiniLM — fast, small download</option>
            <option value="gemma">EmbeddingGemma 2 — best quality, ~540 MB</option>
          </select>

          <label className="mb-1 block font-mono text-[11px] uppercase">Speech model</label>
          <select
            className="mb-4 w-full border-2 border-bone bg-ink px-2 py-1.5 font-mono text-xs"
            value={whisperSize}
            onChange={(e) => setWhisperSize(e.target.value as WhisperSize)}
          >
            <option value="tiny">whisper tiny.en — fastest</option>
            <option value="base">whisper base — multilingual</option>
          </select>

          <button
            className="btn-brute w-full !py-2 text-xs"
            onClick={() => {
              setOpenSettings(false);
              void analyze();
            }}
            disabled={phase === "transcribing" || phase === "sampling"}
          >
            rescan video
          </button>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-ash">
            engine swap re-embeds the transcript in place; speech model changes need a rescan.
          </p>
        </div>
      )}
    </header>
  );
}
