import localFont from "next/font/local";
import s from "./j.module.css";

// The whiteboard card's front: the app's "Publishing flow" whiteboard (same words, same fills as the
// capture in public/lab/big3), stacked to fit a tall card, in Excalidraw's hand-drawn look and font.
// Claude Code drew it: its cursor sits by the last box, as a collaborator's does on a whiteboard.
// The geometry is study D's (lab/home-d/Board.tsx), drawn finished.

// Excalifont, the whiteboard's font (Excalidraw, SIL Open Font License 1.1), as the app ships it.
const hand = localFont({ src: "./Excalifont-Regular.woff2", display: "block" });

/** A seeded random, so the server and the browser draw the same wobble. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f = (n: number) => n.toFixed(1);

/** One hand-drawn stroke from a to b: ends nudged, a slight bow, a little overshoot. */
function line(r: () => number, x1: number, y1: number, x2: number, y2: number, over = 2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const j = () => (r() - 0.5) * 1.6;
  const ax = x1 - ux * over + j(), ay = y1 - uy * over + j(), bx = x2 + ux * over + j(), by = y2 + uy * over + j();
  const bow = (r() - 0.5) * Math.min(5, len * 0.03);
  const c1x = ax + dx / 3 - uy * bow, c1y = ay + dy / 3 + ux * bow, c2x = ax + (dx * 2) / 3 - uy * bow, c2y = ay + (dy * 2) / 3 + ux * bow;
  return `M${f(ax)} ${f(ay)} C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(bx)} ${f(by)}`;
}

/** A rounded box as Excalidraw draws one: one stroke around, the end running a little past the start. */
function box(r: () => number, x: number, y: number, w: number, h: number, rad = 10) {
  const j = () => (r() - 0.5) * 1.4;
  const p = [
    [x + rad, y + j()], [x + w - rad, y + j()], [x + w + j(), y + rad], [x + w + j(), y + h - rad],
    [x + w - rad, y + h + j()], [x + rad, y + h + j()], [x + j(), y + h - rad], [x + j(), y + rad],
  ];
  const q = (cx: number, cy: number, ex: number, ey: number) => `Q${f(cx + j())} ${f(cy + j())} ${f(ex)} ${f(ey)}`;
  return `M${f(p[0][0])} ${f(p[0][1])} L${f(p[1][0])} ${f(p[1][1])} ${q(x + w, y, p[2][0], p[2][1])} L${f(p[3][0])} ${f(p[3][1])} ${q(x + w, y + h, p[4][0], p[4][1])} L${f(p[5][0])} ${f(p[5][1])} ${q(x, y + h, p[6][0], p[6][1])} L${f(p[7][0])} ${f(p[7][1])} ${q(x, y, p[0][0] + 6, p[0][1] + j())}`;
}

/** An ellipse, drawn once round and a little further, the way a hand closes it. */
function ellipse(r: () => number, cx: number, cy: number, rx: number, ry: number) {
  const n = 28, start = -Math.PI * 0.6, pts: string[] = [];
  for (let i = 0; i <= n + 3; i++) {
    const a = start + (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.025 + (i > n ? 0.03 : 0);
    pts.push(`${f(cx + Math.cos(a) * rx * k)} ${f(cy + Math.sin(a) * ry * k)}`);
  }
  return `M${pts[0]} L${pts.slice(1).join(" L")}`;
}

function diamond(r: () => number, cx: number, cy: number, hw: number, hh: number) {
  const t: [number, number] = [cx, cy - hh], ri: [number, number] = [cx + hw, cy], b: [number, number] = [cx, cy + hh], l: [number, number] = [cx - hw, cy];
  return [line(r, ...t, ...ri, 1), line(r, ...ri, ...b, 1), line(r, ...b, ...l, 1), line(r, ...l, ...t, 1)].join(" ");
}

/** An arrow: the shaft, then the two strokes of its head. */
function arrow(r: () => number, x1: number, y1: number, x2: number, y2: number) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 11, s1 = a + Math.PI * 0.84, s2 = a - Math.PI * 0.84;
  return [line(r, x1, y1, x2, y2, 0), `${line(r, x2, y2, x2 + Math.cos(s1) * h, y2 + Math.sin(s1) * h, 0)} ${line(r, x2, y2, x2 + Math.cos(s2) * h, y2 + Math.sin(s2) * h, 0)}`];
}

// The shapes, in the order a hand draws them. Fills are Excalidraw's yellow, green and red.
const r = rng(7);
const IDEA = { fill: "#ffec99", d: ellipse(r, 132, 56, 64, 30), clean: "M68 56 a64 30 0 1 0 128 0 a64 30 0 1 0 -128 0" };
const DRAFT = { d: box(r, 72, 128, 120, 54), clean: "M82 128 h100 q10 0 10 10 v34 q0 10 -10 10 h-100 q-10 0 -10 -10 v-34 q0 -10 10 -10z" };
const READY = { d: diamond(r, 132, 272, 74, 50) };
const PUB = { fill: "#b2f2bb", d: box(r, 268, 245, 112, 54), clean: "M278 245 h92 q10 0 10 10 v34 q0 10 -10 10 h-92 q-10 0 -10 -10 v-34 q0 -10 10 -10z" };
const FIX = { fill: "#ffc9c9", d: box(r, 78, 386, 108, 50), clean: "M88 386 h88 q10 0 10 10 v30 q0 10 -10 10 h-88 q-10 0 -10 -10 v-30 q0 -10 10 -10z" };
const A1 = arrow(r, 132, 88, 132, 124);
const A2 = arrow(r, 132, 184, 132, 218);
const A3 = arrow(r, 208, 272, 264, 272);
const A4 = arrow(r, 132, 324, 132, 382);

export function Board() {
  const st = (d: string, key?: string) => <path key={key} className={s.ink} d={d} />;
  const fill = (d: string, c: string) => <path d={d} fill={c} />;
  const word = (x: number, y: number, t: string, size = 17) => <text className={s.word} x={x} y={y} fontSize={size} textAnchor="middle">{t}</text>;
  return (
    <svg className={`${s.board} ${hand.className}`} viewBox="0 0 400 466" role="img"
      aria-label="A whiteboard called Publishing flow, drawn by hand: Idea, then Draft, then Ready? If yes, Publish. If no, Fix it.">
      <g fill="none">
        {fill(IDEA.clean, IDEA.fill)}{st(IDEA.d)}{word(132, 62, "Idea")}
        {A1.map((d, i) => st(d, `a1${i}`))}
        {st(DRAFT.d)}{word(132, 161, "Draft")}
        {A2.map((d, i) => st(d, `a2${i}`))}
        {st(READY.d)}{word(132, 278, "Ready?")}
        {A3.map((d, i) => st(d, `a3${i}`))}{word(236, 262, "yes", 15)}
        {fill(PUB.clean, PUB.fill)}{st(PUB.d)}{word(324, 278, "Publish")}
        {A4.map((d, i) => st(d, `a4${i}`))}{word(150, 358, "no", 15)}
        {fill(FIX.clean, FIX.fill)}{st(FIX.d)}{word(132, 417, "Fix it")}
      </g>
      <g transform="translate(196 424)" aria-hidden="true">
        <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill="#d97757" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="14" y="15" width="84" height="21" rx="6" fill="#d97757" />
        <text x="56" y="29.5" className={s.cursorName} textAnchor="middle">Claude Code</text>
      </g>
    </svg>
  );
}
