import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   habits: [{ id, name, detail, target, unit }]   target 1 is a yes/no habit; more is a count (8 glasses)
//   days:   { "2026-10-13": { "walk": 1, "water": 6 } }   how much of each habit was done that day
export type Habit = { id: string; name: string; detail?: string; target: number; unit?: string }
export type Days = Record<string, Record<string, number>>

/** A local date as yyyy-mm-dd. */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
/** Monday of the week d is in. */
export const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))
export const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d }

export const done = (days: Days, h: Habit, day: string) => (days[day]?.[h.id] ?? 0) >= h.target

/** Days in a row the habit was done, up to today. Today still counts as open until it's over. */
export function streak(days: Days, h: Habit, now = today()): number {
  let d = done(days, h, iso(now)) ? now : addDays(now, -1), n = 0
  while (done(days, h, iso(d)) && n < 3650) { n++; d = addDays(d, -1) }
  return n
}

/** This week so far (Monday to today): how many habit-days are done of how many there were. */
export function week(days: Days, habits: Habit[], now = today()) {
  let got = 0, of = 0
  for (let d = weekStart(now); iso(d) <= iso(now); d = addDays(d, 1)) for (const h of habits) { of++; if (done(days, h, iso(d))) got++ }
  return { got, of, share: of ? got / of : 0 }
}

export const slug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "habit"

export function useHabits() {
  const [habits, setHabits] = useStore<Habit[]>("habits", [])
  const [days, setDays] = useStore<Days>("days", {})
  const list = (habits ?? []) as Habit[], log = (days ?? {}) as Days
  const day = iso(today())
  const doneToday = list.filter((h) => done(log, h, day)).length
  useEffect(() => { if (list.length) setSummary(`${doneToday} of ${list.length} habits today`) }, [doneToday, list.length])
  return {
    habits: list,
    days: log,
    /** Sets how much of a habit was done on a day (0 removes it). next can be a function of what's
     *  saved now, so quick taps add up (One more, One more). */
    set: (h: Habit, next: number | ((was: number) => number), on = day) => setDays((now: Days) => {
      const d = { ...(now?.[on] ?? {}) }
      const value = typeof next === "function" ? next(d[h.id] ?? 0) : next
      if (value > 0) d[h.id] = Math.min(value, Math.max(h.target, 99)); else delete d[h.id]
      const out = { ...(now ?? {}) }
      if (Object.keys(d).length) out[on] = d; else delete out[on]
      return out
    }),
    add: (h: Omit<Habit, "id">) => {
      let id = slug(h.name), k = 2
      while (list.some((x) => x.id === id)) id = `${slug(h.name)}-${k++}`
      return setHabits([...list, { ...h, id }])
    },
    update: (id: string, patch: Partial<Habit>) => setHabits(list.map((h) => (h.id === id ? { ...h, ...patch } : h))),
    remove: (id: string) => setHabits(list.filter((h) => h.id !== id)),
    /** Puts the whole list back (Undo after a remove). */
    restore: (all: Habit[]) => setHabits(all),
    move: (id: string, by: number) => {
      const i = list.findIndex((h) => h.id === id), j = i + by
      if (i < 0 || j < 0 || j >= list.length) return
      const next = list.slice(); [next[i], next[j]] = [next[j], next[i]]
      return setHabits(next)
    },
  }
}
