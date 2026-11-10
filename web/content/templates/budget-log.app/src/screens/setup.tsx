import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { FirstScreen, inputClass, PrimaryButton, Row, Section, TintButton } from "@/components/kit"
import { guessCurrency, money, suggested, useBudget, type Category } from "@/lib/budget"
import { cn } from "@/lib/utils"

type Line = { key: number; name: string; amount: string }
const number = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0)

/** What the person has on this screen right now, for App: when their AI sets the budget up while
 *  they are here, what they entered isn't dropped without a word (App offers "Use mine"). touched:
 *  they changed something. mine: Start was pressed here, so the budget is theirs. */
export const draft: { touched: boolean; mine: boolean; use: (() => unknown) | null } = { touched: false, mine: false, use: null }

const linesOf = (categories: Category[], currency: string): Line[] => categories.map((c, key) => {
  const n = currency ? Number(c.budget) || 0 : suggested(Number(c.budget) || 0, guessCurrency())
  return { key, name: c.name, amount: n ? String(n) : "" }
})

// A new budget's first screen: the person sets what they can spend a month before the app says
// anything is "left". The categories the app starts with are suggestions, with amounts in the
// currency their device most likely uses (blank when that can't be told): change a name or an
// amount, remove what you don't need, add your own, then Start. No "left this month" and no "a day"
// here: those are the person's numbers, not ours (council round 3: a new budget opened on
// "11,800 kr left" before anyone had set a budget). Everything can be changed later under Budget.
export default function Setup() {
  const b = useBudget()
  const [currency, setCurrency] = useState(() => b.currency || guessCurrency())
  const [lines, setLines] = useState<Line[]>(() => linesOf(b.categories, b.currency))
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [touched, setTouched] = useState(false)
  // The suggestions themselves changed (the person's AI wrote others) and nothing was touched here.
  const seed = JSON.stringify([b.categories, b.currency])
  useEffect(() => { if (!touched) { setLines(linesOf(b.categories, b.currency)); setCurrency(b.currency || guessCurrency()) } }, [seed])
  useEffect(() => { draft.touched = false; draft.mine = false; draft.use = null }, [])

  const typed = name.trim()
  const has = (n: string) => lines.some((l) => l.name.trim().toLowerCase() === n.toLowerCase())
  // What Start would save: every named line, and a category still sitting in the last row.
  const chosen = [...lines.filter((l) => l.name.trim()).map((l) => ({ name: l.name.trim(), budget: number(l.amount) })),
    ...(typed && !has(typed) ? [{ name: typed, budget: number(amount) }] : [])]
  const total = chosen.reduce((t, c) => t + c.budget, 0)
  draft.touched = touched || !!typed
  draft.use = total ? () => b.start(chosen, currency.trim()) : null

  const change = (key: number, patch: Partial<Line>) => { setTouched(true); setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l))) }
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!typed || has(typed)) return
    setTouched(true)
    setLines([...lines, { key: Math.max(-1, ...lines.map((l) => l.key)) + 1, name: typed, amount }])
    setName(""); setAmount("")
  }

  return (
    <FirstScreen title="Set your monthly budget" lead="What you can spend on each a month. Change the names and amounts, and remove what you don't need."
      ai="Set it here, or tell your AI and it sets this up." foot="Change categories, recurring bills and rollover in Budget.">
      {/* The currency sits over the amounts it belongs to, so the whole budget and its Start button
          fit a Mac note without scrolling. */}
      <Section title={lines.length ? "Suggestions" : undefined} action={
        <label className="-my-1 flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">Currency
          <input aria-label="Currency" placeholder="kr, $, €" className={cn(inputClass, "h-9 w-20 text-center text-[0.9375rem]")} value={currency} onInput={(e) => { setTouched(true); setCurrency(e.currentTarget.value.slice(0, 4)) }} />
        </label>}>
        {lines.map((l) => (
          <Row key={l.key} className="gap-2 py-1.5 pr-1">
            <input aria-label={`Name of ${l.name || "category"}`} value={l.name} onInput={(e) => change(l.key, { name: e.currentTarget.value })}
              className="h-10 min-w-0 flex-1 rounded-lg border-0 bg-transparent px-0 font-medium text-foreground focus:bg-[var(--amber-field)] focus:px-2" />
            <input aria-label={`${l.name || "Category"} a month`} inputMode="numeric" placeholder="0" value={l.amount} onInput={(e) => change(l.key, { amount: e.currentTarget.value })}
              className={cn(inputClass, "h-10 w-24 shrink-0 text-right tabular-nums")} />
            <button type="button" aria-label={`Remove ${l.name || "category"}`} onClick={() => { setTouched(true); setLines(lines.filter((x) => x.key !== l.key)) }} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
          </Row>
        ))}
        <form onSubmit={add} className="flex min-h-11 items-center gap-2 border-t border-border px-4 py-1.5 first:border-t-0">
          <input aria-label="New category" placeholder="Add your own" className={cn(inputClass, "h-10 min-w-0 flex-1")} value={name} onInput={(e) => setName(e.currentTarget.value)} />
          <input aria-label="New category a month" placeholder="0" inputMode="numeric" className={cn(inputClass, "h-10 w-24 text-right tabular-nums")} value={amount} onInput={(e) => setAmount(e.currentTarget.value)} />
          <TintButton type="submit" aria-label="Add category" disabled={!typed} className="h-10 w-10 shrink-0 px-0"><Plus /></TintButton>
        </form>
      </Section>
      <PrimaryButton disabled={!total} onClick={() => { draft.mine = true; return b.start(chosen, currency.trim()) }}>
        {total ? `Start with ${money(total, currency.trim())} a month` : "Enter an amount to start"}
      </PrimaryButton>
    </FirstScreen>
  )
}
