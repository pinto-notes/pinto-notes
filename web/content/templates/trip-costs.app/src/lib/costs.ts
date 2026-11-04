import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   name:     "Lisbon"                       the trip's name, shown as the title
//   currency: "€"                            a sign goes in front (€42), a word after (42 kr)
//   people:   [{ id, name }]
//   costs:    [{ id, what, amount, paidBy, date, split, among?, shares? }]
//             paidBy is a person's id; amount a number; date "yyyy-mm-dd"
//             split "equal": among is the ids it's split between (missing: everyone)
//             split "shares": shares is { id: number }, e.g. { "p1": 2, "p2": 1 } (missing or 0: none)
//   payments: [{ id, from, to, amount, date }]   money paid back to settle up
export type Person = { id: string; name: string }
export type Cost = { id: string; what: string; amount: number; paidBy: string; date?: string; split: "equal" | "shares"; among?: string[]; shares?: Record<string, number> }
export type Payment = { id: string; from: string; to: string; amount: number; date?: string }
export type Transfer = { from: string; to: string; amount: number }

const cents = (n: number) => Math.round(n * 100)

/** What each person owes of one cost, in cents, adding up to the cost exactly. A cent left over
 *  from rounding goes to the first people in the list, so nothing is lost or made up. */
export function owed(cost: Cost, people: Person[]): Record<string, number> {
  const total = cents(cost.amount)
  const ids = people.map((p) => p.id)
  let weights: [string, number][]
  if (cost.split === "shares") {
    weights = ids.map((id) => [id, Math.max(0, Number(cost.shares?.[id] ?? 0))] as [string, number]).filter(([, w]) => w > 0)
  } else {
    const among = cost.among?.length ? cost.among.filter((id) => ids.includes(id)) : ids
    weights = among.map((id) => [id, 1] as [string, number])
  }
  // Split between nobody: the one who paid carries it.
  if (!weights.length) weights = [[cost.paidBy, 1]]
  const sum = weights.reduce((s, [, w]) => s + w, 0)
  const out: Record<string, number> = {}
  let given = 0
  for (const [id, w] of weights) { out[id] = Math.floor((total * w) / sum); given += out[id] }
  for (let i = 0; given < total; i = (i + 1) % weights.length) { out[weights[i][0]] += 1; given += 1 }
  return out
}

/** Each person's balance in cents: what they paid less what they owe. Above zero, they're owed. */
export function balances(people: Person[], costs: Cost[], payments: Payment[]): Record<string, number> {
  const b: Record<string, number> = Object.fromEntries(people.map((p) => [p.id, 0]))
  for (const c of costs) {
    b[c.paidBy] = (b[c.paidBy] ?? 0) + cents(c.amount)
    for (const [id, n] of Object.entries(owed(c, people))) b[id] = (b[id] ?? 0) - n
  }
  for (const p of payments) {
    b[p.from] = (b[p.from] ?? 0) + cents(p.amount)
    b[p.to] = (b[p.to] ?? 0) - cents(p.amount)
  }
  return b
}

/** Who pays whom to settle up, in as few payments as it takes: the one who owes most pays the one
 *  owed most, until everyone is square. Amounts in the currency (not cents). */
export function settle(balance: Record<string, number>): Transfer[] {
  const debt = Object.entries(balance).filter(([, n]) => n < 0).map(([id, n]) => ({ id, n: -n }))
  const credit = Object.entries(balance).filter(([, n]) => n > 0).map(([id, n]) => ({ id, n }))
  const out: Transfer[] = []
  for (;;) {
    debt.sort((a, b) => b.n - a.n); credit.sort((a, b) => b.n - a.n)
    const d = debt[0], c = credit[0]
    if (!d || !c || d.n === 0 || c.n === 0) break
    const n = Math.min(d.n, c.n)
    out.push({ from: d.id, to: c.id, amount: n / 100 })
    d.n -= n; c.n -= n
  }
  return out
}

const num = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
/** "€42", "€42.50", "42 kr": a sign in front, a word after. */
export function money(n: number, currency: string) {
  const whole = Math.round(Math.abs(n) * 100) / 100
  const s = Number.isInteger(whole) ? num.format(whole) : whole.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const c = currency.trim()
  const sign = n < 0 ? "−" : ""
  if (!c) return sign + s
  return /^[A-Za-z]/.test(c) ? `${sign}${s} ${c}` : `${sign}${c}${s}`
}

