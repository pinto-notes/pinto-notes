"use client";

import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { box, curve, ellipse, head, line, rng } from "./hand";
import { hand } from "./Things";
import w from "./wb.module.css";

// Round 21 (2026-11-16): the whiteboard chapter's variants, `?wb=a|b|c` (0, the chalk board, is
// Story.tsx's own). The Studio North decision drawn as the real board draws it: Excalidraw's hand
// strokes in Pinto's ink (#2a1d10, #ebddd1 in dark), the palette's pastel fills (round 24: two of the
// board's fills, CanvasStyle.fills, the warm ones that sit with the page's rust, kraft and forest: Yellow
// for the question and Pink for the path chosen; the offer plain; in dark mode the same fills as the
// board's dark filter shows them), the handwriting, the zoom label.
// Claude's change, the "no" arrow, shows the way the app shows an AI's change: a dashed outline in the
// accent with Claude's name tag beside it, and the receipt at the board's foot, "Claude added 1 arrow ·
// Undo" (CanvasNote.change: an arrow is counted, never named). All of it from the app's own captures
// (council-wb/final, r14 12-ai-drew) and its code (CanvasControls.swift, CanvasBridge.swift).
//
// The window is the Notes chapter's frame (same corners, shadow, traffic lights, list bar), with the
// board's toolbar in the app's order: back, forward, the folder and the board's name, then Select (in
// the accent), Hand, Pencil, Shapes, Arrow, Text, Eraser, Library, Comments, Full Screen, Ask AI (the
// connected AI's mark), Share, More. The iPhone shows the same board with the app's iPhone dock:
// Select, Pencil, Shapes, Arrow, Text, Eraser, Library, Comment, Style.

type Pt = [number, number];
type Fill = "blue" | "yellow" | "green" | "pink" | null;
type Node = { kind: "ellipse" | "box" | "diamond"; c: Pt; w: number; h: number; label: string[]; fill: Fill; dashed?: boolean; size?: number };
type Arrow = { a: Pt; c1: Pt; c2: Pt; b: Pt; label?: [string, Pt]; dashed?: boolean };
/** A board: its view, its words' size, its shapes and arrows, Claude's arrow, and where Claude's
 *  name tag sits (`tag`: its anchor in board units, and which side of it the tag grows to). */
type Board = { view: [number, number]; font: number; title?: [string, Pt, number]; note?: [string[], Pt, number]; nodes: Node[]; arrows: Arrow[]; claude: Arrow; tag: { at: Pt; side: "left" | "right" } };

const LABEL = "Studio North: now or March?";
/** The board's name in the list and the toolbar. */
export const BOARD_NAME = "Now or March?";

/** On a Mac: the decision, wide. The offer, the question; taking it now (dashed: the path not taken);
 *  waiting (green: the path chosen), then talking again in March. Claude adds the "no". */
const WIDE: Board = {
  view: [1200, 560], font: 28,
  title: [LABEL, [6, 42], 40],
  note: [["Ana needs an", "answer by Friday"], [40, 430], 23],
  nodes: [
    { kind: "ellipse", c: [158, 190], w: 290, h: 124, label: ["Studio North", "offer"], fill: null },
    { kind: "diamond", c: [520, 190], w: 290, h: 180, label: ["Take it now?"], fill: "yellow" },
    { kind: "box", c: [960, 190], w: 390, h: 120, label: ["Start in January,", "launch half done"], fill: null, dashed: true },
    { kind: "box", c: [520, 450], w: 390, h: 120, label: ["Finish the launch,", "ship in February"], fill: "pink" },
    { kind: "ellipse", c: [960, 450], w: 330, h: 130, label: ["Talk again", "in March"], fill: "pink" },
  ],
  arrows: [
    { a: [305, 190], c1: [328, 187], c2: [350, 192], b: [372, 190] },
    { a: [668, 190], c1: [700, 187], c2: [730, 192], b: [762, 190], label: ["yes", [712, 190]], dashed: true },
    { a: [718, 450], c1: [744, 447], c2: [768, 452], b: [792, 450] },
  ],
  claude: { a: [520, 284], c1: [517, 316], c2: [523, 352], b: [520, 386], label: ["no", [520, 333]] },
  tag: { at: [496, 282], side: "left" },
};

