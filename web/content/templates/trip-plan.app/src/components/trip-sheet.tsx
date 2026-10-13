import { useLayoutEffect, useState } from "react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Sheet } from "@/components/kit"
import { iso, useTrip } from "@/lib/trip"

// The trip itself: its name, where, and the dates (the countdown and the day numbers follow them).
// Start a new trip keeps the packing list (unpacked) and moves this trip to past, with Undo.
export function TripSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { trip, setTrip, newTrip } = useTrip()
  const [name, setName] = useState("")
  const [place, setPlace] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  useLayoutEffect(() => {
    if (!open) return
    const first = iso(new Date())
    setName(trip?.name ?? ""); setPlace(trip?.place ?? ""); setStart(trip?.start ?? first); setEnd(trip?.end ?? trip?.start ?? first)
  }, [open])
  const ok = name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(start)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const to = /^\d{4}-\d{2}-\d{2}$/.test(end) && end >= start ? end : start
    await setTrip({ name: name.trim(), ...(place.trim() ? { place: place.trim() } : {}), start, end: to })
    onClose()
  }

  return (
    <Sheet open={open} title={trip ? "Edit trip" : "New trip"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Where to" htmlFor="t-name"><input id="t-name" className={inputClass} placeholder="Lisbon" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
        <Field label="Country or region (optional)" htmlFor="t-place"><input id="t-place" className={inputClass} placeholder="Portugal" value={place} onInput={(e) => setPlace(e.currentTarget.value)} /></Field>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1"><Field label="First day" htmlFor="t-start"><input id="t-start" type="date" className={inputClass} value={start} onInput={(e) => setStart(e.currentTarget.value)} /></Field></div>
          <div className="min-w-0 flex-1"><Field label="Last day" htmlFor="t-end"><input id="t-end" type="date" className={inputClass} value={end} onInput={(e) => setEnd(e.currentTarget.value)} /></Field></div>
        </div>
        <PrimaryButton type="submit" disabled={!ok}>Save</PrimaryButton>
        {trip && (
          <DeleteButton className="text-primary" onClick={async () => {
            const name = trip.name
            onClose()
            const undo = await newTrip()
            offerUndo(`${name} put away. The packing list is ready again.`, undo)
          }}>Start a new trip</DeleteButton>
        )}
      </form>
    </Sheet>
  )
}
