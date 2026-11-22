import { useLayoutEffect, useState } from "react"
import { BookOpen, Plus, X } from "lucide-react"
import { DeleteButton, Field, inputClass, PrimaryButton, Sheet } from "@/components/kit"
import { dayName, itemKey, newId, shortDay, shownAisles, weekDays, weekOf, type Dinner, type Ingredient } from "@/lib/meals"
import { cn } from "@/lib/utils"

export type Editing = { dinner?: Dinner; date: string }

// A dinner: its day, the dish, who cooks, a recipe note to link to, and what it needs, each thing
// with its amount and aisle. The ingredients are what the grocery list is made of. A new dinner can
// start from one you've had before ("Again"), which brings its recipe and ingredients with it. A
// dinner moved to a day that has one swaps with it; a new one goes on a free day.
export function DinnerSheet({ editing, dinners, cooks, aisles, aisleFor, onClose, onSave, onDelete }: {
  editing: Editing | null; dinners: Dinner[]; cooks: string[]; aisles: string[]; aisleFor: (name: string) => string
  onClose: () => void; onSave: (d: Dinner) => unknown; onDelete: (d: Dinner) => unknown
}) {
  const [date, setDate] = useState("")
  const [dish, setDish] = useState("")
  const [cook, setCook] = useState("")
  const [recipe, setRecipe] = useState("")
  const [items, setItems] = useState<Ingredient[]>([])
  const [name, setName] = useState("")
  const [qty, setQty] = useState("")
  useLayoutEffect(() => {
    if (!editing) return
    const d = editing.dinner
    setDate(d?.date ?? editing.date); setDish(d?.dish ?? ""); setCook(d?.cook ?? ""); setRecipe(d?.recipe ?? "")
    setItems(d?.ingredients.map((i) => ({ ...i })) ?? []); setName(""); setQty("")
  }, [editing])
  if (!editing) return null
  const isNew = !editing.dinner
  const days = weekDays(weekOf(editing.date))
  const taken = (day: string) => dinners.some((d) => d.date === day && d.id !== editing.dinner?.id)
  const swapWith = !isNew && date !== editing.dinner!.date ? dinners.find((d) => d.date === date && d.id !== editing.dinner!.id) : undefined
  // Dinners you've had before, newest first, one of each dish, not already this week.
  const thisWeek = new Set(dinners.filter((d) => days.includes(d.date)).map((d) => d.dish.toLowerCase()))
  const before: Dinner[] = []
  for (const d of [...dinners].sort((a, b) => (a.date < b.date ? 1 : -1))) {
    if (!d.dish.trim() || thisWeek.has(d.dish.toLowerCase()) || before.some((x) => x.dish.toLowerCase() === d.dish.toLowerCase())) continue
    before.push(d)
  }
  const again = (d: Dinner) => { setDish(d.dish); setRecipe(d.recipe ?? ""); setItems(d.ingredients.map((i) => ({ ...i }))); if (d.cook && !cook) setCook(d.cook) }

  const addItem = () => {
    if (!name.trim()) return
    setItems([...items, { name: name.trim(), ...(qty.trim() ? { qty: qty.trim() } : {}), aisle: aisleFor(name) }])
    setName(""); setQty("")
  }
  const change = (n: number, patch: Partial<Ingredient>) => setItems(items.map((x, i) => (i === n ? { ...x, ...patch } : x)))
  const ok = !!dish.trim() && (!isNew || !taken(date))
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    // A thing still in the Add field counts: it isn't lost by pressing Save before +.
    const all = [...items, ...(name.trim() ? [{ name: name.trim(), ...(qty.trim() ? { qty: qty.trim() } : {}), aisle: aisleFor(name) }] : [])]
      .map((i) => ({ name: i.name.trim(), ...(i.qty?.trim() ? { qty: i.qty.trim() } : {}), ...(i.aisle ? { aisle: i.aisle } : {}) }))
      .filter((i) => i.name)
    onSave({
      id: editing.dinner?.id ?? newId("d"), date, dish: dish.trim(),
      ...(cook ? { cook } : {}), ...(recipe.trim() ? { recipe: recipe.trim().replace(/^pinto:/, "").replace(/\.md$/, "") } : {}),
      ingredients: all,
    })
  }

  return (
    <Sheet open title={isNew ? `Dinner on ${dayName(editing.date)}` : "Edit dinner"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Dish" htmlFor="d-dish"><input id="d-dish" className={inputClass} placeholder="Lemon chicken with rice" value={dish} onInput={(e) => setDish(e.currentTarget.value)} /></Field>
        {isNew && !dish.trim() && before.length > 0 && (
          <div className="-mt-2 mb-4">
            <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Had before</p>
            <div className="flex flex-wrap gap-2">
              {before.slice(0, 6).map((d) => (
                <button key={d.id} type="button" aria-label={`Again: ${d.dish}`} onClick={() => again(d)} className="h-9 rounded-full bg-[var(--amber-accent-soft)] px-3.5 text-[0.9375rem] font-medium text-link">{d.dish}</button>
              ))}
            </div>
          </div>
        )}
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Day</p>
          <div role="radiogroup" aria-label="Day" className="grid grid-cols-7 gap-1">
            {days.map((day) => (
              <button key={day} type="button" role="radio" aria-checked={date === day} aria-label={dayName(day)} disabled={isNew && taken(day)} onClick={() => setDate(day)}
                className={cn("flex h-12 flex-col items-center justify-center rounded-xl text-[0.75rem] font-medium leading-tight disabled:opacity-35", date === day ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                <span>{shortDay(day)}</span><span className="text-[0.9375rem] font-semibold tabular-nums">{Number(day.slice(8))}</span>
              </button>
            ))}
          </div>
          {swapWith && <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">Swaps with {swapWith.dish}, which moves to {dayName(editing.dinner!.date)}.</p>}
        </div>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Who cooks</p>
          <div role="radiogroup" aria-label="Who cooks" className="flex flex-wrap gap-2">
            {cooks.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={cook === c} onClick={() => setCook(cook === c ? "" : c)}
                className={cn("h-11 rounded-full px-4 text-[0.9375rem] font-medium", cook === c ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{c}</button>
            ))}
          </div>
        </div>
        <Field label="Recipe note (optional)" htmlFor="d-recipe">
          <div className="flex items-center gap-2">
            <input id="d-recipe" className={cn(inputClass, "min-w-0 flex-1")} placeholder="Recipes/Lemon chicken" value={recipe} onInput={(e) => setRecipe(e.currentTarget.value)} />
            {recipe.trim() && <a href={`pinto:${recipe.trim().replace(/^pinto:/, "")}`} aria-label="Open the recipe" className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-link"><BookOpen className="size-5" /></a>}
          </div>
        </Field>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">What it needs</p>
          <div className="overflow-hidden rounded-xl bg-card">
            {items.map((x, n) => (
              <div key={n} className="flex items-center gap-2 border-t border-border px-3 py-2 first:border-t-0">
                <input aria-label={`Ingredient ${n + 1}`} className={cn(inputClass, "h-10 min-w-0 flex-[2]")} value={x.name} onInput={(e) => change(n, { name: e.currentTarget.value })} />
                <input aria-label={`Amount ${n + 1}`} placeholder="Amount" className={cn(inputClass, "h-10 w-20 min-w-0 flex-1")} value={x.qty ?? ""} onInput={(e) => change(n, { qty: e.currentTarget.value })} />
                <select aria-label={`Aisle ${n + 1}`} className={cn(inputClass, "h-10 w-28 min-w-0 flex-1 px-2 text-[0.875rem]")} value={shownAisles(aisles).includes(x.aisle ?? "") ? x.aisle : "Other"} onChange={(e) => change(n, { aisle: e.currentTarget.value })}>
                  {shownAisles(aisles).map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button type="button" aria-label={`Remove ${x.name || "ingredient"}`} onClick={() => setItems(items.filter((_, i) => i !== n))} className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground"><X className="size-4" /></button>
              </div>
            ))}
            <div className="flex items-center gap-2 border-t border-border px-3 py-2 first:border-t-0">
              <input aria-label="New ingredient" placeholder="Add an ingredient" className={cn(inputClass, "h-10 min-w-0 flex-[2]")} value={name} onInput={(e) => setName(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem() } }} />
              <input aria-label="New amount" placeholder="Amount" className={cn(inputClass, "h-10 w-20 min-w-0 flex-1")} value={qty} onInput={(e) => setQty(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem() } }} />
              <button type="button" aria-label="Add ingredient" disabled={!name.trim()} onClick={addItem} className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--amber-accent-soft)] text-link disabled:opacity-40"><Plus className="size-5" /></button>
            </div>
          </div>
          {items.some((x) => items.filter((y) => itemKey(y.name) === itemKey(x.name)).length > 1) && <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">Things listed twice are one line on the grocery list.</p>}
        </div>
        <PrimaryButton type="submit" disabled={!ok}>{isNew ? "Add dinner" : "Save"}</PrimaryButton>
        {!isNew && <DeleteButton onClick={() => onDelete(editing.dinner!)}>Delete dinner</DeleteButton>}
      </form>
    </Sheet>
  )
}
