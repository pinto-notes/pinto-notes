// What set_note_page accepts as a page (page.ts).
//   cd supabase/functions/mcp && deno test -A page.test.ts
import { assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { MAX_PAGE_BYTES, pageProblems } from "./page.ts";

const page = (inner: string) => `<!doctype html><html><head><style>body{margin:0}</style></head><body>${inner}<script>render(amber.note)</script></body></html>`;

Deno.test("a self-contained page that reads amber.note passes", () => {
  assertEquals(pageProblems(page(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg><img src="data:image/png;base64,AAAA">`)), []);
});

Deno.test("a page reaches the internet like a web page: addresses, fetch, WebSocket and stylesheets pass (2026-11-14)", () => {
  assertEquals(pageProblems(page(`<img src="https://example.com/x.png"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><style>@import url("https://example.com/a.css");</style>`)), []);
  assertEquals(pageProblems(page(`<script>fetch("https://api.open-meteo.com/v1/forecast"); new WebSocket("wss://e.example"); new XMLHttpRequest()</script>`)), []);
  // An address without a scheme resolves inside the app: said, with what to write instead.
  assertStringIncludes(pageProblems(page(`<script src="//cdn.example/x.js"></script>`)).join(), "write https://");
  assertStringIncludes(pageProblems(page(`<div style="background:url(//e.example/a.png)"></div>`)).join(), "Protocol-relative");
});

Deno.test("tags that frame other documents are refused", () => {
  assertStringIncludes(pageProblems(page(`<iframe></iframe>`)).join(), "<iframe>");
  assertStringIncludes(pageProblems(page(`<base href="/">`)).join(), "<base>");
  assertStringIncludes(pageProblems(`<meta http-equiv="refresh" content="0;url=x"><div></div><script>amber.note</script>`).join(), "meta refresh");
});

Deno.test("an app must keep its data in its store, and stay under the size cap", () => {
  assertStringIncludes(pageProblems(`<div>Mon ✓ Tue ✓</div>`).join(), "keep its data in its store");
  assertEquals(pageProblems(page(`<script>localStorage.setItem("a", "1")</script>`)).some((p) => p.includes("its store")), false);
  assertStringIncludes(pageProblems(page("x".repeat(MAX_PAGE_BYTES))).join(), "the limit is 256 KB");
  assertStringIncludes(pageProblems("just text, amber.note").join(), "doesn't look like an HTML page");
});

import { MAX_PAGE_DATA_BYTES, pageDataProblems, pageDataView } from "./page.ts";

Deno.test("page data is an object of values and collections of records with unique ids, under 4 MB", () => {
  assertEquals(pageDataProblems({ values: { a: [1, { b: null }] }, collections: { runs: [{ id: "1", km: 5 }, { id: "2" }] } }), []);
  assertStringIncludes(pageDataProblems([]).join(), "one JSON object");
  assertStringIncludes(pageDataProblems({ rows: [] }).join(), "Unknown top-level key \"rows\"");
  assertStringIncludes(pageDataProblems({ collections: { runs: [{ km: 5 }] } }).join(), "needs a string \"id\"");
  assertStringIncludes(pageDataProblems({ collections: { runs: [{ id: "1" }, { id: "1" }] } }).join(), "two records with id \"1\"");
  assertStringIncludes(pageDataProblems({ values: { big: "x".repeat(MAX_PAGE_DATA_BYTES) } }).join(), "the limit is 4 MB");
  assertEquals(pageDataView(null).data, { values: {}, collections: {} });
  const big = JSON.stringify({ values: { a: "x".repeat(70_000) }, collections: { runs: [{ id: "1" }] } });
  assertEquals(pageDataView(big).data_outline, { values: ["a"], collections: { runs: 1 } });
});

import { BUNDLED_LIBS, libProblems } from "./page.ts";

Deno.test("libraries: bundled names and hashed npm packages pass; anything else is refused", () => {
  const meta = (c: string) => `<meta name="amber-libs" content="${c}">` + page(`<script src="amber-lib:///chart"></script>`);
  assertEquals(pageProblems(meta("chart, d3, npm:lodash@4.17.21/lodash.min.js#sha384-AAAA")), []);
  assertStringIncludes(libProblems(meta("chartjs")).join(), "No bundled library \"chartjs\"");
  assertStringIncludes(libProblems(meta("npm:lodash@^4.17.21")).join(), "needs a pinned version and a hash");
  assertStringIncludes(libProblems(meta("npm:lodash@4.17.21")).join(), "needs a pinned version and a hash");
  assertStringIncludes(libProblems(meta("npm:lodash@latest#sha384-AAAA")).join(), "needs a pinned version");
});

Deno.test("the bundled list here matches what the app ships", () => {
  const manifest = JSON.parse(Deno.readTextFileSync(new URL("../../../Pane/Resources/AppLibraries/libraries.json", import.meta.url)));
  assertEquals(Object.fromEntries(manifest.libraries.map((l: { name: string; global: string }) => [l.name, l.global])), BUNDLED_LIBS);
});

import { AMBER_BASE_CSS, AMBER_TOKENS } from "./amber-base.ts";

Deno.test("the AI's copy of amber-base.css is the file the app ships", () => {
  assertEquals(AMBER_BASE_CSS, Deno.readTextFileSync(new URL("../../../Pane/Resources/AppLibraries/amber-base.css", import.meta.url)));
  assertEquals(AMBER_BASE_CSS.includes("!important"), false);
  for (const t of ["--amber-field", "--amber-root-font", "--amber-accent"]) assertEquals(AMBER_TOKENS.includes(t), true);
});

import { AMBER_UI } from "./amber-ui.ts";

Deno.test("the AI's copy of amber-ui is the kit the app ships", () => {
  const shipped = JSON.parse(Deno.readTextFileSync(new URL("../../../Pane/Resources/AppLibraries/amber-ui.json", import.meta.url)));
  assertEquals(AMBER_UI.src, shipped.src);
  assertEquals(AMBER_UI.css, shipped.css);
  for (const c of ["Button", "Sheet", "TabBar", "ListRow", "Toggle", "Slider", "Toast", "EmptyState", "Dialog", "Tabs", "Stat", "Input", "Select", "TextArea", "Card"]) {
    assertEquals(Object.values(AMBER_UI.src).some((s) => s.includes(`export function ${c}`)), true, c);
  }
});

import { SHADCN_UI } from "./shadcn-ui.ts";

Deno.test("the scaffold's shadcn set is the one the demo runs", () => {
  for (const [path, text] of Object.entries(SHADCN_UI)) {
    assertEquals(text, Deno.readTextFileSync(new URL("../../../demo/note-pages/training-react" + path, import.meta.url)), path);
  }
  assertEquals(Object.keys(SHADCN_UI).filter((p) => p.startsWith("/src/components/ui/")).length, 20);
});
