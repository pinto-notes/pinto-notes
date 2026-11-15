"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, rng } from "./hand";
import s from "./s.module.css";

// The three things on study X's page, all carrying one real decision: whether to take a job offer
// from Studio North. A note (what Ana said on the call, the pros and cons, and the decision: wait
// until March), a whiteboard (the decision mapped: the options, what each leads to, the path taken),
// and a small app (the habit they're building meanwhile: writing before work). The first screen shows
// the note; each chapter shows its one at full size, with the same words.

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
export const DECIDED = "Wait until March. Finish the launch first.";
export const ADDED = "March call: team, pay and start date";
/** What Ana said on the call (the note's first lines; the first screen shows two). */
export const CALL = ["Lead designer, a team of six", "They can hold the role until April", "Two days a week in the office"];

/** "Added by ChatGPT · Undo", in the note's own flow (never over the words it marks). Undo works. */
export function Receipt({ undone, onFlip, live = true }: { undone: boolean; onFlip: () => void; live?: boolean }) {
  return (
    <p className={s.receipt} data-undone={undone || undefined}>
      {undone
        ? <><span>Undone</span><button type="button" onClick={onFlip} tabIndex={live ? 0 : -1}>Redo</button></>
        : <><span className={s.receiptMark}><AIGlyph name="openai" size={11} color="#fff" /></span><span><span className={s.rcBy}>Added by </span>ChatGPT</span><b aria-hidden="true">·</b><button type="button" onClick={onFlip} tabIndex={live ? 0 : -1}>Undo</button></>}
    </p>
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

/** A named cursor in SVG (for the big whiteboard, where it moves along the arrow). `left`: its name
 *  trails on the left, behind a cursor drawing left to right, so it never covers where it's going. */
export function Cursor({ x, y, name, color, scale = 1, left }: { x: number; y: number; name: string; color: string; scale?: number; left?: boolean }) {
  const w = name.length * 7.4 + 18, rx = left ? -6 - w : 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill={color} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x={rx} y="15" width={w} height="22" rx="7" fill={color} />
      <text x={rx + w / 2} y="30.5" className={s.cursorName} textAnchor="middle">{name}</text>
    </g>
  );
}

/* ───────────────────────── The note ───────────────────────── */

export const PROS = ["A bigger role", "A team to learn from"];
export const CONS = ["The launch is six weeks out", "I’d leave it half done"];

/** The job offer note at writing size: notes from the call, the pros and cons as a table, and the
 *  decision, which is typed in when the chapter arrives. */
export function Note({ live }: { live: boolean }) {
  const [n, setN] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (!live || started.current) return;
    started.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("t")) { setN(DECIDED.length); return; }
    let i = 0, t = 0;
    const step = () => { i++; setN(i); if (i < DECIDED.length) t = window.setTimeout(step, 36 + ((i * 37) % 5) * 9); };
    t = window.setTimeout(step, 450);
    return () => clearTimeout(t);
  }, [live]);
  const typing = n < DECIDED.length;
  return (
    <div className={s.sheet}>
      <p className={s.sheetDate}>Today at 09:41</p>
      <h3 className={s.sheetTitle}>Job offer: Studio North</h3>
      <p className={s.sheetSub}>From the call with Ana</p>
      <ul className={s.bullets}>
        {CALL.map((c, i) => <li key={c} data-more={i === 2 || undefined}>{c}</li>)}
      </ul>
      <table className={s.table}>
        <thead><tr><th>For</th><th>Against</th></tr></thead>
        <tbody>{PROS.map((p, i) => <tr key={p}><td>{p}</td><td>{CONS[i]}</td></tr>)}</tbody>
      </table>
      <p className={`${s.decided} ${s.sheetDecided}`} data-typing>
        <b>Decided:</b> <span>{DECIDED.slice(0, n)}</span>{typing && <b className={s.caret} aria-hidden="true" />}<span className={s.askRest} aria-hidden="true">{DECIDED.slice(n)}</span>
      </p>
      <p className={`${s.sheetText} ${s.sheetAside}`}>The options are on the whiteboard: <a className={s.noteLink} href="#s-draw">Studio North</a></p>
    </div>
  );
}

/* ───────────────────────── The whiteboard ───────────────────────── */

type Pt = [number, number];
/** A shape on the board. `on`: on the path you took (filled green, as Pinto's whiteboard fills a
 *  shape). `off`: an option you didn't take (a dashed grey line). */
export type BNode = { kind: "ellipse" | "box"; c: Pt; w: number; h: number; label: string[]; on?: boolean; off?: boolean };
export type BArrow = { a: Pt; c1: Pt; c2: Pt; b: Pt; off?: boolean };
export type Board = { view: [number, number]; font: number; nodes: BNode[]; arrows: BArrow[]; last: BArrow; rest: Pt };

/** Pinto's whiteboard colours: ink, a pale green fill, and grey for what's crossed out. */
export const INK = "#1e1e1e";
export const FILL = "#c9efcf";
export const GREY = "#a39d95";

