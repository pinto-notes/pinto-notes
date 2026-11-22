import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   exercises: [{ id, name, kind }]   kind "weight" (sets of reps and weight) or "cardio" (distance and time)
//   plan:      [{ id, name, exercises: [exercise id] }]   the workouts, in the order they're done in turn
//   sessions:  [{ id, date, name, workout?, effort?, note?, items: [{ exercise, sets }] }]
//     a weight set is { reps, kg } (no kg: bodyweight); a cardio set is { km, min }
//     weights are always kg and distances km, whatever the units setting shows; min is minutes
//   units:     "kg" or "lb"   what the app shows and takes (lb also shows miles)
//   goal:      sessions a week
//   started:   "yyyy-mm-dd"   the day the log was set up. With no started and no sessions the app
//     opens on "Set up your training" (src/screens/setup.tsx) and the plan is a suggestion.
export type Kind = "weight" | "cardio"
export type Exercise = { id: string; name: string; kind: Kind }
export type Workout = { id: string; name: string; exercises: string[]; pick?: boolean }
export type WorkSet = { reps?: number; kg?: number; km?: number; min?: number }
export type Item = { exercise: string; sets: WorkSet[] }
export type Session = { id: string; date: string; name: string; workout?: string; effort?: number; note?: string; items: Item[] }
export type Units = "kg" | "lb"

/** A local date as yyyy-mm-dd. */
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export const parse = (s: string) => new Date(s + "T12:00:00")
export const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d }
/** Monday of the week d is in. */
export const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7))
export const LETTERS = ["M", "T", "W", "T", "F", "S", "S"]
export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
/** "Sun 22 Nov". */
export const dayText = (k: string) => parse(k).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
/** "22 Nov". */
export const shortDate = (k: string) => parse(k).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

// MARK: Units. Stored in kg and km; shown and typed in the person's units.

const LB = 2.20462262, MI = 1.609344
export const round = (n: number, d = 1) => { const f = 10 ** d; return Math.round(n * f) / f }
/** A number as typed: "102,5" is 102.5. NaN when it isn't one. */
export const num = (s: string) => (s.trim() ? Number(s.trim().replace(",", ".")) : NaN)
export const weightIn = (kg: number, u: Units) => round(u === "lb" ? kg * LB : kg, 1)
export const kgFrom = (shown: number, u: Units) => round(u === "lb" ? shown / LB : shown, 2)
export const distUnit = (u: Units) => (u === "lb" ? "mi" : "km")
export const distIn = (km: number, u: Units) => round(u === "lb" ? km / MI : km, 2)
export const kmFrom = (shown: number, u: Units) => round(u === "lb" ? shown * MI : shown, 2)
export const weightText = (kg: number, u: Units) => `${weightIn(kg, u)} ${u}`
export const distText = (km: number, u: Units) => `${distIn(km, u)} ${distUnit(u)}`

/** Minutes from "29", "29:30", "1:05:00" or "29.5". */
export function parseTime(s: string): number | undefined {
  const t = s.trim()
  if (!t) return undefined
  if (!t.includes(":")) { const n = num(t); return n > 0 ? n : undefined }
  const parts = t.split(":").map(Number)
  if (parts.some((p) => !Number.isFinite(p) || p < 0) || parts.length > 3) return undefined
  const [h, m, sec] = parts.length === 3 ? parts : [0, ...parts]
  const out = h * 60 + m + sec / 60
  return out > 0 ? round(out, 4) : undefined
}
/** "29:30", or "1:05:00" from an hour. */
export function timeText(min: number): string {
  const total = Math.round(min * 60), h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}
export const paceText = (minPerKm: number, u: Units) => `${timeText(u === "lb" ? minPerKm * MI : minPerKm)} /${distUnit(u)}`

/** One set as it reads: "100 kg × 5", "12 reps", "5 km in 29:00". */
export function setText(s: WorkSet, kind: Kind, u: Units): string {
  if (kind === "cardio") return [s.km ? distText(s.km, u) : "", s.min ? timeText(s.min) : ""].filter(Boolean).join(" in ")
  return s.kg ? `${weightText(s.kg, u)} × ${s.reps ?? 0}` : `${s.reps ?? 0} reps`
}

// MARK: Bests

