// The app-project format, path rules, edits, compile and import checks.
//   cd supabase/functions/mcp && deno test -A app_project.test.ts
import { assert, assertEquals, assertRejects, assertStringIncludes, assertThrows } from "jsr:@std/assert@1";
import { BARE_IMPORTS, binaryType, brokenImports, cleanPath, compile, editText, isBinaryBytes, MAX_FILE_BYTES, MAX_PROJECT_BYTES, numbered, packBinary, parseStored, projectProblems, resolveFrom, serialize, sourceProblems, STACK_NAMES, unpackBinary } from "./app_project.ts";

Deno.test("a one-file app stays plain HTML; a project round-trips as JSON", () => {
  const html = "<!doctype html><p>hi</p>";
  assertEquals(parseStored(html).files, { "/index.html": html });
  assertEquals(serialize(parseStored(html)), html);
  const p = { amberApp: 1 as const, files: { "/index.html": "<div id=app></div>", "/src/App.jsx": "export default () => <p/>" }, compiled: { "/src/App.jsx": "x" } };
  assertEquals(parseStored(serialize(p)), p);
  assertEquals(parseStored("{not json").files["/index.html"], "{not json");
});

Deno.test("paths: a leading slash is added; .., spaces and empty parts are refused", () => {
  assertEquals(cleanPath("src/App.jsx"), "/src/App.jsx");
  for (const bad of ["/a/../b", "/a b.js", "/a//b", "/src/", "", "/x?.js"]) assertThrows(() => cleanPath(bad));
  assertEquals(resolveFrom("/src/screens/Home.jsx", "../components/Set.jsx"), "/src/components/Set.jsx");
  assertEquals(resolveFrom("/index.html", "/src/main.jsx"), "/src/main.jsx");
  assertEquals(resolveFrom("/index.html", "src/styles.css"), "/src/styles.css");
});

Deno.test("edits need a unique match, like a coding agent's Edit", () => {
  assertEquals(editText("a b a", "b", "c").text, "a c a");
  assertThrows(() => editText("a b a", "a", "c"), Error, "appears 2 times");
  assertEquals(editText("a b a", "a", "c", true), { text: "c b c", count: 2 });
  assertThrows(() => editText("a", "z", "y"), Error, "wasn't found");
  assertEquals(editText("x $& y", "x", "$&").text, "$& $& y");
  assertEquals(numbered("a\nb\nc", 2, 1), { text: "     2\tb", lines: 3, shown: [2, 2] });
});

Deno.test("compile: JSX to ESM with preact's runtime; syntax errors name the line", async () => {
  const ok = await compile("/src/App.jsx", `import { useState } from "preact/hooks";\nexport default function App() { const [n] = useState(1); return <p class="n">{n}</p>; }`);
  assert("code" in ok);
  assertStringIncludes(ok.code, `from "preact/jsx-runtime"`);
  assertStringIncludes(ok.code, `from "preact/hooks"`);
  const bad = await compile("/src/App.jsx", "export default () => <div>\n");
  assert("error" in bad);
  assertStringIncludes(bad.error, "/src/App.jsx:");
});

Deno.test("imports: missing files, unknown bare names, URLs and an own import map are reported", () => {
  const p = { amberApp: 1 as const, compiled: {}, files: {
    "/index.html": `<link rel="stylesheet" href="/src/styles.css"><script type="module" src="/src/main.jsx"></script><script src="https://cdn.example/x.js"></script>`,
    "/src/main.jsx": `import { render } from "preact";\nimport App from "./App.jsx";\nimport _ from "lodash";\nimport x from "https://esm.sh/x";`,
    "/src/styles.css": "",
  } };
  const r = brokenImports(p).join("\n");
  assertStringIncludes(r, "imports ./App.jsx, but there's no such file");
  assertStringIncludes(r, `"lodash"`);
  assertStringIncludes(r, "https://esm.sh/x");
  assertStringIncludes(r, "cdn.example");
  assert(!r.includes("preact\""));
  assertStringIncludes(projectProblems({ ...p, files: { "/index.html": `<script type="importmap">{}</script>` } }).join(), "import map");
  assertStringIncludes(projectProblems({ ...p, files: { "/a.js": "" } }).join(), "/index.html");
});

