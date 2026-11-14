// Hand-drawn strokes, Excalidraw style: slightly bowed lines that overshoot their ends, and boxes
// whose corners never quite meet. Seeded, so the server and the browser draw the same paths.
// (The helpers come from study O, first from study J.)

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f = (n: number) => n.toFixed(1);

export function line(r: () => number, x1: number, y1: number, x2: number, y2: number, over = 2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const j = () => (r() - 0.5) * 1.6;
  const ax = x1 - ux * over + j(), ay = y1 - uy * over + j(), bx = x2 + ux * over + j(), by = y2 + uy * over + j();
  const bow = (r() - 0.5) * Math.min(6, len * 0.03);
  const c1x = ax + dx / 3 - uy * bow, c1y = ay + dy / 3 + ux * bow, c2x = ax + (dx * 2) / 3 - uy * bow, c2y = ay + (dy * 2) / 3 + ux * bow;
  return `M${f(ax)} ${f(ay)} C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(bx)} ${f(by)}`;
}

export function box(r: () => number, x: number, y: number, w: number, h: number, rad = 12) {
  const j = () => (r() - 0.5) * 1.6;
  const p = [
    [x + rad, y + j()], [x + w - rad, y + j()], [x + w + j(), y + rad], [x + w + j(), y + h - rad],
    [x + w - rad, y + h + j()], [x + rad, y + h + j()], [x + j(), y + h - rad], [x + j(), y + rad],
  ];
  const q = (cx: number, cy: number, ex: number, ey: number) => `Q${f(cx + j())} ${f(cy + j())} ${f(ex)} ${f(ey)}`;
  return `M${f(p[0][0])} ${f(p[0][1])} L${f(p[1][0])} ${f(p[1][1])} ${q(x + w, y, p[2][0], p[2][1])} L${f(p[3][0])} ${f(p[3][1])} ${q(x + w, y + h, p[4][0], p[4][1])} L${f(p[5][0])} ${f(p[5][1])} ${q(x, y + h, p[6][0], p[6][1])} L${f(p[7][0])} ${f(p[7][1])} ${q(x, y, p[0][0] + 7, p[0][1] + j())}`;
}

/** A clean rounded rectangle, for the fill under a hand-drawn box. */
export const clean = (x: number, y: number, w: number, h: number, rad = 12) =>
  `M${x + rad} ${y} h${w - 2 * rad} q${rad} 0 ${rad} ${rad} v${h - 2 * rad} q0 ${rad} ${-rad} ${rad} h${-(w - 2 * rad)} q${-rad} 0 ${-rad} ${-rad} v${-(h - 2 * rad)} q0 ${-rad} ${rad} ${-rad}z`;

export function ellipse(r: () => number, cx: number, cy: number, rx: number, ry: number) {
  const n = 30, start = -Math.PI * 0.6, pts: string[] = [];
  for (let i = 0; i <= n + 3; i++) {
    const a = start + (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.025 + (i > n ? 0.035 : 0);
    pts.push(`${f(cx + Math.cos(a) * rx * k)} ${f(cy + Math.sin(a) * ry * k)}`);
  }
  return `M${pts[0]} L${pts.slice(1).join(" L")}`;
}

export function diamond(r: () => number, cx: number, cy: number, hw: number, hh: number) {
  const t: [number, number] = [cx, cy - hh], ri: [number, number] = [cx + hw, cy], b: [number, number] = [cx, cy + hh], l: [number, number] = [cx - hw, cy];
  return [line(r, ...t, ...ri, 1), line(r, ...ri, ...b, 1), line(r, ...b, ...l, 1), line(r, ...l, ...t, 1)].join(" ");
}

function head(r: () => number, x: number, y: number, a: number, size: number) {
  const s1 = a + Math.PI * 0.82, s2 = a - Math.PI * 0.82;
  return `${line(r, x, y, x + Math.cos(s1) * size, y + Math.sin(s1) * size, 0)} ${line(r, x, y, x + Math.cos(s2) * size, y + Math.sin(s2) * size, 0)}`;
}

/** A straight arrow: the shaft, and the head as its own path (drawn after the shaft). */
export function arrow(r: () => number, x1: number, y1: number, x2: number, y2: number, size = 13): [string, string] {
  return [line(r, x1, y1, x2, y2, 0), head(r, x2, y2, Math.atan2(y2 - y1, x2 - x1), size)];
}

/** A bent arrow, a quadratic curve through the control point (cx, cy). */
export function curve(r: () => number, x1: number, y1: number, cx: number, cy: number, x2: number, y2: number, size = 13): [string, string] {
  return [`M${f(x1)} ${f(y1)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}`, head(r, x2, y2, Math.atan2(y2 - cy, x2 - cx), size)];
}
