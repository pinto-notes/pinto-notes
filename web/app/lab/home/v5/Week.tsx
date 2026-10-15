"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import w from "./week.module.css";

// "The week", with a stack of notes: a running plan, a to-do list and habits. Each day an AI or you
// works in one of them; on Friday you ask how the week went and the answer reads across all three.
// Everything is a pure function of p (0..1). On wide screens Monday plays by itself on arrival and
// scroll adds to it (never fights it); phones play it on time. `?p=` freezes it.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const mj = (v: number) => { const x = clamp(v); return x * x * x * (10 - 15 * x + 6 * x * x); };
const over = (v: number) => { const x = clamp(v); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const span = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const INTRO = 0.16;

// The world: three notes side by side, 360 wide with 40 between; the camera moves over it.
const NW = 360, GAP = 40, WW = 3 * NW + 2 * GAP;
const cx = (i: number) => i * (NW + GAP) + NW / 2 - WW / 2;
type Shot = { t: number; f: number | "all" };
const SHOTS: Shot[] = [
  { t: 0, f: "all" }, { t: 0.03, f: "all" }, { t: 0.07, f: 0 }, { t: 0.15, f: 0 }, { t: 0.2, f: 1 }, { t: 0.32, f: 1 }, { t: 0.37, f: 2 },
  { t: 0.49, f: 2 }, { t: 0.53, f: 0 }, { t: 0.59, f: 0 }, { t: 0.62, f: 1 }, { t: 0.65, f: 1 }, { t: 0.7, f: "all" }, { t: 1, f: "all" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BEATS = [
  { at: 0, day: 0, text: "Plan it with ChatGPT." },
  { at: 0.17, day: 1, text: "Add to it on a walk." },
  { at: 0.34, day: 2, text: "Tick your habits." },
  { at: 0.5, day: 3, text: "Life happens." },
  { at: 0.67, day: 4, text: "Ask how your week went." },
  { at: 0.93, day: 4, text: "It knows, because it's all in your notes." },
];

const RUNS = ["Mon · 5 km easy", "Wed · Intervals, 6 × 400 m", "Thu · 5 km easy", "Sat · Long run, 12 km"];
const HABITS = ["Meditate", "Read 20 pages", "No phone after 22"];
// Which habit cells are ticked by the end of Wednesday (rows × Mon..Wed); Mon and Tue are already done.
const HABIT_DONE = [[1, 1, 1], [1, 0, 1], [1, 1, 0]];

function Box({ t }: { t: number }) {
  return (
    <span className={w.box} data-on={t > 0.5 || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.85 + 0.15 * over(t)).toFixed(3) : 1})` }}>
      <svg viewBox="0 0 16 16"><path d="m3.5 8.5 3 3 6-7" pathLength={1} style={{ strokeDashoffset: 1 - clamp(t * 1.4) }} /></svg>
    </span>
  );
}
const By = ({ app, label, v }: { app: "openai" | "claude"; label: string; v: number }) => (
  <span className={w.by} style={{ opacity: v, transform: `scale(${(0.8 + 0.2 * v).toFixed(3)})` }}><AIGlyph name={app} size={11} />{label}</span>
);
const Cursor = ({ x, y, v, press }: { x: number; y: number; v: number; press: boolean }) => (
  <svg className={w.cursor} viewBox="0 0 24 24" aria-hidden="true" style={{ opacity: v, transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${press ? 0.88 : 1})` }}><path d="M4 2l15 9-7 1.5L8.5 20z" /></svg>
);
const Note = ({ title, folder, children, lift }: { title: string; folder: string; children: React.ReactNode; lift: number }) => (
  <figure className={w.note} style={{ boxShadow: `0 0 0 0.5px rgba(60,30,5,0.22), 0 2px 4px rgba(60,30,5,0.06), 0 ${30 + 20 * lift}px ${70 + 30 * lift}px -36px rgba(60,30,5,${(0.4 + 0.2 * lift).toFixed(2)})` }}>
    <div className={w.bar}><span className={w.lights}><i /><i /><i /></span><span className={w.folder}>{folder}</span></div>
    <div className={w.paper}><h3 className={w.title}>{title}</h3>{children}</div>
  </figure>
);

