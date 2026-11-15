"use client";

import localFont from "next/font/local";
import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import s from "./s.module.css";

// The three things on study V's page, all carrying one decision: whether to take a job offer from
// Studio North. A note (notes from the call, for and against, and what you decided), a whiteboard (the
// decision mapped out), and a small app (a habit you're building). The first screen shows the note;
// each chapter shows its one at full size, with the same words.

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
export const TITLE = "Job offer: Studio North";

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

/** A named cursor in SVG (for the big whiteboard, where it moves along the arrow). `above`: its name
 *  rides above the pointer, so it never covers the shape the arrow is drawn into. */
export function Cursor({ x, y, name, color, scale = 1, above }: { x: number; y: number; name: string; color: string; scale?: number; above?: boolean }) {
  const w = name.length * 7.4 + 18, ty = above ? -30 : 15;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill={color} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="14" y={ty} width={w} height="22" rx="7" fill={color} />
      <text x={14 + w / 2} y={ty + 15.5} className={s.cursorName} textAnchor="middle">{name}</text>
    </g>
  );
}

/* ───────────────────────── The note ───────────────────────── */

const FOR = ["A bigger role", "A team to learn from"];
const AGAINST = ["The launch is six weeks out", "I’d leave it half done"];
const LABEL = "Decided: ";

/** The decision line, typed in: "Decided:" in bold, the rest kept in place (invisible) while it types,
 *  so the note never reflows. Screen readers get the whole line. */
export function Typed({ text, n, caret = true }: { text: string; n: number; caret?: boolean }) {
  const full = LABEL + text, k = Math.min(n, full.length), B = LABEL.length - 1;
  return (
    <>
      <span className={s.sr}>{full}</span>
      <span aria-hidden="true">
        <b>{full.slice(0, Math.min(k, B))}</b>{full.slice(B, Math.max(B, k))}
        {caret && k < full.length && <i className={s.caret} />}
        <span className={s.askRest}><b>{full.slice(Math.min(k, B), B)}</b>{full.slice(Math.max(B, k))}</span>
      </span>
    </>
  );
}

/** The job offer note at writing size: notes from the call, for and against, then the decision, typed
 *  in when the chapter arrives. Once it's written, the reply to Ana gets its tick. */
