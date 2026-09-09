import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-void">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <div className="font-display text-3xl font-bold tracking-tight uppercase">
              Vid<span className="text-acid">Seek</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ash">
              Search inside your own videos, right from the tab. i built this mostly to see
              how far browsers could go without needing a backend.
            </p>
          </div>

          <div>
            <div className="mb-3 font-mono text-[11px] tracking-widest text-ash uppercase">
              Navigate
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/studio" className="hover:text-acid">
                  Studio
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-acid">
                  Features
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-acid">
                  How it works
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-3 font-mono text-[11px] tracking-widest text-ash uppercase">
              Colophon
            </div>
            <ul className="space-y-2 text-sm text-ash">
              <li>Next.js · Tailwind · Zustand</li>
              <li>transformers.js + WebGPU</li>
              <li>Whisper · CLIP · Gemma</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t-2 border-bone pt-5 font-mono text-[11px] tracking-wider text-ash uppercase sm:flex-row sm:justify-between">
          <span>© 2026 VidSeek, a weekend project that got a bit out of hand</span>
          <span>made with next.js and too much coffee</span>
        </div>
      </div>
    </footer>
  );
}
