import { useLayoutEffect, useState } from "react"
import { Check } from "lucide-react"
import { DeleteButton, Field, inputClass, PrimaryButton, Sheet } from "@/components/kit"
import { iso, money, owed, parseAmount, type Cost, type Person } from "@/lib/costs"
import { cn } from "@/lib/utils"

// Adding or changing a cost: what it was, how much, who paid, and how it's split, equally between
// the people ticked or by each person's share. Under the split, what each person's part comes to.
export function CostSheet({ editing, people, currency, onClose, onSave, onDelete }: {
  editing: Cost | "new" | null; people: Person[]; currency: string
  onClose: () => void; onSave: (c: Omit<Cost, "id">) => unknown; onDelete: (c: Cost) => unknown
}) {
  const [what, setWhat] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")
  const [split, setSplit] = useState<"equal" | "shares">("equal")
  const [among, setAmong] = useState<string[]>([])
  const [shares, setShares] = useState<Record<string, string>>({})
  const [date, setDate] = useState("")
  useLayoutEffect(() => {
    if (!editing) return
    const c = editing === "new" ? null : editing
    setWhat(c?.what ?? ""); setAmount(c ? String(c.amount) : ""); setPaidBy(c?.paidBy ?? people[0]?.id ?? "")
    setSplit(c?.split ?? "equal")
    setAmong(c?.split === "equal" && c.among?.length ? c.among : people.map((p) => p.id))
    setShares(Object.fromEntries(people.map((p) => [p.id, String(c?.split === "shares" ? c.shares?.[p.id] ?? 0 : 1)])))
    setDate(c?.date ?? iso(new Date()))
  }, [editing])

  const value = parseAmount(amount)
  const shareOf = (id: string) => Math.max(0, Number(shares[id] ?? 0) || 0)
  const draft: Omit<Cost, "id"> = {
    what: what.trim(), amount: Math.round((value || 0) * 100) / 100, paidBy, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined, split,
    ...(split === "equal" ? { among: people.map((p) => p.id).filter((id) => among.includes(id)) } : { shares: Object.fromEntries(people.map((p) => [p.id, shareOf(p.id)]).filter(([, n]) => (n as number) > 0)) }),
  }
  const parts = value > 0 ? owed(draft as Cost, people) : {}
  const nobody = split === "equal" ? !draft.among?.length : !Object.keys(draft.shares ?? {}).length
  const ready = !!draft.what && value > 0 && !!paidBy && !nobody

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    await onSave(draft)
  }
  const toggle = (id: string) => setAmong(among.includes(id) ? among.filter((x) => x !== id) : [...among, id])

  return (
    <Sheet open={editing !== null} title={editing === "new" ? "New cost" : "Edit cost"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="What" htmlFor="c-what"><input id="c-what" className={inputClass} placeholder="Dinner at Ramiro" value={what} onInput={(e) => setWhat(e.currentTarget.value)} /></Field>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1"><Field label={`Amount (${currency})`} htmlFor="c-amount"><input id="c-amount" inputMode="decimal" autoComplete="off" placeholder="0" className={cn(inputClass, "tabular-nums")} value={amount} onInput={(e) => setAmount(e.currentTarget.value)} /></Field></div>
          <div className="w-40"><Field label="Day" htmlFor="c-date"><input id="c-date" type="date" className={inputClass} value={date} onInput={(e) => setDate(e.currentTarget.value)} /></Field></div>
        </div>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Paid by</p>
          <div role="radiogroup" aria-label="Paid by" className="flex flex-wrap gap-2">
            {people.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={paidBy === p.id} onClick={() => setPaidBy(p.id)}
                className={cn("h-11 rounded-full px-4 text-[0.9375rem] font-medium", paidBy === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{p.name}</button>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Split</p>
          <div role="radiogroup" aria-label="Split" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            {([["equal", "Equally"], ["shares", "By share"]] as const).map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={split === k} onClick={() => setSplit(k)}
                className={cn("h-10 rounded-lg text-[0.9375rem] font-medium", split === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>{label}</button>
            ))}
          </div>
        </div>
        <div className="mb-4 overflow-hidden rounded-xl bg-card">
          {people.map((p) => (
            <div key={p.id} className="flex min-h-11 items-center gap-3 border-t border-border px-3 first:border-t-0">
              {split === "equal" ? (
                <button type="button" aria-label={`Split with ${p.name}`} aria-pressed={among.includes(p.id)} onClick={() => toggle(p.id)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left">
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", among.includes(p.id) ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}>
                    <Check className="size-3.5" strokeWidth={3.5} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                </button>
              ) : (
                <>
                  <label htmlFor={`share-${p.id}`} className="min-w-0 flex-1 truncate">{p.name}</label>
                  <input id={`share-${p.id}`} aria-label={`Shares for ${p.name}`} inputMode="numeric" className={cn(inputClass, "h-9 w-16 text-right tabular-nums")} value={shares[p.id] ?? ""}
                    onInput={(e) => setShares({ ...shares, [p.id]: e.currentTarget.value })} />
                </>
              )}
              <span className="w-20 shrink-0 text-right text-[0.9375rem] tabular-nums text-muted-foreground" data-testid={`part-${p.name}`}>{parts[p.id] ? money(parts[p.id] / 100, currency) : ""}</span>
            </div>
          ))}
        </div>
        {nobody && <p className="mb-3 text-[0.875rem] text-destructive">Split it between at least one person.</p>}
        <PrimaryButton type="submit" disabled={!ready}>{editing === "new" ? "Add cost" : "Save"}</PrimaryButton>
        {editing && editing !== "new" && <DeleteButton onClick={() => onDelete(editing)}>Delete cost</DeleteButton>}
      </form>
    </Sheet>
  )
}
