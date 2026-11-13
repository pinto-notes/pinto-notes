// A small hand-drawn path maker in the spirit of rough.js (which Excalidraw draws with): every shape
// is two slightly different strokes, so the edges look drawn by hand. Seeded, so the drawing is the
// same on every load and on the server.

export type Pt = [number, number];

/** A seeded random source (mulberry32). */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number) => n.toFixed(1);

/** One wobbly line from a to b, as a cubic, the way rough.js bows a straight line. */
function bow(a: Pt, b: Pt, r: () => number, rough: number, move = true) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const off = Math.min(rough * 1.6, len * 0.04 + 0.6);
  const j = () => (r() * 2 - 1) * off;
  const s: Pt = [a[0] + j() * 0.6, a[1] + j() * 0.6], e: Pt = [b[0] + j() * 0.6, b[1] + j() * 0.6];
  const c1: Pt = [a[0] + (b[0] - a[0]) * 0.4 + j(), a[1] + (b[1] - a[1]) * 0.4 + j()];
  const c2: Pt = [a[0] + (b[0] - a[0]) * 0.75 + j(), a[1] + (b[1] - a[1]) * 0.75 + j()];
  return `${move ? `M${f(s[0])} ${f(s[1])}` : `L${f(s[0])} ${f(s[1])}`} C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(e[0])} ${f(e[1])}`;
}

/** A line, two strokes. */
export function line(a: Pt, b: Pt, seed: number, rough = 1): [string, string] {
  const r = seeded(seed);
  return [bow(a, b, r, rough), bow(a, b, r, rough * 0.8)];
}

/** A rectangle with Excalidraw's round corners, drawn as one continuous stroke, twice. */
export function roundRect(x: number, y: number, w: number, h: number, seed: number, rough = 1): [string, string] {
  const r = seeded(seed);
  const rad = Math.min(w, h) * 0.16;
  const one = (k: number) => {
    const j = () => (r() * 2 - 1) * rough * k;
    const p = (px: number, py: number) => `${f(px + j())} ${f(py + j())}`;
    // Starts a little past the top-left corner and overshoots the start at the end, like a pen.
    return [
      `M${p(x + rad, y)}`,
      `C${p(x + w * 0.4, y + j() * 0.6)} ${p(x + w * 0.7, y)} ${p(x + w - rad, y)}`,
      `Q${p(x + w, y)} ${p(x + w, y + rad)}`,
      `C${p(x + w, y + h * 0.4)} ${p(x + w + j() * 0.5, y + h * 0.7)} ${p(x + w, y + h - rad)}`,
      `Q${p(x + w, y + h)} ${p(x + w - rad, y + h)}`,
      `C${p(x + w * 0.6, y + h)} ${p(x + w * 0.3, y + h + j() * 0.5)} ${p(x + rad, y + h)}`,
      `Q${p(x, y + h)} ${p(x, y + h - rad)}`,
      `C${p(x, y + h * 0.6)} ${p(x, y + h * 0.3)} ${p(x, y + rad)}`,
      `Q${p(x, y)} ${p(x + rad + 4, y - 0.5)}`,
    ].join(" ");
  };
  return [one(1), one(1.25)];
}

/** An ellipse through jittered points, closing with a small overlap, twice. */
export function ellipse(cx: number, cy: number, rx: number, ry: number, seed: number, rough = 1): [string, string] {
  const r = seeded(seed);
  const one = (start: number, over: number) => {
    const n = 14, pts: Pt[] = [];
    for (let i = 0; i <= n + 2; i++) {
      const a = start + ((Math.PI * 2 + over) * i) / n;
      const k = 1 + (r() * 2 - 1) * 0.022 * rough;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    // Catmull-Rom through the points, as cubics.
    let d = `M${f(pts[1][0])} ${f(pts[1][1])}`;
    for (let i = 1; i < pts.length - 2; i++) {
      const [p0, p1, p2, p3] = [pts[i - 1], pts[i], pts[i + 1], pts[i + 2]];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  };
  return [one(-Math.PI * 0.62, 0.32), one(-Math.PI * 0.55, 0.2)];
}

/** A diamond, its four sides as one stroke, twice. */
export function diamond(cx: number, cy: number, w: number, h: number, seed: number, rough = 1): [string, string] {
  const r = seeded(seed);
  const top: Pt = [cx, cy - h / 2], right: Pt = [cx + w / 2, cy], bottom: Pt = [cx, cy + h / 2], left: Pt = [cx - w / 2, cy];
  const one = (k: number) => [bow(top, right, r, rough * k), bow(right, bottom, r, rough * k, false), bow(bottom, left, r, rough * k, false), bow(left, top, r, rough * k, false)].join(" ");
  return [one(1), one(1.2)];
}

/** An arrow's two head strokes at b, pointing from a. */
export function head(a: Pt, b: Pt, seed: number, size = 16): string {
  const r = seeded(seed);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const wing = (s: number) => {
    const t = ang + Math.PI + s * 0.48;
    const p: Pt = [b[0] + Math.cos(t) * size, b[1] + Math.sin(t) * size];
    return bow(p, b, r, 0.5);
  };
  return `${wing(1)} ${wing(-1)}`;
}
