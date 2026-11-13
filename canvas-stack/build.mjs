// Builds the canvas (a drawing board note) for the app: Pane/Resources/Canvas/
//   canvas.js            React and @excalidraw/excalidraw (MIT) with Pinto's page (src/), one script
//   canvas.css           its styles and Pinto's look over them (src/pinto.css)
//   *.woff2              the drawing fonts, served at amber-lib:///canvas/fonts/<Family>/<file>
//   canvas-licenses.txt  the licences of everything above
// The page runs in the note-page sandbox with no network: everything it loads is in the app.
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, rmSync, mkdirSync, readdirSync, copyFileSync, statSync } from "node:fs";
import { join } from "node:path";

const out = "../Pane/Resources/Canvas";
const pkg = (n) => JSON.parse(readFileSync(`node_modules/${n}/package.json`, "utf8"));
const engine = "node_modules/@excalidraw/excalidraw/dist/prod";
// The CJK fallback font is 12 MB; the UI font is Pinto's own (the system font).
const skipFonts = new Set(["Xiaolai", "Assistant"]);

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

// Nothing is fetched from a CDN: the fonts' fallback address points into the app, where it finds
// nothing. The engine's own web app settings (its collaboration server's config) go.
// Left out, as the canvas doesn't offer them yet: Mermaid diagrams (with katex and cytoscape),
// font embedding for export (two WebAssembly blobs), and every language but English.
// About 8.2 MB down to under 2 MB.
const stubs = {
  "mermaid": `export const parseMermaidToExcalidraw = async () => { throw new Error("Diagrams from text aren't available in canvases yet."); };`,
  "subset": `export const Commands = { Subset: "SUBSET" }; const no = async () => { throw new Error("Font embedding isn't available in canvases yet."); };
    export const subsetToBase64 = no, subsetToBinary = no, toBase64 = no; export const WorkerUrl = undefined;`,
  "locale": `export default {};`,
};
const offline = {
  name: "offline",
  setup(build) {
    build.onResolve({ filter: /^@excalidraw\/mermaid-to-excalidraw$/ }, () => ({ path: "mermaid", namespace: "stub" }));
    build.onResolve({ filter: /^\.\/subset-(shared|worker)\.chunk\.js$/ }, () => ({ path: "subset", namespace: "stub" }));
    build.onResolve({ filter: /^\.\/locales\// }, (a) => /^\.\/locales\/(en|percentages)-/.test(a.path) ? undefined : { path: "locale", namespace: "stub" });
    build.onLoad({ filter: /.*/, namespace: "stub" }, (args) => ({ contents: stubs[args.path], loader: "js" }));
    build.onLoad({ filter: /@excalidraw[\\/]excalidraw[\\/]dist[\\/]prod[\\/].*\.js$/ }, (args) => ({
      contents: readFileSync(args.path, "utf8")
        .replaceAll("https://esm.sh/", "amber-lib:///canvas/none/")
        .replace(/VITE_APP_FIREBASE_CONFIG:'[^']*'/g, "VITE_APP_FIREBASE_CONFIG:'{}'"),
      loader: "js",
    }));
  },
};

await esbuild.build({
  entryPoints: { canvas: "src/canvas.jsx" },
  bundle: true, format: "iife", target: "es2020", minify: true, outdir: out,
  jsx: "automatic", legalComments: "none", logLevel: "warning",
  external: ["*.woff2"],
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env": "{}" },
  conditions: ["production"],
  plugins: [offline],
});

// The UI font's @font-face rules go: it isn't shipped and isn't used.
const cssPath = join(out, "canvas.css");
writeFileSync(cssPath, readFileSync(cssPath, "utf8").replace(/@font-face\s*\{[^}]*Assistant[^}]*\}/g, ""));

let fontBytes = 0;
for (const family of readdirSync(join(engine, "fonts"))) {
  if (skipFonts.has(family)) continue;
  for (const f of readdirSync(join(engine, "fonts", family))) {
    copyFileSync(join(engine, "fonts", family, f), join(out, f));
    fontBytes += statSync(join(out, f)).size;
  }
}

const mit = (who) => `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
writeFileSync(join(out, "canvas-licenses.txt"), `Canvas notes in Pinto Notes are drawn with these open-source packages.

@excalidraw/excalidraw ${pkg("@excalidraw/excalidraw").version} (https://github.com/excalidraw/excalidraw)
MIT License

Copyright (c) 2020 Excalidraw

${mit()}

react ${pkg("react").version} and react-dom ${pkg("react-dom").version} (https://github.com/facebook/react)
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

${mit()}

Fonts shipped with @excalidraw/excalidraw: Excalifont, Virgil, Nunito, Lilita One, Cascadia Code
and Liberation Sans are under the SIL Open Font License 1.1 (https://openfontlicense.org);
Comic Shanns is under the MIT License. Their own notices are in the package's repository.
`);

const js = statSync(join(out, "canvas.js")).size, css = statSync(cssPath).size;
console.log(`canvas.js ${(js / 1024).toFixed(0)} KB, canvas.css ${(css / 1024).toFixed(0)} KB, fonts ${(fontBytes / 1024).toFixed(0)} KB`);
