import { useLayoutEffect, useState } from "react"
import { DeleteButton, Field, inputClass, Pills, PrimaryButton, Sheet } from "@/components/kit"
import { complete, DayMonth } from "@/components/day-month"
import { amount, KINDS, mdLabel, newId, useGifts, type Kind, type Occasion, type Person } from "@/lib/gifts"

/** Adds an occasion to someone, or changes one: what it is, its day and the budget for it. */
export function OccasionSheet({ person, editing, onClose, onDelete }: { person: Person; editing: Occasion | "new" | null; onClose: () => void; onDelete: (o: Occasion) => unknown }) {
  const { setOccasion, settings, currency } = useGifts()
  const [kind, setKind] = useState<Kind>("birthday")
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [budget, setBudget] = useState("")
  useLayoutEffect(() => {
    if (!editing) return
    const o = editing === "new" ? null : editing
    const has = new Set(person.occasions.map((x) => x.kind))
    setKind(o?.kind ?? (!has.has("birthday") ? "birthday" : !has.has("christmas") ? "christmas" : "anniversary"))
    setName(o?.name ?? ""); setDate(o?.date ?? ""); setBudget(o?.budget !== undefined ? String(o.budget) : "")
  }, [editing === "new" ? "new" : editing?.id])
  if (!editing) return null
  const isNew = editing === "new"
  const christmas = kind === "christmas"
  const ok = (christmas || complete(date)) && (kind !== "other" || !!name.trim())

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const base = isNew ? { id: uniqueId(person, kind) } : editing
    const o: Occasion = { ...base, kind }
    if (name.trim()) o.name = name.trim(); else delete o.name
    if (!christmas) o.date = date; else delete o.date
    const b = amount(budget)
    if (b !== undefined && budget.trim()) o.budget = b; else delete o.budget
    onClose()
    await setOccasion(person.id, o)
  }
  return (
    <Sheet open title={isNew ? "New occasion" : "Edit occasion"} onClose={onClose}>
      <form onSubmit={save} noValidate>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Occasion</p>
          <Pills label="Occasion" options={KINDS.map((k) => k.label)} value={KINDS.find((k) => k.kind === kind)!.label} onChange={(l) => setKind(KINDS.find((k) => k.label === l)!.kind)} />
        </div>
        {kind === "other" && <Field label="Name" htmlFor="o-name"><input id="o-name" className={inputClass} placeholder="Mother's Day" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>}
        {christmas
          ? <p className="mb-4 text-[0.9375rem] text-muted-foreground">On {mdLabel(settings.christmas)}. Settings changes the day for everyone.</p>
          : <DayMonth id="o-date" label="Day" value={date} onChange={setDate} />}
        <Field label={currency ? `Budget (${currency})` : "Budget"} htmlFor="o-budget">
          <input id="o-budget" inputMode="decimal" autoComplete="off" className={inputClass} placeholder="How much to spend" value={budget} onInput={(e) => setBudget(e.currentTarget.value)} />
        </Field>
        <PrimaryButton type="submit" disabled={!ok}>{isNew ? (ok ? "Add occasion" : kind === "other" && !name.trim() ? "Name the occasion" : "Pick the day") : "Save"}</PrimaryButton>
        {!isNew && <DeleteButton onClick={() => { onClose(); onDelete(editing) }}>Delete occasion</DeleteButton>}
      </form>
    </Sheet>
  )
}

const uniqueId = (p: Person, kind: Kind) => (p.occasions.some((o) => o.id === kind) ? newId(kind.slice(0, 2)) : kind)
