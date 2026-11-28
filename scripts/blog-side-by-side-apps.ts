// The Pinto Notes side of the Apple Notes template posts whose template is an app (web/lib/SideBySide.tsx,
// pattern E): the app drawn by the render service's own code (scripts/page-render/render.ts) over the same
// dinners, sets, applications or evenings as the post's Apple Notes capture, on the day that capture is
// set. Writes web/public/blog/side-by-side/<name>-pinto-phone.{webp,avif} (390 by 844 pt at 2x) and
// <name>-pinto-mac.{webp,avif} (the top 763 by 640 pt of the app drawn 1000 pt tall at 2x, so its
// tabs at the foot are left out: the card's crop of the app on a Mac). Needs cwebp, avifenc and magick.
// No network, nothing on screen.
//   deno run -A scripts/blog-side-by-side-apps.ts [<name>…] [--raw <dir>]
// The habit tracker post's and the budget's were drawn before this script; they aren't listed here.
import { closeBrowser, renderPage, type Step } from "./page-render/render.ts";
import { atDay } from "./template-sample.ts";

const ROOT = new URL("../web/", import.meta.url);
const OUT = new URL("public/blog/side-by-side/", ROOT);
const PHONE = { width: 390, height: 844, scale: 2 };
const MAC = { width: 763, height: 1000, scale: 2, crop: 640 };

// deno-lint-ignore no-explicit-any
type Values = Record<string, any>;
type Size = { width: number; height: number; scale: number; crop?: number };
// macSize: a wider Mac view for an app whose lines would be cut at 763 pt. phoneSize: a taller phone view, so a
// list the post's note shows in full isn't cut off by the tab bar.
type Post = { post: string; slug: string; today: string; values: (start: Values) => Values; phone?: Step[]; mac?: Step[]; macSize?: Size; phoneSize?: Size };

const weights = (reps: number, kg?: number, n = 3) => Array.from({ length: n }, () => (kg === undefined ? { reps } : { reps, kg }));

