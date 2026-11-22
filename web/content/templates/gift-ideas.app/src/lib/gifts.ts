import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it. The
// whole shape is described in docs/README.md.
//   people:   [{ id, name, likes?, sizes?, has?, occasions: [{ id, kind, name?, date?: "mm-dd", budget? }] }]
//             in the order the person keeps them
//   ideas:    [{ id, person, title, occasion?, year?, link?, price?, shop?, status, given? }]
//             status: "idea" | "bought" | "wrapped" | "given"; a given one is a past gift
//   settings: { currency, christmas: "12-24" | "12-25" }
//   started:  "yyyy-mm-dd"  set with the first person; without it a new app opens on its first screen
export type Kind = "birthday" | "christmas" | "anniversary" | "other"
export type Occasion = { id: string; kind: Kind; name?: string; date?: string; budget?: number }
export type Person = { id: string; name: string; likes?: string; sizes?: string; has?: string; occasions: Occasion[] }
export type Status = "idea" | "bought" | "wrapped" | "given"
export type Idea = {
  id: string; person: string; title: string; occasion?: string; year?: number
  link?: string; price?: number; shop?: string; status: Status; given?: string
}
export type Settings = { currency: string; christmas: "12-24" | "12-25" }

export const KINDS: { kind: Kind; label: string }[] = [
  { kind: "birthday", label: "Birthday" }, { kind: "christmas", label: "Christmas" },
  { kind: "anniversary", label: "Anniversary" }, { kind: "other", label: "Other" },
]
export const STATUSES: { status: Status; label: string }[] = [
  { status: "idea", label: "Idea" }, { status: "bought", label: "Bought" },
  { status: "wrapped", label: "Wrapped" }, { status: "given", label: "Given" },
]
export const statusLabel = (s: Status) => STATUSES.find((x) => x.status === s)?.label ?? "Idea"
/** Bought, wrapped or given: money spent. */
export const isBought = (i: Idea) => i.status !== "idea"
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Dates are "yyyy-mm-dd" in the person's own day; an occasion's day is "mm-dd", every year.
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const today = () => iso(new Date())
const noon = (s: string) => new Date(s + "T12:00:00")
export const addDays = (s: string, n: number) => { const d = noon(s); d.setDate(d.getDate() + n); return iso(d) }
/** Whole days from a to b. */
export const between = (a: string, b: string) => Math.round((noon(b).getTime() - noon(a).getTime()) / 86400000)
export const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s)
/** "mm-dd" from "mm-dd", "yyyy-mm-dd" or "--mm-dd" (an AI may write a birthday with its year). */
export function monthDay(s: unknown): string | undefined {
  const m = typeof s === "string" ? /^(?:\d{4}-|--)?(\d{1,2})-(\d{1,2})$/.exec(s.trim()) : null
  if (!m) return undefined
  const mo = Number(m[1]), d = Number(m[2])
  if (mo < 1 || mo > 12 || d < 1 || d > new Date(2024, mo, 0).getDate()) return undefined
  return `${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`
}
/** The day in a year: 29 February is the 28th when the year has none. */
export function dateIn(md: string, year: number) {
  const [mo, d] = md.split("-").map(Number)
  return iso(new Date(year, mo - 1, Math.min(d, new Date(year, mo, 0).getDate()), 12))
}
/** The next time a day comes round: today, or later this year, or next year. */
export function nextOn(md: string, now = today()) {
  const y = Number(now.slice(0, 4))
  const d = dateIn(md, y)
  return d >= now ? { date: d, year: y } : { date: dateIn(md, y + 1), year: y + 1 }
}
/** The year of the occasion a gift is for when it's given: the one just past (up to 30 days ago), or the next. */
export function yearAround(md: string, now = today()) {
  const y = Number(now.slice(0, 4))
  for (const k of [y - 1, y, y + 1]) if (between(now, dateIn(md, k)) >= -30) return k
  return y + 1
}
/** "Sat 14 Mar". */
export const dayLabel = (s: string) => noon(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
/** "14 March". */
export const mdLabel = (md: string) => `${Number(md.slice(3))} ${MONTHS[Number(md.slice(0, 2)) - 1]}`
export const inDays = (n: number) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : `In ${n} days`)
export const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
export const slug = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "p"

