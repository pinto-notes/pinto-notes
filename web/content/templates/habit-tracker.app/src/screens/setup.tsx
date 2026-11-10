import { useState } from "react"
import { Check, Plus } from "lucide-react"
import { inputClass, PrimaryButton, Row, Section, Title, TintButton } from "@/components/kit"
import { schedule, useHabits, type Habit } from "@/lib/habits"
import { cn } from "@/lib/utils"

type Pick = { key: number; habit: Omit<Habit, "id">; on: boolean }

// A new tracker's first screen: the person picks their habits before anything is counted. The
// habits the tracker starts with are suggestions: untick one to leave it out, change its name, add
// your own, then Start. Nothing here is a score: no ring, no "of 8" (council round 3: a new tracker
// opened on "0 of 8 since Monday" for four habits nobody had chosen). Everything can be changed
// later under Habits.
export default function Setup() {
  const { habits, start } = useHabits()
  const [picks, setPicks] = useState<Pick[]>(() => habits.map(({ id: _, ...habit }, key) => ({ key, habit, on: true })))
  const [own, setOwn] = useState("")
  const chosen = picks.filter((p) => p.on && p.habit.name.trim())
  const change = (key: number, patch: Partial<Pick>) => setPicks(picks.map((p) => (p.key === key ? { ...p, ...patch } : p)))
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const name = own.trim()
    if (!name) return
    setPicks([...picks, { key: Math.max(-1, ...picks.map((p) => p.key)) + 1, habit: { name, target: 1 }, on: true }])
    setOwn("")
  }
  const line = (h: Omit<Habit, "id">) => [h.target > 1 ? `${h.target} ${h.unit ?? "times"} a day` : schedule({ ...h, id: "" }), h.detail].filter(Boolean).join(" · ")

  return (
    <div className="mx-auto max-w-xl">
      <Title title="Pick your habits" />
      <p className="-mt-3 pb-5 text-muted-foreground text-balance">Two or three are plenty. Untick or rename the rest.</p>
      <Section title={picks.length ? "Suggestions" : undefined}>
        {picks.map((p) => (
          <Row key={p.key} className="py-2">
            <button type="button" role="checkbox" aria-checked={p.on} aria-label={`Track ${p.habit.name || "this habit"}`} onClick={() => change(p.key, { on: !p.on })}
              className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none",
                p.on ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}>
              <Check className="size-4" strokeWidth={3} />
            </button>
            <div className={cn("min-w-0 flex-1", !p.on && "opacity-50")}>
              <input aria-label={`Name of ${p.habit.name || "habit"}`} value={p.habit.name} onInput={(e) => change(p.key, { habit: { ...p.habit, name: e.currentTarget.value } })}
                className="h-8 w-full rounded-md bg-transparent text-[1.0625rem] font-semibold text-foreground focus:bg-[var(--amber-field)] focus:px-2 focus:outline-2 focus:outline-ring" />
              <p className="truncate text-[0.875rem] text-muted-foreground">{line(p.habit)}</p>
            </div>
          </Row>
        ))}
        <form onSubmit={add} className={cn("flex items-center gap-2 px-4 py-3", picks.length > 0 && "border-t border-border")}>
          <input aria-label="Add your own" placeholder="Add your own, like Stretch" className={inputClass} value={own} onInput={(e) => setOwn(e.currentTarget.value)} />
          <TintButton type="submit" disabled={!own.trim()} aria-label="Add"><Plus /> Add</TintButton>
        </form>
      </Section>
      <PrimaryButton disabled={!chosen.length} onClick={() => start(chosen.map((p) => ({ ...p.habit, name: p.habit.name.trim() })))}>
        {chosen.length ? `Start with ${chosen.length} ${chosen.length === 1 ? "habit" : "habits"}` : "Pick a habit to start"}
      </PrimaryButton>
      <p className="px-1 pt-3 text-center text-[0.8125rem] text-muted-foreground text-balance">Counting starts today. How often, goals and the order are under Habits.</p>
    </div>
  )
}