const POSTS: Record<string, Post> = {
  // apple-notes-new-year-resolution-template: Thursday 14 January 2027, the tracker started on Friday 1 January.
  // The post's six resolutions as habits: three every day, two a set number of days a week, one on Sundays.
  // Today Read and Spanish are done, as ticked in the post's note. One Spanish day was skipped (a trip).
  "resolutions": {
    post: "apple-notes-new-year-resolution-template", slug: "habit-tracker", today: "2027-01-14",
    values: (v) => {
      v.habits = [
        { id: "read", name: "Read", detail: "20 pages", target: 1 },
        { id: "no-phone-in-bed", name: "No phone in bed", target: 1 },
        { id: "spanish", name: "Spanish", detail: "10 minutes", target: 1 },
        { id: "walk", name: "Walk", detail: "30 minutes", target: 1, perWeek: 3 },
        { id: "cook-at-home", name: "Cook at home", target: 1, perWeek: 4 },
        { id: "call-grandma", name: "Call Grandma", target: 1, days: [6] },
      ];
      v.started = "2027-01-01";
      const days: Values = {};
      const on = (d: string, ...ids: string[]) => { days[d] = Object.fromEntries(ids.map((id) => [id, 1])); };
      on("2027-01-01", "read", "no-phone-in-bed", "spanish", "walk");
      on("2027-01-02", "read", "no-phone-in-bed", "spanish", "walk", "cook-at-home");
      on("2027-01-03", "read", "no-phone-in-bed", "spanish", "cook-at-home", "call-grandma");
      on("2027-01-04", "read", "no-phone-in-bed", "spanish", "walk", "cook-at-home");
      on("2027-01-05", "read", "spanish", "cook-at-home");
      on("2027-01-06", "read", "no-phone-in-bed", "spanish", "walk");
      on("2027-01-07", "read", "no-phone-in-bed", "cook-at-home");
      on("2027-01-08", "read", "no-phone-in-bed", "walk", "cook-at-home");
      on("2027-01-09", "read", "no-phone-in-bed", "spanish");
      on("2027-01-10", "read", "no-phone-in-bed", "spanish", "call-grandma");
      on("2027-01-11", "read", "no-phone-in-bed", "spanish", "walk", "cook-at-home");
      on("2027-01-12", "read", "no-phone-in-bed", "spanish", "cook-at-home");
      on("2027-01-13", "read", "no-phone-in-bed", "spanish", "walk", "cook-at-home");
      on("2027-01-14", "read", "spanish");
      v.days = days;
      v.skips = { "2027-01-07": ["spanish"] };
      return v;
    },
    phoneSize: { width: 390, height: 1110, scale: 2 },
    macSize: { width: 763, height: 1000, scale: 2, crop: 664 },
  },
  // iphone-notes-goals-template: Wednesday 20 January 2027, the tracker started on Monday 4 January. The
  // post's three goals, each as its weekly step: run 3 days a week, save once a week, write 4 days a week.
  // Both earlier weeks met; this week two runs (one today) and two writing days so far, as ticked in the
  // post's note.
  "goals": {
    post: "iphone-notes-goals-template", slug: "habit-tracker", today: "2027-01-20",
    values: (v) => {
      v.habits = [
        { id: "run-for-the-10k", name: "Run for the 10K", target: 1, perWeek: 3 },
        { id: "save-60-for-japan", name: "Save $60 for Japan", target: 1, perWeek: 1 },
        { id: "write-500-words", name: "Write 500 words", target: 1, perWeek: 4 },
      ];
      v.started = "2027-01-04";
      const days: Values = {};
      const on = (d: string, ...ids: string[]) => { days[d] = Object.fromEntries(ids.map((id) => [id, 1])); };
      on("2027-01-04", "run-for-the-10k", "write-500-words");
      on("2027-01-05", "write-500-words", "save-60-for-japan");
      on("2027-01-06", "run-for-the-10k");
      on("2027-01-07", "write-500-words");
      on("2027-01-09", "run-for-the-10k", "write-500-words");
      on("2027-01-11", "run-for-the-10k", "write-500-words");
      on("2027-01-12", "write-500-words");
      on("2027-01-13", "run-for-the-10k", "save-60-for-japan");
      on("2027-01-14", "write-500-words");
      on("2027-01-16", "run-for-the-10k", "write-500-words");
      on("2027-01-18", "run-for-the-10k", "write-500-words");
      on("2027-01-19", "write-500-words");
      on("2027-01-20", "run-for-the-10k");
      v.days = days;
      return v;
    },
    phoneSize: { width: 390, height: 720, scale: 2 },
    macSize: { width: 763, height: 1000, scale: 2, crop: 470 },
  },
  // apple-notes-meal-planner-template: the week of 23 November, Oskar cooking Tuesday and Thursday,
  // and Lemons, Basil, Chicken thighs and Tortillas ticked. The groceries are the dinners'
  // ingredients; rice, pasta, onions and garlic are in the cupboard, as in the post's note.
  "meal-plan": {
    post: "apple-notes-meal-planner-template", slug: "meal-plan", today: "2026-11-23",
    values: (v) => {
      const i = (name: string, aisle: string) => ({ name, aisle });
      const plan: [string, string | null, { name: string; aisle: string }[]][] = [
        ["Lemon chicken with rice", "Me", [i("Chicken thighs", "Meat and fish"), i("Lemons", "Fruit and veg"), i("Rice", "Dry goods")]],
        ["Pasta with tomato and basil", "Oskar", [i("Pasta", "Dry goods"), i("Cherry tomatoes", "Fruit and veg"), i("Basil", "Fruit and veg")]],
        ["Fish tacos", "Me", [i("White fish", "Meat and fish"), i("Limes", "Fruit and veg"), i("Tortillas", "Bakery")]],
        ["Chickpea curry", "Oskar", [i("Chickpeas", "Tins and jars"), i("Coconut milk", "Tins and jars"), i("Onions", "Fruit and veg"), i("Rice", "Dry goods")]],
        ["Homemade pizza", "Me", [i("Pizza dough", "Bakery"), i("Mozzarella", "Dairy and eggs"), i("Basil", "Fruit and veg")]],
        ["Out with friends", null, []],
        ["Roast chicken and potatoes", "Me", [i("Whole chicken", "Meat and fish"), i("Potatoes", "Fruit and veg"), i("Garlic", "Fruit and veg")]],
      ];
      v.cooks = ["Me", "Oskar"];
      v.dinners = plan.map(([dish, cook, ingredients], n) => ({ id: `d${n + 1}`, date: `2026-11-${23 + n}`, dish, ...(cook ? { cook } : {}), ingredients }));
      v.bought = { "2026-11-23": ["lemon", "basil", "chicken thigh", "tortilla"] };
      v.extras = [];
      return v;
    },
    phone: [{ tap: "Groceries" }],
    mac: [{ tap: "Groceries" }],
  },
  // apple-notes-workout-log-template: Wednesday 25 November. Legs done on Monday, the bench press
  // done today, and the bests from earlier in the month: deadlift 120 kg x 3 (6 Nov), squat 100 kg
  // x 5 (2 Nov), bench 70 kg x 6 (4 Nov), 5 km in 29 minutes (5 Nov).
  "workout-log": {
    post: "apple-notes-workout-log-template", slug: "workout-log", today: "2026-11-25",
    values: (v) => {
      v.plan = v.plan.filter((p: { id: string }) => p.id !== "run").map(({ pick: _, ...p }: Values) => p);
      v.units = "kg";
      v.goal = 3;
      v.started = "2026-11-02";
      const legs = [{ exercise: "squat", sets: weights(5, 100) }, { exercise: "lunges", sets: weights(10, 16) }, { exercise: "calf-raises", sets: weights(15) }];
      v.sessions = [
        { id: "s1", date: "2026-11-02", name: "Legs", workout: "legs", items: legs },
        { id: "s2", date: "2026-11-04", name: "Push", workout: "push", items: [{ exercise: "bench-press", sets: weights(6, 70) }, { exercise: "overhead-press", sets: weights(8, 40) }, { exercise: "dips", sets: weights(10) }] },
        { id: "s3", date: "2026-11-05", name: "Easy run", items: [{ exercise: "run", sets: [{ km: 5, min: 29 }] }] },
        { id: "s4", date: "2026-11-06", name: "Pull", workout: "pull", items: [{ exercise: "deadlift", sets: weights(3, 120) }, { exercise: "rows", sets: weights(8, 60) }, { exercise: "pull-ups", sets: weights(6) }] },
        { id: "s5", date: "2026-11-23", name: "Legs", workout: "legs", items: legs },
        { id: "s6", date: "2026-11-25", name: "Push", workout: "push", items: [{ exercise: "bench-press", sets: weights(6, 70) }] },
      ];
      return v;
    },
    phone: [{ tap: "Progress" }],
  },
  // iphone-notes-gym-template: Friday 27 November, Pull next. The same split and the same last weights
  // as the post's note: push on Wednesday (bench 72.5 kg x 6, overhead press 40 kg x 8), legs on Monday
  // (squat 102.5 kg x 5, lunges 16 kg x 10), pull a week ago (deadlift 125 kg x 3, rows 60 kg x 8).
  "gym-template": {
    post: "iphone-notes-gym-template", slug: "workout-log", today: "2026-11-27",
    values: (v) => {
      v.plan = v.plan.filter((p: { id: string }) => p.id !== "run").map(({ pick: _, ...p }: Values) => p);
      v.units = "kg";
      v.goal = 3;
      v.started = "2026-11-16";
      const legs = (squat: number) => [{ exercise: "squat", sets: weights(5, squat) }, { exercise: "lunges", sets: weights(10, 16) }, { exercise: "calf-raises", sets: weights(15) }];
      const push = (bench: number, ohp: number) => [{ exercise: "bench-press", sets: weights(6, bench) }, { exercise: "overhead-press", sets: weights(8, ohp) }, { exercise: "dips", sets: weights(10) }];
      v.sessions = [
        { id: "s1", date: "2026-11-16", name: "Legs", workout: "legs", items: legs(100) },
        { id: "s2", date: "2026-11-18", name: "Push", workout: "push", items: push(70, 37.5) },
        { id: "s3", date: "2026-11-20", name: "Pull", workout: "pull", items: [{ exercise: "deadlift", sets: weights(3, 125) }, { exercise: "rows", sets: weights(8, 60) }, { exercise: "pull-ups", sets: weights(6) }] },
        { id: "s4", date: "2026-11-23", name: "Legs", workout: "legs", items: legs(102.5) },
        { id: "s5", date: "2026-11-25", name: "Push", workout: "push", items: push(72.5, 40) },
      ];
      return v;
    },
    macSize: { width: 1500, height: 1000, scale: 2, crop: 664 },
  },
  // iphone-notes-travel-itinerary-template: Chicago, 3 to 6 December, seen on Friday 4 December (day 2
  // of 4). The post's note's lines: the times with a ref are bookings, the rest are the days' plans.
  "travel-itinerary": {
    post: "iphone-notes-travel-itinerary-template", slug: "trip-plan", today: "2026-12-04",
    values: (v) => {
      v.trip = { name: "Chicago", place: "Chicago", start: "2026-12-03", end: "2026-12-06" };
      v.days = [
        { date: "2026-12-03", title: "", items: ["14:00 Millennium Park", "19:30 Dinner at Marlow's, table for 2"] },
        { date: "2026-12-04", title: "", items: ["13:00 Lunch in the West Loop", "16:00 Walk the Riverwalk"] },
        { date: "2026-12-05", title: "", items: ["09:30 Brunch near the hotel", "11:00 Field Museum", "Afternoon free"] },
        { date: "2026-12-06", title: "", items: ["11:00 Check out"] },
      ];
      v.bookings = [
        { id: "b1", what: "Flight to Chicago", kind: "flight", date: "2026-12-03", time: "08:15", ref: "QX4T7B", paid: true },
        { id: "b2", what: "Hotel Lakeview", kind: "stay", date: "2026-12-03", time: "12:30", ref: "77310452", paid: true },
        { id: "b4", what: "Art Institute", kind: "activity", date: "2026-12-04", time: "10:00", ref: "AIC5521", paid: true },
        { id: "b5", what: "Blues show", kind: "activity", date: "2026-12-04", time: "20:00", ref: "BL0412", paid: true },
        { id: "b6", what: "Flight home", kind: "flight", date: "2026-12-06", time: "16:45", ref: "QX4T7B", paid: true },
      ];
      v.packing = v.packing.map((p: Values) => ({ ...p, packed: true }));
      return v;
    },
    mac: [{ tap: "Days" }],
    macSize: { width: 1100, height: 1000, scale: 2, crop: 760 },
  },
  // apple-notes-job-search-tracker: Wednesday 11 November. Tideway's first interview tomorrow with
  // three questions prepared and one to ask, Marlow Studio's follow-up on the 16th, Finch Bikes to
  // apply to by the 18th, Northlight closed (asked for feedback), Karin at Tideway.
  "job-hunt": {
    post: "apple-notes-job-search-tracker", slug: "job-hunt", today: "2026-11-11",
    values: (v) => {
      const job = (id: string, company: string, role: string, stage: string, f: Values = {}) =>
        ({ id, company, role, stage, ...f, steps: f.steps ?? [], questions: f.questions ?? [], ask: f.ask ?? [] });
      v.jobs = [
        job("finch", "Finch Bikes", "Product designer", "saved", { steps: [{ id: "s1", kind: "deadline", date: "2026-11-18" }] }),
        job("marlow", "Marlow Studio", "Design lead", "applied", { applied: "2026-11-09", steps: [{ id: "s2", kind: "follow-up", date: "2026-11-16" }] }),
        job("tideway", "Tideway", "Senior designer", "interview", {
          applied: "2026-10-28", heard: "2026-11-04", contact: "Karin, design manager",
          notes: "Karin cares more about plain prototypes than polish.",
          steps: [{ id: "s3", kind: "interview", what: "First interview", date: "2026-11-12" }],
          questions: [
            { q: "A project you're proud of?", a: "The onboarding redesign." },
            { q: "How do you work with engineers?", a: "Weekly reviews, ship small." },
            { q: "Why Tideway?", a: "I like untangling logistics." },
          ],
          ask: ["How do design and support share what they hear?"],
        }),
        job("northlight", "Northlight", "UX designer", "closed", { outcome: "rejected", applied: "2026-10-20", heard: "2026-11-06", notes: "Asked for feedback." }),
      ];
      v.started = "2026-10-20";
      return v;
    },
  },
  // apple-notes-mood-tracker: the same five evenings, 4 to 8 November, seen on the 8th.
  "mood-energy-log": {
    post: "apple-notes-mood-tracker", slug: "mood-energy-log", today: "2026-11-08",
    values: (v) => {
      v.days = {
        "2026-11-04": { mood: 4, energy: 4, sleep: 7.5, tags: ["Exercise"], note: "Gym before work" },
        "2026-11-05": { mood: 3, energy: 2, sleep: 6, tags: ["Work stress"], note: "Meetings all day" },
        "2026-11-06": { mood: 4, energy: 3, sleep: 6.5, tags: ["Social"], note: "Lunch with Maja" },
        "2026-11-07": { mood: 4, energy: 2, sleep: 5.5, tags: ["Social"], note: "Maja's moving day" },
        "2026-11-08": { mood: 4, energy: 4, sleep: 8, note: "Slept in" },
      };
      return v;
    },
  },
};