const num = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 })
/** "450 kr", "$45", or a plain number with no currency. */
export const money = (n: number, currency: string) => {
  const s = num.format(Math.round(Math.abs(n) * 100) / 100)
  return /^[$€£¥₹]$/.test(currency) ? `${n < 0 ? "-" : ""}${currency}${s}` : `${n < 0 ? "-" : ""}${s} ${currency}`.trim()
}
/** A price as typed or as an AI wrote it: 450, "450", "450 kr", "1 200", "12.50". */
export function amount(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : undefined
  if (typeof v !== "string") return undefined
  const s = v.replace(/[\s ]/g, "").replace(/,(\d{1,2})$/, ".$1").replace(/[^0-9.]/g, "")
  if (!s) return undefined
  const n = Number(s)
  return Number.isFinite(n) ? n : undefined
}
/** The currency people most likely use where this device is set up ("sv-SE" → "kr"), "" when it can't tell. */
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

const KIND_NAMES: Record<Kind, string> = { birthday: "Birthday", christmas: "Christmas", anniversary: "Anniversary", other: "Occasion" }
export const occasionName = (o: Occasion) => o.name?.trim() || KIND_NAMES[o.kind]
/** The occasion's day ("mm-dd"): Christmas is the setting's day for everyone. */
export const occasionDay = (o: Occasion, s: Settings) => (o.kind === "christmas" ? s.christmas : o.date)

/** Ideas for one time an occasion comes round (its year). An idea with an occasion and no year is for
 *  the next one, unless it's been given: then it's for the year it was given in. */
export function ideaYear(i: Idea, next: number) {
  if (typeof i.year === "number") return i.year
  if (i.status === "given") return isDate(i.given) ? Number(i.given.slice(0, 4)) : next - 1
  return next
}

/** One person's part in one time an occasion comes round. */
export type Share = { person: Person; occasion: Occasion; ideas: Idea[]; spent: number; budget?: number; bought: Idea[] }
/** One time an occasion comes round: one person's birthday, or Christmas for everyone who has it. */
export type Event = { key: string; title: string; date: string; year: number; days: number; shared: boolean; shares: Share[]; spent: number; budget: number }

/** People who share an occasion share one event: everyone's Christmas, and an occasion of the same
 *  name on the same day ("Mother's Day"). A birthday or an anniversary is one person's. */
const eventKey = (p: Person, o: Occasion, md: string) =>
  o.kind === "christmas" ? "christmas" : o.kind === "other" && o.name?.trim() ? `${slug(o.name)}-${md}` : `${p.id}~${o.id}`

export function events(people: Person[], ideas: Idea[], settings: Settings, now = today()): Event[] {
  const byKey = new Map<string, { title: string; date: string; year: number; shares: Share[] }>()
  for (const p of people) for (const o of p.occasions) {
    const md = occasionDay(o, settings)
    if (!md) continue
    const { date, year } = nextOn(md, now)
    const mine = ideas.filter((i) => i.person === p.id && i.occasion === o.id && ideaYear(i, year) === year)
    const bought = mine.filter(isBought)
    const share: Share = { person: p, occasion: o, ideas: mine, bought, spent: bought.reduce((t, i) => t + (i.price ?? 0), 0), budget: o.budget }
    const key = eventKey(p, o, md)
    const e = byKey.get(key) ?? { title: occasionName(o), date, year, shares: [] }
    e.shares.push(share)
    byKey.set(key, e)
  }
  const all: Event[] = []
  for (const [key, e] of byKey) {
    const shared = key === "christmas" || e.shares.length > 1
    all.push({
      key: shared ? `${key}-${e.year}` : key, title: shared ? `${e.title} ${e.year}` : e.title, date: e.date, year: e.year,
      days: between(now, e.date), shared, shares: e.shares,
      spent: e.shares.reduce((t, s) => t + s.spent, 0), budget: e.shares.reduce((t, s) => t + (s.budget ?? 0), 0),
    })
  }
  return all.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.title < b.title ? -1 : 1))
}

