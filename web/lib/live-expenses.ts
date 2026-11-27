import type { SiteEvent } from "./posthog";

// The live expense log on /blog/apple-notes-expense-tracker (lib/LiveExpenses.tsx): the Pinto Notes Budget and
// expenses template (content/templates/budget-log.app) running in the post, with its data in memory only. Like the
// live budget (lib/live-budget.ts), the app can't run in a page as it is (it needs "amber", Pinto's runtime, and its
// own Tailwind build), so this is the smallest faithful version of logging an expense: the app's Add expense sheet
// (src/components/add-expense.tsx: the amount first, what it was, a category) and its Expenses screen
// (src/screens/expenses.tsx: by day, newest first, a delete button on each), with the month and each category added
// up as its Month screen does. money and iso are the app's word for word (a test keeps them so). The app's sheet
// also has a Day field and Every month; here a new expense is dated today, which is the sheet's default.
// The examples are the Apple Notes template's six expenses, so the two read the same.
// 27 November 2026, experiment B45 (blog-growth/research/expense-tracker-deep-pass-2026-11-27.md).

export const LIVE_TEMPLATE = "budget-log";

// The Apple Notes template's categories, plus Other for anything else. Each is one word, so it works as a name in
// Math Results when the log is copied into Notes.
export const CATEGORIES = ["Groceries", "Transport", "Dining", "Household", "Fun", "Other"];

export type Expense = { id: string; date: string; what: string; category: string; amount: number };

export const START: Expense[] = [
  ["2026-11-01", "Weekly shop", "Groceries", 412],
  ["2026-11-02", "Bus card", "Transport", 85],
  ["2026-11-03", "Pizza with friends", "Dining", 230],
  ["2026-11-05", "Light bulbs", "Household", 64],
  ["2026-11-06", "Weekly shop", "Groceries", 238],
  ["2026-11-08", "Cinema", "Fun", 150],
].map(([date, what, category, amount], n) => ({ id: `x${n}`, date, what, category, amount } as Expense));

// From the app's src/lib/budget.ts.
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

// From the app's src/lib/budget.ts.
const num = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 })
export const money = (n: number, currency: string) => {
  const s = num.format(Math.round(Math.abs(n) * 100) / 100)
  return /^[$€£]$/.test(currency) ? `${n < 0 ? "-" : ""}${currency}${s}` : `${n < 0 ? "-" : ""}${s} ${currency}`.trim()
}

/// The amount as the app's sheet reads it (a comma taken as the decimal point, rounded to cents), or null when it
/// isn't a positive number, so Add stays off.
export function amountOf(typed: string): number | null {
  const value = Number(typed.trim().replace(",", "."));
  return value > 0 && Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

/// The expenses by day, newest day first, as the app's Expenses screen lists them.
export function byDay(list: Expense[]) {
  const items = list.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return [...new Set(items.map((e) => e.date))].map((date) => ({ date, items: items.filter((e) => e.date === date) }));
}

/// What was spent in all, and per category (only the ones with something spent), in the categories' order.
export function totals(list: Expense[]) {
  const names = [...CATEGORIES, ...list.map((e) => e.category).filter((c) => !CATEGORIES.includes(c))];
  const by = [...new Set(names)]
    .map((name) => ({ name, spent: list.filter((e) => e.category === name).reduce((t, e) => t + e.amount, 0) }))
    .filter((c) => c.spent > 0);
  return { spent: list.reduce((t, e) => t + e.amount, 0), by };
}

/// The app's day heading ("Sunday 1 November").
export const dayName = (date: string) => new Date(date + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const short = (date: string) => new Date(date + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const month = (date: string) => new Date(date + "T12:00").toLocaleDateString("en-GB", { month: "long" });
// A cell's text: no tabs or line breaks (they'd split the row), no "=" (Math Results would read it as a sum).
const cell = (s: string) => s.replace(/[\t\r\n=]+/g, " ").replace(/\s+/g, " ").trim();
// An amount as Math Results reads it: no thousands separator.
const plain = (n: number) => String(Math.round(n * 100) / 100);

/// The reader's log as the post's Apple Notes template has it: the expenses, oldest first, with tabs between the
/// columns (selected in Notes on a Mac, the Table button makes them a table), a line per category that adds up its
/// amounts, and a total line. The total line has no "=": a pasted "=" gets no answer in Notes until it's typed
/// again (blog-growth/research/apple-notes-captures-2026-11-22), so the reader types it.
export function noteText(list: Expense[]) {
  const items = list.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const last = items[items.length - 1];
  const out = [last ? `Expenses, ${month(last.date)}` : "Expenses", "", "Date\tWhat\tCategory\tAmount"];
  for (const e of items) out.push(`${short(e.date)}\t${cell(e.what)}\t${e.category}\t${plain(e.amount)}`);
  const by = totals(items).by;
  if (by.length) {
    out.push("");
    for (const c of by) out.push(`${c.name} = ${items.filter((e) => e.category === c.name).map((e) => plain(e.amount)).join(" + ")}`);
    out.push("", by.map((c) => c.name).join(" + "));
  }
  return out.join("\n") + "\n";
}

/// Sent once per page view, on the reader's first change to the live log. Only the page and the template are
/// named: what they typed never leaves the page.
export const editedEvent = (path: string, slug: string): SiteEvent =>
  ({ event: "blog_live_template_edited", properties: { path, slug, template: LIVE_TEMPLATE }, leaves: false });
