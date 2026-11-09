// The Mac template library's pictures of each template app (Pane/Resources/Templates/
// template-app-<slug>-stage[-small]-<look>.jpg): the app in use, on its sample data
// (scripts/template-samples.py, its dates moved to today as the app moves them), drawn at exactly
// the size its live view has on the library's stage, so the picture and the live app that replaces
// it once it has drawn are the same size, layout and content, and the swap doesn't jump.
// (Council round 3: the site's pictures were the app at 1280 px over older sample data, shrunk to a
// third. Round 4: an empty app at full size read as a phone app, bigger than the sheet's title.)
//   deno run -A scripts/template-stage-pictures.ts [<slug>…]
// Run it after a template app or its sample changes (scripts/template-catalog.py copies the project
// and starting data; scripts/template-samples.py writes the samples).
// PaneTests/SetupCardsTests (theAppPictureIsTheLiveViewsSize) fails while the sizes are out of step.
import "../supabase/functions/mcp/tools.ts";
import { render as renderService } from "../supabase/functions/mcp/app_check.ts";

/** The live view's size in CSS pixels on each stage: TemplateAppPreview.css(for:small:) in the app.
 * The big stage's 400 x 320 pt window at 75%; the small stage's 328 pt wide window at 70%, laid out
 * taller than the 156 pt it shows and running off its foot. */
const SIZES = [{ name: "stage", width: 533, height: 426 }, { name: "stage-small", width: 469, height: 480 }];

/** The sample's dates are written for this day and moved to today: TemplateFiles.sample in the app. */
const ANCHOR = "2026-11-08";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
function moved(value: unknown, days: number): unknown {
  const shift = (s: string) => {
    const t = new Date(s + "T12:00:00Z");
    t.setUTCDate(t.getUTCDate() + days);
    return t.toISOString().slice(0, 10);
  };
  if (typeof value === "string") return DATE.test(value) ? shift(value) : value;
  if (Array.isArray(value)) return value.map((v) => moved(v, days));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [DATE.test(k) ? shift(k) : k, moved(v, days)]));
  }
  return value;
}
const local = new Date();
const today = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}-${String(local.getDate()).padStart(2, "0")}`;
const since = Math.round((Date.parse(today) - Date.parse(ANCHOR)) / 86_400_000);

const ROOT = new URL("../", import.meta.url);
const OUT = new URL("Pane/Resources/Templates/", ROOT);
// STAGE_OUT=<dir> draws them somewhere else, to look at a size before it ships.
const DEST = Deno.env.get("STAGE_OUT") ? new URL(`file://${Deno.env.get("STAGE_OUT")!.replace(/\/?$/, "/")}`) : OUT;
const catalog = JSON.parse(await Deno.readTextFile(new URL("catalog.json", OUT))) as { slug: string; app: boolean; note?: string }[];
const wanted = Deno.args.filter((a) => !a.startsWith("--"));
const apps = catalog.filter((t) => t.app && (!wanted.length || wanted.includes(t.slug)));

Deno.env.set("RENDER_SECRET", Deno.env.get("RENDER_SECRET") ?? crypto.randomUUID());
const { handle } = await import("./page-render/server.ts");
const service = Deno.serve({ hostname: "127.0.0.1", port: 0, onListen: () => {} }, handle);
Deno.env.set("RENDER_URL", `http://127.0.0.1:${service.addr.port}`);

/** The project as the stage runs it: template-stage.css in its page's head (TemplateAppPreview.staged). */
const STAGE_CSS = await Deno.readTextFile(new URL("template-stage.css", OUT));
/** template-stage.js: only whole blocks above the stage's foot, as the stage runs it. */
const STAGE_JS = await Deno.readTextFile(new URL("template-stage.js", OUT));
function staged(stored: string): string {
  const p = JSON.parse(stored) as { files: Record<string, string> };
  const page = p.files["/index.html"];
  if (page?.includes("</head>")) p.files["/index.html"] = page.replace("</head>", () => `<style>${STAGE_CSS}</style><script>${STAGE_JS}</script></head>`);
  return JSON.stringify(p);
}

let failed = 0;
for (const t of apps) {
  const html = staged(await Deno.readTextFile(new URL(`template-app-${t.slug}.project.json`, OUT)));
  const data = moved(JSON.parse(await Deno.readTextFile(new URL(`template-app-${t.slug}.sample.json`, OUT))), since);
  for (const size of SIZES) {
    for (const scheme of ["light", "dark"] as const) {
      const r = await renderService({ html, markdown: t.note ?? "", data, today, interact: false, probes: false,
        views: [{ width: size.width, height: size.height, scheme }], capture: true });
      const png = typeof r === "string" ? null : r.views[0]?.png;
      if (!png) { console.error(`✗ ${t.slug} ${size.name} ${scheme}: ${typeof r === "string" ? r : "no picture"}`); failed++; continue; }
      const tmp = await Deno.makeTempFile({ suffix: ".png" });
      await Deno.writeFile(tmp, Uint8Array.from(atob(png), (c) => c.charCodeAt(0)));
      const out = new URL(`template-app-${t.slug}-${size.name}-${scheme}.jpg`, DEST).pathname;
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
