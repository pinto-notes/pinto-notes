import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   jobs:       [{ id, name, area?, every, last?, contact?, cost?, note? }]
//               every: "2 weeks", "1 month", "3 months", "1 year", or a season: "spring", "summer",
//               "autumn", "winter". last: the last time it was done, "yyyy-mm-dd" (also set by
//               Mark done). contact: a contact's id. cost: what it usually costs, a number.
//   history:    [{ id, job, date, cost?, note? }]   each time a job was done; job is the job's id
//   areas:      ["Kitchen", "Heating", …]   in the person's order
//   appliances: [{ id, name, area?, model?, serial?, bought?, warranty?, manual?, note? }]
//               bought and warranty (the day the warranty ends) are "yyyy-mm-dd"; manual is a web address
//   details:    [{ id, name, value }]   home details: where the stopcock is, the paint colour
//   contacts:   [{ id, name, trade?, phone?, email?, note? }]
//   currency:   "kr"   shown after amounts; "$", "€" and "£" go before; "" guesses from the device
export type Job = { id: string; name: string; area?: string; every: string; last?: string; contact?: string; cost?: number; note?: string }
export type Done = { id: string; job: string; date: string; cost?: number; note?: string }
export type Appliance = { id: string; name: string; area?: string; model?: string; serial?: string; bought?: string; warranty?: string; manual?: string; note?: string }
export type Detail = { id: string; name: string; value: string }
export type Contact = { id: string; name: string; trade?: string; phone?: string; email?: string; note?: string }
export const AREAS = ["Kitchen", "Bathroom", "Heating", "Outside", "Garden", "Car", "Safety"]
export const NO_AREA = "Other"

