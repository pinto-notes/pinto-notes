"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import s from "./s.module.css";

// The three things on study S's page, all carrying one trip: Lisbon in May. A note (the plan, with the
// decision you made and the line ChatGPT added because of it), a whiteboard (Friday, drawn), and a
// small app (the habits before you go). The first screen shows them small on the collage; each
// chapter shows its one at full size, with the same words.

export const hand = localFont({ src: "./Excalifont-Regular.woff2", display: "block" });

/** ChatGPT's colour and Claude's, the same everywhere on the page (the app marks their edits so). */
export const GPT = "#10a37f";
export const CLAUDE = "#d97757";
/** Your cursor: ink, outlined in paper, like a real pointer. */
export const YOU = "#24170d";

export const Tick = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.4l3.6 3.6 7.4-7.6" /></svg>
);

/** The one decision on the page, and what ChatGPT did with it. Same words everywhere. */
export const DECIDED = "No car this time. Trains and trams.";
export const ADDED = "Sintra by train, Sat 9:10 from Rossio";

/** "Added by ChatGPT · Undo", in the note's own flow (never over the words it marks). Undo works. */
export function Receipt({ undone, onFlip, live = true }: { undone: boolean; onFlip: () => void; live?: boolean }) {
  return (
    <p className={s.receipt} data-undone={undone || undefined}>
      {undone
        ? <><span>Undone</span><button type="button" onClick={onFlip} tabIndex={live ? 0 : -1}>Redo</button></>
        : <><span className={s.receiptMark}><AIGlyph name="openai" size={11} color="#fff" /></span><span>Added by ChatGPT</span><b aria-hidden="true">·</b><button type="button" onClick={onFlip} tabIndex={live ? 0 : -1}>Undo</button></>}
    </p>
  );
}

/* ───────────────────────── The first screen's three ───────────────────────── */

/** The Lisbon note at reading size: your decision, and ChatGPT's line because of it. */
export function HeroNote() {
  const [undone, setUndone] = useState(false);
  return (
    <div className={s.hNote}>
      <p className={s.hNoteDate}>Today at 09:41</p>
      <p className={s.hNoteTitle}>Lisbon, May 8–12</p>
      <p className={s.decided}><b>Decided:</b> {DECIDED}</p>
      <ul className={s.hRows}>
        <li data-on><i><Tick /></i><span>Book the flights</span></li>
        <li><i /><span>Find a flat in Alfama</span></li>
        <li className={s.hAdded} data-undone={undone || undefined}><i /><span><b className={s.mark} />{ADDED}</span></li>
      </ul>
      <Receipt undone={undone} onFlip={() => setUndone((u) => !u)} />
    </div>
  );
}

export function BoardFace() {
  const r = rng(31);
  return (
    <div className={s.hBoard}>
      <svg className={`${s.hBoardInk} ${hand.className}`} viewBox="0 0 340 196" aria-hidden="true">
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
      </svg>
      {/* The flag is HTML, so it stays readable at any card size. */}
      <Flag name="Claude" color={CLAUDE} className={s.hFlag} />
    </div>
  );
}

export function AppFace() {
  return (
    <div className={s.hApp}>
      <p className={s.hAppTop}><b>Before Lisbon</b><span>App</span></p>
      <p className={s.hHabit}>Portuguese, 10 min<small>4 days</small></p>
      <div className={s.hWeek}>
        {WEEK.map((d, i) => <span key={i} data-on={i < 4 || undefined} data-now={i === 4 || undefined}><small>{d}</small><i><Tick /></i></span>)}
      </div>
      <span className={s.hPress}>Done today</span>
    </div>
  );
}

/** A named cursor as HTML: the arrow and a flag in the AI's colour, at a fixed readable size. */
export function Flag({ name, color, className = "" }: { name: string; color: string; className?: string }) {
  return (
    <span className={`${s.flag} ${className}`} style={{ "--fc": color } as React.CSSProperties} aria-hidden="true">
      <svg viewBox="0 0 15 21"><path d="M1 1 L1 18 L5.6 13.6 L9 21 L12 19.6 L8.7 12.4 L14.6 12.2 Z" /></svg>
      <span>{name}</span>
    </span>
  );
}

/** A named cursor in SVG (for the big whiteboard, where it moves along the arrow). */
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

const ROWS = ["Book the flights", "Find a flat in Alfama", "Pastéis de Belém, early", "Tram 28 before nine"];
const TYPED = "Ask Marta about the fado place";

/** The Lisbon note at writing size. The rows tick; the last line is typed when the chapter arrives. */
export function Note({ live }: { live: boolean }) {
  const [on, setOn] = useState([true, false, false, false, false]);
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
      <p className={`${s.decided} ${s.sheetDecided}`}><b>Decided:</b> {DECIDED}</p>
      <div className={s.sheetSplit}>
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
        <figure className={s.photo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lab/s/tram-v1.webp" alt="Tram 28 on a Lisbon hill, printed in orange and green" width="560" height="700" loading="lazy" />
        </figure>
      </div>
      <p className={s.sheetText}>Friday is on the whiteboard: <a className={s.noteLink} href="#s-draw">Friday in Lisbon</a></p>
    </div>
  );
}

/* ───────────────────────── The whiteboard ───────────────────────── */

type Pt = [number, number];
type Node = { kind: "ellipse" | "box" | "diamond"; c: Pt; w: number; h: number; label: string[] };
type Arrow = { a: Pt; c1: Pt; c2: Pt; b: Pt; label?: [string, Pt] };
export type Board = { view: [number, number]; font: number; nodes: Node[]; arrows: Arrow[]; last: Arrow; title?: Pt; tip?: Pt };

