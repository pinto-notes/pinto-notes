import { useState } from "react"
import { ChevronRight, Pencil } from "lucide-react"
import { TripSheet } from "@/components/trip-sheet"
import { route } from "amber-router"
import { Bar, PrimaryButton, Ring, Section, TintButton } from "@/components/kit"
import { ShareButton, Timeline } from "@/components/timeline"
import { dayText, iso, longDate, range, useTrip } from "@/lib/trip"

// The trip at a glance: how long until you go (or which day it is), then what still needs doing.
export default function Overview() {
  const { trip, days, bookings, packing, phase, packed, past } = useTrip()
  const [editing, setEditing] = useState(false)
  if (!trip) return (
    <div className="mx-auto max-w-md py-10 text-center">
      <p className="text-[1.0625rem] font-semibold">No trip yet</p>
      <p className="mt-1 text-muted-foreground">Add where you're going and when, then the days, bookings and packing list. Or ask your AI to plan it.</p>
      {past.length > 0 && packing.length > 0 && <p className="mt-3 text-[0.9375rem] text-muted-foreground">Your packing list from {past[past.length - 1].name} is ready: {packing.length} things.</p>}
      <PrimaryButton className="mt-6" onClick={() => setEditing(true)}>Plan a trip</PrimaryButton>
      <TripSheet open={editing} onClose={() => setEditing(false)} />
    </div>
  )
  const paid = bookings.filter((b) => b.paid).length
  const today = iso(new Date())
  const dated = [...new Set([...days.map((d) => d.date), ...bookings.map((b) => b.date).filter((d): d is string => !!d)])].sort()
  const nextDate = dated.find((d) => d >= today) ?? dated[0]
  const next = nextDate ? days.find((d) => d.date === nextDate) ?? { date: nextDate, items: [] } : undefined
  const unpaid = bookings.filter((b) => !b.paid)

  return (
    <>
      <header className="flex items-end gap-3 pb-5 pt-2">
        <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">{range(trip)}{trip.place ? ` · ${trip.place}` : ""}</p>
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight">{trip.name}</h1>
        </div>
        <TintButton aria-label="Edit trip" onClick={() => setEditing(true)}><Pencil /> Edit</TintButton>
      </header>
      <div className="min-[700px]:grid min-[700px]:grid-cols-2 min-[700px]:gap-6 min-[700px]:items-start">
        <div>
          <Section>
            <div className="flex items-center gap-5 p-5" data-testid="countdown">
              {phase.kind === "before" && <>
                <p className="text-[4rem] font-bold leading-none tracking-tight tabular-nums text-primary">{phase.toGo}</p>
                <div>
                  <p className="text-[1.375rem] font-bold leading-tight">{phase.toGo === 1 ? "day to go" : "days to go"}</p>
                  <p className="text-[0.9375rem] text-muted-foreground">then {phase.length} {phase.length === 1 ? "day" : "days"} in {trip.name}</p>
                </div>
              </>}
              {phase.kind === "during" && <>
                <Ring value={phase.day / phase.length} size={76} stroke={9}><span className="text-lg font-bold tabular-nums">{phase.day}</span></Ring>
                <div>
                  <p className="text-[1.375rem] font-bold leading-tight">Day {phase.day} of {phase.length}</p>
                  <p className="text-[0.9375rem] text-muted-foreground">{longDate(today)}</p>
                </div>
              </>}
              {phase.kind === "after" && <p className="text-[1.375rem] font-bold">Home again. {phase.length} days in {trip.name}.</p>}
            </div>
          </Section>
          <Section title="To do">
            <button type="button" onClick={() => route("/bookings")} className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Bookings</p>
                <p className="text-[0.875rem] text-muted-foreground tabular-nums">{paid} of {bookings.length} paid{unpaid.length ? ` · next to pay: ${unpaid[0].what}` : ""}</p>
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
            <button type="button" onClick={() => route("/packing")} className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 py-3 text-left">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Packing</p>
                <p className="text-[0.875rem] text-muted-foreground tabular-nums">{packed} of {packing.length} packed</p>
                <Bar className="mt-2 h-1.5" value={packing.length ? packed / packing.length : 0} label="Packed" />
              </div>
              <ChevronRight className="size-5 text-muted-foreground" />
            </button>
          </Section>
        </div>
        {next && (
          <Section title={phase.kind === "during" && next.date === today ? "Today" : "First up"}
            action={<ShareButton label={`Share ${longDate(next.date)}`} name={`${trip.name}, ${longDate(next.date)}.txt`} text={() => dayText(trip, days.find((d) => d.date === next.date), bookings, next.date)} />}
            footer={dated.length > 1 ? `${dated.length} days planned. See them all in Days.` : undefined}>
            <div className="px-4 pt-3">
              <p className="font-semibold">{longDate(next.date)}</p>
              {next.title && <p className="text-[0.875rem] text-muted-foreground">{next.title}</p>}
            </div>
            <Timeline day={next} bookings={bookings} date={next.date} />
          </Section>
        )}
      </div>
      <TripSheet open={editing} onClose={() => setEditing(false)} />
    </>
  )
}
