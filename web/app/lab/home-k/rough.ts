// Hand-drawn strokes in the look of the app's whiteboards (Excalidraw, "artist" sloppiness): every
// shape is drawn twice, each pass a little off, from a seeded random so server and browser agree.

type P = [number, number];

function rng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

/// A smooth path through the points (Catmull-Rom as cubic Béziers).
function smooth(pts: P[]): string {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

const jitter = (pts: P[], seed: number, amp: number): P[] => {
  const r = rng(seed);
  return pts.map(([x, y]) => [x + (r() - 0.5) * 2 * amp, y + (r() - 0.5) * 2 * amp]);
};

/// Two passes over the same outline, as the app draws it.
const twice = (pts: P[], seed: number, amp = 1.3) => [smooth(jitter(pts, seed, amp)), smooth(jitter(pts, seed + 99, amp))];

function ellipsePts(cx: number, cy: number, rx: number, ry: number, turn = 1.06): P[] {
  const n = 28, a0 = -2.3, pts: P[] = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI * 2 * turn; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return pts;
}

function roundRectPts(x: number, y: number, w: number, h: number, r: number): P[] {
  const pts: P[] = [];
  const corner = (cx: number, cy: number, a: number) => { for (let i = 0; i <= 3; i++) { const t = a + (i / 3) * (Math.PI / 2); pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]); } };
  const side = (x1: number, y1: number, x2: number, y2: number) => { for (let i = 1; i < 4; i++) pts.push([x1 + ((x2 - x1) * i) / 4, y1 + ((y2 - y1) * i) / 4]); };
  corner(x + r, y + r, Math.PI); side(x + r, y, x + w - r, y);
  corner(x + w - r, y + r, -Math.PI / 2); side(x + w, y + r, x + w, y + h - r);
  corner(x + w - r, y + h - r, 0); side(x + w - r, y + h, x + r, y + h);
  corner(x + r, y + h - r, Math.PI / 2); side(x, y + h - r, x, y + r);
  pts.push([x + r + 3, y - 0.5]);
  return pts;
}

function diamondPts(cx: number, cy: number, hw: number, hh: number): P[] {
  const c: P[] = [[cx, cy - hh], [cx + hw, cy], [cx, cy + hh], [cx - hw, cy], [cx + 3, cy - hh + 1]];
  const pts: P[] = [];
  for (let i = 0; i < c.length - 1; i++) {
    const [a, b] = [c[i], c[i + 1]];
    for (let k = 0; k < 4; k++) { const t = [0.04, 0.35, 0.65, 0.96][k]; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return pts;
}

const linePts = (x1: number, y1: number, x2: number, y2: number): P[] => [0, 0.33, 0.66, 1].map((t) => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);

/// An arrow: its shaft, then its head, each as one stroke.
function arrow(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const a = Math.atan2(y2 - y1, x2 - x1), l = 13, s = 0.5;
  const head: P[] = [[x2 - l * Math.cos(a - s), y2 - l * Math.sin(a - s)], [x2, y2], [x2 - l * Math.cos(a + s), y2 - l * Math.sin(a + s)]];
  return [smooth(jitter(linePts(x1, y1, x2, y2), seed, 0.9)), `M${head.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L")}`];
}

export type Shape = { strokes: string[]; fill?: { d: string; color: string }; label?: { x: number; y: number; text: string } };

/// "Publishing flow", the whiteboard in the app's captures: Idea → Draft → Ready? → yes → Publish,
/// and no → Fix it. Same words, same colours.
export function publishingFlow(): Shape[] {
  return [
    { strokes: twice(ellipsePts(64, 100, 52, 29), 3), fill: { d: smooth(ellipsePts(64, 100, 52, 29, 1)), color: "#ffec99" }, label: { x: 64, y: 100, text: "Idea" } },
    { strokes: arrow(118, 100, 162, 100, 11) },
    { strokes: twice(roundRectPts(166, 74, 104, 52, 11), 5), label: { x: 218, y: 100, text: "Draft" } },
    { strokes: arrow(272, 100, 302, 100, 13) },
    { strokes: twice(diamondPts(368, 100, 64, 42), 7), label: { x: 368, y: 100, text: "Ready?" } },
    { strokes: arrow(434, 100, 474, 100, 17), label: { x: 452, y: 86, text: "yes" } },
    { strokes: twice(roundRectPts(478, 74, 82, 52, 11), 9), fill: { d: smooth(roundRectPts(478, 74, 82, 52, 11)), color: "#b2f2bb" }, label: { x: 519, y: 100, text: "Publish" } },
    { strokes: arrow(370, 144, 396, 198, 19), label: { x: 400, y: 166, text: "no" } },
    { strokes: twice(roundRectPts(330, 204, 104, 48, 10), 21), fill: { d: smooth(roundRectPts(330, 204, 104, 48, 10)), color: "#ffc9c9" }, label: { x: 382, y: 228, text: "Fix it" } },
  ];
}
