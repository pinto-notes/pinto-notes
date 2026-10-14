import { useLayoutEffect, useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Row, Section, Sheet, Title, TintButton } from "@/components/kit"
import { KIND_ICON } from "@/components/timeline"
import { KINDS, useTrip, type Booking, type Kind } from "@/lib/trip"
import { cn } from "@/lib/utils"

// Flights, stays, trains and tables: the day and time (they join that day's timeline), the
// confirmation number, and a tick once it's paid.
// Tap a booking to edit it; the trash button deletes it (with Undo).
export default function Bookings() {
  const { trip, bookings, togglePaid, addBooking, updateBooking, removeBooking, restoreBookings } = useTrip()
  const [editing, setEditing] = useState<Booking | "new" | null>(null)
  const [what, setWhat] = useState("")
  const [when, setWhen] = useState("")
  const [ref, setRef] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [kind, setKind] = useState<Kind>("other")
  const paid = bookings.filter((b) => b.paid).length
  useLayoutEffect(() => {
    if (!editing) return
    const b = editing === "new" ? null : editing
    setWhat(b?.what ?? ""); setWhen(b?.when ?? ""); setRef(b?.ref ?? "")
    setDate(b ? b.date ?? "" : trip?.start ?? ""); setTime(b?.time ?? ""); setKind(b?.kind ?? "other")
  }, [editing])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!what.trim() || !editing) return
    const fields = { what: what.trim(), kind, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined, time: /^\d{2}:\d{2}$/.test(time) ? time : undefined, when: when.trim() || undefined, ref: ref.trim() || undefined }
    if (editing === "new") await addBooking(Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as Omit<Booking, "id" | "paid">)
    else await updateBooking(editing.id, fields)
    setEditing(null)
  }
  const drop = async (b: Booking) => {
    const before = bookings
    setEditing(null)
    await removeBooking(b.id)
    offerUndo(`Deleted ${b.what}`, () => restoreBookings(before))
  }

  return (
    <>
      <Title title="Bookings" subtitle={`${paid} of ${bookings.length} paid`} action={<TintButton onClick={() => setEditing("new")}><Plus /> Add</TintButton>} />
      <Section footer="Tick a booking once it's paid. Tap it to change it.">
        {!bookings.length && <p className="px-4 py-6 text-center text-muted-foreground">No bookings yet. Tap Add for the first one, or paste a confirmation to your AI.</p>}
        {bookings.map((b) => (
          <Row key={b.id} className="py-3 pr-1">
            <button type="button" aria-label={`Paid: ${b.what}`} aria-pressed={b.paid} onClick={() => togglePaid(b.id)}
              className={cn("grid size-11 shrink-0 place-items-center rounded-full border-2", b.paid ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}>
              <Check className="size-5" strokeWidth={3} />
            </button>
            <button type="button" aria-label={`Edit ${b.what}`} onClick={() => setEditing(b)} className="min-w-0 flex-1 text-left">
              <p className="flex items-center gap-1.5 font-semibold">{(() => { const I = KIND_ICON[b.kind ?? "other"]; return <I className="size-4 shrink-0 text-muted-foreground" /> })()}<span className="min-w-0">{b.what}</span></p>
              <p className="text-[0.875rem] text-muted-foreground">
                {[b.date ? new Date(b.date + "T12:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + (b.time ? `, ${b.time}` : "") : b.when, b.ref && `Ref ${b.ref}`].filter(Boolean).join(" · ")}
                {!b.paid && <>{b.date || b.when || b.ref ? " · " : ""}<span className="font-medium text-primary">Not paid</span></>}
              </p>
            </button>
            <button type="button" aria-label={`Delete ${b.what}`} onClick={() => drop(b)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
          </Row>
        ))}
      </Section>
      <Sheet open={editing !== null} title={editing === "new" ? "New booking" : "Edit booking"} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <Field label="What" htmlFor="b-what"><input id="b-what" className={inputClass} placeholder="Dinner at Ramiro" value={what} onInput={(e) => setWhat(e.currentTarget.value)} /></Field>
          <div className="mb-4">
            <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Kind</p>
            <Pills label="Kind" options={KINDS.map((k) => k.label)} value={KINDS.find((k) => k.kind === kind)!.label} onChange={(l) => setKind(KINDS.find((k) => k.label === l)!.kind)} />
          </div>
          <div className="flex gap-3">
            <div className="min-w-0 flex-1"><Field label="Day" htmlFor="b-date"><input id="b-date" type="date" className={inputClass} value={date} onInput={(e) => setDate(e.currentTarget.value)} /></Field></div>
            <div className="w-32"><Field label="Time" htmlFor="b-time"><input id="b-time" type="time" className={inputClass} value={time} onInput={(e) => setTime(e.currentTarget.value)} /></Field></div>
          </div>
          {editing && editing !== "new" && editing.when && <Field label="When (as written)" htmlFor="b-when"><input id="b-when" className={inputClass} value={when} onInput={(e) => setWhen(e.currentTarget.value)} /></Field>}
          <Field label="Confirmation" htmlFor="b-ref"><input id="b-ref" className={inputClass} placeholder="Optional" value={ref} onInput={(e) => setRef(e.currentTarget.value)} /></Field>
          <PrimaryButton type="submit" disabled={!what.trim()}>{editing === "new" ? "Add booking" : "Save"}</PrimaryButton>
          {editing && editing !== "new" && <DeleteButton onClick={() => drop(editing)}>Delete booking</DeleteButton>}
        </form>
      </Sheet>
    </>
  )
}
