import { useLayoutEffect, useRef, useState } from "react"
import { Pills, PrimaryButton, Section, Title, Bar } from "@/components/kit"
import { dueOn, GRADES, intervalOf, iso, level, next, plus, short, span, streak, useCards, type Card, type Grade } from "@/lib/cards"
import { cn } from "@/lib/utils"

type Session = { ids: string[]; at: number; shown: boolean; counts: Record<Grade, number>; again: string[] }

// The app's main job: study what's due today, a card at a time, and grade it like Anki (Again,
// Hard, Good, Easy, each showing when the card comes back). Around it: the newest card, question
// over answer (what a card is, before any chart about cards), the streak, a calendar of the last
// 12 weeks and what's coming up this week. How well you know the cards is on the Cards screen,
// under the cards themselves. Two columns from 700 px.
export default function Study() {
  const { cards, due, topics, grade, studied } = useCards()
  const [topic, setTopic] = useState("All")
  const [session, setSession] = useState<Session | null>(null)
  const inTopic = (c: Card) => topic === "All" || (c.topic || "No topic") === topic
  const dueHere = due.filter(inTopic)
  const fresh = dueHere.filter((c) => !c.seen).length
  const today = iso(new Date())
  const s = streak(studied)

  if (session) return <Studying session={session} setSession={setSession} cards={cards} grade={grade} streakNow={streak(studied)} />

  // Least known first: the lowest box, then the shortest interval.
  const start = () => setSession({ ids: dueHere.slice().sort((a, b) => (a.box || 1) - (b.box || 1) || intervalOf(a) - intervalOf(b)).map((c) => c.id), at: 0, shown: false, counts: { again: 0, hard: 0, good: 0, easy: 0 }, again: [] })
  const week = Array.from({ length: 7 }, (_, i) => plus(today, i + 1)).map((d) => ({ d, n: cards.filter((c) => inTopic(c) && c.seen && dueOn(c) === d).length }))
  const weekMost = Math.max(1, ...week.map((w) => w.n))
  // The card added last: the one your AI just made, or you did.
  const newest = cards.filter(inTopic).at(-1)

  return (
    <>
      <Title title="Study" />
      <div className="min-[700px]:grid min-[700px]:grid-cols-2 min-[700px]:items-start min-[700px]:gap-6">
        <div>
          <Section>
            <div className="p-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">Due today</p>
              <p className="text-[2.5rem] font-bold leading-tight tracking-tight tabular-nums" data-testid="due">{dueHere.length ? `${dueHere.length} ${dueHere.length === 1 ? "card" : "cards"}` : "Nothing due"}</p>
              <p className="text-[0.9375rem] text-muted-foreground">{cards.filter(inTopic).length} cards{topic === "All" ? ` in ${topics.length} ${topics.length === 1 ? "topic" : "topics"}` : ` in ${topic}`}</p>
              {fresh > 0 && <p className="text-[0.9375rem] text-muted-foreground">{fresh} new</p>}
            </div>
          </Section>
          {/* Study now under what's due, then the topics it studies under their own heading, so
              the picked topic never sits beside the button looking like a second one. The streak
              names itself ("6-day streak"), so its card has no heading over it. */}
          <PrimaryButton className="mb-6" disabled={!dueHere.length} onClick={start}>Study now</PrimaryButton>
          {topics.length > 1 && (
            <div className="mb-6">
              <h2 className="px-1 pb-2 text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">Topics</h2>
              <Pills label="Topic" options={["All", ...topics]} value={topic} onChange={setTopic} />
            </div>
          )}
          <Section>
            <div className="p-4">
              <p className="text-[1.375rem] font-bold leading-tight tabular-nums" data-testid="streak">{s ? `${s}-day streak` : "No streak yet"}</p>
              <p className="mb-3 text-[0.875rem] text-muted-foreground">{studied[today] ? `${studied[today]} ${studied[today] === 1 ? "card" : "cards"} today.` : s ? "Study a card today to keep it going." : "Study a few cards a day: that's what makes them stick."}</p>
              <Heatmap studied={studied} today={today} />
            </div>
          </Section>
        </div>
        <div>
          {newest && (
            <Section title="Newest card">
              <div className="p-5" data-testid="newest">
                <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">{newest.topic || "No topic"} · {level(newest)}</p>
                <p className="mt-2 text-[1.1875rem] font-semibold leading-snug">{newest.q}</p>
                <p className="mt-3 border-t border-border pt-3 text-[1.0625rem] leading-snug text-link">{newest.a}</p>
              </div>
            </Section>
          )}
          <Section title="Coming up" footer="Cards you know come back later and later. Again brings one back tomorrow.">
            <div className="flex h-28 items-end gap-2 px-4 pb-2 pt-4" role="img" aria-label={`Due in the next seven days: ${week.map((w) => w.n).join(", ")}`}>
              {week.map((w, i) => (
                <div key={w.d} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <span className="text-[0.75rem] font-semibold tabular-nums">{w.n || ""}</span>
                  <div className="w-full rounded-md bg-[var(--amber-accent)]" style={{ height: `${w.n ? Math.max(4, (w.n / weekMost) * 56) : 2}px`, opacity: w.n ? 0.85 : 0.25 }} />
                  <span className="text-[0.75rem] text-muted-foreground">{new Date(w.d + "T12:00").toLocaleDateString("en-GB", { weekday: "short" })}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </>
  )
}

// The last 12 weeks, a square a day, darker for more cards (like GitHub's, and Anki's heatmap add-on).
// Labelled so it can be read without guessing: each column is a week, with the month over its first
// week; today has a ring; the lines beside it say what a square and a darker one mean. The streak over it is the run of
// squares that ends today or yesterday (council round 3: "attractive but poorly explained").
function Heatmap({ studied, today }: { studied: Record<string, number>; today: string }) {
  const end = new Date(today + "T12:00:00")
  const first = plus(today, -((end.getDay() + 6) % 7) - 7 * 11)
  const days = Array.from({ length: 84 }, (_, i) => plus(first, i))
  const top = Math.max(1, ...days.map((d) => studied[d] ?? 0))
  const total = days.filter((d) => (studied[d] ?? 0) > 0 && d <= today).length
  const month = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { month: "short" })
  // A month's name over the first week that starts in it (and over the first column).
  const heads = Array.from({ length: 12 }, (_, w) => { const d = days[w * 7]; return w === 0 || month(d) !== month(days[(w - 1) * 7]) ? month(d) : "" })
  return (
    <div className="flex items-end gap-4" role="img" aria-label={`Studied on ${total} of the last 12 weeks' days`}>
      <div className="w-[201px] shrink-0">
        <div className="mb-1 grid grid-cols-12 gap-[3px]" aria-hidden="true">
          {heads.map((h, w) => <span key={w} className="overflow-visible whitespace-nowrap text-[0.75rem] leading-none text-muted-foreground">{h}</span>)}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
          {days.map((d) => {
            const n = studied[d] ?? 0
            return <span key={d} data-today={d === today || undefined} className={cn("aspect-square rounded-[3px]", d > today ? "bg-transparent" : n ? "bg-[var(--amber-accent)]" : "bg-muted",
              d === today && "ring-[1.5px] ring-foreground ring-offset-1 ring-offset-[var(--card)]")} style={n && d <= today ? { opacity: 0.35 + 0.65 * (n / top) } : undefined} />
          })}
        </div>
      </div>
      {/* Beside the squares, in the room the card has there: under them it made the card too tall
          for the library's stage, which then dropped the calendar. */}
      <div className="min-w-0 text-[0.75rem] leading-snug text-muted-foreground" aria-hidden="true">
        <p>A square a day.</p>
        <p>Today is ringed.</p>
        <p className="mt-1 flex items-center gap-1">Fewer{[0.35, 0.6, 0.8, 1].map((o) => <span key={o} className="size-2.5 shrink-0 rounded-[2px] bg-[var(--amber-accent)]" style={{ opacity: o }} />)}more</p>
      </div>
    </div>
  )
}

function Studying({ session, setSession, cards, grade, streakNow }: { session: Session; setSession: (s: Session | null) => void; cards: Card[]; grade: (id: string, g: Grade) => Promise<unknown>; streakNow: number }) {
  const card = cards.find((c) => c.id === session.ids[session.at])
  const answer = async (g: Grade) => {
    if (!card) return
    await grade(card.id, g)
    // Again: once more at the end of this session.
    const again = g === "again" && !session.again.includes(card.id)
    setSession({ ...session, ids: again ? [...session.ids, card.id] : session.ids, again: again ? [...session.again, card.id] : session.again, at: session.at + 1, shown: false, counts: { ...session.counts, [g]: session.counts[g] + 1 } })
  }
  // Space or Return shows the answer; 1 to 4 grade it (a Mac with a keyboard). The listener reads
  // the latest state through a ref, so a key right after a change still sees it.
  const live = useRef({ card, session, answer })
  live.current = { card, session, answer }
  // Attached in the same commit as the card, so a key pressed the moment it shows is never missed.
  useLayoutEffect(() => {
    const key = (e: KeyboardEvent) => {
      const { card, session, answer } = live.current
      if (!card || (e.target as HTMLElement)?.closest?.("input, textarea, button")) return
      if (!session.shown && (e.key === " " || e.key === "Enter")) { e.preventDefault(); setSession({ ...session, shown: true }) }
      else if (session.shown) { const g = GRADES.find((x) => x.key === e.key); if (g) { e.preventDefault(); answer(g.grade) } }
    }
    document.addEventListener("keydown", key)
    return () => document.removeEventListener("keydown", key)
  }, [])

  if (!card) {
    const total = Object.values(session.counts).reduce((a, b) => a + b, 0)
    return (
      <div className="mx-auto max-w-md pt-10 text-center">
        <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">Done for today</p>
        <h1 className="mt-1 text-[2rem] font-bold tracking-tight">{total} {total === 1 ? "answer" : "answers"}, {session.counts.again} again</h1>
        <p className="mt-2 text-muted-foreground">{streakNow > 1 ? `${streakNow}-day streak. ` : ""}Cards you knew come back later; the ones you missed come back tomorrow.</p>
        <PrimaryButton className="mt-8" onClick={() => setSession(null)}>Done</PrimaryButton>
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-xl pt-2">
      <div className="mb-4 flex items-center gap-3">
        <Bar className="flex-1" value={session.at / session.ids.length} label="Studied" />
        <span className="text-[0.875rem] font-medium tabular-nums text-muted-foreground">{session.at + 1} of {session.ids.length}</span>
        <button type="button" onClick={() => setSession(null)} className="h-11 px-2 font-semibold text-link">End</button>
      </div>
      <Section>
        <div className="flex min-h-[18rem] flex-col p-6">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">{card.topic || "No topic"} · {level(card)}</p>
          <p className="mt-4 text-[1.5rem] font-semibold leading-snug" data-testid="question">{card.q}</p>
          {session.shown && (
            <div className="mt-5 border-t border-border pt-5 animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
              <p className="text-[1.25rem] leading-snug text-link" data-testid="answer">{card.a}</p>
            </div>
          )}
        </div>
      </Section>
      {session.shown ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            {GRADES.map(({ grade: g, label }) => {
              const days = next(card, g).interval
              // Again asks the card once more at the end of this session (the first time), and
              // that is what its button says: "soon", not the day after it's due again.
              const soon = g === "again" && !session.again.includes(card.id)
              return (
                <button key={g} type="button" aria-label={soon ? `${label}, once more this session, then back in ${span(days)}` : `${label}, back in ${span(days)}`} onClick={() => answer(g)}
                  className={cn("flex h-14 flex-col items-center justify-center rounded-xl font-semibold active:opacity-80",
                    g === "good" ? "bg-primary text-primary-foreground" : g === "again" ? "bg-muted text-foreground" : "bg-[var(--amber-accent-soft)] text-link")}>
                  <span className="text-[1rem] leading-tight">{label}</span>
                  <span className="text-[0.75rem] font-medium tabular-nums opacity-80" data-testid={`when-${g}`}>{soon ? "soon" : short(days)}</span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 hidden text-center text-[0.8125rem] text-muted-foreground min-[700px]:block">Keys 1 to 4 grade the card.</p>
        </>
      ) : (
        <>
          <PrimaryButton onClick={() => setSession({ ...session, shown: true })}>Show answer</PrimaryButton>
          <p className="mt-3 hidden text-center text-[0.8125rem] text-muted-foreground min-[700px]:block">Space shows the answer.</p>
        </>
      )}
    </div>
  )
}