Deno.test("a React + Tailwind project links like Vite: @/ alias, no extensions, CSS from the classes used", async () => {
  const { linkProject, isReact } = await import("./app_project.ts");
  const files: Record<string, string> = {
    "/index.html": `<div id="root"></div><script type="module" src="/src/main.tsx"></script>`,
    "/package.json": `{ "dependencies": { "react": "^19" } }`,
    "/src/main.tsx": `import { createRoot } from "react-dom/client";\nimport "./index.css";\nimport App from "@/App";\ncreateRoot(document.getElementById("root")!).render(<App />);`,
    "/src/App.tsx": `import { cn } from "@/lib/utils";\nimport { Button } from "./components/ui/button";\nexport default function App() { return <main className={cn("flex p-4", "md:grid-cols-3")}><Button /></main>; }`,
    "/src/components/ui/button.tsx": `export function Button() { return <button className="rounded-md bg-primary px-3 dark:bg-zinc-900">Go</button>; }`,
    "/src/lib/utils.ts": `export const cn = (...xs: string[]) => xs.join(" ");`,
    "/src/index.css": `@import "tailwindcss";\n@import "tw-animate-css";\n@theme inline { --color-primary: var(--amber-accent); }`,
  };
  const p = { amberApp: 1 as const, files, compiled: {} as Record<string, string> };
  assert(isReact(p));
  const t0 = performance.now();
  for (const f of Object.keys(files).filter((f) => /\.tsx?$/.test(f))) { const r = await compile(f, files[f], "react"); assert("code" in r); p.compiled[f] = r.code; }
  const t1 = performance.now();
  const linked = await linkProject(p);
  const t2 = performance.now();
  console.log(`compile ${Math.round(t1 - t0)} ms (4 files), link + tailwind ${Math.round(t2 - t1)} ms (tailwind ${linked.ms.tailwind} ms)`);
  const c = linked.project.compiled;
  assertStringIncludes(c["/src/main.tsx"], `from "/src/App.tsx"`);
  assertStringIncludes(c["/src/main.tsx"], `import "/src/index.css?import";`);
  assertStringIncludes(c["/src/main.tsx"], `from "react/jsx-runtime"`);
  assertStringIncludes(c["/src/App.tsx"], `from "/src/lib/utils.ts"`);
  assertStringIncludes(c["/src/App.tsx"], `from "/src/components/ui/button.tsx"`);
  for (const cls of [".flex", ".p-4", ".bg-primary", "md\\:grid-cols-3", "dark\\:bg-zinc-900"]) assertStringIncludes(c["/src/index.css"], cls);
  assertEquals(brokenImports(linked.project), []);
  // Linking again changes nothing.
  assertEquals((await linkProject(linked.project)).project.compiled, c);
});

Deno.test("the stack's bare names match the app's import map", () => {
  const map = JSON.parse(Deno.readTextFileSync(new URL("../../../Pane/Resources/AppLibraries/stack.json", import.meta.url))).map as Record<string, string>;
  const ours = new Set(STACK_NAMES);
  for (const name of Object.keys(map)) if (!name.startsWith("@radix-ui/") && !/^preact(\/hooks|\/jsx-runtime)?$/.test(name)) assert(ours.has(name), `${name} is in stack.json but not in STACK_NAMES`);
  for (const name of STACK_NAMES) assert(name in map, `${name} isn't in stack.json`);
});

Deno.test("binary files: stored as compressed bytes, unpacked the same, with the web's type, and kept by serialize (2026-11-14)", async () => {
  const wad = new Uint8Array(4_196_020).map((_, i) => (i % 5 === 0 ? 0 : (i * 31) % 97)); // DOOM1.WAD's size, with zeros like it
  const stored = await packBinary(wad);
  assertEquals(await unpackBinary(stored), wad);
  assert(stored.length < wad.length, `${stored.length} stored for ${wad.length} bytes`);
  const p = { amberApp: 1 as const, files: { "/index.html": "<canvas></canvas>" }, compiled: {}, binary: { "/doom1.wad": stored } };
  assertEquals(parseStored(serialize(p)), p);
  // A text project stays as it was: no binary key.
  assertEquals(serialize({ amberApp: 1, files: { "/index.html": "<p>", "/a.js": "" }, compiled: {} }).includes("binary"), false);
  assertEquals(binaryType("/doom.wasm"), "application/wasm");
  assertEquals(binaryType("/doom1.wad"), "application/octet-stream");
  assert(isBinaryBytes(new Uint8Array([0x00, 0x61, 0x73, 0x6d])) && !isBinaryBytes(new TextEncoder().encode("héllo")));
  // A small file that would unpack into a huge one is refused.
  const bomb = await packBinary(new Uint8Array(2 * 1024 * 1024));
  await assertRejects(() => unpackBinary(bomb, 1024 * 1024), Error, "more than 1 MB");
  // The same path can't be both, and what's stored counts toward the limits.
  assertStringIncludes(projectProblems({ ...p, files: { ...p.files, "/doom1.wad": "x" } }).join(), "both a text file and a binary one");
  assertStringIncludes(projectProblems({ ...p, binary: { "/big.bin": "A".repeat(MAX_FILE_BYTES + 4) } }).join(), "stored (compressed)");
});