/** The same map, compact (a phone's crop of the window): the offer and the question side by side, the
 *  dashed "yes" under the question, then the path chosen stepping down. */
const TALL: Board = {
  view: [358, 412], font: 17,
  nodes: [
    { kind: "ellipse", c: [74, 48], w: 140, h: 76, label: ["Studio North", "offer"], fill: null },
    { kind: "diamond", c: [262, 48], w: 180, h: 88, label: ["Take it now?"], fill: "yellow" },
    { kind: "box", c: [92, 164], w: 164, h: 60, label: ["Start in January,", "launch half done"], fill: null, dashed: true, size: 15.5 },
    { kind: "box", c: [266, 266], w: 168, h: 62, label: ["Finish the launch,", "ship in February"], fill: "pink", size: 15.5 },
    { kind: "ellipse", c: [112, 364], w: 176, h: 72, label: ["Talk again", "in March"], fill: "pink" },
  ],
  arrows: [
    { a: [144, 48], c1: [152, 47], c2: [161, 49], b: [170, 48] },
    { a: [214, 72], c1: [196, 90], c2: [172, 110], b: [150, 131], label: ["yes", [188, 98]], dashed: true },
    { a: [264, 299], c1: [264, 334], c2: [248, 362], b: [206, 364] },
  ],
  claude: { a: [262, 96], c1: [261, 150], c2: [263, 196], b: [262, 231], label: ["no", [262, 164]] },
  tag: { at: [276, 104], side: "right" },
};

/** On an iPhone's screen, upright: the offer, the question, then both answers under it (the dashed
 *  "yes" right, Claude's "no" left), and March last. */
const UPRIGHT: Board = {
  view: [300, 470], font: 18,
  title: [LABEL, [8, 20], 15],
  nodes: [
    { kind: "ellipse", c: [150, 70], w: 196, h: 62, label: ["Studio North", "offer"], fill: null },
    { kind: "diamond", c: [150, 172], w: 204, h: 96, label: ["Take it now?"], fill: "yellow" },
    { kind: "box", c: [226, 300], w: 140, h: 60, label: ["Start in January,", "launch half done"], fill: null, dashed: true, size: 14.5 },
    { kind: "box", c: [76, 300], w: 146, h: 60, label: ["Finish the launch,", "ship in February"], fill: "pink", size: 14.5 },
    { kind: "ellipse", c: [150, 424], w: 184, h: 68, label: ["Talk again", "in March"], fill: "pink" },
  ],
  arrows: [
    { a: [150, 102], c1: [151, 110], c2: [149, 116], b: [150, 123] },
    { a: [216, 200], c1: [220, 222], c2: [224, 244], b: [228, 268], label: ["yes", [222, 234]], dashed: true },
    { a: [76, 332], c1: [77, 356], c2: [86, 378], b: [100, 394] },
  ],
  claude: { a: [84, 200], c1: [80, 222], c2: [77, 246], b: [76, 268], label: ["no", [80, 234]] },
  tag: { at: [92, 240], side: "right" },
};

const FILL: Record<"light" | "dark", Record<Exclude<Fill, null>, string>> = {
  light: { blue: "#a5d8ff", yellow: "#ffec99", green: "#b2f2bb", pink: "#ffc9c9" },
  dark: { blue: "#04375e", yellow: "#291600", green: "#002f00", pink: "#541e1f" },
};

function diamondPath(r: () => number, c: Pt, wd: number, ht: number) {
  const [x, y] = c, t: Pt = [x, y - ht / 2], rr: Pt = [x + wd / 2, y], b: Pt = [x, y + ht / 2], l: Pt = [x - wd / 2, y];
  return [line(r, ...t, ...rr, 3), line(r, ...rr, ...b, 3), line(r, ...b, ...l, 3), line(r, ...l, ...t, 3)].join(" ");
}

