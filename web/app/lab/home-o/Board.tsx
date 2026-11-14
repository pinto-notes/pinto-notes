import localFont from "next/font/local";
import s from "./o.module.css";

// The "Publishing flow" whiteboard, as the app draws it (same words and fills as the capture in
// public/lab/big3/canvas-selected-light-main.webp), in Excalidraw's hand-drawn look and font.
// Claude is drawing the last box, "Fix it": its strokes run in while Draw is on screen, with its cursor
// beside it, the way a collaborator's shows on a whiteboard. Two layouts: wide for the Mac window,
// stacked for a phone. The stroke helpers are study J's (lab/home-j/Board.tsx).

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
const clean = (x: number, y: number, w: number, h: number, rad = 10) => `M${x + rad} ${y} h${w - 2 * rad} q${rad} 0 ${rad} ${rad} v${h - 2 * rad} q0 ${rad} ${-rad} ${rad} h${-(w - 2 * rad)} q${-rad} 0 ${-rad} ${-rad} v${-(h - 2 * rad)} q0 ${-rad} ${rad} ${-rad}z`;

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

type Layout = {
  view: string;
  idea: [number, number, number, number]; draft: [number, number, number, number]; ready: [number, number, number, number];
  pub: [number, number, number, number]; fix: [number, number, number, number];
  arrows: [number, number, number, number][]; yes: [number, number]; no: [number, number]; cursor: [number, number];
};

// Wide: the capture's layout, Idea to Publish in a row, Fix it under Ready?.
const WIDE: Layout = {
  view: "0 0 660 330",
  idea: [86, 118, 64, 32], draft: [186, 90, 124, 56], ready: [412, 118, 72, 48], pub: [526, 90, 120, 56], fix: [356, 232, 116, 54],
  arrows: [[152, 118, 182, 118], [312, 118, 336, 118], [486, 118, 522, 118], [416, 168, 422, 226]],
  yes: [503, 106], no: [436, 200], cursor: [470, 280],
};
// Stacked, for a phone: study J's geometry.
const TALL: Layout = {
  view: "0 0 400 466",
  idea: [132, 56, 64, 30], draft: [72, 128, 120, 54], ready: [132, 272, 74, 50], pub: [268, 245, 112, 54], fix: [78, 386, 108, 50],
  arrows: [[132, 88, 132, 124], [132, 184, 132, 218], [208, 272, 264, 272], [132, 324, 132, 382]],
  yes: [236, 262], no: [150, 358], cursor: [184, 428],
};

function draw(L: Layout, seed: number) {
  const r = rng(seed);
  return {
    idea: ellipse(r, ...L.idea), draft: box(r, ...L.draft), ready: diamond(r, ...L.ready), pub: box(r, ...L.pub), fix: box(r, ...L.fix),
    arrows: L.arrows.map((a) => arrow(r, ...a)),
  };
}

function Drawing({ L, seed, wide }: { L: Layout; seed: number; wide: boolean }) {
  const d = draw(L, seed);
  const ink = (p: string, k?: string, cls = s.ink) => <path key={k} className={cls} d={p} pathLength={1} />;
  const word = (x: number, y: number, t: string, size = 17, cls = s.word) => <text className={cls} x={x} y={y} fontSize={size} textAnchor="middle">{t}</text>;
  const [ix, iy, irx, iry] = L.idea, [dx, dy, dw, dh] = L.draft, [rx, ry] = L.ready, [px, py, pw, ph] = L.pub, [fx, fy, fw, fh] = L.fix;
  const last = d.arrows.length - 1;
  return (
    <svg className={`${s.board} ${hand.className}`} data-layout={wide ? "wide" : "tall"} viewBox={L.view} aria-hidden="true">
      <g fill="none">
        <ellipse cx={ix} cy={iy} rx={irx} ry={iry} fill="#ffec99" />{ink(d.idea)}{word(ix, iy + 6, "Idea")}
        {d.arrows.slice(0, last).map((a, i) => a.map((p, k) => ink(p, `a${i}${k}`)))}
        {ink(d.draft)}{word(dx + dw / 2, dy + dh / 2 + 6, "Draft")}
        {ink(d.ready)}{word(rx, ry + 6, "Ready?")}
        {word(L.yes[0], L.yes[1], "yes", 15)}
        <path d={clean(px, py, pw, ph)} fill="#b2f2bb" />{ink(d.pub)}{word(px + pw / 2, py + ph / 2 + 6, "Publish")}
        {/* What Claude is drawing now: the "no" arrow, then Fix it. */}
        <g className={s.live}>
          {d.arrows[last].map((p, k) => ink(p, `l${k}`, `${s.ink} ${s.drawn}`))}
          {word(L.no[0], L.no[1], "no", 15, `${s.word} ${s.after}`)}
          <path className={s.fill} d={clean(fx, fy, fw, fh)} fill="#ffc9c9" />
          {ink(d.fix, "fix", `${s.ink} ${s.drawn} ${s.drawnLate}`)}
          {word(fx + fw / 2, fy + fh / 2 + 6, "Fix it", 17, `${s.word} ${s.after}`)}
        </g>
      </g>
      <g className={s.cursor} transform={`translate(${L.cursor[0]} ${L.cursor[1]})`}>
        <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill="#d97757" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        <rect x="14" y="15" width="54" height="21" rx="6" fill="#d97757" />
        <text x="41" y="29.5" className={s.cursorName} textAnchor="middle">Claude</text>
      </g>
    </svg>
  );
}

export function Board() {
  return (
    <div className={s.boardBox} role="img" aria-label="A whiteboard called Publishing flow, drawn by hand: Idea, then Draft, then Ready? If yes, Publish. If no, Fix it, which Claude is drawing now.">
      <Drawing L={WIDE} seed={7} wide />
      <Drawing L={TALL} seed={7} wide={false} />
    </div>
  );
}