Deno.test("a game fits: Doom's engine and its 4 MB WAD as raw binary files, and Emscripten's loader as it's built (2026-11-14)", async () => {
  const wad = await packBinary(new Uint8Array(4_196_020).map((_, i) => (i % 5 === 0 ? 0 : (i * 31) % 97)));
  const glue = `var readAsync=async url=>{var response=await fetch(url,{credentials:"same-origin"})};function lazy(){var xhr=new XMLHttpRequest;xhr.open("GET",url,false)}`;
  const p = { amberApp: 1 as const, files: { "/index.html": `<html lang="en"><canvas></canvas><script src="doom.js"></script>`, "/doom.js": glue }, compiled: {}, binary: { "/doom1.wad": wad, "/doom.wasm": await packBinary(new Uint8Array(396_621)) } };
  assertEquals(projectProblems(p), []);
  assertEquals(sourceProblems(p), []);
  assertEquals(brokenImports(p), []);
  // The limits still hold, raised.
  assertStringIncludes(projectProblems({ ...p, files: { ...p.files, "/big.txt": "x".repeat(MAX_FILE_BYTES + 1) } }).join(), "at most 8 MB");
  const many = Object.fromEntries(Array.from({ length: 3 }, (_, i) => [`/part${i}.txt`, "x".repeat(MAX_FILE_BYTES - 10)]));
  assertStringIncludes(projectProblems({ ...p, files: { ...p.files, ...many } }).join(), `at most ${MAX_PROJECT_BYTES / 1048576} MB`);
});

Deno.test("an app reaches the internet like a web page: no address, fetch or WebSocket is refused on save (2026-11-14)", () => {
  const p = {
    amberApp: 1 as const, compiled: {},
    files: {
      "/index.html": `<html lang="en"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><img src="https://example.com/a.png"><script src="main.js"></script>`,
      "/main.js": `fetch("https://api.open-meteo.com/v1/forecast").then((r) => r.json()); new WebSocket("wss://echo.example/ws"); const x = new XMLHttpRequest(); x.open("GET", "https://example.com/x");`,
    },
  };
  assertEquals(projectProblems(p), []);
  assertEquals(sourceProblems(p), []);
  assertEquals(brokenImports(p), []);
  // Frames and plugins would take the app out of its note: still refused.
  assertStringIncludes(sourceProblems({ ...p, files: { ...p.files, "/index.html": `<iframe src="https://example.com"></iframe>` } }).join(), "<iframe> isn't allowed");
});

/// Pinto Notes was Amber Notes (2026-11-14). Everything the AI is told uses the new names; apps
/// written with the old ones (window.amber, "amber", "amber-ui", amber-app:, --amber-*) keep working.
const OLD_NAMES = new RegExp([
  String.raw`window\.amber\b`,
  String.raw`(?<![\w-])amber\s*\.\s*(note|data|store|onChange|update|batch|device|files|lib|context|open|insets|setData|setSummary|ai|fetch|ready|share|onError)\b`,
  String.raw`(from\s*|import\s*\(\s*)["']amber["']`,
  String.raw`["']amber-(ui|router)["']`,
  String.raw`\bamber-(app|lib|file):`,
  String.raw`--amber-`,
  String.raw`\bamber-(widget|narrow|medium|wide)\b`,
  String.raw`data-amber-context`,
  String.raw`amber:insets`,
  String.raw`@/lib/amber\b`,
].join("|"));

