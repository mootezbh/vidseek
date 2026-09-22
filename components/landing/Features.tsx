const FEATURES = [
  {
    n: "01",
    accent: "bg-acid",
    title: "Ask in plain english",
    body: "“find me where they argue about money.” you type something like that, it ranks every frame and every line of transcript, and you get back timestamps you can click.",
  },
  {
    n: "02",
    accent: "bg-azure",
    title: "It listens to the video",
    body: "Whisper transcribes the audio track with timestamps, so “where she says hello” gets you to the second she actually says it.",
  },
  {
    n: "03",
    accent: "bg-coral",
    title: "It watches the video",
    body: "CLIP grabs a frame every few seconds and turns it into a vector. questions like “a city at night” get matched against what's actually on screen.",
  },
  {
    n: "04",
    accent: "bg-grape",
    title: "Your GPU, not a server",
    body: "It runs on WebGPU when your browser supports it, WASM when it doesn't. the first scan downloads the models and the browser caches them after that.",
  },
  {
    n: "05",
    accent: "bg-acid",
    title: "Nothing ever uploads",
    body: "The file is read into the page and stays on your computer. there's no server sitting in the middle holding it, and closing the tab wipes everything.",
  },
  {
    n: "06",
    accent: "bg-azure",
    title: "No sign-up, no limits",
    body: "you don't make an account, nothing counts your scans, and there's no \"upgrade to pro\" popup popping up halfway through.",
  },
];

export default function Features() {
  return (
    <section id="features" className="border-b-2 border-bone">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="font-display text-3xl font-bold tracking-tight uppercase sm:text-5xl">
            What it does
          </h2>
          <span className="hidden font-mono text-xs tracking-widest text-ash uppercase sm:block">
            [ six things, zero servers ]
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.n}
              className="group brute relative p-5 transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span
                  className={`grid h-9 w-9 place-items-center border-2 border-bone ${f.accent} font-mono text-xs font-bold text-black shadow-[2px_2px_0_0_#000]`}
                >
                  {f.n}
                </span>
                <span className="h-2 w-2 bg-ash transition-colors group-hover:bg-acid" />
              </div>
              <h3 className="font-display text-lg font-bold tracking-tight uppercase">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ash">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