const args = Deno.args.filter((a, i) => !a.startsWith("--") && Deno.args[i - 1] !== "--raw");
const rawAt = Deno.args.indexOf("--raw");
const raw = rawAt >= 0 ? Deno.args[rawAt + 1] : null;

async function encode(png: string, name: string, size: Size) {
  const tmp = await Deno.makeTempFile({ suffix: ".png" });
  await Deno.writeFile(tmp, Uint8Array.from(atob(png), (c) => c.charCodeAt(0)));
  if (size.crop) {
    const r = await new Deno.Command("magick", { args: [tmp, "-crop", `${size.width * size.scale}x${size.crop * size.scale}+0+0`, "+repage", tmp] }).output();
    if (!r.success) throw new Error(`magick couldn't crop ${name}`);
  }
  if (raw) { await Deno.mkdir(raw, { recursive: true }); await Deno.copyFile(tmp, `${raw}/${name}.png`); }
  const out = new URL(name, OUT).pathname;
  for (const [cmd, a] of [["cwebp", ["-quiet", "-q", "82", tmp, "-o", `${out}.webp`]], ["avifenc", ["-q", "60", "-s", "6", tmp, `${out}.avif`]]] as const) {
    const r = await new Deno.Command(cmd, { args: [...a], stdout: "null", stderr: "piped" }).output();
    if (!r.success) throw new Error(`${cmd} failed on ${name}: ${new TextDecoder().decode(r.stderr)}`);
  }
  await Deno.remove(tmp);
}

