import { useLayoutEffect, useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Row, Section, Sheet, Title, TintButton } from "@/components/kit"
import { useTrip, type Booking } from "@/lib/trip"
import { cn } from "@/lib/utils"

// Flights, stays, trains and tables: when, the confirmation number, and a tick once it's paid.
// Tap a booking to edit it; the trash button deletes it (with Undo).
export default function Bookings() {
  const { bookings, togglePaid, addBooking, updateBooking, removeBooking, restoreBookings } = useTrip()
  const [editing, setEditing] = useState<Booking | "new" | null>(null)
  const [what, setWhat] = useState("")
  const [when, setWhen] = useState("")
  const [ref, setRef] = useState("")
  const paid = bookings.filter((b) => b.paid).length
  useLayoutEffect(() => {
    if (!editing) return
    setWhat(editing === "new" ? "" : editing.what); setWhen(editing === "new" ? "" : editing.when ?? ""); setRef(editing === "new" ? "" : editing.ref ?? "")
  }, [editing])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!what.trim() || !editing) return
    const fields = { what: what.trim(), when: when.trim() || undefined, ref: ref.trim() || undefined }
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
              <p className="font-semibold">{b.what}</p>
              <p className="text-[0.875rem] text-muted-foreground">
                {[b.when, b.ref && `Ref ${b.ref}`].filter(Boolean).join(" · ")}
                {!b.paid && <>{b.when || b.ref ? " · " : ""}<span className="font-medium text-primary">Not paid</span></>}
              </p>
            </button>
            <button type="button" aria-label={`Delete ${b.what}`} onClick={() => drop(b)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
          </Row>
        ))}
      </Section>
      <Sheet open={editing !== null} title={editing === "new" ? "New booking" : "Edit booking"} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <Field label="What" htmlFor="b-what"><input id="b-what" className={inputClass} placeholder="Dinner at Ramiro" value={what} onInput={(e) => setWhat(e.currentTarget.value)} /></Field>
          <Field label="When" htmlFor="b-when"><input id="b-when" className={inputClass} placeholder="24 Oct, 20:00" value={when} onInput={(e) => setWhen(e.currentTarget.value)} /></Field>
          <Field label="Confirmation" htmlFor="b-ref"><input id="b-ref" className={inputClass} placeholder="Optional" value={ref} onInput={(e) => setRef(e.currentTarget.value)} /></Field>
          <PrimaryButton type="submit" disabled={!what.trim()}>{editing === "new" ? "Add booking" : "Save"}</PrimaryButton>
          {editing && editing !== "new" && <DeleteButton onClick={() => drop(editing)}>Delete booking</DeleteButton>}
        </form>
      </Sheet>
    </>
  )
}
