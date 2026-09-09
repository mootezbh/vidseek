import Link from "next/link";

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-bone bg-void">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border-2 border-bone bg-acid font-display text-lg font-bold text-black shadow-[3px_3px_0_0_#000]">
            ▶
          </span>
          <span className="font-display text-lg font-bold tracking-tight uppercase">
            VidSeek
          </span>
        </Link>

        <nav className="hidden items-center gap-7 font-mono text-xs tracking-widest uppercase md:flex">
          <a href="#features" className="hover:text-acid">
            Features
          </a>
          <a href="#how" className="hover:text-acid">
            How it works
          </a>
          <a href="#stack" className="hover:text-acid">
            Stack
          </a>
        </nav>

        <Link href="/studio" className="btn-brute btn-acid !px-4 !py-2 text-sm">
          Open studio →
        </Link>
      </div>
    </header>
  );
}
