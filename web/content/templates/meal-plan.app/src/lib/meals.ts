import { useEffect, useLayoutEffect, useState } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   dinners:  [{ id, date: "yyyy-mm-dd", dish, cook?, recipe?, ingredients: [{ name, qty?, aisle? }] }]
//             recipe is a note's path ("Recipes/Lemon chicken"): the app links to it (pinto:)
//   extras:   [{ id, week, name, qty?, aisle? }]   things added to a week's list by hand
//             week is that week's Monday, "yyyy-mm-dd" (any day of the week is read as its week)
//   bought:   { week: [key] }   what's ticked off on that week's list (key: see itemKey); a key
//             under any day of the week counts for that week, and the app writes under its Monday
//   cooks:    ["Me", "Oskar"]   who can cook, for the Who cooks choice
//   aisles:   ["Fruit and veg", …, "Other"]   in the order the person walks the shop
//   cupboard: ["Olive oil", "Rice", …]   always at home: left off every list
// A week runs Monday to Sunday. Each week has its own list; earlier weeks stay as they were.
export type Ingredient = { name: string; qty?: string; aisle?: string }
export type Dinner = { id: string; date: string; dish: string; cook?: string; recipe?: string; ingredients: Ingredient[] }
export type Extra = { id: string; week: string; name: string; qty?: string; aisle?: string }
export const AISLES = ["Fruit and veg", "Bakery", "Meat and fish", "Dairy and eggs", "Dry goods", "Tins and jars", "Frozen", "Other"]
export const OTHER = "Other"

// MARK: dates

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const noon = (s: string) => new Date(s + "T12:00:00")
export const today = () => iso(new Date())
export const plus = (s: string, n: number) => { const d = noon(s); d.setDate(d.getDate() + n); return iso(d) }
/** The Monday of the week a date is in. */
export const weekOf = (s: string) => { const d = noon(s); return plus(s, -((d.getDay() + 6) % 7)) }
export const weekDays = (week: string) => Array.from({ length: 7 }, (_, i) => plus(week, i))
export const dayName = (s: string) => noon(s).toLocaleDateString("en-GB", { weekday: "long" })
export const shortDay = (s: string) => noon(s).toLocaleDateString("en-GB", { weekday: "short" })
export const dayMonth = (s: string) => noon(s).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
/** "23 to 29 November", or "30 November to 6 December". */
export function range(week: string) {
  const end = plus(week, 6)
  return noon(week).getMonth() === noon(end).getMonth() ? `${noon(week).getDate()} to ${dayMonth(end)}` : `${dayMonth(week)} to ${dayMonth(end)}`
}
/** This week, Next week, Last week, or Week of 9 November. */
export function weekName(week: string, now = weekOf(today())) {
  if (week === now) return "This week"
  if (week === plus(now, 7)) return "Next week"
  if (week === plus(now, -7)) return "Last week"
  return `Week of ${dayMonth(week)}`
}
/** "Oskar cooks", and "You cook" for Me. */
export const cooks = (name: string) => (/^me$/i.test(name.trim()) ? "You cook" : `${name} cooks`)
export const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// MARK: the grocery list

/** One name for one thing, whatever its case or plural: "Lemons", "lemon" and " Lemon " are one. */
export function itemKey(name: string) {
  const s = name.trim().toLowerCase().replace(/\s+/g, " ")
  if (s.endsWith("ies") && s.length > 4) return s.slice(0, -3) + "y"
  if (s.endsWith("oes") && s.length > 4) return s.slice(0, -2)
  if (/(ch|sh|x)es$/.test(s)) return s.slice(0, -2)
  if (s.endsWith("s") && !s.endsWith("ss") && s.length > 3) return s.slice(0, -1)
  return s
}

/** Amounts of one thing added up: "2" and "1" are 3, "400 g" and "200 g" are 600 g, "1 tin" and
 *  "2 tins" are 3 tins; amounts that don't add up ("1 bunch" and "a handful") are both kept,
 *  "1 bunch + a handful". */
