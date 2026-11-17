"use client";

import { useEffect, useRef, useState } from "react";
import st from "./stats.module.css";

// Round 29 (Emil: "stats that make you feel there's an objective reason"; VoiceOS's rising bars, Wispr's
// "4x faster"). The one number we measured: the memory study (/blog/ai-memory-with-notes). Claude Haiku
// 5.5 on LoCoMo, 1,540 questions about months of past chats, asked in a new chat. Saved facts is the
// study's simulation, not ChatGPT's or Claude's memory, and the small print says so.

const BARS = [
  { name: "No notes", v: 18.0 },
  { name: "Saved facts", v: 60.2 },
  { name: "One notebook", v: 71.9 },
  { name: "Pinto Notes", v: 82.5, us: true },
];

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("t")) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section className={st.stats} aria-labelledby="stats-h">
      <div className={st.head}>
        <h2 id="stats-h" className={st.title}>4.6&times; more right<br />in a new chat.</h2>
        <p className={st.say}>We asked an AI 1,540 questions about months of past chats, each in a new chat. With no notes it got 18% right. With Pinto Notes, 82.5%.</p>
      </div>
      <div ref={ref} className={st.chart} data-on={on || undefined} role="img"
        aria-label="Share of questions answered right in a new chat: no notes 18%, saved facts 60.2%, one notebook 71.9%, Pinto Notes 82.5%.">
        {BARS.map((b, i) => (
          <div key={b.name} className={st.col} data-us={b.us || undefined} style={{ "--v": b.v / 100, "--i": i } as React.CSSProperties} title={`${b.name}: ${b.v}% right`}>
            <span className={st.num}>{b.v % 1 ? b.v.toFixed(1) : b.v}%</span>
            <span className={st.bar} />
            <span className={st.name}>{b.name}</span>
          </div>
        ))}
      </div>
      <p className={st.fine}>Claude Haiku 5.5 on LoCoMo, a public benchmark for memory in chat. Saved facts is our stand-in for a memory list, not ChatGPT&apos;s or Claude&apos;s. <a href="/blog/ai-memory-with-notes">Read the study</a></p>
    </section>
  );
}
