// Excalidraw's hand-drawn look, as SVG paths: every stroke drawn twice with a little wobble, the way
// Excalidraw draws at its default roughness. Seeded, so the server and the browser draw the same lines.
// The helpers are study Q's (lab/home-q/Board.tsx), first from study J, plus a curved stroke.

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const f = (n: number) => n.toFixed(1);
type P = [number, number];

/** A cubic curve from a to b through two control points, with a little hand wobble. */
export function curve(r: () => number, a: P, c1: P, c2: P, b: P, wob = 4) {
  const j = () => (r() - 0.5) * wob;
  return `M${f(a[0] + j())} ${f(a[1] + j())} C${f(c1[0] + j() * 3)} ${f(c1[1] + j() * 3)} ${f(c2[0] + j() * 3)} ${f(c2[1] + j() * 3)} ${f(b[0] + j() * 0.4)} ${f(b[1] + j() * 0.4)}`;
}

/** A straight hand line, slightly bowed and overshooting its ends. */
export function line(r: () => number, x1: number, y1: number, x2: number, y2: number, over = 2) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const j = () => (r() - 0.5) * 2;
  const ax = x1 - ux * over + j(), ay = y1 - uy * over + j(), bx = x2 + ux * over + j(), by = y2 + uy * over + j();
  const bow = (r() - 0.5) * Math.min(6, len * 0.03);
  return `M${f(ax)} ${f(ay)} C${f(ax + dx / 3 - uy * bow)} ${f(ay + dy / 3 + ux * bow)} ${f(ax + (dx * 2) / 3 - uy * bow)} ${f(ay + (dy * 2) / 3 + ux * bow)} ${f(bx)} ${f(by)}`;
}

/** A rounded box, drawn by hand. */
export function box(r: () => number, x: number, y: number, w: number, h: number, rad = 22) {
  const j = () => (r() - 0.5) * 3;
  const p = [
    [x + rad, y + j()], [x + w - rad, y + j()], [x + w + j(), y + rad], [x + w + j(), y + h - rad],
    [x + w - rad, y + h + j()], [x + rad, y + h + j()], [x + j(), y + h - rad], [x + j(), y + rad],
  ];
  const q = (cx: number, cy: number, ex: number, ey: number) => `Q${f(cx + j())} ${f(cy + j())} ${f(ex)} ${f(ey)}`;
  return `M${f(p[0][0])} ${f(p[0][1])} L${f(p[1][0])} ${f(p[1][1])} ${q(x + w, y, p[2][0], p[2][1])} L${f(p[3][0])} ${f(p[3][1])} ${q(x + w, y + h, p[4][0], p[4][1])} L${f(p[5][0])} ${f(p[5][1])} ${q(x, y + h, p[6][0], p[6][1])} L${f(p[7][0])} ${f(p[7][1])} ${q(x, y, p[0][0] + 10, p[0][1] + j())}`;
}

/** An ellipse, drawn by hand: one loop that overshoots where it started. */
export function ellipse(r: () => number, cx: number, cy: number, rx: number, ry: number) {
  const n = 36, start = -Math.PI * 0.6, pts: string[] = [];
  for (let i = 0; i <= n + 4; i++) {
    const a = start + (i / n) * Math.PI * 2, k = 1 + (r() - 0.5) * 0.02 + (i > n ? 0.035 : 0);
    pts.push(`${f(cx + Math.cos(a) * rx * k)} ${f(cy + Math.sin(a) * ry * k)}`);
  }
  return `M${pts[0]} L${pts.slice(1).join(" L")}`;
}

/** The two strokes of an arrowhead at b, pointing along the direction from c to b. */
export function head(r: () => number, c: P, b: P, size = 30) {
  const a = Math.atan2(b[1] - c[1], b[0] - c[0]), s1 = a + Math.PI * 0.82, s2 = a - Math.PI * 0.82;
  return `${line(r, b[0], b[1], b[0] + Math.cos(s1) * size, b[1] + Math.sin(s1) * size, 0)} ${line(r, b[0], b[1], b[0] + Math.cos(s2) * size, b[1] + Math.sin(s2) * size, 0)}`;
}
