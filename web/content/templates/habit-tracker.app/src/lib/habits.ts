import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   habits: [{ id, name, detail, target, unit, days, perWeek, pick }]
//     target 1 is a yes/no habit; more is a count (8 glasses).
//     days: the weekdays it's for, 0 Monday to 6 Sunday ([0,2,4] is Mon, Wed, Fri). No days: every day.
//     perWeek: a weekly goal instead (3 is any three days a week).
//     pick: false, in a new tracker only: a suggestion that starts unticked on Pick your habits.
//       Start never saves it.
//   days:  { "2026-10-13": { "walk": 1, "water": 6 } }   how much of each habit was done that day
//   skips: { "2026-10-13": ["walk"] }   days a habit was skipped on purpose: they keep the streak
//     since: "2026-11-21"   the day the habit was added, when that was after the tracker started:
//       nothing before it is due for this habit. Missing: due since the tracker started.
//     before: [{ until: "2026-11-21", target: 8 }]   earlier goals: on days before until, the habit
//       had these values (target, days or perWeek, only the ones that changed). Changing a goal adds
//       one, so a new goal counts from the day it's set and the days done under the old one stay done.
//   started: "2026-10-13"   the day the person started: nothing before it is due. A tracker with no
//     started and nothing logged opens on "Pick your habits" (src/screens/setup.tsx).
export type Goal = { until: string; target?: number; days?: number[]; perWeek?: number }
export type Habit = { id: string; name: string; detail?: string; target: number; unit?: string; days?: number[]; perWeek?: number; pick?: boolean; since?: string; before?: Goal[] }
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

/** The habit as it was on a day: the goal it had then (before), else its goal now. Each entry holds
 *  what a change replaced, so the entries after the day, newest first, wind it back. */
export function at(h: Habit, day: string): Habit {
  const was = (h.before ?? []).filter((g) => day < g.until).sort((a, b) => (a.until < b.until ? 1 : -1))
  let out = h
  for (const { until: _, ...g } of was) out = { ...out, ...g }
  return out
}
/** The habit's goal for a day: the count it needed then. */
export const goal = (h: Habit, day: string) => at(h, day).target
export const amount = (days: Days, h: Habit, day: string) => days[day]?.[h.id] ?? 0
export const done = (days: Days, h: Habit, day: string) => amount(days, h, day) >= goal(h, day)
export const skipped = (skips: Skips, h: Habit, day: string) => !!skips[day]?.includes(h.id)
const weekly = (h: Habit) => (h.perWeek ?? 0) > 0
/** Whether the day is before the habit was added (its since): nothing was due then. */
export const notYet = (h: Habit, day: string) => !!h.since && day < h.since
/** Whether the habit is for that day: on or after the day it was added, and on a weekday it was for
 *  then (a weekly goal is for any day). */
export function scheduled(h: Habit, d: Date) {
  const k = iso(d)
  if (notYet(h, k)) return false
  if (weekly(h)) return true
  const ds = at(h, k).days
  return !ds?.length || ds.includes(weekday(d))
}
/** A weekly goal for the week starting on Monday w: the goal it had that week, and in the week it was
 *  added no more than the days that were left. 0 for a week before it was added. */
export function weekGoal(h: Habit, w: Date) {
  const sunday = iso(addDays(w, 6))
  if (h.since && sunday < h.since) return 0
  const n = at(h, sunday).perWeek ?? h.perWeek ?? 0
  return h.since && h.since > iso(w) ? Math.min(n, 7 - weekday(parse(h.since))) : n
}
/** What a change to a habit replaced in its goal, for its before list: the target, the weekdays (a
 *  daily habit) or the times a week (a weekly one). Nothing when the goal stayed the same. Switching
 *  between daily and weekly isn't kept (docs/README.md, Known gaps). */
export function goalChange(was: Habit, now: Habit): Omit<Goal, "until"> {
  const out: Omit<Goal, "until"> = {}
  const all = (ds?: number[]) => (!ds?.length || ds.length === 7 ? "" : ds.slice().sort().join())
  if (was.target !== now.target) out.target = was.target
  if (!weekly(was) && !weekly(now) && all(was.days) !== all(now.days)) out.days = was.days?.length ? was.days : []
  if (weekly(was) && weekly(now) && was.perWeek !== now.perWeek) out.perWeek = was.perWeek
  return out
}

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
    const met = (w: Date) => { const g = weekGoal(h, w); return g > 0 && doneInWeek(days, h, addDays(w, 6)) >= g }
    if (!met(w)) w = addDays(w, -7)
    while (n < 520 && met(w)) { n++; w = addDays(w, -7) }
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
      const g = weekGoal(h, w)
      if (!g) continue
      run = doneInWeek(days, h, addDays(w, 6)) >= g ? run + 1 : 0; top = Math.max(top, run)
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

/** The day counting starts: the day the person started, else the first day anything was logged,
 *  else today. Nothing before it is due, so a tracker made on a Wednesday isn't "0 of 8 since Monday". */
export function begin(started: string | null | undefined, days: Days, skips: Skips, now = today()): string {
  if (started) return started
  const first = [...Object.keys(days), ...Object.keys(skips)].sort()[0]
  return first && first < iso(now) ? first : iso(now)
}

/** Is it still to do today? A weekly goal stops asking once the week's goal is met. */
export const dueToday = (days: Days, h: Habit, now = today()) =>
  weekly(h) ? doneInWeek(days, h, now) < weekGoal(h, weekStart(now)) || done(days, h, iso(now)) : scheduled(h, now)

