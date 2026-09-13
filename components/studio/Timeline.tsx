"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { clamp, formatTime } from "@/lib/utils";

/**
 * Scrub bar with the index drawn on it: transcript lines as ticks at the
 * bottom, search hits as numbered flags, playhead on top.
 */
export default function Timeline() {
  const duration = useStore((s) => s.duration);
  const currentTime = useStore((s) => s.currentTime);
  const segments = useStore((s) => s.segments);
  const frames = useStore((s) => s.frames);
  const hits = useStore((s) => s.hits);
  const jumpTo = useStore((s) => s.jumpTo);

  const barRef = useRef<HTMLDivElement>(null);
  const [dragT, setDragT] = useState<number | null>(null);

  const shown = dragT ?? currentTime;
  const pct = duration > 0 ? (shown / duration) * 100 : 0;

  const tAt = (clientX: number): number => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || duration <= 0) return 0;
    return clamp((clientX - rect.left) / rect.width, 0, 1) * duration;
  };

  return (
    <div className="shrink-0 border-t-2 border-bone bg-void px-3 py-3 select-none">
      <div
        ref={barRef}
        className="relative h-14 cursor-pointer border-2 border-bone bg-ink touch-none"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragT(tAt(e.clientX));
        }}
        onPointerMove={(e) => {
          if (dragT !== null) setDragT(tAt(e.clientX));
        }}
        onPointerUp={() => {
          if (dragT !== null) jumpTo(dragT, false);
          setDragT(null);
        }}
        onPointerCancel={() => setDragT(null)}
      >
        {/* transcript ticks */}
        <div className="absolute inset-x-0 bottom-0 h-4">
          {duration > 0 &&
            segments.slice(0, 600).map((seg, i) => (
              <span
                key={i}
                className="absolute bottom-1 h-2 w-px bg-azure/70"
                style={{ left: `${(seg.start / duration) * 100}%` }}
              />
            ))}
        </div>

        {/* frame ticks */}
        <div className="absolute inset-x-0 top-0 h-3">
          {duration > 0 &&
            frames.map((f) => (
              <span
                key={f.t}
                className="absolute top-1 h-1.5 w-px bg-bone/30"
                style={{ left: `${(f.t / duration) * 100}%` }}
              />
            ))}
        </div>

        {/* hits */}
        <div className="absolute inset-0">
          {duration > 0 &&
            hits.map((hit, i) => {
              const left = (hit.t / duration) * 100;
              return (
                <div
                  key={hit.id}
                  className="absolute top-0 bottom-0 z-10"
                  style={{ left: `${left}%` }}
                  title={`${formatTime(hit.t)} — ${hit.channel}`}
                >
                  <div
                    className={`h-full w-0.5 ${
                      hit.channel === "speech" ? "bg-acid" : "bg-coral"
                    }`}
                  />
                  <span
                    className={`absolute -top-0.5 left-1 border border-void px-1 font-mono text-[9px] font-bold text-black ${
                      hit.channel === "speech" ? "bg-acid" : "bg-coral"
                    }`}
                  >
                    {i + 1}
                  </span>
                </div>
              );
            })}
        </div>

        {/* playhead */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-bone"
          style={{ left: `${pct}%` }}
        >
          <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 border-2 border-bone bg-void px-1 font-mono text-[9px] font-bold tabular-nums">
            {formatTime(shown)}
          </span>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] tracking-wider text-ash uppercase">
        <span>0:00</span>
        <span className="hidden sm:block">
          {segments.length} speech lines · {hits.length} hits · drag to scrub
        </span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
