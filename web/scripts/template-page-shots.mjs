// The template pages' pictures of the plain-note templates (web/content/template-pages/<slug>.json,
// "pictures"): the real Mac app draws them offscreen (PaneTests/HIG/TemplatePageShots.swift).
//   node web/scripts/template-page-shots.mjs manifest <dir>   writes <dir>/manifest.json for the test
//   TEST_RUNNER_TEMPLATE_PAGE_SHOTS=<dir> scripts/qa-test.sh PaneTests/TemplatePageShots
//   node web/scripts/template-page-shots.mjs convert <dir>    turns <dir>/<slug>/<name>.png into
//                                                              web/public/templates/page/<slug>/<name>.webp
// The four app templates are drawn by scripts/template-page-shots.ts instead.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAGES = path.join(WEB, "content/template-pages");
// The Mac at the width the blog's side-by-side pictures use, so the note's text is readable on the page.
const SIZES = { mac: [760, 475], phone: [390, 844] };
const [mode, dir] = process.argv.slice(2);
if (!dir || !["manifest", "convert"].includes(mode)) throw new Error("usage: template-page-shots.mjs manifest|convert <dir>");

const plain = readdirSync(PAGES).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  .map((slug) => ({ slug, page: JSON.parse(readFileSync(path.join(PAGES, `${slug}.json`), "utf8")) }))
  .filter(({ page }) => page.pictures);

if (mode === "manifest") {
  const shots = plain.flatMap(({ slug, page }) => {
    const t = JSON.parse(readFileSync(path.join(WEB, "content/templates", `${slug}.json`), "utf8"));
    return Object.entries(page.pictures).map(([name, p]) => {
      const [width, height] = SIZES[name.split("-")[0]];
      return { slug, name, body: p.of === "note" ? t.note : t.example, width, height, ...(p.from ? { from: p.from } : {}) };
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
      execFileSync("cwebp", ["-quiet", "-q", "82", "-resize", name.startsWith("mac") ? "1520" : "780", "0", png, "-o", path.join(out, `${name}.webp`)]);
    }
    console.log(`✓ ${slug}`);
  }
}
