"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import s from "./s.module.css";
import { ONE, onCarry } from "./Carry";
import { useShow } from "./show";

// The things on study Z's page (round 18, option C after the round 13 council), one person's week,
// several parts of one life. The first screen is that week in one note, all dinner: what they decided
// ("20-minute weeknight dinners"), Tuesday's dinner, and Thursday's, which ChatGPT just added when asked
// for a dinner, keeping to the decision ("Lemon chicken · 20 min"). Then each chapter shows one part at
// full size: a book note open in Pinto (a Mac window; on a phone, the iPhone app) among a life's notes
// brought over from Apple Notes, a whiteboard (the job offer from Studio North, mapped: now or March?),
// a small app (the habits they're building), and one request in ChatGPT that lands in all three, the
// recipe it files into Recipes first. Round 19: the request is two clauses, each paired by one tint with
// what it changed (the dinners with the note and the app, the call with the whiteboard).

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
export const DECIDED = "Cook at home five nights.";

/** The first screen's note: this week. First what they decided, in words a stranger reads in a second
 *  (the part ChatGPT keeps to is the middle piece). Then a dinner, and the one ChatGPT just added for
 *  Thursday when asked: twenty minutes, as decided. The decision's "20-minute" and the new line's
 *  "20 min" wear the same tint, so the link reads in a still frame. */
export const WEEK_NOTE = {
  title: "This week",
  decided: ["", "20-minute", " weeknight dinners."] as [string, string, string],
  dinner: ["Tue", "Miso salmon"] as [string, string],
  added: ["Thu", "Lemon chicken · ", "20 min"] as [string, string, string],
  ask: "Add a dinner for Thursday.",
};

/** The book note Notes opens: two highlights, what to try, and what the reader decided. */
export const BOOK = {
  title: "Deep Work", author: "Cal Newport",
  marks: ["Deep work is rare, and worth more every year.", "Focus is a skill. Train it."],
  decided: "Write 30 min before work.",
};

/** The notes list in the Mac window (Notes): a whole life's notes, newest first, the book note open.
 *  As Pinto lists them: the title, when and the first line (always longer than the column, so every
 *  preview ends the same way, on one line with an ellipsis), then the folder. Five, then where they
 *  came from. */
export const NOTES: { title: string; when: string; first: string; folder: string; on?: boolean }[] = [
  { title: "Deep Work", when: "9:12 AM", first: "Deep work is rare, and worth more every year.", folder: "Reading", on: true },
  { title: "Miso salmon", when: "Yesterday", first: "20 min. Rice, greens and a quick glaze.", folder: "Recipes" },
  { title: "Studio North", when: "Yesterday", first: "Decided: wait until March. Finish the launch first.", folder: "Work" },
  { title: "Kyoto in April", when: "Monday", first: "Six days, two cities. Book the ryokan.", folder: "Trips" },
  { title: "Morning run", when: "Sunday", first: "Three a week, before work. Easy pace.", folder: "Health" },
];
/** What the notes list says at its foot: these notes came over from Apple Notes (Pinto imports them). */
export const IMPORTED = { from: "Imported from Apple Notes", count: "412 notes" };

/** Next week's dinners, from your recipes: what ChatGPT writes into the dinners note (Your AI), five
 *  nights, as decided. One of them is new: ChatGPT wrote its recipe into the Recipes folder as it
 *  planned the week. */
export const DINNERS: [string, string][] = [
  ["Mon", "Lemon chicken"],
  ["Tue", "Miso salmon"],
  ["Wed", "Shakshuka"],
  ["Thu", "Dal"],
  ["Sun", "Lentil soup"],
];
/** The recipe ChatGPT filed into Recipes while it planned the week. */
export const NEW_RECIPE = { name: "Shakshuka" };
/** The two questions ChatGPT adds to the board for the call. */
export const QUESTIONS = ["Can the start move to March?", "What's the first project?"];

/** "Added by ChatGPT": ChatGPT's mark and the words, in the note's own flow (never over the words it
 *  marks). Undo shows on one card on the whole page only (the app's, in Your AI), and it works. */