/** A shape's fill, as Excalidraw lays a solid fill: the shape itself, a hair inside its stroke. */
function fillShape(n: Node, color: string, key: number) {
  const [x, y] = n.c;
  if (n.kind === "ellipse") return <ellipse key={key} cx={x + 1} cy={y + 1} rx={n.w / 2 - 1} ry={n.h / 2 - 1} fill={color} />;
  if (n.kind === "diamond") return <path key={key} d={`M${x} ${y - n.h / 2 + 2}L${x + n.w / 2 - 2} ${y}L${x} ${y + n.h / 2 - 2}L${x - n.w / 2 + 2} ${y}Z`} fill={color} />;
  return <rect key={key} x={x - n.w / 2 + 1} y={y - n.h / 2 + 1} width={n.w - 2} height={n.h - 2} rx={16} fill={color} />;
}

/** The board, drawn: fills, then the hand strokes (twice, as Excalidraw draws them), the words, and
 *  Claude's arrow once it's there. `on`: Claude's change has landed (its outline, tag and receipt
 *  show). The outline and the tag are HTML over the drawing, at the app's own size whatever the zoom. */
export function WbBoard({ board, dark, on, className = "" }: { board: "wide" | "tall" | "upright"; dark?: boolean; on: boolean; className?: string }) {
  const g = board === "wide" ? WIDE : board === "tall" ? TALL : UPRIGHT;
  const r = rng(board === "wide" ? 7 : board === "tall" ? 17 : 23);
  const [W, H] = g.view;
  const fills = FILL[dark ? "dark" : "light"];
  const shape = (n: Node) => n.kind === "ellipse" ? ellipse(r, n.c[0], n.c[1], n.w / 2, n.h / 2) : n.kind === "diamond" ? diamondPath(r, n.c, n.w, n.h) : box(r, n.c[0] - n.w / 2, n.c[1] - n.h / 2, n.w, n.h, 16);
  const arrowInk = (a: Arrow, k: number, size: number) => (
    <g key={k} className={a.dashed ? w.dashed : undefined}>
      <path d={curve(r, a.a, a.c1, a.c2, a.b, 1.5)} /><path d={head(r, a.c2, a.b, size)} />
    </g>
  );
  const hs = g.font * 0.8;
  const lab = (a: Arrow, k: React.Key) => a.label && (
    <g key={k}>
      {/* The canvas keeps a gap round an arrow's label. */}
      <rect x={a.label[1][0] - a.label[0].length * hs * 0.36 - 6} y={a.label[1][1] - hs * 0.62} width={a.label[0].length * hs * 0.72 + 12} height={hs * 1.24} className={w.gap} />
      <text x={a.label[1][0]} y={a.label[1][1] + hs * 0.34} fontSize={hs} textAnchor="middle" className={w.words}>{a.label[0]}</text>
    </g>
  );
  const head0 = g.font * 0.72;
  // Claude's arrow: where its outline goes (its bounds, with the head), in percent of the board.
  const xs = [g.claude.a[0], g.claude.b[0]], ys = [g.claude.a[1], g.claude.b[1]];
  const bx0 = Math.min(...xs) - head0 * 0.6, bx1 = Math.max(...xs) + head0 * 0.6, by0 = Math.min(...ys), by1 = Math.max(...ys);
  const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  return (
    <div className={`${w.board} ${dark ? w.boardDark : ""} ${className}`} style={{ aspectRatio: `${W} / ${H}`, "--bw": W } as React.CSSProperties} data-on={on || undefined}>
      <svg className={`${w.svg} ${hand.className}`} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        {g.title && <text x={g.title[1][0]} y={g.title[1][1]} fontSize={g.title[2]} className={w.title}>{g.title[0]}</text>}
        {g.note && (
          <text x={g.note[1][0]} y={g.note[1][1]} fontSize={g.note[2]} className={w.note}>
            {g.note[0].map((l, j) => <tspan key={j} x={g.note![1][0]} dy={j ? g.note![2] * 1.15 : 0}>{l}</tspan>)}
          </text>
        )}
        {g.nodes.map((n, i) => n.fill && fillShape(n, fills[n.fill], i))}
        <g className={w.ink}>
          {g.nodes.map((n, i) => <path key={i} d={shape(n)} className={n.dashed ? w.dashedPath : undefined} />)}
          {g.arrows.map((a, i) => arrowInk(a, i, head0))}
        </g>
        {g.nodes.map((n, i) => {
          const size = n.size ?? g.font;
          return (
            <text key={i} x={n.c[0]} y={n.c[1] + size * 0.34 - (n.label.length - 1) * size * 0.56} fontSize={size} textAnchor="middle" className={w.words}>
              {n.label.map((l, j) => <tspan key={j} x={n.c[0]} dy={j ? size * 1.12 : 0}>{l}</tspan>)}
            </text>
          );
        })}
        {g.arrows.map((a, i) => lab(a, `l${i}`))}
        <g className={w.claudeInk}>
          <g className={w.ink}>{arrowInk(g.claude, 0, head0)}</g>
          {lab(g.claude, "c")}
        </g>
      </svg>
      {/* Claude's change, as the app outlines an AI's: dashed accent, its name tag clear of the ink. */}
      <i className={w.outline} style={{ left: pc(bx0, W), top: pc(by0, H), width: pc(bx1 - bx0, W), height: pc(by1 - by0, H) }} />
      <span className={w.tag} data-side={g.tag.side} style={{ left: pc(g.tag.at[0], W), top: pc(g.tag.at[1], H) }}>
        <AIGlyph name="claude" size={12} color="#fff" />Claude
      </span>
    </div>
  );
}

