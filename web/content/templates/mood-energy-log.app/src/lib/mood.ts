import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   days:      { "yyyy-mm-dd": { mood, energy, sleep?, tags?, note? } }   one entry a day
//              mood and energy: 1 (low) to 5 (great); sleep: hours slept the night before (7.5)
//              tags: names from values.tags ("Exercise"); note: one line about the day
//   tags:      ["Exercise", "Alcohol", "Social", "Work stress"]   to pick from, in this order
//   logSleep:  true    whether the app asks for hours slept (false hides sleep everywhere)
//   sleepGoal: 8       the hours the person aims for: a line on the sleep chart
export type Day = { mood: number; energy: number; sleep?: number; tags?: string[]; note?: string }
export type Days = Record<string, Day>
export type Entry = Day & { date: string }
export const TAGS = ["Exercise", "Alcohol", "Social", "Work stress"]

export const MOOD_WORDS = ["Awful", "Low", "Okay", "Good", "Great"]
export const ENERGY_WORDS = ["Drained", "Low", "Okay", "Good", "Full"]
export const moodWord = (n: number) => MOOD_WORDS[Math.round(n) - 1] ?? ""
export const energyWord = (n: number) => ENERGY_WORDS[Math.round(n) - 1] ?? ""

// MARK: dates

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const noon = (s: string) => new Date(s + "T12:00:00")
export const today = () => iso(new Date())
export const plus = (s: string, n: number) => { const d = noon(s); d.setDate(d.getDate() + n); return iso(d) }
export const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s)
/** "Sunday 22 November". */
export const longDay = (s: string) => noon(s).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
export const dayName = (s: string) => noon(s).toLocaleDateString("en-GB", { weekday: "long" })
export const shortDay = (s: string) => noon(s).toLocaleDateString("en-GB", { weekday: "short" })
export const dayMonth = (s: string) => noon(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
/** Today, Yesterday, or Tuesday 17 November. */
export function dayLabel(s: string, now = today()) {
  if (s === now) return "Today"
  if (s === plus(now, -1)) return "Yesterday"
  return longDay(s)
}
/** The first of a date's month, "yyyy-mm-01". */
export const monthOf = (s: string) => s.slice(0, 8) + "01"
export const addMonths = (first: string, n: number) => { const d = noon(first); d.setDate(1); d.setMonth(d.getMonth() + n); return iso(d) }
export const monthName = (first: string) => noon(first).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
/** The days of a month, in order. */
export function monthDays(first: string) {
  const out: string[] = []
  for (let d = first; d.slice(0, 7) === first.slice(0, 7); d = plus(d, 1)) out.push(d)
  return out
}
/** Monday is 0. */
export const weekday = (s: string) => (noon(s).getDay() + 6) % 7

// MARK: reading what's saved (the AI may write it by hand)

const clamp = (n: unknown) => { const v = Math.round(Number(n)); return v >= 1 && v <= 5 ? v : 0 }
/** A day as saved, made safe to show: scores 1 to 5, hours as a number, tags as text. Null if it
 *  has neither a mood nor an energy. */
export function clean(d: unknown): Day | null {
  if (!d || typeof d !== "object") return null
  const x = d as Record<string, unknown>
  const mood = clamp(x.mood), energy = clamp(x.energy)
  if (!mood && !energy) return null
  const out: Day = { mood, energy }
  const sleep = typeof x.sleep === "string" ? parseFloat(x.sleep.replace(",", ".")) : Number(x.sleep)
  if (x.sleep !== undefined && x.sleep !== null && x.sleep !== "" && Number.isFinite(sleep) && sleep >= 0 && sleep <= 24) out.sleep = sleep
  if (Array.isArray(x.tags)) { const t = x.tags.filter((s): s is string => typeof s === "string" && !!s.trim()).map((s) => s.trim()); if (t.length) out.tags = t }
  if (typeof x.note === "string" && x.note.trim()) out.note = x.note.trim()
  return out
}
export const tagKey = (s: string) => s.trim().toLowerCase()
export const hasTag = (d: Day, tag: string) => (d.tags ?? []).some((t) => tagKey(t) === tagKey(tag))

/** Every logged day, oldest first. */
export function entries(days: Days): Entry[] {
  return Object.keys(days ?? {}).filter(isDate).sort().flatMap((date) => { const d = clean(days[date]); return d ? [{ date, ...d }] : [] })
}
/** The entries from `from` to `to`, both included. */
export const between = (all: Entry[], from: string, to: string) => all.filter((e) => e.date >= from && e.date <= to)

// MARK: numbers

export const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
/** One decimal, without a trailing .0: 3.6, 4. */
export const one = (n: number | null) => (n === null ? "–" : String(Math.round(n * 10) / 10))
export const hours = (n: number) => `${one(n)} h`
export const plural = (n: number, word: string) => `${n} ${n === 1 ? word : word + "s"}`
const scored = (es: Entry[], k: "mood" | "energy") => es.map((e) => e[k]).filter((v) => v > 0)
const slept = (es: Entry[]) => es.map((e) => e.sleep).filter((v): v is number => typeof v === "number")

export type Averages = { days: number; mood: number | null; energy: number | null; sleep: number | null; sleepDays: number }
export function averages(es: Entry[]): Averages {
  const s = slept(es)
  return { days: es.length, mood: avg(scored(es, "mood")), energy: avg(scored(es, "energy")), sleep: avg(s), sleepDays: s.length }
}

/** The fewest days on each side before a pattern is shown as a number. */
export const ENOUGH = 3

export type TagPattern = { tag: string; with: Averages; without: Averages; enough: boolean }
/** Average mood and energy on days with and without each tag, over the given days. Tags on the
 *  list come first, in its order, then any a day has that the list doesn't. */
export function tagPatterns(es: Entry[], tags: string[]): TagPattern[] {
  const seen = new Map<string, string>()
  for (const t of tags) if (!seen.has(tagKey(t))) seen.set(tagKey(t), t)
  for (const e of es) for (const t of e.tags ?? []) if (!seen.has(tagKey(t))) seen.set(tagKey(t), t)
  return [...seen.values()].map((tag) => {
    const w = es.filter((e) => hasTag(e, tag)), wo = es.filter((e) => !hasTag(e, tag))
    return { tag, with: averages(w), without: averages(wo), enough: w.length >= ENOUGH && wo.length >= ENOUGH }
  })
}

export const SLEEP_BANDS = [
  { name: "Under 6 hours", test: (h: number) => h < 6 },
  { name: "6 to 7 hours", test: (h: number) => h >= 6 && h < 7 },
  { name: "7 to 8 hours", test: (h: number) => h >= 7 && h < 8 },
  { name: "8 hours or more", test: (h: number) => h >= 8 },
]
/** Average energy (and mood) after nights of each length, with how many days each rests on. */
export function sleepPatterns(es: Entry[]) {
  return SLEEP_BANDS.map((b) => {
    const here = es.filter((e) => typeof e.sleep === "number" && b.test(e.sleep))
    return { band: b.name, days: here.length, energy: avg(scored(here, "energy")), mood: avg(scored(here, "mood")) }
  })
}

// MARK: the data

export function useMood() {
  const [days, setDays] = useStore<Days>("days", {})
  const [tags, setTags] = useStore<string[]>("tags", TAGS)
  const [logSleep, setLogSleep] = useStore<boolean>("logSleep", true)
  const [sleepGoal, setSleepGoal] = useStore<number>("sleepGoal", 8)
  const ds = (days && typeof days === "object" ? days : {}) as Days
  const ts = (Array.isArray(tags) ? tags : TAGS).filter((t) => typeof t === "string") as string[]
  const all = entries(ds)
  const snapshot = () => ({ days: ds, tags: ts, logSleep: logSleep !== false, sleepGoal: Number(sleepGoal) || 8 })
  const restore = async (s: ReturnType<typeof snapshot>) => {
    await setDays(s.days); await setTags(s.tags); await setLogSleep(s.logSleep); await setSleepGoal(s.sleepGoal)
  }
  return {
    days: ds, tags: ts, all, logSleep: logSleep !== false, sleepGoal: Number(sleepGoal) || 8, snapshot, restore,
    /** The day saved for a date, read safely, or null. */
    day: (date: string) => clean(ds[date]),
    /** The tags to pick from: the list, then any a day has that isn't on it. */
    allTags: (() => {
      const seen = new Map(ts.map((t) => [tagKey(t), t] as const))
      for (const e of all) for (const t of e.tags ?? []) if (!seen.has(tagKey(t))) seen.set(tagKey(t), t)
      return [...seen.values()]
    })(),

    /** Saves a day: what the person picked, nothing they didn't. */
    saveDay: (date: string, d: Day) => setDays((now: Days) => {
      const out: Day = { mood: d.mood, energy: d.energy }
      if (typeof d.sleep === "number") out.sleep = d.sleep
      if (d.tags?.length) out.tags = d.tags
      if (d.note?.trim()) out.note = d.note.trim()
      return { ...(now ?? {}), [date]: out }
    }),
    removeDay: (date: string) => setDays((now: Days) => Object.fromEntries(Object.entries(now ?? {}).filter(([k]) => k !== date))),

    // Settings
    setTags: (all: string[]) => setTags(all),
    /** Renames a tag on the list and on every day that has it. */
    renameTag: async (from: string, to: string) => {
      await setTags((now: string[]) => (now ?? TAGS).map((t) => (tagKey(t) === tagKey(from) ? to : t)))
      await setDays((now: Days) => mapTags(now, (t) => (tagKey(t) === tagKey(from) ? to : t)))
    },
    /** Removes a tag from the list and from every day that has it. */
    removeTag: async (tag: string) => {
      await setTags((now: string[]) => (now ?? TAGS).filter((t) => tagKey(t) !== tagKey(tag)))
      await setDays((now: Days) => mapTags(now, (t) => (tagKey(t) === tagKey(tag) ? null : t)))
    },
    setLogSleep: (on: boolean) => setLogSleep(on),
    setSleepGoal: (h: number) => setSleepGoal(Math.max(4, Math.min(12, h))),
  }
}

function mapTags(days: Days, f: (t: string) => string | null): Days {
  return Object.fromEntries(Object.entries(days ?? {}).map(([k, d]) => {
    if (!d || !Array.isArray(d.tags)) return [k, d]
    const tags = [...new Set(d.tags.map(f).filter((t): t is string => !!t))]
    const { tags: _, ...rest } = d
    return [k, tags.length ? { ...rest, tags } : rest]
  }))
}

/** The note's summary line: "Today: mood 4, energy 3 · slept 7.5 h", or "Not logged today ·
 *  mood 3.6 this week". */
export function useSummary() {
  const m = useMood()
  const now = today()
  const d = m.day(now)
  const week = averages(between(m.all, plus(now, -6), now))
  const text = d
    ? `Today: mood ${d.mood || "–"}, energy ${d.energy || "–"}${m.logSleep && typeof d.sleep === "number" ? ` · slept ${hours(d.sleep)}` : ""}`
    : `Not logged today${week.mood !== null ? ` · mood ${one(week.mood)} this week` : ""}`
  useEffect(() => { setSummary(text) }, [text])
}
