"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, rng } from "./hand";
import s from "./s.module.css";

// The three things on study W's page, all carrying one habit: cooking at home. A note (the decision,
// and the recipe ChatGPT wrote into your Recipes folder because of it), a whiteboard (next week's
// dinners, with the shopping list), and a small app (home-cooked dinners this week). The first screen
// shows the note; each chapter shows its one at full size, with the same words.

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
export const DECIDED = "Cooking at home five nights a week.";
/** ChatGPT's line under it: where it put the recipe, and the recipe (a link to its note). */
export const ADDED_IN = "New in Recipes: ";
export const ADDED_RECIPE = "Lemon chicken, 25 min";
export const ADDED = ADDED_IN + ADDED_RECIPE;

/** The Recipes folder, as the notes list shows it: title, then how long it takes. */
export const RECIPES: [string, string][] = [
  ["Lemon chicken", "25 min"],
  ["Lentil soup", "30 min"],
  ["Pasta with greens", "20 min"],
  ["Chickpea curry", "35 min"],
  ["Shakshuka", "25 min"],
];
/** The recipe ChatGPT writes into Recipes when it plans next week (Your AI). */
export const NEW_RECIPE: [string, string] = ["Miso salmon", "20 min"];

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

/** The folder glyph the notes list uses. */
export const Folder = () => (
  <svg className={s.folderIcon} viewBox="0 0 20 16" aria-hidden="true"><path d="M1.5 3.2c0-.9.7-1.7 1.7-1.7h4l1.8 2h7.8c.9 0 1.7.8 1.7 1.7v7.6c0 .9-.8 1.7-1.7 1.7H3.2c-1 0-1.7-.8-1.7-1.7z" /></svg>
);

/* ───────────────────────── The note: the Recipes folder, one recipe open ───────────────────────── */

const INGREDIENTS = ["4 chicken thighs", "1 lemon, zest and juice", "3 garlic cloves", "Olive oil, salt"];
const TYPED = "A few sprigs of thyme";
const STEPS = ["Mash the zest, garlic and oil. Rub it in.", "Fry skin side down for 12 min, then turn.", "Squeeze over the lemon. Rest 5 min."];

/** Recipes, as in Pinto: the folder's notes on the left, Lemon chicken open at writing size. The
 *  ingredients are a checklist that ticks; the last one is typed when the chapter arrives. */
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
  const rows = [...INGREDIENTS, TYPED];
  return (
    <div className={s.sheet}>
      <nav className={s.folder} aria-label="Recipes">
        <p className={s.folderName}><Folder />Recipes</p>
        <ul>
          {RECIPES.map(([name, time], i) => (
            <li key={name} data-on={i === 0 || undefined}><b>{name}</b><span>{time}</span></li>
          ))}
        </ul>
      </nav>
      <div className={s.recipe}>
        <p className={s.crumb}><svg viewBox="0 0 10 16" aria-hidden="true"><path d="M8 2 L2 8 L8 14" /></svg>Recipes</p>
        <h3 className={s.sheetTitle}>Lemon chicken</h3>
        <p className={s.sheetMeta}>25 min · Serves 2</p>
        <p className={s.sheetH}>Ingredients</p>
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
        <p className={s.sheetH}>Steps</p>
        <ol className={s.steps}>{STEPS.map((t) => <li key={t}>{t}</li>)}</ol>
      </div>
    </div>
  );
}

/* ───────────────────────── The whiteboard: next week's dinners ───────────────────────── */

export type Pt = [number, number];
/** A shape on the board. A day is a box with its day's name over the recipe (or, on a phone, beside
 *  it); `open` is a day still to plan, drawn dashed. */
export type Node = { kind: "ellipse" | "box"; c: Pt; w: number; h: number; label: string[]; day?: string; open?: boolean; size?: number; lh?: number };
export type Arrow = { a: Pt; c1: Pt; c2: Pt; b: Pt };
export type Board = { view: [number, number]; font: number; day: number; dayBeside?: boolean; nodes: Node[]; arrows: Arrow[]; last: Arrow; title?: Pt; titleSize?: number };

