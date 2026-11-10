import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   currency:   "kr"   (shown after amounts; "$", "€" and "£" go before; "" shows plain numbers)
//   categories: [{ name, budget }]   the monthly budget per category
//   expenses:   [{ id, date: "yyyy-mm-dd", what, category, amount, rec }]   rec: the bill it came from
//   recurring:  [{ id, what, category, amount, day, last }]   monthly bills, added on their day;
//               last is the month ("yyyy-mm") it was last added
//   rollover:   "yyyy-mm" or null   from that month on, what's left in a category carries over
//   started:    "yyyy-mm-dd"   the day the person set their budget. A budget with no started, no
//               expenses and no bills opens on "Set your monthly budget" (src/screens/setup.tsx):
//               the categories it holds are suggestions until then.
export type Category = { name: string; budget: number }
export type Expense = { id: string; date: string; what: string; category: string; amount: number; rec?: string }
export type Bill = { id: string; what: string; category: string; amount: number; day: number; last?: string }

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
/** "Amount (kr)", or "Amount" when no currency is set. */
export const amountLabel = (currency: string) => (currency ? `Amount (${currency})` : "Amount")
/** The currency people most likely use where this device is set up, from its language and region
 *  ("sv-SE" → "kr", "en-GB" → "£"). "" when it can't tell: amounts then show as plain numbers until
 *  the person types theirs. */
export function guessCurrency(locale: string = typeof navigator === "undefined" ? "" : navigator.language): string {
  let region = ""
  try { region = new Intl.Locale(locale).maximize().region ?? "" } catch { return "" }
  if (["SE", "NO", "DK", "IS"].includes(region)) return "kr"
  if (["US", "CA", "AU", "NZ", "SG", "HK", "MX"].includes(region)) return "$"
  if (["GB", "IM", "JE", "GG"].includes(region)) return "£"
  if (["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"].includes(region)) return "€"
  if (region === "CH") return "CHF"
  if (region === "JP" || region === "CN") return "¥"
  if (region === "IN") return "₹"
  if (region === "PL") return "zł"
  return ""
}
/** A starter amount in a currency: the suggestions are written in kronor, a tenth of that reads
 *  right in dollars, euros and pounds, and elsewhere the amount is left for the person to fill in. */
