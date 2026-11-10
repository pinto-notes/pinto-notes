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
import { ANCHOR, localToday, moved } from "./template-sample.ts";

/** The live view's size in CSS pixels on the template page's stage: TemplateAppPreview.css in the
 * app. The stage's 624 x 464 pt at 75%, where the apps lay out in two columns. */
const SIZES = Deno.env.get("STAGE_SIZES")
  // STAGE_SIZES="try-a:640:480,try-b:720:540" draws other sizes, to look at one before it ships.
  ? Deno.env.get("STAGE_SIZES")!.split(",").map((s) => { const [name, w, h] = s.split(":"); return { name, width: Number(w), height: Number(h) }; })
  // "stage-narrow": a narrow sheet's stage (a small window), the app in its one column.
  : [{ name: "stage", width: 832, height: 619 }, { name: "stage-narrow", width: 533, height: 640 }];

// The sample's dates are written for ANCHOR and moved to today: TemplateFiles.sample in the app,
// and scripts/template-sample.ts here. The stage's day is today, as the live app shows it
// (9 November 2026: it used to be the latest Thursday, and the app said "Thursday 5 November,
// Today" on a Monday).
const today = localToday();
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
        // At 2x, as the Mac's screen draws the live app.
        views: [{ width: size.width, height: size.height, scheme, scale: 2 }], capture: true });
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