// The decision, mapped left to right. The offer has three options; each leads somewhere. The middle
// row is the path taken: wait until March, finish the launch, then talk to Ana. The other two are
// dashed. Claude draws the last arrow, from finishing the launch to the March call.
export const WIDE: Board = {
  view: [1200, 420], font: 28, rest: [-40, 34],
  nodes: [
    { kind: "ellipse", c: [100, 210], w: 184, h: 100, label: ["The offer"] },
    { kind: "box", c: [372, 70], w: 216, h: 84, label: ["Take it now"], off: true },
    { kind: "box", c: [372, 210], w: 216, h: 104, label: ["Wait until", "March"], on: true },
    { kind: "box", c: [372, 350], w: 216, h: 84, label: ["Say no"], off: true },
    { kind: "box", c: [650, 70], w: 216, h: 100, label: ["Leave", "mid-launch"], off: true },
    { kind: "box", c: [650, 210], w: 216, h: 104, label: ["Finish the", "launch"], on: true },
    { kind: "box", c: [650, 350], w: 216, h: 100, label: ["Stay where", "I am"], off: true },
    { kind: "ellipse", c: [1040, 210], w: 264, h: 136, label: ["Talk to Ana", "in March"], on: true },
  ],
  arrows: [
    { a: [168, 172], c1: [200, 112], c2: [222, 74], b: [258, 70], off: true },
    { a: [196, 210], c1: [214, 208], c2: [236, 212], b: [258, 210] },
    { a: [168, 248], c1: [200, 308], c2: [222, 346], b: [258, 350], off: true },
    { a: [484, 70], c1: [500, 69], c2: [518, 71], b: [536, 70], off: true },
    { a: [484, 210], c1: [500, 209], c2: [518, 211], b: [536, 210] },
    { a: [484, 350], c1: [500, 349], c2: [518, 351], b: [536, 350], off: true },
  ],
  last: { a: [762, 210], c1: [812, 204], c2: [858, 216], b: [902, 210] },
};
// The same map standing up, for a phone: the offer, its three options side by side, where each
// leads, and the March call. Claude's arrow is the last step down.
export const TALL: Board = {
  view: [340, 356], font: 16, rest: [60, -30],
  nodes: [
    { kind: "ellipse", c: [170, 28], w: 150, h: 48, label: ["The offer"] },
    { kind: "box", c: [57, 108], w: 106, h: 56, label: ["Take it", "now"], off: true },
    { kind: "box", c: [170, 108], w: 106, h: 56, label: ["Wait until", "March"], on: true },
    { kind: "box", c: [283, 108], w: 106, h: 56, label: ["Say no"], off: true },
    { kind: "box", c: [57, 204], w: 106, h: 56, label: ["Leave mid-", "launch"], off: true },
    { kind: "box", c: [170, 204], w: 106, h: 56, label: ["Finish the", "launch"], on: true },
    { kind: "box", c: [283, 204], w: 106, h: 56, label: ["Stay where", "I am"], off: true },
    { kind: "ellipse", c: [170, 316], w: 200, h: 64, label: ["Talk to Ana", "in March"], on: true },
  ],
  arrows: [
    { a: [118, 42], c1: [90, 52], c2: [66, 64], b: [60, 78], off: true },
    { a: [170, 53], c1: [169, 60], c2: [171, 70], b: [170, 78] },
    { a: [222, 42], c1: [250, 52], c2: [274, 64], b: [280, 78], off: true },
    { a: [57, 138], c1: [56, 150], c2: [58, 162], b: [57, 174], off: true },
    { a: [170, 138], c1: [169, 150], c2: [171, 162], b: [170, 174] },
    { a: [283, 138], c1: [282, 150], c2: [284, 162], b: [283, 174], off: true },
  ],
  last: { a: [170, 234], c1: [168, 250], c2: [172, 266], b: [170, 282] },
};

export function shape(r: () => number, n: { kind: "ellipse" | "box"; c: Pt; w: number; h: number }, rad = 16) {
  if (n.kind === "ellipse") return ellipse(r, n.c[0], n.c[1], n.w / 2, n.h / 2);
  return box(r, n.c[0] - n.w / 2, n.c[1] - n.h / 2, n.w, n.h, rad);
}

/** A shape's fill: the same outline, closed and filled, as Pinto draws a filled shape. */
function fillOf(n: BNode, rad: number) {
  if (n.kind === "ellipse") return <ellipse cx={n.c[0]} cy={n.c[1]} rx={n.w / 2 - 1} ry={n.h / 2 - 1} fill={FILL} />;
  return <rect x={n.c[0] - n.w / 2 + 1} y={n.c[1] - n.h / 2 + 1} width={n.w - 2} height={n.h - 2} rx={rad} fill={FILL} />;
}

/** The words in a shape, centred, one or two lines. */
export function words(c: Pt, label: string[], font: number, fill: string) {
  return (
    <text x={c[0]} y={c[1] + font * 0.34 - (label.length - 1) * font * 0.56} fontSize={font} textAnchor="middle" fill={fill}>
      {label.map((l, j) => <tspan key={j} x={c[0]} dy={j ? font * 1.12 : 0}>{l}</tspan>)}
    </text>
  );
}