export function Receipt({ undone = false, onFlip, live = true }: { undone?: boolean; onFlip?: () => void; live?: boolean }) {
  return (
    <p className={s.receipt} data-undone={undone || undefined}>
      {undone && onFlip
        ? <><span>Undone</span><button type="button" onClick={onFlip} tabIndex={live ? 0 : -1}>Redo</button></>
        : <><span className={s.receiptMark}><AIGlyph name="openai" size={11} color="#fff" /></span><span><span className={s.rcBy}>Added by </span>ChatGPT</span>
          {onFlip && <><b aria-hidden="true">·</b><button type="button" onClick={onFlip} tabIndex={live ? 0 : -1}>Undo</button></>}</>}
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

/** Pinto's own window chrome, drawn plain: the icons in its toolbar (the sidebar, search, back and
 *  forward, the format menu, a checklist). Decoration only; the window isn't a working app. */
const Ico = {
  side: <svg viewBox="0 0 20 16"><rect x="1.5" y="1.5" width="17" height="13" rx="3" /><path d="M7.5 1.5v13" /></svg>,
  search: <svg viewBox="0 0 18 18"><circle cx="7.6" cy="7.6" r="5.6" /><path d="M11.8 11.8 16 16" /></svg>,
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 20 16"><circle cx="3.5" cy="4" r="2.2" /><path d="M8.5 4h10M8.5 12h10" /><circle cx="3.5" cy="12" r="2.2" /></svg>,
  more: <svg viewBox="0 0 20 6"><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
};

/** Your notes, as Pinto shows them on a Mac: one window with its traffic lights and toolbar, the notes
 *  list down the left (a whole life's notes: a recipe, the job decision, a trip; the book note
 *  selected), and at its foot where they came from ("Imported from Apple Notes · 412 notes"), and the
 *  book note open at writing size: two highlights, what to try as a checklist that ticks (its last line
 *  typed when the chapter arrives), and what the reader decided. On a phone it's the iPhone app: no
 *  traffic lights, the "< Reading" back button and the more button, the note, and the import line at
 *  the screen's foot. */
export function Note({ live, carry = false }: { live: boolean; carry?: boolean }) {
  // Round 26 (`carry`): the window is also the first screen's picture. ChatGPT writes the first two
  // lines of To try on load (the hero show's clock, Carry.tsx), marked as the app marks an AI's lines;
  // as the Notes sheet arrives you tick the first and the third is yours, typed when the chapter docks.
  const [on, setOn] = useState([!carry, false, false]);
  const [n, setN] = useState(0);
  const [wrote, setWrote] = useState(carry ? 0 : 2);
  const [third, setThird] = useState(!carry);
  const started = useRef(false);
  const ticked = useRef(false);
  useShow({ name: "one", end: ONE.end, apply: (t) => { if (carry) { const w = t >= ONE.row2 ? 2 : t >= ONE.row1 ? 1 : 0; setWrote((o) => (o === w ? o : w)); } } });
  useEffect(() => {
    if (!carry) return;
    return onCarry((p) => {
      if (p >= 0.74 && !ticked.current) { ticked.current = true; setOn((o) => (o[0] ? o : [true, o[1], o[2]])); }
      if (p >= 0.8) setThird(true);
    });
  }, [carry]);
  useEffect(() => {
    if (!live || started.current) return;
    started.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("t")) { setN(TYPED.length); setThird(true); if (carry) setOn((o) => [true, o[1], o[2]]); return; }
    let i = 0, t = 0;
    const step = () => { i++; setN(i); if (i < TYPED.length) t = window.setTimeout(step, 38 + ((i * 37) % 5) * 9); };
    t = window.setTimeout(step, 450);
    return () => clearTimeout(t);
  }, [live, carry]);
  const flip = (i: number) => setOn((o) => o.map((v, k) => (k === i ? !v : v)));
  const rows = [...TRY, TYPED];
  return (
    <div className={s.sheet} data-win role="group" aria-label="Pinto Notes on a Mac, with the Deep Work note open">
      {/* On a phone: the iPhone app's own bar, the way back to the folder and the more button. */}
      <div className={s.ipBar} aria-hidden="true">
        <span className={s.ipBack}>{Ico.back}Reading</span>
        <span className={s.ipMore}>{Ico.more}</span>
      </div>
      <div className={s.mwBar} aria-hidden="true">
        <span className={s.mwLights}><i /><i /><i /></span>
        <span className={s.mwListBar}>
          <span className={s.mwIco}>{Ico.side}</span>
          <span className={s.mwIco}>{Ico.search}</span>
          <span className={s.mwPill}>All Notes</span>
        </span>
        <span className={s.mwNoteBar}>
          <span className={s.mwIco}>{Ico.back}</span>
          <span className={`${s.mwIco} ${s.mwDim}`}>{Ico.fwd}</span>
          <span className={s.mwCrumb}>Reading</span>
          <span className={s.mwTools}><b>Aa</b><span className={s.mwIco}>{Ico.check}</span><span className={s.mwIco}>{Ico.more}</span></span>
        </span>
      </div>
      <nav className={s.folder} aria-label="Notes">
        <ul>
          {NOTES.map((x) => (
            <li key={x.title} data-on={x.on || undefined}>
              <b>{x.title}</b>
              <span className={s.mwWhen}>{x.when} · {x.first}</span>
              <span className={s.mwIn}><Folder />{x.folder}</span>
            </li>
          ))}
        </ul>
        <Imported />
      </nav>
      <div className={s.recipe} data-pane>
        <h3 className={s.sheetTitle}>{BOOK.title}</h3>
        <p className={s.sheetMeta}>By {BOOK.author}</p>
        <p className={s.sheetH}>Highlights</p>
        <ul className={s.quotes}>{BOOK.marks.map((m) => <li key={m}>{m}</li>)}</ul>
        <p className={s.sheetH} data-anchor>To try</p>
        <ul className={s.rows}>
          {rows.map((text, i) => {
            const typing = i === rows.length - 1;
            const shown = typing ? TYPED.slice(0, n) : text;
            const ai = carry && !typing;
            const out = carry && (typing ? !third : i >= wrote);
            return (
              <li key={text} data-typing={typing || undefined} data-empty={typing && n === 0 ? true : undefined} data-ai={ai || undefined} data-out={out || undefined}>
                {ai && <i className={s.aiTick} aria-hidden="true" />}
                <button type="button" className={s.row} data-on={on[i] || undefined} onClick={() => flip(i)} aria-pressed={on[i]} aria-label={text} tabIndex={out ? -1 : 0}>
                  <i className={s.box}><Tick /></i>
                </button>
                <span className={s.rowText} onClick={() => flip(i)}>
                  {ai ? <span className={s.aiRun}>{shown}</span> : shown}{typing && n < TYPED.length && <b className={s.caret} aria-hidden="true" />}
                  <b className={s.strike} aria-hidden="true" data-on={on[i] || undefined} />
                </span>
              </li>
            );
          })}
        </ul>
        <p className={s.bookDecided}><b>Decided:</b> {BOOK.decided}</p>
      </div>
      <Imported phone />
    </div>
  );
}

/** The same note on an iPhone (on a Mac only, laid over the window's corner: "on Mac and iPhone"). The
 *  iPhone app's bar, the way back to Reading, then the note as it syncs: the title, the first
 *  highlight, what to try, what was decided. Decoration; the window is the one you read. */
export function NotePhone() {
  return (
    <div className={s.wPhone} role="img" aria-label="The same note, Deep Work, in Pinto Notes on an iPhone">
      <div className={s.wPhoneScreen}>
        <p className={s.phoneStatus}><b>9:41</b><span className={s.island} /><span className={s.phoneIcons}><i /><i /><i /></span></p>
        <p className={s.phoneNav}><svg viewBox="0 0 10 16"><path d="M8 2 L2 8 L8 14" /></svg>Reading</p>
        <div className={s.wpNote}>
          <p className={s.wpTitle}>{BOOK.title}</p>
          <p className={s.wpBy}>By {BOOK.author}</p>
          <p className={s.wpQuote}>{BOOK.marks[0]}</p>
          <ul className={s.wpRows}>
            <li data-on><i><Tick /></i><span>{TRY[0]}</span></li>
            <li><i /><span>{TRY[1]}</span></li>
            <li><i /><span>{TYPED}</span></li>
          </ul>
          <p className={s.wpDecided}><b>Decided:</b> {BOOK.decided}</p>
        </div>
      </div>
    </div>
  );
}

/** Where these notes came from, said plainly: a quiet line at the foot of the notes list (on a phone,
 *  at the foot of the screen). */
function Imported({ phone }: { phone?: boolean }) {
  return (
    <p className={`${s.imported} ${phone ? s.importedPhone : s.importedMac}`}>
      <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M9 2.5v8M5.6 7.4 9 10.8l3.4-3.4" /><path d="M2.5 11v2.3c0 1.2.9 2.2 2.2 2.2h8.6c1.3 0 2.2-1 2.2-2.2V11" /></svg>
      <span><b>{IMPORTED.from}</b><span className={s.importedDot}> · </span><span className={s.importedN}>{IMPORTED.count}</span></span>
    </p>
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
  last: { a: [208, 62], c1: [190, 100], c2: [160, 150], b: [152, 198], label: ["no", [168, 114]] },
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

/* ───────────────────────── The whiteboard's own controls ───────────────────────── */

/** The tools, drawn plain after their symbols in Pinto's canvas (CanvasTool: cursorarrow, hand.raised,
 *  pencil, rectangle, circle, diamond, arrow.up.right, textformat, eraser; undo and redo first). */
const TOOL: Record<string, React.ReactNode> = {
  undo: <svg viewBox="0 0 20 20"><path d="M7.5 4.5 3.8 8.2l3.7 3.7" /><path d="M4.2 8.2h7.6a4.4 4.4 0 0 1 0 8.8H9.5" /></svg>,
  redo: <svg viewBox="0 0 20 20"><path d="m12.5 4.5 3.7 3.7-3.7 3.7" /><path d="M15.8 8.2H8.2a4.4 4.4 0 0 0 0 8.8h2.3" /></svg>,
  select: <svg viewBox="0 0 20 20"><path d="M5 3.2v12.6l3.4-3.3 2.4 5 2.2-1-2.3-5h4.6z" strokeLinejoin="round" /></svg>,
  hand: <svg viewBox="0 0 20 20"><path d="M7.2 10.4V4.6a1.2 1.2 0 0 1 2.4 0v4.8M9.6 9.2V3.4a1.2 1.2 0 0 1 2.4 0v5.8M12 9.2V4.6a1.2 1.2 0 0 1 2.4 0v6.6c0 3.3-2.1 5.6-5 5.6-2 0-3.2-.9-4.3-2.6L3.4 11.4a1.2 1.2 0 0 1 2-1.3l1.8 2.3" /></svg>,
  pencil: <svg viewBox="0 0 20 20"><path d="M13.6 3.6a1.9 1.9 0 0 1 2.7 2.7L7 15.6l-3.6 1 1-3.6z" /><path d="m12.2 5 2.8 2.8" /></svg>,
  rect: <svg viewBox="0 0 20 20"><rect x="3" y="5" width="14" height="10" rx="1.6" /></svg>,
  ellipse: <svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="6.6" /></svg>,
  diamond: <svg viewBox="0 0 20 20"><path d="M10 2.8 17.2 10 10 17.2 2.8 10z" /></svg>,
  shapes: <svg viewBox="0 0 20 20"><rect x="2.6" y="2.6" width="9.4" height="9.4" rx="1.4" /><circle cx="12.6" cy="12.6" r="4.8" /></svg>,
  arrow: <svg viewBox="0 0 20 20"><path d="M4.6 15.4 15 5M8.4 4.8H15.2v6.8" /></svg>,
  text: <svg viewBox="0 0 20 20"><path d="M2.6 15.6 6.4 5h.8l3.8 10.6M3.9 12.2h5.8M17.4 10.4v5.2M17.4 12.2c0-1.2-.9-1.9-2.1-1.9s-2.2.8-2.2 2.2.9 2.3 2.2 2.3 2.1-.7 2.1-1.9" /></svg>,
  eraser: <svg viewBox="0 0 20 20"><path d="m8.2 16.4-4-4a1.6 1.6 0 0 1 0-2.3l6.6-6.6a1.6 1.6 0 0 1 2.3 0l3.6 3.6a1.6 1.6 0 0 1 0 2.3l-6.6 7zM6.6 8.4l5 5M8.2 16.4h8" /></svg>,
};
/** Which tools the dock shows: on a Mac, Undo and Redo, a gap, then the tools; on a phone, the tools,
 *  the shapes in one button. Select is the tool in hand. */
const DOCK: [string, "mac" | "phone" | "both"][] = [
  ["undo", "mac"], ["redo", "mac"], ["gap", "mac"], ["select", "both"], ["hand", "mac"], ["pencil", "both"], ["rect", "mac"], ["ellipse", "mac"],
  ["diamond", "mac"], ["shapes", "phone"], ["arrow", "both"], ["text", "both"], ["eraser", "both"],
];

/** Pinto's whiteboard controls, as the app lays them: one floating dock centred at the foot, and the
 *  zoom, quiet, at the bottom right (on a Mac). Decoration: the board isn't a working canvas here. */
export function CanvasChrome() {
  return (
    <>
      <span className={s.dock} aria-hidden="true">
        {DOCK.map(([k, on]) => k === "gap"
          ? <i key={k} className={s.dockGap} data-on-device={on} />
          : <i key={k} data-tool={k} data-on-device={on} data-picked={k === "select" || undefined}>{TOOL[k]}</i>)}
      </span>
      <span className={s.zoom} aria-hidden="true">100%</span>
    </>
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
/** Next week's dinner nights, as ChatGPT planned them (Your AI): the five nights in DINNERS (Mon, Tue,
 *  Wed, Thu and Sun), marked on "Cook at home" in the habits app, so the note and the app show the
 *  same decision. */
export const COOK_NEXT = [true, true, true, true, false, false, true];
