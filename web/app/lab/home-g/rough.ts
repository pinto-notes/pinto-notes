// Hand-drawn shapes for the whiteboard, the way Excalidraw draws them: each outline is two loose
// passes of one pen. Seeded, so the server and the browser draw the same wobble.

export function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const f = (n: number) => n.toFixed(1);

/** A line that bows a little, as a hand would draw it. */
export function line(x1: number, y1: number, x2: number, y2: number, seed: number, j = 1.4) {
  const r = rng(seed), J = () => (r() - 0.5) * 2 * j;
  const mx = (x1 + x2) / 2 + J() * 1.6, my = (y1 + y2) / 2 + J() * 1.6;
  return `M${f(x1 + J() * 0.5)} ${f(y1 + J() * 0.5)} Q${f(mx)} ${f(my)} ${f(x2 + J() * 0.5)} ${f(y2 + J() * 0.5)}`;
}

/** A rounded rectangle, two passes. */
export function rect(cx: number, cy: number, w: number, h: number, seed: number) {
  const x = cx - w / 2, y = cy - h / 2, c = Math.min(16, h / 4);
  const pass = (s: number) => {
    const r = rng(s), J = () => (r() - 0.5) * 2.2;
    const p = [
      [x + c, y + J()], [x + w - c, y + J()], [x + w + J(), y + c], [x + w + J(), y + h - c],
      [x + w - c, y + h + J()], [x + c, y + h + J()], [x + J(), y + h - c], [x + J(), y + c],
    ];
    return `M${f(p[0][0])} ${f(p[0][1])} L${f(p[1][0])} ${f(p[1][1])} Q${f(x + w)} ${f(y)} ${f(p[2][0])} ${f(p[2][1])} L${f(p[3][0])} ${f(p[3][1])} Q${f(x + w)} ${f(y + h)} ${f(p[4][0])} ${f(p[4][1])} L${f(p[5][0])} ${f(p[5][1])} Q${f(x)} ${f(y + h)} ${f(p[6][0])} ${f(p[6][1])} L${f(p[7][0])} ${f(p[7][1])} Q${f(x)} ${f(y)} ${f(p[0][0] + 2)} ${f(p[0][1])}`;
  };
  return [pass(seed), pass(seed + 7)];
}

/** An ellipse, drawn once round with a small overshoot where the pen meets its start. */
export function ellipse(cx: number, cy: number, rx: number, ry: number, seed: number) {
  const pass = (s: number, a0: number) => {
    const r = rng(s), w1 = r() * 6, w2 = r() * 6, n = 56;
    let d = "";
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI * 2 + 0.22);
      const k = 1 + 0.018 * Math.sin(a * 2 + w1) + 0.012 * Math.sin(a * 3 + w2);
      d += `${i ? "L" : "M"}${f(cx + Math.cos(a) * rx * k)} ${f(cy + Math.sin(a) * ry * k)}`;
    }
    return d;
  };
  return [pass(seed, -2.1), pass(seed + 3, -1.9)];
}

/** A diamond, its four sides as loose lines, two passes. */
export function diamond(cx: number, cy: number, hw: number, hh: number, seed: number) {
  const pass = (s: number) => {
    const r = rng(s), J = () => (r() - 0.5) * 2.4;
    const t = [cx + J(), cy - hh + J()], rt = [cx + hw + J(), cy + J()], b = [cx + J(), cy + hh + J()], l = [cx - hw + J(), cy + J()];
    return `M${f(t[0])} ${f(t[1])} L${f(rt[0])} ${f(rt[1])} L${f(b[0])} ${f(b[1])} L${f(l[0])} ${f(l[1])} L${f(t[0] + 1)} ${f(t[1] - 0.5)}`;
  };
  return [pass(seed), pass(seed + 5)];
}

/** An arrow: a gently bowed shaft and an open head. */
export function arrow(x1: number, y1: number, x2: number, y2: number, seed: number) {
  const a = Math.atan2(y2 - y1, x2 - x1), L = 15, s = 0.48;
  const h1 = [x2 - Math.cos(a - s) * L, y2 - Math.sin(a - s) * L], h2 = [x2 - Math.cos(a + s) * L, y2 - Math.sin(a + s) * L];
  return [line(x1, y1, x2, y2, seed, 1.1), `M${f(h1[0])} ${f(h1[1])} L${f(x2)} ${f(y2)} L${f(h2[0])} ${f(h2[1])}`];
}

/** The filled area of each shape: clean, under its outline. */
export const fillRect = (cx: number, cy: number, w: number, h: number) => {
  const x = cx - w / 2, y = cy - h / 2, c = Math.min(16, h / 4);
  return `M${x + c} ${y} H${x + w - c} Q${x + w} ${y} ${x + w} ${y + c} V${y + h - c} Q${x + w} ${y + h} ${x + w - c} ${y + h} H${x + c} Q${x} ${y + h} ${x} ${y + h - c} V${y + c} Q${x} ${y} ${x + c} ${y}Z`;
};
export const fillEllipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${cx - rx} ${cy} A${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