export function addAmounts(qs: (string | undefined)[]) {
  const q = qs.map((s) => (s ?? "").trim()).filter(Boolean)
  if (!q.length) return ""
  const parsed = q.map((s) => s.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/))
  if (q.length > 1 && parsed.every(Boolean)) {
    const unit = parsed[0]![2]
    if (parsed.every((m) => itemKey(m![2]) === itemKey(unit))) {
      const n = Math.round(parsed.reduce((a, m) => a + Number(m![1].replace(",", ".")), 0) * 100) / 100
      return unit ? `${n} ${n === 1 ? singular(unit) : plural(unit)}` : String(n)
    }
  }
  return [...new Set(q)].join(" + ")
}
// A unit as the amount needs it: "2 bunches", "1 tin". Short units (g, kg, l, ml) stay as they are.
const plural = (u: string) => (u.length <= 2 || /s$/i.test(u) ? u : /loaf$/i.test(u) ? u.slice(0, -1) + "ves" : /(ch|sh|x)$/i.test(u) ? u + "es" : u + "s")
const singular = (u: string) => (u.length <= 3 ? u : /loaves$/i.test(u) ? u.slice(0, -3) + "f" : /(ch|sh|x)es$/i.test(u) ? u.slice(0, -2) : /[^s]s$/i.test(u) ? u.slice(0, -1) : u)

export type Grocery = { key: string; name: string; qty: string; aisle: string; for: string[]; extra: boolean; bought: boolean }

/** A week's list: every dinner's ingredients and the things added by hand, one line per thing
 *  (merged by itemKey, amounts added up), in its aisle, less what's in the cupboard. */
export function groceryList(week: string, dinners: Dinner[], extras: Extra[], bought: Record<string, string[]>, aisles: string[], cupboard: string[]) {
  const home = new Set(cupboard.map(itemKey))
  const ticked = new Set(boughtIn(bought, week))
  const days = new Set(weekDays(week))
  const by = new Map<string, { name: string; qtys: (string | undefined)[]; aisle?: string; for: string[]; extra: boolean }>()
  const leftOut = new Map<string, string>()
  const add = (name: string, qty: string | undefined, aisle: string | undefined, dish: string | null) => {
    if (!name.trim()) return
    const key = itemKey(name)
    if (home.has(key)) { if (!leftOut.has(key)) leftOut.set(key, name.trim()); return }
    const g = by.get(key) ?? { name: name.trim(), qtys: [], aisle: undefined, for: [], extra: false }
    g.qtys.push(qty)
    g.aisle ??= aisle
    if (dish && !g.for.includes(dish)) g.for.push(dish)
    if (!dish) g.extra = true
    by.set(key, g)
  }
  for (const d of dinners.filter((x) => days.has(x.date)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))) {
    for (const i of d.ingredients ?? []) add(i.name, i.qty, i.aisle, d.dish)
  }
  for (const x of extras.filter((x) => inWeekOf(x.week, week))) add(x.name, x.qty, x.aisle, null)
  const known = new Set(aisles)
  const items: Grocery[] = [...by.entries()].map(([key, g]) => ({
    key, name: g.name, qty: addAmounts(g.qtys), aisle: g.aisle && known.has(g.aisle) ? g.aisle : OTHER, for: g.for, extra: g.extra, bought: ticked.has(key),
  }))
  return { items, leftOut: [...leftOut.values()], bought: items.filter((x) => x.bought).length }
}

/** Whether a date ("yyyy-mm-dd") is in the week that starts on week. */
export const inWeekOf = (date: string | undefined, week: string) => !!date && /^\d{4}-\d{2}-\d{2}$/.test(date) && weekOf(date) === week
/** What's ticked off in a week, under its Monday or any other of its days. */
export const boughtIn = (bought: Record<string, string[]>, week: string) =>
  Object.entries(bought ?? {}).filter(([k]) => inWeekOf(k, week)).flatMap(([, v]) => (Array.isArray(v) ? v : []))

/** The aisles to show, in the person's order, with Other last even if it was removed. */
export const shownAisles = (aisles: string[]) => (aisles.includes(OTHER) ? aisles : [...aisles, OTHER])

// MARK: the week on screen (shared by Dinners and Groceries; not saved)

let selected: string | null = null
const subs = new Set<(w: string | null) => void>()
/** Back to the week the app opens on (openingWeek). */
export function resetWeek() { selected = null; subs.forEach((f) => f(null)) }
/** The week the app opens on: this week, or on a Saturday or Sunday the next one when it has a
 *  dinner and this week has none left from today on (tonight's dinner keeps this week). A
 *  household plans at the weekend for the week ahead (22 November 2026: on a Sunday the app
 *  opened on the week that was ending, empty, and the dinners an AI had just planned for the
 *  next one, and their grocery list, were a tap away). */
