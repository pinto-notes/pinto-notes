// The template pages' pictures of the templates that are apps (web/app/templates/[slug],
// layout D): each app drawn by the render service's own code (scripts/page-render/render.ts, the
// app's CSP, theme and bridge) over its sample data (Pane/Resources/Templates/template-app-<slug>.sample.json),
// with its dates moved to DAY, at a Mac window's size and a phone's, after the taps a person would
// make. Writes web/public/templates/page/<slug>/<name>.webp. No network, nothing on screen.
//   deno run -A scripts/template-page-shots.ts [<slug>…] [--raw <dir>]
// --raw also keeps the PNGs in <dir>. The habit tracker's pictures came from the prototype's runs
// (a real chat that added its year view), so it isn't listed here.
import { closeBrowser, renderPage, type Step } from "./page-render/render.ts";
import { atDay, sampleFor } from "./template-sample.ts";

/** The day the pictures show: the sample's dates are moved to it. */
const DAY = "2026-11-22";
const MAC = { width: 1000, height: 625, scale: 2 };
const PHONE = { width: 390, height: 844, scale: 2 };

type Shot = { name: string; size: typeof MAC; steps?: Step[]; data?: (d: Sample) => Sample };
// deno-lint-ignore no-explicit-any
type Sample = any;

/** Home maintenance after "Cleared the gutters today, 900 kr": what the AI writes (the job's last
 *  date, and a line in its history with the cost). */
function gutters(d: Sample): Sample {
  const v = d.values ?? d;
  const job = v.jobs.find((j: { name: string }) => j.name === "Clear the gutters");
  job.last = DAY;
  v.history.push({ id: "h-gutters", job: job.id, date: DAY, cost: 900 });
  return d;
}

const SHOTS: Record<string, Shot[]> = {
  "trip-plan": [
    { name: "mac-trip", size: MAC },
    { name: "phone-bookings", size: PHONE, steps: [{ tap: "Bookings" }] },
    { name: "mac-packing", size: MAC, steps: [{ tap: "Packing" }] },
    { name: "phone-packing", size: PHONE, steps: [{ tap: "Packing" }] },
    { name: "phone-days", size: PHONE, steps: [{ tap: "Days" }] },
  ],
  "budget-log": [
    { name: "mac-month", size: MAC },
    { name: "phone-month", size: PHONE },
    { name: "phone-expenses", size: PHONE, steps: [{ tap: "Expenses" }] },
    { name: "mac-budget", size: MAC, steps: [{ tap: "Budget" }] },
    { name: "phone-budget", size: PHONE, steps: [{ tap: "Budget" }] },
  ],
  "study-flashcards": [
    { name: "phone-study", size: PHONE },
    { name: "mac-cards", size: MAC, steps: [{ tap: "Cards" }] },
    { name: "phone-question", size: PHONE, steps: [{ tap: "Study now" }] },
    { name: "mac-question", size: MAC, steps: [{ tap: "Study now" }] },
    { name: "phone-answer", size: PHONE, steps: [{ tap: "Study now" }, { tap: "Show answer" }] },
  ],
  "meal-plan": [
    { name: "mac-week", size: MAC },
    { name: "phone-week", size: PHONE },
    { name: "phone-groceries", size: PHONE, steps: [{ tap: "Groceries" }, { scroll: "down" }, { scroll: "down" }] },
    { name: "mac-groceries", size: MAC, steps: [{ tap: "Groceries" }] },
    { name: "phone-list", size: PHONE, steps: [{ tap: "Groceries" }] },
  ],
  "workout-log": [
    { name: "mac-sessions", size: MAC, steps: [{ tap: "Sessions" }, { scroll: "up" }, { scroll: "up" }, { scroll: "up" }] },
    { name: "phone-sessions", size: PHONE, steps: [{ tap: "Sessions" }, { scroll: "up" }, { scroll: "up" }, { scroll: "up" }] },
    { name: "phone-progress", size: PHONE, steps: [{ tap: "Progress" }] },
    { name: "mac-today", size: MAC },
    { name: "phone-today", size: PHONE },
  ],
  "job-hunt": [
    { name: "mac-board", size: MAC },
    { name: "phone-board", size: PHONE },
    { name: "phone-tideway", size: PHONE, steps: [{ tap: "Tideway" }, { scroll: "down" }] },
    { name: "mac-due", size: MAC, steps: [{ tap: "Due" }] },
    { name: "phone-due", size: PHONE, steps: [{ tap: "Due" }] },
  ],
  "mood-energy-log": [
    { name: "mac-today", size: MAC },
    { name: "phone-today", size: PHONE },
    { name: "phone-trends", size: PHONE, steps: [{ tap: "Trends" }, { scroll: "down" }, { scroll: "down" }] },
    { name: "mac-month", size: MAC, steps: [{ tap: "Month" }] },
    { name: "phone-month", size: PHONE, steps: [{ tap: "Month" }] },
  ],
  "home-maintenance": [
    { name: "mac-due", size: MAC },
    { name: "phone-due", size: PHONE },
    // After "Cleared the gutters today, 900 kr": the job done today, as the AI writes it.
    { name: "phone-history", size: PHONE, steps: [{ tap: "History" }, { scroll: "up" }, { scroll: "up" }, { scroll: "up" }], data: gutters },
    { name: "mac-jobs", size: MAC, steps: [{ tap: "Jobs" }] },
    { name: "phone-jobs", size: PHONE, steps: [{ tap: "Jobs" }] },
  ],
  "gift-ideas": [
    { name: "mac-mum", size: MAC, steps: [{ tap: "People" }, { tap: "Mum" }] },
    { name: "phone-mum", size: PHONE, steps: [{ tap: "People" }, { tap: "Mum" }] },
    { name: "phone-oskar", size: PHONE, steps: [{ tap: "People" }, { tap: "Oskar" }] },
    { name: "mac-upcoming", size: MAC },
    { name: "phone-upcoming", size: PHONE },
  ],
};

