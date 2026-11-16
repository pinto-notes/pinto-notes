"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import s from "./s.module.css";

// The things on study Z's page (round 16, option C after the round 11 council), one person's week,
// several parts of one life. The first screen is that week in one note: three dinners (the last a
// recipe ChatGPT just wrote into Recipes, asked for in a small ChatGPT request), the Studio North
// question and what was decided, and the writing habit, 4 of 5. Then each chapter shows one part at
// full size: a book note among a life's notes, a whiteboard (the job offer from Studio North, mapped:
// now or March?), a small app (the habits they're building), and one request in ChatGPT that lands in
// all three.

export const hand = localFont({ src: "./Excalifont-Regular.woff2", display: "block" });

/** ChatGPT's colour and Claude's, the same everywhere on the page (the app marks their edits so). */
export const GPT = "#10a37f";
export const CLAUDE = "#d97757";
/** Your cursor: ink, outlined in paper, like a real pointer. */
export const YOU = "#24170d";

export const Tick = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 12.4l3.6 3.6 7.4-7.6" /></svg>
);

/** The decision in the dinners note (Your AI). Same words everywhere. */
export const DECIDED = "Cooking at home five nights a week.";

/** The first screen's note: this week, today Thursday. Two dinners cooked, and tonight's: the recipe
 *  ChatGPT just wrote into Recipes when asked for a quick dinner (a link to it). Then the work
 *  question and what was decided, and the habit. */
export const WEEK_NOTE = {
  title: "This week",
  dinners: [["Tue", "Miso salmon"], ["Wed", "Lentil soup"]] as [string, string][],
  added: ["Thu", "Lemon chicken"] as [string, string],
  addedIn: "New in Recipes:",
  ask: "Add a quick dinner for Thursday.",
  question: "Studio North: now or March?",
  decided: "Wait until March.",
};

/** The book note Notes opens: two highlights, what to try, and what the reader decided. */
export const BOOK = {
  title: "Deep Work", author: "Cal Newport",
  marks: ["Deep work is rare, and worth more every year.", "Focus is a skill. Train it."],
  decided: "Write 30 min before work.",
};

/** The notes list in Notes: a whole life's notes, newest first, the book note open. Title, then where
 *  it lives and its first words. */
export const NOTES: { title: string; sub: string; on?: boolean }[] = [
  { title: "Deep Work", sub: "Reading · Cal Newport", on: true },
  { title: "Miso salmon", sub: "Recipes · 20 min" },
  { title: "Studio North", sub: "Work · Wait until March" },
  { title: "Kyoto in April", sub: "Trips · 6 days" },
  { title: "Morning run", sub: "Health · 3 a week" },
];

/** Next week's dinners, from your recipes: what ChatGPT writes into the dinners note (Your AI). */
export const DINNERS: [string, string][] = [
  ["Mon", "Lemon chicken"],
  ["Tue", "Miso salmon"],
  ["Wed", "Lentil soup"],
  ["Thu", "Dal"],
  ["Sun", "Shakshuka"],
];
/** The two questions ChatGPT adds to the board for the call. */
export const QUESTIONS = ["Can the start move to March?", "What's the first project?"];

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

/** A named cursor in SVG (for the big whiteboard, where it moves along the arrow). `above`: the name
 *  rides over the arrow's tip, so it never sits on the words the arrow points at. */
export function Cursor({ x, y, name, color, scale = 1, above, left }: { x: number; y: number; name: string; color: string; scale?: number; above?: boolean; left?: boolean }) {
  // `left`: the name sits above and to the left of the pointer, clear of a stroke drawn down and left.
  const w = name.length * 7.4 + 18, ty = above || left ? -30 : 15, tx = left ? -(w + 4) : 14;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill={color} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x={tx} y={ty} width={w} height="22" rx="7" fill={color} />
      <text x={tx + w / 2} y={ty + 15.5} className={s.cursorName} textAnchor="middle">{name}</text>
    </g>
  );
}