/** This week so far (Monday to today, or from the day counting starts if that's later): habit-days
 *  done of habit-days due. A weekly goal counts its goal. Skipped days and days a habit isn't for
 *  don't count against you. first is the first day counted. */
export function week(days: Days, skips: Skips, habits: Habit[], now = today(), from = "") {
  let got = 0, of = 0
  const monday = weekStart(now), first = from > iso(monday) ? (from > iso(now) ? iso(now) : from) : iso(monday)
  for (const h of habits) {
    if (weekly(h)) { const g = weekGoal(h, monday); of += g; got += Math.min(g, doneInWeek(days, h, now)); continue }
    for (let d = monday; iso(d) <= iso(now); d = addDays(d, 1)) {
      const k = iso(d)
      if (done(days, h, k)) { got++; of++ } else if (k >= first && scheduled(h, d) && !skipped(skips, h, k)) of++
    }
  }
  return { got, of, share: of ? got / of : 0, first }
}

/** One month up to today: how often the habit was done of how often it was due. A weekly goal
 *  counts its goal for each week (days done that week, at most the goal). Today isn't due yet, and
 *  nothing is due before from (the day counting starts). */
export function month(days: Days, skips: Skips, h: Habit, first: Date, now = today(), from = "") {
  let got = 0, of = 0
  const inMonth = (d: Date) => d.getMonth() === first.getMonth() && iso(d) <= iso(now)
  if (weekly(h)) {
    for (let w = weekStart(first); inMonth(w) || iso(w) < iso(first); w = addDays(w, 7)) {
      let n = 0
      for (let d = w, i = 0; i < 7; i++, d = addDays(d, 1)) if (inMonth(d) && iso(d) >= iso(first) && done(days, h, iso(d))) n++
      const g = weekGoal(h, w)
      if ((iso(addDays(w, 6)) < from || !g) && !n) continue
      got += Math.min(n, g); of += g
    }
    return { got, of }
  }
  for (let d = first; inMonth(d); d = addDays(d, 1)) {
    const k = iso(d)
    if (done(days, h, k)) { got++; of++ } else if (k >= from && scheduled(h, d) && !skipped(skips, h, k) && k !== iso(now)) of++
  }
  return { got, of }
}

export const slug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "habit"

export function useHabits() {
  const [habits, setHabits] = useStore<Habit[]>("habits", [])
  const [days, setDays] = useStore<Days>("days", {})
  const [skips, setSkips] = useStore<Skips>("skips", {})
  const [started, setStarted] = useStore<string | null>("started", null)
  const list = (habits ?? []) as Habit[], log = (days ?? {}) as Days, skip = (skips ?? {}) as Skips
  const now = today(), day = iso(now)
  // A new tracker: nothing chosen yet, so nothing is counted. The habits it holds are suggestions.
  const fresh = !started && !Object.keys(log).length && !Object.keys(skip).length
  const due = list.filter((h) => dueToday(log, h, now))
  const doneToday = due.filter((h) => done(log, h, day)).length
  useEffect(() => {
    if (!list.length || fresh) return
    setSummary(due.length && doneToday === due.length ? `All ${due.length} habits done today` : `${doneToday} of ${due.length} habits today`)
  }, [doneToday, due.length, list.length, fresh])
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
    /** True until the person has picked their habits (or anything is logged). */
    fresh,
    /** The first day that counts (yyyy-mm-dd): see begin. */
    from: begin(started, log, skip, now),
    /** Picks the habits and starts counting from today. Ids are made from the names. */
    start: async (picked: Omit<Habit, "id">[]) => {
      const out: Habit[] = []
      for (const { pick: _, ...h } of picked) {
        let id = slug(h.name), k = 2
        while (out.some((x) => x.id === id)) id = `${slug(h.name)}-${k++}`
        out.push({ ...h, id })
      }
      await setHabits(out)
      return setStarted(day)
    },
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
      if (done(log, h, on)) { await set(h, 0, on); return setSkip(h, on, true) }
      return set(h, goal(h, on), on)
    },
    /** Adds a habit, due from today: the days before it was added aren't missed. A habit added back
     *  under a name it had before keeps its days (Undo, or Add with the same name), so it's due from
     *  the first of them. */
    add: (h: Omit<Habit, "id">) => {
      let id = slug(h.name), k = 2
      while (list.some((x) => x.id === id)) id = `${slug(h.name)}-${k++}`
      const logged = Object.keys(log).filter((d) => log[d]?.[id] !== undefined).sort()[0]
      return setHabits([...list, { ...h, id, since: logged && logged < day ? logged : day }])
    },
    /** Changes a habit. A new goal counts from today: what it replaced is kept for the days before (in
     *  before), so days done under the old goal stay done. Changed twice in a day, the first goal stays. */
    update: (id: string, patch: Partial<Habit>) => setHabits(list.map((h) => {
      if (h.id !== id) return h
      const next: Habit = { ...h, ...patch }
      for (const k of Object.keys(next) as (keyof Habit)[]) if (next[k] === undefined) delete next[k]
      const was = goalChange(h, next)
      if (Object.keys(was).length) {
        const goals = (h.before ?? []).slice(), i = goals.findIndex((g) => g.until === day)
        if (i >= 0) goals[i] = { ...was, ...goals[i] }
        else goals.push({ until: day, ...was })
        next.before = goals
      }
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
