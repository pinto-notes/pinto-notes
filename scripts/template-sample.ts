// A template app's sample data (Pane/Resources/Templates/template-app-<slug>.sample.json, written
// by scripts/template-samples.py): the app in use. Its dates are written for ANCHOR and moved to
// the day a picture is drawn, as the Mac app moves them when it shows the sample
// (TemplateFiles.sample), so a habit ticked "today" is ticked today.
// scripts/template-stage-pictures.ts moves them with this too.

/** The day the samples' dates are written for (scripts/template-samples.py, ANCHOR). */
export const ANCHOR = "2026-11-08";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Every "yyyy-mm-dd" in value, as a string or as a key, moved by days. */
export function moved(value: unknown, days: number): unknown {
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

/** Today on this machine, as "yyyy-mm-dd". */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The sample for slug with its dates moved to today, or null when there isn't one yet. */
export async function sampleFor(slug: string, today = localToday()): Promise<unknown | null> {
  const file = new URL(`../Pane/Resources/Templates/template-app-${slug}.sample.json`, import.meta.url);
  let text: string;
  try { text = await Deno.readTextFile(file); } catch { return null; }
  return moved(JSON.parse(text), Math.round((Date.parse(today) - Date.parse(ANCHOR)) / 86_400_000));
}

/** The stored project with the app's clock set to day (at 18:00 local time, its hours running on
 *  from there), so a picture of a sample moved to day shows that day as today whenever it is drawn.
 *  The render service's `today` reaches the note, not the app's own Date. */
export function atDay(stored: string, day: string): string {
  const p = JSON.parse(stored) as { files: Record<string, string> };
  const page = p.files["/index.html"];
  if (!page?.includes("<head>")) return stored;
  const pin = `<script>(()=>{const R=Date,off=new R("${day}T18:00:00").getTime()-R.now();class D extends R{constructor(...a){a.length?super(...a):super(R.now()+off)}static now(){return R.now()+off}}globalThis.Date=D})()</script>`;
  p.files["/index.html"] = page.replace("<head>", () => `<head>${pin}`);
  return JSON.stringify(p);
}