// Friday in Lisbon, left to right: land, drop the bags, and the weather decides; both ways end at the sunset.
export const WIDE: Board = {
  // The title is the board's frame name, small, top left. `tip` is where your pencil is: it has just
  // drawn the first shape (Claude draws the last arrow).
  view: [1200, 540], font: 30, title: [4, 26], tip: [22, 146],
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
export const TALL: Board = {
  view: [358, 600], font: 22,
  nodes: [
    { kind: "ellipse", c: [179, 50], w: 184, h: 66, label: ["Land 10:40"] },
    { kind: "box", c: [179, 162], w: 224, h: 62, label: ["Bags to Alfama"] },
    { kind: "diamond", c: [179, 292], w: 170, h: 112, label: ["Raining?"] },
    { kind: "box", c: [86, 430], w: 152, h: 64, label: ["Tile museum"] },
    { kind: "box", c: [272, 430], w: 160, h: 70, label: ["Belém by", "the river"] },
    { kind: "ellipse", c: [179, 558], w: 244, h: 74, label: ["Sunset at Graça"] },
  ],
  arrows: [
    { a: [179, 87], c1: [177, 100], c2: [181, 114], b: [179, 127] },
    { a: [179, 197], c1: [177, 210], c2: [181, 222], b: [179, 232] },
    { a: [134, 322], c1: [112, 344], c2: [94, 370], b: [88, 394], label: ["yes", [92, 348]] },
    { a: [224, 322], c1: [246, 344], c2: [264, 370], b: [270, 390], label: ["no", [268, 348]] },
    { a: [96, 466], c1: [102, 486], c2: [114, 506], b: [124, 522] },
  ],
  last: { a: [262, 469], c1: [258, 488], c2: [246, 508], b: [232, 522] },
};

function diamond(r: () => number, c: Pt, w: number, h: number) {
  const [x, y] = c, t: Pt = [x, y - h / 2], rr: Pt = [x + w / 2, y], b: Pt = [x, y + h / 2], l: Pt = [x - w / 2, y];
  return [line(r, ...t, ...rr, 3), line(r, ...rr, ...b, 3), line(r, ...b, ...l, 3), line(r, ...l, ...t, 3)].join(" ");
}

export function shape(r: () => number, n: Node) {
  if (n.kind === "ellipse") return ellipse(r, n.c[0], n.c[1], n.w / 2, n.h / 2);
  if (n.kind === "diamond") return diamond(r, n.c, n.w, n.h);
  return box(r, n.c[0] - n.w / 2, n.c[1] - n.h / 2, n.w, n.h, 18);
}

/** A board's nodes and arrows in ink, and their words. A plain function, not a component: it draws
 *  from the caller's seeded random, in the caller's render, so the server and the browser agree. */
function boardInk(g: Board, r: () => number, arrowHead: number) {
  return (
    <>
      <g className={s.chalk}>
        {g.nodes.map((n, i) => <path key={i} d={shape(r, n)} />)}
        {g.arrows.map((a, i) => <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 2)} /><path d={head(r, a.c2, a.b, arrowHead)} /></g>)}
      </g>
      {g.nodes.map((n, i) => (
        <text key={i} x={n.c[0]} y={n.c[1] + g.font * 0.34 - (n.label.length - 1) * g.font * 0.55} fontSize={g.font} textAnchor="middle" className={s.chalkText}>
          {n.label.map((l, j) => <tspan key={j} x={n.c[0]} dy={j ? g.font * 1.1 : 0}>{l}</tspan>)}
        </text>
      ))}
      {g.arrows.map((a, i) => a.label && <text key={i} x={a.label[1][0]} y={a.label[1][1]} fontSize={g.font * 0.86} textAnchor="middle" className={s.chalkNote}>{a.label[0]}</text>)}
    </>
  );
}

const cubic = (a: Arrow) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

/** The whiteboard, in cream ink on the green. Claude's cursor draws the last arrow as the chapter's
 *  dwell goes from 0 to 1 (`bind` hands the setter to the scroll loop; no React render per frame). */
export function BoardBig({ tall, bind, tipRef }: { tall?: boolean; bind: (set: (k: number) => void) => () => void; tipRef?: React.Ref<SVGCircleElement> }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 17 : 7);
  const [W, H] = g.view;
  const lastD = curve(r, g.last.a, g.last.c1, g.last.c2, g.last.b, 2);
  const lastHead = head(r, g.last.c2, g.last.b, tall ? 15 : 22);
  const ink = boardInk(g, r, tall ? 13 : 20);
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
      {g.title && <text x={g.title[0]} y={g.title[1]} fontSize={g.font * 0.8} className={s.boardTitle}>Friday in Lisbon</text>}
      {g.tip && <circle ref={tipRef} cx={g.tip[0]} cy={g.tip[1]} r="1" fill="none" />}
      {ink}
      <path ref={path} d={cubic(g.last)} fill="none" stroke="none" />
      <g mask={`url(#${mid})`} className={s.chalkClaude}><path d={lastD} /></g>
      <g ref={tip} className={s.chalkClaude}><path d={lastHead} /></g>
      <g ref={cur} style={{ opacity: 0 }}><g transform={`scale(${sc})`}><Cursor x={0} y={0} name="Claude" color={CLAUDE} /></g></g>
    </svg>
  );
}

/* ───────────────────────── The app ───────────────────────── */

export const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
export const TODAY = 4;