/** "Claude added 1 arrow · Undo": the receipt at the board's foot, as the app words it. */
export function WbReceipt({ on }: { on: boolean }) {
  return (
    <p className={w.receipt} data-on={on || undefined}>
      <AIGlyph name="claude" size={14} />
      <span>Claude added 1 arrow</span>
      <i aria-hidden="true" />
      <b>Undo</b>
    </p>
  );
}

/* ───────────────────────── The Mac window ───────────────────────── */

const I = {
  side: <svg viewBox="0 0 20 16"><rect x="1.5" y="1.5" width="17" height="13" rx="3" /><path d="M7.5 1.5v13" /></svg>,
  search: <svg viewBox="0 0 18 18"><circle cx="7.6" cy="7.6" r="5.6" /><path d="M11.8 11.8 16 16" /></svg>,
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  select: <svg viewBox="0 0 20 20" className={w.filled}><path d="M5 2.6v13.8l3.6-3.5 2.6 5.4 2.4-1.1-2.5-5.3h5z" /></svg>,
  hand: <svg viewBox="0 0 20 20"><path d="M7.2 10.4V4.6a1.2 1.2 0 0 1 2.4 0v4.8M9.6 9.2V3.4a1.2 1.2 0 0 1 2.4 0v5.8M12 9.2V4.6a1.2 1.2 0 0 1 2.4 0v6.6c0 3.3-2.1 5.6-5 5.6-2 0-3.2-.9-4.3-2.6L3.4 11.4a1.2 1.2 0 0 1 2-1.3l1.8 2.3" /></svg>,
  pencil: <svg viewBox="0 0 20 20"><path d="M4 16 15.2 4.8M13.8 3.4l2.8 2.8M4 16l-.8 1 1-.8" /></svg>,
  rect: <svg viewBox="0 0 20 20"><rect x="2.5" y="5" width="15" height="10.5" rx="1.8" /></svg>,
  arrow: <svg viewBox="0 0 20 20"><path d="M4.6 15.4 15 5M8.4 4.8H15.2v6.8" /></svg>,
  text: <svg viewBox="0 0 24 20"><path d="M1.6 16 6.4 3.6h.9L12 16M3.2 12h7.3M21.6 9.6V16M21.6 12c0-1.4-1-2.4-2.5-2.4s-2.7 1-2.7 2.7 1.1 2.7 2.7 2.7 2.5-1 2.5-2.4" /></svg>,
  eraser: <svg viewBox="0 0 20 20"><path d="m8.2 16.4-4-4a1.6 1.6 0 0 1 0-2.3l6.6-6.6a1.6 1.6 0 0 1 2.3 0l3.6 3.6a1.6 1.6 0 0 1 0 2.3l-6.6 7zM6.6 8.4l5 5" /></svg>,
  library: <svg viewBox="0 0 22 20"><rect x="2" y="3.5" width="3.6" height="13" rx=".6" /><rect x="6.8" y="3.5" width="3.6" height="13" rx=".6" /><path d="m12.2 4.9 3.4-1 3.6 12.1-3.4 1z" /><path d="M2 6.5h3.6M6.8 6.5h3.6" /></svg>,
  comment: <svg viewBox="0 0 20 20"><path d="M3.8 3.4h12.4a1.6 1.6 0 0 1 1.6 1.6v7.6a1.6 1.6 0 0 1-1.6 1.6H9.4l-3.8 3v-3H3.8a1.6 1.6 0 0 1-1.6-1.6V5a1.6 1.6 0 0 1 1.6-1.6zM6 7.6h8M6 10.4h5" /></svg>,
  full: <svg viewBox="0 0 20 20"><path d="M3.4 8.2V3.4h4.8M3.4 3.4l5 5M16.6 11.8v4.8h-4.8M16.6 16.6l-5-5" /></svg>,
  share: <svg viewBox="0 0 18 20"><path d="M9 12.4V1.8M5.6 5 9 1.6 12.4 5M6.2 7.6H4.4a1.6 1.6 0 0 0-1.6 1.6v7.4a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6V9.2a1.6 1.6 0 0 0-1.6-1.6h-1.8" /></svg>,
  more: <svg viewBox="0 0 20 6" className={w.filled}><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
  folder: <svg viewBox="0 0 20 16"><path d="M1.5 3.2c0-.9.7-1.7 1.7-1.7h4l1.8 2h7.8c.9 0 1.7.8 1.7 1.7v7.6c0 .9-.8 1.7-1.7 1.7H3.2c-1 0-1.7-.8-1.7-1.7z" /></svg>,
  scribble: <svg viewBox="0 0 20 20"><path d="M3 15.5c2.5-4 5-8.6 7-8.6 1.6 0-1.8 6.6.2 6.6 1.7 0 3.6-4.6 5.2-4.6 1.2 0-.4 3.4.8 3.4.8 0 1.4-.8 1.8-1.4" /></svg>,
};

