const ITEMS = [
  "whisper asr",
  "clip visual search",
  "embeddinggemma 2",
  "webgpu",
  "zero uploads",
  "timestamp search",
  "runs in a tab",
  "free forever",
];

export default function Ticker() {
  const strip = (
    <span className="inline-flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <span key={item} className="inline-flex items-center">
          <span className="px-5 font-display text-sm font-bold tracking-widest uppercase">
            {item}
          </span>
          <span className="text-lg">★</span>
        </span>
      ))}
    </span>
  );

  return (
    <div className="overflow-hidden border-b-2 border-bone bg-acid py-2.5 text-black select-none">
      <div className="marquee-track">
        {strip}
        {strip}
      </div>
    </div>
  );
}
