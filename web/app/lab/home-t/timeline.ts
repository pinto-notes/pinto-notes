// The story's timeline. The whole sticky stage is one function of `u`, story time from 0 to 10,
// which scrolling drives (one unit is half a stage height). Every animated element has a data-k key
// and a track here: poses at story times, eased between them on minimum jerk. Only transform and
// opacity change, plus the whiteboard strokes' dash offset.

export type Pose = { x?: number; y?: number; s?: number; sx?: number; o?: number; d?: number };
export type Key = [number, Pose];
export type Tracks = Record<string, Key[]>;

export const END = 10;
/** Where Reduce Motion rests: each act's finished state. */
export const HOLDS: [number, number][] = [[0.9, 0], [3.4, 3.1], [6.1, 5.7], [7.5, 7.3], [Infinity, 9.9]];

type Box = { x: number; y: number };
export type Lay = {
  W: number; H: number;
  note: Box; board: Box; app: Box;
  mini: { x: number; y: number; s: number }[]; // note, board, app in the last act
  cursor: { start: [number, number]; mid: [number, number] }; // ChatGPT's cursor, offsets from where it ends
  lift: number; // how far the hero rises on its way out
  pen: [number, number][]; // your cursor on the whiteboard, at the end of each step
};

const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10); // minimum jerk (smootherstep)

export function sample(track: Key[], u: number): Required<Pose> {
  const base = { x: 0, y: 0, s: 1, sx: 1, o: 1, d: 1 };
  const at = (p: Pose) => ({ ...base, ...p });
  if (u <= track[0][0]) return at(track[0][1]);
  const last = track[track.length - 1];
  if (u >= last[0]) return at(last[1]);
  let i = 0;
  while (u > track[i + 1][0]) i++;
  const [u0, p0] = track[i], [u1, p1] = track[i + 1];
  const a = at(p0), b = at(p1), t = ease((u - u0) / (u1 - u0));
  const m = (k: keyof typeof base) => a[k] + (b[k] - a[k]) * t;
  return { x: m("x"), y: m("y"), s: m("s"), sx: m("sx"), o: m("o"), d: m("d") };
}

