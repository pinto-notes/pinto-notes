import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   habits: [{ id, name, detail, target, unit, days, perWeek }]
//     target 1 is a yes/no habit; more is a count (8 glasses).
//     days: the weekdays it's for, 0 Monday to 6 Sunday ([0,2,4] is Mon, Wed, Fri). No days: every day.
//     perWeek: a weekly goal instead (3 is any three days a week).
//   days:  { "2026-10-13": { "walk": 1, "water": 6 } }   how much of each habit was done that day
//   skips: { "2026-10-13": ["walk"] }   days a habit was skipped on purpose: they keep the streak
export type Habit = { id: string; name: string; detail?: string; target: number; unit?: string; days?: number[]; perWeek?: number }
export type Days = Record<string, Record<string, number>>
export type Skips = Record<string, string[]>

/** A local date as yyyy-mm-dd. */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const parse = (s: string) => new Date(s + "T12:00:00")
/** Monday of the week d is in. */
export const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))
export const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d }
/** 0 for Monday to 6 for Sunday. */
export const weekday = (d: Date) => (d.getDay() + 6) % 7
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const LETTERS = ["M", "T", "W", "T", "F", "S", "S"]

export const amount = (days: Days, h: Habit, day: string) => days[day]?.[h.id] ?? 0
export const done = (days: Days, h: Habit, day: string) => amount(days, h, day) >= h.target
export const skipped = (skips: Skips, h: Habit, day: string) => !!skips[day]?.includes(h.id)
const weekly = (h: Habit) => (h.perWeek ?? 0) > 0
/** Whether the habit is for that weekday (a weekly goal is for any day). */
export const scheduled = (h: Habit, d: Date) => weekly(h) || !h.days?.length || h.days.includes(weekday(d))

/** "Every day", "Weekdays", "Mon, Wed, Fri" or "3 times a week". */
export function schedule(h: Habit) {
  if (weekly(h)) return `${h.perWeek} ${h.perWeek === 1 ? "time" : "times"} a week`
  const ds = (h.days ?? []).slice().sort()
  if (!ds.length || ds.length === 7) return "Every day"
  if (ds.join() === "0,1,2,3,4") return "Weekdays"
  if (ds.join() === "5,6") return "Weekends"
  return ds.map((i) => WEEKDAYS[i].slice(0, 3)).join(", ")
}

/** Days done in the week d is in, up to and including d. */
export const doneInWeek = (days: Days, h: Habit, d: Date) => {
  let n = 0
  for (let x = weekStart(d); iso(x) <= iso(d); x = addDays(x, 1)) if (done(days, h, iso(x))) n++
  return n
}

/** The streak: days in a row (or, for a weekly goal, weeks in a row). Days the habit isn't for and
 *  days skipped on purpose neither count nor break it. Today (this week) only counts once it's done. */
export function streak(days: Days, skips: Skips, h: Habit, now = today()): number {
  if (weekly(h)) {
    let w = weekStart(now), n = 0
    if (doneInWeek(days, h, addDays(w, 6)) < h.perWeek!) w = addDays(w, -7)
    while (n < 520 && doneInWeek(days, h, addDays(w, 6)) >= h.perWeek!) { n++; w = addDays(w, -7) }
    return n
  }
  let d = now, n = 0
  if (!done(days, h, iso(d))) d = addDays(d, -1)
  for (let i = 0; i < 3650; i++, d = addDays(d, -1)) {
    const k = iso(d)
    if (done(days, h, k)) n++
    else if (!scheduled(h, d) || skipped(skips, h, k)) continue
    else break
  }
  return n
}

/** The longest run there has been, the same way the streak counts. */
export function best(days: Days, skips: Skips, h: Habit, now = today()): number {
  const ks = Object.keys(days).filter((k) => days[k]?.[h.id] !== undefined).sort()
  if (!ks.length) return 0
  if (weekly(h)) {
    let top = 0, run = 0
    for (let w = weekStart(parse(ks[0])); iso(w) <= iso(now); w = addDays(w, 7)) {
      run = doneInWeek(days, h, addDays(w, 6)) >= h.perWeek! ? run + 1 : 0; top = Math.max(top, run)
    }
    return top
  }
  let top = 0, run = 0
  for (let d = parse(ks[0]); iso(d) <= iso(now); d = addDays(d, 1)) {
    const k = iso(d)
    if (done(days, h, k)) { run++; top = Math.max(top, run) }
    else if (!scheduled(h, d) || skipped(skips, h, k) || k === iso(now)) continue
    else run = 0
  }
  return top
}

/** Is it still to do today? A weekly goal stops asking once the week's goal is met. */
export const dueToday = (days: Days, h: Habit, now = today()) =>
  weekly(h) ? doneInWeek(days, h, now) < h.perWeek! || done(days, h, iso(now)) : scheduled(h, now)

/** This week so far (Monday to today): habit-days done of habit-days due. A weekly goal counts its
 *  goal. Skipped days and days a habit isn't for don't count against you. */
