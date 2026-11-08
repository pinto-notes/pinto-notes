// The Mac template library's pictures of each template app (Pane/Resources/Templates/
// template-app-<slug>-stage[-small]-<look>.jpg): the app on its starting data, drawn at exactly
// the size its live view has on the library's stage, so the picture and the live app that replaces
// it once it has drawn are the same size, layout and content, and the swap doesn't jump.
// (Council round 3: the site's pictures are the app at 1280 px over older sample data, shrunk to a
// third; the live app drew at 400 px, full size, in its narrow layout, on its empty starting data.)
//   deno run -A scripts/template-stage-pictures.ts [<slug>…]
// Run it after a template app changes (scripts/template-catalog.py copies its project and data).
// PaneTests/SetupCardsTests (theAppPictureIsTheLiveViewsSize) fails while the sizes are out of step.
import "../supabase/functions/mcp/tools.ts";
import { render as renderService } from "../supabase/functions/mcp/app_check.ts";

/** The live view's size in CSS pixels on each stage: TemplateAppPreview.css(for:small:) in the app. */
const SIZES = [{ name: "stage", width: 400, height: 304 }, { name: "stage-small", width: 400, height: 340 }];

const ROOT = new URL("../", import.meta.url);
const OUT = new URL("Pane/Resources/Templates/", ROOT);
const catalog = JSON.parse(await Deno.readTextFile(new URL("catalog.json", OUT))) as { slug: string; app: boolean; note?: string }[];
const wanted = Deno.args.filter((a) => !a.startsWith("--"));
const apps = catalog.filter((t) => t.app && (!wanted.length || wanted.includes(t.slug)));

Deno.env.set("RENDER_SECRET", Deno.env.get("RENDER_SECRET") ?? crypto.randomUUID());
const { handle } = await import("./page-render/server.ts");
const service = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handle);
Deno.env.set("RENDER_URL", `http://127.0.0.1:${service.addr.port}`);

let failed = 0;
for (const t of apps) {
  const html = await Deno.readTextFile(new URL(`template-app-${t.slug}.project.json`, OUT));
  const data = JSON.parse(await Deno.readTextFile(new URL(`template-app-${t.slug}.data.json`, OUT)));
  for (const size of SIZES) {
    for (const scheme of ["light", "dark"] as const) {
      const r = await renderService({ html, markdown: t.note ?? "", data, today: new Date().toISOString().slice(0, 10), interact: false, probes: false,
        views: [{ width: size.width, height: size.height, scheme }], capture: true });
      const png = typeof r === "string" ? null : r.views[0]?.png;
      if (!png) { console.error(`✗ ${t.slug} ${size.name} ${scheme}: ${typeof r === "string" ? r : "no picture"}`); failed++; continue; }
      const tmp = await Deno.makeTempFile({ suffix: ".png" });
      await Deno.writeFile(tmp, Uint8Array.from(atob(png), (c) => c.charCodeAt(0)));
      const out = new URL(`template-app-${t.slug}-${size.name}-${scheme}.jpg`, OUT).pathname;
      const jpg = new Deno.Command("sips", { args: ["-s", "format", "jpeg", "-s", "formatOptions", "82", tmp, "--out", out], stdout: "null" }).outputSync();
      await Deno.remove(tmp);
      if (!jpg.success) { console.error(`✗ ${t.slug} ${size.name} ${scheme}: sips failed`); failed++; continue; }
      console.log(`✓ ${t.slug} ${size.name} ${scheme}`);
    }
  }
}
await service.shutdown();
await (await import("./page-render/render.ts")).closeBrowser();
if (failed) Deno.exit(1);
