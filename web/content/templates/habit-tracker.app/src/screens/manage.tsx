import { useState } from "react"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Row, Section, Sheet, Title, TintButton } from "@/components/kit"
import { useHabits, type Habit } from "@/lib/habits"

// The habits themselves: add, rename, reorder and remove. What's been ticked stays in the data.
export default function Manage() {
  const { habits, add, update, remove, restore, move } = useHabits()
  const [editing, setEditing] = useState<Habit | "new" | null>(null)
  const [name, setName] = useState("")
  const [detail, setDetail] = useState("")
  const [target, setTarget] = useState("1")
  const [unit, setUnit] = useState("")

  const open = (h: Habit | "new") => {
    setEditing(h)
    setName(h === "new" ? "" : h.name); setDetail(h === "new" ? "" : h.detail ?? "")
    setTarget(h === "new" ? "1" : String(h.target)); setUnit(h === "new" ? "" : h.unit ?? "")
  }
  const drop = async (h: Habit) => {
    const before = habits
    setEditing(null)
    await remove(h.id)
    offerUndo(`Removed ${h.name}`, () => restore(before))
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !editing) return
    const t = Math.max(1, Math.min(99, Math.round(Number(target) || 1)))
    const fields = { name: name.trim(), detail: detail.trim() || undefined, target: t, unit: t > 1 && unit.trim() ? unit.trim() : undefined }
    if (editing === "new") await add(Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as Omit<Habit, "id">)
    else await update(editing.id, fields)
    setEditing(null)
  }

  return (
    <>
      <Title title="Habits" action={<TintButton onClick={() => open("new")}><Plus /> Add</TintButton>} />
      <Section footer="A habit with a goal above 1 is counted, like 8 glasses of water. Removing a habit keeps what you ticked in the data.">
        {habits.length === 0 && <p className="px-4 py-6 text-center text-muted-foreground">No habits yet. Tap Add to make your first one.</p>}
        {habits.map((h, i) => (
          <Row key={h.id} className="gap-0 pr-1">
            <button type="button" aria-label={`Edit ${h.name}`} onClick={() => open(h)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{h.name}</p>
                <p className="truncate text-[0.875rem] text-muted-foreground">{h.target > 1 ? `${h.target} ${h.unit ?? ""} a day`.trim() : "Once a day"}{h.detail ? ` · ${h.detail}` : ""}</p>
              </div>
              <Pencil className="mr-1 size-4 shrink-0 text-muted-foreground" />
            </button>
            <button type="button" aria-label={`Move ${h.name} up`} disabled={i === 0} onClick={() => move(h.id, -1)} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><ChevronUp className="size-5" /></button>
            <button type="button" aria-label={`Move ${h.name} down`} disabled={i === habits.length - 1} onClick={() => move(h.id, 1)} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><ChevronDown className="size-5" /></button>
            <button type="button" aria-label={`Remove ${h.name}`} onClick={() => drop(h)} className="grid size-11 place-items-center rounded-full text-destructive"><Trash2 className="size-5" /></button>
          </Row>
        ))}
      </Section>
      <Sheet open={editing !== null} title={editing === "new" ? "New habit" : "Edit habit"} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <Field label="Name" htmlFor="habit-name"><input id="habit-name" className={inputClass} placeholder="Stretch" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
          <Field label="Why or how (optional)" htmlFor="habit-detail"><input id="habit-detail" className={inputClass} placeholder="Ten minutes after waking up" value={detail} onInput={(e) => setDetail(e.currentTarget.value)} /></Field>
          <div className="flex gap-3">
            <div className="w-28"><Field label="Times a day" htmlFor="habit-target"><input id="habit-target" type="number" inputMode="numeric" min={1} max={99} className={inputClass} value={target} onInput={(e) => setTarget(e.currentTarget.value)} /></Field></div>
            <div className="flex-1"><Field label="Unit (optional)" htmlFor="habit-unit"><input id="habit-unit" className={inputClass} placeholder="glasses" value={unit} onInput={(e) => setUnit(e.currentTarget.value)} /></Field></div>
          </div>
          <PrimaryButton type="submit" disabled={!name.trim()}>{editing === "new" ? "Add habit" : "Save"}</PrimaryButton>
          {editing && editing !== "new" && <DeleteButton onClick={() => drop(editing)}>Remove habit</DeleteButton>}
        </form>
      </Sheet>
    </>
  )
}
