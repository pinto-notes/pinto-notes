import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it. The
// whole shape is described in docs/README.md.
//   stages:   [{ id, name }]  the board's columns, in order. "saved", "applied" and "closed" mean
//             something (not sent yet, sent and waiting, finished); every other stage is "talking".
//   jobs:     [{ id, company, role, link?, salary?, contact?, stage, outcome?, applied?, heard?,
//               notes?, steps: [{ id, kind, what?, date, time?, done? }], questions: [{ q, a }], ask: [text] }]
//             in board order (a column shows its stage's jobs in this order)
//   settings: { followUpDays }  a follow-up this many days after you apply (0: none)
//   started:  "yyyy-mm-dd"  set with the first application; without it a new app opens on its first screen
export type Stage = { id: string; name: string }
export type StepKind = "interview" | "follow-up" | "deadline"
export type Step = { id: string; kind: StepKind; what?: string; date: string; time?: string; done?: boolean }
export type Question = { q: string; a?: string }
export type Outcome = "rejected" | "withdrew" | "no-reply"
export type Job = {
  id: string; company: string; role: string; link?: string; salary?: string; contact?: string
  stage: string; outcome?: Outcome; applied?: string; heard?: string; notes?: string
  steps?: Step[]; questions?: Question[]; ask?: string[]
}
export type Settings = { followUpDays: number }

export const DEFAULT_STAGES: Stage[] = [
  { id: "saved", name: "Saved" }, { id: "applied", name: "Applied" }, { id: "interview", name: "Interview" },
  { id: "offer", name: "Offer" }, { id: "closed", name: "Closed" },
]
export const KINDS: { kind: StepKind; label: string }[] = [
  { kind: "interview", label: "Interview" }, { kind: "follow-up", label: "Follow up" }, { kind: "deadline", label: "Apply by" },
]
export const OUTCOMES: { outcome: Outcome; label: string }[] = [
  { outcome: "rejected", label: "They said no" }, { outcome: "withdrew", label: "I withdrew" }, { outcome: "no-reply", label: "No reply" },
]
export const kindLabel = (k: StepKind) => KINDS.find((x) => x.kind === k)?.label ?? "Date"
export const outcomeLabel = (o?: Outcome) => OUTCOMES.find((x) => x.outcome === o)?.label