/** Estimated one-rep max (Epley): weight × (1 + reps / 30); a single is its own weight. */
export const e1rm = (s: WorkSet) => (!s.kg || !s.reps ? 0 : s.reps === 1 ? s.kg : s.kg * (1 + s.reps / 30))
export type Metric = "e1rm" | "heaviest" | "reps" | "distance" | "pace"
export const METRIC_NAMES: Record<Metric, string> = { e1rm: "Est. 1RM", heaviest: "Heaviest", reps: "Most reps", distance: "Distance", pace: "Pace" }
/** Higher is better, except for pace (minutes per km). */
export const lowerIsBetter = (m: Metric) => m === "pace"

/** An item's value on a metric, or undefined when it has none. Distance is the session's total;
 *  pace is its time over its distance, from the sets that have both. */
export function value(item: Item, m: Metric): number | undefined {
  const sets = item.sets ?? []
  const top = (f: (s: WorkSet) => number) => { const v = Math.max(0, ...sets.map(f)); return v > 0 ? v : undefined }
  if (m === "e1rm") return top(e1rm)
  if (m === "heaviest") return top((s) => (s.reps ? s.kg ?? 0 : 0))
  if (m === "reps") return top((s) => s.reps ?? 0)
  if (m === "distance") { const v = sets.reduce((n, s) => n + (s.km ?? 0), 0); return v > 0 ? round(v, 2) : undefined }
  const timed = sets.filter((s) => s.km && s.min)
  const km = timed.reduce((n, s) => n + s.km!, 0), min = timed.reduce((n, s) => n + s.min!, 0)
  return km > 0 ? min / km : undefined
}
/** The set that gives an item its value on a metric (the best set). */
export function bestSet(item: Item, m: Metric): WorkSet | undefined {
  const f = m === "e1rm" ? e1rm : m === "heaviest" ? (s: WorkSet) => (s.reps ? s.kg ?? 0 : 0) : (s: WorkSet) => s.reps ?? 0
  return (item.sets ?? []).slice().sort((a, b) => f(b) - f(a))[0]
}
const better = (m: Metric, a: number, b: number) => (lowerIsBetter(m) ? a < b - 1e-9 : a > b + 1e-9)

/** Sessions oldest first: by date, then in the order they're in the data. */
export function chrono(sessions: Session[]): Session[] {
  return sessions.map((s, i) => ({ s, i })).sort((a, b) => (a.s.date < b.s.date ? -1 : a.s.date > b.s.date ? 1 : a.i - b.i)).map((x) => x.s)
}
/** Every session that has the exercise, oldest first, with its item. */
export function history(sessions: Session[], id: string) {
  const out: { session: Session; item: Item }[] = []
  for (const s of chrono(sessions)) for (const it of s.items ?? []) if (it.exercise === id && it.sets?.length) out.push({ session: s, item: it })
  return out
}
/** What a best is measured by: weight exercises by the estimated 1RM (most reps when nothing has a
 *  weight, like bodyweight pull-ups); cardio by the longest distance and the fastest pace. */
export function metricsOf(ex: Exercise, sessions: Session[]): Metric[] {
  if (ex.kind === "cardio") return ["distance", "pace"]
  return history(sessions, ex.id).some((h) => h.item.sets.some((s) => (s.kg ?? 0) > 0)) ? ["e1rm"] : ["reps"]
}
/** The metrics the progress chart offers for an exercise. */
export function chartMetrics(ex: Exercise, sessions: Session[]): Metric[] {
  const m = metricsOf(ex, sessions)
  return m[0] === "e1rm" ? ["e1rm", "heaviest"] : m
}

export type Best = { metric: Metric; value: number; session: Session; item: Item }
/** An exercise's bests now (one per metric), and the sessions that set a new one by beating an
 *  earlier best (a first time sets the best but beats nothing, so it isn't marked). */
