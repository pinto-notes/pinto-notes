import { hand } from "./fonts";
import s from "./t.module.css";

// The whiteboard: "Training plan", drawn in Excalidraw's hand-drawn look and font, the way a Pinto
// whiteboard draws it. Every stroke is a path with pathLength 1 and a data-k key, so the story's
// timeline can draw it stroke by stroke. Steps 8 and 9 (the last arrow and "Race day") are ChatGPT's.
// The two run boxes are groups of their own: they fly into the habit tracker's rows in the next beat.
// The board's viewBox is the canvas itself, so its numbers are canvas units.

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

function box(r: () => number, x: number, y: number, w: number, h: number, rad = 14) {
  const j = () => (r() - 0.5) * 1.8;
  const p = [
    [x + rad, y + j()], [x + w - rad, y + j()], [x + w + j(), y + rad], [x + w + j(), y + h - rad],
    [x + w - rad, y + h + j()], [x + rad, y + h + j()], [x + j(), y + h - rad], [x + j(), y + rad],
  ];
  const q = (cx: number, cy: number, ex: number, ey: number) => `Q${f(cx + j())} ${f(cy + j())} ${f(ex)} ${f(ey)}`;
  return `M${f(p[0][0])} ${f(p[0][1])} L${f(p[1][0])} ${f(p[1][1])} ${q(x + w, y, p[2][0], p[2][1])} L${f(p[3][0])} ${f(p[3][1])} ${q(x + w, y + h, p[4][0], p[4][1])} L${f(p[5][0])} ${f(p[5][1])} ${q(x, y + h, p[6][0], p[6][1])} L${f(p[7][0])} ${f(p[7][1])} ${q(x, y, p[0][0] + 7, p[0][1] + j())}`;
}
const clean = (x: number, y: number, w: number, h: number, rad = 14) => `M${x + rad} ${y} h${w - 2 * rad} q${rad} 0 ${rad} ${rad} v${h - 2 * rad} q0 ${rad} ${-rad} ${rad} h${-(w - 2 * rad)} q${-rad} 0 ${-rad} ${-rad} v${-(h - 2 * rad)} q0 ${-rad} ${rad} ${-rad}z`;

