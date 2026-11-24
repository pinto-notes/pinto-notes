import type { SiteEvent } from "./posthog";

// The live budget on /blog/apple-notes-budget-template (lib/LiveBudget.tsx): the Pinto Notes Budget
// and expenses template (content/templates/budget-log.app) running in the post, with its data in
// memory only. The template itself can't run in a page as it is: it imports "amber" and
// "amber-router", which only Pinto Notes provides, its styles are Tailwind built by Pinto Notes from
// the classes it uses, and it expects to be the whole document. So this is the smallest faithful
// version of its first screen ("Set your monthly budget", src/screens/setup.tsx) and the summary
// card of its Month screen (src/screens/month.tsx), with the app's own sums and number format.
// money and number are copied from the app word for word, and a test checks they stay the same.
// One addition, for the post: an income line, since the Apple Notes template starts from income
// and the app has none yet (its docs list that as a known gap).

export type Line = { key: number; name: string; amount: string };

// The Apple Notes template's own numbers, so the two read the same.
export const START_INCOME = "3200";
export const START_LINES: Line[] = [
  ["Rent", "1200"], ["Food", "450"], ["Transport", "120"], ["Phone", "30"], ["Fun", "150"], ["Saving", "500"],
].map(([name, amount], key) => ({ key, name, amount }));

// From the app's src/screens/setup.tsx.
export const number = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0)

// From the app's src/lib/budget.ts.
const num = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 })
export const money = (n: number, currency: string) => {
  const s = num.format(Math.round(Math.abs(n) * 100) / 100)
  return /^[$€£]$/.test(currency) ? `${n < 0 ? "-" : ""}${currency}${s}` : `${n < 0 ? "-" : ""}${s} ${currency}`.trim()
}

/** What the plan comes to: every named line counts, as Start counts them in the app. */
export function plan(income: string, lines: Line[]) {
  const planned = lines.filter((l) => l.name.trim()).reduce((t, l) => t + number(l.amount), 0);
  const inc = number(income);
  return { income: inc, planned, left: inc - planned, share: inc ? planned / inc : 0 };
}

export const LIVE_TEMPLATE = "budget-log";

/// Sent once per page view, on the reader's first change to the live budget. Only the page and the
/// template are named: what they typed never leaves the page.
export const editedEvent = (path: string, slug: string): SiteEvent =>
  ({ event: "blog_live_template_edited", properties: { path, slug, template: LIVE_TEMPLATE }, leaves: false });
