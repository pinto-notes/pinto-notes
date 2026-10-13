import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   cards: [{ id, q, a, topic, box, seen }]
//     box 1 to 5 (Leitner boxes): a card you know moves up a box, a card you miss goes back to 1.
//     seen: the day it was last studied ("yyyy-mm-dd"); a new card has none and is due at once.
// A card is due again GAP[box] days after it was seen: box 1 the next day, box 5 after 16 days.
export type Card = { id: string; q: string; a: string; topic?: string; box: number; seen?: string }
export const GAP = [0, 1, 2, 4, 8, 16]

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const plus = (day: string, n: number) => { const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d) }
export const dueOn = (c: Card) => (c.seen ? plus(c.seen, GAP[Math.min(5, Math.max(1, c.box || 1))]) : "")
export const isDue = (c: Card, today = iso(new Date())) => !c.seen || dueOn(c) <= today
export const newId = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

export function useCards() {
  const [cards, setCards] = useStore<Card[]>("cards", [])
  const list = (cards ?? []) as Card[]
  const due = list.filter((c) => isDue(c))
  const topics = [...new Set(list.map((c) => c.topic || "No topic"))]
  useEffect(() => { if (list.length) setSummary(due.length ? `${due.length} ${due.length === 1 ? "card" : "cards"} due today` : "Nothing due today") }, [due.length, list.length])
  return {
    cards: list, due, topics,
    /** Knew it: up a box. Didn't know: back to box 1. Either way it was seen today. */
    grade: (id: string, knew: boolean) => setCards((now: Card[]) => (now ?? []).map((c) => (c.id === id ? { ...c, box: knew ? Math.min(5, (c.box || 1) + 1) : 1, seen: iso(new Date()) } : c))),
    add: (c: { q: string; a: string; topic?: string }) => setCards([...list, { id: newId(), ...c, box: 1 }]),
    update: (id: string, patch: Partial<Card>) => setCards(list.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    remove: (id: string) => setCards(list.filter((c) => c.id !== id)),
    /** Puts the whole list back (Undo after a delete). */
    restore: (all: Card[]) => setCards(all),
  }
}