function ellipse(r: () => number, cx: number, cy: number, rx: number, ry: number) {
  const n = 34, start = -Math.PI * 0.6, pts: string[] = [];
  for (let i = 0; i <= n + 3; i++) {
    const a = start + (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.022 + (i > n ? 0.03 : 0);
    pts.push(`${f(cx + Math.cos(a) * rx * k)} ${f(cy + Math.sin(a) * ry * k)}`);
  }
  return `M${pts[0]} L${pts.slice(1).join(" L")}`;
}

function diamond(r: () => number, cx: number, cy: number, hw: number, hh: number) {
  const t: [number, number] = [cx, cy - hh], ri: [number, number] = [cx + hw, cy], b: [number, number] = [cx, cy + hh], l: [number, number] = [cx - hw, cy];
  return [line(r, ...t, ...ri, 1), line(r, ...ri, ...b, 1), line(r, ...b, ...l, 1), line(r, ...l, ...t, 1)].join(" ");
}

function arrow(r: () => number, x1: number, y1: number, x2: number, y2: number, h = 14) {
  const a = Math.atan2(y2 - y1, x2 - x1), s1 = a + Math.PI * 0.84, s2 = a - Math.PI * 0.84;
  return `${line(r, x1, y1, x2, y2, 0)} ${line(r, x2, y2, x2 + Math.cos(s1) * h, y2 + Math.sin(s1) * h, 0)} ${line(r, x2, y2, x2 + Math.cos(s2) * h, y2 + Math.sin(s2) * h, 0)}`;
}

type B4 = [number, number, number, number];
type P2 = [number, number];
export type BoardLayout = {
  w: number; h: number; font: number; title: [number, number, number];
  a: B4; b: B4; c: B4; d: B4; e: B4; // boxes are x, y, w, h; c is the diamond (cx, cy, hw, hh), e the ellipse (cx, cy, rx, ry)
  ab: B4; bc: B4; cd: B4; de: B4; yes: P2; head: number;
  notes: [number, number, string][]; // your hand-written notes under the boxes
  sticky: [number, number, number, number, number, string[]]; // x, y, w, h, font, lines
};

/** Wide, for a desktop canvas (1280 x 720): the plan reads left to right, race day under the taper. */
export const WIDE: BoardLayout = {
  w: 1280, h: 720, font: 34, title: [64, 276, 46], head: 16,
  a: [64, 322, 236, 98], b: [384, 322, 236, 98], c: [810, 371, 122, 82], d: [1018, 322, 196, 98], e: [1090, 590, 124, 52],
  ab: [310, 371, 374, 371], bc: [630, 371, 680, 371], cd: [934, 371, 1008, 371], de: [1112, 428, 1100, 528], yes: [971, 352],
  notes: [[182, 462, "Mon, Wed, Fri"], [502, 462, "Sundays"]],
  sticky: [96, 528, 300, 128, 30, ["Goal: under", "2 hours"]],
};
/** Tall, for a phone canvas (360 x 660). */
export const TALL: BoardLayout = {
  w: 360, h: 660, font: 21, title: [20, 206, 29], head: 10,
  a: [20, 224, 140, 62], b: [200, 224, 140, 62], c: [270, 376, 72, 50], d: [205, 478, 135, 58], e: [92, 507, 72, 34],
  ab: [166, 255, 194, 255], bc: [270, 292, 270, 320], cd: [270, 430, 270, 470], de: [199, 507, 170, 507], yes: [292, 456],
  notes: [],
  sticky: [24, 336, 140, 92, 19, ["Goal: under", "2 hours"]],
};

/** Where a pen is at the end of each step: 0 before the first, 1 to 8 yours (8 the sticky note),
 *  9 and 10 ChatGPT's (the start of its arrow, and the end of the ellipse). */
export function penPoints(L: BoardLayout): [number, number][] {
  const [ax, ay, aw, ah] = L.a, [bx, by, bw, bh] = L.b, [cx, cy, , chh] = L.c, [dx, dy, dw, dh] = L.d, [ex, ey, erx, ery] = L.e;
  const st = -Math.PI * 0.6 + 0.2;
  return [
    [L.title[0] + L.title[2] * 6.1, L.title[1] - L.title[2] * 0.2], [ax + aw, ay + ah], [L.ab[2], L.ab[3]], [bx + bw, by + bh], [L.bc[2], L.bc[3]],
    [cx, cy - chh], [L.cd[2], L.cd[3]], [dx + dw, dy + dh], [L.sticky[0] + L.sticky[2], L.sticky[1] + L.sticky[3]],
    [L.de[0], L.de[1]], [ex + Math.cos(st) * erx, ey + Math.sin(st) * ery],
  ];
}

const BLUE = "#a5d8ff", GREEN = "#b2f2bb", YELLOW = "#ffec99", PINK = "#ffc9c9", STICKY = "#fff3bf";

export function Board({ L, id }: { L: BoardLayout; id: string }) {
  const r = rng(11);
  const ink = (d: string, k: string, ai = false) => <path className={s.ink} data-ai={ai || undefined} d={d} pathLength={1} data-k={k} />;
  const word = (x: number, y: number, t: string, k: string, size = L.font) => <text className={s.word} x={x} y={y} fontSize={size} textAnchor="middle" data-k={k}>{t}</text>;
  const [ax, ay, aw, ah] = L.a, [bx, by, bw, bh] = L.b, [cx, cy, chw, chh] = L.c, [dx, dy, dw, dh] = L.d, [ex, ey, erx, ery] = L.e;
  const mid = L.font * 0.36;
  const [sx, sy, sw, sh, sf, sl] = L.sticky;
  const boxA = box(r, ax, ay, aw, ah), ab = arrow(r, ...L.ab, L.head), boxB = box(r, bx, by, bw, bh), bc = arrow(r, ...L.bc, L.head);
  const dia = diamond(r, cx, cy, chw, chh), cd = arrow(r, ...L.cd, L.head), boxD = box(r, dx, dy, dw, dh), de = arrow(r, ...L.de, L.head), ell = ellipse(r, ex, ey, erx, ery);
  return (
    <svg className={`${s.board} ${hand.className}`} viewBox={`0 0 ${L.w} ${L.h}`} aria-hidden="true">
      <g data-k="bRest">
        <g className={s.flyT} data-k="bTitleFly">
          <text className={s.word} x={L.title[0]} y={L.title[1]} fontSize={L.title[2]} data-k="bTitleFade" data-a="bTitle">Training plan</text>
        </g>
        {ink(ab, "bs2")}
        {ink(bc, "bs4")}
        {ink(dia, "bs5")}{word(cx, cy + mid * 0.92, "Feel good?", "bf5", L.font * 0.9)}
        {ink(cd, "bs6")}{word(L.yes[0], L.yes[1], "yes", "bf6", L.font * 0.74)}
        <path className={s.fill} d={clean(dx, dy, dw, dh)} fill={GREEN} data-k="bf7" />
        {ink(boxD, "bs7")}{word(dx + dw / 2, dy + dh / 2 + mid, "Taper", "bf7")}
        <g data-k="bNotes">{L.notes.map(([x, y, t]) => <text key={t} className={s.note2} x={x} y={y} fontSize={L.font * 0.7} textAnchor="middle">{t}</text>)}</g>
        <g transform={`rotate(-2.5 ${sx + sw / 2} ${sy + sh / 2})`}>
          <path className={s.fill} d={clean(sx, sy, sw, sh, 6)} fill={STICKY} data-k="bf8" />
          {ink(box(r, sx, sy, sw, sh, 6), "bs8")}
          {sl.map((t, i) => <text key={t} className={s.word} x={sx + 22 * (sf / 30)} y={sy + sh / 2 + (i - (sl.length - 1) / 2) * sf * 1.25 + sf * 0.36} fontSize={sf} data-k="bf8">{t}</text>)}
        </g>
        {/* ChatGPT's part: the last arrow and race day. Its Undo hides this group. */}
        <g className={s.offable} data-off-id={`${id}race`}>
          {ink(de, "bs9", true)}
          <ellipse className={s.fill} cx={ex} cy={ey} rx={erx} ry={ery} fill={YELLOW} data-k="bf10" />
          {ink(ell, "bs10", true)}{word(ex, ey + mid, "Race day", "bf10")}
        </g>
      </g>
      <g className={s.morph} data-k="g1"><g data-k="g1f">
        <path className={s.fill} d={clean(ax, ay, aw, ah)} fill={BLUE} data-k="bf1" data-a="g1box" />
        {ink(boxA, "bs1")}{word(ax + aw / 2, ay + ah / 2 + mid, "Easy runs", "bf1")}
      </g></g>
      <g className={s.morph} data-k="g3"><g data-k="g3f">
        <path className={s.fill} d={clean(bx, by, bw, bh)} fill={BLUE} data-k="bf3" data-a="g3box" />
        {ink(boxB, "bs3")}{word(bx + bw / 2, by + bh / 2 + mid, "Long runs", "bf3")}
      </g></g>
    </svg>
  );
}

/** The close crop for the last act: "Feel good?", and ChatGPT's "no" branch to a rest week. */
export function BoardCrop({ id }: { id: string }) {
  const r = rng(29);
  const F = 23;
  const inkS = (d: string, k?: string, ai = false) => <path className={s.ink} data-ai={ai || undefined} d={d} pathLength={1} data-k={k} />;
  return (
    <svg className={`${s.crop} ${hand.className}`} viewBox="0 0 368 420" aria-hidden="true">
      <path className={s.fill} d={clean(54, 16, 160, 58)} fill={BLUE} />
      {inkS(box(r, 54, 16, 160, 58))}
      <text className={s.word} x={134} y={53} fontSize={F} textAnchor="middle">Long runs</text>
      {inkS(arrow(r, 134, 80, 134, 112, 11))}
      {inkS(diamond(r, 134, 178, 100, 62))}
      <text className={s.word} x={134} y={186} fontSize={F * 0.95} textAnchor="middle">Feel good?</text>
      {inkS(arrow(r, 236, 178, 270, 178, 10))}
      <text className={s.word} x={253} y={164} fontSize={17} textAnchor="middle">yes</text>
      <path className={s.fill} d={clean(276, 150, 80, 56, 12)} fill={GREEN} />
      {inkS(box(r, 276, 150, 80, 56, 12))}
      <text className={s.word} x={316} y={186} fontSize={21} textAnchor="middle">Taper</text>
      <g className={s.offable} data-off-id={`${id}rest`}>
        <rect x={130} y={240} width={8} height={8} fill="none" data-a="cStart" />
        {inkS(arrow(r, 134, 244, 134, 300, 11), "cs1", true)}
        <text className={s.word} x={154} y={280} fontSize={17} data-k="cf">no</text>
        <path className={s.fill} d={clean(44, 306, 180, 66)} fill={PINK} data-k="cf" data-a="cEnd" />
        {inkS(box(r, 44, 306, 180, 66), "cs2", true)}
        <text className={s.word} x={134} y={347} fontSize={F + 1} textAnchor="middle" data-k="cf">Rest week</text>
      </g>
    </svg>
  );
}