export function Note({ live }: { live: boolean }) {
  const full = LABEL.length + DECIDED.length;
  const [n, setN] = useState(0);
  const [told, setTold] = useState(false);
  const started = useRef(false);
  useEffect(() => {
    if (!live || started.current) return;
    started.current = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("t")) { setN(full); setTold(true); return; }
    let i = 0, t = 0;
    const step = () => {
      i++; setN(i);
      if (i < full) t = window.setTimeout(step, 36 + ((i * 37) % 5) * 9);
      else t = window.setTimeout(() => setTold(true), 650);
    };
    t = window.setTimeout(step, 450);
    return () => clearTimeout(t);
  }, [live, full]);
  return (
    <div className={s.sheet}>
      <p className={s.sheetDate}>Today at 09:41</p>
      <h3 className={s.sheetTitle}>{TITLE}</h3>
      <p className={s.sheetText}><b>From the call with Ana.</b> Head of design, with a team of six. The role can wait until March if I ask.</p>
      <div className={s.weigh}>
        <div><p className={s.weighH}>For</p><ul>{FOR.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><p className={s.weighH}>Against</p><ul>{AGAINST.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>
      <p className={`${s.decided} ${s.sheetDecided}`} data-typing data-done={n >= full || undefined}><Typed text={DECIDED} n={n} /></p>
      <ul className={s.rows}>
        <li>
          <button type="button" className={s.row} data-on={told || undefined} onClick={() => setTold((v) => !v)} aria-pressed={told} aria-label="Tell Ana by Friday">
            <i className={s.box}><Tick /></i>
          </button>
          <span className={s.rowText} onClick={() => setTold((v) => !v)}>Tell Ana by Friday<b className={s.strike} aria-hidden="true" data-on={told || undefined} /></span>
        </li>
      </ul>
      <p className={`${s.sheetText} ${s.sheetAside}`}>The options are on the whiteboard: <a className={s.noteLink} href="#s-draw">Studio North, now or March?</a></p>
    </div>
  );
}

/* ───────────────────────── The whiteboard ───────────────────────── */

type Pt = [number, number];
/** A shape with its words. `faint`: on the path not taken (dashed, quieter ink). */
type Node = { kind: "ellipse" | "box" | "diamond"; c: Pt; w: number; h: number; label: string[]; faint?: boolean };
type Arrow = { a: Pt; c1: Pt; c2: Pt; b: Pt; label?: [string, Pt]; faint?: boolean };
export type Board = { view: [number, number]; font: number; nodes: Node[]; arrows: Arrow[]; last: Arrow; title?: Pt; notes?: [string[], Pt][]; rest: Pt };

// The decision, mapped: the offer, the question, and what each answer leads to. Taking it now means
// starting in January with the launch half done (dashed: the path not taken). Waiting means finishing
// the launch, shipping in February, and talking again in March. Claude draws the last arrow, the "no"
// that joins the question to the path you chose.
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
  // Claude's: "no", from the question down to the path you chose.
  last: { a: [520, 234], c1: [517, 270], c2: [523, 306], b: [520, 336], label: ["no", [492, 296]] },
};
// The same map for a phone, compact: the offer and the question side by side, the dashed "yes" under
// the question, then the path you chose, stepping down. Claude draws the "no".
export const TALL: Board = {
  view: [358, 344], font: 17, rest: [70, 6],
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
  const ink = (faint: boolean) => (
    <g className={faint ? `${s.chalk} ${s.chalkFaint}` : s.chalk}>
      {g.nodes.map((n, i) => !!n.faint === faint && <path key={i} d={shape(r, n)} />)}
      {g.arrows.map((a, i) => !!a.faint === faint && <g key={i}><path d={curve(r, a.a, a.c1, a.c2, a.b, 2)} /><path d={head(r, a.c2, a.b, arrowHead)} /></g>)}
    </g>
  );
  return (
    <>
      {ink(false)}{ink(true)}
      {g.nodes.map((n, i) => (
        <text key={i} x={n.c[0]} y={n.c[1] + g.font * 0.34 - (n.label.length - 1) * g.font * 0.55} fontSize={g.font} textAnchor="middle" className={n.faint ? `${s.chalkText} ${s.chalkTextFaint}` : s.chalkText}>
          {n.label.map((l, j) => <tspan key={j} x={n.c[0]} dy={j ? g.font * 1.1 : 0}>{l}</tspan>)}
        </text>
      ))}
      {g.arrows.map((a, i) => a.label && <text key={i} x={a.label[1][0]} y={a.label[1][1]} fontSize={g.font * 0.86} textAnchor="middle" className={a.faint ? `${s.chalkNote} ${s.chalkTextFaint}` : s.chalkNote}>{a.label[0]}</text>)}
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
      {g.title && <text x={g.title[0]} y={g.title[1]} fontSize={g.font * 0.8} className={s.boardTitle}>Studio North: now or March?</text>}
      {ink}
      <path ref={path} d={cubic(g.last)} fill="none" stroke="none" />
      <g className={s.chalkClaude}><path ref={ink2} d={lastD} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1} /></g>
      <g ref={tip} className={s.chalkClaude} style={{ opacity: 0 }}>
        <path d={lastHead} />
        {lab && <text x={lab[1][0]} y={lab[1][1]} fontSize={g.font * 0.86} textAnchor="middle" className={s.claudeNote}>{lab[0]}</text>}
      </g>
      <g ref={cur} style={{ opacity: 0 }}><g transform={`scale(${sc})`}><Cursor x={0} y={0} name="Claude" color={CLAUDE} above={!tall} /></g></g>
    </svg>
  );
}

/* ───────────────────────── The app ───────────────────────── */

export const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
export const TODAY = 4;

