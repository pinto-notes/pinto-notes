import { useLayoutEffect, useState } from "react"
import { route } from "amber-router"
import { Check, House, Pencil, Plus, X } from "lucide-react"
import { Bar, DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Section, Sheet, Title, TintButton } from "@/components/kit"
import { BackToThisWeek, WeekSwitch } from "@/components/week-switch"
import { range, shownAisles, useMeals, useWeek, weekName, type Grocery } from "@/lib/meals"
import { cn } from "@/lib/utils"

// The week's grocery list, made from its dinners: one line per thing (the same thing in two dinners
// is one line, amounts added up), by aisle in the order the person walks the shop, less what's
// always in the cupboard. A tap ticks a thing off; ticked things drop to the bottom of their aisle.
// Add something the dinners don't need; the pencil renames a thing, moves it to another aisle or
// says it's in the cupboard; the cross takes it off (with Undo). Aisles sit side by side on a wide note.
export default function Groceries() {
  const m = useMeals()
  const [week] = useWeek()
  const list = m.list(week)
  const [text, setText] = useState("")
  const [qty, setQty] = useState("")
  const [aisle, setAisle] = useState<string | null>(null)
  const [editing, setEditing] = useState<Grocery | null>(null)
  // The tick springs when it's ticked here, not every time the list opens.
  const [popped, setPopped] = useState<string[]>([])
  const tick = (x: Grocery) => { if (!x.bought) setPopped([...popped, x.key]); return m.toggleBought(week, x.key) }
  const aisles = shownAisles(m.aisles)
  // The aisle a typed thing went in before, until the person picks one.
  const into = aisle ?? (text.trim() ? m.aisleFor(text) : "Other")

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await m.addExtra(week, text.trim(), qty.trim(), into)
    setText(""); setQty(""); setAisle(null)
  }
  const drop = async (x: Grocery) => {
    const before = m.snapshot()
    setEditing(null)
    await m.removeItem(week, x.key)
    offerUndo(`Took ${x.name} off the list`, () => m.restore(before))
  }
  const toCupboard = async (x: Grocery) => {
    const before = m.snapshot()
    setEditing(null)
    await m.setCupboard([...m.cupboard, x.name])
    offerUndo(`${x.name} is in the cupboard now: left off every list`, () => m.restore(before))
  }

  return (
    <>
      <Title subtitle={`${weekName(week)} · ${range(week)}`} title="Groceries" action={<WeekSwitch />} />
      <BackToThisWeek />
      <p className="-mt-3 mb-3 px-1 text-[0.9375rem] text-muted-foreground" data-testid="bought">{list.items.length ? `${list.bought} of ${list.items.length} bought` : "Nothing on the list yet"}</p>
      <Bar className="mb-5" value={list.items.length ? list.bought / list.items.length : 0} label="Bought" />
      <Section title="Add to the list">
        <form onSubmit={add} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 min-[700px]:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,2fr)_auto]">
          <input aria-label="New item" placeholder="Add something" className={cn(inputClass, "col-span-2 col-start-1 row-start-1 h-10 min-[700px]:col-span-1")} value={text} onInput={(e) => setText(e.currentTarget.value)} />
          <input aria-label="Amount" placeholder="Amount" className={cn(inputClass, "col-start-1 row-start-2 h-10 min-[700px]:col-start-2 min-[700px]:row-start-1")} value={qty} onInput={(e) => setQty(e.currentTarget.value)} />
          <select aria-label="Aisle" className={cn(inputClass, "col-span-2 col-start-2 row-start-2 h-10 px-2 text-[0.9375rem] min-[700px]:col-span-1 min-[700px]:col-start-3 min-[700px]:row-start-1")} value={into} onChange={(e) => setAisle(e.currentTarget.value)}>
            {aisles.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <TintButton type="submit" aria-label="Add item" disabled={!text.trim()} className="col-start-3 row-start-1 h-10 w-10 px-0 min-[700px]:col-start-4"><Plus /></TintButton>
        </form>
      </Section>
      {!list.items.length && <p className="px-1 pb-6 text-muted-foreground">Plan a dinner with what it needs and it lands here, by aisle. Or add something above.</p>}
      <div className="grid grid-cols-1 gap-x-6 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {aisles.map((a) => {
          const items = list.items.filter((x) => x.aisle === a)
          if (!items.length) return null
          const order = [...items.filter((x) => !x.bought), ...items.filter((x) => x.bought)]
          return (
            <Section key={a} title={`${a} · ${items.filter((x) => x.bought).length} of ${items.length}`}>
              {order.map((x) => (
                <div key={x.key} className="flex min-h-11 items-center border-t border-border first:border-t-0">
                  <button type="button" aria-label={x.name} aria-pressed={x.bought} onClick={() => tick(x)} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 py-2 pl-4 pr-1 text-left">
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none", x.bought ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent", x.bought && popped.includes(x.key) && "tick-pop")}>
                      <Check className="size-3.5" strokeWidth={3.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block", x.bought && "text-muted-foreground line-through decoration-1")}>{x.name}{x.qty && <span className="text-muted-foreground"> · {x.qty}</span>}</span>
                      {x.for.length > 0 && !x.bought && <span className="block truncate text-[0.8125rem] text-muted-foreground">For {x.for.join(", ")}</span>}
                    </span>
                  </button>
                  <button type="button" aria-label={`Edit ${x.name}`} onClick={() => setEditing(x)} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"><Pencil className="size-4" /></button>
                  <button type="button" aria-label={`Remove ${x.name}`} onClick={() => drop(x)} className="mr-1 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"><X className="size-4" /></button>
                </div>
              ))}
            </Section>
          )
        })}
      </div>
      {list.leftOut.length > 0 && (
        <p className="px-1 pb-6 text-[0.8125rem] text-muted-foreground" data-testid="left-out">
          Left off, already in the cupboard: {list.leftOut.join(", ")}.{" "}
          <a href="#/settings" onClick={(e) => { e.preventDefault(); route("/settings") }} className="font-medium text-link">Change the cupboard</a>
        </p>
      )}
      <ItemSheet item={editing} aisles={aisles} onClose={() => setEditing(null)} onDelete={drop} onCupboard={toCupboard}
        onSave={async (name, a, q) => { if (editing) await m.editItem(week, editing, name, a, q); setEditing(null) }} />
    </>
  )
}