/** A typed amount: "42", "42,50", "€ 1 200.5". NaN when it isn't one. */
export function parseAmount(text: string) {
  const t = text.replace(/[^\d.,-]/g, "").replace(/,(\d{1,2})$/, ".$1").replace(/,/g, "")
  return t ? Number(t) : NaN
}

/** "Split 3 ways", "Split by share", "Sara only". */
export function splitLine(c: Cost, people: Person[]) {
  const name = (id: string) => people.find((p) => p.id === id)?.name ?? "Someone"
  if (c.split === "shares") return "Split by share"
  const among = c.among?.length ? c.among.filter((id) => people.some((p) => p.id === id)) : people.map((p) => p.id)
  if (among.length === 1) return `${name(among[0])} only`
  return among.length === people.length ? `Split ${among.length} ways` : `Split between ${among.map(name).join(" and ")}`
}

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const shortDate = (s: string) => new Date(s + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })
export const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function useCosts() {
  const [name, setName] = useStore<string>("name", "Trip costs")
  const [currency, setCurrency] = useStore<string>("currency", "€")
  const [people, setPeople] = useStore<Person[]>("people", [])
  const [costs, setCosts] = useStore<Cost[]>("costs", [])
  const [payments, setPayments] = useStore<Payment[]>("payments", [])
  const ps = (people ?? []) as Person[], cs = (costs ?? []) as Cost[], pays = (payments ?? []) as Payment[]
  const cur = (currency ?? "€") as string
  const balance = balances(ps, cs, pays)
  const transfers = settle(balance)
  const total = cs.reduce((s, c) => s + cents(c.amount), 0) / 100
  const nameOf = (id: string) => ps.find((p) => p.id === id)?.name ?? "Someone"
  const owes = (t: Transfer) => `${nameOf(t.from)} owes ${nameOf(t.to)} ${money(t.amount, cur)}`
  useEffect(() => {
    if (!cs.length) return
    setSummary(transfers.length ? transfers.slice(0, 2).map(owes).join(", ") + (transfers.length > 2 ? ` and ${transfers.length - 2} more` : "") : `All square, ${money(total, cur)} in all`)
  }, [JSON.stringify(transfers), total, cur, cs.length])
  return {
    name: (name ?? "Trip costs") as string, currency: cur, people: ps, payments: pays,
    costs: cs.slice().sort((a, b) => ((a.date ?? "") < (b.date ?? "") ? 1 : (a.date ?? "") > (b.date ?? "") ? -1 : 0)),
    balance, transfers, total, nameOf, owes,
    setName: (n: string) => setName(n),
    setCurrency: (c: string) => setCurrency(c),
    addPerson: (n: string) => setPeople([...ps, { id: newId("p"), name: n }]),
    renamePerson: (id: string, n: string) => setPeople(ps.map((p) => (p.id === id ? { ...p, name: n } : p))),
    /** A person who paid or shares in a cost stays: the costs would no longer add up. */
    inUse: (id: string) => cs.some((c) => c.paidBy === id || (c.split === "shares" ? (c.shares?.[id] ?? 0) > 0 : !c.among?.length || c.among.includes(id))) || pays.some((p) => p.from === id || p.to === id),
    removePerson: (id: string) => setPeople(ps.filter((p) => p.id !== id)),
    restorePeople: (all: Person[]) => setPeople(all),
    addCost: (c: Omit<Cost, "id">) => setCosts([...cs, { id: newId("c"), ...c }]),
    updateCost: (id: string, c: Omit<Cost, "id">) => setCosts(cs.map((x) => (x.id === id ? { id, ...c } : x))),
    removeCost: (id: string) => setCosts(cs.filter((x) => x.id !== id)),
    restoreCosts: (all: Cost[]) => setCosts(all),
    /** Records a payment back, which settles that much of what's owed. */
    pay: (t: Transfer) => setPayments([...pays, { id: newId("s"), ...t, date: iso(new Date()) }]),
    removePayment: (id: string) => setPayments(pays.filter((p) => p.id !== id)),
    restorePayments: (all: Payment[]) => setPayments(all),
  }
}
