// The template pages' pictures of the plain-note templates (web/content/template-pages/<slug>.json,
// "pictures"): the real apps draw them (PaneTests/HIG/TemplatePageShots.swift), the Mac ones ("mac-…")
// offscreen on the Mac, the iPhone ones ("phone-…") on a headless simulator. Each is the note at the
// step its slide is about (lib/template-picture-body.mjs).
//   node web/scripts/template-page-shots.mjs manifest <dir>   writes <dir>/manifest.json for the tests
//   TEST_RUNNER_TEMPLATE_PAGE_SHOTS=<dir> scripts/qa-test.sh PaneTests/TemplatePageShots
//   scripts/template-page-shots-iphone.sh <dir>
//   node web/scripts/template-page-shots.mjs convert <dir>    turns <dir>/<slug>/<name>.png into
//                                                              web/public/templates/page/<slug>/<name>.webp
// ONLY=slug,slug limits either step to those templates.
// The four app templates are drawn by scripts/template-page-shots.ts instead.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pictureBody } from "../lib/template-picture-body.mjs";

const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = path.join(WEB, "content/template-pages");
// The Mac as a note in a window of its own, narrow enough that its text reads at the page's width
// (the smallest such window is 480 wide). The iPhone is the simulator's screen, 390 by 844.
const SIZES = { mac: [640, 400], phone: [390, 844] };
const [mode, dir] = process.argv.slice(2);
if (!dir || !["manifest", "convert"].includes(mode)) throw new Error("usage: template-page-shots.mjs manifest|convert <dir>");

const plain = readdirSync(PAGES).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  .map((slug) => ({ slug, page: JSON.parse(readFileSync(path.join(PAGES, `${slug}.json`), "utf8")) }))
  .filter(({ page }) => page.pictures)
  .filter(({ slug }) => !process.env.ONLY || process.env.ONLY.split(",").includes(slug));

if (mode === "manifest") {
  const shots = plain.flatMap(({ slug, page }) => {
    const t = JSON.parse(readFileSync(path.join(WEB, "content/templates", `${slug}.json`), "utf8"));
    return Object.entries(page.pictures).map(([name, p]) => {
      const [width, height] = SIZES[name.split("-")[0]];
      return { slug, name, body: pictureBody({ ...t, slug }, p), width, height, ...(p.from ? { from: p.from } : {}) };
    });
  });
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(shots, null, 1));
  console.log(`${shots.length} pictures in ${path.join(dir, "manifest.json")}`);
} else {
  for (const { slug, page } of plain) {
    const out = path.join(WEB, "public/templates/page", slug);
    mkdirSync(out, { recursive: true });
    for (const name of Object.keys(page.pictures)) {
      const png = path.join(dir, slug, `${name}.png`);
      if (!existsSync(png)) throw new Error(`missing ${png}`);
      execFileSync("cwebp", ["-quiet", "-q", "82", "-resize", name.startsWith("mac") ? "1280" : "780", "0", png, "-o", path.join(out, `${name}.webp`)]);
    }
    console.log(`✓ ${slug}`);
  }
}
