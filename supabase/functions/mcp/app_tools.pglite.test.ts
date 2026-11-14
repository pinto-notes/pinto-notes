// check_app and preview_app against a local render service (scripts/page-render/server.ts, headless
// WebKit), and the sample a note's app is rendered over.
//   cd supabase/functions/mcp && deno test -A app_tools.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import { sampleData, sampleNote } from "./app_sample.ts";
import { libraryReport } from "./libraries.ts";
import { pageWarnings } from "./page_lint.ts";
import { findTables } from "./notes.ts";
import { schemaDB } from "./pglite.ts";
import { type Account, account, app, note, toolContext } from "./sealed.ts";
import { Content, runTool } from "./tools.ts";

// These tests use the prototype tools (servedTools serves them only with AMBER_MCP_TOOLS=pages).
Deno.env.set("AMBER_MCP_TOOLS", "pages");

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runTool(name, args, await toolContext(pg, a)) as any;
const BODY = "Lisbon budget\n\nSpent in Lisbon with Ana.\n\n## Costs\n| Date | Item | Category | Amount |\n| --- | --- | --- | --- |\n| 2026-10-01 | Hotel Avenida | Stay | 1 450 |\n| 2026-10-02 | Pastéis | Food | 12,50 |\n| 2026-10-02 | Tram 28 | Transport | 3 |\n\n- [x] Book flights\n- [ ] Pay Ana back\n";

Deno.test("the sample keeps the note's shape and none of its words", () => {
  const s = sampleNote(BODY, "2026-10-05");
  for (const word of ["Lisbon", "Ana", "Avenida", "Pastéis", "Tram", "flights"]) assert(!s.includes(word), word);
  const [t] = findTables(s);
  assertEquals(t.columns.map((c) => c.name), ["Date", "Item", "Category", "Amount"]);
  assertEquals(t.rows.length, 3);
  assert(/^2026-10-\d\d$/.test(t.rows[0][0]) && /^\d[\d ]*$/.test(t.rows[0][3]) && /,\d\d$/.test(t.rows[1][3]));
  assertEquals(t.rows[1][2] === t.rows[2][2], false);
  assert(s.includes("- [x] Item") && s.includes("- [ ] Item"));
  const d = sampleData({ values: { goal: 12000, city: "Lisbon" }, collections: { trips: [{ id: "t1", created: "2026-10-01T00:00:00Z", who: "Ana", photo: { $file: "abc" } }] } }, "2026-10-05") as any;
  assertEquals([d.collections.trips[0].id, typeof d.values.goal], ["t1", "number"]);
  // Whole numbers stay whole and keep their sign (a Water app showed "3.11 / 8" glasses in see_app).
  const n = sampleData({ values: { counts: { "2026-11-08": 3 }, box: 1, refund: -40 } }, "2026-11-08") as any;
  assert(Number.isInteger(n.values.counts["2026-11-08"]) && Number.isInteger(n.values.box), JSON.stringify(n));
  assert(n.values.refund < 0 && Number.isInteger(n.values.refund), JSON.stringify(n));
  assert(!JSON.stringify(d).includes("Lisbon") && !JSON.stringify(d).includes("Ana") && !JSON.stringify(d).includes("abc"));
});

Deno.test("!important is called out because the base never needs it", () => {
  assertStringIncludes(pageWarnings(`<html lang="en"><style>input { border: 0 !important; }</style><p style="color: red !important">x</p>`).join(), "!important appears 2 times");
  assertEquals(pageWarnings(`<html lang="en"><style>input { border: 0; }</style>`).some((w) => w.includes("!important")), false);
  assertStringIncludes(pageWarnings(`<html lang="en"><meta name="amber-settings" content="{}"><script>amber.openSettings()</script>`).join(), "were removed");
});

