import { useEffect } from "react"
import { useStore, setSummary } from "@/lib/amber"

// The app's data (data.json "values"), kept simple so the person's AI can read and edit it:
//   cards: [{ id, q, a, topic, box, seen, interval, ease }]
//     seen: the day it was last studied ("yyyy-mm-dd"); a new card has none and is due at once.
//     interval: days until it's due again after seen. ease: how fast the interval grows (2.5 to start).
//     box 1 to 5 follows the interval (1: a day, 2: up to 3 days, 3: a week, 4: three weeks, 5: more),
//     for the chart and for an AI quizzing in chat. A card from before intervals (box and seen only)
//     is due GAP[box] days after seen.
//   studied: { "yyyy-mm-dd": 12 }   cards answered each day, for the streak and the calendar
export type Card = { id: string; q: string; a: string; topic?: string; box: number; seen?: string; interval?: number; ease?: number }
export type Grade = "again" | "hard" | "good" | "easy"
export const GAP = [0, 1, 2, 4, 8, 16]
export const GRADES: { grade: Grade; label: string; key: string }[] = [
  { grade: "again", label: "Again", key: "1" }, { grade: "hard", label: "Hard", key: "2" },
  { grade: "good", label: "Good", key: "3" }, { grade: "easy", label: "Easy", key: "4" },
]

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
export const plus = (day: string, n: number) => { const d = new Date(day + "T12:00:00"); d.setDate(d.getDate() + n); return iso(d) }
export const intervalOf = (c: Card) => (c.interval ?? (c.seen ? GAP[Math.min(5, Math.max(1, c.box || 1))] : 0))
export const dueOn = (c: Card) => (c.seen ? plus(c.seen, intervalOf(c)) : "")
export const isDue = (c: Card, today = iso(new Date())) => !c.seen || dueOn(c) <= today
export const boxFor = (interval: number) => (interval <= 1 ? 1 : interval <= 3 ? 2 : interval <= 7 ? 3 : interval <= 21 ? 4 : 5)
export const newId = () => "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

/** What a grade does to a card: the next interval (days) and ease. Again and Hard ease off; Easy
 *  jumps ahead. A new card: Again or Hard tomorrow, Good tomorrow, Easy in four days. */
export function next(c: Card, g: Grade): { interval: number; ease: number } {
  const i = c.seen ? intervalOf(c) : 0, e = c.ease ?? 2.5
  if (g === "again") return { interval: 1, ease: Math.max(1.3, e - 0.2) }
  if (g === "hard") return { interval: Math.max(1, Math.round(i * 1.2)), ease: Math.max(1.3, e - 0.15) }
  if (g === "good") return { interval: i ? Math.max(i + 1, Math.round(i * e)) : 1, ease: e }
  return { interval: i ? Math.max(i + 2, Math.round(i * e * 1.3)) : 4, ease: e + 0.15 }
}

/** "1 day", "4 days", "2 weeks", "3 months". */
export function span(days: number) {
  if (days < 14) return `${days} ${days === 1 ? "day" : "days"}`
  if (days < 60) return `${Math.round(days / 7)} weeks`
  if (days < 365) return `${Math.round(days / 30)} months`
  const y = Math.round(days / 36.5) / 10
  return `${y} ${y === 1 ? "year" : "years"}`
}
/** Short, for a button: "1d", "2w", "3mo". */
export const short = (days: number) => (days < 14 ? `${days}d` : days < 60 ? `${Math.round(days / 7)}w` : days < 365 ? `${Math.round(days / 30)}mo` : `${Math.round(days / 36.5) / 10}y`)

/** Days in a row with at least one card studied, up to today (today counts once there is one). */
export function streak(studied: Record<string, number>, today = iso(new Date())) {
  let d = studied[today] ? today : plus(today, -1), n = 0
  while ((studied[d] ?? 0) > 0 && n < 3650) { n++; d = plus(d, -1) }
  return n
}

export function useCards() {
  const [cards, setCards] = useStore<Card[]>("cards", [])
  const [studied, setStudied] = useStore<Record<string, number>>("studied", {})
  const list = (cards ?? []) as Card[], log = (studied ?? {}) as Record<string, number>
  const due = list.filter((c) => isDue(c))
  const topics = [...new Set(list.map((c) => c.topic || "No topic"))]
  useEffect(() => { if (list.length) setSummary(due.length ? `${due.length} ${due.length === 1 ? "card" : "cards"} due today` : "Nothing due today") }, [due.length, list.length])
  return {
    cards: list, due, topics, studied: log,
    /** Grades a card: its next interval, ease and box, seen today, and today's count goes up. */
    grade: async (id: string, g: Grade) => {
      const today = iso(new Date())
      await setCards((now: Card[]) => (now ?? []).map((c) => {
        if (c.id !== id) return c
        const n = next(c, g)
        return { ...c, box: boxFor(n.interval), seen: today, interval: n.interval, ease: Math.round(n.ease * 100) / 100 }
      }))
      return setStudied((now: Record<string, number>) => ({ ...(now ?? {}), [today]: ((now ?? {})[today] ?? 0) + 1 }))
    },
    add: (c: { q: string; a: string; topic?: string }) => setCards((now: Card[]) => [...(now ?? []), { id: newId(), ...c, box: 1 }]),
    addMany: (cs: { q: string; a: string; topic?: string }[]) => setCards((now: Card[]) => [...(now ?? []), ...cs.map((c, i) => ({ id: newId() + i, ...c, box: 1 }))]),
    update: (id: string, patch: Partial<Card>) => setCards(list.map((c) => (c.id === id ? { ...c, ...patch } : c))),
    remove: (id: string) => setCards(list.filter((c) => c.id !== id)),
    /** Puts the whole list back (Undo after a delete). */
    restore: (all: Card[]) => setCards(all),
  }
}

/** Lines of "question - answer", "question | answer", "question: answer" or tab-separated, as cards. */
export function parseLines(text: string) {
  const out: { q: string; a: string }[] = []
  for (const raw of text.split("\n")) {
    const line = raw.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim()
    if (!line) continue
    const m = line.match(/^(.+?)\s*(?:\t|\s\|\s|\s[-–—]\s|\s=\s|::|(?<=\?)\s+|:\s)\s*(.+)$/)
    if (m && m[1].trim() && m[2].trim()) out.push({ q: m[1].trim(), a: m[2].trim() })
  }
  return out
}
