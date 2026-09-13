"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import type { ChatMessage, Hit } from "@/lib/types";
import { formatTime } from "@/lib/utils";

const QUICK_PROMPTS = [
  "where do they mention the plan?",
  "find a shot of a city at night",
  "when does someone say hello?",
];

function HitCard({ hit, index }: { hit: Hit; index: number }) {
  const jumpTo = useStore((s) => s.jumpTo);
  const speech = hit.channel === "speech";

  return (
    <button
      onClick={() => jumpTo(hit.t, true)}
      className={`group flex w-full items-center gap-2 border-2 border-bone px-2 py-1.5 text-left transition-transform active:translate-x-0.5 active:translate-y-0.5 ${
        speech ? "bg-acid text-black" : "bg-coral text-black"
      }`}
      title="Jump to this timestamp"
    >
      <span className="shrink-0 font-mono text-xs font-bold tabular-nums group-hover:underline">
        ▶ {formatTime(hit.t)}
      </span>
      <span className="shrink-0 border border-black px-1 font-mono text-[9px] font-bold tracking-wider uppercase">
        {speech ? "speech" : "scene"}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-[11px]">
        {hit.quote ? `“${hit.quote}”` : "visual match"}
      </span>
      <span className="shrink-0 font-mono text-[10px] font-bold">{index + 1}</span>
    </button>
  );
}

function Message({ msg }: { msg: ChatMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end pop">
        <div className="max-w-[85%] border-2 border-bone bg-panel-hi px-3 py-2 text-sm shadow-[3px_3px_0_0_#000]">
          {msg.text}
        </div>
      </div>
    );
  }

  return (
    <div className="pop max-w-[95%] border-2 border-bone bg-void px-3 py-2 shadow-[3px_3px_0_0_#000]">
      <p className="text-sm leading-relaxed text-ash">{msg.text}</p>
      {msg.hits && msg.hits.length > 0 && (
        <div className="mt-2.5 space-y-1.5">
          {msg.hits.map((hit, i) => (
            <HitCard key={hit.id} hit={hit} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPanel() {
  const messages = useStore((s) => s.messages);
  const pending = useStore((s) => s.pending);
  const phase = useStore((s) => s.phase);
  const ask = useStore((s) => s.ask);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const submit = (text: string) => {
    const q = text.trim();
    if (!q || pending) return;
    setInput("");
    void ask(q);
  };

  const ready = phase === "ready";

  return (
    <aside className="flex h-[65vh] shrink-0 flex-col border-t-2 border-bone bg-ink lg:h-auto lg:min-h-0 lg:w-[400px] lg:border-t-0 lg:border-l-2">
      <div className="flex h-11 shrink-0 items-center justify-between border-b-2 border-bone bg-void px-3">
        <span className="font-mono text-[11px] font-bold tracking-widest uppercase">chat</span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-ash uppercase">
          <span className={`inline-block h-2 w-2 ${ready ? "bg-acid" : "bg-ash"}`} />
          {ready ? "indexed" : phase === "idle" ? "waiting" : "scanning"}
        </span>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m) => (
          <Message key={m.id} msg={m} />
        ))}

        {pending && (
          <div className="w-fit border-2 border-bone bg-void px-3 py-2 shadow-[3px_3px_0_0_#000]">
            <span className="caret font-mono text-sm text-ash">searching the index</span>
          </div>
        )}
      </div>

      {ready && messages.length <= 2 && (
        <div className="shrink-0 px-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="border border-ash/60 px-2 py-1 font-mono text-[10px] text-ash transition-colors hover:border-bone hover:text-bone"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="flex shrink-0 gap-2 border-t-2 border-bone bg-void p-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={ready ? "find me where someone says…" : "load & scan a video first…"}
          className="min-w-0 flex-1 border-2 border-bone bg-ink px-3 py-2 font-mono text-sm outline-none placeholder:text-ash/70 focus:border-acid"
        />
        <button type="submit" className="btn-brute btn-acid !px-3 !py-2 text-xs" disabled={pending}>
          send
        </button>
      </form>
    </aside>
  );
}
