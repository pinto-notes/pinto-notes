// An app that loads from the internet (a script from a CDN, a module by its https address, a
// fetch) passes its save check: the render service makes the page's GETs for it, through the
// fetcher for outside links (public_fetch.ts), so a private address stays out of reach. The
// internet is a local https server (test_https.ts) and WebKit runs headless.
//   cd supabase/functions/mcp && deno test -A app_outside.pglite.test.ts
import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import type { PGlite } from "npm:@electric-sql/pglite@0.2.17";
import "./tools.ts";
import { schemaDB } from "./pglite.ts";
import { type Account, account, toolContext } from "./sealed.ts";
import { runFileTool } from "./files_tools.ts";
import { testWeb } from "./test_https.ts";

// deno-lint-ignore no-explicit-any
const tool = async (pg: PGlite, a: Account, name: string, args: Record<string, unknown> = {}) => await runFileTool(name, args, await toolContext(pg, a)) as any;

const LIB = `window.cdnLib = { hello: () => "Hello from the CDN" };`;
const MODULE = `export const greeting = "Hello from a module";`;

Deno.test("an app's script from a CDN and an https module load in its save check; a private address doesn't", async () => {
  Deno.env.set("RENDER_SECRET", "test-secret");
  const { handle } = await import("../../../scripts/page-render/server.ts");
  const { closeBrowser } = await import("../../../scripts/page-render/render.ts");
  const render = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handle);
  Deno.env.set("RENDER_URL", `http://127.0.0.1:${render.addr.port}`);
  const cors = { "access-control-allow-origin": "*" };
  const web = await testWeb({ "cdn.example.com": ["93.184.216.34"], "inside.example.com": ["10.0.0.7"], "meta.example.com": ["169.254.169.254"] }, (req) => {
    const p = new URL(req.url).pathname;
    if (p === "/lib.js") return new Response(LIB, { headers: { "content-type": "text/javascript", ...cors } });
    if (p === "/greeting.mjs") return new Response(MODULE, { headers: { "content-type": "text/javascript", ...cors } });
    if (p === "/to-inside.js") return new Response(null, { status: 302, headers: { location: "https://inside.example.com/secret.js" } });
    return new Response("secret", { headers: cors });
  });
  try {
    const pg = await schemaDB();
    const a = await account(pg);
    await tool(pg, a, "create", { type: "app", path: "Notes/Lab.md" });
    await tool(pg, a, "fetch", { id: "Notes/Lab.app/index.html" });
    await tool(pg, a, "fetch", { id: "Notes/Lab.app/src/App.tsx" });

    // Without the script the page throws (window.cdnLib is undefined), which fails the check.
    const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Lab</title></head>
  <body>
    <p id="cdn">Waiting for the library</p>
    <div id="root"></div>
    <script src="https://cdn.example.com/lib.js"></script>
    <script>document.getElementById("cdn").textContent = window.cdnLib.hello();</script>
    <script>
      // Aimed inside: refused by the service, and the app carries on, as with a network that's down.
      for (const u of ["https://inside.example.com/secret", "https://meta.example.com/latest/meta-data/", "https://cdn.example.com/to-inside.js"]) fetch(u).catch(() => {});
    </script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
    const page = await tool(pg, a, "write", { path: "Notes/Lab.app/index.html", content: html });
    assertStringIncludes(page.live, "Live", JSON.stringify(page));
    assertEquals(page.errors, undefined, JSON.stringify(page.errors));

    // A module by its https address, imported from the app's own code.
    const app = await tool(pg, a, "edit", { path: "Notes/Lab.app/src/App.tsx", old_string: "export default function App", new_string: `import { greeting } from "https://cdn.example.com/greeting.mjs"\nif (greeting !== "Hello from a module") throw new Error("no module")\n\nexport default function App` });
    assertStringIncludes(app.live, "Live", JSON.stringify(app));
    assertEquals(app.errors, undefined, JSON.stringify(app.errors));

    const asked = web.asked.map((x) => new URL(x.url).pathname);
    assert(asked.includes("/lib.js") && asked.includes("/greeting.mjs"), asked.join(" "));
    // The private addresses were never reached: not asked, not even dialled.
    assert(!asked.some((p) => /secret|meta-data/.test(p)), asked.join(" "));
    assertEquals(new Set(web.dialled), new Set(["93.184.216.34"]));
    // No cookies or the page's own headers went along.
    for (const { headers } of web.asked) assertEquals([headers.get("cookie"), headers.get("referer"), headers.get("origin")], [null, null, null]);
  } finally {
    await closeBrowser();
    await render.shutdown();
    await web.close();
    Deno.env.delete("RENDER_URL");
  }
});