Deno.test("libraries: pasted copies, unpinned or unhashed npm entries, unknown names and undeclared globals are flagged", () => {
  const pasted = `<script>/*! Chart.js v4.4.4 | https://www.chartjs.org */${"x".repeat(6000)}</script><script>amber.onChange(() => {})</script>`;
  assertStringIncludes(libraryReport(pasted).join(), "pasted copy of chart");
  assertStringIncludes(libraryReport(`<script>${"y".repeat(70000)}</script>`).join(), "looks like a pasted library");
  assertStringIncludes(libraryReport(`<meta name="amber-libs" content="npm:qrcode-generator@^1/qrcode.js#sha256-abc=">`).join(), "exact version and a hash");
  assertStringIncludes(libraryReport(`<meta name="amber-libs" content="npm:qrcode-generator@1.4.4/qrcode.js">`).join(), "exact version and a hash");
  assertEquals(libraryReport(`<meta name="amber-libs" content="chart, npm:qrcode-generator@1.4.4/qrcode.js#sha384-8FWZA6BGMXhsfO+BLtrJK0We6gg5o1JyO8xQm6peWDEUs17ACA5ziE/NIAkl9z2k"><script>new Chart(c, {})</script>`), []);
  assertEquals(libraryReport(`<script>const THREE = await amber.lib("three"); new THREE.Scene()</script>`), []);
  assertStringIncludes(libraryReport(`<meta name="amber-libs" content="leaflet">`).join(), "No bundled library");
  assertStringIncludes(libraryReport(`<script>new Chart(c, {})</script>`).join(), "doesn't declare it");
});

// The render service needs Playwright's WebKit. CI's server job doesn't install it (installing it
// would add a minute to every run), so there the test is reported as ignored, not failed; it runs
// wherever WebKit is installed (`npx playwright install webkit`).
const hasWebKit = [
  Deno.env.get("PLAYWRIGHT_BROWSERS_PATH"),
  `${Deno.env.get("HOME")}/.cache/ms-playwright`,
  `${Deno.env.get("HOME")}/Library/Caches/ms-playwright`,
].some((dir) => {
  if (!dir) return false;
  try {
    for (const entry of Deno.readDirSync(dir)) if (entry.name.startsWith("webkit-")) return true;
  } catch { /* no such folder */ }
  return false;
});