export function records(ex: Exercise, sessions: Session[]) {
  const metrics = metricsOf(ex, sessions)
  const best = new Map<Metric, Best>()
  const beat = new Map<string, Metric[]>()
  for (const { session, item } of history(sessions, ex.id)) {
    for (const m of metrics) {
      const v = value(item, m)
      if (v === undefined) continue
      const was = best.get(m)
      if (!was || better(m, v, was.value)) {
        if (was) beat.set(session.id, [...(beat.get(session.id) ?? []), m])
        best.set(m, { metric: m, value: v, session, item })
      }
    }
  }
  return { metrics, best: metrics.map((m) => best.get(m)).filter(Boolean) as Best[], beat }
}
/** A best as it reads: "100 kg × 5", "15 reps", "8 km", "5:48 /km". */
export function bestText(b: Best, ex: Exercise, u: Units): string {
  if (b.metric === "distance") return distText(b.value, u)
  if (b.metric === "pace") return paceText(b.value, u)
  const s = bestSet(b.item, b.metric)
  return s ? setText(s, ex.kind, u) : ""
}
/** A metric's value as it reads on the chart: "117 kg", "15 reps", "5 km", "5:48 /km". */
export function metricText(m: Metric, v: number, u: Units): string {
  if (m === "e1rm") return `${Math.round(weightIn(v, u))} ${u}`
  if (m === "heaviest") return weightText(v, u)
  if (m === "reps") return `${v} reps`
  if (m === "distance") return distText(v, u)
  return paceText(v, u)
}

/** Every exercise to show: the list's, then any a session names that the list doesn't have (removed,
 *  or written by an AI under a new id), with a name made from the id and a kind from its sets. */
export function known(exercises: Exercise[], sessions: Session[]): Exercise[] {
  const out = exercises.slice()
  for (const s of sessions) for (const it of s.items ?? []) {
    if (out.some((e) => e.id === it.exercise)) continue
    const name = it.exercise.replace(/[-_]+/g, " ").replace(/^./, (c) => c.toUpperCase())
    out.push({ id: it.exercise, name, kind: it.sets?.some((x) => x.km || x.min) ? "cardio" : "weight" })
  }
  return out
}
/** For each session, the exercises it set a new best on (by name). */
export function newBests(exercises: Exercise[], sessions: Session[]): Map<string, string[]> {
  const out = new Map<string, string[]>()
  for (const ex of known(exercises, sessions)) for (const id of records(ex, sessions).beat.keys()) out.set(id, [...(out.get(id) ?? []), ex.name])
  return out
}

// MARK: The week and the plan

/** Sessions this week (Monday to Sunday), and the weekdays trained on (0 Monday). */
export function thisWeek(sessions: Session[], now = today()) {
  const mon = iso(weekStart(now)), sun = iso(addDays(weekStart(now), 6))
  const inWeek = sessions.filter((s) => s.date >= mon && s.date <= sun)
  return { count: inWeek.length, days: [...new Set(inWeek.map((s) => (parse(s.date).getDay() + 6) % 7))].sort() }
}
/** Which plan workout a session was: its workout id, or a workout of the same name. */
export const workoutOf = (s: Session, plan: Workout[]) =>
  plan.find((w) => w.id === s.workout) ?? plan.find((w) => w.name.trim().toLowerCase() === (s.name ?? "").trim().toLowerCase())
/** What's next: the plan's workout after the last one done (the first if none was), and the
 *  session done today, if there is one. */
export function nextUp(plan: Workout[], sessions: Session[], now = today()) {
  const day = iso(now)
  const past = chrono(sessions).filter((s) => s.date <= day)
  const last = [...past].reverse().find((s) => workoutOf(s, plan))
  const i = last ? plan.indexOf(workoutOf(last, plan)!) : -1
  return { next: plan.length ? plan[(i + 1) % plan.length] : null, today: [...past].reverse().find((s) => s.date === day) ?? null }
}
/** The sets an exercise had the last time it was done (up to today), or none. */
export function lastSets(sessions: Session[], id: string, now = today()): WorkSet[] {
  const h = history(sessions, id).filter((x) => x.session.date <= iso(now))
  return h.length ? h[h.length - 1].item.sets : []
}

export const slug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item"
const unique = (base: string, taken: string[]) => { let id = base, k = 2; while (taken.includes(id)) id = `${base}-${k++}`; return id }
export const newId = () => "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)

/** A new session: today, for a plan workout with its exercises and the sets each had last time. */
export function blank(sessions: Session[], workout?: Workout, now = today()): Session {
  return {
    id: newId(), date: iso(now), name: workout?.name ?? "Workout", ...(workout ? { workout: workout.id } : {}),
    items: (workout?.exercises ?? []).map((exercise) => ({ exercise, sets: lastSets(sessions, exercise, now).map((s) => ({ ...s })) })),
  }
}

