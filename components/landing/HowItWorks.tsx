const STEPS = [
  {
    n: "01",
    title: "Drop a video",
    body: "MP4, WebM, MOV all work. pick a file or drag it in, it's read from your disk straight into the tab.",
  },
  {
    n: "02",
    title: "Let it scan",
    body: "Whisper works on the audio while CLIP checks the frames. first run downloads the models (around 100 mb) and after that they're cached.",
  },
  {
    n: "03",
    title: "Ask, then jump",
    body: "ask a question, get a few hits back with timestamps and the quote it matched. click one and the player jumps there.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="dot-bg border-b-2 border-bone">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <h2 className="mb-10 font-display text-3xl font-bold tracking-tight uppercase sm:text-5xl">
          How it works
        </h2>

        <div className="grid gap-6 lg:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              <div className="mb-4 flex items-center gap-4">
                <span className="outline-text font-display text-6xl font-bold select-none">
                  {s.n}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="hidden flex-1 border-t-2 border-dashed border-bone/40 lg:block" />
                )}
              </div>
              <div className="brute p-5">
                <h3 className="font-display text-xl font-bold uppercase">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
