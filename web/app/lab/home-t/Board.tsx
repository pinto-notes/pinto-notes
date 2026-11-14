import localFont from "next/font/local";
import s from "./t.module.css";

// The whiteboard in the story: "Training plan", drawn in Excalidraw's hand-drawn look and font, the
// way a Pinto whiteboard draws it. Every stroke is a path with pathLength 1 and a data-k key, so the
// story's scroll timeline (Story.tsx) can draw it stroke by stroke. The last two steps (the "no"
// arrow and "Rest week") are ChatGPT's, drawn under its cursor. Stroke helpers from study Q.

export const hand = localFont({ src: "./Excalifont-Regular.woff2", display: "block" });

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f = (n: number) => n.toFixed(1);

function line(r: () => number, x1: number, y1: number, x2: number, y2: number, over = 2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const j = () => (r() - 0.5) * 1.6;
  const ax = x1 - ux * over + j(), ay = y1 - uy * over + j(), bx = x2 + ux * over + j(), by = y2 + uy * over + j();
  const bow = (r() - 0.5) * Math.min(6, len * 0.035);
  const c1x = ax + dx / 3 - uy * bow, c1y = ay + dy / 3 + ux * bow, c2x = ax + (dx * 2) / 3 - uy * bow, c2y = ay + (dy * 2) / 3 + ux * bow;
  return `M${f(ax)} ${f(ay)} C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(bx)} ${f(by)}`;
}

function box(r: () => number, x: number, y: number, w: number, h: number, rad = 12) {
  const j = () => (r() - 0.5) * 1.6;
  const p = [
    [x + rad, y + j()], [x + w - rad, y + j()], [x + w + j(), y + rad], [x + w + j(), y + h - rad],
    [x + w - rad, y + h + j()], [x + rad, y + h + j()], [x + j(), y + h - rad], [x + j(), y + rad],
  ];
  const q = (cx: number, cy: number, ex: number, ey: number) => `Q${f(cx + j())} ${f(cy + j())} ${f(ex)} ${f(ey)}`;
  return `M${f(p[0][0])} ${f(p[0][1])} L${f(p[1][0])} ${f(p[1][1])} ${q(x + w, y, p[2][0], p[2][1])} L${f(p[3][0])} ${f(p[3][1])} ${q(x + w, y + h, p[4][0], p[4][1])} L${f(p[5][0])} ${f(p[5][1])} ${q(x, y + h, p[6][0], p[6][1])} L${f(p[7][0])} ${f(p[7][1])} ${q(x, y, p[0][0] + 7, p[0][1] + j())}`;
}
const clean = (x: number, y: number, w: number, h: number, rad = 12) => `M${x + rad} ${y} h${w - 2 * rad} q${rad} 0 ${rad} ${rad} v${h - 2 * rad} q0 ${rad} ${-rad} ${rad} h${-(w - 2 * rad)} q${-rad} 0 ${-rad} ${-rad} v${-(h - 2 * rad)} q0 ${-rad} ${rad} ${-rad}z`;