export function tracks(L: Lay): Tracks {
  const [mn, mb, ma] = L.mini;
  const toMini = (g: Box, m: { x: number; y: number; s: number }) => ({ x: m.x - g.x, y: m.y - g.y, s: m.s });
  const T: Tracks = {
    // 0. The headline, written in the note. It rises away as the note goes on.
    h1: [[0.35, {}], [1.25, { y: -L.lift, o: 0 }]],
    heroRest: [[0.25, {}], [0.95, { y: -L.lift * 0.6, o: 0 }]],
    date: [[3.2, {}], [3.5, { o: 0 }], [6.2, { o: 0 }], [6.5, {}], [7.3, {}], [7.6, { o: 0 }]],

    // 1. Write notes: the note grows a checklist and ticks it.
    capW: [[1.15, { y: 56, o: 0 }], [1.65, {}], [3.15, {}], [3.6, { y: -40, o: 0 }]],
    note: [[1.1, { y: 70, o: 0 }], [1.75, {}], [3.15, {}], [3.7, { y: -36, o: 0, s: 0.97 }],
      [7.75, { ...toMini(L.note, mn), o: 0 }], [8.25, { ...toMini(L.note, mn) }]],
    t0: [[2.05, { o: 0, s: 0.5 }], [2.35, {}]],
    t1: [[2.35, { o: 0, s: 0.5 }], [2.65, {}]],

    // 2. Draw on whiteboards: the paper turns into a whiteboard and the plan draws itself.
    grid: [[3.2, { o: 0, s: 0.3 }], [4.0, {}], [5.95, {}], [6.4, { o: 0 }]],
    tools: [[3.45, { y: -16, o: 0 }], [3.9, {}], [5.95, {}], [6.35, { y: -16, o: 0 }]],
    capD: [[3.5, { y: 56, o: 0 }], [4.1, {}], [5.95, {}], [6.4, { y: -40, o: 0 }]],
    board: [[5.95, {}], [6.45, { y: -30, o: 0, s: 0.98 }], [7.8, { ...toMini(L.board, mb), o: 0 }], [8.3, { ...toMini(L.board, mb) }]],
    bx0: [[3.6, { o: 0, y: 10 }], [3.9, {}]],

    // 3. Build apps: a habit tracker, in the same note. You can tick it.
    capB: [[6.2, { y: 56, o: 0 }], [6.8, {}], [7.3, {}], [7.65, { y: -40, o: 0 }]],
    try: [[6.95, { x: -14, o: 0 }], [7.2, {}], [7.3, {}], [7.5, { o: 0 }]],
    app: [[6.15, { y: 80, o: 0, s: 0.98 }], [6.9, {}], [7.4, {}], [8.1, toMini(L.app, ma)]],

    // 4. Your AI, in all three: one line to ChatGPT, and its marks in the note, the whiteboard and the app.
    capA: [[7.5, { y: 40, o: 0 }], [8.0, {}]],
    said: [[7.75, { y: 24, o: 0 }], [8.25, {}]],
    tint3: [[8.75, { sx: 0 }], [9.0, {}]],
    t3ai: [[8.8, { o: 0, s: 0.5 }], [9.05, {}]],
    bcur: [[8.85, { x: L.cursor.start[0] + 90, y: L.cursor.start[1] - 70, o: 0 }], [9.05, { x: L.cursor.start[0], y: L.cursor.start[1] }],
      [9.3, { x: L.cursor.mid[0], y: L.cursor.mid[1] }], [9.55, {}]],
    atint: [[8.45, { sx: 0 }], [8.7, {}]],
    aiRunOld: [[8.5, {}], [8.6, { o: 0 }]],
    aiRunSub: [[8.55, { o: 0, y: 6 }], [8.75, {}]],
    aiRun: [[8.5, { o: 0, s: 0.5 }], [8.7, {}]],
  };
  for (let i = 0; i < 5; i++) T[`r${i}`] = [[1.25 + i * 0.13, { y: 22, o: 0 }], [1.65 + i * 0.13, {}]];
  for (let i = 0; i < 4; i++) T[`a${i}`] = [[6.45 + i * 0.12, { y: 22, o: 0 }], [6.85 + i * 0.12, {}]];
  for (let i = 1; i <= 9; i++) {
    const a = 3.75 + (i - 1) * 0.2, b = a + 0.3;
    T[`bs${i}`] = [[a, { d: 0 }], [b, { d: 1 }]];
    T[`bx${i}`] = [[b - 0.1, { o: 0 }], [b + 0.08, {}]];
  }
  const pen = L.pen;
  T.ucur = [[3.55, { x: pen[0][0] + 40, y: pen[0][1] + 30, o: 0 }], [3.75, { x: pen[0][0], y: pen[0][1] }]];
  for (let i = 1; i <= 9; i++) T.ucur.push([3.75 + (i - 1) * 0.2 + 0.3, { x: pen[i][0], y: pen[i][1] }]);
  T.ucur.push([5.75, { x: pen[9][0], y: pen[9][1] }], [6.0, { x: pen[9][0] + 30, y: pen[9][1] + 20, o: 0 }]);
  T.bs10 = [[9.05, { d: 0 }], [9.3, { d: 1 }]];
  T.bx10 = [[9.25, { o: 0 }], [9.35, {}]];
  T.bs11 = [[9.3, { d: 0 }], [9.55, { d: 1 }]];
  T.bx11 = [[9.5, { o: 0 }], [9.62, {}]];
  for (let i = 0; i < 3; i++) {
    T[`tile${i}`] = [[7.55 + i * 0.06, { o: 0, s: 0.96 }], [8.05 + i * 0.06, {}]];
    T[`lab${i}`] = [[[8.6, 8.95, 9.5][i], { o: 0, y: 8 }], [[8.85, 9.2, 9.72][i], {}]];
  }
  return T;
}