/** Words that say what a gift is ("scarf", "candle"), for "You gave Mum a scarf in 2024". */
const STOP = new Set(["a", "an", "the", "and", "or", "of", "for", "with", "from", "to", "in", "on", "new", "nice", "good", "big", "small", "set", "pair", "some"])
const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/)
  .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w)).filter((w) => w.length > 2 && !STOP.has(w))
/** Past gifts to someone that share a word with an idea: a second scarf, the same book. */
export function alike(title: string, past: Idea[]) {
  const mine = new Set(words(title))
  return mine.size ? past.filter((g) => words(g.title).some((w) => mine.has(w))) : []
}

/** Data from data.json, made safe to show: an AI or an older version may leave a field out, name a
 *  person by name, or write a price as "450 kr". */
function cleanPeople(raw: unknown): Person[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  return raw.filter((p) => p && typeof p === "object" && (p.name || p.id)).map((p, i) => {
    let id = String(p.id ?? slug(String(p.name)) ?? `p${i + 1}`)
    while (seen.has(id)) id += "-2"
    seen.add(id)
    const ids = new Set<string>()
    const occasions = (Array.isArray(p.occasions) ? p.occasions : []).filter((o: any) => o && typeof o === "object").map((o: any): Occasion => {
      const kind = String(o.kind ?? o.name ?? "").toLowerCase().trim()
      const known = (KINDS.map((x) => x.kind) as string[]).includes(kind) ? (kind as Kind) : "other"
      let oid = String(o.id ?? (known === "other" && o.name ? slug(String(o.name)) : known)), n = 2
      while (ids.has(oid)) oid = `${String(o.id ?? known)}-${n++}`
      ids.add(oid)
      const out: Occasion = { ...o, id: oid, kind: known }
      if (known === "other" && !o.name && o.kind) out.name = String(o.kind)
      const md = monthDay(o.date)
      if (md) out.date = md; else delete out.date
      const b = amount(o.budget)
      if (b === undefined) delete out.budget; else out.budget = b
      return out
    })
    return { ...p, id, name: String(p.name ?? id), occasions }
  })
}
function cleanIdeas(raw: unknown, people: Person[]): Idea[] {
  if (!Array.isArray(raw)) return []
  const who = (v: unknown) => {
    const s = String(v ?? "").trim().toLowerCase()
    return people.find((p) => p.id === v) ?? people.find((p) => p.id.toLowerCase() === s || p.name.trim().toLowerCase() === s)
  }
  return raw.filter((i) => i && typeof i === "object" && (i.title || i.idea)).flatMap((i, k): Idea[] => {
    const p = who(i.person)
    if (!p) return []
    const status = String(i.status ?? "idea").toLowerCase() as Status
    const out: Idea = { ...i, id: String(i.id ?? `i${k + 1}`), person: p.id, title: String(i.title ?? i.idea), status: STATUSES.some((s) => s.status === status) ? status : "idea" }
    if (i.occasion !== undefined && i.occasion !== null && i.occasion !== "") {
      const s = String(i.occasion).toLowerCase()
      const o = p.occasions.find((x) => x.id === i.occasion) ?? p.occasions.find((x) => x.id.toLowerCase() === s || x.kind === s || occasionName(x).toLowerCase() === s)
      if (o) out.occasion = o.id; else delete out.occasion
    }
    const price = amount(i.price)
    if (price === undefined) delete out.price; else out.price = price
    const year = typeof i.year === "string" ? Number(i.year) : i.year
    if (typeof year === "number" && year > 1900) out.year = year; else delete out.year
    return [out]
  })
}

