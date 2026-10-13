import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   currency:   "kr"   (shown after amounts; "$", "€" and "£" go before)
//   categories: [{ name, budget }]   the monthly budget per category
//   expenses:   [{ id, date: "yyyy-mm-dd", what, category, amount }]
export type Category = { name: string; budget: number }
export type Expense = { id: string; date: string; what: string; category: string; amount: number }

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const monthOf = (date: string) => date.slice(0, 7)
export const thisMonth = () => monthOf(iso(new Date()))
export const shiftMonth = (m: string, by: number) => { const d = new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1 + by, 1); return iso(d).slice(0, 7) }
export const monthName = (m: string, year = true) => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1).toLocaleDateString("en-GB", year ? { month: "long", year: "numeric" } : { month: "long" })
export const daysIn = (m: string) => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)), 0).getDate()

const num = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 })
export const money = (n: number, currency: string) => {
  const s = num.format(Math.round(Math.abs(n) * 100) / 100)
  return /^[$€£]$/.test(currency) ? `${n < 0 ? "-" : ""}${currency}${s}` : `${n < 0 ? "-" : ""}${s} ${currency}`.trim()
}
export const newId = () => "e" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function useBudget() {
  const [currency, setCurrency] = useStore<string>("currency", "kr")
  const [categories, setCategories] = useStore<Category[]>("categories", [])
  const [expenses, setExpenses] = useStore<Expense[]>("expenses", [])
  const cats = (categories ?? []) as Category[], list = (expenses ?? []) as Expense[], cur = (currency ?? "kr") as string

  /** One month: what was spent per category, the budget, what's left. */
  const month = (m: string) => {
    const items = list.filter((e) => monthOf(e.date) === m).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    const spent = items.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const budget = cats.reduce((s, c) => s + (Number(c.budget) || 0), 0)
    const names = [...cats.map((c) => c.name), ...items.map((e) => e.category).filter((n) => !cats.some((c) => c.name === n))]
    const by = [...new Set(names)].map((name) => {
      const b = Number(cats.find((c) => c.name === name)?.budget) || 0
      const s = items.filter((e) => e.category === name).reduce((t, e) => t + (Number(e.amount) || 0), 0)
      return { name, budget: b, spent: s, left: b - s }
    })
    return { items, spent, budget, left: budget - spent, by }
  }

  const now = month(thisMonth())
  useEffect(() => { if (cats.length) setSummary(`${money(now.left, cur)} ${now.left >= 0 ? "left" : "over"} in ${monthName(thisMonth(), false)}`) }, [now.left, cur, cats.length])

  return {
    currency: cur, categories: cats, expenses: list, month,
    setCurrency,
    add: (e: Omit<Expense, "id">) => setExpenses([...list, { id: newId(), ...e }]),
    update: (id: string, patch: Partial<Omit<Expense, "id">>) => setExpenses(list.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    remove: (id: string) => setExpenses(list.filter((e) => e.id !== id)),
    /** Puts the whole list back (Undo after a delete). */
    restore: (all: Expense[]) => setExpenses(all),
    setBudget: (name: string, budget: number) => setCategories(cats.map((c) => (c.name === name ? { ...c, budget } : c))),
    addCategory: (name: string, budget: number) => cats.some((c) => c.name.toLowerCase() === name.toLowerCase()) ? undefined : setCategories([...cats, { name, budget }]),
    /** Renames a category and moves its expenses with it. */
    renameCategory: (from: string, to: string) => {
      if (!to || to === from || cats.some((c) => c.name.toLowerCase() === to.toLowerCase() && c.name !== from)) return
      const moved = list.map((e) => (e.category === from ? { ...e, category: to } : e))
      return Promise.resolve(setCategories(cats.map((c) => (c.name === from ? { ...c, name: to } : c)))).then(() => setExpenses(moved))
    },
    removeCategory: (name: string) => setCategories(cats.filter((c) => c.name !== name)),
    restoreCategories: (all: Category[]) => setCategories(all),
  }
}
