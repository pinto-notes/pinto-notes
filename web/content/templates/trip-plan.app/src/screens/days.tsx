import { useLayoutEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Section, Sheet, Title, TintButton } from "@/components/kit"
import { between, iso, longDate, useTrip, type Day } from "@/lib/trip"
import { cn } from "@/lib/utils"

// The plan, a section a day. Add a day, edit one (its date, title and plan) or delete it. During
// the trip, today is marked.
export default function Days() {
  const { trip, days, saveDay, removeDay, restoreDays } = useTrip()
  const [editing, setEditing] = useState<Day | "new" | null>(null)
  const today = iso(new Date())
  const drop = async (d: Day) => {
    const before = days
    setEditing(null)
    await removeDay(d.date)
    offerUndo(`Deleted ${longDate(d.date)}`, () => restoreDays(before))
  }
  return (
    <>
      <Title title="Days" subtitle={trip ? trip.name : undefined} action={<TintButton onClick={() => setEditing("new")}><Plus /> Add day</TintButton>} />
      {!days.length && <p className="py-6 text-center text-muted-foreground">No days planned yet. Tap Add day to plan the first one, or ask your AI for a day-by-day plan.</p>}
      <div className="grid gap-x-6 min-[900px]:grid-cols-2">
        {days.map((d) => {
          const n = trip ? between(trip.start, d.date) + 1 : 0
          return (
            <Section key={d.date} title={`${n > 0 ? `Day ${n} · ` : ""}${longDate(d.date)}`} className={cn(d.date === today && "[&>div:last-child]:ring-2 [&>div:last-child]:ring-[var(--amber-accent)]")}
              action={<button type="button" aria-label={`Edit ${longDate(d.date)}`} onClick={() => setEditing(d)} className="-my-2 grid size-11 place-items-center rounded-full text-primary"><Pencil className="size-4" /></button>}>
              {d.title && <p className="px-4 pt-3 font-semibold">{d.title}</p>}
              <ul className="px-4 py-2">
                {d.items.map((it, i) => (
                  <li key={i} className="flex gap-3 py-1.5">
                    <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-[var(--amber-accent)]" aria-hidden="true" />
                    <span className="min-w-0 flex-1">{it}</span>
                  </li>
                ))}
                {!d.items.length && <li className="py-1.5 text-muted-foreground">Nothing planned yet.</li>}
              </ul>
            </Section>
          )
        })}
      </div>
      <DaySheet day={editing} onClose={() => setEditing(null)} onSave={async (d, was) => { await saveDay(d, was); setEditing(null) }} onDelete={drop}
        suggest={days.length ? iso(new Date(new Date(days[days.length - 1].date + "T12:00:00").getTime() + 86400000)) : trip?.start ?? today} />
    </>
  )
}

function DaySheet({ day, suggest, onClose, onSave, onDelete }: { day: Day | "new" | null; suggest: string; onClose: () => void; onSave: (d: Day, was?: string) => unknown; onDelete: (d: Day) => unknown }) {
  const [date, setDate] = useState("")
  const [title, setTitle] = useState("")
  const [plan, setPlan] = useState("")
  useLayoutEffect(() => {
    if (!day) return
    setDate(day === "new" ? suggest : day.date); setTitle(day === "new" ? "" : day.title ?? ""); setPlan(day === "new" ? "" : day.items.join("\n"))
  }, [day])
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const items = plan.split("\n").map((l) => l.replace(/^\s*[-*•]\s*/, "").trim()).filter(Boolean)
    onSave({ date, ...(title.trim() ? { title: title.trim() } : {}), items }, day && day !== "new" ? day.date : undefined)
  }
  return (
    <Sheet open={day !== null} title={day === "new" ? "New day" : "Edit day"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Date" htmlFor="d-date"><input id="d-date" type="date" className={inputClass} value={date} onInput={(e) => setDate(e.currentTarget.value)} /></Field>
        <Field label="Title (optional)" htmlFor="d-title"><input id="d-title" className={inputClass} placeholder="Alfama on foot" value={title} onInput={(e) => setTitle(e.currentTarget.value)} /></Field>
        <Field label="Plan, one line each" htmlFor="d-plan"><textarea id="d-plan" rows={5} className={cn(inputClass, "h-auto py-2")} placeholder={"Tram 28 before 9\nLunch at a tasca"} value={plan} onInput={(e) => setPlan(e.currentTarget.value)} /></Field>
        <PrimaryButton type="submit" disabled={!ok}>{day === "new" ? "Save day" : "Save"}</PrimaryButton>
        {day && day !== "new" && <DeleteButton onClick={() => onDelete(day)}>Delete day</DeleteButton>}
      </form>
    </Sheet>
  )
}
