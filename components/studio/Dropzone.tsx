"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";

export default function Dropzone() {
  const loadFile = useStore((s) => s.loadFile);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("That doesn't look like a video file.");
      return;
    }
    loadFile(file);
  };

  return (
    <div
      className={`grid-bg flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center transition-colors ${
        dragging ? "bg-panel" : "bg-void"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files?.[0]);
      }}
    >
      <div
        className={`grid h-24 w-24 place-items-center border-2 border-bone text-4xl shadow-[5px_5px_0_0_#000] ${
          dragging ? "bg-acid text-black" : "bg-panel text-acid"
        }`}
      >
        ↓
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold uppercase sm:text-4xl">
          Drop a video
        </h2>
        <p className="mt-2 font-mono text-xs tracking-wider text-ash uppercase">
          mp4 · webm · mov — nothing gets uploaded
        </p>
      </div>

      <button className="btn-brute btn-acid text-base" onClick={() => inputRef.current?.click()}>
        choose a file
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />

      <p className="max-w-sm text-sm leading-relaxed text-ash">
        The file is read straight from your disk into this tab. Scanning runs on your GPU
        (WebGPU if available) and the models are cached after the first run.
      </p>
    </div>
  );
}