export function week(days: Days, skips: Skips, habits: Habit[], now = today()) {
  let got = 0, of = 0
  for (const h of habits) {
    if (weekly(h)) { of += h.perWeek!; got += Math.min(h.perWeek!, doneInWeek(days, h, now)); continue }
    for (let d = weekStart(now); iso(d) <= iso(now); d = addDays(d, 1)) {
      const k = iso(d)
      if (done(days, h, k)) { got++; of++ } else if (scheduled(h, d) && !skipped(skips, h, k)) of++
    }
  }
  return { got, of, share: of ? got / of : 0 }
}

/** One month up to today: how often the habit was done of how often it was due. A weekly goal
 *  counts its goal for each week (days done that week, at most the goal). Today isn't due yet. */
export function month(days: Days, skips: Skips, h: Habit, first: Date, now = today()) {
  let got = 0, of = 0
  const inMonth = (d: Date) => d.getMonth() === first.getMonth() && iso(d) <= iso(now)
  if (weekly(h)) {
    for (let w = weekStart(first); inMonth(w) || iso(w) < iso(first); w = addDays(w, 7)) {
      let n = 0
      for (let d = w, i = 0; i < 7; i++, d = addDays(d, 1)) if (inMonth(d) && iso(d) >= iso(first) && done(days, h, iso(d))) n++
      got += Math.min(n, h.perWeek!); of += h.perWeek!
    }
    return { got, of }
  }
  for (let d = first; inMonth(d); d = addDays(d, 1)) {
    const k = iso(d)
    if (done(days, h, k)) { got++; of++ } else if (scheduled(h, d) && !skipped(skips, h, k) && k !== iso(now)) of++
  }
  return { got, of }
}

export const slug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "habit"

export function useHabits() {
  const [habits, setHabits] = useStore<Habit[]>("habits", [])
  const [days, setDays] = useStore<Days>("days", {})
  const [skips, setSkips] = useStore<Skips>("skips", {})
  const list = (habits ?? []) as Habit[], log = (days ?? {}) as Days, skip = (skips ?? {}) as Skips
  const now = today(), day = iso(now)
  const due = list.filter((h) => dueToday(log, h, now))
  const doneToday = due.filter((h) => done(log, h, day)).length
  useEffect(() => {
    if (!list.length) return
    setSummary(due.length && doneToday === due.length ? `All ${due.length} habits done today` : `${doneToday} of ${due.length} habits today`)
  }, [doneToday, due.length, list.length])
  const setSkip = (h: Habit, on: string, yes: boolean) => setSkips((was: Skips) => {
    const out = { ...(was ?? {}) }
    const ids = (out[on] ?? []).filter((x) => x !== h.id)
    if (yes) ids.push(h.id)
    if (ids.length) out[on] = ids; else delete out[on]
    return out
  })
  const set = (h: Habit, next: number | ((was: number) => number), on = day) => setDays((now: Days) => {
    const d = { ...(now?.[on] ?? {}) }
    const value = typeof next === "function" ? next(d[h.id] ?? 0) : next
    if (value > 0) d[h.id] = Math.min(value, Math.max(h.target, 99)); else delete d[h.id]
    const out = { ...(now ?? {}) }
    if (Object.keys(d).length) out[on] = d; else delete out[on]
    return out
  })
  return {
    habits: list, days: log, skips: skip, due, doneToday,
    /** Sets how much of a habit was done on a day (0 removes it). next can be a function of what's
     *  saved now, so quick taps add up (One more, One more). Doing it clears a skip. */
    set: async (h: Habit, next: number | ((was: number) => number), on = day) => {
      await set(h, next, on)
      if (skipped(skip, h, on)) await setSkip(h, on, false)
    },
    /** Skips a day on purpose (ill, travelling): it neither counts nor breaks the streak. */
    skip: async (h: Habit, on = day, yes = true) => {
      if (yes && amount(log, h, on)) await set(h, 0, on)
      return setSkip(h, on, yes)
    },
    /** A tap on a day in a calendar: not done → done → skipped → not done. */
    cycle: async (h: Habit, on: string) => {
      if (skipped(skip, h, on)) return setSkip(h, on, false)
      if (amount(log, h, on) >= h.target) { await set(h, 0, on); return setSkip(h, on, true) }
      return set(h, h.target, on)
    },
    add: (h: Omit<Habit, "id">) => {
      let id = slug(h.name), k = 2
      while (list.some((x) => x.id === id)) id = `${slug(h.name)}-${k++}`
      return setHabits([...list, { ...h, id }])
    },
    update: (id: string, patch: Partial<Habit>) => setHabits(list.map((h) => {
      if (h.id !== id) return h
      const next: Habit = { ...h, ...patch }
      for (const k of Object.keys(next) as (keyof Habit)[]) if (next[k] === undefined) delete next[k]
      return next
    })),
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
