import { useState } from "react"
import { ArrowRight, Plus, Trash2 } from "lucide-react"
import { inputClass, offerUndo, PrimaryButton, Row, Section, Title, TintButton } from "@/components/kit"
import { CostSheet } from "@/components/cost-sheet"
import { money, shortDate, splitLine, useCosts, type Cost } from "@/lib/costs"
import { cn } from "@/lib/utils"

// The first screen answers "who owes whom": each payment that settles the trip, with Mark as paid.
// Under it the one big button, Add cost, then every cost with who paid and how it's split. Tap a
// cost to change it; the trash button deletes it (with Undo).
export default function Costs() {
  const t = useCosts()
  const [editing, setEditing] = useState<Cost | "new" | null>(null)
  const [person, setPerson] = useState("")

  const save = async (c: Omit<Cost, "id">) => {
    if (editing === "new") await t.addCost(c)
    else if (editing) await t.updateCost(editing.id, c)
    setEditing(null)
  }
  const drop = async (c: Cost) => {
    const before = t.costs
    setEditing(null)
    await t.removeCost(c.id)
    offerUndo(`Deleted ${c.what}`, () => t.restoreCosts(before))
  }
  const paid = async (i: number) => {
    const tr = t.transfers[i], before = t.payments
    await t.pay(tr)
    offerUndo(`${t.nameOf(tr.from)} paid ${t.nameOf(tr.to)} ${money(tr.amount, t.currency)}`, () => t.restorePayments(before))
  }
  const addPerson = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!person.trim()) return
    await t.addPerson(person.trim())
    setPerson("")
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Title title={t.name} subtitle={t.costs.length ? `${money(t.total, t.currency)} in all · ${t.people.length} ${t.people.length === 1 ? "person" : "people"}` : undefined} />
      {t.people.length < 2 && (
        <Section title="Who's on the trip" footer={t.people.length ? "Add everyone who shares the costs." : "Add everyone who shares the costs, then each cost as it comes."}>
          {t.people.map((p) => <Row key={p.id}><span className="flex-1">{p.name}</span></Row>)}
          <form onSubmit={addPerson} className="flex items-center gap-2 border-t border-border px-4 py-3 first:border-t-0">
            <input aria-label="Name" placeholder={t.people.length ? "Another name" : "A name"} className={cn(inputClass, "h-10 min-w-0 flex-1")} value={person} onInput={(e) => setPerson(e.currentTarget.value)} />
            <TintButton type="submit" disabled={!person.trim()} className="h-10">Add</TintButton>
          </form>
        </Section>
      )}
      {t.costs.length > 0 && (
        <Section title="Who owes whom" footer={t.transfers.length > 1 ? "The fewest payments that settle everything." : undefined}>
          {!t.transfers.length && <Row><span className="flex-1 font-semibold" data-testid="square">All square.</span></Row>}
          {t.transfers.map((tr, i) => (
            <Row key={`${tr.from}-${tr.to}`} className="py-3 pr-2">
              <p className="min-w-0 flex-1 text-[1.0625rem]" data-testid="owes">
                <span className="font-semibold">{t.nameOf(tr.from)}</span> <span className="text-muted-foreground">owes</span>{" "}
                <span className="font-semibold">{t.nameOf(tr.to)}</span> <span className="font-semibold tabular-nums text-primary">{money(tr.amount, t.currency)}</span>
              </p>
              <TintButton type="button" onClick={() => paid(i)} aria-label={`Mark as paid: ${t.owes(tr)}`} className="shrink-0">Mark as paid</TintButton>
            </Row>
          ))}
        </Section>
      )}
      <PrimaryButton type="button" className="mb-6" disabled={t.people.length === 0} onClick={() => setEditing("new")}><Plus /> Add cost</PrimaryButton>
      <Section title={t.costs.length ? "Costs" : undefined} footer={t.costs.length ? "Tap a cost to change who paid or how it's split." : undefined}>
        {!t.costs.length && <p className="px-4 py-6 text-center text-muted-foreground">No costs yet. Tap Add cost for the first one, or tell your AI what you paid.</p>}
        {t.costs.map((c) => (
          <Row key={c.id} className="py-3 pr-1">
            <button type="button" aria-label={`Edit ${c.what}`} onClick={() => setEditing(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.what}</p>
                <p className="text-[0.875rem] text-muted-foreground">{[`${t.nameOf(c.paidBy)} paid`, splitLine(c, t.people), c.date && shortDate(c.date)].filter(Boolean).join(" · ")}</p>
              </div>
              <span className="shrink-0 font-semibold tabular-nums">{money(c.amount, t.currency)}</span>
            </button>
            <button type="button" aria-label={`Delete ${c.what}`} onClick={() => drop(c)} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
          </Row>
        ))}
      </Section>
      {t.payments.length > 0 && (
        <Section title="Paid back">
          {t.payments.map((p) => (
            <Row key={p.id} className="pr-1">
              <p className="flex min-w-0 flex-1 items-center gap-1.5">
                <span>{t.nameOf(p.from)}</span><ArrowRight className="size-4 text-muted-foreground" /><span>{t.nameOf(p.to)}</span>
                {p.date && <span className="text-[0.875rem] text-muted-foreground">· {shortDate(p.date)}</span>}
              </p>
              <span className="tabular-nums">{money(p.amount, t.currency)}</span>
              <button type="button" aria-label={`Delete payment from ${t.nameOf(p.from)} to ${t.nameOf(p.to)}`} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"
                onClick={async () => { const before = t.payments; await t.removePayment(p.id); offerUndo("Deleted the payment", () => t.restorePayments(before)) }}>
                <Trash2 className="size-[18px]" />
              </button>
            </Row>
          ))}
        </Section>
      )}
      <CostSheet editing={editing} people={t.people} currency={t.currency} onClose={() => setEditing(null)} onSave={save} onDelete={drop} />
    </div>
  )
}
