import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   trip:     { name, place, start: "yyyy-mm-dd", end: "yyyy-mm-dd" }
//   days:     [{ date: "yyyy-mm-dd", title, items: ["10:40 Land, drop bags at the hotel", ...] }]
//             an item that starts with a time (hh:mm) is placed at that time on the timeline
//   bookings: [{ id, what, kind, date, time, ref, paid, when }]
//             kind: flight, train, stay, food, activity or other; date "yyyy-mm-dd", time "hh:mm";
//             when is free text, from before bookings had a date ("23 Oct, 20:00")
//   packing:  [{ id, text, group, packed }]   group: Documents, Clothes, Toiletries, Tech or Other
//   past:     [{ name, place, start, end }]   trips before this one (the packing list stays for the next)
export type Trip = { name: string; place?: string; start: string; end: string }
export type Day = { date: string; title?: string; items: string[] }
export type Kind = "flight" | "train" | "stay" | "food" | "activity" | "other"
export type Booking = { id: string; what: string; kind?: Kind; date?: string; time?: string; when?: string; ref?: string; paid: boolean }
export type Item = { id: string; text: string; group?: string; packed: boolean }
export const KINDS: { kind: Kind; label: string }[] = [
  { kind: "flight", label: "Flight" }, { kind: "train", label: "Train" }, { kind: "stay", label: "Stay" },
  { kind: "food", label: "Food" }, { kind: "activity", label: "Activity" }, { kind: "other", label: "Other" },
]
export const GROUPS = ["Documents", "Clothes", "Toiletries", "Tech", "Other"] as const

/** A plan line's time and text: "10:40 Land" is 10:40 and "Land". */
export function timed(line: string) {
  const m = line.match(/^\s*(\d{1,2})[:.](\d{2})\s+(.*)$/)
  return m && Number(m[1]) < 24 ? { time: `${m[1].padStart(2, "0")}:${m[2]}`, text: m[3] } : { time: "", text: line }
}

/** A day's plan and that day's bookings in one list, by time; untimed lines keep their place. */
export type Stop = { time: string; text: string; booking?: Booking }
export function timeline(day: Day | undefined, bookings: Booking[], date: string): Stop[] {
  const out: Stop[] = []
  let last = ""
  for (const line of day?.items ?? []) { const t = timed(line); out.push({ time: t.time, text: t.text, sort: t.time || last } as Stop & { sort: string }); if (t.time) last = t.time }
  for (const b of bookings.filter((x) => x.date === date)) out.push({ time: b.time ?? "", text: b.what, booking: b, sort: b.time || "" } as Stop & { sort: string })
  return out.map((x, i) => ({ x, i })).sort((a, b) => {
    const sa = (a.x as Stop & { sort: string }).sort, sb = (b.x as Stop & { sort: string }).sort
    return sa === sb ? a.i - b.i : sa < sb ? -1 : 1
  }).map(({ x }) => { const { sort: _s, ...rest } = x as Stop & { sort: string }; return rest })
}

/** A day as plain text, for sharing: the date, the title, then each stop. */
export function dayText(trip: Trip | null, day: Day | undefined, bookings: Booking[], date: string) {
  const n = trip ? between(trip.start, date) + 1 : 0
  const head = `${trip?.name ? trip.name + ", " : ""}${n > 0 ? `day ${n}, ` : ""}${longDate(date)}${day?.title ? `: ${day.title}` : ""}`
  const lines = timeline(day, bookings, date).map((s) => `${s.time ? s.time + " " : "- "}${s.text}${s.booking?.ref ? ` (ref ${s.booking.ref})` : ""}`)
  return [head, ...lines].join("\n")
}

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const noon = (s: string) => new Date(s + "T12:00:00")
/** Whole days from a to b (both yyyy-mm-dd). */
export const between = (a: string, b: string) => Math.round((noon(b).getTime() - noon(a).getTime()) / 86400000)
export const longDate = (s: string) => noon(s).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
export const shortDate = (s: string) => noon(s).toLocaleDateString("en-GB", { day: "numeric", month: "long" })
export const newId = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/** Where the trip is from today: before (days to go), during (which day) or after. */
export function phase(trip: Trip | null, today = iso(new Date())) {
  if (!trip?.start) return { kind: "none" as const }
  const length = between(trip.start, trip.end || trip.start) + 1
  const toGo = between(today, trip.start)
  if (toGo > 0) return { kind: "before" as const, toGo, length }
  const day = between(trip.start, today) + 1
  if (day <= length) return { kind: "during" as const, day, length }
  return { kind: "after" as const, length }
}

