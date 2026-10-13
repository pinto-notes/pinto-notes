import { useLayoutEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Section, Sheet, Title, TintButton } from "@/components/kit"
import { ShareButton, Timeline } from "@/components/timeline"
import { between, dayText, iso, longDate, range, useTrip, type Day } from "@/lib/trip"
import { cn } from "@/lib/utils"

// The plan as a timeline, a card a day: the day's lines and its bookings, by time. Every day of the
// trip has a card, planned or not. Share sends a day (or the whole trip) as text; the pencil edits a
// day's date, title and plan. During the trip, today is marked. Two columns on a wide note.
export default function Days() {
  const { trip, days, bookings, saveDay, removeDay, restoreDays } = useTrip()
  const [editing, setEditing] = useState<Day | "new" | null>(null)
  const today = iso(new Date())
  const drop = async (d: Day) => {
    const before = days
    setEditing(null)
    await removeDay(d.date)
    offerUndo(`Deleted ${longDate(d.date)}`, () => restoreDays(before))
  }
  // Every date of the trip, and any planned day outside it.
  const dates = new Set(days.map((d) => d.date))
  if (trip?.start) for (let i = 0, n = between(trip.start, trip.end || trip.start); i <= n && i < 60; i++) dates.add(plus(trip.start, i))
  for (const b of bookings) if (b.date) dates.add(b.date)
  const all = [...dates].sort()
  const tripText = () => all.map((d) => dayText(trip, days.find((x) => x.date === d), bookings, d)).join("\n\n")
  return (
    <>
      <Title title="Days" subtitle={trip ? `${trip.name} · ${range(trip)}` : undefined} action={<TintButton onClick={() => setEditing("new")}><Plus /> Add day</TintButton>} />
      {!all.length && <p className="py-6 text-center text-muted-foreground">No days planned yet. Tap Add day to plan the first one, or ask your AI for a day-by-day plan.</p>}
      {all.length > 0 && (
        <div className="-mt-2 mb-4 flex items-center gap-2 px-1">
          <p className="min-w-0 flex-1 text-[0.875rem] text-muted-foreground">Start a line with a time (09:30) to put it in order. Bookings with a date join their day.</p>
          <ShareButton label="Share the whole trip" name={`${trip?.name ?? "Trip"} plan.txt`} text={tripText} />
        </div>
      )}
      <div className="grid gap-x-6 min-[900px]:grid-cols-2">
        {all.map((date) => {
          const d = days.find((x) => x.date === date)
          const n = trip ? between(trip.start, date) + 1 : 0
          const name = longDate(date)
          return (
            <Section key={date} title={`${n > 0 ? `Day ${n} · ` : ""}${new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${date === today ? " · Today" : ""}`}
              className={cn(date === today && "[&>div:last-child]:ring-2 [&>div:last-child]:ring-[var(--amber-accent)]")}
              action={
                <div className="flex items-center">
                  <ShareButton label={`Share ${name}`} name={`${trip?.name ? trip.name + ", " : ""}${n > 0 ? `day ${n}` : name}.txt`} text={() => dayText(trip, d, bookings, date)} />
                  <button type="button" aria-label={`Edit ${name}`} onClick={() => setEditing(d ?? { date, items: [] })} className="-my-2 grid size-11 place-items-center rounded-full text-primary"><Pencil className="size-4" /></button>
                </div>
              }>
              {d?.title && <p className="px-4 pt-3 font-semibold">{d.title}</p>}
              <Timeline day={d} bookings={bookings} date={date} />
            </Section>
          )
        })}
      </div>
      <DaySheet day={editing} onClose={() => setEditing(null)} onSave={async (d, was) => { await saveDay(d, was); setEditing(null) }} onDelete={drop}
        suggest={all.find((x) => !days.some((d) => d.date === x)) ?? (all.length ? plus(all[all.length - 1], 1) : trip?.start ?? today)} />
    </>
  )
}

const plus = (s: string, n: number) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d) }

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
        <Field label="Plan, one line each (start with a time to order it)" htmlFor="d-plan"><textarea id="d-plan" rows={6} className={cn(inputClass, "h-auto py-2")} placeholder={"09:00 Tram 28\n13:30 Lunch at a tasca\nWalk back through Alfama"} value={plan} onInput={(e) => setPlan(e.currentTarget.value)} /></Field>
        <PrimaryButton type="submit" disabled={!ok}>{day === "new" ? "Save day" : "Save"}</PrimaryButton>
        {day && day !== "new" && (day.items.length > 0 || day.title) && <DeleteButton onClick={() => onDelete(day)}>Delete day</DeleteButton>}
      </form>
    </Sheet>
  )
}