function ellipse(r: () => number, cx: number, cy: number, rx: number, ry: number) {
  const n = 30, start = -Math.PI * 0.6, pts: string[] = [];
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

function arrow(r: () => number, x1: number, y1: number, x2: number, y2: number) {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 13, s1 = a + Math.PI * 0.84, s2 = a - Math.PI * 0.84;
  return [line(r, x1, y1, x2, y2, 0), `${line(r, x2, y2, x2 + Math.cos(s1) * h, y2 + Math.sin(s1) * h, 0)} ${line(r, x2, y2, x2 + Math.cos(s2) * h, y2 + Math.sin(s2) * h, 0)}`];
}

type B4 = [number, number, number, number];
type P2 = [number, number];
export type BoardLayout = {
  w: number; h: number; font: number; title: [number, number, number];
  a: B4; b: B4; c: B4; d: B4; e: B4; fx: B4;
  ab: B4; bc: B4; cd: B4; de: B4; no: B4; yes: P2; noAt: P2; cursor: P2;
};

/** Wide, for a desktop: the plan reads left to right, then down to race day. */
export const WIDE: BoardLayout = {
  w: 680, h: 560, font: 25, title: [22, 50, 38],
  a: [22, 104, 184, 76], b: [276, 104, 184, 76], c: [368, 318, 116, 74], d: [524, 284, 140, 70], e: [586, 482, 84, 42], fx: [60, 438, 190, 72],
  ab: [212, 142, 268, 142], bc: [368, 186, 368, 238], cd: [490, 318, 518, 318], de: [594, 360, 590, 432], no: [306, 372, 222, 430],
  yes: [504, 300], noAt: [250, 392], cursor: [250, 510],
};
/** Tall, for a phone. */
export const TALL: BoardLayout = {
  w: 320, h: 430, font: 17, title: [8, 30, 26],
  a: [6, 56, 136, 56], b: [176, 56, 136, 56], c: [244, 196, 70, 48], d: [184, 302, 120, 50], e: [244, 398, 60, 26], fx: [10, 290, 128, 52],
  ab: [146, 84, 172, 84], bc: [244, 116, 244, 144], cd: [244, 248, 244, 296], de: [244, 356, 244, 368], no: [178, 214, 104, 284],
  yes: [262, 276], noAt: [128, 238], cursor: [138, 342],
};

/** Where your pen is at the end of each step (0 = before the first), for the cursor that draws. */
export function penPoints(L: BoardLayout): [number, number][] {
  const [ax, ay, aw, ah] = L.a, [bx, by, bw, bh] = L.b, [cx, cy, , chh] = L.c, [dx, dy, dw, dh] = L.d, [ex, ey, erx, ery] = L.e;
  return [
    [L.title[0] + L.title[2] * 5.4, L.title[1] + 6], [ax + aw, ay + ah], [L.ab[2], L.ab[3]], [bx + bw, by + bh], [L.bc[2], L.bc[3]],
    [cx, cy + chh], [L.cd[2], L.cd[3]], [dx + dw, dy + dh], [L.de[2], L.de[3]], [ex + erx * 0.72, ey + ery * 0.72],
  ];
}

/** The steps, in drawing order. Steps 10 and 11 are ChatGPT's. */
export const BOARD_STEPS = 12;

export function Board({ L }: { L: BoardLayout }) {
  const r = rng(11);
  let n = 0;
  const ink = (d: string, k: string, ai = false) => <path key={n++} className={s.ink} data-ai={ai || undefined} d={d} pathLength={1} data-k={k} />;
  const word = (x: number, y: number, t: string, k: string, size = L.font) => <text key={k + t} className={s.word} x={x} y={y} fontSize={size} textAnchor="middle" data-k={k}>{t}</text>;
  const [ax, ay, aw, ah] = L.a, [bx, by, bw, bh] = L.b, [cx, cy, chw, chh] = L.c, [dx, dy, dw, dh] = L.d, [ex, ey, erx, ery] = L.e, [fx, fy, fw, fh] = L.fx;
  const mid = L.font * 0.36;
  const ab = arrow(r, ...L.ab), bc = arrow(r, ...L.bc), cd = arrow(r, ...L.cd), de = arrow(r, ...L.de), no = arrow(r, ...L.no);
  return (
    <svg className={`${s.board} ${hand.className}`} viewBox={`0 0 ${L.w} ${L.h}`} aria-hidden="true">
      <text className={s.word} x={L.title[0]} y={L.title[1]} fontSize={L.title[2]} data-k="bx0">Training plan</text>
      <path className={s.fill} d={clean(ax, ay, aw, ah)} fill="#a5d8ff" data-k="bx1" />
      {ink(box(r, ax, ay, aw, ah), "bs1")}{word(ax + aw / 2, ay + ah / 2 + mid, "Easy runs", "bx1")}
      {ab.map((d) => ink(d, "bs2"))}
      <path className={s.fill} d={clean(bx, by, bw, bh)} fill="#a5d8ff" data-k="bx3" />
      {ink(box(r, bx, by, bw, bh), "bs3")}{word(bx + bw / 2, by + bh / 2 + mid, "Long runs", "bx3")}
      {bc.map((d) => ink(d, "bs4"))}
      {ink(diamond(r, cx, cy, chw, chh), "bs5")}{word(cx, cy + mid, "Feel good?", "bx5", L.font * 0.92)}
      {cd.map((d) => ink(d, "bs6"))}{word(L.yes[0], L.yes[1], "yes", "bx6", L.font * 0.78)}
      <path className={s.fill} d={clean(dx, dy, dw, dh)} fill="#b2f2bb" data-k="bx7" />
      {ink(box(r, dx, dy, dw, dh), "bs7")}{word(dx + dw / 2, dy + dh / 2 + mid, "Taper", "bx7")}
      {de.map((d) => ink(d, "bs8"))}
      <ellipse className={s.fill} cx={ex} cy={ey} rx={erx} ry={ery} fill="#ffec99" data-k="bx9" />
      {ink(ellipse(r, ex, ey, erx, ery), "bs9")}{word(ex, ey + mid, "Race day", "bx9")}
      {/* ChatGPT's part. */}
      {no.map((d) => ink(d, "bs10", true))}{word(L.noAt[0], L.noAt[1], "no", "bx10", L.font * 0.78)}
      <path className={s.fill} d={clean(fx, fy, fw, fh)} fill="#ffc9c9" data-k="bx11" />
      {ink(box(r, fx, fy, fw, fh), "bs11", true)}{word(fx + fw / 2, fy + fh / 2 + mid, "Rest week", "bx11")}
      <g data-k="ucur">
        <path d="M0 0 L0 19 L5 14 L8.8 22.4 L12.2 20.8 L8.5 12.8 L15.2 12.6 Z" fill="#1e1e1e" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
      <g data-k="bcur" style={{ transformOrigin: "0 0" }}>
        <g transform={`translate(${L.cursor[0]} ${L.cursor[1]})`}>
          <path d="M0 0 L0 19 L5 14 L8.8 22.4 L12.2 20.8 L8.5 12.8 L15.2 12.6 Z" fill="#10a37f" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="15" y="17" width="68" height="24" rx="7" fill="#10a37f" />
          <text x="49" y="33.5" className={s.cursorName} textAnchor="middle">ChatGPT</text>
        </g>
      </g>
    </svg>
  );
}
