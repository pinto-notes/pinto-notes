import { useLayoutEffect, useState } from "react"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Sheet } from "@/components/kit"
import { useBudget, type Bill } from "@/lib/budget"
import { cn } from "@/lib/utils"

// Add or change a monthly bill: what, how much, its category and the day of the month it's paid.
// Deleting stops it from being added again (what it already added stays), with Undo.
export function BillSheet({ bill, onClose }: { bill: Bill | "new" | null; onClose: () => void }) {
  const { categories, currency, bills, addBill, updateBill, removeBill, restoreBills } = useBudget()
  const names = categories.length ? categories.map((c) => c.name) : ["Bills"]
  const [what, setWhat] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState(names[0])
  const [day, setDay] = useState("1")
  useLayoutEffect(() => {
    if (!bill) return
    const b = bill === "new" ? null : bill
    setWhat(b?.what ?? ""); setAmount(b ? String(b.amount) : ""); setDay(String(b?.day ?? new Date().getDate()))
    setCategory(b?.category ?? (names.includes("Bills") ? "Bills" : names[0]))
  }, [bill])
  const value = Number(amount.replace(",", "."))
  const ok = what.trim() && value > 0 && Number.isFinite(value)
  const options = bill && bill !== "new" && !names.includes(bill.category) ? [...names, bill.category] : names

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok || !bill) return
    const fields = { what: what.trim(), amount: Math.round(value * 100) / 100, category: options.includes(category) ? category : names[0], day: Math.max(1, Math.min(31, Math.round(Number(day) || 1))) }
    if (bill === "new") await addBill(fields); else await updateBill(bill.id, fields)
    onClose()
  }
  const drop = async () => {
    if (!bill || bill === "new") return
    const before = bills
    onClose()
    await removeBill(bill.id)
    offerUndo(`Stopped ${bill.what}`, () => restoreBills(before))
  }

  return (
    <Sheet open={bill !== null} title={bill === "new" ? "New monthly bill" : "Edit monthly bill"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="What" htmlFor="bill-what"><input id="bill-what" className={inputClass} placeholder="Rent" value={what} onInput={(e) => setWhat(e.currentTarget.value)} /></Field>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1"><Field label={`Amount (${currency})`} htmlFor="bill-amount"><input id="bill-amount" inputMode="decimal" autoComplete="off" placeholder="0" className={cn(inputClass, "tabular-nums")} value={amount} onInput={(e) => setAmount(e.currentTarget.value)} /></Field></div>
          <div className="w-28"><Field label="Day of month" htmlFor="bill-day"><input id="bill-day" type="number" inputMode="numeric" min={1} max={31} className={cn(inputClass, "tabular-nums")} value={day} onInput={(e) => setDay(e.currentTarget.value)} /></Field></div>
        </div>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Category</p>
          <Pills label="Category" options={options} value={options.includes(category) ? category : names[0]} onChange={setCategory} />
        </div>
        <PrimaryButton type="submit" disabled={!ok}>{bill === "new" ? "Save bill" : "Save"}</PrimaryButton>
        {bill && bill !== "new" && <DeleteButton onClick={drop}>Stop this bill</DeleteButton>}
      </form>
    </Sheet>
  )
}
