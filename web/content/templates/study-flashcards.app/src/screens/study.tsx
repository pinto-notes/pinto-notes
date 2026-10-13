import { useState } from "react"
import { Pills, PrimaryButton, Section, Title, TintButton, Bar } from "@/components/kit"
import { useCards, type Card } from "@/lib/cards"

// The app's main job: study what's due today, a card at a time.
export default function Study() {
  const { cards, due, topics, grade } = useCards()
  const [topic, setTopic] = useState("All")
  const [session, setSession] = useState<{ ids: string[]; at: number; shown: boolean; knew: number; missed: number } | null>(null)
  const inTopic = (c: Card) => topic === "All" || (c.topic || "No topic") === topic
  const dueHere = due.filter(inTopic)
  const boxes = [1, 2, 3, 4, 5].map((b) => cards.filter((c) => (c.box || 1) === b && inTopic(c)).length)
  const most = Math.max(1, ...boxes)

  if (session) {
    const card = cards.find((c) => c.id === session.ids[session.at])
    if (!card) {
      return (
        <div className="mx-auto max-w-md pt-10 text-center">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">Done for today</p>
          <h1 className="mt-1 text-[2rem] font-bold tracking-tight">{session.knew} knew, {session.missed} to see again</h1>
          <p className="mt-2 text-muted-foreground">Cards you knew come back later; the ones you missed come back tomorrow.</p>
          <PrimaryButton className="mt-8" onClick={() => setSession(null)}>Done</PrimaryButton>
        </div>
      )
    }
    const answer = async (knew: boolean) => {
      await grade(card.id, knew)
      setSession({ ...session, at: session.at + 1, shown: false, knew: session.knew + (knew ? 1 : 0), missed: session.missed + (knew ? 0 : 1) })
    }
    return (
      <div className="mx-auto max-w-xl pt-2">
        <div className="mb-4 flex items-center gap-3">
          <Bar className="flex-1" value={session.at / session.ids.length} label="Studied" />
          <span className="text-[0.875rem] font-medium tabular-nums text-muted-foreground">{session.at + 1} of {session.ids.length}</span>
          <button type="button" onClick={() => setSession(null)} className="h-11 px-2 font-semibold text-primary">End</button>
        </div>
        <Section>
          <div className="flex min-h-[18rem] flex-col p-6">
            <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">{card.topic || "No topic"} · Box {card.box || 1}</p>
            <p className="mt-4 text-[1.5rem] font-semibold leading-snug" data-testid="question">{card.q}</p>
            {session.shown && (
              <div className="mt-5 border-t border-border pt-5 animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
                <p className="text-[1.25rem] leading-snug text-primary" data-testid="answer">{card.a}</p>
              </div>
            )}
          </div>
        </Section>
        {session.shown ? (
          <div className="grid grid-cols-2 gap-3">
            <TintButton className="h-12 text-[1.0625rem]" onClick={() => answer(false)}>Didn't know</TintButton>
            <PrimaryButton onClick={() => answer(true)}>Knew it</PrimaryButton>
          </div>
        ) : (
          <PrimaryButton onClick={() => setSession({ ...session, shown: true })}>Show answer</PrimaryButton>
        )}
      </div>
    )
  }

  // Lowest box first: the cards you know least come up first.
  const start = () => setSession({ ids: dueHere.slice().sort((a, b) => (a.box || 1) - (b.box || 1)).map((c) => c.id), at: 0, shown: false, knew: 0, missed: 0 })
  return (
    <>
      <Title title="Study" />
      <div className="min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-6 min-[900px]:items-start">
        <div>
          <Section>
            <div className="p-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">Due today</p>
              <p className="text-[2.5rem] font-bold leading-tight tracking-tight tabular-nums" data-testid="due">{dueHere.length ? `${dueHere.length} ${dueHere.length === 1 ? "card" : "cards"}` : "Nothing due"}</p>
              <p className="text-[0.9375rem] text-muted-foreground">{cards.length ? <>{cards.filter(inTopic).length} cards{topic === "All" ? ` in ${topics.length} ${topics.length === 1 ? "topic" : "topics"}` : ` in ${topic}`}</> : "No cards yet. Add the first one in the Cards tab."}</p>
            </div>
          </Section>
          {topics.length > 1 && <div className="mb-5"><Pills label="Topic" options={["All", ...topics]} value={topic} onChange={setTopic} /></div>}
          <PrimaryButton className="mb-6" disabled={!dueHere.length} onClick={start}>Study now</PrimaryButton>
        </div>
        <Section title="Boxes" footer="A card you know moves up a box and comes back later. Miss it and it goes back to box 1.">
          <div className="flex h-40 items-end gap-3 px-5 pb-3 pt-5" aria-label={`Cards per box: ${boxes.join(", ")}`} role="img">
            {boxes.map((n, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[0.8125rem] font-semibold tabular-nums">{n}</span>
                <div className="w-full rounded-md bg-[var(--amber-accent)] transition-[height] duration-500 motion-reduce:transition-none" style={{ height: `${Math.max(4, (n / most) * 80)}px`, opacity: 0.45 + i * 0.14 }} />
                <span className="text-[0.75rem] text-muted-foreground">Box {i + 1}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  )
}