Deno.test({ name: "check_app and preview_app render a sample through the render service", ignore: !hasWebKit }, async () => {
  Deno.env.set("RENDER_SECRET", "test-secret");
  const { handle } = await import("../../../scripts/page-render/server.ts");
  const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handle);
  Deno.env.set("RENDER_URL", `http://127.0.0.1:${server.addr.port}`);
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const id = await note(pg, a, BODY);
    const bad = `<!doctype html><html><body style="background:#fff"><main id="m" style="width:900px"></main><input placeholder="amount"><script>amber.onChange((n) => { m.innerHTML = n.tables[0].rows.map((r) => "<p style='font-size:9px'>" + r[1] + "</p>").join(""); setTimeout(() => nope.x); })</script></body></html>`;
    await tool(pg, a, "set_note_page", { id, html: bad });
    const r = await tool(pg, a, "check_app", { id });
    const all = [...r.errors, ...r.notes].join("\n");
    assertEquals(r.ok, false);
    // Breakage is an error; the rest is information.
    for (const want of ["script error", "wider than the screen", "ran as HTML"]) assertStringIncludes(r.errors.join("\n"), want);
    for (const want of ["under 12 px", "without a label", "--amber-*"]) assertStringIncludes(r.notes.join("\n"), want);
    // The render service got a sample, not the note.
    assert(!all.includes("Hotel Avenida") && !all.includes("Pastéis"));

    const good = `<!doctype html><html lang="en"><body><main id="m" style="max-width:var(--amber-content-max);margin:0 auto;padding:16px var(--amber-gutter)"></main><script>const esc=(s)=>String(s).replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);amber.onChange((n) => { const t = n.tables[0]; m.innerHTML = "<h1>" + esc(n.title) + "</h1>" + (t ? t.rows.map((r) => "<p style='background:var(--amber-surface);color:var(--amber-text)'>" + esc(r[1]) + "</p>").join("") : "<p>No rows yet.</p>"); })</script></body></html>`;
    await tool(pg, a, "set_note_page", { id, html: good });
    assertEquals((await tool(pg, a, "check_app", { id })).errors, []);
    const p = await tool(pg, a, "preview_app", { id, widths: [390], themes: ["light", "dark"] });
    assert(p instanceof Content);
    const images = p.content.filter((b: Record<string, unknown>) => b.type === "image");
    assertEquals(images.length, 2);
    assert(atob(images[0].data as string).startsWith("\x89PNG"));
    assertStringIncludes(p.content[0].text as string, "Sample note");
    // Real data is refused outright unless this server is set up to allow it, whatever the person's setting says.
    await app(pg, a.id, `insert into public.profiles (user_id, app_previews_real) values ($1, true) on conflict (user_id) do update set app_previews_real = true`, [a.id]);
    assertStringIncludes(await tool(pg, a, "preview_app", { id, data: "real" }).catch((e) => String(e)), "Real data isn't available for previews");
    assertStringIncludes(await tool(pg, a, "try_app", { id, data: "real", steps: [{ tap: "x" }] }).catch((e) => String(e)), "Real data isn't available for previews");
    await app(pg, a.id, `update public.profiles set app_previews_real = false where user_id = $1`, [a.id]);
    // A server set up to allow it: still only for a person who turned their own setting on.
    Deno.env.set("AMBER_APP_REAL_PREVIEWS", "on");
    assertStringIncludes(await tool(pg, a, "preview_app", { id, data: "real" }).catch((e) => String(e)), "Previews with real data are off");
    await app(pg, a.id, `insert into public.profiles (user_id, app_previews_real) values ($1, true) on conflict (user_id) do update set app_previews_real = true`, [a.id]);
    const real = await tool(pg, a, "preview_app", { id, widths: [390], themes: ["light"], data: "real" });
    assertStringIncludes(real.content[0].text as string, "Hotel Avenida");
  } finally {
    await server.shutdown();
    Deno.env.delete("RENDER_URL");
    Deno.env.delete("AMBER_APP_REAL_PREVIEWS");
    await closeBrowser();
  }
});

// An app that reaches the internet as it opens (2026-11-14): the render service runs on a server, so
// it refuses those requests without counting them against the app, and nothing leaves it.
Deno.test({ name: "an app that fetches and opens a WebSocket passes check_app, and the render service sends nothing out", ignore: !hasWebKit }, async () => {
  Deno.env.set("RENDER_SECRET", "test-secret");
  const { handle } = await import("../../../scripts/page-render/server.ts");
  const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
  const server = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handle);
  Deno.env.set("RENDER_URL", `http://127.0.0.1:${server.addr.port}`);
  // Where the app's requests would go: a listener that counts connections.
  const outside = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  let reached = 0;
  (async () => { for await (const c of outside) { reached++; c.close(); } })().catch(() => {});
  const port = (outside.addr as Deno.NetAddr).port;
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    const id = await note(pg, a, BODY);
    const online = `<!doctype html><html lang="en"><body><main id="m" style="max-width:var(--amber-content-max);margin:0 auto;padding:16px var(--amber-gutter)"><h1>Weather</h1><p id="t">Loading the forecast…</p></main>` +
      `<img alt="" src="https://127.0.0.1:${port}/icon.png" width="1" height="1"><script>amber.onChange(() => {});` +
      `fetch("https://127.0.0.1:${port}/forecast").then((r) => r.json()).then((d) => { t.textContent = d.summary; }, () => { t.textContent = "Offline right now."; });` +
      `try { const w = new WebSocket("wss://127.0.0.1:${port}/live"); w.onerror = () => {}; } catch (e) {}</script></body></html>`;
    await tool(pg, a, "set_note_page", { id, html: online });
    const r = await tool(pg, a, "check_app", { id });
    assertEquals(r.errors, []);
    assertEquals(reached, 0, "the render service reached the internet");
  } finally {
    outside.close();
    await server.shutdown();
    Deno.env.delete("RENDER_URL");
    await closeBrowser();
  }
});