const args = Deno.args.filter((a, i) => !a.startsWith("--") && Deno.args[i - 1] !== "--raw");
const rawAt = Deno.args.indexOf("--raw");
const raw = rawAt >= 0 ? Deno.args[rawAt + 1] : null;
const ROOT = new URL("../web/", import.meta.url);

for (const slug of args.length ? args : Object.keys(SHOTS)) {
  // The app's clock at DAY too, so the pictures are the same whenever they're drawn.
  const stored = atDay(await Deno.readTextFile(new URL(`public/templates/apps/${slug}.project.json`, ROOT)), DAY);
  const t = JSON.parse(await Deno.readTextFile(new URL(`content/templates/${slug}.json`, ROOT)));
  const sample = await sampleFor(slug, DAY);
  if (!sample) throw new Error(`${slug} has no sample.`);
  const out = new URL(`public/templates/page/${slug}/`, ROOT);
  await Deno.mkdir(out, { recursive: true });
  for (const shot of SHOTS[slug]) {
    const data = shot.data ? shot.data(structuredClone(sample)) : sample;
    const view = { width: shot.size.width, height: shot.size.height, scale: shot.size.scale, scheme: "light" as const };
    // Without steps the page is drawn once; with steps, after the last one (render.ts trial).
    const steps: Step[] = [{ wait: 600 }, ...(shot.steps ?? []), { wait: 500 }];
    const r = await renderPage(stored, t.example, data, { today: DAY, views: [view], probes: false, capture: true, steps });
    const last = r.trial?.[r.trial.length - 1];
    const failed = r.trial?.find((s) => !s.ok);
    if (failed || !last?.png) throw new Error(`${slug} ${shot.name}: ${failed?.error ?? "no picture"}`);
    const png = Uint8Array.from(atob(last.png), (c) => c.charCodeAt(0));
    const tmp = await Deno.makeTempFile({ suffix: ".png" });
    await Deno.writeFile(tmp, png);
    if (raw) { await Deno.mkdir(raw, { recursive: true }); await Deno.copyFile(tmp, `${raw}/${slug}-${shot.name}.png`); }
    // The Mac at 1600 px wide (drawn at 1000 x 625, 2x) and the phone at 780: sharp at the page's sizes, small to send.
    const width = shot.size === MAC ? 1600 : 780;
    const cmd = new Deno.Command("cwebp", { args: ["-quiet", "-q", "82", "-resize", String(width), "0", tmp, "-o", new URL(`${shot.name}.webp`, out).pathname] });
    if (!(await cmd.output()).success) throw new Error(`cwebp failed on ${slug} ${shot.name}`);
    await Deno.remove(tmp);
    console.log(`✓ ${slug}/${shot.name}${last.errors.length ? `  (page errors: ${last.errors.join("; ")})` : ""}`);
  }
}
await closeBrowser();
