"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import s from "./story.module.css";

// One note, three AIs, three real edits, as a pure function of time `t` (seconds, 0..END).
// t = 0 is a plain, finished note. Each beat: the AI's ask appears beside the note, then the edit
// happens in the note (a line writes itself in, or a box ticks), and the line keeps the AI's name.
// The end state is the note with all three edits, each credited. Nothing waits on anything empty.

export const END = 10.2;
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const minJerk = (v: number) => { const x = clamp(v); return x * x * x * (10 - 15 * x + 6 * x * x); };
const over = (v: number) => { const x = clamp(v); const c1 = 1.56, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const seg = (t: number, a: number, d: number) => clamp((t - a) / d);

type AI = "chatgpt" | "claude" | "claude-code";
const NAME: Record<AI, string> = { chatgpt: "ChatGPT", claude: "Claude", "claude-code": "Claude Code" };
const GLYPH: Record<AI, "openai" | "claude"> = { chatgpt: "openai", claude: "claude", "claude-code": "claude" };

/// The beats: when each starts, the ask, and what it does.
const BEATS: { who: AI; at: number; ask: string }[] = [
  { who: "chatgpt", at: 0.6, ask: "Add a day trip to Sintra to my Lisbon note" },
  { who: "claude", at: 3.8, ask: "I booked the hotel. Tick it off." },
  { who: "claude-code", at: 7.0, ask: "add LX Factory on Sunday to Lisbon" },
];
// Within a beat: ask arrives 0–0.45 s, the edit runs 0.7–1.6 s, the name lands 1.5–1.9 s, the ask leaves 2.6–2.95 s.

function Line({ text, typed, done, tick, who, credit, insert, id }: {
  text: string; typed?: number; done?: boolean; tick?: number; who?: AI; credit?: number; insert?: number; id?: string;
}) {
  const shown = typed === undefined ? text : text.slice(0, Math.round(text.length * typed));
  const h = insert === undefined ? undefined : `${(insert * 1.9).toFixed(3)}em`;
  const tint = credit ?? 0;
  return (
    <li data-line={id} className={s.line} style={{ height: h, opacity: insert === undefined ? 1 : clamp(insert * 1.6 - 0.3) }}>
      <span className={s.row} style={{ background: `rgba(240, 144, 26, ${(0.16 * tint).toFixed(3)})` }}>
        {done !== undefined && <span className={s.box} data-on={(tick ?? (done ? 1 : 0)) > 0.5 || undefined}
          style={{ transform: `scale(${tick !== undefined && tick > 0 && tick < 1 ? (0.8 + 0.2 * over(tick)).toFixed(3) : 1})` }}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - (tick ?? (done ? 1 : 0)) }} /></svg>
        </span>}
        {done === undefined && <span className={s.dash}>–</span>}
        <span className={s.text} data-done={done && (tick ?? 1) > 0.5 || undefined}>{shown}{typed !== undefined && typed > 0 && typed < 1 && <i className={s.caret} />}</span>
        {who && <span className={s.credit} style={{ opacity: credit, transform: `translateX(${((1 - (credit ?? 0)) * -6).toFixed(1)}px)` }}><AIGlyph name={GLYPH[who]} size={11} />{NAME[who]}</span>}
      </span>
    </li>
  );
}