// Dates are "yyyy-mm-dd" in the person's own day; times "hh:mm".
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const today = () => iso(new Date())
const noon = (s: string) => new Date(s + "T12:00:00")
export const addDays = (s: string, n: number) => { const d = noon(s); d.setDate(d.getDate() + n); return iso(d) }
/** Whole days from a to b. */
export const between = (a: string, b: string) => Math.round((noon(b).getTime() - noon(a).getTime()) / 86400000)
export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)
export const isTime = (s: unknown): s is string => typeof s === "string" && /^\d{1,2}:\d{2}$/.test(s)
/** "Thu 12 Nov", or "Today", "Tomorrow", "Yesterday" near today. */
export function day(s: string, now = today()) {
  const n = between(now, s)
  if (n === 0) return "Today"
  if (n === 1) return "Tomorrow"
  if (n === -1) return "Yesterday"
  return noon(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}
export const shortDate = (s: string) => noon(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
export const when = (s: Step, now = today()) => `${day(s.date, now)}${s.time ? `, ${s.time}` : ""}`
export const stepName = (s: Step) => s.what?.trim() || kindLabel(s.kind)
export const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
export const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stage"

/** A stage's place: "saved" before you apply, "applied" waiting, "closed" finished, anything else talking. */
const QUIET = new Set(["saved", "applied", "closed"])
/** Sent: applied on a date, or in a stage after Saved, or closed after they said no or never replied. */
export const sent = (j: Job) => !!j.applied || !QUIET.has(j.stage) || j.stage === "applied" || j.outcome === "rejected" || j.outcome === "no-reply"
/** Heard back: they answered at all, a yes to talk or a no. */
export const heardBack = (j: Job) => sent(j) && (!!j.heard || !QUIET.has(j.stage) || j.outcome === "rejected")

/** The share of sent applications that heard back. */
export function responses(jobs: Job[]) {
  const out = jobs.filter(sent), back = out.filter(heardBack).length
  return { sent: out.length, heard: back, rate: out.length ? Math.round((back / out.length) * 100) : 0 }
}

const steps = (j: Job) => (Array.isArray(j.steps) ? j.steps : []).filter((s) => s && isDate(s.date))
const order = (a: { date: string; time?: string }, b: { date: string; time?: string }) => (a.date + (a.time ?? "99:99") < b.date + (b.time ?? "99:99") ? -1 : 1)
/** The next thing to do for an application: its earliest step not done. */
export const nextStep = (j: Job) => steps(j).filter((s) => !s.done).sort(order)[0]
export type DueItem = { job: Job; step: Step; late: number }
/** Steps not done, on open applications: due (today or before) and coming up (the next two weeks). */
export function agenda(jobs: Job[], now = today()) {
  const all: DueItem[] = []
  for (const j of jobs) {
    if (j.stage === "closed") continue
    for (const s of steps(j)) if (!s.done) all.push({ job: j, step: s, late: between(s.date, now) })
  }
  all.sort((a, b) => order(a.step, b.step))
  return { due: all.filter((x) => x.late >= 0), soon: all.filter((x) => x.late < 0 && x.late >= -14) }
}

/** Jobs from data.json, made safe to show: an AI or an older version may leave a field out. */
function clean(raw: unknown, stages: Stage[]): Job[] {
  if (!Array.isArray(raw)) return []
  const first = stages[0]?.id ?? "saved"
  return raw.filter((j) => j && typeof j === "object" && (j.company || j.role)).map((j, i) => ({
    ...j, id: String(j.id ?? `j${i + 1}`), company: String(j.company ?? ""), role: String(j.role ?? ""),
    stage: stages.some((s) => s.id === j.stage) ? j.stage : (stages.find((s) => s.name.toLowerCase() === String(j.stage ?? "").toLowerCase())?.id ?? first),
  }))
}

export function useJobs() {
  const [rawStages, setStages] = useStore<Stage[]>("stages", DEFAULT_STAGES)
  const [rawJobs, setJobs] = useStore<Job[]>("jobs", [])
  const [rawSettings, setSettings] = useStore<Settings>("settings", { followUpDays: 7 })
  const [started, setStarted] = useStore<string | null>("started", null)
  const stages = (Array.isArray(rawStages) && rawStages.length ? rawStages : DEFAULT_STAGES).filter((s) => s && s.id)
  const jobs = clean(rawJobs, stages)
  const settings: Settings = { followUpDays: 7, ...(rawSettings ?? {}) }
  const now = today()
  const { due, soon } = agenda(jobs, now)
  const open = jobs.filter((j) => j.stage !== "closed").length
  useEffect(() => {
    if (!jobs.length) return
    setSummary(`${open} open ${open === 1 ? "application" : "applications"}${due.length ? `, ${due.length} due` : ""}`)
  }, [open, due.length, jobs.length])

  const save = (all: Job[]) => setJobs(all)
  /** Changes the jobs as they are now in data.json (not as this screen last drew them), so a write
   *  never drops what the person's AI added a moment ago. */
  const edit = (fn: (all: Job[]) => Job[]) => setJobs((cur: unknown) => fn(clean(cur, stages)))
  const patch = (id: string, p: Partial<Job>) => edit((all) => all.map((j) => (j.id === id ? { ...j, ...p } : j)))
  const withStep = (j: Job, at: string) => settings.followUpDays > 0 && !steps(j).some((s) => s.kind === "follow-up" && !s.done)
    ? [...steps(j), { id: newId("s"), kind: "follow-up" as const, date: addDays(at, settings.followUpDays) }] : steps(j)

  /** Moves a job to a stage (to index among that stage's jobs, or the end). Leaving Saved for the
   *  first time sets the day you applied and, moving to Applied with followUpDays, a follow-up; a
   *  stage past Applied, or a no, sets the day you heard back. */
  const move = (id: string, stage: string, index?: number, outcome?: Outcome, also?: Partial<Job>) => edit((all) => {
    const found = all.find((j) => j.id === id)
    if (!found || !stages.some((s) => s.id === stage)) return all
    const next: Job = { ...found, ...also, stage }
    if (stage === "closed") { if (outcome) next.outcome = outcome; else if (found.stage !== "closed") delete next.outcome }
    else delete next.outcome
    if (!next.applied && stage !== "saved" && stage !== stages[0]?.id && (stage !== "closed" || outcome === "rejected" || outcome === "no-reply")) {
      next.applied = now
      if (stage === "applied") next.steps = withStep(next, now)
    }
    if ((!QUIET.has(stage) || outcome === "rejected") && !next.heard) next.heard = now
    const rest = all.filter((j) => j.id !== id)
    const inStage = rest.filter((j) => j.stage === stage)
    if (index === undefined || index >= inStage.length) {
      // After the stage's last job, or at the end.
      rest.splice(inStage.length ? rest.indexOf(inStage[inStage.length - 1]) + 1 : rest.length, 0, next)
    } else rest.splice(rest.indexOf(inStage[Math.max(0, index)]), 0, next)
    return rest
  })

  return {
    stages, jobs, settings, started: started ?? null, due, soon, open, now,
    responses: responses(jobs),
    byStage: (id: string) => jobs.filter((j) => j.stage === id),
    job: (id: string) => jobs.find((j) => j.id === id),
    stageName: (id: string) => stages.find((s) => s.id === id)?.name ?? id,
    move,
    /** One place up or down within its stage. */
    nudge: (id: string, by: -1 | 1) => {
      const job = jobs.find((j) => j.id === id)
      if (!job) return
      const col = jobs.filter((j) => j.stage === job.stage), i = col.indexOf(job)
      if (i + by < 0 || i + by >= col.length) return
      return move(id, job.stage, i + by)
    },
    add: async (j: Omit<Job, "id">) => {
      const job: Job = { steps: [], questions: [], ask: [], ...j, id: newId("j") }
      if (job.stage !== (stages[0]?.id ?? "saved") && job.stage !== "saved" && job.stage !== "closed" && !job.applied) {
        job.applied = now
        if (job.stage === "applied") job.steps = withStep(job, now)
      }
      await edit((all) => [...all, job])
      if (!started) await setStarted(now)
      return job
    },
    update: patch,
    remove: (id: string) => edit((all) => all.filter((j) => j.id !== id)),
    restore: (all: Job[]) => save(all),
    /** Every application in one stage to another (a stage being removed). */
    moveAll: (from: string, to: string) => edit((all) => all.map((j) => (j.stage === from ? { ...j, stage: to } : j))),
    setStep: (id: string, step: Step) => edit((all) => all.map((j) => (j.id === id ? { ...j, steps: [...steps(j).filter((s) => s.id !== step.id), step].sort(order) } : j))),
    removeStep: (id: string, stepId: string) => edit((all) => all.map((j) => (j.id === id ? { ...j, steps: steps(j).filter((s) => s.id !== stepId) } : j))),
    toggleStep: (id: string, stepId: string) => edit((all) => all.map((j) => (j.id === id ? { ...j, steps: steps(j).map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)) } : j))),
    setStages: (all: Stage[]) => setStages(all),
    setSettings: (s: Settings) => setSettings(s),
    start: () => setStarted(now),
  }
}