/** The notes list: the board selected (its scribble mark after its name, its sketch at the right),
 *  then the same life's notes the Notes chapter shows. */
const ROWS = [
  { title: BOARD_NAME, when: "9:40 AM", first: "Studio North offer · Take it now? · Start in…", folder: "Work", board: true },
  { title: "Deep Work", when: "Yesterday", first: "Deep work is rare, and worth more every year.", folder: "Reading" },
  { title: "Miso salmon", when: "Yesterday", first: "20 min. Rice, greens and a quick glaze.", folder: "Recipes" },
  { title: "Kyoto in April", when: "Monday", first: "Six days, two cities. Book the ryokan.", folder: "Trips" },
  { title: "Morning run", when: "Sunday", first: "Three a week, before work. Easy pace.", folder: "Health" },
];

/** The board's sketch in the list, as the app draws a board's row: its shapes, small, in their fills. */
function Sketch({ dark }: { dark?: boolean }) {
  const f = FILL[dark ? "dark" : "light"], ink = dark ? "#ebddd1" : "#2a1d10";
  return (
    <svg className={w.sketch} viewBox="0 0 40 40" aria-hidden="true">
      <g stroke={ink} strokeWidth="0.9" strokeLinecap="round">
        <ellipse cx="9" cy="15" rx="5.5" ry="3.6" fill="none" />
        <path d="M20 10.5l5.5 4.5-5.5 4.5-5.5-4.5z" fill={f.yellow} />
        <rect x="27.5" y="12.2" width="9.5" height="5.6" rx="1.2" fill="none" strokeDasharray="1.6 1.4" />
        <rect x="14.5" y="24" width="11" height="5.6" rx="1.2" fill={f.pink} />
        <ellipse cx="32" cy="27" rx="5" ry="3.4" fill={f.pink} />
        <path d="M14.5 15h-0.2M20 19.5v4.4M25.5 27h1.6" fill="none" />
      </g>
    </svg>
  );
}

