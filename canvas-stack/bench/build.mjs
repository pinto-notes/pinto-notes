// Builds what the board benchmark (scripts/board-perf.sh) needs, into ../build/board-perf/:
//   scene-<n>.json        the drawings, the same on every run (scene.mjs)
//   plain/index.html      plain Excalidraw (plain.jsx), the same version as the board's, built the
//                         same way (minified, production React), with its fonts
//   driver.js             the page side of the benchmark, put into each page as it runs
//
//   node bench/build.mjs [500,2000]
import * as esbuild from "esbuild";
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scene } from "./scene.mjs";

const out = new URL("../../build/board-perf/", import.meta.url).pathname;
const plain = join(out, "plain");
mkdirSync(plain, { recursive: true });

for (const n of (process.argv[2] || "500,2000").split(",").map(Number)) {
  const s = scene(n);
  writeFileSync(join(out, `scene-${n}.json`), JSON.stringify(s));
}

// The same parts left out as the board's own build (build.mjs): Mermaid, font embedding and every
// language but English. They load only when used, on excalidraw.com, so the page starts as fast.
const stubs = {
  mermaid: `export const parseMermaidToExcalidraw = async () => { throw new Error("no"); };`,
  subset: `export const Commands = { Subset: "SUBSET" }; const no = async () => { throw new Error("no"); };
    export const subsetToBase64 = no, subsetToBinary = no, toBase64 = no; export const WorkerUrl = undefined;`,
  locale: `export default {};`,
};
const lean = {
  name: "lean",
  setup(build) {
    build.onResolve({ filter: /^@excalidraw\/mermaid-to-excalidraw$/ }, () => ({ path: "mermaid", namespace: "stub" }));
    build.onResolve({ filter: /^\.\/subset-(shared|worker)\.chunk\.js$/ }, () => ({ path: "subset", namespace: "stub" }));
    build.onResolve({ filter: /^\.\/locales\// }, (a) => /^\.\/locales\/(en|percentages)-/.test(a.path) ? undefined : { path: "locale", namespace: "stub" });
    build.onLoad({ filter: /.*/, namespace: "stub" }, (args) => ({ contents: stubs[args.path], loader: "js" }));
  },
};

await esbuild.build({
  entryPoints: { plain: new URL("plain.jsx", import.meta.url).pathname },
  bundle: true, format: "iife", target: "es2020", minify: true, outdir: plain,
  jsx: "automatic", legalComments: "none", logLevel: "warning",
  external: ["*.woff2"],
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env": "{}" },
  conditions: ["production"],
  plugins: [lean],
});
const engine = new URL("../node_modules/@excalidraw/excalidraw/dist/prod/fonts/", import.meta.url).pathname;
for (const family of readdirSync(engine)) {
  mkdirSync(join(plain, "fonts", family), { recursive: true });
  for (const f of readdirSync(join(engine, family))) copyFileSync(join(engine, family, f), join(plain, "fonts", family, f));
}
writeFileSync(join(plain, "index.html"), `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Excalidraw</title><link rel="stylesheet" href="plain.css">
<style>html, body, #root { margin: 0; height: 100%; overflow: hidden; }</style></head>
<body><div id="root"></div><script src="plain.js"></script></body></html>
`);
copyFileSync(new URL("driver.js", import.meta.url).pathname, join(out, "driver.js"));
console.log(`built ${out}`);