for (const name of args.length ? args : Object.keys(POSTS)) {
  const p = POSTS[name];
  if (!p) throw new Error(`No post for ${name}: ${Object.keys(POSTS).join(", ")}`);
  // The app's clock on the post's day, as the Apple Notes capture is.
  const stored = atDay(await Deno.readTextFile(new URL(`public/templates/apps/${p.slug}.project.json`, ROOT)), p.today);
  const t = JSON.parse(await Deno.readTextFile(new URL(`content/templates/${p.slug}.json`, ROOT)));
  const start = JSON.parse(await Deno.readTextFile(new URL(`public/templates/apps/${p.slug}.data.json`, ROOT)));
  const data = { ...start, values: p.values(structuredClone(start.values)) };
  for (const [kind, size, steps] of [["phone", p.phoneSize ?? PHONE, p.phone], ["mac", p.macSize ?? MAC, p.mac]] as const) {
    const r = await renderPage(stored, t.note ?? "", data, {
      today: p.today, probes: false, capture: true, views: [{ width: size.width, height: size.height, scale: size.scale, scheme: "light" }], steps: [{ wait: 600 }, ...(steps ?? []), { wait: 500 }],
    });
    const last = r.trial?.[r.trial.length - 1];
    const failed = r.trial?.find((s) => !s.ok);
    if (failed || !last?.png) throw new Error(`${name} ${kind}: ${failed?.error ?? "no picture"}`);
    await encode(last.png, `${name}-pinto-${kind}`, size);
    console.log(`✓ ${name}-pinto-${kind} (${p.post})${last.errors.length ? `  (page errors: ${last.errors.join("; ")})` : ""}`);
  }
}
await closeBrowser();
