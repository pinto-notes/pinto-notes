import type { Entry } from "./entries";

/// Dates and months for the tracker, shared by the page (on the server) and its rows.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const monthOf = (date: string) => date.slice(0, 7);
export const monthId = (month: string) => `${MONTHS[+month.slice(5, 7) - 1].toLowerCase()}-${month.slice(0, 4)}`;
export const monthName = (month: string) => `${MONTHS[+month.slice(5, 7) - 1]} ${month.slice(0, 4)}`;

/// "21 Oct", or "Oct" when only the month is known.
export const shortDate = (date: string) => {
  const m = MONTHS[+date.slice(5, 7) - 1].slice(0, 3);
  return date.length > 7 ? `${+date.slice(8, 10)} ${m}` : m;
};

export const host = (url: string) => new URL(url).hostname.replace(/^www\./, "");

export function newestFirst(entries: Entry[]): Entry[] {
  return entries.map((e, i) => [e, i] as const).sort((a, b) => b[0].date.localeCompare(a[0].date) || a[1] - b[1]).map(([e]) => e);
}