/** Pinto on a Mac with the board open. `list`: the notes list shows (the Notes chapter's frame); without
 *  it the board has the window to itself, the columns hidden. */
export function WbMac({ dark, list = true, on, crop }: { dark?: boolean; list?: boolean; on: boolean; crop?: boolean }) {
  return (
    <div className={`${w.mac} ${dark ? w.dark : ""} ${list ? w.withList : w.noList}`} data-crop={crop || undefined} role="img" aria-label="Pinto Notes on a Mac with the whiteboard Now or March? open: Studio North offer, take it now? Yes, dashed, leads to starting in January with the launch half done. Claude has just added the no arrow, to finishing the launch and shipping in February, then talking again in March.">
      <div className={w.bar} aria-hidden="true">
        <span className={w.lights}><i /><i /><i /></span>
        {list && (
          <span className={w.listBar}>
            <span className={w.ico}>{I.side}</span>
            <span className={w.ico}>{I.search}</span>
            <span className={w.pill}>All Notes</span>
          </span>
        )}
        <span className={w.boardBar}>
          <span className={w.ico}>{I.back}</span>
          <span className={`${w.ico} ${w.dim}`}>{I.fwd}</span>
          <span className={w.crumb}><span>Work</span><b>{BOARD_NAME}</b></span>
          <span className={w.tools}>
            <span className={`${w.ico} ${w.picked}`}>{I.select}</span>
            <span className={w.ico}>{I.hand}</span>
            <span className={w.ico}>{I.pencil}</span>
            <span className={w.ico}>{I.rect}</span>
            <span className={w.ico}>{I.arrow}</span>
            <span className={w.ico}>{I.text}</span>
            <span className={w.ico}>{I.eraser}</span>
            <span className={w.ico}>{I.library}</span>
            <span className={w.ico}>{I.comment}</span>
            <span className={w.ico}>{I.full}</span>
            <span className={w.ico}><AIGlyph name="claude" size={17} /></span>
            <span className={w.ico}>{I.share}</span>
            <span className={w.ico}>{I.more}</span>
          </span>
        </span>
      </div>
      {list && (
        <nav className={w.list} aria-hidden="true">
          <ul>
            {ROWS.map((x) => (
              <li key={x.title} data-on={x.board || undefined}>
                <span className={w.rowText}>
                  <b>{x.title}{x.board && <span className={w.scribble}>{I.scribble}</span>}</b>
                  <span className={w.when}>{x.when} · {x.first}</span>
                  <span className={w.in}>{I.folder}{x.folder}</span>
                </span>
                {x.board && <Sketch dark={dark} />}
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className={w.canvas}>
        <div className={w.fit}><WbBoard board="wide" dark={dark} on={on} /></div>
        <WbReceipt on={on} />
        <span className={w.zoom} aria-hidden="true">80%</span>
      </div>
    </div>
  );
}

/** The phone's crop of the window: its top-left corner (traffic lights, back, the folder and name),
 *  the compact board large, the window running off the right and the bottom. */
export function WbMacCrop({ dark, on }: { dark?: boolean; on: boolean }) {
  return (
    <div className={`${w.mac} ${w.noList} ${w.cropPhone} ${dark ? w.dark : ""}`} data-crop role="img" aria-label="Pinto Notes on a Mac, the whiteboard Now or March? open, with Claude's new no arrow outlined and named.">
      <div className={w.bar} aria-hidden="true">
        <span className={w.lights}><i /><i /><i /></span>
        <span className={w.boardBar}>
          <span className={w.ico}>{I.back}</span>
          <span className={`${w.ico} ${w.dim}`}>{I.fwd}</span>
          <span className={w.crumb}><span>Work</span><b>{BOARD_NAME}</b></span>
          <span className={w.tools}>
            <span className={`${w.ico} ${w.picked}`}>{I.select}</span>
            <span className={w.ico}>{I.hand}</span>
            <span className={w.ico}>{I.pencil}</span>
          </span>
        </span>
      </div>
      <div className={w.canvas}><div className={w.fitTall}><WbBoard board="tall" dark={dark} on={on} /></div></div>
    </div>
  );
}

/* ───────────────────────── The iPhone ───────────────────────── */

const D = {
  select: <svg viewBox="0 0 20 20"><path d="M5 2.6v13.8l3.6-3.5 2.6 5.4 2.4-1.1-2.5-5.3h5z" /></svg>,
  pencil: I.pencil, arrow: I.arrow, eraser: I.eraser, library: I.library,
  shapes: <svg viewBox="0 0 20 20"><rect x="2.6" y="2.6" width="9.4" height="9.4" rx="1.4" /><circle cx="12.6" cy="12.6" r="4.8" /></svg>,
  text: <svg viewBox="0 0 20 20"><rect x="2.4" y="3" width="15.2" height="14" rx="2.4" /><path d="M6.6 13.6 10 6.2l3.4 7.4M7.8 11h4.4" /></svg>,
  comment: <svg viewBox="0 0 20 20"><path d="M3.8 3.4h12.4a1.6 1.6 0 0 1 1.6 1.6v7.6a1.6 1.6 0 0 1-1.6 1.6H9.4l-3.8 3v-3H3.8a1.6 1.6 0 0 1-1.6-1.6V5a1.6 1.6 0 0 1 1.6-1.6zM10 6.4v5M7.5 8.9h5" /></svg>,
};

/** The same board in Pinto on an iPhone: the way back to Work and the more button, the board upright,
 *  and the app's dock at the foot (Select in hand; Style, the colour wheel, last). */
export function WbPhone({ dark, on, className = "" }: { dark?: boolean; on: boolean; className?: string }) {
  return (
    <div className={`${w.phone} ${dark ? w.dark : ""} ${className}`} role="img" aria-label="The same whiteboard in Pinto Notes on an iPhone, with Claude's new arrow outlined and named.">
      <div className={w.screen}>
        <p className={w.status}><b>9:41</b><span className={w.island} /><span className={w.sIcons}><i /><i /><i /></span></p>
        <p className={w.nav}><span><svg viewBox="0 0 10 16"><path d="M8 2 L2 8 L8 14" /></svg>Work</span><span className={w.navMore}>{I.more}</span></p>
        <div className={w.phoneBoard}><WbBoard board="upright" dark={dark} on={on} /></div>
        <span className={w.dock}>
          {(["select", "pencil", "shapes", "arrow", "text", "eraser", "library", "comment"] as const).map((k) => (
            <i key={k} data-picked={k === "select" || undefined}>{D[k]}</i>
          ))}
          <i className={w.style} />
        </span>
      </div>
    </div>
  );
}

/* ───────────────────────── The chapter's picture, per variant ───────────────────────── */

/** a: the light window with the iPhone over its corner. b: the light window, cropped by the page so the
 *  board can be big. c: a in dark mode. On a phone: a is the iPhone, b and c a crop of the window. */
export function WbArt({ v, bind }: { v: "a" | "b" | "c"; bind: (set: (k: number) => void) => () => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => bind((k) => setOn(k > 0.3)), [bind]);
  const dark = v === "c";
  return (
    <div className={w.stage} data-v={v}>
      <div className={w.wide}>
        {v === "b"
          ? <div className={w.bigCrop} data-crop><WbMac list={false} on={on} crop /></div>
          : <div className={w.pair}><WbMac dark={dark} on={on} /><WbPhone dark={dark} on={on} className={w.overPhone} /></div>}
      </div>
      <div className={w.narrow}>
        {v === "a"
          ? <WbPhone on={on} className={w.soloPhone} />
          : <div className={w.phoneCrop} data-crop><WbMacCrop dark={dark} on={on} /></div>}
      </div>
    </div>
  );
}

/* ───────────────────────── d: the original frame, holding the real board ───────────────────────── */

/** The board's toolbar as the app draws it in an active window (council-wb r16, real-one-box-selected,
 *  with Comments and Ask AI from final/46): three glass capsules at the top right, Select, Hand and
 *  Pencil; the shapes; then Arrow, Text, Eraser, Library, Comments, Full Screen, Ask AI (the connected
 *  AI's mark), Share and More. In a narrow window the app keeps Select (a menu), Comments, Share and
 *  More (final/46, narrow-760), so the phone shows that. */
const AA = <span className={w.aa}>Aa</span>;
/** The two the window draws differently from the list's set: the pencil (a slim pencil with its tip)
 *  and the shapes button (a wide rounded rectangle). */
const PENCIL = <svg viewBox="0 0 20 20" className={w.filled}><path d="M15.3 3.1a1 1 0 0 1 1.4 0l.2.2a1 1 0 0 1 0 1.4L6.6 15l-1.6-1.6z" /><path d="m4.6 13.8 1.6 1.6-2.6.9z" /></svg>;
const RECT = <svg viewBox="0 0 22 16"><rect x="1.4" y="1.4" width="19.2" height="13.2" rx="2.8" /></svg>;
type Tool = [key: string, icon: React.ReactNode];
const TOOLBAR: { mac: Tool[][]; narrow: Tool[][] } = {
  mac: [
    [["select", I.select], ["hand", I.hand], ["pencil", PENCIL]],
    [["rect", RECT]],
    [["arrow", I.arrow], ["text", AA], ["eraser", I.eraser], ["library", I.library], ["comment", I.comment], ["full", I.full], ["ai", <AIGlyph key="ai" name="claude" size={17} />], ["share", I.share], ["more", I.more]],
  ],
  narrow: [
    [["select", <>{I.select}<svg className={w.chev} viewBox="0 0 10 6"><path d="M1.2 1.2 5 4.8l3.8-3.6" /></svg></>]],
    [["comment", I.comment], ["share", I.share], ["more", I.more]],
  ],
};

function Toolbar({ set }: { set: "mac" | "narrow" }) {
  return (
    <span className={w.dTools} data-set={set} aria-hidden="true">
      {TOOLBAR[set].map((group, g) => (
        <span key={g} className={w.cap}>
          {group.map(([k, icon]) => <span key={k} className={w.ico} data-k={k} data-picked={k === "select" || undefined}>{icon}</span>)}
        </span>
      ))}
    </span>
  );
}

/** d (round 21, part 5): variant 0's frame, same place and size, holding the board as the app draws
 *  it: the white canvas, the pastel fills and dark hand strokes, the handwriting, the app's toolbar at
 *  the top right where the window puts it, and the zoom at the bottom right. Claude's "no" lands as the
 *  app marks an AI's change: a dashed outline in the accent with its name tag (council-wb r16,
 *  12-ai-drew). No window, no notes list, no iPhone, no receipt. */
export function WbCanvas({ bind }: { bind: (set: (k: number) => void) => () => void }) {
  const [on, setOn] = useState(false);
  useEffect(() => bind((k) => setOn(k > 0.3)), [bind]);
  return (
    <div className={w.dCanvas}>
      <Toolbar set="mac" />
      <Toolbar set="narrow" />
      <div className={w.dFit}>
        <div className={w.dWide}><WbBoard board="wide" on={on} /></div>
        <div className={w.dTall}><WbBoard board="tall" on={on} /></div>
      </div>
      <span className={w.dZoom} aria-hidden="true">100%</span>
    </div>
  );
}