/** "22 to 26 October", or "30 October to 2 November". */
export function range(trip: Trip) {
  const a = noon(trip.start), b = noon(trip.end || trip.start)
  if (trip.start === (trip.end || trip.start)) return shortDate(trip.start)
  return a.getMonth() === b.getMonth() ? `${a.getDate()} to ${shortDate(iso(b))}` : `${shortDate(trip.start)} to ${shortDate(iso(b))}`
}

export function useTrip() {
  const [trip, setTrip] = useStore<Trip | null>("trip", null)
  const [days, setDays] = useStore<Day[]>("days", [])
  const [bookings, setBookings] = useStore<Booking[]>("bookings", [])
  const [packing, setPacking] = useStore<Item[]>("packing", [])
  const [past, setPast] = useStore<Trip[]>("past", [])
  const t = (trip ?? null) as Trip | null, ds = ((days ?? []) as Day[]).slice().sort((a, b) => (a.date < b.date ? -1 : 1))
  const bs = (bookings ?? []) as Booking[], ps = (packing ?? []) as Item[]
  const p = phase(t)
  const packed = ps.filter((x) => x.packed).length
  useEffect(() => {
    if (!t) return
    setSummary(p.kind === "before" ? `${t.name}: ${p.toGo} ${p.toGo === 1 ? "day" : "days"} to go, ${packed} of ${ps.length} packed` : p.kind === "during" ? `${t.name}: day ${p.day} of ${p.length}` : `${t.name}: ${range(t)}`)
  }, [t?.name, p.kind, (p as { toGo?: number }).toGo, (p as { day?: number }).day, packed, ps.length])
  return {
    trip: t, days: ds, bookings: bs.slice().sort((a, b) => ((a.date ?? "9") + (a.time ?? "") < (b.date ?? "9") + (b.time ?? "") ? -1 : 1)), packing: ps, phase: p, packed,
    past: ((past ?? []) as Trip[]),
    setTrip: (t: Trip) => setTrip(t),
    /** Starts the next trip: this one goes to past, the plan and bookings are cleared, and the
     *  packing list stays, all unpacked, ready to pack again. Returns what to put back for Undo. */
    newTrip: async () => {
      const before = { trip: t, days: ds, bookings: bs, packing: ps, past: (past ?? []) as Trip[] }
      if (t) await setPast([...before.past, t])
      await setDays([]); await setBookings([]); await setPacking(ps.map((x) => ({ ...x, packed: false }))); await setTrip(null)
      return async () => { await setTrip(before.trip); await setDays(before.days); await setBookings(before.bookings); await setPacking(before.packing); await setPast(before.past) }
    },
    unpackAll: () => setPacking(ps.map((x) => ({ ...x, packed: false }))),
    /** Adds a day, or replaces the day with that date. */
    saveDay: (d: Day, was?: string) => setDays([...ds.filter((x) => x.date !== d.date && x.date !== was), d]),
    removeDay: (date: string) => setDays(ds.filter((x) => x.date !== date)),
    restoreDays: (all: Day[]) => setDays(all),
    updateBooking: (id: string, patch: Partial<Booking>) => setBookings(bs.map((b) => (b.id === id ? { ...b, ...patch } : b))),
    restoreBookings: (all: Booking[]) => setBookings(all),
    updateItem: (id: string, text: string) => setPacking(ps.map((x) => (x.id === id ? { ...x, text } : x))),
    restorePacking: (all: Item[]) => setPacking(all),
    togglePaid: (id: string) => setBookings(bs.map((b) => (b.id === id ? { ...b, paid: !b.paid } : b))),
    addBooking: (b: Omit<Booking, "id" | "paid">) => setBookings([...bs, { id: newId("b"), ...b, paid: false }]),
    updateItemGroup: (id: string, group: string) => setPacking(ps.map((x) => (x.id === id ? { ...x, group } : x))),
    removeBooking: (id: string) => setBookings(bs.filter((b) => b.id !== id)),
    togglePacked: (id: string) => setPacking(ps.map((x) => (x.id === id ? { ...x, packed: !x.packed } : x))),
    addItem: (text: string, group?: string) => setPacking([...ps, { id: newId("p"), text, ...(group ? { group } : {}), packed: false }]),
    removeItem: (id: string) => setPacking(ps.filter((x) => x.id !== id)),
  }
}
