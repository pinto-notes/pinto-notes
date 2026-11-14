"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import s from "./s.module.css";

// The three things on study S's page, all carrying one trip: Lisbon in May. A note (the plan), a
// whiteboard (Friday, drawn), and a small app (the habits before you go). Each comes in two sizes:
// a face for the cards (the first screen, and each chapter as it arrives), and the real thing.

export const hand = localFont({ src: "./Excalifont-Regular.woff2", display: "block" });

/** ChatGPT's colour and Claude's, the same everywhere on the page (the app marks their edits so). */
export const GPT = "#10a37f";
export const CLAUDE = "#d97757";

export const Tick = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.4l3.6 3.6 7.4-7.6" /></svg>
);

/* ───────────────────────── Faces (the cards) ───────────────────────── */

export function NoteFace() {
  return (
    <div className={s.miniNote}>
      <p className={s.miniTitle}>Lisbon, May 8–12</p>
      <ul className={s.miniRows}>
        <li data-on><i><Tick /></i>Book the flights</li>
        <li><i />Find a flat in Alfama</li>
        <li><i />Pastéis de Belém, early</li>
        <li className={s.miniAi}><i /><span>Train to Sintra<em className={s.miniTime}>, Sat 9:10</em></span><AIGlyph name="openai" size={14} color={GPT} /></li>
      </ul>
    </div>
  );
}

export function BoardFace() {
  const r = rng(31);
  return (
    <svg className={`${s.miniBoard} ${hand.className}`} viewBox="0 0 340 196" aria-hidden="true">
      <g className={s.chalk}>
        <path d={ellipse(r, 66, 44, 60, 29)} />
        <path d={box(r, 172, 16, 132, 56, 14)} />
        <path d={ellipse(r, 122, 160, 108, 30)} />
        <path d={line(r, 130, 44, 168, 44, 0)} />
        <path d={head(r, [140, 44], [168, 44], 12)} />
      </g>
      <g className={s.miniClaude}>
        <path d={curve(r, [236, 78], [240, 98], [232, 112], [214, 128], 1)} />
        <path d={head(r, [228, 116], [214, 128], 11)} />
      </g>
      <text x="66" y="51" fontSize="20" textAnchor="middle" className={s.chalkText}>Land 10:40</text>
      <text x="238" y="51" fontSize="20" textAnchor="middle" className={s.chalkText}>Alfama</text>
      <text x="122" y="167" fontSize="20" textAnchor="middle" className={s.chalkText}>Sunset at Graça</text>
      <Cursor x={244} y={104} name="Claude" color={CLAUDE} scale={0.86} />
    </svg>
  );
}

export function AppFace() {
  return (
    <div className={s.miniApp}>
      <p className={s.miniAppTop}><b>Before Lisbon</b><span>App</span></p>
      <p className={s.miniHabit}>Portuguese, 10 min<small>4 days</small></p>
      <div className={s.miniWeek}>
        {WEEK.map((d, i) => <span key={i} data-on={i < 4 || undefined} data-now={i === 4 || undefined}><small>{d}</small><i><Tick /></i></span>)}
      </div>
      <span className={s.miniPress}>Done today</span>
    </div>
  );
}

/** A named cursor, the way Pinto shows an AI working: the arrow and a flag in the AI's colour. */
export function Cursor({ x, y, name, color, scale = 1 }: { x: number; y: number; name: string; color: string; scale?: number }) {
  const w = name.length * 7.4 + 18;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill={color} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="14" y="15" width={w} height="22" rx="7" fill={color} />
      <text x={14 + w / 2} y="30.5" className={s.cursorName} textAnchor="middle">{name}</text>
    </g>
  );
}

/* ───────────────────────── The note ───────────────────────── */

const ROWS = ["Book the flights", "Find a flat in Alfama", "Pastéis de Belém, before the queue"];
const TYPED = "Ask Marta about Sintra";

