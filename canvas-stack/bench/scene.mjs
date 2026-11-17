// The board benchmark's drawings (scripts/board-perf.sh): one scene of `n` elements, the same on
// every run, as a stored Excalidraw scene (full elements, as a board saves them). Mixed as a real
// board is: shapes (some with words in them), arrows joining shapes (some with labels), lines of
// text, pencil strokes and two pictures.
//
//   node bench/scene.mjs 500 out/scene-500.json
//
// For 500: 150 shapes (60 with words), 80 arrows (40 with labels), 70 texts, 98 strokes, 2 images.
// Bigger scenes keep those shares, and two images.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

import { readdirSync } from "node:fs";
import { join } from "node:path";

// fractional-indexing comes with the engine (not hoisted by pnpm).
const pnpm = new URL("../node_modules/.pnpm/", import.meta.url).pathname;
const fi = readdirSync(pnpm).find((d) => d.startsWith("fractional-indexing@"));
const { generateNKeysBetween } = await import(join(pnpm, fi, "node_modules/fractional-indexing/src/index.js"));


/** A small steady random number generator (mulberry32), so every run draws the same board. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A PNG: a soft gradient with a pattern and a little texture, like a pasted screenshot (about 300 KB). */
function png(width, height, seed) {
  const r = rng(seed);
  const raw = Buffer.alloc((width * 3 + 1) * height);
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0;
    for (let x = 0; x < width; x++) {
      const n = (x >> 4) % 7 === (y >> 4) % 5 ? 40 : (x + y) % 9 === 0 ? ((r() * 6) | 0) : 0;
      raw[o++] = (x * 255 / width + n) & 255;
      raw[o++] = (y * 255 / height + n) & 255;
      raw[o++] = ((x + y) * 128 / (width + height) + 90 + n) & 255;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const bytes = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 6 })), chunk("IEND", Buffer.alloc(0))]);
  return "data:image/png;base64," + bytes.toString("base64");
}