/** The folder glyph the notes list uses. */
export const Folder = () => (
  <svg className={s.folderIcon} viewBox="0 0 20 16" aria-hidden="true"><path d="M1.5 3.2c0-.9.7-1.7 1.7-1.7h4l1.8 2h7.8c.9 0 1.7.8 1.7 1.7v7.6c0 .9-.8 1.7-1.7 1.7H3.2c-1 0-1.7-.8-1.7-1.7z" /></svg>
);

/* ───────────────────────── The note: your notes, the book note open ───────────────────────── */

/** What to try from the book, a checklist (the first done, the last typed as the chapter arrives). */
const TRY = ["Phone in another room", "Schedule every minute"];
const TYPED = "A shutdown ritual at 6";

/** Your notes, as in Pinto: a whole life's notes on the left (a recipe, the job decision, a trip), the
 *  book note open at writing size: two highlights, what to try as a checklist that ticks (its last line
 *  typed when the chapter arrives), and what the reader decided. */
export function Note({ live }: { live: boolean }) {
  const [on, setOn] = useState([true, false, false]);
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
  const rows = [...TRY, TYPED];
  return (
    <div className={s.sheet}>
      <nav className={s.folder} aria-label="Notes">
        <p className={s.folderName}>Notes</p>
        <ul>
          {NOTES.map((n) => (
            <li key={n.title} data-on={n.on || undefined}><b>{n.title}</b><span>{n.sub}</span></li>
          ))}
        </ul>
      </nav>
      <div className={s.recipe}>
        <p className={s.crumb}><svg viewBox="0 0 10 16" aria-hidden="true"><path d="M8 2 L2 8 L8 14" /></svg>Reading</p>
        <h3 className={s.sheetTitle}>{BOOK.title}</h3>
        <p className={s.sheetMeta}><Folder />Reading · {BOOK.author}</p>
        <p className={s.sheetH}>Highlights</p>
        <ul className={s.quotes}>{BOOK.marks.map((m) => <li key={m}>{m}</li>)}</ul>
        <p className={s.sheetH}>To try</p>
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
        <p className={s.bookDecided}><b>Decided:</b> {BOOK.decided}</p>
      </div>
    </div>
  );
}

/* ───────────────────────── The whiteboard: the job offer, mapped ───────────────────────── */

export type Pt = [number, number];
/** A shape with its words. `faint`: on the path not taken (dashed, quieter ink). */
export type Node = { kind: "ellipse" | "box" | "diamond"; c: Pt; w: number; h: number; label: string[]; faint?: boolean; size?: number };
export type Arrow = { a: Pt; c1: Pt; c2: Pt; b: Pt; label?: [string, Pt]; faint?: boolean };
export type Board = { view: [number, number]; font: number; nodes: Node[]; arrows: Arrow[]; last: Arrow; title?: Pt; notes?: [string[], Pt][]; rest: Pt };

/** The board's title, the question it holds. */
export const BOARD_TITLE = "Studio North: now or March?";

