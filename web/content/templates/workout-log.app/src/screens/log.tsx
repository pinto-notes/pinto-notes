import { useState } from "react"
import { Plus } from "lucide-react"
import { Section, Title, TintButton } from "@/components/kit"
import { SessionRow } from "@/components/session-row"
import { SessionSheet } from "@/components/session-sheet"
import { blank, chrono, newBests, parse, useWorkouts, type Session } from "@/lib/workouts"

// Every session, newest first, by month. Choose one to change or delete it; Log adds one by hand
// (any date: a session from last week goes where its date puts it).
export default function Log() {
  const w = useWorkouts()
  const [editing, setEditing] = useState<Session | null>(null)
  const bests = newBests(w.exercises, w.sessions)
  const months: { key: string; title: string; list: Session[] }[] = []
  for (const s of chrono(w.sessions).reverse()) {
    const key = s.date.slice(0, 7)
    if (months[months.length - 1]?.key !== key) months.push({ key, title: parse(s.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" }), list: [] })
    months[months.length - 1].list.push(s)
  }
  return (
    <div className="max-w-2xl">
      <Title title="Sessions" subtitle={`${w.sessions.length} logged`} action={<TintButton onClick={() => setEditing(blank(w.sessions))}><Plus /> Log</TintButton>} />
      {months.map((m, i) => (
        <Section key={m.key} title={m.title} footer={i === months.length - 1 ? "Choose a session to change or delete it." : undefined}>
          {m.list.map((s) => <SessionRow key={s.id} session={s} exercise={w.exercise} units={w.units} bests={bests.get(s.id)} onOpen={() => setEditing(s)} />)}
        </Section>
      ))}
      {!months.length && (
        <Section>
          <p className="px-6 py-10 text-center text-muted-foreground">No sessions yet. Use Log after training, or tell your AI what you did.</p>
        </Section>
      )}
      <SessionSheet editing={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