export function openingWeek(dinners: { date: string }[], now = today()) {
  const week = weekOf(now), next = plus(week, 7)
  if (noon(now).getDay() % 6 !== 0) return week
  const all = dinners ?? []
  const left = all.some((d) => inWeekOf(d.date, week) && d.date >= now)
  return !left && all.some((d) => inWeekOf(d.date, next)) ? next : week
}
export function useWeek(): [string, (w: string) => void] {
  const [w, setW] = useState(selected)
  const [dinners] = useStore<Dinner[]>("dinners", [])
  useLayoutEffect(() => { subs.add(setW); setW(selected); return () => { subs.delete(setW) } }, [])
  const opening = openingWeek(dinners)
  return [w ?? opening, (next: string) => { selected = next === opening ? null : next; subs.forEach((f) => f(selected)) }]
}

// MARK: the data

export function useMeals() {
  const [dinners, setDinners] = useStore<Dinner[]>("dinners", [])
  const [extras, setExtras] = useStore<Extra[]>("extras", [])
  const [bought, setBought] = useStore<Record<string, string[]>>("bought", {})
  const [cooks, setCooks] = useStore<string[]>("cooks", ["Me"])
  const [aisles, setAisles] = useStore<string[]>("aisles", AISLES)
  const [cupboard, setCupboard] = useStore<string[]>("cupboard", [])
  const ds = ((dinners ?? []) as Dinner[]).map((d) => ({ ...d, ingredients: d.ingredients ?? [] }))
  const xs = (extras ?? []) as Extra[], bs = (bought ?? {}) as Record<string, string[]>
  const cs = (cooks ?? []) as string[], as = (aisles ?? AISLES) as string[], cb = (cupboard ?? []) as string[]
  const list = (week: string) => groceryList(week, ds, xs, bs, as, cb)

  /** The aisle a thing went in last time (any week), for a new ingredient or a new line. */
  const aisleFor = (name: string) => {
    const key = itemKey(name)
    for (const d of [...ds].reverse()) for (const i of d.ingredients) if (itemKey(i.name) === key && i.aisle) return i.aisle
    for (const x of [...xs].reverse()) if (itemKey(x.name) === key && x.aisle) return x.aisle
    return OTHER
  }
  // Every change to a thing on a week's list: the ingredients of that week's dinners, and the
  // lines added by hand that week.
  const inWeek = (week: string) => new Set(weekDays(week))
  const changeItem = async (week: string, key: string, f: (name: string, qty?: string, aisle?: string) => { name: string; qty?: string; aisle?: string } | null) => {
    const days = inWeek(week)
    await setDinners((now: Dinner[]) => (now ?? []).map((d) => !days.has(d.date) ? d : {
      ...d, ingredients: (d.ingredients ?? []).flatMap((i) => {
        if (itemKey(i.name) !== key) return [i]
        const r = f(i.name, i.qty, i.aisle)
        return r ? [{ ...i, ...r }] : []
      }),
    }))
    await setExtras((now: Extra[]) => (now ?? []).flatMap((x) => {
      if (!inWeekOf(x.week, week) || itemKey(x.name) !== key) return [x]
      const r = f(x.name, x.qty, x.aisle)
      return r ? [{ ...x, ...r }] : []
    }))
  }
  const snapshot = () => ({ dinners: ds, extras: xs, bought: bs, cooks: cs, aisles: as, cupboard: cb })
  const restore = async (s: ReturnType<typeof snapshot>) => {
    await setDinners(s.dinners); await setExtras(s.extras); await setBought(s.bought)
    await setCooks(s.cooks); await setAisles(s.aisles); await setCupboard(s.cupboard)
  }

  return {
    dinners: ds, extras: xs, bought: bs, cooks: cs, aisles: as, cupboard: cb, list, aisleFor, snapshot, restore,
    /** The cooks to choose from: the list, and anyone a dinner names who isn't on it. */
    allCooks: [...new Set([...cs, ...ds.map((d) => d.cook).filter((c): c is string => !!c)])],

    // Dinners
    /** Adds a dinner, or saves one. A dinner moved to a day that has one swaps with it. */
    saveDinner: async (d: Dinner) => {
      const was = ds.find((x) => x.id === d.id)
      await setDinners((now: Dinner[]) => {
        const all = now ?? []
        const moved = was && was.date !== d.date
        const out = all.map((x) => (x.id === d.id ? d : moved && x.date === d.date ? { ...x, date: was!.date } : x))
        return was ? out : [...out, d]
      })
    },
    removeDinner: (id: string) => setDinners((now: Dinner[]) => (now ?? []).filter((d) => d.id !== id)),
    /** Copies a week's dinners onto the same days of another week, where those are free. */
    copyWeek: async (from: string, to: string) => {
      const free = new Set(weekDays(to).filter((day) => !ds.some((d) => d.date === day)))
      const copies = ds.filter((d) => inWeek(from).has(d.date)).map((d) => ({ ...d, id: newId("d"), date: plus(to, weekDays(from).indexOf(d.date)) })).filter((d) => free.has(d.date))
      await setDinners((now: Dinner[]) => [...(now ?? []), ...copies])
      return copies.length
    },

    // The list
    toggleBought: (week: string, key: string) => setBought((now: Record<string, string[]>) => {
      const all = now ?? {}
      if (!boughtIn(all, week).includes(key)) return { ...all, [week]: [...(all[week] ?? []), key] }
      return Object.fromEntries(Object.entries(all).map(([k, v]) => [k, inWeekOf(k, week) ? v.filter((x) => x !== key) : v]))
    }),
    addExtra: (week: string, name: string, qty: string, aisle: string) =>
      setExtras((now: Extra[]) => [...(now ?? []), { id: newId("x"), week, name, ...(qty ? { qty } : {}), aisle }]),
    /** Renames a thing, moves it to another aisle or changes the amount added by hand. */
    editItem: async (week: string, item: Grocery, name: string, aisle: string, qty?: string) => {
      await changeItem(week, item.key, () => ({ name, aisle }))
      if (qty !== undefined) await setExtras((now: Extra[]) => (now ?? []).map((x) => (inWeekOf(x.week, week) && itemKey(x.name) === itemKey(name) ? { ...x, qty: qty || undefined } : x)))
      const key = itemKey(name)
      if (key !== item.key && item.bought) await setBought((now: Record<string, string[]>) => ({
        ...Object.fromEntries(Object.entries(now ?? {}).map(([k, v]) => [k, inWeekOf(k, week) ? v.filter((x) => x !== item.key) : v])),
        [week]: [...((now ?? {})[week] ?? []).filter((x) => x !== item.key), key],
      }))
    },
    /** Takes a thing off a week's list: out of that week's dinners and the lines added by hand. */
    removeItem: (week: string, key: string) => changeItem(week, key, () => null),

    // Settings
    setCupboard: (all: string[]) => setCupboard(all),
    setCooks: (all: string[]) => setCooks(all),
    setAisles: (all: string[]) => setAisles(all),
    /** Renames an aisle, and everything in it, in every week. */
    renameAisle: async (from: string, to: string) => {
      await setAisles((now: string[]) => (now ?? AISLES).map((a) => (a === from ? to : a)))
      await setDinners((now: Dinner[]) => (now ?? []).map((d) => ({ ...d, ingredients: (d.ingredients ?? []).map((i) => (i.aisle === from ? { ...i, aisle: to } : i)) })))
      await setExtras((now: Extra[]) => (now ?? []).map((x) => (x.aisle === from ? { ...x, aisle: to } : x)))
    },
    /** Renames a cook, and the dinners they cook. */
    renameCook: async (from: string, to: string) => {
      await setCooks((now: string[]) => (now ?? []).map((c) => (c === from ? to : c)))
      await setDinners((now: Dinner[]) => (now ?? []).map((d) => (d.cook === from ? { ...d, cook: to } : d)))
    },
  }
}

/** The note's summary line, for this week: "Tonight: Fish tacos · 9 to buy". */
export function useSummary() {
  const m = useMeals()
  const now = today(), week = weekOf(now)
  const tonight = m.dinners.find((d) => d.date === now)
  const planned = m.dinners.filter((d) => weekOf(d.date) === week).length
  const l = m.list(week)
  const left = l.items.length - l.bought
  const text = tonight ? `Tonight: ${tonight.dish}${left ? ` · ${left} to buy` : ""}`
    : planned ? `${planned} ${planned === 1 ? "dinner" : "dinners"} this week${left ? ` · ${left} to buy` : ""}` : "No dinners planned this week"
  useEffect(() => { setSummary(text) }, [text])
}