export function useGifts() {
  const [rawPeople, setPeople] = useStore<Person[]>("people", [])
  const [rawIdeas, setIdeas] = useStore<Idea[]>("ideas", [])
  const [rawSettings, setSettings] = useStore<Partial<Settings>>("settings", { currency: "", christmas: "12-25" })
  const [started, setStarted] = useStore<string | null>("started", null)
  const people = cleanPeople(rawPeople)
  const ideas = cleanIdeas(rawIdeas, people)
  const raw = rawSettings ?? {}
  const settings: Settings = { currency: typeof raw.currency === "string" ? raw.currency : "", christmas: raw.christmas === "12-24" ? "12-24" : "12-25" }
  const currency = settings.currency || guessCurrency()
  const now = today()
  const upcoming = events(people, ideas, settings, now)
  const fmt = (n: number) => money(n, currency)

  const next = upcoming[0]
  useEffect(() => {
    if (!people.length) return
    const who = `${people.length} ${people.length === 1 ? "person" : "people"}`
    if (!next) return setSummary(who)
    const what = next.shared ? next.title.replace(/ \d{4}$/, "") : `${next.shares[0].person.name}'s ${next.title.toLowerCase()}`
    setSummary(`${who}. Next: ${what} ${inDays(next.days).toLowerCase()}`)
  }, [people.length, next?.key, next?.days])

  /** Changes the data as it is now in data.json (not as this screen last drew it), so a tap never
   *  drops what the person's AI added a moment ago. */
  const editPeople = (fn: (all: Person[]) => Person[]) => setPeople((cur: unknown) => fn(cleanPeople(cur)))
  const editIdeas = (fn: (all: Idea[]) => Idea[]) => setIdeas((cur: unknown) => fn(cleanIdeas(cur, people)))
  const person = (id: string) => people.find((p) => p.id === id)
  /** The person's occasion that comes round next. */
  const soonest = (p: Person) => p.occasions.map((o) => ({ o, md: occasionDay(o, settings) })).filter((x) => x.md)
    .map((x) => ({ o: x.o, ...nextOn(x.md!, now) })).sort((a, b) => (a.date < b.date ? -1 : 1))[0]
  /** Swaps an item with its neighbour among the items that match, keeping everything else in place. */
  const shift = <T,>(all: T[], at: (x: T) => boolean, mine: (x: T) => boolean, by: -1 | 1) => {
    const idx = all.map((x, k) => (mine(x) ? k : -1)).filter((k) => k >= 0)
    const i = idx.findIndex((k) => at(all[k]))
    if (i < 0 || i + by < 0 || i + by >= idx.length) return all
    const out = [...all], a = idx[i], b = idx[i + by]
    ;[out[a], out[b]] = [out[b], out[a]]
    return out
  }

  return {
    people, ideas, settings, currency, fmt, started: started ?? null, now, upcoming,
    person, soonest,
    ideasOf: (id: string) => ideas.filter((i) => i.person === id && i.status !== "given"),
    /** Gifts given, newest first. */
    givenTo: (id: string) => ideas.filter((i) => i.person === id && i.status === "given").sort((a, b) => ideaYear(b, 0) - ideaYear(a, 0)),
    event: (key: string) => upcoming.find((e) => e.key === key),
    /** The next time each of someone's occasions comes round, with its ideas and spending. */
    sharesOf: (id: string) => upcoming.flatMap((e) => e.shares.filter((s) => s.person.id === id).map((s) => ({ ...s, event: e })))
      .sort((a, b) => a.person.occasions.indexOf(a.occasion) - b.person.occasions.indexOf(b.occasion)),
    /** The year an idea for this occasion is for: the next time it comes round. */
    yearFor: (o: Occasion) => { const md = occasionDay(o, settings); return md ? nextOn(md, now).year : undefined },

    addPerson: async (p: Omit<Person, "id">) => {
      let id = slug(p.name), k = 2
      while (people.some((x) => x.id === id)) id = `${slug(p.name)}-${k++}`
      const made: Person = { ...p, id }
      await editPeople((all) => [...all, made])
      if (!started) await setStarted(now)
      if (!settings.currency && currency) await setSettings({ ...settings, currency })
      return made
    },
    updatePerson: (id: string, patch: Partial<Person>) => editPeople((all) => all.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    removePerson: (id: string) => Promise.all([editPeople((all) => all.filter((p) => p.id !== id)), editIdeas((all) => all.filter((i) => i.person !== id))]),
    movePerson: (id: string, by: -1 | 1) => editPeople((all) => shift(all, (p) => p.id === id, () => true, by)),
    restore: async (p: Person[], i: Idea[]) => { await setPeople(p); await setIdeas(i) },

    /** Adds an occasion, or changes the one with this id. */
    setOccasion: (pid: string, o: Occasion) => editPeople((all) => all.map((p) => (p.id !== pid ? p
      : { ...p, occasions: p.occasions.some((x) => x.id === o.id) ? p.occasions.map((x) => (x.id === o.id ? o : x)) : [...p.occasions, o] }))),
    removeOccasion: (pid: string, oid: string) => editPeople((all) => all.map((p) => (p.id === pid ? { ...p, occasions: p.occasions.filter((o) => o.id !== oid) } : p))),
    moveOccasion: (pid: string, oid: string, by: -1 | 1) => editPeople((all) => all.map((p) => (p.id === pid ? { ...p, occasions: shift(p.occasions, (o) => o.id === oid, () => true, by) } : p))),

    addIdea: async (i: Omit<Idea, "id">) => {
      const idea: Idea = { ...i, id: newId("i") }
      const o = person(i.person)?.occasions.find((x) => x.id === i.occasion)
      const md = o && occasionDay(o, settings)
      if (md && idea.year === undefined) idea.year = idea.status === "given" ? yearAround(md, now) : nextOn(md, now).year
      if (idea.status === "given" && !idea.given) idea.given = now
      await editIdeas((all) => [...all, idea])
      return idea
    },
    /** Changes an idea. A new occasion moves it to that occasion's next time round. */
    updateIdea: (id: string, patch: Partial<Idea>) => editIdeas((all) => all.map((i) => {
      if (i.id !== id) return i
      const out: Idea = { ...i, ...patch }
      for (const k of Object.keys(patch) as (keyof Idea)[]) if (patch[k] === undefined) delete out[k]
      if ("occasion" in patch && patch.occasion !== i.occasion) {
        const o = person(i.person)?.occasions.find((x) => x.id === out.occasion)
        const md = o && occasionDay(o, settings)
        if (md) out.year = out.status === "given" ? yearAround(md, now) : nextOn(md, now).year; else delete out.year
      }
      return out
    })),
    /** Sets where a gift is. Buying one that isn't for an occasion yet puts it on the person's next
     *  one, so it counts against that budget; giving one dates it and keeps it as a past gift. */
    setStatus: (id: string, status: Status) => editIdeas((all) => all.map((i) => {
      if (i.id !== id) return i
      const out: Idea = { ...i, status }
      const p = person(i.person)
      if (status !== "idea" && !out.occasion && p) {
        const s = soonest(p)
        if (s) { out.occasion = s.o.id; out.year = s.year }
      }
      const o = p?.occasions.find((x) => x.id === out.occasion)
      const md = o && occasionDay(o, settings)
      if (status === "given") {
        out.given = out.given ?? now
        if (md && out.year === undefined) out.year = yearAround(md, now)
      } else delete out.given
      if (md && out.year === undefined) out.year = nextOn(md, now).year
      return out
    })),
    removeIdea: (id: string) => editIdeas((all) => all.filter((i) => i.id !== id)),
    moveIdea: (id: string, by: -1 | 1) => {
      const it = ideas.find((i) => i.id === id)
      if (!it) return
      return editIdeas((all) => shift(all, (i) => i.id === id, (i) => i.person === it.person && i.status !== "given", by))
    },
    restoreIdeas: (all: Idea[]) => setIdeas(all),
    setSettings: (s: Partial<Settings>) => setSettings({ ...settings, ...s }),
  }
}
