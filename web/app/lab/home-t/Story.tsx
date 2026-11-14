"use client";

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Board, hand, penPoints, TALL, WIDE } from "./Board";
import { END, HOLDS, type Lay, type Pose, sample, tracks } from "./timeline";
import s from "./t.module.css";

// Study T, "one note becomes everything". The page is one Pinto note on a sticky stage, and scrolling
// writes it: the headline is the note's first line, then it grows a checklist, turns into a
// whiteboard, holds a habit tracker, and ChatGPT edits all three. The stage is a fixed design canvas
// (1280x720 on a wide screen, 360x660 on a phone) scaled to fit the window, so the story is composed
// exactly at every size. Only transform and opacity move, from one rAF loop that follows the scroll.

const DESK: Lay = {
  W: 1280, H: 720,
  note: { x: 640, y: 104 }, board: { x: 560, y: 96 }, app: { x: 96, y: 64 },
  mini: [{ x: 478, y: 292, s: 0.58 }, { x: 860, y: 296, s: 0.495 }, { x: 90, y: 286, s: 0.55 }],
  cursor: { start: [56, -138], mid: [-28, -80] },
  lift: 260, pen: penPoints(WIDE),
};
const PHONE: Lay = {
  W: 360, H: 660,
  note: { x: 20, y: 206 }, board: { x: 20, y: 196 }, app: { x: 20, y: 196 },
  mini: [{ x: 30, y: 384, s: 0.36 }, { x: 36, y: 522, s: 0.27 }, { x: 34, y: 242, s: 0.3 }],
  cursor: { start: [40, -128], mid: [-34, -58] },
  lift: 200, pen: penPoints(TALL),
};

const Tick = () => <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.4l2.7 2.7L12.2 5.2" /></svg>;
const st = (p: Record<string, number | string>) => p as CSSProperties;

