"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import f from "./film.module.css";

// "The week": one note, one week, every AI, as a pure function of progress p (0..1). Scroll scrubs it
// on desktop (pinned); on phones and with ?t= it plays on time. Every p is a finished frame.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const x = clamp(v); return x * x * x * (10 - 15 * x + 6 * x * x); };
const over = (v: number) => { const x = clamp(v); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const LINES = [
  { id: "mon", text: "Mon · 5 km easy" },
  { id: "wed", text: "Wed · Intervals, 6 × 400 m" },
  { id: "thu", text: "Thu · 5 km easy", moved: "Sun · 5 km easy" },
  { id: "sat", text: "Sat · Long run, 12 km" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CAPTIONS = [
  { at: [0, 0.27], day: 0, text: "Tell one AI." },
  { at: [0.27, 0.47], day: 2, text: "Every AI reads the same notebook." },
  { at: [0.47, 0.69], day: 4, text: "Plans don't die here." },
  { at: [0.69, 0.81], day: 6, text: "You stay in charge." },
  { at: [0.81, 1.01], day: 6, text: "The notebook you and your AI share." },
];

function Frame({ p }: { p: number }) {
  // Beat 1, Monday: ChatGPT in, four lines write, ChatGPT's mark lands.
  const gIn = 1, gOut = mj(span(p, 0.28, 0.33));
  const write = LINES.map((_, i) => span(p, 0.12 + i * 0.025, 0.12 + i * 0.025 + 0.035));
  const gMark = over(span(p, 0.22, 0.26));
  // Beat 2, Wednesday: Claude in, the thread from the Wednesday line, the answer.
  const cIn = mj(span(p, 0.3, 0.36)), cOut = mj(span(p, 0.7, 0.75));
  const thread = mj(span(p, 0.37, 0.42)) * (1 - mj(span(p, 0.46, 0.49)));
  const wedAnswer = mj(span(p, 0.41, 0.45));
  // Beat 3, Friday: a new ask, Mon and Wed tick, Thursday moves to Sunday, Claude's mark.
  const friAsk = mj(span(p, 0.48, 0.52));
  const tickMon = span(p, 0.53, 0.56), tickWed = span(p, 0.56, 0.59);
  const move = mj(span(p, 0.6, 0.66));
  const cMark = over(span(p, 0.65, 0.69));
  // Beat 4, Sunday: your cursor ticks the Sunday run.
  const cur = mj(span(p, 0.72, 0.77)), tickSun = span(p, 0.78, 0.8), curOut = mj(span(p, 0.8, 0.83));
  // Beat 5: pull out to the desk.
  const pull = mj(span(p, 0.83, 0.96));
  // The camera: the note leans away from whichever AI is talking, and pushes in a touch while it changes.
  const camX = 34 * gIn * (1 - gOut) - 34 * cIn * (1 - cOut);
  const busy = Math.max(Math.sin(Math.PI * span(p, 0.11, 0.26)), Math.sin(Math.PI * span(p, 0.52, 0.69)), Math.sin(Math.PI * span(p, 0.72, 0.81)));
  const camZ = 1 + 0.045 * busy;
  const cap = CAPTIONS.find((c) => p >= c.at[0] && p < c.at[1]) ?? CAPTIONS[CAPTIONS.length - 1];
  const capIdx = CAPTIONS.indexOf(cap);
  const capIn = capIdx === 0 ? 1 : mj(span(p, cap.at[0], cap.at[0] + 0.025));

  // Slots: Thursday (slot 2) and Saturday (slot 3) trade places as Thursday becomes Sunday.
  const slot = (i: number) => (i === 2 ? lerp(2, 3, move) : i === 3 ? lerp(3, 2, move) : i);
  const ticks = [tickMon, tickWed, tickSun, 0];
  const gFade = gMark * (1 - mj(span(p, 0.44, 0.5)));
  const tinted = (i: number) => (i === 2 ? Math.max(gFade, cMark) : gFade);

  return (
    <div className={f.stage}>
      <img className={f.desk} src="/home-d/desk.webp" alt="" style={{ opacity: pull, transform: `scale(${lerp(1.12, 1, pull).toFixed(3)})` }} />

      <ol className={f.days} aria-hidden="true">
        {DAYS.map((d, i) => <li key={d} data-on={i === cap.day || undefined} data-past={i < cap.day || undefined}>{d}</li>)}
      </ol>

      <p key={capIdx} className={f.caption} style={{ opacity: capIn }}>{cap.text}</p>

      <div className={f.noteWrap} style={{ transform: `translate(calc(-50% + ${camX.toFixed(1)}px), -50%) scale(${(camZ * lerp(1, 0.78, pull)).toFixed(3)}) rotate(${lerp(0, -2.5, pull).toFixed(2)}deg)` }}>
        <figure className={f.note}>
          <div className={f.bar}><span className={f.lights}><i /><i /><i /></span><span className={f.folder}>Health</span></div>
          <div className={f.paper}>
            <h3 className={f.title}>Running plan</h3>
            <p className={f.sub}>Half marathon on 30 November. Four runs a week.</p>
            <ul className={f.lines}>
              {LINES.map((l, i) => {
                const w = write[i];
                const text = l.moved && move > 0.5 ? l.moved : l.text;
                const shown = w >= 1 ? text : text.slice(0, Math.round(text.length * w));
                const t = ticks[i];
                const tint = tinted(i);
                return (
                  <li key={l.id} style={{ transform: `translateY(${(slot(i) * 50).toFixed(1)}px)`, opacity: w > 0 ? 1 : 0, zIndex: i === 2 ? 2 : 1 }}
                    data-lift={i === 2 && move > 0 && move < 1 || undefined}>
                    <span className={f.row} style={{ background: `rgba(240, 144, 26, ${(0.16 * tint).toFixed(3)})` }}>
                      <span className={f.box} data-on={t > 0.5 || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})` }}>
                        <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
                      </span>
                      <span className={f.text} data-done={t > 0.5 || undefined}>{shown}{w > 0 && w < 1 && <i className={f.caret} />}</span>
                      {i === 0 && <span className={f.by} style={{ opacity: gMark, transform: `scale(${(0.8 + 0.2 * gMark).toFixed(3)})` }}><AIGlyph name="openai" size={11} />ChatGPT<span className={f.long}> wrote these</span></span>}
                      {i === 2 && <span className={f.by} style={{ opacity: cMark, transform: `scale(${(0.8 + 0.2 * cMark).toFixed(3)})` }}><AIGlyph name="claude" size={11} />Claude<span className={f.long}> moved it from Thursday</span></span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </figure>
        <svg className={f.cursor} viewBox="0 0 24 24" aria-hidden="true"
          style={{ opacity: cur * (1 - curOut), transform: `translate(${lerp(300, 38, cur).toFixed(1)}px, ${lerp(420, 322, cur).toFixed(1)}px) scale(${tickSun > 0 && tickSun < 1 ? 0.88 : 1})` }}>
          <path d="M4 2l15 9-7 1.5L8.5 20z" />
        </svg>
      </div>

      {/* ChatGPT, Monday */}
      <figure className={`${f.chat} ${f.left}`} data-app="chatgpt" style={{ opacity: gIn * (1 - gOut), transform: `translate(${lerp(-60, 0, gIn) - 60 * gOut}px, -50%)` }}>
        <div className={f.chatTop}><span><AIGlyph name="openai" size={14} />ChatGPT</span><em>Monday</em></div>
        <p className={f.me}>I'm running a half marathon on 30 November. Plan four runs a week in my notes.</p>
        <p className={f.tool}>Used Pinto Notes</p>
        <p className={f.ai} style={{ opacity: mj(span(p, 0.2, 0.24)) }}>Done. It's in Running plan.</p>
      </figure>

      {/* Claude, Wednesday then Friday */}
      <figure className={`${f.chat} ${f.right}`} data-app="claude" style={{ opacity: cIn * (1 - cOut), transform: `translate(${lerp(60, 0, cIn) + 60 * cOut}px, -50%)` }}>
        <div className={f.chatTop}><span><AIGlyph name="claude" size={14} />Claude</span><em>{friAsk > 0.5 ? "Friday" : "Wednesday"}</em></div>
        <div className={f.swap}>
          <div style={{ opacity: 1 - friAsk }}>
            <p className={f.me}>What should I run today?</p>
            <p className={f.tool}>Used Pinto Notes · Running plan</p>
            <p className={f.ai} style={{ opacity: wedAnswer }}>Intervals: 6 × 400 m, with a slow lap between each.</p>
          </div>
          <div style={{ opacity: friAsk }}>
            <p className={f.me}>How did my week go?</p>
            <p className={f.tool}>Used Pinto Notes · Running plan</p>
            <p className={f.ai} style={{ opacity: mj(span(p, 0.62, 0.67)) }}>Two of four done. I moved Thursday's run to Sunday, so you're still on track.</p>
          </div>
        </div>
      </figure>

      <svg className={f.thread} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 62 47 C 70 47, 70 45, 74 45" pathLength={1} style={{ strokeDashoffset: 1 - thread, opacity: thread > 0 ? 1 : 0 }} />
      </svg>
    </div>
  );
}

/// Pinned and scrubbed by scroll on wide screens; played on time on phones, with Reduce Motion
/// showing the last frame. `?t=0..1` freezes progress for review.
export function Film() {
  const box = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [pinned, setPinned] = useState(true);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("p");
    let frozen = false;
    (window as unknown as { __setP?: (v: number) => void }).__setP = (v) => { frozen = true; setP(v); };
    if (q !== null) { setP(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setPinned(false); setP(1); return; }
    const narrow = matchMedia("(max-width: 900px)");
    let raf = 0;
    if (narrow.matches) {
      setPinned(false);
      let start = 0;
      const tick = (now: number) => { if (frozen) return; if (!start) start = now; const v = (now - start) / 16000; setP(Math.min(1, v)); if (v < 1) raf = requestAnimationFrame(tick); };
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !start) { raf = requestAnimationFrame(tick); io.disconnect(); } }, { threshold: 0.4 });
      if (box.current) io.observe(box.current);
      return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }
    const read = () => { raf = 0; if (frozen) return; const el = box.current; if (!el) return; const r = el.getBoundingClientRect(); const travel = r.height - innerHeight; setP(clamp(travel > 0 ? -r.top / travel : 0)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={box} className={f.film} data-pinned={pinned || undefined}>
      <div className={f.pin}><Frame p={p} /></div>
    </div>
  );
}
