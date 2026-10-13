import { cn } from "@/lib/utils"
import { useLayoutEffect, useState } from "react"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Sheet } from "@/components/kit"
import { Toggle } from "@/components/kit"
import { iso, monthOf, newId, useBudget, type Expense } from "@/lib/budget"

// Add or edit an expense: the amount first (the number keypad on iPhone), what it was, a category,
// the day. Editing has Delete at the bottom, with Undo afterwards.
export function ExpenseSheet({ open, expense, onClose }: { open: boolean; expense?: Expense | null; onClose: () => void }) {
  const { categories, currency, add, update, remove, restore, expenses, addBill } = useBudget()
  const [repeats, setRepeats] = useState(false)
  const names = categories.length ? categories.map((c) => c.name) : ["Other"]
  const [amount, setAmount] = useState("")
  const [what, setWhat] = useState("")
  const [category, setCategory] = useState(names[0])
  const [date, setDate] = useState(iso(new Date()))
  useLayoutEffect(() => {
    if (!open) return
    setAmount(expense ? String(expense.amount) : ""); setWhat(expense?.what ?? "")
    setCategory(expense?.category ?? names[0]); setDate(expense?.date ?? iso(new Date())); setRepeats(false)
  }, [open, expense?.id])
  const value = Number(amount.replace(",", "."))
  const ok = value > 0 && Number.isFinite(value)
  const options = expense && !names.includes(expense.category) ? [...names, expense.category] : names

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const fields = { date: date || iso(new Date()), what: what.trim() || category, category: options.includes(category) ? category : names[0], amount: Math.round(value * 100) / 100 }
    if (expense) await update(expense.id, fields)
    else if (repeats) {
      // A monthly bill: this one now, then the same day every month.
      const id = newId("r")
      await addBill({ id, what: fields.what, category: fields.category, amount: fields.amount, day: Number(fields.date.slice(8)), last: monthOf(fields.date) })
      await add({ ...fields, rec: id })
    } else await add(fields)
    onClose()
  }
  const drop = async () => {
    if (!expense) return
    const before = expenses
    onClose()
    await remove(expense.id)
    offerUndo(`Deleted ${expense.what}`, () => restore(before))
  }

  return (
    <Sheet open={open} title={expense ? "Edit expense" : "Add expense"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label={`Amount (${currency})`} htmlFor="amount">
          <input id="amount" inputMode="decimal" autoComplete="off" placeholder="0" value={amount} onInput={(e) => setAmount(e.currentTarget.value)}
            className={cn(inputClass, "h-14 text-[1.75rem] font-semibold tabular-nums")} />
        </Field>
        <Field label="What" htmlFor="what">
          <input id="what" className={inputClass} placeholder="Weekly shop" value={what} onInput={(e) => setWhat(e.currentTarget.value)} />
        </Field>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Category</p>
          <Pills label="Category" options={options} value={options.includes(category) ? category : names[0]} onChange={setCategory} />
        </div>
        <Field label="Day" htmlFor="day">
          <input id="day" type="date" className={inputClass} value={date} onInput={(e) => setDate(e.currentTarget.value)} />
        </Field>
        {!expense && (
          <div className="mb-4">
            <Toggle label="Every month" checked={repeats} onChange={setRepeats} />
            <p className="px-1 pt-1.5 text-[0.8125rem] text-muted-foreground">For rent, subscriptions and other bills: it's added again on the same day each month.</p>
          </div>
        )}
        <PrimaryButton type="submit" disabled={!ok}>{expense ? "Save" : "Add"}</PrimaryButton>
        {expense && <DeleteButton onClick={drop}>Delete expense</DeleteButton>}
      </form>
    </Sheet>
  )
}
