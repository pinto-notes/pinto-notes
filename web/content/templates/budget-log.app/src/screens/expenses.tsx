import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { ExpenseSheet } from "@/components/add-expense"
import { offerUndo, Row, Section, TintButton } from "@/components/kit"
import { money, monthName, shiftMonth, thisMonth, useBudget, type Expense } from "@/lib/budget"

// Every expense of a month, by day, newest first. Tap one to edit it; the trash button deletes it
// (with Undo).
export default function Expenses() {
  const b = useBudget()
  const [m, setM] = useState(thisMonth())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const mo = b.month(m)
  const days = [...new Set(mo.items.map((e) => e.date))]
  const fmt = (n: number) => money(n, b.currency)
  const drop = async (e: Expense) => {
    const before = b.expenses
    await b.remove(e.id)
    offerUndo(`Deleted ${e.what}`, () => b.restore(before))
  }

  return (
    <div className="max-w-3xl">
      <header className="flex items-center gap-1 pb-1 pt-2">
        <h1 className="min-w-0 flex-1 text-[2rem] font-bold leading-tight tracking-tight">Expenses</h1>
        <TintButton aria-label="Add expense" onClick={() => setAdding(true)}><Plus /> Add</TintButton>
      </header>
      <div className="mb-4 flex items-center gap-1">
        <button type="button" aria-label="Previous month" onClick={() => setM(shiftMonth(m, -1))} className="grid size-11 place-items-center rounded-full text-primary"><ChevronLeft className="size-5" /></button>
        <p className="min-w-0 flex-1 text-center font-semibold">{monthName(m)} <span className="font-normal text-muted-foreground tabular-nums">· {fmt(mo.spent)}</span></p>
        <button type="button" aria-label="Next month" disabled={m === thisMonth()} onClick={() => setM(shiftMonth(m, 1))} className="grid size-11 place-items-center rounded-full text-primary disabled:opacity-30"><ChevronRight className="size-5" /></button>
      </div>
      {days.map((d) => {
        const items = mo.items.filter((e) => e.date === d)
        return (
          <Section key={d} title={new Date(d + "T12:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}>
            {items.map((e) => (
              <Row key={e.id} className="gap-0 p-0 pr-1">
                <button type="button" aria-label={`Edit ${e.what}`} onClick={() => setEditing(e)} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.what}</p>
                    <p className="text-[0.8125rem] text-muted-foreground">{e.category}{e.rec ? " · Monthly" : ""}</p>
                  </div>
                  <span className="font-semibold tabular-nums">{fmt(e.amount)}</span>
                </button>
                <button type="button" aria-label={`Delete ${e.what}`} onClick={() => drop(e)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
              </Row>
            ))}
          </Section>
        )
      })}
      {!days.length && <p className="px-1 py-6 text-center text-muted-foreground">Nothing spent in {monthName(m, false)}. Tap Add to log the first expense.</p>}
      <ExpenseSheet open={adding || !!editing} expense={editing} onClose={() => { setAdding(false); setEditing(null) }} />
    </div>
  )
}