export function scene(n) {
  const r = rng(n * 7919 + 17);
  const k = n / 500;
  const counts = { shapes: Math.round(150 * k), labelled: Math.round(60 * k), arrows: Math.round(80 * k), arrowLabels: Math.round(40 * k), texts: Math.round(70 * k), images: 2 };
  counts.strokes = n - counts.shapes - counts.labelled - counts.arrows - counts.arrowLabels - counts.texts - counts.images;
  const ink = ["#2a1d10", "#1971c2", "#e03131", "#2f9e44", "#f08c00", "#9c36b5"];
  const fills = ["transparent", "#ffec99", "#a5d8ff", "#b2f2bb", "#ffc9c9", "#eebefa"];
  const pick = (a) => a[(r() * a.length) | 0];
  let nid = 0;
  const id = (p) => `${p}${(nid++).toString(36)}`;
  const base = (type, x, y, w, h, more = {}) => ({
    id: id(type[0]), type, x, y, width: w, height: h, angle: 0, strokeColor: pick(ink), backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid", roughness: 1, opacity: 100, groupIds: [], frameId: null,
    roundness: null, seed: (r() * 2 ** 31) | 0, version: 3, versionNonce: (r() * 2 ** 31) | 0, isDeleted: false,
    boundElements: null, updated: 1763270000000, link: null, locked: false, ...more,
  });
  const textOf = (x, y, words, size, more = {}) => {
    const w = Math.max(20, words.length * size * 0.55), h = size * 1.25;
    return base("text", x, y, w, h, { text: words, originalText: words, fontSize: size, fontFamily: 5, textAlign: "left", verticalAlign: "top",
      containerId: null, autoResize: true, lineHeight: 1.25, strokeColor: "#2a1d10", ...more });
  };
  const wordsList = ["Idea", "Draft", "Ready?", "Publish", "Fix it", "Research", "Interview users", "Ship beta", "Q3 goals", "Launch", "Pricing", "Onboarding", "Retro", "Went well", "To improve", "Next steps"];

  // The board is a grid of cells about the size of a sticky; shapes, texts and strokes each take one.
  const cells = counts.shapes + counts.texts + counts.strokes + counts.images * 6;
  const cols = Math.ceil(Math.sqrt(cells * 1.4));
  const cw = 260, ch = 190;
  const free = Array.from({ length: cols * Math.ceil(cells / cols + 1) }, (_, i) => i);
  for (let i = free.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0; [free[i], free[j]] = [free[j], free[i]]; }
  const cell = () => { const c = free.pop(); return { x: (c % cols) * cw, y: Math.floor(c / cols) * ch }; };

  const elements = [], shapes = [];
  for (let i = 0; i < counts.shapes; i++) {
    const at = cell();
    const type = pick(["rectangle", "rectangle", "ellipse", "diamond"]);
    const fill = i < 30 * k ? pick(fills.slice(1)) : pick(fills);
    const s = base(type, at.x + 10, at.y + 10, 160 + r() * 60, 90 + r() * 50, { backgroundColor: fill, fillStyle: fill === "transparent" ? "solid" : pick(["solid", "hachure", "solid"]),
      roundness: type === "rectangle" ? { type: 3 } : { type: 2 } });
    elements.push(s); shapes.push(s);
    if (i < counts.labelled) {
      const words = pick(wordsList);
      const t = textOf(s.x + s.width / 2 - words.length * 5.5, s.y + s.height / 2 - 12.5, words, 20, { containerId: s.id, textAlign: "center", verticalAlign: "middle" });
      s.boundElements = [{ type: "text", id: t.id }];
      elements.push(t);
    }
  }
  for (let i = 0; i < counts.arrows; i++) {
    const a = shapes[(r() * shapes.length) | 0];
    // To a shape near it, so the arrows are short as on a real board.
    const near = shapes.filter((b) => b !== a && Math.abs(b.x - a.x) < cw * 2.5 && Math.abs(b.y - a.y) < ch * 2.5);
    const b = near.length ? near[(r() * near.length) | 0] : shapes[(r() * shapes.length) | 0];
    const sx = a.x + a.width, sy = a.y + a.height / 2, ex = b.x, ey = b.y + b.height / 2;
    const arrow = base("arrow", sx, sy, Math.abs(ex - sx), Math.abs(ey - sy), {
      points: [[0, 0], [ex - sx, ey - sy]], lastCommittedPoint: null, startArrowhead: null, endArrowhead: "arrow", elbowed: false,
      roundness: { type: 2 }, startBinding: { elementId: a.id, focus: 0, gap: 4 }, endBinding: { elementId: b.id, focus: 0, gap: 4 },
    });
    a.boundElements = [...(a.boundElements || []), { type: "arrow", id: arrow.id }];
    b.boundElements = [...(b.boundElements || []), { type: "arrow", id: arrow.id }];
    elements.push(arrow);
    if (i < counts.arrowLabels) {
      const words = pick(["yes", "no", "then", "maybe", "later"]);
      const t = textOf(sx + (ex - sx) / 2 - 15, sy + (ey - sy) / 2 - 10, words, 16, { containerId: arrow.id, textAlign: "center", verticalAlign: "middle" });
      arrow.boundElements = [{ type: "text", id: t.id }];
      elements.push(t);
    }
  }
  for (let i = 0; i < counts.texts; i++) {
    const at = cell();
    elements.push(textOf(at.x + 12, at.y + 40, pick(wordsList) + (r() < 0.5 ? " " + pick(wordsList).toLowerCase() : ""), pick([16, 20, 28])));
  }
  for (let i = 0; i < counts.strokes; i++) {
    const at = cell();
    const len = 40 + ((r() * 110) | 0);
    const pts = [[0, 0]];
    let x = 0, y = 0, dir = r() * Math.PI * 2;
    for (let p = 1; p < len; p++) { dir += (r() - 0.5) * 0.5; x += Math.cos(dir) * 3; y += Math.sin(dir) * 3; pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]); }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), minY = Math.min(...ys);
    elements.push(base("freedraw", at.x + 80 - minX, at.y + 60 - minY, Math.max(...xs) - minX, Math.max(...ys) - minY, {
      points: pts, pressures: [], simulatePressure: true, lastCommittedPoint: null, strokeWidth: pick([1, 2, 2, 4]),
    }));
  }
  const files = {};
  for (let i = 0; i < counts.images; i++) {
    const at = cell();
    const fileId = `bench-picture-${i}`;
    files[fileId] = { id: fileId, mimeType: "image/png", dataURL: png(800, 600, 99 + i), created: 1763270000000 };
    elements.push(base("image", at.x, at.y, 480, 360, { fileId, status: "saved", scale: [1, 1], crop: null, strokeColor: "transparent" }));
  }
  const keys = generateNKeysBetween(null, null, elements.length);
  elements.forEach((e, i) => { e.index = keys[i]; });
  return { type: "excalidraw", version: 2, source: "https://pintonotes.com", elements, appState: { viewBackgroundColor: "#ffffff", gridSize: 20 }, files };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = Number(process.argv[2] || 500), out = process.argv[3] || `scene-${n}.json`;
  const s = scene(n);
  writeFileSync(out, JSON.stringify(s));
  const kinds = {};
  for (const e of s.elements) kinds[e.type] = (kinds[e.type] || 0) + 1;
  console.log(`${out}: ${s.elements.length} elements ${JSON.stringify(kinds)}, ${(JSON.stringify(s).length / 1024).toFixed(0)} KB`);
}
