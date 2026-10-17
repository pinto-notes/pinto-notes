"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import f from "./film.module.css";

// "The week": one note, one week, two AIs and you, as a pure function of progress p (0..1). Scroll
// scrubs it on wide screens (pinned); on phones it plays on time once it's in view. `?p=` freezes it.
//
// Monday, ChatGPT writes the plan into a new note. Wednesday, your knee is sore: Claude changes the
// plan in the same note. Friday, ChatGPT reads the week, Claude's change included. Sunday, you tick
// the long run yourself.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const x = clamp(v); return x * x * x * (10 - 15 * x + 6 * x * x); };
const over = (v: number) => { const x = clamp(v); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const typed = (s: string, k: number) => s.slice(0, Math.round(s.length * clamp(k)));
const rise = (v: number, px = 10): React.CSSProperties => ({ opacity: v, transform: `translateY(${((1 - v) * px).toFixed(1)}px)` });

type Who = "chatgpt" | "claude";
const WHO = { chatgpt: { name: "ChatGPT", glyph: "openai" as const, ink: "#10a37f" }, claude: { name: "Claude", glyph: "claude" as const, ink: "#d97757" } };

const CAPTIONS = [
  { at: 0, day: 0, text: "Plan it with ChatGPT." },
  { at: 0.31, day: 2, text: "Claude works in the same note." },
  { at: 0.58, day: 4, text: "Ask how your week went." },
  { at: 0.8, day: 6, text: "You tick the rest." },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/// An AI's caret while it writes in the note: its own colour and a name flag, like a collaborator.
const Caret = ({ who }: { who: Who }) => (
  <i className={f.aiCaret} style={{ background: WHO[who].ink }} aria-hidden="true">
    <em style={{ background: WHO[who].ink }}><AIGlyph name={WHO[who].glyph} size={9} color="#fff" />{WHO[who].name}</em>
  </i>
);

/// Your line in a chat: a dark bubble that types out, growing leftward from its tail.
const Me = ({ text, k }: { text: string; k: number }) => (
  <p className={f.me} style={rise(mj(k * 6), 8)}>{typed(text, k)}</p>
);

/// The AI's answer: first what it's doing ("Writing in Pinto Notes…"), then the answer in its place.
function Ai({ who, busy, answer, a, b }: { who: Who; busy: string; answer: string; a: number; b: number }) {
  const label = <span className={f.who}><AIGlyph name={WHO[who].glyph} size={12} color={who === "claude" ? WHO.claude.ink : undefined} />{WHO[who].name}</span>;
  return (
    <div className={f.aiSlot}>
      {b < 1 && <p className={f.ai} style={{ ...rise(mj(a), 8), opacity: mj(a) * (1 - mj(b * 2)) }}>{label}<span className={f.busy}>{busy}<span className={f.dots}><i /><i /><i /></span></span></p>}
      {b > 0 && <p className={f.ai} style={rise(mj(b), 8)}>{label}{answer}</p>}
    </div>
  );
}

/// Retype the end of a line after its first `keep` characters: delete, then type the new words.
function retype(from: string, to: string, keep: number, e: number) {
  if (e <= 0) return { head: from, tail: "", editing: false };
  if (e >= 1) return { head: to, tail: "", editing: false };
  const a = from.slice(keep), b = to.slice(keep), k = from.slice(0, keep);
  const head = e < 0.45 ? k + a.slice(0, Math.round(a.length * (1 - e / 0.45))) : e < 0.55 ? k : k + b.slice(0, Math.round(b.length * ((e - 0.55) / 0.45)));
  return { head, tail: "", editing: true };
}
/// Retype only the day at the front ("Sat" to "Sun"); the rest of the line stays put after the caret.
function retypeDay(line: string, to: string, e: number) {
  const day = line.slice(0, 3), rest = line.slice(3);
  if (e <= 0) return { head: day, tail: rest, editing: false };
  if (e >= 1) return { head: to, tail: rest, editing: false };
  const head = e < 0.45 ? day.slice(0, Math.round(3 * (1 - e / 0.45))) : e < 0.55 ? "" : to.slice(0, Math.round(3 * ((e - 0.55) / 0.45)));
  return { head, tail: rest, editing: true };
}

function Frame({ p }: { p: number }) {
  // Monday (ChatGPT, left): you ask, it says it's writing, the note fills in, then it says it's done.
  const m1 = span(p, 0.02, 0.075);
  const gBusy = span(p, 0.08, 0.095);
  const tTitle = span(p, 0.1, 0.122), tSub = mj(span(p, 0.122, 0.132));
  const write = [0, 1, 2, 3].map((i) => span(p, 0.135 + i * 0.024, 0.135 + i * 0.024 + 0.03));
  const gMark = over(span(p, 0.235, 0.255));
  const gDone = span(p, 0.245, 0.262);
  const gChat = 1 - mj(span(p, 0.3, 0.33));
  // Wednesday (Claude, right): Monday and Wednesday are ticked; your knee is sore; Claude changes the plan.
  const tickMon = span(p, 0.315, 0.33), tickWed = span(p, 0.332, 0.347);
  const cIn = mj(span(p, 0.34, 0.37)), cOut = mj(span(p, 0.56, 0.59));
  const m2 = span(p, 0.355, 0.4);
  const cBusy = span(p, 0.405, 0.418);
  const eThu = span(p, 0.425, 0.465), eSat = span(p, 0.47, 0.495);
  const cMark = over(span(p, 0.495, 0.515));
  const cDone = span(p, 0.505, 0.522);
  // Friday (ChatGPT, left): you did the ride; you ask how the week went; it reads the note, Claude's change and all.
  const tickThu = span(p, 0.585, 0.6);
  const fIn = mj(span(p, 0.59, 0.615)), fOut = mj(span(p, 0.78, 0.805));
  const m3 = span(p, 0.6, 0.625);
  const fBusy = span(p, 0.63, 0.64);
  const scan = span(p, 0.645, 0.7);
  const fDone = span(p, 0.7, 0.717);
  // Sunday (you): your pointer comes in and ticks the long run.
  const cur = mj(span(p, 0.82, 0.88)), press = span(p, 0.885, 0.9), tickSun = span(p, 0.895, 0.915), curOut = mj(span(p, 0.95, 0.99));
  const youMark = over(span(p, 0.915, 0.94));

  const capIdx = CAPTIONS.reduce((n, c, i) => (p >= c.at ? i : n), 0);
  const cap = CAPTIONS[capIdx];

  const lines = [
    { id: "mon", head: "Mon · 5 km easy", tail: "", editing: false, tick: tickMon },
    { id: "wed", head: "Wed · Intervals, 6 × 400 m", tail: "", editing: false, tick: tickWed },
    { id: "thu", ...retype("Thu · 5 km easy", "Thu · Bike, 30 min easy", 6, eThu), tick: tickThu },
    { id: "sun", ...retypeDay("Sat · Long run, 12 km", "Sun", eSat), tick: tickSun },
  ];
  const gFade = gMark * (1 - mj(span(p, 0.3, 0.34)));
  const cFade = cMark * (1 - mj(span(p, 0.6, 0.64)));
  // While ChatGPT reads on Friday, a light passes down the lines it reads.
  const lit = (i: number) => (scan > 0 && scan < 1 ? Math.max(0, 1 - Math.abs(scan * 5 - i - 0.5) / 0.9) : 0);

  return (
    <div className={f.stage}>
      <div className={f.canvas}>
      <div className={f.layer}>
      <ol className={f.days} aria-hidden="true">
        {DAYS.map((d, i) => <li key={d} data-on={i === cap.day || undefined} data-past={i < cap.day || undefined}>{d}</li>)}
      </ol>

      <p className={f.caption}><span key={capIdx} className={f.capText}>{cap.text}</span></p>
      </div>

      <div className={f.noteWrap}>
        <figure className={f.note}>
          <div className={f.bar}><span className={f.lights}><i /><i /><i /></span><span className={f.folder}>Health</span></div>
          <div className={f.paper}>
            <p className={f.title}>{tTitle <= 0 ? <span className={f.placeholder}>New note</span> : <>{typed("Running plan", tTitle)}{tTitle < 1 && <Caret who="chatgpt" />}</>}</p>
            <p className={f.sub} style={{ opacity: tSub }}>Half marathon on 30 November. Four runs a week.</p>
            <ul className={f.lines}>
              {lines.map((l, i) => {
                const w = write[i];
                const done = l.tick > 0.5;
                const tint = i < 2 ? gFade : Math.max(gFade, cFade);
                return (
                  <li key={l.id}>
                    {w < 1 && <span className={f.ghost} style={{ opacity: (1 - clamp(w * 2.5)) * tSub, width: `${[52, 66, 48, 58][i]}%` }} aria-hidden="true" />}
                    <span className={f.row} style={{ opacity: w > 0 ? 1 : 0, background: `rgba(240, 144, 26, ${(0.16 * tint + 0.14 * lit(i)).toFixed(3)})` }}>
                      <span className={f.box} data-on={done || undefined} style={{ transform: `scale(${l.tick > 0 && l.tick < 1 ? (0.85 + 0.15 * over(l.tick)).toFixed(3) : 1})` }}>
                        <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(l.tick * 1.4) }} /></svg>
                        {i === 3 && tickSun > 0 && tickSun < 1 && <span className={f.burst} style={{ opacity: 1 - tickSun, transform: `scale(${(0.6 + tickSun * 1.4).toFixed(3)})` }} aria-hidden="true" />}
                        {i === 3 && (
                          // Your pointer: its tip on the box, with your name, as the AIs have theirs.
                          <span className={f.you} style={{ opacity: cur * (1 - curOut), transform: `translate(${((1 - cur) * 160).toFixed(1)}px, ${((1 - cur) * 100).toFixed(1)}px) scale(${press > 0 && press < 1 ? 0.86 : 1})` }} aria-hidden="true">
                            <svg viewBox="0 0 24 24"><path d="M4 2l15 9-7 1.5L8.5 20z" /></svg><em>You</em>
                          </span>
                        )}
                      </span>
                      <span className={f.text} data-done={done || undefined}>
                        {w < 1 ? typed(l.head, w) : l.head}{w > 0 && w < 1 && <Caret who="chatgpt" />}{l.editing && <Caret who="claude" />}{w >= 1 && l.tail}
                      </span>
                      {i === 0 && <span className={f.by} style={{ opacity: gMark, transform: `scale(${(0.8 + 0.2 * gMark).toFixed(3)})` }}><AIGlyph name="openai" size={11} />ChatGPT<span className={f.long}> wrote these</span></span>}
                      {i === 2 && <span className={f.by} style={{ opacity: cMark, transform: `scale(${(0.8 + 0.2 * cMark).toFixed(3)})` }}><AIGlyph name="claude" size={11} />Claude<span className={f.long}> changed it</span></span>}
                      {i === 3 && <span className={f.by} data-you="" style={{ opacity: youMark, transform: `scale(${(0.8 + 0.2 * youMark).toFixed(3)})` }}>You<span className={f.long}> ticked it</span></span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </figure>
      </div>

      <div className={f.layer}>
      {/* Monday and Friday: ChatGPT, on the left. */}
      <div className={`${f.chat} ${f.left}`} style={{ opacity: m1 > 0 ? gChat : 0 }}>
        <Me text="I'm running a half marathon on 30 November. Plan four runs a week in my notes." k={m1} />
        <Ai who="chatgpt" busy="Writing in Pinto Notes" answer="Done. It's in Running plan: four runs a week, building to 12 km." a={gBusy} b={gDone} />
      </div>
      <div className={`${f.chat} ${f.left}`} style={{ opacity: fIn * (1 - fOut), transform: `translateX(${((1 - fIn) * -40 - fOut * 40).toFixed(1)}px)` }}>
        <Me text="How did my week go?" k={m3} />
        <Ai who="chatgpt" busy="Reading Running plan" answer="Two runs and a ride. Claude moved your long run to Sunday for the knee, so you're on track." a={fBusy} b={fDone} />
      </div>

      {/* Wednesday: Claude, on the right. */}
      <div className={`${f.chat} ${f.right}`} style={{ opacity: cIn * (1 - cOut), transform: `translateX(${((1 - cIn) * 40 + cOut * 40).toFixed(1)}px)` }}>
        <Me text="My knee's sore after the intervals." k={m2} />
        <Ai who="claude" busy="Changing Running plan" answer="Go easy. Thursday is a 30-minute bike ride now, and the long run moves to Sunday." a={cBusy} b={cDone} />
      </div>
      </div>
      </div>
    </div>
  );
}

/// The film is drawn on one canvas of a fixed size and scaled to fit its stage, so nothing overlaps
/// in a short or zoomed window and it grows on big screens. A wide stage: 1180 × 740, side by side. A
/// tall one (phones): the stage's width, 760 tall, scaled down only when the window is shorter.
const CANVAS = { w: 1180, h: 740, phoneH: 760 };
function useFit(box: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const stage = box.current?.querySelector<HTMLElement>(`.${f.stage}`), canvas = stage?.firstElementChild as HTMLElement | null;
    if (!stage || !canvas) return;
    const fit = () => {
      const w = stage.clientWidth, h = stage.clientHeight;
      const narrow = w / h < 1.15;
      stage.toggleAttribute("data-narrow", narrow);
      if (narrow) {
        const k = Math.min(1, h / CANVAS.phoneH);
        canvas.style.width = `${w / k}px`; canvas.style.height = `${CANVAS.phoneH}px`; canvas.style.setProperty("--k", String(k));
      } else {
        const k = Math.min(w / CANVAS.w, h / CANVAS.h, 1.3);
        canvas.style.width = `${CANVAS.w}px`; canvas.style.height = `${CANVAS.h}px`; canvas.style.setProperty("--k", k.toFixed(4));
      }
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(stage);
    return () => ro.disconnect();
  }, [box]);
}

/// Pinned and scrubbed by scroll on wide screens; played on time on phones, with Reduce Motion
/// showing the last frame. `?p=0..1` freezes progress for review; `window.__setP(p)` does it live.
export function Film() {
  const box = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [pinned, setPinned] = useState(true);
  const replay = useRef<(() => void) | null>(null);
  useFit(box);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("p");
    let frozen = false;
    (window as unknown as { __setP?: (v: number) => void }).__setP = (v) => { frozen = true; setP(v); };
    if (q !== null) { setP(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setPinned(false); setP(1); return; }
    let raf = 0;
    if (matchMedia("(max-width: 900px)").matches) {
      setPinned(false);
      // Plays on time, but only while it's in view: it starts once most of it is on screen, pauses when
      // you scroll away and carries on when you come back. The clock counts only time in view.
      let last = 0, played = 0, on = false;
      const tick = (now: number) => {
        raf = 0; if (frozen || !on) return;
        if (last) played += now - last; last = now;
        const v = played / 22000; setP(Math.min(1, v)); if (v < 1) raf = requestAnimationFrame(tick);
      };
      const io = new IntersectionObserver(([e]) => {
        on = e.intersectionRatio >= 0.75; last = 0;
        if (on && !raf) raf = requestAnimationFrame(tick);
      }, { threshold: [0, 0.75] });
      if (box.current) io.observe(box.current);
      replay.current = () => { played = 0; last = 0; setP(0); if (on && !raf) raf = requestAnimationFrame(tick); };
      return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }
    const read = () => { raf = 0; if (frozen) return; const el = box.current; if (!el) return; const r = el.getBoundingClientRect(); const travel = r.height - innerHeight; setP(clamp(travel > 0 ? -r.top / travel : 0)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={box} className={f.film} data-pinned={pinned || undefined}>
      {/* The film is pictures and moving words; this is what it says, for screen readers. */}
      <div className={f.srOnly}>
        <h2>A week in one note</h2>
        <ol>
          <li>Monday: you ask ChatGPT to plan four runs a week for a half marathon on 30 November. It writes a Running plan note in Pinto Notes.</li>
          <li>Wednesday: your knee is sore. Claude, working in the same note, makes Thursday a 30-minute bike ride and moves the long run to Sunday.</li>
          <li>Friday: you ask ChatGPT how the week went. It reads the note, Claude&apos;s change included: two runs and a ride, on track.</li>
          <li>Sunday: you tick off the long run yourself.</li>
        </ol>
      </div>
      <div className={f.pin} aria-hidden="true"><Frame p={p} /></div>
      {!pinned && p >= 1 && replay.current && <button type="button" className={f.replay} onClick={() => replay.current?.()}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.4h2.4" /></svg>Replay the week</button>}
    </div>
  );
}
