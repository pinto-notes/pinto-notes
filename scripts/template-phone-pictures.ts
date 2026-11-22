// The iPhone pictures on the site's template cards (web/app/templates/AppSwap.tsx: an app template's
// card turns from its note into its app on iPhone): web/public/templates/apps/phone/<slug>-light.webp
// and -dark.webp, 600 by 662. Each app is drawn by the render service's own code
// (scripts/page-render/render.ts) on its first screen, over its sample
// (Pane/Resources/Templates/template-app-<slug>.sample.json, its dates moved to the day), 320 pt
// wide at 2x on a full-height phone (844 pt, so its tabs are far below the crop), then its top
// 640 by 706 px is scaled to 600 by 662. Every app's card the same way, so the type is one size
// across the cards (22 November 2026: five of the ten were drawn 375 pt wide and scaled to 80%).
// No network, nothing on screen.
//   deno run -A scripts/template-phone-pictures.ts [<slug>…] [--day yyyy-mm-dd] [--out <dir>]
// Run it after an app or its sample changes (docs/Technical/templates.md).
import { closeBrowser, renderPage } from "./page-render/render.ts";
import { localToday, sampleFor } from "./template-sample.ts";

const ROOT = new URL("../web/", import.meta.url);
const CONTENT = new URL("content/templates/", ROOT);
const flag = (name: string) => { const i = Deno.args.indexOf(name); return i >= 0 ? Deno.args[i + 1] : null; };
const DAY = flag("--day") ?? localToday();
const OUT = flag("--out") ? new URL(`file://${flag("--out")!.replace(/\/?$/, "/")}`) : new URL("public/templates/apps/phone/", ROOT);
const wanted = Deno.args.filter((a, i) => !a.startsWith("--") && !["--day", "--out"].includes(Deno.args[i - 1]));

/** The phone the app is drawn on, and the part of it the card shows. */
const PHONE = { width: 320, height: 844, scale: 2 };
const CROP = { width: 640, height: 706 };
const CARD = { width: 600, height: 662 };

const slugs = wanted.length ? wanted : [...Deno.readDirSync(CONTENT)].filter((e) => e.isDirectory && e.name.endsWith(".app")).map((e) => e.name.replace(/\.app$/, "")).sort();
await Deno.mkdir(OUT, { recursive: true });
let failed = 0;
for (const slug of slugs) {
  const stored = await Deno.readTextFile(new URL(`public/templates/apps/${slug}.project.json`, ROOT));
  const t = JSON.parse(await Deno.readTextFile(new URL(`${slug}.json`, CONTENT)));
  const sample = await sampleFor(slug, DAY);
  if (!sample) { console.error(`✗ ${slug}: no sample (scripts/template-samples.py)`); failed++; continue; }
  for (const scheme of ["light", "dark"] as const) {
    const r = await renderPage(stored, t.note ?? "", sample, {
      today: DAY, probes: false, capture: true, views: [{ ...PHONE, scheme }], steps: [{ wait: 600 }],
    });
    const last = r.trial?.[r.trial.length - 1];
    if (!last?.png) { console.error(`✗ ${slug} ${scheme}: no picture`); failed++; continue; }
    const tmp = await Deno.makeTempFile({ suffix: ".png" });
    await Deno.writeFile(tmp, Uint8Array.from(atob(last.png), (c) => c.charCodeAt(0)));
    const out = new URL(`${slug}-${scheme}.webp`, OUT).pathname;
    const cmd = new Deno.Command("cwebp", { args: ["-quiet", "-q", "82", "-crop", "0", "0", String(CROP.width), String(CROP.height),
      "-resize", String(CARD.width), String(CARD.height), tmp, "-o", out] });
    const ok = (await cmd.output()).success;
    await Deno.remove(tmp);
    if (!ok) { console.error(`✗ ${slug} ${scheme}: cwebp failed`); failed++; continue; }
    console.log(`✓ ${slug} ${scheme}${last.errors.length ? `  (page errors: ${last.errors.join("; ")})` : ""}`);
  }
}
await closeBrowser();
if (failed) Deno.exit(1);
