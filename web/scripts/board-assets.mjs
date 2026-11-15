// The whiteboard page's static files (app/s/[id]/BoardPage.tsx), copied into public/board/ before
// the site runs or builds (gitignored: they're built elsewhere):
//   canvas/canvas.js, canvas/canvas.css   the app's canvas (canvas-stack/, built into Pane/Resources/Canvas)
//   canvas/fonts/<Family>/<file>.woff2    its fonts, where the engine asks for them
//   automerge.wasm                        Automerge's WebAssembly (the package's own)
// The canvas comes from the app's resources, outside web/: a deploy uploads the copy made here
// (scripts/deploy-web.sh runs this first). Where they aren't there (a build on Vercel), the copy
// already in public/ stays.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const web = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(web, "..", "Pane", "Resources", "Canvas");
const out = join(web, "public", "board");

mkdirSync(out, { recursive: true });
copyFileSync(createRequire(import.meta.url).resolve("@automerge/automerge/automerge.wasm"), join(out, "automerge.wasm"));

if (existsSync(join(source, "canvas.js"))) {
  const canvas = join(out, "canvas");
  rmSync(canvas, { recursive: true, force: true });
  mkdirSync(canvas, { recursive: true });
  for (const f of ["canvas.js", "canvas.css", "canvas-licenses.txt"]) copyFileSync(join(source, f), join(canvas, f));
  // The bundle keeps the fonts flat; the engine asks for ./fonts/<Family>/<file>.
  const js = readFileSync(join(source, "canvas.js"), "utf8");
  const flat = new Set(readdirSync(source).filter((f) => f.endsWith(".woff2")));
  let fonts = 0;
  for (const [, family, file] of js.matchAll(/\.\/fonts\/([A-Za-z]+)\/([A-Za-z0-9_.-]+\.woff2)/g)) {
    if (!flat.has(file)) continue;
    mkdirSync(join(canvas, "fonts", family), { recursive: true });
    copyFileSync(join(source, file), join(canvas, "fonts", family, file));
    fonts++;
  }
  console.log(`board assets: canvas and ${fonts} fonts from Pane/Resources/Canvas, automerge.wasm`);
} else if (!existsSync(join(out, "canvas", "canvas.js"))) {
  console.warn("board assets: no canvas (Pane/Resources/Canvas isn't here and public/board/canvas is empty): /s/<id> boards won't draw");
} else {
  console.log("board assets: automerge.wasm (the canvas copy in public/board/canvas stays)");
}
