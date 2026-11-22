import { useLayoutEffect, useState } from "react"
import { route } from "amber-router"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Sheet } from "@/components/kit"
import { complete, DayMonth } from "@/components/day-month"
import { useGifts, type Occasion, type Person } from "@/lib/gifts"

/** Adds someone (their name, their birthday, and whether you give them a Christmas gift), or
 *  renames someone and deletes them. Likes, sizes and occasions are on the person's own page. */
export function PersonSheet({ editing, onClose }: { editing: Person | "new" | null; onClose: () => void }) {
  const { people, ideas, addPerson, updatePerson, removePerson, restore } = useGifts()
  const [name, setName] = useState("")
  const [birthday, setBirthday] = useState("")
  const [christmas, setChristmas] = useState(true)
  useLayoutEffect(() => {
    if (!editing) return
    setName(editing === "new" ? "" : editing.name); setBirthday(""); setChristmas(true)
  }, [editing === "new" ? "new" : editing?.id])
  if (!editing) return null
  const isNew = editing === "new"
  const ok = !!name.trim()

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    if (isNew) {
      const p = await addPerson({ name: name.trim(), occasions: startingOccasions(birthday, christmas) })
      onClose()
      route(`/person/${encodeURIComponent(p.id)}`)
    } else {
      await updatePerson(editing.id, { name: name.trim() })
      onClose()
    }
  }
  const drop = async () => {
    const p = editing as Person, beforePeople = people, beforeIdeas = ideas
    onClose()
    await removePerson(p.id)
    route("/people")
    offerUndo(`Removed ${p.name}`, () => restore(beforePeople, beforeIdeas))
  }
  return (
    <Sheet open title={isNew ? "New person" : "Edit person"} onClose={onClose}>
      <form onSubmit={save} noValidate>
        <Field label="Name" htmlFor="p-name"><input id="p-name" className={inputClass} placeholder="Mum" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
        {isNew && (
          <>
            <DayMonth id="p-birthday" label="Birthday (optional)" value={birthday} onChange={setBirthday} />
            <ChristmasChoice value={christmas} onChange={setChristmas} />
          </>
        )}
        <PrimaryButton type="submit" disabled={!ok}>{isNew ? (ok ? `Add ${name.trim()}` : "Name them to add them") : "Save"}</PrimaryButton>
        {!isNew && <DeleteButton onClick={drop}>Delete {editing.name}</DeleteButton>}
      </form>
    </Sheet>
  )
}

export function ChristmasChoice({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="mb-5">
      <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">A Christmas gift too?</p>
      <Pills label="A Christmas gift too?" options={["Yes", "No"] as const} value={value ? "Yes" : "No"} onChange={(v) => onChange(v === "Yes")} />
    </div>
  )
}

/** A new person's occasions: their birthday when it's given, and Christmas when chosen. */
export function startingOccasions(birthday: string, christmas: boolean): Occasion[] {
  return [
    ...(complete(birthday) ? [{ id: "birthday", kind: "birthday" as const, date: birthday }] : []),
    ...(christmas ? [{ id: "christmas", kind: "christmas" as const }] : []),
  ]
}
