// The story's timeline (study T, round 6). The sticky stage has eight beats, and each scroll stop
// is one beat: 0 the hero, 1 the note, 2 the whiteboard, 3 the app, 4 to 6 one request changing all
// three in turn, 7 Undo. Story time τ rests on whole numbers; between them, the beat plays in real
// time (Story.tsx moves τ at each segment's speed), so every still is a finished picture.
// Every animated element has a data-k key and a track: poses at story times, eased between them on
// minimum jerk. Only transform and opacity change, plus the whiteboard strokes' dash offset.

import { type BoardLayout, penPoints } from "./Board";

export type Pose = { x?: number; y?: number; s?: number; sx?: number; o?: number; d?: number; r?: number };
export type Key = [number, Pose];
export type Tracks = Record<string, Key[]>;
type Full = Required<Pose>;

export const LAST = 7;
/** Seconds per unit of τ in each segment: [intro, 0→1, 1→2, ...]. */
export const DUR = [1.7, 2.1, 3.1, 2.4, 2.4, 1.5, 1.7, 1.7];

const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10); // minimum jerk (smootherstep)
const BASE: Full = { x: 0, y: 0, s: 1, sx: 1, o: 1, d: 1, r: 0 };

export function sample(track: Key[], u: number): Full {
  const at = (p: Pose): Full => ({ ...BASE, ...p });
  if (u <= track[0][0]) return at(track[0][1]);
  const last = track[track.length - 1];
  if (u >= last[0]) return at(last[1]);
  let i = 0;
  while (u > track[i + 1][0]) i++;
  const [u0, p0] = track[i], [u1, p1] = track[i + 1];
  const a = at(p0), b = at(p1), t = ease((u - u0) / (u1 - u0));
  const m = (k: keyof Full) => a[k] + (b[k] - a[k]) * t;
  return { x: m("x"), y: m("y"), s: m("s"), sx: m("sx"), o: m("o"), d: m("d"), r: m("r") };
}

type XY = [number, number];
type Box = [number, number, number, number];
/** Layout numbers per canvas, in canvas units. */
export type Lay = {
  W: number; H: number; phone: boolean;
  note: XY; heroNote: XY; app: Box; panels: XY[]; pw: number; ph: number;
  board: BoardLayout;
};
/** Anchors measured from the page at rest (canvas units). */
export type Anchors = (name: string) => { x: number; y: number; w: number; h: number };

