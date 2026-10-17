// Samples each blog card cover's left edge (lib/og/covers/covers/*.jpg) into lib/og/covers/grounds.json:
// the colour a post's share card is filled with, and whether its words are dark or light.
// Run after adding a cover: node scripts/og-grounds.mjs
import fs from "node:fs";
import { createRequire } from "node:module";
// sharp comes with Next (it optimises images), so it is found from there.
const sharp = createRequire(createRequire(import.meta.url).resolve("next/package.json"))("sharp");
const dir = "lib/og/covers/covers", out = {};
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort()) {
  const { width, height } = await sharp(`${dir}/${f}`).metadata();
  const { data, info } = await sharp(`${dir}/${f}`).extract({ left: 0, top: 0, width: Math.max(4, Math.round(width * 0.03)), height }).raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += info.channels) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
  [r, g, b] = [r, g, b].map((x) => Math.round(x / n));
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  out[f.replace(/\.jpg$/, "")] = { ground: "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join(""), ink: lum > 0.55 ? "dark" : "light", w: width, h: height };
}
fs.writeFileSync("lib/og/covers/grounds.json", JSON.stringify(out, null, 1) + "\n");
console.log(Object.keys(out).length, "covers");
