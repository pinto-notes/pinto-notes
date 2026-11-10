import { useEffect, useState } from "react"
import { Check, Plus } from "lucide-react"
import { FirstScreen, inputClass, PrimaryButton, Row, Section, TintButton } from "@/components/kit"
import { schedule, useHabits, type Habit } from "@/lib/habits"
import { cn } from "@/lib/utils"

type Pick = { key: number; habit: Omit<Habit, "id">; on: boolean }

/** What the person has on this screen right now, for App: when their AI sets the tracker up while
 *  they are here, what they picked isn't dropped without a word (App offers "Use mine"). touched:
 *  they changed something. mine: Start was pressed here, so the setup is theirs. */
export const draft: { touched: boolean; mine: boolean; use: (() => unknown) | null } = { touched: false, mine: false, use: null }

const picksOf = (habits: Habit[]): Pick[] => habits.map(({ id: _, pick, ...habit }, key) => ({ key, habit, on: pick !== false }))

// A new tracker's first screen: the person picks their habits before anything is counted. The
// habits the tracker starts with are suggestions: three ticked and one not (the line over them says
// two or three are plenty, so the button can't open on "Start with 4 habits"). Tick or untick one,
// change its name, add your own, then Start. Nothing here is a score: no ring, no "of 8" (council
// round 3: a new tracker opened on "0 of 8 since Monday" for four habits nobody had chosen). An
// unticked suggestion is as readable as a ticked one: the tick alone shows the pick (round 4: it was
// dimmed like a control that's turned off). Everything can be changed later under Habits.
export default function Setup() {
  const { habits, start } = useHabits()
  const [picks, setPicks] = useState<Pick[]>(() => picksOf(habits))
  const [own, setOwn] = useState("")
  const [touched, setTouched] = useState(false)
  // The suggestions themselves changed (the person's AI wrote others) and nothing was touched here.
  const seed = JSON.stringify(habits)
  useEffect(() => { if (!touched) setPicks(picksOf(habits)) }, [seed])
  useEffect(() => { draft.touched = false; draft.mine = false; draft.use = null }, [])

  const typed = own.trim()
  // What Start would save: the ticked ones, and a name still sitting in the field.
  const chosen = [...picks.filter((p) => p.on && p.habit.name.trim()).map((p) => ({ ...p.habit, name: p.habit.name.trim() })),
    ...(typed ? [{ name: typed, target: 1 }] : [])]
  draft.touched = touched || !!typed
  draft.use = chosen.length ? () => start(chosen) : null

  const change = (key: number, patch: Partial<Pick>) => { setTouched(true); setPicks(picks.map((p) => (p.key === key ? { ...p, ...patch } : p))) }
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typed) return
    setTouched(true)
    setPicks([...picks, { key: Math.max(-1, ...picks.map((p) => p.key)) + 1, habit: { name: typed, target: 1 }, on: true }])
    setOwn("")
  }
  const line = (h: Omit<Habit, "id">) => [h.target > 1 ? `${h.target} ${h.unit ?? "times"} a day` : schedule({ ...h, id: "" }), h.detail].filter(Boolean).join(" · ")

  return (
    <FirstScreen title="Pick your habits" lead="Two or three are plenty. Tick the ones you want, or rename them."
      ai="Pick here, or tell your AI and it sets this up." foot="Counting starts today. How often, goals and the order are under Habits.">
      <Section title={picks.length ? "Suggestions" : undefined}>
        {picks.map((p) => (
          <Row key={p.key} className="py-2">
            <button type="button" role="checkbox" aria-checked={p.on} aria-label={`Track ${p.habit.name || "this habit"}`} onClick={() => change(p.key, { on: !p.on })}
              className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none",
                p.on ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}>
              <Check className="size-4" strokeWidth={3} />
            </button>
            <div className="min-w-0 flex-1">
              <input aria-label={`Name of ${p.habit.name || "habit"}`} value={p.habit.name} onInput={(e) => change(p.key, { habit: { ...p.habit, name: e.currentTarget.value } })}
                className="h-8 w-full rounded-md bg-transparent text-[1.0625rem] font-semibold text-foreground focus:bg-[var(--amber-field)] focus:px-2 focus:outline-2 focus:outline-ring" />
              <p className="truncate text-[0.875rem] text-muted-foreground">{line(p.habit)}</p>
            </div>
          </Row>
        ))}
        <form onSubmit={add} className={cn("flex items-center gap-2 px-4 py-3", picks.length > 0 && "border-t border-border")}>
          <input aria-label="Add your own" placeholder="Add your own, like Stretch" className={inputClass} value={own} onInput={(e) => setOwn(e.currentTarget.value)} />
          <TintButton type="submit" disabled={!typed} aria-label="Add"><Plus /> Add</TintButton>
        </form>
      </Section>
      <PrimaryButton disabled={!chosen.length} onClick={() => { draft.mine = true; return start(chosen) }}>
        {chosen.length ? `Start with ${chosen.length} ${chosen.length === 1 ? "habit" : "habits"}` : "Pick a habit to start"}
      </PrimaryButton>
    </FirstScreen>
  )
}