/// The note at time `t`. Rendered twice: once at the end state, hidden, to hold the final size and
/// to place each ask beside its line; once live, on top, so nothing on the page shifts as lines arrive.
function Note({ t, only }: { t: number; only?: number }) {
  const tt = (i: number) => (only !== undefined && only !== i ? END : t);
  const b = BEATS.map((beat, i) => { const l = tt(i) - beat.at; return { edit: seg(l, 0.7, 0.9), credit: minJerk(seg(l, 1.5, 0.4)) }; });
  return (
    <figure className={s.note} aria-label="A note called Lisbon that ChatGPT, Claude and Codex each edit, every change labelled with the AI that made it">
        <div className={s.bar}><span className={s.lights}><i /><i /><i /></span><span className={s.folder}>Travel</span></div>
        <div className={s.paper}>
          <p className={s.date}>Today at 9:41</p>
          <h3 className={s.title}>Lisbon</h3>
          <p className={s.lede}>Four days of tiles, trams and pastries in May.</p>
          <h4 className={s.h}>Plan</h4>
          <ul className={s.list}>
            <Line text="Tram 28 early, before the crowds" done={false} />
            <Line text="Day trip to Sintra" done={false} typed={minJerk(b[0].edit)} insert={minJerk(seg(tt(0) - BEATS[0].at, 0.55, 0.3))} who="chatgpt" credit={b[0].credit} id="chatgpt" />
            <Line text="Book flights" done />
            <Line text="Hotel in Príncipe Real" done={false} tick={minJerk(seg(tt(1) - BEATS[1].at, 0.8, 0.5))} who="claude" credit={b[1].credit} id="claude" />
          </ul>
          <h4 className={s.h}>Places</h4>
          <ul className={s.list}>
            <Line text="Time Out Market" />
            <Line text="Miradouro da Senhora do Monte" />
            <Line text="LX Factory on Sunday" typed={minJerk(b[2].edit)} insert={minJerk(seg(tt(2) - BEATS[2].at, 0.55, 0.3))} who="claude-code" credit={b[2].credit} id="claude-code" />
          </ul>
        </div>
      </figure>
  );
}

