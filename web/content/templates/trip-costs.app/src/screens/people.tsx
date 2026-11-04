import { useLayoutEffect, useState } from "react"
import { Pencil, X } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Row, Section, Sheet, Title, TintButton } from "@/components/kit"
import { money, useCosts, type Person } from "@/lib/costs"
import { cn } from "@/lib/utils"

// Everyone on the trip with where they stand ("Is owed €42", "Owes €42", "Even"), add, rename or
// remove someone (only once nothing they paid or share is left, so the costs still add up), and
// the trip's name and currency.
export default function People() {
  const t = useCosts()
  const [person, setPerson] = useState("")
  const [editing, setEditing] = useState<Person | null>(null)
  const [name, setName] = useState("")
  const [why, setWhy] = useState("")
  const [trip, setTrip] = useState(t.name)
  const [currency, setCurrency] = useState(t.currency)
  useLayoutEffect(() => { setTrip(t.name); setCurrency(t.currency) }, [t.name, t.currency])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!person.trim()) return
    await t.addPerson(person.trim())
    setPerson("")
  }
  const open = (p: Person, reason = "") => { setEditing(p); setName(p.name); setWhy(reason) }
  const rename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !name.trim()) return
    await t.renamePerson(editing.id, name.trim())
    setEditing(null)
  }
  const remove = async (p: Person) => {
    if (t.inUse(p.id)) { open(p, `${p.name} paid or shares a cost. Change or delete those costs first, so the rest still add up.`); return }
    const before = t.people
    setEditing(null)
    await t.removePerson(p.id)
    offerUndo(`Removed ${p.name}`, () => t.restorePeople(before))
  }
  const stand = (id: string) => {
    const n = t.balance[id] ?? 0
    return n > 0 ? `Is owed ${money(n / 100, t.currency)}` : n < 0 ? `Owes ${money(-n / 100, t.currency)}` : "Even"
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Title title="People" subtitle={`${t.people.length} on the trip`} />
      <Section footer="Removing someone works once nothing they paid or share is left.">
        {t.people.map((p) => (
          <Row key={p.id} className="pr-1">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <p className={cn("text-[0.875rem]", (t.balance[p.id] ?? 0) > 0 ? "text-primary" : "text-muted-foreground")}>{stand(p.id)}</p>
            </div>
            <button type="button" aria-label={`Rename ${p.name}`} onClick={() => open(p)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><Pencil className="size-4" /></button>
            <button type="button" aria-label={`Remove ${p.name}`} onClick={() => remove(p)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><X className="size-4" /></button>
          </Row>
        ))}
        <form onSubmit={add} className="flex items-center gap-2 border-t border-border px-4 py-3 first:border-t-0">
          <input aria-label="New person" placeholder="Add someone" className={cn(inputClass, "h-10 min-w-0 flex-1")} value={person} onInput={(e) => setPerson(e.currentTarget.value)} />
          <TintButton type="submit" disabled={!person.trim()} className="h-10">Add</TintButton>
        </form>
      </Section>
      <Section title="Trip">
        <form className="px-4 py-3" onSubmit={async (e) => { e.preventDefault(); if (trip.trim()) await t.setName(trip.trim()); await t.setCurrency(currency.trim()) }}>
          <div className="flex gap-3">
            <div className="min-w-0 flex-1"><Field label="Trip name" htmlFor="trip-name"><input id="trip-name" className={inputClass} value={trip} onInput={(e) => setTrip(e.currentTarget.value)} /></Field></div>
            <div className="w-28"><Field label="Currency" htmlFor="trip-currency"><input id="trip-currency" className={inputClass} placeholder="€" value={currency} onInput={(e) => setCurrency(e.currentTarget.value)} /></Field></div>
          </div>
          <TintButton type="submit" aria-label="Save trip" disabled={!trip.trim() || (trip.trim() === t.name && currency.trim() === t.currency)}>Save</TintButton>
        </form>
      </Section>
      <Sheet open={editing !== null} title={`Edit ${editing?.name ?? ""}`} onClose={() => setEditing(null)}>
        <form onSubmit={rename}>
          <Field label="Name" htmlFor="p-name"><input id="p-name" className={inputClass} value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
          <PrimaryButton type="submit" disabled={!name.trim()}>Save</PrimaryButton>
          {why && <p role="status" className="mt-3 text-[0.875rem] text-muted-foreground">{why}</p>}
          {editing && !why && <DeleteButton onClick={() => remove(editing)}>Remove {editing.name}</DeleteButton>}
        </form>
      </Sheet>
    </div>
  )
}
