import { useState } from "react"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react"
import { offerUndo, Row, Section, Title, TintButton } from "@/components/kit"
import { HabitEditor } from "@/components/habit-editor"
import { schedule, useHabits, type Habit } from "@/lib/habits"

// The habits themselves: add, rename, schedule, reorder and remove. What's been ticked stays in the data.
export default function Manage() {
  const { habits, remove, restore, move } = useHabits()
  const [editing, setEditing] = useState<Habit | "new" | null>(null)
  const drop = async (h: Habit) => {
    const before = habits
    await remove(h.id)
    offerUndo(`Removed ${h.name}`, () => restore(before))
  }

  return (
    <div className="max-w-2xl">
      <Title title="Habits" action={<TintButton onClick={() => setEditing("new")}><Plus /> Add</TintButton>} />
      <Section footer="Set how often each habit is for: every day, some weekdays, or a number of times a week. A goal above 1 is counted, like 8 glasses of water. Removing a habit keeps what you ticked in the data.">
        {habits.length === 0 && <p className="px-4 py-6 text-center text-muted-foreground">No habits yet. Tap Add to make your first one.</p>}
        {habits.map((h, i) => (
          <Row key={h.id} className="gap-0 pr-1">
            <button type="button" aria-label={`Edit ${h.name}`} onClick={() => setEditing(h)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{h.name}</p>
                <p className="truncate text-[0.875rem] text-muted-foreground">{schedule(h)}{h.target > 1 ? ` · ${h.target} ${h.unit ?? ""} a day`.trimEnd() : ""}{h.detail ? ` · ${h.detail}` : ""}</p>
              </div>
              <Pencil className="mr-1 size-4 shrink-0 text-muted-foreground" />
            </button>
            <button type="button" aria-label={`Move ${h.name} up`} disabled={i === 0} onClick={() => move(h.id, -1)} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><ChevronUp className="size-5" /></button>
            <button type="button" aria-label={`Move ${h.name} down`} disabled={i === habits.length - 1} onClick={() => move(h.id, 1)} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><ChevronDown className="size-5" /></button>
            <button type="button" aria-label={`Remove ${h.name}`} onClick={() => drop(h)} className="grid size-11 place-items-center rounded-full text-destructive"><Trash2 className="size-5" /></button>
          </Row>
        ))}
      </Section>
      <HabitEditor editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