export function Story({ t, only }: { t: number; only?: number }) {
  const scene = useRef<HTMLDivElement>(null);
  const [ys, setYs] = useState<Record<string, number>>({});
  useLayoutEffect(() => {
    const el = scene.current; if (!el) return;
    const top = el.getBoundingClientRect().top;
    const next: Record<string, number> = {};
    el.querySelectorAll<HTMLElement>(`.${s.sizer} [data-line]`).forEach((li) => { const r = li.getBoundingClientRect(); next[li.dataset.line!] = r.top - top + r.height / 2; });
    if (BEATS.some((x) => Math.abs((next[x.who] ?? 0) - (ys[x.who] ?? 0)) > 0.5)) setYs(next);
  });
  const b = BEATS.map((beat, i) => {
    const l = (only !== undefined && only !== i ? END : t) - beat.at;
    return { ask: minJerk(seg(l, 0, 0.45)) * (1 - minJerk(seg(l, 2.6, 0.35))), edit: seg(l, 0.7, 0.9), credit: minJerk(seg(l, 1.5, 0.4)) };
  });
  const active = b.findIndex((x) => x.ask > 0.01);
  return (
    <div ref={scene} className={s.scene}>
      <div className={s.sizer} aria-hidden="true"><Note t={END} /></div>
      <div className={s.live}><Note t={t} only={only} /></div>
      <div className={s.asks} aria-hidden="true">
        {BEATS.map((beat, i) => (
          <div key={beat.who} className={s.ask} data-who={beat.who}
            style={{ top: `${(ys[beat.who] ?? 200).toFixed(1)}px`, opacity: b[i].ask, transform: `translate(${((1 - b[i].ask) * 14).toFixed(1)}px, -50%)`, filter: `blur(${((1 - b[i].ask) * 3).toFixed(1)}px)`, visibility: i === active || b[i].ask > 0.01 ? "visible" : "hidden" }}>
            <span className={s.askWho}><AIGlyph name={GLYPH[beat.who]} size={14} />{NAME[beat.who]}</span>
            <p>{beat.ask}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/// Plays the story once, from a finished note to the note with three credited edits, when it is
/// half in view. `?t=` freezes it at a time for stills. Reduce Motion shows the end state.
export function Played() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("t");
    (window as unknown as { __setT?: (v: number) => void }).__setT = setT; // capture hook: frame-exact stills
    if (q !== null) { setT(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(END); return; }
    let raf = 0, start = 0;
    const tick = (now: number) => { if (!start) start = now; const v = (now - start) / 1000; setT(Math.min(END, v)); if (v < END) raf = requestAnimationFrame(tick); };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !start) { raf = requestAnimationFrame(tick); io.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref}><Story t={t} /></div>;
}

/// The same story scrubbed by scroll: pinned while you scroll through it.
export function Scrubbed() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(END); return; }
    let raf = 0;
    const read = () => { raf = 0; const el = ref.current; if (!el) return; const r = el.getBoundingClientRect(); const travel = r.height - innerHeight; setT(END * clamp(travel > 0 ? -r.top / travel : 0)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className={s.scrub}><div className={s.pin}><Story t={t} /></div></div>;
}

/// The same story, driven by you: three asks to tap, in order. Each plays its AI's edit into the note
/// and keeps it. The note starts complete; the next ask is always the highlighted one.
export function Tried() {
  const [t, setT] = useState(0);
  const [next, setNext] = useState(0);
  const raf = useRef(0);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  const play = (i: number) => {
    if (i !== next) return;
    const from = BEATS[i].at, to = BEATS[i].at + 2.95;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(to); setNext(i + 1); return; }
    let start = 0;
    const tick = (now: number) => { if (!start) start = now; const v = from + (now - start) / 1000; setT(Math.min(to, v)); if (v < to) raf.current = requestAnimationFrame(tick); else setNext(i + 1); };
    raf.current = requestAnimationFrame(tick);
  };
  const label = ["Add a day trip", "The hotel is booked", "Add Sunday"];
  return (
    <div className={s.tried}>
      <Story t={t} />
      <div className={s.tries}>
        {BEATS.map((b, i) => (
          <button key={b.who} type="button" className={s.try} data-state={i < next ? "done" : i === next ? "next" : "later"} disabled={i !== next} onClick={() => play(i)}>
            <AIGlyph name={GLYPH[b.who]} size={14} />{label[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

/// Plays once by itself when in view, then offers the same three asks to replay yourself: you see
/// what it does without doing anything, and you find out you can.
export function PlayedThenTry() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [mode, setMode] = useState<"auto" | "try">("auto");
  const [next, setNext] = useState(0);
  const [only, setOnly] = useState<number | undefined>(undefined);
  const raf = useRef(0);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("t");
    (window as unknown as { __setT?: (v: number) => void }).__setT = setT;
    if (q !== null) { setT(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setT(END); setMode("try"); setNext(3); return; }
    let start = 0;
    const tick = (now: number) => { if (!start) start = now; const v = (now - start) / 1000; setT(Math.min(END, v)); if (v < END) raf.current = requestAnimationFrame(tick); else { setMode("try"); setNext(3); } };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !start) { raf.current = requestAnimationFrame(tick); io.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => { io.disconnect(); cancelAnimationFrame(raf.current); };
  }, []);
  const play = (i: number) => {
    cancelAnimationFrame(raf.current);
    const from = BEATS[i].at - 0.05, to = BEATS[i].at + 2.95;
    // Replaying a beat: rewind to just before it, so its line arrives again.
    let start = 0;
    const tick = (now: number) => { if (!start) start = now; const v = from + (now - start) / 1000; setT(Math.min(to, v)); if (v < to) raf.current = requestAnimationFrame(tick); else { setT(END); setOnly(undefined); } };
    setOnly(i);
    raf.current = requestAnimationFrame(tick);
    setNext(i);
  };
  const label = ["Add a day trip", "The hotel is booked", "Add Sunday"];
  return (
    <div ref={ref} className={s.tried}>
      <Story t={t} only={only} />
      <div className={s.tries} data-shown={mode === "try" || undefined}>
        {BEATS.map((b, i) => (
          <button key={b.who} type="button" className={s.try} data-state={mode === "try" && i === next ? "next" : "done"} tabIndex={mode === "try" ? 0 : -1} onClick={() => play(i)}>
            <AIGlyph name={GLYPH[b.who]} size={14} />{label[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