export const suggested = (kr: number, currency: string) => (currency === "kr" ? kr : /^[$€£]$/.test(currency) || currency === "CHF" ? Math.round(kr / 10) : 0)
export const newId = (p = "e") => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
/** The date a bill falls on in month m (the 31st is the last day of a short month). */
export const billDate = (b: Bill, m: string) => `${m}-${String(Math.min(Math.max(1, b.day || 1), daysIn(m))).padStart(2, "0")}`
export const ordinal = (n: number) => n + (n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th")

export function useBudget() {
  const [currency, setCurrency] = useStore<string>("currency", "")
  const [categories, setCategories] = useStore<Category[]>("categories", [])
  const [expenses, setExpenses] = useStore<Expense[]>("expenses", [])
  const [recurring, setRecurring] = useStore<Bill[]>("recurring", [])
  const [rollover, setRollover] = useStore<string | null>("rollover", null)
  const [started, setStarted] = useStore<string | null>("started", null)
  const cats = (categories ?? []) as Category[], list = (expenses ?? []) as Expense[], cur = (currency ?? "") as string
  const bills = ((recurring ?? []) as Bill[]).slice().sort((a, b) => a.day - b.day)
  const from = typeof rollover === "string" && /^\d{4}-\d{2}$/.test(rollover) ? rollover : null
  // A new budget: nothing set yet, so nothing is "left". Its categories are suggestions.
  const fresh = !started && !list.length && !((recurring ?? []) as Bill[]).length

  const spentIn = (m: string, name: string) => list.filter((e) => monthOf(e.date) === m && e.category === name).reduce((t, e) => t + (Number(e.amount) || 0), 0)
  /** What carries into month m for a category: last month's budget plus its own carry, less what was
   *  spent, from the month roll-over was turned on (at most five years back). */
  const carry = (m: string, name: string, base: number): number => {
    if (!from || m <= from) return 0
    let c = 0
    for (let x = m < shiftMonth(from, 60) ? from : shiftMonth(m, -60); x < m; x = shiftMonth(x, 1)) c = c + base - spentIn(x, name)
    return c
  }

  /** One month: what was spent per category, the budget (with what carried over), what's left. */
  const month = (m: string) => {
    const items = list.filter((e) => monthOf(e.date) === m).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    const spent = items.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const names = [...cats.map((c) => c.name), ...items.map((e) => e.category).filter((n) => !cats.some((c) => c.name === n))]
    const by = [...new Set(names)].map((name) => {
      const base = Number(cats.find((c) => c.name === name)?.budget) || 0
      const carried = cats.some((c) => c.name === name) ? carry(m, name, base) : 0
      const b = base + carried
      const s = items.filter((e) => e.category === name).reduce((t, e) => t + (Number(e.amount) || 0), 0)
      return { name, budget: b, base, carried, spent: s, left: b - s }
    })
    const budget = by.reduce((s, c) => s + c.budget, 0)
    return { items, spent, budget, left: budget - spent, by, carried: by.reduce((s, c) => s + c.carried, 0) }
  }

  const now = month(thisMonth())
  useEffect(() => { if (cats.length && !fresh) setSummary(`${money(now.left, cur)} ${now.left >= 0 ? "left" : "over"} in ${monthName(thisMonth(), false)}`) }, [now.left, cur, cats.length, fresh])

  return {
    currency: cur, categories: cats, expenses: list, month, bills, rollover: from,
    /** True until the person has set their budget (or anything is logged). */
    fresh,
    /** Sets the budget the person chose and starts the app. */
    start: async (chosen: Category[], currency: string) => {
      await setCategories(chosen)
      await setCurrency(currency)
      return setStarted(iso(new Date()))
    },
    setCurrency,
    /** Roll-over on (from this month) or off. */
    setRollover: (on: boolean) => setRollover(on ? thisMonth() : null),
    add: (e: Omit<Expense, "id">) => setExpenses((now: Expense[]) => [...(now ?? []), { id: newId(), ...e }]),
    /** A monthly bill. Its expense is added on its day each month (today, if that day has passed). */
    addBill: (b: Omit<Bill, "id"> & { id?: string }) => setRecurring([...bills, { ...b, id: b.id ?? newId("r") }]),
    updateBill: (id: string, patch: Partial<Omit<Bill, "id">>) => setRecurring(bills.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    removeBill: (id: string) => setRecurring(bills.filter((b) => b.id !== id)),
    restoreBills: (all: Bill[]) => setRecurring(all),
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
      const billsMoved = bills.map((b) => (b.category === from ? { ...b, category: to } : b))
      return Promise.resolve(setCategories(cats.map((c) => (c.name === from ? { ...c, name: to } : c)))).then(() => setExpenses(moved))
        .then(() => (bills.some((b) => b.category === from) ? setRecurring(billsMoved) : undefined))
    },
    /** Adds this month's expense for each bill whose day has come and that isn't in yet. */
    postBills: async () => {
      const m = thisMonth(), todayIso = iso(new Date())
      const due = bills.filter((b) => (b.last ?? "") < m && billDate(b, m) <= todayIso)
      if (!due.length) return
      await setExpenses((now: Expense[]) => [...(now ?? []), ...due.map((b) => ({ id: newId(), date: billDate(b, m), what: b.what, category: b.category, amount: b.amount, rec: b.id }))])
      await setRecurring((now: Bill[]) => (now ?? []).map((b) => (due.some((d) => d.id === b.id) ? { ...b, last: m } : b)))
    },
    removeCategory: (name: string) => setCategories(cats.filter((c) => c.name !== name)),
    restoreCategories: (all: Category[]) => setCategories(all),
  }
}