/** The Lisbon note at writing size. The rows tick; the last line is typed when the chapter arrives. */
export function Note({ live }: { live: boolean }) {
  const [on, setOn] = useState([true, false, false, false]);
  const [n, setN] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!live || started.current) return;
    started.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("t")) { setN(TYPED.length); return; }
    let i = 0, t = 0;
    const step = () => { i++; setN(i); if (i < TYPED.length) t = window.setTimeout(step, 38 + ((i * 37) % 5) * 9); };
    t = window.setTimeout(step, 450);
    return () => clearTimeout(t);
  }, [live]);
  const flip = (i: number) => setOn((o) => o.map((v, k) => (k === i ? !v : v)));
  const rows = [...ROWS, TYPED];
  return (
    <div className={s.sheet}>
      <p className={s.sheetDate}>Today at 09:41</p>
      <h3 className={s.sheetTitle}>Lisbon, May 8–12</h3>
      <p className={s.sheetText}>Marta says go up to Graça for the sunset. Pack shoes for the hills.</p>
      <ul className={s.rows}>
        {rows.map((text, i) => {
          const typing = i === rows.length - 1;
          const shown = typing ? TYPED.slice(0, n) : text;
          return (
            <li key={text} data-typing={typing || undefined} data-empty={typing && n === 0 ? true : undefined}>
              <button type="button" className={s.row} data-on={on[i] || undefined} onClick={() => flip(i)} aria-pressed={on[i]} aria-label={text}>
                <i className={s.box}><Tick /></i>
              </button>
              <span className={s.rowText} onClick={() => flip(i)}>
                {shown}{typing && n < TYPED.length && <b className={s.caret} aria-hidden="true" />}
                <b className={s.strike} aria-hidden="true" data-on={on[i] || undefined} />
              </span>
            </li>
          );
        })}
      </ul>
      <p className={s.sheetText}>The plan for Friday is on the whiteboard: <a className={s.noteLink} href="#s-draw">Friday in Lisbon</a></p>
    </div>
  );
}

/* ───────────────────────── The whiteboard ───────────────────────── */

type Pt = [number, number];
type Node = { kind: "ellipse" | "box" | "diamond"; c: Pt; w: number; h: number; label: string[] };
type Arrow = { a: Pt; c1: Pt; c2: Pt; b: Pt; label?: [string, Pt] };
type Board = { view: [number, number]; font: number; nodes: Node[]; arrows: Arrow[]; last: Arrow; title?: Pt };

// Friday in Lisbon, left to right: land, drop the bags, and the weather decides; both ways end at the sunset.
const WIDE: Board = {
  view: [1200, 540], font: 30, title: [14, 500],
  nodes: [
    { kind: "ellipse", c: [126, 120], w: 236, h: 100, label: ["Land 10:40"] },
    { kind: "box", c: [442, 120], w: 284, h: 96, label: ["Bags to Alfama"] },
    { kind: "diamond", c: [752, 120], w: 230, h: 150, label: ["Raining?"] },
    { kind: "box", c: [1078, 120], w: 216, h: 116, label: ["Belém by", "the river"] },
    { kind: "box", c: [700, 400], w: 240, h: 96, label: ["Tile museum"] },
    { kind: "ellipse", c: [1032, 400], w: 330, h: 112, label: ["Sunset at Graça"] },
  ],
  arrows: [
    { a: [250, 120], c1: [266, 116], c2: [282, 122], b: [296, 120] },
    { a: [590, 120], c1: [604, 116], c2: [622, 122], b: [634, 120] },
    { a: [872, 120], c1: [892, 116], c2: [952, 122], b: [966, 120], label: ["no", [916, 98]] },
    { a: [744, 200], c1: [738, 250], c2: [716, 312], b: [706, 348], label: ["yes", [764, 282]] },
    { a: [824, 400], c1: [838, 396], c2: [852, 404], b: [864, 400] },
  ],
  // Claude's: from Belém down to the sunset.
  last: { a: [1088, 182], c1: [1120, 236], c2: [1104, 300], b: [1070, 340] },
};
// The same board, standing up, for a phone.
const TALL: Board = {
  view: [358, 600], font: 22,
  nodes: [
    { kind: "ellipse", c: [179, 50], w: 184, h: 66, label: ["Land 10:40"] },
    { kind: "box", c: [179, 162], w: 224, h: 62, label: ["Bags to Alfama"] },
    { kind: "diamond", c: [179, 292], w: 170, h: 112, label: ["Raining?"] },
    { kind: "box", c: [86, 430], w: 152, h: 64, label: ["Tile museum"] },
    { kind: "box", c: [272, 430], w: 160, h: 70, label: ["Belém by", "the river"] },
    { kind: "ellipse", c: [179, 550], w: 244, h: 78, label: ["Sunset at Graça"] },
  ],
  arrows: [
    { a: [179, 87], c1: [177, 100], c2: [181, 114], b: [179, 127] },
    { a: [179, 197], c1: [177, 210], c2: [181, 222], b: [179, 232] },
    { a: [134, 322], c1: [112, 344], c2: [94, 370], b: [88, 394], label: ["yes", [92, 348]] },
    { a: [224, 322], c1: [246, 344], c2: [264, 370], b: [270, 390], label: ["no", [268, 348]] },
    { a: [96, 466], c1: [102, 484], c2: [114, 500], b: [126, 512] },
  ],
  last: { a: [262, 469], c1: [258, 486], c2: [244, 502], b: [230, 512] },
};

