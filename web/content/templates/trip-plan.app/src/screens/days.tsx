import { useLayoutEffect, useState } from "react"
import { Pencil, Plus } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Section, Sheet, Title, TintButton } from "@/components/kit"
import { ShareButton, Timeline } from "@/components/timeline"
import { between, dayText, iso, longDate, range, useTrip, type Day } from "@/lib/trip"
import { cn } from "@/lib/utils"

// The plan as a timeline, a card a day: the day's lines and its bookings, by time. Every day of the
// trip has a card, planned or not. One Share, in the header, sends the whole trip as text; a day's
// pencil edits its date, title and plan, and shares that day alone from its sheet. (Council round 4:
// three Share buttons, two pencils and Add day in one view.) The header's Share and the pencils end
// on the same line, 8 px inside the cards' edge. Add day is after the last day: every day of the
// trip already has a card, so it's for one outside it. During the trip, today is marked. Two
// columns on a wide note.
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
      <Title title="Days" subtitle={trip ? `${trip.name} · ${range(trip)}` : undefined}
        action={all.length > 0 ? <ShareButton label="Share the whole trip" name={`${trip?.name ?? "Trip"} plan.txt`} text={tripText} className="my-0" /> : undefined} />
      {!all.length && <p className="py-6 text-center text-muted-foreground">No days planned yet. Use Add day to plan the first one, or ask your AI for a day-by-day plan.</p>}
      {all.length > 0 && <p className="-mt-2 mb-4 px-1 text-[0.875rem] text-muted-foreground text-balance">Start a line with a time (09:30) to put it in order. Bookings with a date join their day.</p>}
      <div className="grid gap-x-6 min-[900px]:grid-cols-2">
        {all.map((date) => {
          const d = days.find((x) => x.date === date)
          const n = trip ? between(trip.start, date) + 1 : 0
          const name = longDate(date)
          return (
            <Section key={date} title={`${n > 0 ? `Day ${n} · ` : ""}${new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}${date === today ? " · Today" : ""}`}
              className={cn(date === today && "[&>div:last-child]:ring-2 [&>div:last-child]:ring-[var(--amber-accent)]")}
              action={<button type="button" aria-label={`Edit ${name}`} onClick={() => setEditing(d ?? { date, items: [] })} className="-my-2 flex size-11 items-center justify-end rounded-full pr-1 text-link"><Pencil className="size-4" /></button>}>
              {d?.title && <p className="px-4 pt-3 font-semibold">{d.title}</p>}
              <Timeline day={d} bookings={bookings} date={date} />
            </Section>
          )
        })}
      </div>
      <TintButton className="mb-6" onClick={() => setEditing("new")}><Plus /> Add day</TintButton>
      <DaySheet day={editing} onClose={() => setEditing(null)} onSave={async (d, was) => { await saveDay(d, was); setEditing(null) }} onDelete={drop}
        share={(d) => { const n = trip ? between(trip.start, d.date) + 1 : 0; return { label: `Share ${longDate(d.date)}`, name: `${trip?.name ? trip.name + ", " : ""}${n > 0 ? `day ${n}` : longDate(d.date)}.txt`, text: () => dayText(trip, days.find((x) => x.date === d.date) ?? d, bookings, d.date) } }}
        suggest={all.find((x) => !days.some((d) => d.date === x)) ?? (all.length ? plus(all[all.length - 1], 1) : trip?.start ?? today)} />
    </>
  )
}

const plus = (s: string, n: number) => { const d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d) }

function DaySheet({ day, suggest, onClose, onSave, onDelete, share }: { day: Day | "new" | null; suggest: string; onClose: () => void; onSave: (d: Day, was?: string) => unknown; onDelete: (d: Day) => unknown; share: (d: Day) => { label: string; name: string; text: () => string } }) {
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
        {/* The day as it's saved, to send to someone: this is where one day is shared from. */}
        {day && day !== "new" && <div className="mt-3 flex justify-center"><ShareButton {...share(day)} className="my-0" /></div>}
        {day && day !== "new" && (day.items.length > 0 || day.title) && <DeleteButton onClick={() => onDelete(day)}>Delete day</DeleteButton>}
      </form>
    </Sheet>
  )
}
