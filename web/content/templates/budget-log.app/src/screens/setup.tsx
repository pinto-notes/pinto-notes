import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { inputClass, PrimaryButton, Row, Section, Title, TintButton } from "@/components/kit"
import { guessCurrency, money, suggested, useBudget } from "@/lib/budget"
import { cn } from "@/lib/utils"

type Line = { key: number; name: string; amount: string }
const number = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0)

// A new budget's first screen: the person sets what they can spend a month before the app says
// anything is "left". The categories the app starts with are suggestions, with amounts in the
// currency their device most likely uses (blank when that can't be told): change a name or an
// amount, remove what you don't need, add your own, then Start. No "left this month" and no "a day"
// here: those are the person's numbers, not ours (council round 3: a new budget opened on
// "11,800 kr left" before anyone had set a budget). Everything can be changed later under Budget.
export default function Setup() {
  const b = useBudget()
  const [currency, setCurrency] = useState(() => b.currency || guessCurrency())
  const [lines, setLines] = useState<Line[]>(() => b.categories.map((c, key) => {
    const n = b.currency ? Number(c.budget) || 0 : suggested(Number(c.budget) || 0, guessCurrency())
    return { key, name: c.name, amount: n ? String(n) : "" }
  }))
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const chosen = lines.filter((l) => l.name.trim()).map((l) => ({ name: l.name.trim(), budget: number(l.amount) }))
  const total = chosen.reduce((t, c) => t + c.budget, 0)
  const change = (key: number, patch: Partial<Line>) => setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n || lines.some((l) => l.name.trim().toLowerCase() === n.toLowerCase())) return
    setLines([...lines, { key: Math.max(-1, ...lines.map((l) => l.key)) + 1, name: n, amount }])
    setName(""); setAmount("")
  }

  return (
    <div className="mx-auto max-w-xl">
      <Title title="Set your monthly budget" />
      <p className="-mt-3 pb-4 text-muted-foreground text-balance">What you can spend on each a month. Change the names and amounts, and remove what you don't need.</p>
      {/* The currency sits over the amounts it belongs to, so the whole budget and its Start button
          fit a Mac note without scrolling. */}
      <Section title={lines.length ? "Suggestions" : undefined} action={
        <label className="-my-1 flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">Currency
          <input aria-label="Currency" placeholder="kr, $, €" className={cn(inputClass, "h-9 w-20 text-center text-[0.9375rem]")} value={currency} onInput={(e) => setCurrency(e.currentTarget.value.slice(0, 4))} />
        </label>}>
        {lines.map((l) => (
          <Row key={l.key} className="gap-2 py-1.5 pr-1">
            <input aria-label={`Name of ${l.name || "category"}`} value={l.name} onInput={(e) => change(l.key, { name: e.currentTarget.value })}
              className="h-10 min-w-0 flex-1 rounded-lg border-0 bg-transparent px-0 font-medium text-foreground focus:bg-[var(--amber-field)] focus:px-2" />
            <input aria-label={`${l.name || "Category"} a month`} inputMode="numeric" placeholder="0" value={l.amount} onInput={(e) => change(l.key, { amount: e.currentTarget.value })}
              className={cn(inputClass, "h-10 w-24 shrink-0 text-right tabular-nums")} />
            <button type="button" aria-label={`Remove ${l.name || "category"}`} onClick={() => setLines(lines.filter((x) => x.key !== l.key))} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
          </Row>
        ))}
        <form onSubmit={add} className="flex min-h-11 items-center gap-2 border-t border-border px-4 py-1.5 first:border-t-0">
          <input aria-label="New category" placeholder="Add your own" className={cn(inputClass, "h-10 min-w-0 flex-1")} value={name} onInput={(e) => setName(e.currentTarget.value)} />
          <input aria-label="New category a month" placeholder="0" inputMode="numeric" className={cn(inputClass, "h-10 w-24 text-right tabular-nums")} value={amount} onInput={(e) => setAmount(e.currentTarget.value)} />
          <TintButton type="submit" aria-label="Add category" disabled={!name.trim()} className="h-10 w-10 shrink-0 px-0"><Plus /></TintButton>
        </form>
      </Section>
      <PrimaryButton disabled={!total} onClick={() => b.start(chosen, currency.trim())}>
        {total ? `Start with ${money(total, currency.trim())} a month` : "Enter an amount to start"}
      </PrimaryButton>
      <p className="px-1 pt-3 text-center text-[0.8125rem] text-muted-foreground">Monthly bills, roll-over and every change later are under Budget.</p>
    </div>
  )
}