// Next week, Monday to Friday, a recipe in each box and Friday still open. Each cooked day feeds the
// shopping list; Claude draws Thursday's arrow, the last one. The decision sits beside it.
export const WIDE: Board = {
  view: [1200, 540], font: 27, day: 22, title: [4, 24], titleSize: 22,
  nodes: [
    { kind: "box", c: [132, 142], w: 212, h: 112, day: "Mon", label: ["Lemon chicken"] },
    { kind: "box", c: [366, 142], w: 212, h: 112, day: "Tue", label: ["Lentil soup"] },
    { kind: "box", c: [600, 142], w: 212, h: 112, day: "Wed", label: ["Shakshuka"] },
    { kind: "box", c: [834, 142], w: 212, h: 112, day: "Thu", label: ["Chickpea curry"] },
    { kind: "box", c: [1068, 142], w: 212, h: 112, day: "Fri", label: [], open: true },
    { kind: "box", c: [300, 428], w: 400, h: 164, label: ["Shopping list", "chicken, lemons, thyme", "lentils, eggs, chickpeas"], size: 24, lh: 1.45 },
    { kind: "ellipse", c: [952, 438], w: 330, h: 112, label: ["5 nights at home"] },
  ],
  arrows: [
    { a: [132, 202], c1: [134, 250], c2: [150, 300], b: [168, 344] },
    { a: [366, 202], c1: [362, 252], c2: [326, 300], b: [304, 344] },
    { a: [596, 202], c1: [582, 262], c2: [486, 302], b: [436, 344] },
  ],
  // Claude's: from Thursday, down and across, into the list's right side.
  last: { a: [830, 202], c1: [820, 330], c2: [640, 440], b: [508, 432] },
};
// The same board for a phone: the days in a column, the day's name beside its box, the list and the
// decision on the right.
export const TALL: Board = {
  view: [358, 338], font: 17.5, day: 15, dayBeside: true, title: [2, 15], titleSize: 15,
  nodes: [
    { kind: "box", c: [124, 50], w: 168, h: 44, day: "Mon", label: ["Lemon chicken"] },
    { kind: "box", c: [124, 108], w: 168, h: 44, day: "Tue", label: ["Lentil soup"] },
    { kind: "box", c: [124, 166], w: 168, h: 44, day: "Wed", label: ["Shakshuka"] },
    { kind: "box", c: [124, 224], w: 168, h: 44, day: "Thu", label: ["Chickpea curry"] },
    { kind: "box", c: [124, 282], w: 168, h: 44, day: "Fri", label: [], open: true },
    { kind: "box", c: [298, 124], w: 112, h: 120, label: ["Shopping", "list"] },
    { kind: "ellipse", c: [298, 272], w: 116, h: 74, label: ["5 nights", "at home"], size: 16 },
  ],
  arrows: [
    { a: [211, 50], c1: [226, 52], c2: [238, 58], b: [246, 70] },
    { a: [211, 108], c1: [222, 108], c2: [232, 108], b: [240, 108] },
    { a: [211, 166], c1: [222, 166], c2: [232, 164], b: [240, 160] },
  ],
  last: { a: [211, 224], c1: [230, 224], c2: [246, 210], b: [254, 190] },
};

/** A shape, drawn by hand (an open day is dashed, in CSS). */
export function shape(r: () => number, n: Node) {
  if (n.kind === "ellipse") return ellipse(r, n.c[0], n.c[1], n.w / 2, n.h / 2);
  return box(r, n.c[0] - n.w / 2, n.c[1] - n.h / 2, n.w, n.h, 16);
}