// The decision, mapped: the offer, the question, and what each answer leads to. Taking it now means
// starting in January with the launch half done (dashed: the path not taken). Waiting means finishing
// the launch, shipping in February, and talking again in March. Claude draws the last arrow, the "no"
// that joins the question to the path they chose.
export const WIDE: Board = {
  view: [1200, 500], font: 28, title: [4, 24], rest: [10, -4],
  nodes: [
    { kind: "ellipse", c: [158, 140], w: 290, h: 124, label: ["Studio North", "offer"] },
    { kind: "diamond", c: [520, 140], w: 290, h: 180, label: ["Take it now?"] },
    { kind: "box", c: [960, 140], w: 390, h: 120, label: ["Start in January,", "launch half done"], faint: true },
    { kind: "box", c: [520, 400], w: 390, h: 120, label: ["Finish the launch,", "ship in February"] },
    { kind: "ellipse", c: [960, 400], w: 330, h: 130, label: ["Talk again", "in March"] },
  ],
  arrows: [
    { a: [305, 140], c1: [328, 137], c2: [350, 142], b: [372, 140] },
    { a: [668, 140], c1: [700, 137], c2: [730, 142], b: [760, 140], label: ["yes", [714, 118]], faint: true },
    { a: [718, 400], c1: [744, 397], c2: [768, 402], b: [792, 400] },
  ],
  notes: [[["Ana needs an", "answer by Friday"], [44, 372]]],
  // Claude's: "no", from the question down to the path they chose.
  last: { a: [520, 234], c1: [517, 270], c2: [523, 306], b: [520, 336], label: ["no", [492, 296]] },
};
// The same map for a phone, compact: the offer and the question side by side, the dashed "yes" under
// the question, then the path they chose, stepping down. Claude draws the "no".
export const TALL: Board = {
  view: [358, 344], font: 17, rest: [0, 0],
  nodes: [
    { kind: "ellipse", c: [72, 42], w: 138, h: 74, label: ["Studio North", "offer"] },
    { kind: "diamond", c: [262, 42], w: 180, h: 84, label: ["Take it now?"] },
    { kind: "box", c: [268, 150], w: 176, h: 62, label: ["Start in January,", "launch half done"], faint: true },
    { kind: "box", c: [98, 232], w: 190, h: 62, label: ["Finish the launch,", "ship in February"] },
    { kind: "ellipse", c: [262, 300], w: 176, h: 70, label: ["Talk again", "in March"] },
  ],
  arrows: [
    { a: [143, 42], c1: [152, 41], c2: [161, 43], b: [169, 42] },
    { a: [264, 86], c1: [264, 96], c2: [267, 106], b: [267, 116], label: ["yes", [292, 106]], faint: true },
    { a: [150, 264], c1: [152, 290], c2: [160, 300], b: [171, 300] },
  ],
  last: { a: [208, 62], c1: [190, 100], c2: [160, 150], b: [152, 198], label: ["no", [150, 112]] },
};

function diamond(r: () => number, c: Pt, w: number, h: number, over = 3) {
  const [x, y] = c, t: Pt = [x, y - h / 2], rr: Pt = [x + w / 2, y], b: Pt = [x, y + h / 2], l: Pt = [x - w / 2, y];
  return [line(r, ...t, ...rr, over), line(r, ...rr, ...b, over), line(r, ...b, ...l, over), line(r, ...l, ...t, over)].join(" ");
}

/** A shape, drawn by hand. */
export function shape(r: () => number, n: Node, rad = 18) {
  if (n.kind === "ellipse") return ellipse(r, n.c[0], n.c[1], n.w / 2, n.h / 2);
  if (n.kind === "diamond") return diamond(r, n.c, n.w, n.h, rad > 14 ? 3 : 2);
  return box(r, n.c[0] - n.w / 2, n.c[1] - n.h / 2, n.w, n.h, rad);
}

/** A shape's words, centred in it (a dashed shape's words are quieter). */
export function nodeWords(n: Node, font: number, key?: React.Key) {
  const size = n.size ?? font;
  return (
    <text key={key} x={n.c[0]} y={n.c[1] + size * 0.34 - (n.label.length - 1) * size * 0.55} fontSize={size} textAnchor="middle" className={n.faint ? `${s.chalkText} ${s.chalkTextFaint}` : s.chalkText}>
      {n.label.map((l, j) => <tspan key={j} x={n.c[0]} dy={j ? size * 1.1 : 0}>{l}</tspan>)}
    </text>
  );
}

/** A board's nodes and arrows in ink, and their words. A plain function, not a component: it draws
 *  from the caller's seeded random, in the caller's render, so the server and the browser agree. */
