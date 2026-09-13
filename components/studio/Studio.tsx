"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { gpuAvailable } from "@/lib/models";
import ChatPanel from "./ChatPanel";
import Dropzone from "./Dropzone";
import Header from "./Header";
import Player from "./Player";
import StatusPanel from "./StatusPanel";
import Timeline from "./Timeline";

export default function Studio() {
  const file = useStore((s) => s.file);
  const videoUrl = useStore((s) => s.videoUrl);
  const setGpu = useStore((s) => s.setGpu);

  useEffect(() => {
    setGpu(gpuAvailable());
  }, [setGpu]);

  return (
    <div className="flex flex-col lg:h-dvh lg:overflow-hidden">
      <Header />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section className="flex min-h-0 flex-1 flex-col">
          {file && videoUrl ? (
            <>
              <Player />
              <StatusPanel />
              <Timeline />
            </>
          ) : (
            <Dropzone />
          )}
        </section>

        <ChatPanel />
      </main>
    </div>
  );
}
