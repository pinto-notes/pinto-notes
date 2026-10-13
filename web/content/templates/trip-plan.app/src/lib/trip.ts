import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   trip:     { name, place, start: "yyyy-mm-dd", end: "yyyy-mm-dd" }
//   days:     [{ date: "yyyy-mm-dd", title, items: ["Land 10:40, drop bags at the hotel", ...] }]
//   bookings: [{ id, what, when, ref, paid }]
//   packing:  [{ id, text, packed }]
export type Trip = { name: string; place?: string; start: string; end: string }
export type Day = { date: string; title?: string; items: string[] }
export type Booking = { id: string; what: string; when?: string; ref?: string; paid: boolean }
export type Item = { id: string; text: string; packed: boolean }

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
  const t = (trip ?? null) as Trip | null, ds = ((days ?? []) as Day[]).slice().sort((a, b) => (a.date < b.date ? -1 : 1))
  const bs = (bookings ?? []) as Booking[], ps = (packing ?? []) as Item[]
  const p = phase(t)
  const packed = ps.filter((x) => x.packed).length
  useEffect(() => {
    if (!t) return
    setSummary(p.kind === "before" ? `${t.name}: ${p.toGo} ${p.toGo === 1 ? "day" : "days"} to go, ${packed} of ${ps.length} packed` : p.kind === "during" ? `${t.name}: day ${p.day} of ${p.length}` : `${t.name}: ${range(t)}`)
  }, [t?.name, p.kind, (p as { toGo?: number }).toGo, (p as { day?: number }).day, packed, ps.length])
  return {
    trip: t, days: ds, bookings: bs, packing: ps, phase: p, packed,
    setTrip: (t: Trip) => setTrip(t),
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
    removeBooking: (id: string) => setBookings(bs.filter((b) => b.id !== id)),
    togglePacked: (id: string) => setPacking(ps.map((x) => (x.id === id ? { ...x, packed: !x.packed } : x))),
    addItem: (text: string) => setPacking([...ps, { id: newId("p"), text, packed: false }]),
    removeItem: (id: string) => setPacking(ps.filter((x) => x.id !== id)),
  }
}