function ItemSheet({ item, aisles, onClose, onSave, onDelete, onCupboard }: {
  item: Grocery | null; aisles: string[]; onClose: () => void
  onSave: (name: string, aisle: string, qty?: string) => unknown; onDelete: (x: Grocery) => unknown; onCupboard: (x: Grocery) => unknown
}) {
  const [name, setName] = useState("")
  const [qty, setQty] = useState("")
  const [aisle, setAisle] = useState("Other")
  useLayoutEffect(() => { if (item) { setName(item.name); setQty(item.qty); setAisle(item.aisle) } }, [item])
  // An amount set by hand is changed here; one that comes from dinners is changed in the dinner.
  const own = !!item?.extra && !item.for.length
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), aisle, own ? qty.trim() : undefined)
  }
  return (
    <Sheet open={item !== null} title="Edit item" onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Item" htmlFor="g-name"><input id="g-name" className={inputClass} value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
        {own && <Field label="Amount" htmlFor="g-qty"><input id="g-qty" className={inputClass} value={qty} onInput={(e) => setQty(e.currentTarget.value)} /></Field>}
        <Field label="Aisle" htmlFor="g-aisle">
          <select id="g-aisle" className={inputClass} value={aisle} onChange={(e) => setAisle(e.currentTarget.value)}>
            {aisles.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        {item && item.for.length > 0 && <p className="-mt-2 mb-4 text-[0.8125rem] text-muted-foreground">For {item.for.join(", ")}{item.qty ? `: ${item.qty} in all` : ""}. Change the amounts in the dinners.</p>}
        <PrimaryButton type="submit" disabled={!name.trim()}>Save</PrimaryButton>
        {item && <button type="button" onClick={() => onCupboard(item)} className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-link active:opacity-70"><House className="size-[18px]" /> Always in the cupboard</button>}
        {item && <DeleteButton className="mt-0" onClick={() => onDelete(item)}>Take off the list</DeleteButton>}
      </form>
    </Sheet>
  )
}
