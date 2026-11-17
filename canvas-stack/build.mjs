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
// A pencil line keeps every move the pointer made (canvas.jsx, window.__pintoPen): where the engine
// adds the one move its frame got (as the pointer moves, and as it lifts), it adds the moves kept
// since its last frame. Without the page's list (window.__pintoPen.off) it does as before.
function keepPencilMoves(contents) {
  const I = "[\\w$]+";
  const changed = () => new Error("The engine's pencil changed: give it the kept moves again (build.mjs, keepPencilMoves).");
  const once = (re) => {
    const all = [...contents.matchAll(new RegExp(re.source, "g"))];
    if (all.length !== 1) throw changed();
    return all[0];
  };
  if (/[^\w$]__(?:a|p|q|e|c|x|y|l)[^\w$]/.test(contents)) throw changed();
  // The handler for moves while pressed: its event and where it is on the board.
  const head = once(new RegExp(`onPointerMoveFromPointerDownHandler\\(${I}\\)\\{return ${I}\\((${I})=>\\{if\\(this\\.state\\.openDialog\\?\\.name==="elementLinkSelector"\\)return;let (${I})=(${I})\\(\\1,this\\.state\\);`));
  const [, event, at, toScene] = head;
  // As it moves: one point, from the frame's move.
  const move = once(new RegExp(`if\\((${I})\\.type==="freedraw"\\)\\{let (${I})=\\1\\.points,(${I})=(${I})\\.x-\\1\\.x,(${I})=\\4\\.y-\\1\\.y,(${I})=\\2\\.length>0&&\\2\\[\\2\\.length-1\\];if\\(!\\(\\6&&\\6\\[0\\]===\\3&&\\6\\[1\\]===\\5\\)\\)\\{let (${I})=\\1\\.simulatePressure\\?\\1\\.pressures:\\[\\.\\.\\.\\1\\.pressures,(${I})\\.pressure\\];(${I})\\(\\1,\\{points:\\[\\.\\.\\.\\2,(${I})\\(\\3,\\5\\)\\],pressures:\\7\\},!1\\),this\\.setState\\(\\{newElement:\\1\\}\\)\\}\\}`));
  const [, el, pts, , moveAt, , , prs, moveEvent, mutate, point] = move;
  if (moveEvent !== event || moveAt !== at || move.index < head.index) throw changed();
  // As it lifts: the lift's point, last.
  const up = once(new RegExp(`(${I})\\?\\.type==="freedraw"\\)\\{let (${I})=(${I})\\((${I}),this\\.state\\),(${I})=\\1\\.points,(${I})=\\2\\.x-\\1\\.x,(${I})=\\2\\.y-\\1\\.y;\\6===\\5\\[0\\]\\[0\\]&&\\7===\\5\\[0\\]\\[1\\]&&\\(\\7\\+=1e-4,\\6\\+=1e-4\\);let (${I})=\\1\\.simulatePressure\\?\\[\\]:\\[\\.\\.\\.\\1\\.pressures,\\4\\.pressure\\];${I}\\(\\1,\\{points:\\[\\.\\.\\.\\5,${point.replace(/\$/g, "\\$")}\\(\\6,\\7\\)\\]`));
  const [, upEl, upAt, upToScene, upEvent, upPts, upX, upY, upPrs] = up;
  if (upToScene !== toScene) throw changed();
  // The kept moves, as points of the line `line` (after its last point `last`), and their pressures.
  const kept = (line, list, last) => `let __a=[],__p=[];for(let __e of ${list}){let __c=${toScene}(__e,this.state),__x=__c.x-${line}.x,__y=__c.y-${line}.y,__l=__a.length?__a[__a.length-1]:${last};__l&&__l[0]===__x&&__l[1]===__y||(__a.push(${point}(__x,__y)),__p.push(__e.pressure))}`;
  const moveNew = `if(${el}.type==="freedraw"){let ${pts}=${el}.points,__q=window.__pintoPen&&window.__pintoPen.take()||[${event}];${kept(el, "__q", `${pts}.length>0&&${pts}[${pts}.length-1]`)}if(__a.length){let ${prs}=${el}.simulatePressure?${el}.pressures:[...${el}.pressures,...__p];${mutate}(${el},{points:[...${pts},...__a],pressures:${prs}},!1),this.setState({newElement:${el}})}}`;
  const upNew = `${upEl}?.type==="freedraw"){let ${upAt}=${toScene}(${upEvent},this.state),${upPts}=${upEl}.points,${upX}=${upAt}.x-${upEl}.x,${upY}=${upAt}.y-${upEl}.y;${kept(upEl, "window.__pintoPen&&window.__pintoPen.take()||[]", `${upPts}[${upPts}.length-1]`)}${upPts}=[...${upPts},...__a];${upX}===${upPts}[0][0]&&${upY}===${upPts}[0][1]&&(${upY}+=1e-4,${upX}+=1e-4);let ${upPrs}=${upEl}.simulatePressure?[]:[...${upEl}.pressures,...__p,${upEvent}.pressure];${up[0].slice(up[0].lastIndexOf(";") + 1)}`;
  return contents.slice(0, move.index) + moveNew + contents.slice(move.index + move[0].length, up.index) + upNew + contents.slice(up.index + up[0].length);
}