export function tracks(L: Lay, A: Anchors): Tracks {
  const T: Tracks = {};
  const add = (k: string, ...keys: Key[]) => { (T[k] ??= []).push(...keys); };
  const mid = (n: string): XY => { const a = A(n); return [a.x + a.w / 2, a.y + a.h / 2]; };
  const end = (n: string, dx = 0, dy = 0): XY => { const a = A(n); return [a.x + a.w + dx, a.y + a.h * 0.62 + dy]; };
  const at = ([x, y]: XY, p: Pose = {}): Pose => ({ x, y, ...p });
  const [hx, hy] = [L.heroNote[0] - L.note[0], L.heroNote[1] - L.note[1]];
  const ph = L.phone;

  // ── Backgrounds: cream (the page) → paper → dot grid → the app's field → cream.
  add("bgPaper", [0.05, { o: 0 }], [0.4, {}], [1.15, {}], [1.42, { o: 0 }]);
  add("bgGrid", [1.15, { o: 0, s: 1.05 }], [1.48, {}], [2.08, {}], [2.36, { o: 0 }]);
  add("bgField", [2.08, { o: 0 }], [2.4, {}], [3.0, {}], [3.3, { o: 0 }]);

  // ── 0. The hero. ChatGPT's cursor comes in and its line lands, marked, with Undo.
  // On a phone the line wraps: ChatGPT rests on its first line, so its flag sits in the tint, clear of the receipt.
  const gb0 = A("gptBox");
  const gpt0: XY = ph ? [gb0.x + gb0.w - 112, gb0.y + 6] : end("gptLine", 4, -2);
  const gHero: XY = [gpt0[0] + hx, gpt0[1] + hy];
  add("cGPT", [-0.78, at([gHero[0] + 220, gHero[1] + 150], { o: 0 })], [-0.62, at([gHero[0] + 90, gHero[1] + 60])], [-0.34, at(gHero)],
    [-0.31, at(gHero, { s: 0.86 })], [-0.27, at(gHero)], [0, at(gHero)], [0.28, at(gpt0, { o: 0 })]);
  add("gptLine", [-0.31, { o: 0 }], [-0.29, {}]);
  add("gptTint", [-0.31, { sx: 0 }], [-0.16, {}], [0.3, {}], [0.62, { o: 0 }]);
  add("pill0", [-0.22, { o: 0, y: 10, s: 0.92 }], [-0.04, {}], [0.08, {}], [0.26, { o: 0, y: -6 }]);
  add("h1", [0, {}], [0.3, { y: -90, o: 0 }]);
  add("side", [0, {}], [0.24, { y: -60, o: 0 }]);
  add("card", [0.04, {}], [0.4, { o: 0 }]);
  add("note", [0.04, { x: hx, y: hy }], [0.46, {}], [1.1, {}], [1.3, { y: -26, o: 0 }]);

  // ── 1. Write notes. The note fills the screen; you tick two, Claude adds an item.
  add("capW", [0.24, { y: 40, o: 0 }], [0.52, {}], [1.04, {}], [1.24, { y: -34, o: 0 }]);
  add("r0", [0.04, { x: hx, y: hy }], [0.46, {}], [1.12, {}], [1.3, { y: 24, o: 0 }]);
  add("r1", [0.04, { x: hx, y: hy }], [0.46, {}], [1.12, {}], [1.3, { y: 24, o: 0 }]);
  add("r2", [0.4, { y: 18, o: 0 }], [0.54, {}]);
  add("r3", [0.45, { y: 18, o: 0 }], [0.59, {}], [1.12, {}], [1.3, { y: 24, o: 0 }]);
  add("r4", [0.86, { o: 0 }], [0.88, {}], [1.12, {}], [1.3, { y: 24, o: 0 }]);
  add("r4tint", [0.86, { sx: 0 }], [0.97, {}]);
  add("pill1", [0.9, { o: 0, y: 10, s: 0.92 }], [1.0, {}], [1.04, {}], [1.16, { o: 0 }]);
  const b0 = mid("box0"), b1 = mid("box1"), b2 = mid("box2");
  const yR1: XY = ph ? [b1[0] + 215, b1[1] - 6] : [b1[0] - 92, b1[1] + 12];
  add("cYou", [0.5, at([b0[0] + 70, b0[1] + 50], { o: 0 })], [0.6, at(b0)], [0.62, at(b0, { s: 0.84 })], [0.65, at(b0)],
    [0.74, at(b1)], [0.76, at(b1, { s: 0.84 })], [0.79, at(b1)], [0.88, at(yR1)], [1.0, at(yR1)], [1.08, at(b2)], [1.1, at(b2, { s: 0.84 })], [1.13, at(b2)]);
  add("t0", [0.62, { o: 0, s: 0.4 }], [0.68, {}]);
  add("t1", [0.76, { o: 0, s: 0.4 }], [0.82, {}]);
  add("t2", [1.1, { o: 0, s: 0.4 }], [1.15, {}]);
  const c4 = end("r4text", 6, -4);
  const cR: XY = ph ? [c4[0] - 50, c4[1] + 8] : c4;
  add("cClaude", [0.68, at([c4[0] + 240, c4[1] + 120], { o: 0 })], [0.76, at([c4[0] + 100, c4[1] + 50])], [0.88, at(c4)],
    [0.9, at(c4, { s: 0.86 })], [0.93, at(c4)], [0.98, at(cR)], [1.04, at(cR)], [1.18, at(cR, { o: 0 })]);

  // ── 2. Draw on whiteboards. "Make a training plan" becomes the board's title; you draw the plan,
  //    ChatGPT draws race day.
  const B = L.board;
  // "Make a" drops away; "training plan" flies onto the board and lands exactly on its hand-written title.
  // The item scales from its bottom-left corner, so the words' own corner is carried onto the title's.
  const r2 = A("r2text"), tp = A("r2tp"), tt = A("bTitle");
  const k = tt.h / tp.h;
  const fly: XY = [tt.x - r2.x - k * (tp.x - r2.x), tt.y + tt.h - (r2.y + r2.h)];
  const back: XY = [tp.x - tt.x, tp.y + tp.h - (tt.y + tt.h)];
  add("r2pre", [1.13, {}], [1.22, { o: 0 }]);
  add("r2fly", [1.15, {}], [1.46, at(fly, { s: k })]);
  add("r2fade", [1.27, {}], [1.39, { o: 0 }]);
  add("r2rest", [1.12, {}], [1.28, { o: 0 }]);
  add("bTitleFly", [1.15, at(back, { s: 1 / k })], [1.46, {}]);
  add("bTitleFade", [1.27, { o: 0 }], [1.39, {}]);
  add("capD", [1.3, { y: 34, o: 0 }], [1.56, {}], [2.04, {}], [2.22, { y: -34, o: 0 }]);
  const pen = penPoints(B);
  const s0 = 1.47, step = 0.042;
  add("cYou", [1.28, at(b2, { o: 0 })], [1.4, at(pen[0], { o: 0 })], [s0, at(pen[0])]);
  for (let i = 1; i <= 8; i++) {
    const a = s0 + (i - 1) * step + (i === 8 ? 0.02 : 0);
    add(`bs${i}`, [a, { d: 0 }], [a + step, { d: 1 }]);
    add("cYou", [a + step, at(pen[i])]);
  }
  for (const i of [1, 3, 5, 6, 7, 8]) add(`bf${i}`, [s0 + i * step - 0.02 + (i === 8 ? 0.02 : 0), { o: 0 }], [s0 + i * step + 0.02 + (i === 8 ? 0.02 : 0), {}]);
  add("bNotes", [s0 + 3 * step, { o: 0 }], [s0 + 4 * step, {}]);
  const ye = s0 + 8 * step + 0.02;
  // You rest just below your sticky note; ChatGPT rests under race day, clear of its words.
  const yRest: XY = ph ? [pen[8][0] + 6, pen[8][1] - 40] : [pen[8][0] - 70, pen[8][1] + 14];
  add("cYou", [ye + 0.06, at(yRest)], [2.02, at(yRest)], [2.14, at(yRest, { o: 0 })]);
  const g0 = pen[9], g1 = pen[10];
  const [ex, ey, erx, ery] = B.e;
  const gRest: XY = ph ? [ex - 20, ey + ery + 4] : [ex - erx * 0.2, ey + ery + 6];
  add("cGPT", [1.72, at([g0[0] + 160, g0[1] + 110], { o: 0 })], [1.8, at([g0[0] + 40, g0[1] + 30])], [1.85, at(g0)],
    [1.88, at(g0)], [1.94, at(g1)], [1.99, at(gRest)], [2.02, at(gRest)], [2.14, at(gRest, { o: 0 })]);
  add("bs9", [1.85, { d: 0 }], [1.88, { d: 1 }]);
  add("bs10", [1.88, { d: 0 }], [1.94, { d: 1 }]);
  add("bf10", [1.92, { o: 0 }], [1.95, {}]);
  add("pill2", [1.93, { o: 0, y: 10, s: 0.92 }], [2.0, {}], [2.04, {}], [2.16, { o: 0 }]);

  // ── 3. Build apps. The plan's run boxes fly into the tracker's rows; Claude ticks Stretch.
  const app = L.app;
  const rowE = mid("rowEasy"), rowL = mid("rowLong");
  const ga = mid("g1box"), gb = mid("g3box");
  add("g1", [2.04, {}], [2.46, { x: rowE[0] - ga[0], y: rowE[1] - ga[1], s: 0.42 }]);
  add("g3", [2.06, {}], [2.48, { x: rowL[0] - gb[0], y: rowL[1] - gb[1], s: 0.42 }]);
  add("g1f", [2.3, {}], [2.44, { o: 0 }]);
  add("g3f", [2.32, {}], [2.46, { o: 0 }]);
  add("bRest", [2.04, {}], [2.24, { o: 0 }]);
  const cx = (app[2] * 0.07) / 2, cy = (app[3] * 0.07) / 2, ox = (app[2] * 0.012) / 2, oy = (app[3] * 0.012) / 2;
  add("app", [2.14, { x: cx, y: 70 + cy, s: 0.93, o: 0 }], [2.42, { x: -ox, y: -8 - oy, s: 1.012 }], [2.54, {}], [3.02, {}],
    [3.36, { x: L.panels[0][0] - app[0], y: L.panels[0][1] - app[1], s: L.pw / app[2], o: 0 }]);
  for (let i = 0; i < 3; i++) add(`ar${i}`, [2.36 + i * 0.05, { o: 0, y: 10 }], [2.48 + i * 0.05, {}]);
  add("capB", [2.36, { y: 34, o: 0 }], [2.6, {}], [3.0, {}], [3.16, { y: -34, o: 0 }]);
  add("handNote", [2.9, { o: 0 }], [2.97, {}], [3.0, {}], [3.12, { o: 0 }]);
  const st = mid("sTickA");
  const sRest: XY = [st[0] + (ph ? 150 : 330), st[1] - (ph ? 16 : 14)];
  add("cClaude", [2.5, at([st[0] + 220, st[1] + 140], { o: 0 })], [2.6, at([st[0] + 80, st[1] + 50])], [2.7, at(st)],
    [2.72, at(st, { s: 0.84 })], [2.75, at(st)], [2.84, at(sRest)], [3.0, at(sRest)], [3.12, at(sRest, { o: 0 })]);
  add("sTick", [2.72, { o: 0, s: 0.4 }], [2.78, {}]);
  add("st0", [2.73, {}], [2.76, { o: 0, y: -6 }]);
  add("st1", [2.73, { o: 0, y: 6 }], [2.78, {}]);
  add("sTint", [2.72, { sx: 0 }], [2.84, {}]);
  add("pill3", [2.8, { o: 0, y: 10, s: 0.92 }], [2.9, {}], [3.0, {}], [3.12, { o: 0 }]);

  // ── 4 to 6. One request, three changes in turn: the app, the note, the whiteboard. 7: Undo.
  add("capA", [3.12, { y: 34, o: 0 }], [3.36, {}]);
  add("said", [3.2, { y: 18, o: 0 }], [3.42, {}]);
  const P = L.panels;
  if (ph) {
    add("pA", [3.16, { o: 0, s: 0.96 }], [3.4, {}], [4.0, {}], [4.26, { x: -L.W, o: 0 }]);
    add("pB", [4.0, { x: L.W, o: 0 }], [4.26, {}], [5.0, {}], [5.26, { x: -L.W, o: 0 }]);
    add("pC", [5.0, { x: L.W, o: 0 }], [5.26, {}]);
    add("marks", [3.24, { o: 0 }], [3.42, {}]);
    const m = [A("mk0"), A("mk1"), A("mk2")];
    add("mkOn", [3.24, { o: 0, x: m[0].x, sx: m[0].w / 100 }], [3.42, { x: m[0].x, sx: m[0].w / 100 }], [4.0, { x: m[0].x, sx: m[0].w / 100 }],
      [4.26, { x: m[1].x, sx: m[1].w / 100 }], [5.0, { x: m[1].x, sx: m[1].w / 100 }], [5.26, { x: m[2].x, sx: m[2].w / 100 }]);
  } else {
    add("pA", [3.14, { o: 0, s: 0.96 }], [3.4, {}]);
    add("pB", [3.2, { y: 40, o: 0 }], [3.44, {}]);
    add("pC", [3.26, { y: 40, o: 0 }], [3.5, {}]);
  }
  const sd = end("saidText", 2, -6), ta = mid("aTickA"), tb = mid("bBoxA");
  const cs = A("cStart"), ce = A("cEnd");
  const rest = (i: number): XY => [P[i][0] + L.pw - 118, P[i][1] + L.ph - (ph ? 100 : 112)];
  add("cGPT", [3.4, at([sd[0] - 30, sd[1] + 20], { o: 0 })], [3.46, at(sd)], [3.66, at(ta)], [3.68, at(ta, { s: 0.84 })], [3.71, at(ta)],
    [3.84, at(rest(0))], [4.02, at(rest(0))], [4.4, at(tb)], [4.42, at(tb, { s: 0.84 })], [4.45, at(tb)],
    [4.58, at(rest(1))], [5.02, at(rest(1))], [5.3, at([cs.x, cs.y])], [5.42, at([ce.x + ce.w * 0.3, ce.y])],
    [5.6, at([ce.x + ce.w, ce.y + ce.h])], [5.74, at(rest(2))]);
  if (!ph) {
    const lift = (k: string, a: number, b: number) => add(k, [a, {}], [a + 0.12, { y: -10, s: 1.025 }], [b, { y: -10, s: 1.025 }], [b + 0.14, {}]);
    lift("pA", 3.5, 4.02); lift("pB", 4.08, 5.02); lift("pC", 5.08, 6.0);
  }
  add("aTint", [3.68, { sx: 0 }], [3.8, {}]);
  add("aTick", [3.68, { o: 0, s: 0.4 }], [3.74, {}]);
  add("ac0", [3.69, {}], [3.72, { o: 0, y: -6 }]);
  add("ac1", [3.69, { o: 0, y: 6 }], [3.74, {}]);
  add("aChip", [3.7, { o: 0, y: 6 }], [3.78, {}]);
  add("pillA", [3.76, { o: 0, y: 10, s: 0.92 }], [3.88, {}]);
  add("bTint", [4.42, { sx: 0 }], [4.55, {}]);
  add("bTick", [4.42, { o: 0, s: 0.4 }], [4.48, {}]);
  add("pillB", [4.5, { o: 0, y: 10, s: 0.92 }], [4.62, {}]);
  add("cs1", [5.3, { d: 0 }], [5.42, { d: 1 }], [6.42, {}], [6.56, { d: 0 }]);
  add("cs2", [5.42, { d: 0 }], [5.6, { d: 1 }], [6.42, {}], [6.6, { d: 0 }]);
  add("cf", [5.56, { o: 0 }], [5.64, {}], [6.42, {}], [6.5, { o: 0 }]);
  add("pillC", [5.62, { o: 0, y: 10, s: 0.92 }], [5.74, {}], [6.42, {}], [6.48, { o: 0 }]);
  add("pillCx", [6.44, { o: 0, y: 10, s: 0.92 }], [6.56, {}]);
  const un = mid("undoC");
  add("cYou", [6.0, at([un[0] + 150, un[1] - 40], { o: 0 })], [6.12, at([un[0] + 60, un[1] - 20])], [6.34, at(un)],
    [6.37, at(un, { s: 0.84 })], [6.41, at(un)], [6.62, at([ce.x + ce.w * 0.32, ce.y + ce.h * 0.3])]);
  return T;
}