/** The note: its title, a line, and the checklist. Two ticked by you; ChatGPT ticks the flights later. */
function Note({ L }: { L: Lay }) {
  const rows = ["Sign up for the race", "Buy running shoes", "Make a training plan", "Book flights to Lisbon", "Find a hotel near the start"];
  return (
    <div className={s.note} data-k="note" style={st({ left: L.note.x, top: L.note.y })}>
      <p className={s.noteTitle}>Lisbon half, 17 May</p>
      <p className={s.noteText}>My first half marathon. Four runs a week until then.</p>
      <ul className={s.check}>
        {rows.map((t, i) => (
          <li key={t} data-k={`r${i}`}>
            {i === 3 && <span className={s.tint} data-k="tint3" />}
            <i className={s.box}>
              {i < 2 && <b className={s.on} data-k={`t${i}`}><Tick /></b>}
              {i === 3 && <b className={`${s.on} ${s.onAi}`} data-k="t3ai"><Tick /></b>}
            </i>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Habit = { name: string; sub: (n: number) => string; color: string; n: number; of?: number };
const HABITS: Habit[] = [
  { name: "Run", sub: (n) => `${n} of 4 this week`, color: "#f0901a", n: 2, of: 4 },
  { name: "Stretch", sub: (n) => `${n} days in a row`, color: "#4f86e8", n: 4 },
  { name: "Sleep by 23", sub: (n) => `${n} of 7 this week`, color: "#8a6ad6", n: 3, of: 7 },
  { name: "Water", sub: (n) => `${n} of 8 glasses`, color: "#2fa6b8", n: 5, of: 8 },
];

/** The habit tracker: an app in the note. The ticks are real buttons. */
function Tracker({ L }: { L: Lay }) {
  const [done, setDone] = useState([false, true, false, false]);
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className={s.app} data-k="app" style={st({ left: L.app.x, top: L.app.y })}>
      <p className={s.appTop}><b>Training</b><span className={s.appTag}>App</span></p>
      <p className={s.appSub}>Week 6 of 10. Race day is 17 May.</p>
      <div className={s.week} aria-hidden="true">
        {week.map((w, k) => <span key={k} data-on={k < 3 || undefined} data-now={k === 3 || undefined}><small>{w}</small><i /></span>)}
      </div>
      <ul className={s.habits}>
        {HABITS.map((h, i) => {
          const n = h.n + (done[i] ? 1 : 0);
          return (
            <li key={h.name} data-k={`a${i}`} style={st({ "--c": h.color })}>
              {i === 0 && <span className={s.tint} data-k="atint" />}
              <span className={s.hText}>
                <b>{h.name}</b>
                <small data-k={i === 0 ? "aiRunOld" : undefined}>{h.sub(n)}</small>
                {i === 0 && <em className={s.chip} data-k="aiRunSub"><AIGlyph name="openai" size={13} />12 km, logged by ChatGPT</em>}
              </span>
              <button type="button" className={s.hTick} aria-pressed={done[i]} aria-label={`${h.name}, done today`}
                onClick={() => setDone((d) => d.map((v, k) => (k === i ? !v : v)))}>
                <Tick />
              </button>
              {i === 0 && <span className={`${s.hTick} ${s.hTickAi}`} data-k="aiRun" aria-hidden="true"><Tick /></span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const TOOLS = [
  "M4 3l11 6-5 1.5L8 16z", "M3.5 5.5h13v9h-13z", "M10 3l7 7-7 7-7-7z", "M10 3.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13z",
  "M4 16L16 4m0 0h-7m7 0v7", "M4 16L16 4", "M5 15c3-1 3-8 6-9s2 5 4 5",
];

function Canvas({ L, phone, cta }: { L: Lay; phone: boolean; cta: ReactNode }) {
  const said = "I ran 12 km and booked the flights. Log it, and add a rest week to my plan.";
  const did = ["Logged today's run.", "Ticked off the flights.", "Drew a rest week."];
  return (
    <div className={`${s.cv} ${phone ? s.cvP : s.cvD}`} data-cv={phone ? "p" : "d"} style={st({ width: L.W, height: L.H })}>
      <div className={s.grid} data-k="grid" aria-hidden="true" />
      {[0, 1, 2].map((i) => (
        <div key={i} className={s.tile} data-k={`tile${i}`} aria-hidden="true" />
      ))}
      <p className={s.date} data-k="date" aria-hidden="true">Saturday 14 November at 09:41</p>
      <div className={s.tools} data-k="tools" aria-hidden="true">
        {TOOLS.map((d, i) => <svg key={i} viewBox="0 0 20 20" data-on={i === 1 || undefined}><path d={d} /></svg>)}
        <span>Aa</span>
      </div>

      {/* 0. The headline, as the note's first line. "and your AI." is ChatGPT's, marked in its colour. */}
      <div className={s.hero}>
        <h1 className={s.h1} data-k="h1">
          <span className={s.w} style={st({ "--i": 0 })}>The</span>{" "}
          <span className={s.w} style={st({ "--i": 1 })}>notebook</span>{phone ? <br /> : " "}
          <span className={s.w} style={st({ "--i": 2 })}>for</span>{phone ? " " : <br />}
          <span className={s.w} style={st({ "--i": 3 })}>you</span>{" "}
          {phone && <>
            <span className={s.ai}><span className={s.aiIn}>and</span></span><br />
          </>}
          <span className={s.ai}>
            <span className={s.aiIn}>{phone ? "your AI." : "and your AI."}</span>
            <span className={s.flag} aria-hidden="true"><i /><em><AIGlyph name="openai" size={phone ? 11 : 14} />ChatGPT</em></span>
          </span>
        </h1>
        <div className={s.heroRest} data-k="heroRest">
          <p className={s.sub}>Write notes, draw on whiteboards and build apps. Your AI can work in all three.</p>
          {cta}
        </div>
      </div>

      {/* 1. Write notes. */}
      <div className={s.cap} data-k="capW">
        <h2 className={s.h2}>Write notes.</h2>
        <p className={s.say}>Notes that feel like Apple Notes, on your Mac and iPhone.</p>
      </div>
      <Note L={L} />

      {/* 2. Draw on whiteboards. */}
      <div className={`${s.cap} ${s.capD}`} data-k="capD">
        <h2 className={s.h2}>Draw on whiteboards.</h2>
        <p className={s.say}>Sketch a plan next to your notes. Your AI can read it and draw on it.</p>
      </div>
      <div className={s.boardBox} data-k="board" style={st({ left: L.board.x, top: L.board.y })}
        role="img" aria-label="A hand-drawn whiteboard called Training plan: easy runs, long runs, then feel good? If yes, taper, then race day. ChatGPT adds: if no, a rest week.">
        <Board L={phone ? TALL : WIDE} />
      </div>

      {/* 3. Build apps. */}
      <div className={`${s.cap} ${s.capB}`} data-k="capB">
        <h2 className={s.h2}>Build apps.</h2>
        <p className={s.say}>A note can be a small app. Start from a template, or ask your AI.</p>
      </div>
      <Tracker L={L} />
      <p className={`${s.try} ${hand.className}`} data-k="try" aria-hidden="true">
        Go on, tick one
        <svg viewBox="0 0 120 40"><path d="M4 22 C 34 6, 70 4, 108 20 M96 10 L109 20 L95 29" /></svg>
      </p>

      {/* 4. Your AI, in all three. */}
      <div className={s.capAi} data-k="capA">
        <h2 className={s.h2}>Your AI, in all three.</h2>
      </div>
      <div className={s.said} data-k="said">
        <p className={s.saidHead}><AIGlyph name="openai" size={phone ? 14 : 18} />In ChatGPT</p>
        <p className={s.bubble}>{said}</p>
      </div>
      <ul className={s.labels}>
        {did.map((t, i) => <li key={t} data-k={`lab${i}`}><AIGlyph name="openai" size={phone ? 12 : 15} />{t}</li>)}
      </ul>
    </div>
  );
}

type El = HTMLElement | SVGElement;
const SIZE = "var(--hdr)";

export function Story({ cta }: { cta: ReactNode }) {
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sec.current, st0 = stage.current;
    if (!section || !st0) return;
    const freeze = new URLSearchParams(location.search).has("t");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const sets = (["d", "p"] as const).map((n) => {
      const cv = st0.querySelector<HTMLElement>(`[data-cv="${n}"]`)!;
      const els = new Map<string, El[]>();
      cv.querySelectorAll<HTMLElement>("[data-k]").forEach((e) => {
        const k = e.dataset.k!;
        els.set(k, [...(els.get(k) ?? []), e]);
      });
      return { cv, els, T: tracks(n === "d" ? DESK : PHONE), L: n === "d" ? DESK : PHONE, last: new Map<El, string>() };
    });
    let unit = 1, cur = -1, target = 0, raf = 0, prev = 0;

    const fit = () => {
      const w = st0.clientWidth, h = st0.clientHeight;
      unit = h * 0.5;
      for (const c of sets) document.documentElement.style.setProperty(c.cv === sets[0].cv ? "--kd" : "--kp", String(Math.min(w / c.L.W, h / c.L.H, 1.32)));
    };
    const read = () => {
      const top = parseFloat(getComputedStyle(st0.parentElement!).top) || 0;
      const u = Math.max(0, Math.min(END, (top - section.getBoundingClientRect().top) / unit));
      return reduce.matches ? HOLDS.find(([edge]) => u < edge)![1] : u;
    };
    const write = (set: (typeof sets)[number], u: number) => {
      for (const [k, track] of Object.entries(set.T)) {
        const list = set.els.get(k);
        if (!list) continue;
        const p: Required<Pose> = sample(track, u);
        for (const e of list) {
          let v: string;
          if ("d" in track[0][1]) {
            v = `${(1 - p.d).toFixed(4)}|${p.d <= 0.001 ? 0 : 1}`;
            if (set.last.get(e) === v) continue;
            e.style.strokeDashoffset = String(1 - p.d);
            e.style.visibility = p.d <= 0.001 ? "hidden" : "";
          } else {
            const tf = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) scale(${(p.s * p.sx).toFixed(4)},${p.s.toFixed(4)})`;
            v = `${tf}|${p.o.toFixed(3)}`;
            if (set.last.get(e) === v) continue;
            e.style.transform = tf;
            e.style.opacity = p.o.toFixed(3);
            e.style.visibility = p.o <= 0.002 ? "hidden" : "";
          }
          set.last.set(e, v);
        }
      }
    };
    const frame = (now: number) => {
      raf = 0;
      target = read();
      const dt = prev ? Math.min(64, now - prev) : 16;
      prev = now;
      if (cur < 0 || freeze || reduce.matches) cur = target;
      else cur += (target - cur) * (1 - Math.exp(-dt / 75));
      if (Math.abs(target - cur) < 0.0008) cur = target;
      for (const set of sets) if (set.cv.offsetParent !== null) write(set, cur);
      if (cur !== target) raf = requestAnimationFrame(frame);
      else prev = 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const resize = () => { fit(); for (const set of sets) set.last.clear(); kick(); };
    fit();
    st0.dataset.live = "";
    kick();
    addEventListener("scroll", kick, { passive: true });
    addEventListener("resize", resize);
    reduce.addEventListener("change", resize);
    return () => { removeEventListener("scroll", kick); removeEventListener("resize", resize); reduce.removeEventListener("change", resize); cancelAnimationFrame(raf); };
  }, []);

  // Sized before first paint, so the first screen never jumps (the effect keeps it fitted after).
  const fitNow = `(function(){var s=document.currentScript.previousElementSibling,w=s.clientWidth,h=s.clientHeight,p=document.documentElement.style;p.setProperty('--kd',Math.min(w/1280,h/720,1.32));p.setProperty('--kp',Math.min(w/360,h/660,1.32))})()`;

  return (
    <section ref={sec} className={s.story} aria-label="Pinto Notes, one note at a time" style={st({ "--top": SIZE })}>
      <div className={s.pin}>
        <div ref={stage} className={s.sheet}>
          <Canvas L={DESK} phone={false} cta={cta} />
          <Canvas L={PHONE} phone cta={cta} />
        </div>
        <script dangerouslySetInnerHTML={{ __html: fitNow }} />
      </div>
    </section>
  );
}