/** A node's words: its day (over the recipe, or beside the box on a phone) and its label. */
export function nodeWords(g: { font: number; day: number; dayBeside?: boolean }, n: Node, key?: React.Key, showDay = true) {
  const size = n.size ?? g.font, lh = n.lh ?? 1.1;
  const lines = n.label;
  const stacked = n.day && !g.dayBeside;
  // A day's recipe sits under its day's name; otherwise the label is centred in the shape.
  const y0 = stacked ? n.c[1] + size * 0.62 : n.c[1] + size * 0.34 - (lines.length - 1) * size * lh * 0.5;
  return (
    <g key={key}>
      {n.day && showDay && (stacked
        ? <text x={n.c[0]} y={n.c[1] - g.day * 0.55} fontSize={g.day} textAnchor="middle" className={s.chalkNote}>{n.day}</text>
        : <text x={n.c[0] - n.w / 2 - 8} y={n.c[1] + g.day * 0.34} fontSize={g.day} textAnchor="end" className={s.chalkNote}>{n.day}</text>)}
      {lines.length > 0 && (
        <text x={n.c[0]} y={y0} fontSize={size} textAnchor="middle" className={s.chalkText}>
          {lines.map((l, j) => <tspan key={j} x={n.c[0]} dy={j ? size * lh : 0}>{l}</tspan>)}
        </text>
      )}
    </g>
  );
}

/** A board's nodes and arrows in ink, and their words. A plain function, not a component: it draws
 *  from the caller's seeded random, in the caller's render, so the server and the browser agree. */
function boardInk(g: Board, r: () => number, arrowHead: number) {
  return (
    <>
      <g className={s.chalk}>
        {g.nodes.map((n, i) => <path key={i} d={shape(r, n)} data-open={n.open || undefined} />)}
        {g.arrows.map((a, i) => <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 2)} /><path d={head(r, a.c2, a.b, arrowHead)} /></g>)}
      </g>
      {g.nodes.map((n, i) => nodeWords(g, n, i))}
    </>
  );
}

const cubic = (a: Arrow) => `M${a.a[0]} ${a.a[1]} C${a.c1[0]} ${a.c1[1]} ${a.c2[0]} ${a.c2[1]} ${a.b[0]} ${a.b[1]}`;

/** The whiteboard, in cream ink on the green. Claude's cursor draws the last arrow as the chapter's
 *  dwell goes from 0 to 1 (`bind` hands the setter to the scroll loop; no React render per frame). */
export function BoardBig({ tall, bind }: { tall?: boolean; bind: (set: (k: number) => void) => () => void }) {
  const g = tall ? TALL : WIDE;
  const r = rng(tall ? 17 : 7);
  const [W, H] = g.view;
  const lastD = curve(r, g.last.a, g.last.c1, g.last.c2, g.last.b, 2);
  const lastHead = head(r, g.last.c2, g.last.b, tall ? 10 : 20);
  const ink = boardInk(g, r, tall ? 9 : 18);
  const path = useRef<SVGPathElement>(null), ink2 = useRef<SVGPathElement>(null), cur = useRef<SVGGElement>(null), tip = useRef<SVGGElement>(null);
  const sc = tall ? 0.95 : 1.45;
  const rest: Pt = tall ? [-34, 14] : [16, 22];
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
        const x = done ? g.last.b[0] + rest[0] : q.x, y = done ? g.last.b[1] + rest[1] : q.y;
        c.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        c.style.opacity = u <= 0 ? "0" : "1";
      }
    };
    set(0);
    return bind(set);
  }, [bind, g, rest]);
  return (
    <svg className={`${s.board} ${hand.className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {g.title && <text x={g.title[0]} y={g.title[1]} fontSize={g.titleSize} className={s.boardTitle}>Next week</text>}
      {ink}
      <path ref={path} d={cubic(g.last)} fill="none" stroke="none" />
      <g className={s.chalkClaude}><path ref={ink2} d={lastD} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} /></g>
      <g ref={tip} className={s.chalkClaude}><path d={lastHead} /></g>
      <g ref={cur} style={{ opacity: 0 }}><g transform={`scale(${sc})`}><Cursor x={0} y={0} name="Claude" color={CLAUDE} /></g></g>
    </svg>
  );
}

/* ───────────────────────── The app ───────────────────────── */

/** This week, Monday to Friday: what was cooked, and whether it was at home. Friday is today. */
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
export const DINNERS = ["Pasta with greens", "Lemon chicken", "Dinner out", "Lentil soup", "Shakshuka"];
export const COOKED = [true, true, false, true, false];
export const TODAY = 4;
/** The week's goal: the decision. */
export const GOAL = 5;
