import { format, subDays } from "date-fns"

// The app's data (docs/README.md): habits, and one record per day with the habits done that day.
export type Habit = { id: string; name: string; detail?: string; order?: number; removed?: boolean }
export type Day = { id: string; date: string; done: string[] }

export const dayKey = (d: Date) => format(d, "yyyy-MM-dd")

/** The last n days, oldest first, ending today. */
export const lastDays = (today: Date, n: number) => Array.from({ length: n }, (_, i) => subDays(today, n - 1 - i))

export const doneOn = (days: Day[], date: string, habit: string) => days.some((d) => d.date === date && d.done.includes(habit))

/** Days in a row the habit was done, counting back from today (or from yesterday, while today is still open). */
export function streak(days: Day[], habit: string, today: Date): number {
  let n = 0
  let at = doneOn(days, dayKey(today), habit) ? today : subDays(today, 1)
  while (doneOn(days, dayKey(at), habit)) { n++; at = subDays(at, 1) }
  return n
}

/** The habits that show, in their order (order, then the order they were added). A removed habit
 *  keeps its record, so Undo brings it back with its days. */
export const shown = (list: Habit[]) =>
  list.map((h, i) => ({ h, i })).filter(({ h }) => !h.removed).sort((a, b) => (a.h.order ?? a.i) - (b.h.order ?? b.i) || a.i - b.i).map(({ h }) => h)
