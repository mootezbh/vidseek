import Link from "next/link";

export default function CTA() {
  return (
    <section className="border-b-2 border-bone bg-acid text-black">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:py-20">
        <div>
          <h2 className="font-display text-4xl leading-none font-bold tracking-tight uppercase sm:text-6xl">
            Ready to find
            <br />
            things?
          </h2>
          <p className="mt-4 max-w-md font-mono text-sm leading-relaxed">
            Open the studio, drop a video in and see what it finds. it all runs on your
            machine, so nothing gets uploaded anywhere.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3">
          <Link
            href="/studio"
            className="btn-brute !border-black bg-void text-bone shadow-[6px_6px_0_0_#000] text-lg"
          >
            Open the studio →
          </Link>
          <span className="font-mono text-[11px] tracking-widest uppercase">
            no account needed
          </span>
        </div>
      </div>
    </section>
  );
}