// MARK: dates

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const noon = (s: string) => new Date(s + "T12:00:00")
export const today = () => iso(new Date())
export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(noon(s).getTime())
export const plusDays = (s: string, n: number) => { const d = noon(s); d.setDate(d.getDate() + n); return iso(d) }
/** A date n months on, kept in its month: 31 January and a month is 28 February. */
export function plusMonths(s: string, n: number) {
  const y = Number(s.slice(0, 4)), m = Number(s.slice(5, 7)) - 1 + n, day = Number(s.slice(8, 10))
  const last = new Date(y, m + 1, 0).getDate()
  return iso(new Date(y, m, Math.min(day, last), 12))
}
export const endOfMonth = (s: string) => iso(new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)), 0, 12))
export const daysBetween = (a: string, b: string) => Math.round((noon(b).getTime() - noon(a).getTime()) / 86_400_000)
/** "24 Nov", or "24 Nov 2027" in another year than now. */
export function shortDate(s: string, now = today()) {
  return noon(s).toLocaleDateString("en-GB", s.slice(0, 4) === now.slice(0, 4) ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" })
}
export const longDate = (s: string) => noon(s).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
export const monthName = (s: string) => noon(s).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
/** "today", "tomorrow", "in 5 days", "in 3 weeks", "in 4 months". */
export function until(days: number) {
  if (days === 0) return "today"
  if (days === 1) return "tomorrow"
  if (days < 14) return `in ${days} days`
  if (days < 60) return `in ${Math.round(days / 7)} weeks`
  const m = Math.round(days / 30.4)
  return m < 18 ? `in ${m} months` : `in ${Math.round(days / 365)} years`
}
/** "1 day", "2 weeks", "3 months", for how late something is. */
export function late(days: number) {
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`
  if (days < 60) return `${Math.round(days / 7)} weeks`
  const m = Math.round(days / 30.4)
  return m < 18 ? `${m} months` : `${Math.round(days / 365)} years`
}
export const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

// MARK: how often

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const
export type Season = (typeof SEASONS)[number]
/** The month each season starts in (1 to 12): spring is March to May, winter December to February. */
const SEASON_START: Record<Season, number> = { spring: 3, summer: 6, autumn: 9, winter: 12 }
export type Unit = "week" | "month" | "year"
export type Often = { n: number; unit: Unit } | { season: Season }

/** What "every" says: "3 months", "1 year", "2 weeks", "month", "yearly", "autumn" (or "fall"). */
export function parseEvery(every: string | undefined): Often | null {
  const s = (every ?? "").trim().toLowerCase().replace(/^every\s+/, "").replace(/^in\s+(the\s+)?/, "")
  if (s === "fall") return { season: "autumn" }
  if ((SEASONS as readonly string[]).includes(s)) return { season: s as Season }
  const words: Record<string, Often> = { weekly: { n: 1, unit: "week" }, fortnightly: { n: 2, unit: "week" }, monthly: { n: 1, unit: "month" }, quarterly: { n: 3, unit: "month" }, yearly: { n: 1, unit: "year" }, annually: { n: 1, unit: "year" }, "half a year": { n: 6, unit: "month" } }
  if (words[s]) return words[s]
  const m = s.match(/^(\d+|other)?\s*(week|month|year)s?$/)
  if (!m) return null
  const n = m[1] === "other" ? 2 : m[1] ? Number(m[1]) : 1
  return n > 0 ? { n, unit: m[2] as Unit } : null
}
/** How every is written in data.json: "1 month", "3 months", "autumn". */
export const writeEvery = (o: Often) => ("season" in o ? o.season : `${o.n} ${o.unit}${o.n === 1 ? "" : "s"}`)
/** "Every month", "Every 3 months", "Every autumn". */
export function everyLabel(every: string) {
  const o = parseEvery(every)
  if (!o) return every ? `Every ${every}` : "No schedule"
  if ("season" in o) return `Every ${o.season}`
  return o.n === 1 ? `Every ${o.unit}` : `Every ${o.n} ${o.unit}s`
}

/** The start and end of the season window that starts in year y. */
function window(season: Season, y: number) {
  const start = iso(new Date(y, SEASON_START[season] - 1, 1, 12))
  return { start, end: plusDays(plusMonths(start, 3), -1) }
}

export type When = { date: string; end: string; season?: Season; never: boolean }
/** When a job is next due. An interval job: its last date and the interval (never done: today).
 *  A season job: the first start of its season after the last time; never done, the season now or
 *  next. end is the last day it's on time: the day itself, or the season's last day. */
export function nextDue(job: Pick<Job, "every">, last: string | undefined, now = today()): When | null {
  const o = parseEvery(job.every)
  if (!o) return null
  if ("season" in o) {
    const y = Number((last ?? now).slice(0, 4))
    for (const year of [y - 1, y, y + 1, y + 2]) {
      const w = window(o.season, year)
      if (last ? w.start > last : w.end >= now) return { date: w.start, end: w.end, season: o.season, never: !last }
    }
    return null
  }
  if (!last) return { date: now, end: now, never: true }
  const date = o.unit === "week" ? plusDays(last, 7 * o.n) : plusMonths(last, o.unit === "year" ? 12 * o.n : o.n)
  return { date, end: date, never: false }
}

export type Status = "overdue" | "now" | "later"
/** Overdue: past its day (a season job, past its season). Now: due by the end of this month, or in
 *  its season. Later: after this month. */
export function statusOf(w: When, now = today()): Status {
  if (w.end < now) return "overdue"
  if (w.date <= endOfMonth(now)) return "now"
  return "later"
}

// MARK: money

const num = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 })
export const money = (n: number, currency: string) => {
  const s = num.format(Math.round(Math.abs(n) * 100) / 100)
  return /^[$€£]$/.test(currency) ? `${n < 0 ? "-" : ""}${currency}${s}` : `${n < 0 ? "-" : ""}${s} ${currency}`.trim()
}
/** The currency people most likely use where this device is set up ("sv-SE" is kr). */
export function guessCurrency(locale: string = typeof navigator === "undefined" ? "" : navigator.language): string {
  let region = ""
  try { region = new Intl.Locale(locale).maximize().region ?? "" } catch { return "" }
  if (["SE", "NO", "DK", "IS"].includes(region)) return "kr"
  if (["US", "CA", "AU", "NZ", "SG", "HK", "MX"].includes(region)) return "$"
  if (["GB", "IM", "JE", "GG"].includes(region)) return "£"
  if (["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"].includes(region)) return "€"
  if (region === "CH") return "CHF"
  return ""
}
/** A number typed in a field: "1 200", "1,200" and "950.50" read as numbers; anything else is none. */
export function readAmount(s: string): number | undefined {
  const t = s.trim().replace(/\s/g, "")
  if (!t) return undefined
  const n = Number(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t) ? t.replace(/,/g, "") : t.replace(",", "."))
  return isFinite(n) && n >= 0 ? n : undefined
}
const toNumber = (v: unknown) => (typeof v === "number" ? v : typeof v === "string" ? readAmount(v) : undefined)

// MARK: links out

// A manual's address, as the person types it ("bosch-home.com/manuals"), with https added when it
// has no scheme. It's opened in the person's browser through device.openURL, never fetched by the
// app (which has no network), so the scheme is written in two parts: the save check reads a whole
// address in the source as the app reaching for the network.
const WEB = "https:"
export const webAddress = (s: string) => { const t = s.trim(); return !t || /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `${WEB}//${t}` }

// MARK: warranties

/** A warranty ending within this many days is flagged. */
export const WARRANTY_SOON = 90
export type Warranty = { state: "none" | "ok" | "soon" | "ended"; text: string }
export function warrantyOf(a: Appliance, now = today()): Warranty {
  if (!isDate(a.warranty)) return { state: "none", text: "" }
  const d = daysBetween(now, a.warranty)
  if (d < 0) return { state: "ended", text: `Warranty ended ${shortDate(a.warranty, now)}` }
  if (d <= WARRANTY_SOON) return { state: "soon", text: `Warranty ends ${d === 0 ? "today" : until(d)}, ${shortDate(a.warranty, now)}` }
  return { state: "ok", text: `Warranty to ${shortDate(a.warranty, now)}` }
}

// MARK: the data

export type JobView = Job & { lastDone?: string; when: When | null; status: Status | null }

export function useHome() {
  const [jobs, setJobs] = useStore<Job[]>("jobs", [])
  const [history, setHistory] = useStore<Done[]>("history", [])
  const [areas, setAreas] = useStore<string[]>("areas", AREAS)
  const [appliances, setAppliances] = useStore<Appliance[]>("appliances", [])
  const [details, setDetails] = useStore<Detail[]>("details", [])
  const [contacts, setContacts] = useStore<Contact[]>("contacts", [])
  const [currency, setCurrency] = useStore<string>("currency", "")
  const js = ((jobs ?? []) as Job[]).filter((j) => j && j.id).map((j) => ({ ...j, every: j.every ?? "", cost: toNumber(j.cost) }))
  const hs = ((history ?? []) as Done[]).filter((h) => h && h.job && isDate(h.date)).map((h) => ({ ...h, cost: toNumber(h.cost) }))
  const as = (areas ?? AREAS) as string[], aps = (appliances ?? []) as Appliance[], dts = (details ?? []) as Detail[], cs = (contacts ?? []) as Contact[]
  const cur = (currency ?? "") || guessCurrency()
  const now = today()

  /** The last time a job was done: its last date or its newest history, whichever is later. */
  const lastDone = (j: Job) => {
    let last = isDate(j.last) ? j.last : undefined
    for (const h of hs) if (h.job === j.id && (!last || h.date > last)) last = h.date
    return last
  }
  const view = (j: Job): JobView => {
    const l = lastDone(j), when = nextDue(j, l, now)
    return { ...j, lastDone: l, when, status: when ? statusOf(when, now) : null }
  }
  const all = js.map(view)
  const byDate = (a: JobView, b: JobView) => (a.when!.date < b.when!.date ? -1 : a.when!.date > b.when!.date ? 1 : a.name.localeCompare(b.name))
  const due = {
    overdue: all.filter((j) => j.status === "overdue").sort(byDate),
    now: all.filter((j) => j.status === "now").sort(byDate),
    later: all.filter((j) => j.status === "later").sort(byDate),
    unscheduled: all.filter((j) => !j.when),
  }
  const year = now.slice(0, 4)
  const spentIn = (y: string) => hs.filter((h) => h.date.startsWith(y)).reduce((a, h) => a + (h.cost ?? 0), 0)

  const snapshot = () => ({ jobs: js, history: hs, areas: as, appliances: aps, details: dts, contacts: cs })
  const restore = async (s: ReturnType<typeof snapshot>) => {
    await setJobs(s.jobs); await setHistory(s.history); await setAreas(s.areas)
    await setAppliances(s.appliances); await setDetails(s.details); await setContacts(s.contacts)
  }
  /** Moves one thing up or down a list, among the ones that pass same (a job among its area's). */
  const shift = <T extends { id: string }>(list: T[], id: string, by: number, same: (x: T) => boolean = () => true) => {
    const peers = list.filter(same), i = peers.findIndex((x) => x.id === id), j = i + by
    if (i < 0 || j < 0 || j >= peers.length) return list
    const a = list.indexOf(peers[i]), b = list.indexOf(peers[j]), out = [...list]
    ;[out[a], out[b]] = [out[b], out[a]]
    return out
  }
  const areaOf = (j: Job) => (j.area && as.includes(j.area) ? j.area : NO_AREA)

  return {
    jobs: all, history: hs, areas: as, appliances: aps, details: dts, contacts: cs, currency: cur, currencySet: !!currency,
    due, now, year, spent: spentIn(year), spentIn, snapshot, restore, areaOf,
    contact: (id?: string) => cs.find((c) => c.id === id),
    job: (id: string) => all.find((j) => j.id === id),
    historyOf: (id: string) => hs.filter((h) => h.job === id).sort((a, b) => (a.date < b.date ? 1 : -1)),
    money: (n: number) => money(n, cur),
    setCurrency: (c: string) => setCurrency(c),

    // Jobs
    saveJob: (j: Job) => setJobs((now: Job[]) => ((now ?? []).some((x) => x.id === j.id) ? (now ?? []).map((x) => (x.id === j.id ? j : x)) : [...(now ?? []), j])),
    /** Removes a job and its history. */
    removeJob: async (id: string) => {
      await setJobs((now: Job[]) => (now ?? []).filter((j) => j.id !== id))
      await setHistory((now: Done[]) => (now ?? []).filter((h) => h.job !== id))
    },
    moveJob: (id: string, by: number) => {
      const j = js.find((x) => x.id === id)
      return j ? setJobs(shift(js, id, by, (x) => areaOf(x) === areaOf(j))) : undefined
    },
    /** Done on a day (today by default): a line in its history, with the cost given (null: none)
     *  or its usual cost, and its last date moved on. Returns when it's due next. */
    markDone: async (id: string, date = today(), cost?: number | null, note?: string) => {
      const j = js.find((x) => x.id === id)
      if (!j) return null
      const c = cost === null ? undefined : cost ?? j.cost
      await setHistory((now: Done[]) => [...(now ?? []), { id: newId("h"), job: id, date, ...(c !== undefined ? { cost: c } : {}), ...(note ? { note } : {}) }])
      const last = lastDone(j)
      if (!last || date >= last) await setJobs((now: Job[]) => (now ?? []).map((x) => (x.id === id ? { ...x, last: date } : x)))
      return nextDue(j, !last || date > last ? date : last, now)
    },
    saveDone: (h: Done) => setHistory((now: Done[]) => (now ?? []).map((x) => (x.id === h.id ? h : x))),
    /** Removes a line of history. A job whose last date was that day goes back to the line before. */
    removeDone: async (id: string) => {
      const h = hs.find((x) => x.id === id)
      await setHistory((now: Done[]) => (now ?? []).filter((x) => x.id !== id))
      if (!h) return
      const before = hs.filter((x) => x.job === h.job && x.id !== id).map((x) => x.date).sort().pop()
      await setJobs((now: Job[]) => (now ?? []).map((j) => (j.id === h.job && j.last === h.date ? { ...j, last: before } : j)))
    },

    // Areas
    setAreas: (all: string[]) => setAreas(all),
    /** Renames an area, and every job and appliance in it. */
    renameArea: async (from: string, to: string) => {
      await setAreas((now: string[]) => (now ?? AREAS).map((a) => (a === from ? to : a)))
      await setJobs((now: Job[]) => (now ?? []).map((j) => (j.area === from ? { ...j, area: to } : j)))
      await setAppliances((now: Appliance[]) => (now ?? []).map((a) => (a.area === from ? { ...a, area: to } : a)))
    },

    // Appliances, details, contacts: saved whole, moved, removed.
    saveAppliance: (a: Appliance) => setAppliances((now: Appliance[]) => upsert(now ?? [], a)),
    removeAppliance: (id: string) => setAppliances((now: Appliance[]) => (now ?? []).filter((a) => a.id !== id)),
    moveAppliance: (id: string, by: number) => setAppliances(shift(aps, id, by)),
    saveDetail: (d: Detail) => setDetails((now: Detail[]) => upsert(now ?? [], d)),
    removeDetail: (id: string) => setDetails((now: Detail[]) => (now ?? []).filter((d) => d.id !== id)),
    moveDetail: (id: string, by: number) => setDetails(shift(dts, id, by)),
    saveContact: (c: Contact) => setContacts((now: Contact[]) => upsert(now ?? [], c)),
    /** Removes a contact; the jobs that named them keep no contact (Undo brings both back). */
    removeContact: async (id: string) => {
      await setContacts((now: Contact[]) => (now ?? []).filter((c) => c.id !== id))
      await setJobs((now: Job[]) => (now ?? []).map((j) => (j.contact === id ? { ...j, contact: undefined } : j)))
    },
    moveContact: (id: string, by: number) => setContacts(shift(cs, id, by)),
  }
}
const upsert = <T extends { id: string }>(list: T[], x: T) => (list.some((y) => y.id === x.id) ? list.map((y) => (y.id === x.id ? x : y)) : [...list, x])

/** "2 overdue · 3 due this month", or what's next when nothing is due. */
export function summaryText(h: ReturnType<typeof useHome>) {
  const o = h.due.overdue.length, n = h.due.now.length
  if (!h.jobs.length) return "No jobs yet"
  if (o || n) return [o ? `${o} overdue` : "", n ? `${n} due this month` : ""].filter(Boolean).join(" · ")
  const next = h.due.later[0]
  return next ? `Nothing due this month · next: ${next.name}, ${shortDate(next.when!.date, h.now)}` : "Nothing due"
}
export function useSummary() {
  const h = useHome()
  const text = summaryText(h)
  useEffect(() => { setSummary(text) }, [text])
}