/** A board's shapes, arrows and words, in Pinto's whiteboard ink. A plain function, not a component:
 *  it draws from the caller's seeded random, in the caller's render, so the server and the browser agree. */
export function boardInk(g: Pick<Board, "nodes" | "arrows" | "font">, r: () => number, arrowHead: number, rad = 16) {
  return (
    <>
      {g.nodes.filter((n) => n.on).map((n, i) => <g key={i}>{fillOf(n, rad)}</g>)}
      <g className={s.ink}>
        {g.nodes.map((n, i) => <path key={i} d={shape(r, n, rad)} data-off={n.off || undefined} />)}
        {g.arrows.map((a, i) => <g key={i} data-off={a.off || undefined}><path d={curve(r, a.a, a.c1, a.c2, a.b, 1.5)} /><path d={head(r, a.c2, a.b, arrowHead)} /></g>)}
      </g>
      {g.nodes.map((n, i) => <g key={i}>{words(n.c, n.label, g.font, n.off ? GREY : INK)}</g>)}
    </>
  );
}

const cubic = (a: BArrow) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

/** The whiteboard map in Pinto's ink on its white canvas. Claude's cursor draws the last arrow as the
 *  chapter's dwell goes from 0 to 1 (`bind` hands the setter to the scroll loop; no React render per frame). */
export function BoardBig({ tall, bind }: { tall?: boolean; bind: (set: (k: number) => void) => () => void }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 17 : 7);
  const [W, H] = g.view;
  const ink = boardInk(g, r, tall ? 10 : 18, tall ? 10 : 16);
  const lastD = curve(r, g.last.a, g.last.c1, g.last.c2, g.last.b, 1.5);
  const lastHead = head(r, g.last.c2, g.last.b, tall ? 10 : 18);
  const path = useRef<SVGPathElement>(null), ink2 = useRef<SVGPathElement>(null), cur = useRef<SVGGElement>(null), tip = useRef<SVGGElement>(null);
  const sc = tall ? 0.95 : 1.35;
  useEffect(() => {
    const p = path.current; if (!p) return;
    const len = p.getTotalLength();
    const set = (k: number) => {
      // Claude draws over the first 70% of the dwell, then lets go and rests beside the arrow.
      const u = Math.min(1, Math.max(0, (k - 0.06) / 0.64)), e = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
      const q = p.getPointAtLength(len * e);
      if (ink2.current) ink2.current.style.strokeDashoffset = (1 - e).toFixed(4);
      if (tip.current) tip.current.style.opacity = e > 0.985 ? "1" : "0";
      const c = cur.current;
      if (c) {
        const done = e > 0.985;
        const x = done ? g.last.b[0] + g.rest[0] : q.x, y = done ? g.last.b[1] + g.rest[1] : q.y;
        c.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        c.style.opacity = u <= 0 ? "0" : "1";
      }
    };
    set(0);
    return bind(set);
  }, [bind, g]);
  return (
    <svg className={`${s.board} ${hand.className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {ink}
      <path ref={path} d={cubic(g.last)} fill="none" stroke="none" />
      <g className={s.inkClaude}><path ref={ink2} d={lastD} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} /></g>
      <g ref={tip} className={s.inkClaude}><path d={lastHead} /></g>
      <g ref={cur} style={{ opacity: 0 }}><g transform={`scale(${sc})`}><Cursor x={0} y={0} name="Claude" color={CLAUDE} left={!tall} /></g></g>
    </svg>
  );
}

/** The whiteboard as Pinto shows it: a white canvas with its name at the top and its tools at the
 *  bottom, the map in the middle. */
export function Canvas({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className={s.canvas}>
      <p className={s.canvasBar}><span className={s.canvasBack}><svg viewBox="0 0 10 16"><path d="M7.5 2.5 L2.5 8 L7.5 13.5" /></svg></span>{title}</p>
      <div className={s.canvasBoard}>{children}</div>
      <div className={s.tools} aria-hidden="true">
        <svg viewBox="0 0 20 20"><path d="M5 3 L5 15 L8.2 12 L10.6 17 L12.6 16 L10.3 11.1 L14.6 11 Z" /></svg>
        <svg viewBox="0 0 20 20"><path d="M4 16 L16 4" /></svg>
        <svg viewBox="0 0 20 20" data-on><rect x="3.5" y="5" width="13" height="10" rx="2" /></svg>
        <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6.5" /></svg>
        <svg viewBox="0 0 20 20"><path d="M10 3 L17 10 L10 17 L3 10 Z" /></svg>
        <svg viewBox="0 0 20 20"><path d="M4 16 L16 4 M9 4 H16 V11" /></svg>
        <svg viewBox="0 0 20 20"><text x="10" y="14.5" textAnchor="middle">Aa</text></svg>
      </div>
    </div>
  );
}

/* ───────────────────────── The app ───────────────────────── */

export const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
export const TODAY = 4;