function diamond(r: () => number, c: Pt, w: number, h: number) {
  const [x, y] = c, t: Pt = [x, y - h / 2], rr: Pt = [x + w / 2, y], b: Pt = [x, y + h / 2], l: Pt = [x - w / 2, y];
  return [line(r, ...t, ...rr, 3), line(r, ...rr, ...b, 3), line(r, ...b, ...l, 3), line(r, ...l, ...t, 3)].join(" ");
}

function shape(r: () => number, n: Node) {
  if (n.kind === "ellipse") return ellipse(r, n.c[0], n.c[1], n.w / 2, n.h / 2);
  if (n.kind === "diamond") return diamond(r, n.c, n.w, n.h);
  return box(r, n.c[0] - n.w / 2, n.c[1] - n.h / 2, n.w, n.h, 18);
}

const cubic = (a: Arrow) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

/** The whiteboard, in cream ink on the green. Claude's cursor draws the last arrow as the chapter's
 *  dwell goes from 0 to 1 (`bind` hands the setter to the scroll loop; no React render per frame). */
export function BoardBig({ tall, bind }: { tall?: boolean; bind: (set: (k: number) => void) => () => void }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 17 : 7);
  const [W, H] = g.view;
  const lastD = curve(r, g.last.a, g.last.c1, g.last.c2, g.last.b, 2);
  const lastHead = head(r, g.last.c2, g.last.b, tall ? 15 : 22);
  const path = useRef<SVGPathElement>(null), wipe = useRef<SVGRectElement>(null), cur = useRef<SVGGElement>(null), tip = useRef<SVGGElement>(null);
  const mid = tall ? "s-board-tall" : "s-board-wide";
  const top = Math.min(g.last.a[1], g.last.b[1]) - 24, span = Math.abs(g.last.b[1] - g.last.a[1]) + 48;
  const sc = tall ? 1.05 : 1.45;
  useEffect(() => {
    const p = path.current; if (!p) return;
    const len = p.getTotalLength();
    const set = (k: number) => {
      // Claude draws over the first 70% of the dwell, then lets go and rests beside the arrow.
      const u = Math.min(1, Math.max(0, (k - 0.06) / 0.64)), e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      const q = p.getPointAtLength(len * e);
      wipe.current?.setAttribute("transform", `translate(0 ${(u <= 0 ? -40 : q.y + 8 - top).toFixed(1)})`);
      if (tip.current) tip.current.style.opacity = e > 0.985 ? "1" : "0";
      const c = cur.current;
      if (c) {
        const rest = e > 0.985;
        const x = rest ? g.last.b[0] + (tall ? 16 : 26) : q.x, y = rest ? g.last.b[1] - (tall ? 26 : 40) : q.y;
        c.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        c.style.opacity = u <= 0 ? "0" : "1";
      }
    };
    set(0);
    return bind(set);
  }, [bind, g, tall, top]);
  return (
    <svg className={`${s.board} ${hand.className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <mask id={mid} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
          <rect ref={wipe} x="0" y={top - span} width={W} height={span} fill="#fff" transform={`translate(0 ${Math.max(g.last.a[1], g.last.b[1]) + 8 - top})`} />
        </mask>
      </defs>
      {g.title && <text x={g.title[0]} y={g.title[1]} fontSize={g.font * 1.5} className={s.boardTitle}>Friday in Lisbon</text>}
      <g className={s.chalk}>
        {g.nodes.map((n, i) => <path key={i} d={shape(r, n)} />)}
        {g.arrows.map((a, i) => <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 2)} /><path d={head(r, a.c2, a.b, tall ? 13 : 20)} /></g>)}
      </g>
      {g.nodes.map((n, i) => (
        <text key={i} x={n.c[0]} y={n.c[1] + g.font * 0.34 - (n.label.length - 1) * g.font * 0.55} fontSize={g.font} textAnchor="middle" className={s.chalkText}>
          {n.label.map((l, j) => <tspan key={j} x={n.c[0]} dy={j ? g.font * 1.1 : 0}>{l}</tspan>)}
        </text>
      ))}
      {g.arrows.map((a, i) => a.label && <text key={i} x={a.label[1][0]} y={a.label[1][1]} fontSize={g.font * 0.86} textAnchor="middle" className={s.chalkNote}>{a.label[0]}</text>)}
      <path ref={path} d={cubic(g.last)} fill="none" stroke="none" />
      <g mask={`url(#${mid})`} className={s.chalkClaude}><path d={lastD} /></g>
      <g ref={tip} className={s.chalkClaude}><path d={lastHead} /></g>
      <g ref={cur} style={{ opacity: 0 }}><g transform={`scale(${sc})`}><Cursor x={0} y={0} name="Claude" color={CLAUDE} /></g></g>
    </svg>
  );
}

/* ───────────────────────── The app ───────────────────────── */

export const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
type Habit = { name: string; days: boolean[]; ai?: boolean };
const HABITS: Habit[] = [
  { name: "Portuguese, 10 min", days: [true, true, true, true, false, false, false] },
  { name: "Run, 5 km", days: [false, true, false, true, false, false, false] },
];
const TODAY = 4;

function streak(days: boolean[]) {
  let n = 0;
  for (let i = TODAY; i >= 0; i--) { if (days[i]) n++; else if (i !== TODAY) break; }
  return n;
}

/** The habit tracker, for real: tap today, add a habit, take one away. */
export function HabitApp() {
  const [habits, setHabits] = useState(HABITS);
  const [draft, setDraft] = useState("");
  const tap = (h: number, d: number) => setHabits((hs) => hs.map((x, i) => (i === h ? { ...x, days: x.days.map((v, j) => (j === d ? !v : v)) } : x)));
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const name = draft.trim(); if (!name) return;
    setHabits((hs) => [...hs, { name, days: WEEK.map(() => false) }].slice(-4));
    setDraft("");
  };
  const remove = (h: number) => setHabits((hs) => hs.filter((_, i) => i !== h));
  return (
    <div className={s.app}>
      <div className={s.appBar}>
        <p className={s.appName}>Before Lisbon<span>App</span></p>
        <p className={s.appCount}>12 days to go</p>
      </div>
      <ul className={s.habits}>
        {habits.map((h, i) => {
          const n = streak(h.days);
          return (
            <li key={h.name + i} className={s.habitRow}>
              <div className={s.habitHead}>
                <p className={s.habitName}>{h.name}</p>
                <p className={s.habitStreak} aria-live="polite"><b key={n}>{n}</b> {n === 1 ? "day" : "days"}</p>
                {habits.length > 1 && <button type="button" className={s.habitX} onClick={() => remove(i)} aria-label={`Remove ${h.name}`}>×</button>}
              </div>
              <div className={s.week}>
                {WEEK.map((d, j) => (
                  <button key={j} type="button" className={s.day} data-on={h.days[j] || undefined} data-now={j === TODAY || undefined} disabled={j > TODAY}
                    onClick={() => tap(i, j)} aria-pressed={h.days[j]} aria-label={`${h.name}, ${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][j]}`}>
                    <small>{d}</small><i><Tick /></i>
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
      <form className={s.addRow} onSubmit={add}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a habit" aria-label="Add a habit" maxLength={28} />
        <button type="submit" disabled={!draft.trim()}>Add</button>
      </form>
    </div>
  );
}