function camera(p: number, narrow: boolean) {
  const focusS = narrow ? 0.9 : 1.22, allS = narrow ? 0.29 : 0.94;
  const pose = (f: number | "all") => (f === "all" ? { x: 0, s: allS } : { x: cx(f), s: focusS });
  let i = 0; while (i < SHOTS.length - 2 && p >= SHOTS[i + 1].t) i++;
  const a = SHOTS[i], b = SHOTS[i + 1];
  const k = mj(span(p, a.t, b.t));
  const A = pose(a.f), B = pose(b.f);
  return { x: lerp(A.x, B.x, k), s: lerp(A.s, B.s, k) };
}

function Frame({ p, narrow }: { p: number; narrow: boolean }) {
  const cam = camera(p, narrow);
  const fri = mj(span(p, 0.68, 0.74));
  const camY = (narrow ? -150 : -86) * fri;
  const beat = [...BEATS].reverse().find((b) => p >= b.at) ?? BEATS[0];
  const beatIdx = BEATS.indexOf(beat);
  const capIn = beatIdx === 0 ? 1 : mj(span(p, beat.at, beat.at + 0.025));

  // Monday: ChatGPT writes the plan.
  const gpt = mj(span(p, 0.035, 0.07)) * (1 - mj(span(p, 0.16, 0.19)));
  const runW = RUNS.map((_, i) => span(p, 0.075 + i * 0.016, 0.075 + i * 0.016 + 0.022));
  const gptMark = over(span(p, 0.14, 0.16));
  // Tuesday: a voice note from the evening walk adds two to-dos.
  const voice = mj(span(p, 0.2, 0.23)) * (1 - mj(span(p, 0.31, 0.34)));
  const todo1 = over(span(p, 0.25, 0.28)), todo2 = over(span(p, 0.28, 0.31));
  // Wednesday: you tick your habits.
  const habitCur = mj(span(p, 0.38, 0.41)) * (1 - mj(span(p, 0.47, 0.49)));
  const habitT = (r: number) => span(p, 0.41 + r * 0.02, 0.43 + r * 0.02);
  // Thursday: you tick Monday's and Wednesday's runs (Thursday's slips), then book the dentist.
  const runCur = mj(span(p, 0.53, 0.545)) * (1 - mj(span(p, 0.585, 0.6)));
  const tickMon = span(p, 0.55, 0.565), tickWed = span(p, 0.57, 0.585);
  const todoCur = mj(span(p, 0.615, 0.625)) * (1 - mj(span(p, 0.645, 0.66)));
  const tickDentist = span(p, 0.63, 0.645);
  // Friday: the question, the answer, and each line it reads lights up; Thursday's run moves to Sunday.
  const ask = mj(span(p, 0.72, 0.75)), tool = mj(span(p, 0.75, 0.77));
  const said = span(p, 0.77, 0.9);
  const hl = (a: number) => Math.sin(Math.PI * span(p, a, a + 0.06));
  const hlRuns = hl(0.775), hlDentist = hl(0.81), hlHabit = hl(0.835), hlBill = hl(0.86);
  const move = mj(span(p, 0.86, 0.9)), cMark = over(span(p, 0.89, 0.92));
  const ANSWER = "Two of four runs. You missed Thursday, so I moved it to Sunday. The dentist is booked. You've meditated every day. The electricity bill is still open, due Monday.";

  const focus = (i: number) => { const d = Math.abs(cam.x - cx(i)); return clamp(1 - d / (NW + GAP)) * clamp((cam.s - 0.94) / 0.28); };
  const slot = (i: number) => (i === 2 ? lerp(2, 3, move) : i === 3 ? lerp(3, 2, move) : i);
  const runTicks = [tickMon, tickWed, 0, 0];
  const tint = (v: number) => ({ background: `rgba(240, 144, 26, ${(0.18 * v).toFixed(3)})` });

  return (
    <div className={w.stage}>
      <ol className={w.days} aria-hidden="true">
        {DAYS.map((d, i) => <li key={d} data-on={i === beat.day || undefined} data-past={i < beat.day || undefined}>{d}</li>)}
      </ol>

      <div className={w.world} style={{ width: WW, transform: `translate(-50%, -50%) translate(${(-cam.x * cam.s).toFixed(1)}px, ${camY.toFixed(1)}px) scale(${cam.s.toFixed(4)})` }}>
        <Note title="Running plan" folder="Health" lift={focus(0)}>
          <p className={w.sub}>Half marathon on 30 November.</p>
          <ul className={w.lines}>
            {RUNS.map((r, i) => {
              const text = i === 2 && move > 0.5 ? "Sun · 5 km easy" : r;
              const v = runW[i];
              return (
                <li key={r} style={{ transform: `translateY(${(slot(i) * 40).toFixed(1)}px)`, zIndex: i === 2 ? 2 : 1 }}>
                  {v < 1 && <span className={w.ghost} style={{ opacity: 1 - clamp(v * 2.5), width: `${[58, 74, 54, 66][i]}%` }} />}
                  <span className={w.row} style={{ opacity: v > 0 ? 1 : 0, ...tint(i < 3 ? hlRuns : 0), ...(i === 2 && cMark > 0 ? tint(Math.max(hlRuns, cMark * (1 - span(p, 0.96, 1)))) : {}) }}>
                    <Box t={runTicks[i]} /><span data-done={runTicks[i] > 0.5 || undefined}>{v >= 1 ? text : text.slice(0, Math.round(text.length * v))}</span>
                    {i === 0 && <By app="openai" label="ChatGPT" v={gptMark} />}
                    {i === 2 && <By app="claude" label="Claude moved it" v={cMark} />}
                  </span>
                </li>
              );
            })}
          </ul>
          <Cursor x={lerp(220, 10, mj(span(p, 0.53, 0.55)))} y={lerp(200, span(p, 0.565, 0.57) > 0 ? 126 : 86, mj(span(p, 0.53, 0.55)))} v={runCur} press={(tickMon > 0 && tickMon < 1) || (tickWed > 0 && tickWed < 1)} />
        </Note>

        <Note title="To do" folder="Notes" lift={focus(1)}>
          <ul className={w.lines} data-flow="">
            <li><span className={w.row}><Box t={1} /><span data-done="">Reply to Jonas</span></span></li>
            <li><span className={w.row}><Box t={0} /><span>Return the library books</span></span></li>
            <li style={{ opacity: todo1, transform: `translateY(${((1 - todo1) * 10).toFixed(1)}px)` }}>
              <span className={w.row} style={tint(Math.max(todo1 * (1 - span(p, 0.33, 0.37)), hlDentist))}><Box t={tickDentist} /><span data-done={tickDentist > 0.5 || undefined}>Book the dentist</span><By app="openai" label="ChatGPT" v={todo1} /></span>
            </li>
            <li style={{ opacity: todo2, transform: `translateY(${((1 - todo2) * 10).toFixed(1)}px)` }}>
              <span className={w.row} style={tint(Math.max(todo2 * (1 - span(p, 0.33, 0.37)), hlBill))}><Box t={0} /><span>Pay the electricity bill</span></span>
            </li>
          </ul>
          <Cursor x={lerp(220, 10, mj(span(p, 0.615, 0.63)))} y={lerp(200, 140, mj(span(p, 0.615, 0.63)))} v={todoCur} press={tickDentist > 0 && tickDentist < 1} />
        </Note>

        <Note title="Habits" folder="Health" lift={focus(2)}>
          <div className={w.grid}>
            <span />{DAYS.map((d) => <span key={d} className={w.dayHead}>{d[0]}</span>)}
            {HABITS.map((h, r) => (
              <div key={h} className={w.habitRow} style={r === 0 ? tint(hlHabit) : undefined}>
                <span className={w.habit}>{h}</span>
                {DAYS.map((d, c) => {
                  const done = c < 2 ? HABIT_DONE[r][c] === 1 : c === 2 && HABIT_DONE[r][2] === 1 ? habitT(r) > 0.5 : false;
                  const t = c === 2 && HABIT_DONE[r][2] === 1 ? habitT(r) : done ? 1 : 0;
                  return <span key={d} className={w.cell} data-on={done || undefined} data-today={c === 2 || undefined} style={{ transform: `scale(${t > 0 && t < 1 ? (0.8 + 0.2 * over(t)).toFixed(3) : 1})` }} />;
                })}
              </div>
            ))}
          </div>
          <Cursor x={lerp(280, 206, mj(span(p, 0.38, 0.41)))} y={lerp(190, 64 + 33 * Math.min(2, Math.floor(span(p, 0.41, 0.47) * 3)), mj(span(p, 0.38, 0.41)))} v={habitCur} press={[0, 1, 2].some((r) => habitT(r) > 0 && habitT(r) < 1)} />
        </Note>
      </div>

      {/* Monday: ChatGPT */}
      <figure className={`${w.chat} ${w.left}`} data-app="chatgpt" style={{ opacity: gpt, transform: `translate(${((1 - gpt) * -40).toFixed(1)}px, -50%)` }}>
        <div className={w.chatTop}><span><AIGlyph name="openai" size={14} />ChatGPT</span><em>Monday</em></div>
        <p className={w.me}>I'm running a half marathon on 30 November. Plan four runs a week in my notes.</p>
        <p className={w.tool}>Used Pinto Notes · Running plan</p>
      </figure>

      {/* Tuesday: what you said on the walk */}
      <p className={w.voice} style={{ opacity: voice, transform: `translate(-50%, ${((1 - voice) * 10).toFixed(1)}px)` }}>
        <span><AIGlyph name="openai" size={12} />Voice, on your walk</span>"Remind me to book the dentist, and pay the electricity bill."
      </p>

      {/* Friday: the question, and an answer read from all three notes */}
      <figure className={w.answer} style={{ opacity: ask, transform: `translate(-50%, ${((1 - ask) * 24).toFixed(1)}px)` }}>
        <div className={w.chatTop}><span><AIGlyph name="claude" size={14} />Claude</span><em>Friday</em></div>
        <p className={w.me}>How did my week go?</p>
        <p className={w.tool} style={{ opacity: tool }}>Used Pinto Notes · Running plan, To do, Habits</p>
        <p className={w.ai}>{ANSWER.slice(0, Math.round(ANSWER.length * said))}{said > 0 && said < 1 && <i className={w.caret} />}</p>
      </figure>

      <p key={beatIdx} className={w.caption} style={{ opacity: capIn }}>{beat.text}</p>
    </div>
  );
}