export function boardInk(g: { font: number; nodes: Node[]; arrows: Arrow[]; notes?: [string[], Pt][] }, r: () => number, arrowHead: number, o: { rad?: number; wob?: number; label?: number } = {}) {
  const ink = (faint: boolean) => (
    <g className={faint ? `${s.chalk} ${s.chalkFaint}` : s.chalk}>
      {g.nodes.map((n, i) => !!n.faint === faint && <path key={i} d={shape(r, n, o.rad)} />)}
      {g.arrows.map((a, i) => !!a.faint === faint && <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, o.wob ?? 2)} /><path d={head(r, a.c2, a.b, arrowHead)} /></g>)}
    </g>
  );
  const lab = o.label ?? g.font * 0.86;
  return (
    <>
      {ink(false)}{ink(true)}
      {g.nodes.map((n, i) => nodeWords(n, g.font, i))}
      {g.arrows.map((a, i) => a.label && <text key={i} x={a.label[1][0]} y={a.label[1][1]} fontSize={lab} textAnchor="middle" className={a.faint ? `${s.chalkNote} ${s.chalkTextFaint}` : s.chalkNote}>{a.label[0]}</text>)}
      {g.notes?.map(([lines, at], i) => (
        <text key={i} x={at[0]} y={at[1]} fontSize={g.font * 0.8} className={s.boardTitle}>
          {lines.map((l, j) => <tspan key={j} x={at[0]} dy={j ? g.font * 1.0 : 0}>{l}</tspan>)}
        </text>
      ))}
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
  const lastHead = head(r, g.last.c2, g.last.b, tall ? 12 : 22);
  const ink = boardInk(g, r, tall ? 10 : 20);
  const path = useRef<SVGPathElement>(null), ink2 = useRef<SVGPathElement>(null), cur = useRef<SVGGElement>(null), tip = useRef<SVGGElement>(null);
  const sc = tall ? 0.95 : 1.45;
  const rest = g.rest;
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
        // Over the stroke's last stretch the cursor drifts to where it rests, so its name never sits
        // on the words the arrow points at.
        const off = Math.min(1, Math.max(0, (e - 0.82) / 0.18)), o = off * off * (3 - 2 * off);
        const x = q.x + rest[0] * o, y = q.y + rest[1] * o;
        c.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        c.style.opacity = u <= 0 ? "0" : "1";
      }
    };
    set(0);
    return bind(set);
  }, [bind, g, rest]);
  const lab = g.last.label;
  return (
    <svg className={`${s.board} ${hand.className}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {g.title && <text x={g.title[0]} y={g.title[1]} fontSize={g.font * 0.8} className={s.boardTitle}>{BOARD_TITLE}</text>}
      {ink}
      <path ref={path} d={cubic(g.last)} fill="none" stroke="none" />
      <g className={s.chalkClaude}><path ref={ink2} d={lastD} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} /></g>
      <g ref={tip} className={s.chalkClaude} style={{ opacity: 0 }}>
        <path d={lastHead} />
        {lab && <text x={lab[1][0]} y={lab[1][1]} fontSize={g.font * 0.86} textAnchor="middle" className={s.claudeNote}>{lab[0]}</text>}
      </g>
      <g ref={cur} style={{ opacity: 0 }}><g transform={`scale(${sc})`}><Cursor x={0} y={0} name="Claude" color={CLAUDE} above={!tall} left={tall} /></g></g>
    </svg>
  );
}

/* ───────────────────────── The app: the habits they're building ───────────────────────── */

/** The week, Monday first. Thursday is today (the Studio North call; Ana's answer is due Friday). */
export const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const TODAY = 3;
/** The habits in the app Build makes, as this week stands. Writing before work, five a week: Monday
 *  to Wednesday done, and today ticked by you in Build, so 4 of 5 (the first screen's count). Cooking
 *  at home, five nights a week (the decision in the dinners note): Tuesday and Wednesday so far. */
export const WRITE_HABIT = "Write 30 min before work";
export const WRITE_GOAL = 5;
export const WRITE_BEFORE = [true, true, true, false, false, false, false];
export const COOK_HABIT = "Cook at home";
export const COOK_GOAL = "5 nights a week";
export const COOK_DAYS = [false, true, true, false, false, false, false];
