import { cn } from "@/lib/utils"
import { useLayoutEffect, useRef, useState } from "react"
import { ChevronRight, Plus, Trash2 } from "lucide-react"
import { BillSheet } from "@/components/bill-sheet"
import { inputClass, offerUndo, Row, Section, Title, TintButton, Toggle } from "@/components/kit"
import { money, monthName, ordinal, useBudget, type Bill, type Category } from "@/lib/budget"

// The monthly budget per category (rename, change, add, remove), monthly bills, roll-over and the
// currency. Two columns on a wide note.
export default function Budget() {
  const b = useBudget()
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [bill, setBill] = useState<Bill | "new" | null>(null)
  const total = b.categories.reduce((s, c) => s + (Number(c.budget) || 0), 0)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await b.addCategory(name.trim(), Math.max(0, Number(amount) || 0))
    setName(""); setAmount("")
  }
  const drop = async (c: Category) => {
    const before = b.categories
    await b.removeCategory(c.name)
    offerUndo(`Removed ${c.name}`, () => b.restoreCategories(before))
  }

  return (
    <>
      <Title title="Budget" subtitle={`${money(total, b.currency)} a month`} />
      <div className="min-[700px]:grid min-[700px]:grid-cols-2 min-[700px]:items-start min-[700px]:gap-6">
      <div>
      <Section title="Each month" footer="Tap a name to rename it; its expenses move with it. Expenses keep their category when you remove one here.">
        {!b.categories.length && <p className="px-4 pt-4 text-center text-muted-foreground">No categories yet. Add the first one below, with what you can spend on it a month.</p>}
        {b.categories.map((c) => (
          <Row key={c.name} className="gap-2 pr-1">
            <CategoryName name={c.name} onRename={(to) => b.renameCategory(c.name, to)} />
            <LiveInput label={`${c.name} budget`} numeric className="w-24 shrink-0 text-right tabular-nums" value={String(c.budget)}
              clean={(v) => String(Math.max(0, Number(v.replace(/[^\d.]/g, "")) || 0))} onSave={(v) => b.setBudget(c.name, Number(v))} />
            <button type="button" aria-label={`Remove ${c.name}`} onClick={() => drop(c)} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
          </Row>
        ))}
        <form onSubmit={add} className="flex min-h-11 items-center gap-2 border-t border-border px-4 py-2.5 first:border-t-0">
          <input aria-label="New category" placeholder="New category" className={cn(inputClass, "h-10 min-w-0 flex-1")} value={name} onInput={(e) => setName(e.currentTarget.value)} />
          <input aria-label="New category budget" placeholder="0" inputMode="numeric" className={cn(inputClass, "h-10 w-24 text-right tabular-nums")} value={amount} onInput={(e) => setAmount(e.currentTarget.value)} />
          <TintButton type="submit" aria-label="Add category" disabled={!name.trim()} className="h-10 w-10 shrink-0 px-0"><Plus /></TintButton>
        </form>
      </Section>
      </div>
      <div>
      <Section title="Every month" action={<TintButton className="-my-2 h-11 bg-transparent px-2 text-[0.9375rem]" onClick={() => setBill("new")}><Plus /> Add bill</TintButton>}
        footer="Rent, subscriptions and other bills are added as expenses on their day each month.">
        {!b.bills.length && <p className="px-4 py-5 text-center text-muted-foreground">No monthly bills yet.</p>}
        {b.bills.map((x) => (
          <Row key={x.id} className="p-0">
            <button type="button" aria-label={`Edit ${x.what}`} onClick={() => setBill(x)} className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{x.what}</p>
                <p className="text-[0.8125rem] text-muted-foreground">{x.category} · on the {ordinal(x.day)}</p>
              </div>
              <span className="font-semibold tabular-nums">{money(x.amount, b.currency)}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </Row>
        ))}
      </Section>
      <Section footer={b.rollover ? `Since ${monthName(b.rollover)}, what's left in a category (or what went over) carries into the next month.` : "Carry what's left in each category into the next month, and what went over out of it."}>
        <Toggle label="Roll over what's left" checked={!!b.rollover} onChange={(on) => b.setRollover(on)} />
      </Section>
      <Section title="Currency">
        <Row>
          <label htmlFor="currency" className="flex-1 font-medium">Shown with amounts</label>
          <LiveInput id="currency" className="w-24 text-center" value={b.currency} clean={(v) => v.slice(0, 4)} onSave={(v) => b.setCurrency(v)} />
        </Row>
      </Section>
      </div>
      </div>
      <BillSheet bill={bill} onClose={() => setBill(null)} />
    </>
  )
}

// A category's name as a quiet field: it saves when you press Return or leave it.
function CategoryName({ name, onRename }: { name: string; onRename: (to: string) => unknown }) {
  const [text, setText] = useState(name)
  const commit = () => { const t = text.trim(); if (t && t !== name) onRename(t); else setText(name) }
  return (
    <form className="min-w-0 flex-1" onSubmit={(e) => { e.preventDefault(); commit() }}>
      <input aria-label={`${name} name`} value={text} onInput={(e) => setText(e.currentTarget.value)} onBlur={commit}
        className="h-10 w-full min-w-0 rounded-lg border-0 bg-transparent px-0 font-medium text-foreground focus:bg-[var(--amber-field)] focus:px-2" />
    </form>
  )
}

// A field that saves as you type. It keeps what you typed while the saves go through, and takes the
// saved value again only when it changes from elsewhere (the AI, another device).
function LiveInput({ value, onSave, clean = (v) => v, label, id, numeric, className }: { value: string; onSave: (v: string) => unknown; clean?: (v: string) => string; label?: string; id?: string; numeric?: boolean; className?: string }) {
  const [text, setText] = useState(value)
  const sent = useRef(new Set<string>())
  useLayoutEffect(() => { if (!sent.current.has(value)) { sent.current.clear(); setText(value) } }, [value])
  return (
    <input id={id} aria-label={label} inputMode={numeric ? "numeric" : undefined} className={cn(inputClass, "h-10", className)} value={text}
      onInput={(e) => { const v = e.currentTarget.value; setText(v); sent.current.add(clean(v)); onSave(clean(v)) }} />
  )
}
