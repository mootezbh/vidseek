"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { formatTime } from "@/lib/utils";

export default function Player() {
  const videoUrl = useStore((s) => s.videoUrl);
  const duration = useStore((s) => s.duration);
  const currentTime = useStore((s) => s.currentTime);
  const isPlaying = useStore((s) => s.isPlaying);
  const seek = useStore((s) => s.seek);
  const setDuration = useStore((s) => s.setDuration);
  const setTime = useStore((s) => s.setTime);
  const setPlaying = useStore((s) => s.setPlaying);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);

  // jump requests from chat hits / timeline clicks
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !seek) return;
    v.currentTime = seek.t;
    setTime(seek.t);
    if (seek.autoplay) void v.play().catch(() => {});
  }, [seek, setTime]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  };

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  return (
    <div ref={wrapRef} className="flex min-h-0 flex-col bg-black">
      <div className="relative min-h-0 flex-1 bg-black">
        <video
          ref={videoRef}
          src={videoUrl ?? undefined}
          className="h-full max-h-[52vh] w-full object-contain lg:max-h-none"
          playsInline
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => {
            const t = e.currentTarget.currentTime;
            if (Math.abs(t - useStore.getState().currentTime) > 0.2) setTime(t);
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={toggle}
        />
      </div>

      {/* controls */}
      <div className="flex items-center gap-3 border-t-2 border-bone bg-ink px-3 py-2">
        <button
          onClick={toggle}
          className="btn-brute btn-acid !px-3 !py-1.5 text-xs"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "❚❚" : "▶"}
        </button>

        <span className="font-mono text-xs tabular-nums">
          {formatTime(currentTime)} <span className="text-ash">/ {formatTime(duration)}</span>
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="btn-brute !px-2.5 !py-1.5 text-[11px]"
            onClick={() => {
              const v = videoRef.current;
              if (!v) return;
              v.muted = !v.muted;
              setMuted(v.muted);
            }}
          >
            {muted ? "unmute" : "mute"}
          </button>
          <button className="btn-brute !px-2.5 !py-1.5 text-[11px]" onClick={toggleFullscreen}>
            fullscreen
          </button>
        </div>
      </div>
    </div>
  );
}