const offline = {
  name: "offline",
  setup(build) {
    build.onResolve({ filter: /^@excalidraw\/mermaid-to-excalidraw$/ }, () => ({ path: "mermaid", namespace: "stub" }));
    build.onResolve({ filter: /^\.\/subset-(shared|worker)\.chunk\.js$/ }, () => ({ path: "subset", namespace: "stub" }));
    build.onResolve({ filter: /^\.\/locales\// }, (a) => /^\.\/locales\/(en|percentages)-/.test(a.path) ? undefined : { path: "locale", namespace: "stub" });
    build.onLoad({ filter: /.*/, namespace: "stub" }, (args) => ({ contents: stubs[args.path], loader: "js" }));
    build.onLoad({ filter: /@excalidraw[\\/]excalidraw[\\/]dist[\\/]prod[\\/].*\.js$/ }, (args) => {
      let contents = readFileSync(args.path, "utf8")
        .replaceAll("https://esm.sh/", "amber-lib:///canvas/none/")
        .replace(/VITE_APP_FIREBASE_CONFIG:'[^']*'/g, "VITE_APP_FIREBASE_CONFIG:'{}'");
      // The box words are typed in: no grey inline prediction (Tab grows a mind map's branch and
      // must never accept one), no autocorrect or autofill changing what was typed. Spelling is
      // still underlined, as in Notes. Set as the box is made, before it takes the keys.
      if (/index\.js$/.test(args.path)) {
        const made = /(\w+)\.classList\.add\("excalidraw-wysiwyg"\)/;
        if (!made.test(contents)) throw new Error("The engine's text box changed: set its typing attributes again (build.mjs).");
        contents = contents.replace(made, (m, v) => `${m},${v}.setAttribute("writingsuggestions","false"),${v}.setAttribute("autocorrect","off"),${v}.setAttribute("autocomplete","off")`);
        contents = keepPencilMoves(contents);
      }
      return { contents, loader: "js" };
    });
  },
};

await esbuild.build({
  entryPoints: { canvas: "src/canvas.jsx" },
  bundle: true, format: "iife", target: "es2020", minify: true, outdir: out,
  jsx: "automatic", legalComments: "none", logLevel: "warning",
  external: ["*.woff2"],
  define: { "process.env.NODE_ENV": '"production"', "import.meta.env": "{}" },
  // The engine names a file's source after the page's address as it starts (EXPORT_SOURCE): in
  // the app that was "amber-app://" (round 16, 19-shared-board.excalidraw). Set before it starts,
  // so every .excalidraw file, embedded scene and copy says Pinto Notes, as a new board does.
  banner: { js: 'window.EXCALIDRAW_EXPORT_SOURCE = "https://pintonotes.com";' },
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