Deno.test("what the AI is told uses only the pinto names (2026-11-14)", async () => {
  await import("./tools.ts");
  const { instructions, servedPrompts, servedResources } = await import("./server.ts");
  const { servedTools } = await import("./tool_set.ts");
  const { PAGE_CONTRACT } = await import("./page.ts");
  const { PAGE_API, PAGE_INSTRUCTIONS, FILE_APP_INSTRUCTIONS, pageGuide, appsGuide } = await import("./page_guide.ts");
  const { appGuide, scaffold } = await import("./app_scaffold.ts");
  const { STACK_FILES } = await import("./app_stack.gen.ts");
  const { APP_EXAMPLES } = await import("./app_examples.gen.ts");
  const { PAGE_TEMPLATES } = await import("./page_templates.gen.ts");
  const texts: [string, string][] = [
    ["PAGE_CONTRACT", PAGE_CONTRACT], ["PAGE_API", PAGE_API], ["PAGE_INSTRUCTIONS", PAGE_INSTRUCTIONS], ["FILE_APP_INSTRUCTIONS", FILE_APP_INSTRUCTIONS],
    ["pageGuide", await pageGuide()], ["appsGuide", appsGuide()], ["appGuide", appGuide()],
    ...Object.entries(await scaffold("Water")).map(([p, t]): [string, string] => [`scaffold ${p}`, t]),
    ...Object.entries(STACK_FILES).map(([p, t]): [string, string] => [`stack ${p}`, t]),
    ...Object.entries(APP_EXAMPLES).flatMap(([n, ex]) => Object.entries(ex.files).map(([p, t]): [string, string] => [`example ${n}${p}`, t])),
    ...PAGE_TEMPLATES.map((t): [string, string] => [`template ${t.name}`, t.description + t.expects + t.html]),
  ];
  for (const set of [undefined, "files", "classic", "pages"]) {
    texts.push([`instructions ${set}`, instructions(set)]);
    for (const p of servedPrompts(set)) texts.push([`prompt ${p.name}`, p.text({ note: "N", idea: "I", data: "D", change: "C" })]);
    for (const t of servedTools(set)) texts.push([`tool ${t.name}`, t.description + JSON.stringify(t.inputSchema ?? {})]);
    for (const r of await servedResources(set)) texts.push([`resource ${r.uri}`, r.description + r.text]);
  }
  // The template apps' READMEs (their code keeps the old names, so they still run on 1.3).
  const web = new URL("../../../web/", import.meta.url);
  for (const e of Deno.readDirSync(new URL("content/templates/", web))) {
    if (!e.isDirectory || !e.name.endsWith(".app")) continue;
    const slug = e.name.replace(/\.app$/, "");
    const readme = Deno.readTextFileSync(new URL(`content/templates/${e.name}/README.md`, web));
    // Their own file is still src/lib/amber.ts, so the README names it.
    texts.push([`${slug} README.md`, readme.replaceAll(`"@/lib/amber"`, "")]);
    const served = JSON.parse(Deno.readTextFileSync(new URL(`public/templates/apps/${slug}.project.json`, web)));
    assertEquals(served.files["/README.md"], readme, `${slug}: the site serves the README as it is`);
  }
  const found = texts.map(([name, t]) => [name, t.match(OLD_NAMES)?.[0]]).filter(([, m]) => m);
  assertEquals(found, []);
  assert(texts.length > 50, `only ${texts.length} texts`);
});

Deno.test("a project importing pinto, pinto-ui and pinto-router links, and the amber names still do (2026-11-14)", () => {
  const app = (core: string, ui: string, router: string) => ({
    amberApp: 1 as const, compiled: {},
    files: {
      "/index.html": `<!doctype html><html lang="en"><div id="app"></div><script type="module" src="/src/main.jsx"></script></html>`,
      "/src/main.jsx": `import { render } from "preact";\nimport { useStore } from "${core}";\nimport { Button } from "${ui}";\nimport { Router, route } from "${router}";\nrender(<Router><Button onClick={() => route("/")}>Hi</Button></Router>, document.getElementById("app"));\n`,
    },
  });
  for (const names of [["pinto", "pinto-ui", "pinto-router"], ["amber", "amber-ui", "amber-router"]] as [string, string, string][]) {
    const p = app(...names);
    assertEquals(brokenImports(p), [], names.join());
    assertEquals(sourceProblems(p), [], names.join());
  }
  for (const name of ["pinto", "pinto-ui", "pinto-router", "amber", "amber-ui", "amber-router"]) assert(BARE_IMPORTS.includes(name), name);
  // An app made before the rename has src/lib/amber.ts: importing "@/lib/pinto" there says which file it has.
  const older = { amberApp: 1 as const, compiled: {}, files: { "/src/lib/amber.ts": `export * from "amber";`, "/src/App.tsx": `import { useStore } from "@/lib/pinto";\nexport default () => null;\n` } };
  assertStringIncludes(brokenImports(older).join(), `its file is "@/lib/amber"`);
});
