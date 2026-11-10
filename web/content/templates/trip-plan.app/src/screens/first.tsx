import { useEffect, useState } from "react"
import { Field, FirstScreen, inputClass, PrimaryButton, Section } from "@/components/kit"
import { iso, useTrip, type Trip } from "@/lib/trip"

/** What the person has on this screen right now, for App: when their AI plans the trip while they
 *  are here, what they typed isn't dropped without a word (App offers "Use mine"). touched: they
 *  typed something. mine: the button was pressed here, so the trip is theirs. */
export const draft: { touched: boolean; mine: boolean; use: (() => unknown) | null } = { touched: false, mine: false, use: null }

const DATE = /^\d{4}-\d{2}-\d{2}$/

// With no trip, the first screen: where and when, in the screen itself (no sheet to open first),
// then one button. No countdown, no counts and no packing list before there is a trip: nothing
// here is the person's yet. After a trip that's been put away it says the packing list is waiting.
export default function First() {
  const { setTrip, past, packing } = useTrip()
  const today = iso(new Date())
  const [name, setName] = useState("")
  const [place, setPlace] = useState("")
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(today)
  useEffect(() => { draft.touched = false; draft.mine = false; draft.use = null }, [])

  const ok = !!name.trim() && DATE.test(start)
  const trip: Trip = { name: name.trim(), ...(place.trim() ? { place: place.trim() } : {}), start, end: DATE.test(end) && end >= start ? end : start }
  draft.touched = !!(name.trim() || place.trim()) || start !== today || end !== today
  draft.use = ok ? () => setTrip(trip) : null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    draft.mine = true
    await setTrip(trip)
  }

  return (
    <FirstScreen title="Where are you going?" lead="Add the place and the dates. The days, bookings and packing list come after."
      ai="Plan it here, or tell your AI and it sets this up."
      foot={past.length > 0 && packing.length > 0 ? `Your packing list from ${past[past.length - 1].name} is ready: ${packing.length} things.` : "Change the trip and its dates any time with Edit."}>
      <form onSubmit={save}>
        <Section>
          <div className="px-4 pb-0 pt-4">
            <Field label="Where to" htmlFor="f-name"><input id="f-name" className={inputClass} placeholder="Lisbon" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
            <Field label="Country or region (optional)" htmlFor="f-place"><input id="f-place" className={inputClass} placeholder="Portugal" value={place} onInput={(e) => setPlace(e.currentTarget.value)} /></Field>
            <div className="flex gap-3">
              <div className="min-w-0 flex-1"><Field label="First day" htmlFor="f-start"><input id="f-start" type="date" className={inputClass} value={start} onInput={(e) => setStart(e.currentTarget.value)} /></Field></div>
              <div className="min-w-0 flex-1"><Field label="Last day" htmlFor="f-end"><input id="f-end" type="date" className={inputClass} value={end} onInput={(e) => setEnd(e.currentTarget.value)} /></Field></div>
            </div>
          </div>
        </Section>
        <PrimaryButton type="submit" disabled={!ok}>{ok ? `Plan ${trip.name}` : "Name the place to start"}</PrimaryButton>
      </form>
    </FirstScreen>
  )
}
