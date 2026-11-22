import { useEffect, useState } from "react"
import { Check, Minus, Plus } from "lucide-react"
import { FirstScreen, Pills, PrimaryButton, Row, Section } from "@/components/kit"
import { useWorkouts, type Units, type Workout } from "@/lib/workouts"
import { cn } from "@/lib/utils"

/** What the person has on this screen right now, for App: when their AI sets the log up while they
 *  are here, what they picked isn't dropped without a word (App offers "Use mine"). touched: they
 *  changed something. mine: Start was pressed here, so the setup is theirs. */
export const draft: { touched: boolean; mine: boolean; use: (() => unknown) | null } = { touched: false, mine: false, use: null }

/** Pounds where they're what people lift in (the US, Liberia, Myanmar); kilograms everywhere else. */
export function guessUnits(lang = typeof navigator === "undefined" ? "" : navigator.language): Units {
  return /-(US|LR|MM)\b/i.test(lang) ? "lb" : "kg"
}

type Pick = { key: number; workout: Workout; on: boolean }
const picksOf = (plan: Workout[]): Pick[] => plan.map((workout, key) => ({ key, workout, on: workout.pick !== false }))

// A new log's first screen: the workouts done in turn (suggestions to tick, untick or rename), how
// many sessions a week, and kg or lb. Nothing is counted before Start. Everything here can be
// changed later under Plan.
export default function Setup() {
  const { plan, units, goal, exercise, start } = useWorkouts()
  const [picks, setPicks] = useState<Pick[]>(() => picksOf(plan))
  const [weekly, setWeekly] = useState(goal)
  const [un, setUn] = useState<Units>(() => units === "lb" ? "lb" : guessUnits())
  const [touched, setTouched] = useState(false)
  const seed = JSON.stringify(plan)
  useEffect(() => { if (!touched) setPicks(picksOf(plan)) }, [seed])
  useEffect(() => { draft.touched = false; draft.mine = false; draft.use = null }, [])

  const chosen = picks.filter((p) => p.on && p.workout.name.trim()).map((p) => ({ ...p.workout, name: p.workout.name.trim() }))
  draft.touched = touched
  draft.use = chosen.length ? () => start(chosen, weekly, un) : null
  const change = (key: number, patch: Partial<Pick>) => { setTouched(true); setPicks(picks.map((p) => (p.key === key ? { ...p, ...patch } : p))) }

  return (
    <FirstScreen title="Set up your training" lead="Tick the workouts you do in turn, and how often a week you want to train."
      ai="Pick here, or tell your AI and it sets this up." foot="Exercises, the order and the units can be changed any time under Plan.">
      <Section title="Workouts, in turn">
        {picks.map((p) => (
          <Row key={p.key} className="py-2">
            <button type="button" role="checkbox" aria-checked={p.on} aria-label={`Do ${p.workout.name || "this workout"}`} onClick={() => change(p.key, { on: !p.on })}
              className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none",
                p.on ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}>
              <Check className="size-4" strokeWidth={3} />
            </button>
            <div className="min-w-0 flex-1">
              <input aria-label={`Name of ${p.workout.name || "workout"}`} value={p.workout.name} onInput={(e) => change(p.key, { workout: { ...p.workout, name: e.currentTarget.value } })}
                className="h-8 w-full rounded-md bg-transparent text-[1.0625rem] font-semibold text-foreground focus:bg-[var(--amber-field)] focus:px-2 focus:outline-2 focus:outline-ring" />
              <p className="truncate text-[0.875rem] text-muted-foreground">{p.workout.exercises.map((id) => exercise(id).name).join(", ")}</p>
            </div>
          </Row>
        ))}
      </Section>
      <Section>
        <Row>
          <span className="flex-1 font-medium">Sessions a week</span>
          <button type="button" aria-label="Fewer sessions a week" disabled={weekly <= 1} onClick={() => { setTouched(true); setWeekly(weekly - 1) }} className="grid size-11 place-items-center rounded-full bg-muted disabled:opacity-25"><Minus className="size-5" /></button>
          <span className="w-8 text-center text-[1.0625rem] font-semibold tabular-nums" data-testid="setup-goal">{weekly}</span>
          <button type="button" aria-label="More sessions a week" disabled={weekly >= 14} onClick={() => { setTouched(true); setWeekly(weekly + 1) }} className="grid size-11 place-items-center rounded-full bg-muted disabled:opacity-25"><Plus className="size-5" /></button>
        </Row>
        <Row>
          <span className="flex-1 font-medium">Units</span>
          <Pills label="Units" options={["kg", "lb"] as const} value={un} onChange={(v) => { setTouched(true); setUn(v) }} />
        </Row>
      </Section>
      <PrimaryButton disabled={!chosen.length} onClick={() => { draft.mine = true; return start(chosen, weekly, un) }}>
        {chosen.length ? `Start with ${chosen.length} ${chosen.length === 1 ? "workout" : "workouts"}` : "Pick a workout to start"}
      </PrimaryButton>
    </FirstScreen>
  )
}
