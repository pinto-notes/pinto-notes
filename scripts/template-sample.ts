// A template app's sample data (Pane/Resources/Templates/template-app-<slug>.sample.json, written
// by scripts/template-samples.py): the app in use. Its dates are written for ANCHOR and moved to
// the day a picture is drawn, as the Mac app moves them when it shows the sample
// (TemplateFiles.sample), so a habit ticked "today" is ticked today.
// scripts/template-stage-pictures.ts moves them the same way, with its own copy of this.

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
