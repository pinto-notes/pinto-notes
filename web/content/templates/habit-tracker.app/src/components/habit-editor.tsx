import { useLayoutEffect, useState } from "react"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Sheet } from "@/components/kit"
import { LETTERS, useHabits, WEEKDAYS, type Habit } from "@/lib/habits"
import { cn } from "@/lib/utils"

const KINDS = ["Every day", "Some days", "A week"] as const
type Kind = (typeof KINDS)[number]

// Add or change a habit: its name, why, how often (every day, some weekdays, or a number of times a
// week) and a goal for a count. Changing it keeps its days. Remove is at the bottom, with Undo.
export function HabitEditor({ editing, onClose }: { editing: Habit | "new" | null; onClose: () => void }) {
  const { habits, add, update, remove, restore } = useHabits()
  const [name, setName] = useState("")
  const [detail, setDetail] = useState("")
  const [target, setTarget] = useState("1")
  const [unit, setUnit] = useState("")
  const [kind, setKind] = useState<Kind>("Every day")
  const [wds, setWds] = useState<number[]>([0, 1, 2, 3, 4])
  const [perWeek, setPerWeek] = useState("3")
  useLayoutEffect(() => {
    if (!editing) return
    const h = editing === "new" ? null : editing
    setName(h?.name ?? ""); setDetail(h?.detail ?? ""); setTarget(String(h?.target ?? 1)); setUnit(h?.unit ?? "")
    setKind(h?.perWeek ? "A week" : h?.days?.length && h.days.length < 7 ? "Some days" : "Every day")
    setWds(h?.days?.length ? h.days : [0, 1, 2, 3, 4]); setPerWeek(String(h?.perWeek ?? 3))
  }, [editing])

  const drop = async (h: Habit) => {
    const before = habits
    onClose()
    await remove(h.id)
    offerUndo(`Removed ${h.name}`, () => restore(before))
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !editing) return
    const t = Math.max(1, Math.min(99, Math.round(Number(target) || 1)))
    const fields: Partial<Habit> = {
      name: name.trim(), detail: detail.trim() || undefined, target: t, unit: t > 1 && unit.trim() ? unit.trim() : undefined,
      days: kind === "Some days" && wds.length && wds.length < 7 ? wds.slice().sort() : undefined,
      perWeek: kind === "A week" ? Math.max(1, Math.min(7, Math.round(Number(perWeek) || 1))) : undefined,
    }
    if (editing === "new") await add(Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as Omit<Habit, "id">)
    else await update(editing.id, fields)
    onClose()
  }

  return (
    <Sheet open={editing !== null} title={editing === "new" ? "New habit" : "Edit habit"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Name" htmlFor="habit-name"><input id="habit-name" className={inputClass} placeholder="Stretch" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
        <Field label="Why or how (optional)" htmlFor="habit-detail"><input id="habit-detail" className={inputClass} placeholder="Ten minutes after waking up" value={detail} onInput={(e) => setDetail(e.currentTarget.value)} /></Field>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">How often</p>
          <Pills label="How often" options={KINDS} value={kind} onChange={setKind} />
          {kind === "Some days" && (
            <div className="mt-3 flex justify-between gap-1" role="group" aria-label="Days">
              {LETTERS.map((l, i) => {
                const on = wds.includes(i)
                return (
                  <button key={i} type="button" aria-label={WEEKDAYS[i]} aria-pressed={on}
                    onClick={() => setWds(on ? wds.filter((x) => x !== i) : [...wds, i])}
                    className={cn("grid size-11 place-items-center rounded-full text-[0.9375rem] font-semibold", on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{l}</button>
                )
              })}
            </div>
          )}
          {kind === "A week" && (
            <div className="mt-3 flex items-center gap-3">
              <input id="habit-per-week" aria-label="Times a week" type="number" inputMode="numeric" min={1} max={7} className={cn(inputClass, "w-20 text-center")} value={perWeek} onInput={(e) => setPerWeek(e.currentTarget.value)} />
              <span className="text-muted-foreground">times a week, any days</span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <div className="w-28"><Field label="Times a day" htmlFor="habit-target"><input id="habit-target" type="number" inputMode="numeric" min={1} max={99} className={inputClass} value={target} onInput={(e) => setTarget(e.currentTarget.value)} /></Field></div>
          <div className="flex-1"><Field label="Unit (optional)" htmlFor="habit-unit"><input id="habit-unit" className={inputClass} placeholder="glasses" value={unit} onInput={(e) => setUnit(e.currentTarget.value)} /></Field></div>
        </div>
        <PrimaryButton type="submit" disabled={!name.trim() || (kind === "Some days" && !wds.length)}>{editing === "new" ? "Add habit" : "Save"}</PrimaryButton>
        {editing && editing !== "new" && <DeleteButton onClick={() => drop(editing)}>Remove habit</DeleteButton>}
      </form>
    </Sheet>
  )
}