/// Pinned and scrubbed on wide screens, with Monday playing by itself on arrival; on time on phones.
export function Week() {
  const box = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [pinned, setPinned] = useState(true);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("p");
    let frozen = false;
    (window as unknown as { __setP?: (v: number) => void }).__setP = (v) => { frozen = true; setP(v); };
    const isNarrow = matchMedia("(max-width: 900px)").matches;
    setNarrow(isNarrow);
    if (q !== null) { setP(Number(q)); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setPinned(false); setP(1); return; }
    let raf = 0;
    if (isNarrow) {
      setPinned(false);
      let start = 0;
      const tick = (now: number) => { if (frozen) return; if (!start) start = now; const v = (now - start) / 20000; setP(Math.min(1, v)); if (v < 1) raf = requestAnimationFrame(tick); };
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); raf = requestAnimationFrame(tick); } }, { threshold: 0.5 });
      if (box.current) io.observe(box.current);
      return () => { io.disconnect(); cancelAnimationFrame(raf); };
    }
    // Monday plays on arrival (0 → INTRO over about three seconds); scroll adds the rest on top.
    let intro = 0, scroll = 0, t0 = 0, introRaf = 0;
    const show = () => { if (!frozen) setP(Math.min(1, intro + scroll * (1 - INTRO))); };
    const play = (now: number) => { if (!t0) t0 = now; intro = INTRO * mj((now - t0) / 3200); show(); if (intro < INTRO) introRaf = requestAnimationFrame(play); };
    const startT = window.setTimeout(() => { introRaf = requestAnimationFrame(play); }, 700);
    const read = () => { raf = 0; const el = box.current; if (!el) return; const r = el.getBoundingClientRect(); const travel = r.height - innerHeight; scroll = clamp(travel > 0 ? -(r.top - 100) / travel : 0); show(); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { clearTimeout(startT); cancelAnimationFrame(introRaf); removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={box} className={w.film} data-pinned={pinned || undefined}>
      <div className={w.pin}><Frame p={p} narrow={narrow} /></div>
    </div>
  );
}
