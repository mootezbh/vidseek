const STACK = [
  "Next.js 16",
  "TypeScript",
  "Tailwind v4",
  "Zustand",
  "transformers.js",
  "Whisper",
  "CLIP",
  "EmbeddingGemma 2",
  "WebGPU",
];

export default function TechBand() {
  return (
    <section id="stack" className="border-b-2 border-bone bg-ink">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-3 w-3 bg-coral" />
          <h2 className="font-mono text-xs font-bold tracking-widest uppercase">
            Under the hood
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {STACK.map((tech, i) => (
            <span
              key={tech}
              className={`border-2 border-bone px-3 py-1.5 font-mono text-xs tracking-wider uppercase ${
                i % 4 === 0
                  ? "bg-acid text-black"
                  : i % 4 === 2
                    ? "bg-panel-hi text-bone"
                    : "bg-void text-bone"
              }`}
            >
              {tech}
            </span>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ash">
          no api keys and no database anywhere. the index just lives in memory while the tab
          is open, so closing it wipes everything.
        </p>
      </div>
    </section>
  );
}