export function useWorkouts() {
  const [exercises, setExercises] = useStore<Exercise[]>("exercises", [])
  const [plan, setPlan] = useStore<Workout[]>("plan", [])
  const [sessions, setSessions] = useStore<Session[]>("sessions", [])
  const [units, setUnits] = useStore<Units | null>("units", null)
  const [goal, setGoal] = useStore<number | null>("goal", null)
  const [started, setStarted] = useStore<string | null>("started", null)
  const ex = (exercises ?? []) as Exercise[], pl = (plan ?? []) as Workout[], ss = ((sessions ?? []) as Session[]).filter((s) => s && s.date)
  const u: Units = units === "lb" ? "lb" : "kg"
  const g = Math.max(1, Math.round(Number(goal) || 3))
  // A new log: nothing set up and nothing logged, so the plan is only a suggestion.
  const fresh = !started && !ss.length
  const week = thisWeek(ss)
  const { next } = nextUp(pl, ss)
  useEffect(() => {
    if (fresh) return
    setSummary(`${week.count} of ${g} sessions this week${next ? `, next: ${next.name}` : ""}`)
  }, [fresh, week.count, g, next?.name])
  const all = known(ex, ss)
  return {
    exercises: ex, plan: pl, sessions: ss, units: u, goal: g, fresh, all,
    exercise: (id: string) => all.find((e) => e.id === id) ?? { id, name: id, kind: "weight" as Kind },
    /** Sets the log up: the workouts picked, the sessions a week and the units; the log starts today. */
    start: async (picked: Workout[], weekly: number, un: Units) => {
      await setPlan(picked.map(({ pick: _, ...w }) => w))
      await setGoal(weekly)
      await setUnits(un)
      return setStarted(iso(today()))
    },
    /** Adds a session, or saves one that's there (same id). */
    saveSession: (s: Session) => setSessions((was: Session[]) => {
      const list = (was ?? []) as Session[]
      return list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [...list, s]
    }),
    removeSession: (id: string) => setSessions((was: Session[]) => ((was ?? []) as Session[]).filter((x) => x.id !== id)),
    restoreSessions: (all: Session[]) => setSessions(all),
    /** Adds an exercise and gives back its id (a slug of its name). */
    addExercise: (name: string, kind: Kind) => {
      const id = unique(slug(name), all.map((e) => e.id))
      setExercises([...ex, { id, name: name.trim(), kind }])
      return id
    },
    /** Renaming keeps the id, so its sessions and bests stay with it. */
    updateExercise: (id: string, patch: Partial<Omit<Exercise, "id">>) =>
      setExercises(ex.some((e) => e.id === id) ? ex.map((e) => (e.id === id ? { ...e, ...patch } : e)) : [...ex, { ...all.find((e) => e.id === id)!, ...patch }]),
    /** Takes an exercise off the list and out of the plan. Its sessions keep it. */
    removeExercise: async (id: string) => {
      await setExercises(ex.filter((e) => e.id !== id))
      return setPlan(pl.map((w) => ({ ...w, exercises: w.exercises.filter((x) => x !== id) })))
    },
    restore: async (was: { exercises?: Exercise[]; plan?: Workout[] }) => {
      if (was.exercises) await setExercises(was.exercises)
      if (was.plan) await setPlan(was.plan)
    },
    moveExercise: (id: string, by: number) => setExercises(moved(ex, id, by)),
    addWorkout: (name: string, list: string[]) => setPlan([...pl, { id: unique(slug(name), pl.map((w) => w.id)), name: name.trim(), exercises: list }]),
    updateWorkout: (id: string, patch: Partial<Omit<Workout, "id">>) => setPlan(pl.map((w) => (w.id === id ? { ...w, ...patch } : w))),
    removeWorkout: (id: string) => setPlan(pl.filter((w) => w.id !== id)),
    moveWorkout: (id: string, by: number) => setPlan(moved(pl, id, by)),
    setUnits: (v: Units) => setUnits(v),
    setGoal: (v: number) => setGoal(Math.max(1, Math.min(14, Math.round(v)))),
  }
}

function moved<T extends { id: string }>(list: T[], id: string, by: number): T[] {
  const i = list.findIndex((x) => x.id === id), j = i + by
  if (i < 0 || j < 0 || j >= list.length) return list
  const next = list.slice(); [next[i], next[j]] = [next[j], next[i]]
  return next
}
