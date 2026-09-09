import Link from "next/link";

/** Static mock of the studio, pure CSS, no client JS on the landing page. */
function StudioMock() {
  return (
    <div className="relative">
      {/* sticker */}
      <div className="absolute -top-4 -right-3 z-10 rotate-[-5deg] border-2 border-bone bg-grape px-3 py-1 font-mono text-[11px] font-bold tracking-widest text-white uppercase shadow-[3px_3px_0_0_#000]">
        WebGPU inside
      </div>

      <div className="brute overflow-hidden">
        {/* title bar */}
        <div className="flex items-center justify-between border-b-2 border-bone bg-panel-hi px-3 py-2 font-mono text-[11px] tracking-widest uppercase">
          <span>vidseek / studio</span>
          <span className="flex items-center gap-1.5 text-acid">
            <span className="inline-block h-2 w-2 bg-acid" />
            local
          </span>
        </div>

        {/* fake video frame */}
        <div className="dot-bg relative grid h-44 place-items-center border-b-2 border-bone bg-black">
          <svg viewBox="0 0 24 24" className="h-14 w-14 text-bone/70" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="6,4 20,12 6,20" />
          </svg>
          <span className="absolute top-3 left-3 border-2 border-bone bg-void px-2 py-0.5 font-mono text-[11px]">
            02:47
          </span>
          {/* scan line */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-acid/70" />
        </div>

        {/* timeline with markers */}
        <div className="relative h-12 border-b-2 border-bone bg-ink">
          <div className="absolute inset-x-2 top-1/2 h-1.5 -translate-y-1/2 bg-panel-hi">
            <div className="absolute top-1/2 left-[18%] h-3 w-1 -translate-y-1/2 bg-coral" />
            <div className="absolute top-1/2 left-[46%] h-3 w-1 -translate-y-1/2 bg-azure" />
            <div className="absolute top-1/2 left-[64%] h-3 w-1 -translate-y-1/2 bg-acid" />
            <div className="absolute top-1/2 left-[71%] h-3 w-1 -translate-y-1/2 bg-coral" />
          </div>
          <div className="absolute top-0 bottom-0 left-[46%] w-0.5 bg-bone" />
          <div className="absolute top-1 left-[46%] -translate-x-1/2 border-2 border-bone bg-acid px-1 font-mono text-[9px] font-bold text-black">
            2:47
          </div>
        </div>

        {/* chat */}
        <div className="space-y-3 p-3">
          <div className="ml-auto w-fit max-w-[85%] border-2 border-bone bg-panel-hi px-3 py-2 text-sm shadow-[3px_3px_0_0_#000]">
            where does she say the mission failed?
          </div>
          <div className="w-fit max-w-[95%] border-2 border-bone bg-void px-3 py-2 shadow-[3px_3px_0_0_#000]">
            <p className="mb-2 text-xs text-ash">1 match, click to jump.</p>
            <div className="flex items-center gap-2 border-2 border-bone bg-acid px-2 py-1.5 text-black">
              <span className="font-mono text-xs font-bold">▶ 02:47</span>
              <span className="border border-black px-1 font-mono text-[9px] font-bold tracking-wider uppercase">
                speech
              </span>
              <span className="truncate font-mono text-[11px]">“…the mission failed at 0400…”</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="grid-bg relative overflow-hidden border-b-2 border-bone">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-24">
        {/* copy */}
        <div>
          <div className="mb-6 flex flex-wrap gap-2 font-mono text-[11px] font-bold tracking-widest uppercase">
            <span className="border-2 border-bone bg-acid px-2 py-1 text-black">100% in-browser</span>
            <span className="border-2 border-bone bg-void px-2 py-1">no uploads</span>
            <span className="border-2 border-bone bg-void px-2 py-1">no API keys</span>
          </div>

          <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-tight uppercase sm:text-6xl lg:text-7xl">
            Search video
            <br />
            like it&apos;s{" "}
            <span className="text-acid [text-shadow:4px_4px_0_#000]">text</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ash sm:text-lg">
            Drop a video in and VidSeek scans it inside your own tab. It writes down
            everything that gets said, grabs a frame every few seconds, and builds an
            index out of it. Then you just ask it a question in the chat and click a
            timestamp to jump there.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/studio" className="btn-brute btn-acid text-base">
              Open the studio →
            </Link>
            <a href="#how" className="btn-brute text-base">
              See how it works
            </a>
          </div>

          <p className="mt-6 font-mono text-xs tracking-wider text-ash uppercase">
            ✓ your file never leaves this device
          </p>
        </div>

        <StudioMock />
      </div>
    </section>
  );
}
