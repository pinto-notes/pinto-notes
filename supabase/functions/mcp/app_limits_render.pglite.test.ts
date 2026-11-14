// The save check with big files, in a real browser (the render service, scripts/page-render, in
// WebKit, offscreen): a 12 MB file the app fetches reaches the page exactly, its parts go to the
// render service once and not again on the next save, and several files written together are one
// check. Needs Playwright's WebKit, like app_outside.pglite.test.ts.
//   cd supabase/functions/mcp && deno test -A app_limits_render.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import "./tools.ts";
import { schemaDB } from "./pglite.ts";
import { type Account, account, toolContext } from "./sealed.ts";
import { runFileTool } from "./files_tools.ts";
import { toBase64 } from "../_shared/e2ee.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;
const MB = 1024 * 1024;

Deno.test("a 12 MB file the app fetches reaches the save check exactly, sent to the render service once; several files are one check", async () => {
  Deno.env.set("RENDER_SECRET", "test-secret");
  const { handle } = await import("../../../scripts/page-render/server.ts");
  const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
  const seen = { checks: 0, renders: 0, parts: 0, partBytes: 0 };
  const render = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, async (req) => {
    const path = new URL(req.url).pathname;
    if (req.method === "PUT") { seen.parts++; seen.partBytes += Number(req.headers.get("content-length") ?? 0); }
    const views = path === "/render" && Array.isArray((await req.clone().json()).views);
    const res = await handle(req);
    // A render the service answered (409 asks for parts first, and the same render comes again).
    if (path === "/render" && res.status === 200) { seen.renders++; if (views) seen.checks++; }
    return res;
  });
  Deno.env.set("RENDER_URL", `http://127.0.0.1:${render.addr.port}`);
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    await tool(pg, a, "create", { type: "app", path: "Notes/Lab.md" });
    // 12 MB that doesn't compress, with a checksum the page works out again.
    const disk = new Uint8Array(12 * MB + 99);
    for (let i = 0; i < disk.length; i += 65536) crypto.getRandomValues(disk.subarray(i, Math.min(disk.length, i + 65536)));
    disk[0] = 0;
    let sum = 0;
    for (let i = 0; i < disk.length; i++) sum = (sum + disk[i] * ((i % 251) + 1)) % 1000000007;
    const html = `<!doctype html><html lang="en"><title>Lab</title><body><h1>Lab</h1><p id="out">loading</p><script type="module">
const b = new Uint8Array(await (await fetch("/disk.img")).arrayBuffer());
let s = 0; for (let i = 0; i < b.length; i++) s = (s + b[i] * ((i % 251) + 1)) % 1000000007;
if (b.length !== ${disk.length} || s !== ${sum}) throw new Error("disk.img arrived as " + b.length + " bytes, sum " + s);
document.getElementById("out").textContent = "disk.img: " + b.length + " bytes, exact";
</script></body></html>`;
    // The scaffold goes, the page and its file come: one save.
    const listed = (await tool(pg, a, "list", { path: "Notes/Lab.app", limit: 1000 }));
    const scaffold = (listed.structuredContent?.files ?? listed.files).map((f: { path: string }) => f.path).filter((p: string) => !p.endsWith("/data.json") && !p.endsWith("/index.html"));
    await tool(pg, a, "fetch", { id: "Notes/Lab.app/index.html" });
    // The file in pieces first, the last piece with the rest.
    const cut = 8 * MB;
    assertEquals((await tool(pg, a, "write", { path: "Notes/Lab.app/disk.img", content_base64: toBase64(disk.subarray(0, cut)), offset: 0, size: disk.length })).saved, false);
    const before = { ...seen };
    const r = await tool(pg, a, "write", {
      path: "Notes/Lab.app", files: [
        { path: "index.html", content: html },
        { path: "disk.img", content_base64: toBase64(disk.subarray(cut)), offset: cut, size: disk.length },
        ...scaffold.map((p: string) => ({ path: p.slice("Notes/Lab.app/".length), delete: true })),
      ],
    });
    assertStringIncludes(r.live, "Live", JSON.stringify(r));
    assertEquals(r.errors, undefined, JSON.stringify(r.errors));
    assertEquals(seen.checks - before.checks, 1, "one check for the whole save");
    // Its parts went to the render service once: 4 parts for 12 MB.
    assertEquals(seen.parts - before.parts, 4);
    assert(seen.partBytes - before.partBytes >= disk.length, `${seen.partBytes - before.partBytes} bytes of parts sent`);
    // The next save of the app sends no part again.
    await tool(pg, a, "fetch", { id: "Notes/Lab.app/index.html" });
    const again = await tool(pg, a, "write", { path: "Notes/Lab.app/index.html", content: html.replace("<h1>Lab</h1>", "<h1>Lab</h1><p>again</p>") });
    assertStringIncludes(again.live, "Live");
    assertEquals(seen.parts - before.parts, 4);
    console.log(`renders: ${seen.renders}, checks: ${seen.checks}, parts sent: ${seen.parts} (${(seen.partBytes / MB).toFixed(1)} MB)`);
  } finally {
    await render.shutdown();
    await closeBrowser();
    Deno.env.delete("RENDER_URL");
  }
});
