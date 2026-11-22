import { useState } from "react"
import { Check, Plus, Trophy } from "lucide-react"
import { route } from "amber-router"
import { PrimaryButton, Ring, Row, Section, Title, TintButton } from "@/components/kit"
import { SessionRow } from "@/components/session-row"
import { SessionSheet } from "@/components/session-sheet"
import { addDays, bestSet, blank, bestText, chrono, iso, LETTERS, metricsOf, newBests, nextUp, records, setText, shortDate, thisWeek, today, weekStart, WEEKDAYS, lastSets, useWorkouts, type Session } from "@/lib/workouts"
import { cn } from "@/lib/utils"

// The first screen: this week against the goal, what's next in the plan (with what each exercise
// was last time) and one button to start it, then the latest sessions and the latest bests.
// From 700 px two columns, except between 900 and 1100 px where the sidebar leaves too little room.
export default function Today() {
  const w = useWorkouts()
  const { plan, sessions, units: u, goal } = w
  const [editing, setEditing] = useState<Session | null>(null)
  const [chosen, setChosen] = useState<string | null>(null)
  const now = today(), day = iso(now)
  const week = thisWeek(sessions, now)
  const { next, today: doneToday } = nextUp(plan, sessions, now)
  const showing = plan.find((p) => p.id === chosen) ?? next
  const bests = newBests(w.exercises, sessions)
  const recent = chrono(sessions).reverse().slice(0, 4)
  const dateLine = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
  const left = goal - week.count
  // The latest bests set (beating an earlier one), newest first.
  const latest = w.all.flatMap((ex) => {
    const r = records(ex, sessions)
    return r.best.filter((b) => r.beat.get(b.session.id)?.includes(b.metric)).map((b) => ({ ex, b }))
  }).sort((a, b) => (a.b.session.date < b.b.session.date ? 1 : -1)).slice(0, 3)

  return (
    <>
      <Title subtitle={dateLine} title="Today" />
      <div className="min-[700px]:grid min-[700px]:grid-cols-2 min-[900px]:block min-[1100px]:grid min-[1100px]:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] min-[700px]:items-start min-[700px]:gap-6">
        <div>
          <Section>
            <div className="flex items-center gap-5 p-5">
              <Ring value={week.count / goal} size={96} stroke={11} label={`This week ${week.count} of ${goal}`}>
                {left <= 0 ? <Check className="size-9 text-link" strokeWidth={3} /> : <span className="text-xl font-bold tabular-nums">{week.count}/{goal}</span>}
              </Ring>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">This week</p>
                <p className="whitespace-nowrap text-[1.375rem] font-bold leading-snug tabular-nums" data-testid="week-count">{week.count} of {goal} sessions</p>
                <p className="text-[0.9375rem] text-muted-foreground" data-testid="week-left">{left > 0 ? `${left} to go` : left === 0 ? "Goal met" : `Goal met, ${-left} extra`}</p>
                <div className="mt-2 flex gap-1.5" role="img" aria-label={week.days.length ? `Trained on ${week.days.map((i) => WEEKDAYS[i]).join(", ")}` : "Nothing yet this week"}>
                  {LETTERS.map((l, i) => {
                    const on = week.days.includes(i), isToday = iso(addDays(weekStart(now), i)) === day
                    return <span key={i} className={cn("grid size-6 place-items-center rounded-full text-[0.75rem] font-semibold",
                      on ? "bg-[var(--amber-accent)] text-mark-text" : "bg-muted text-muted-foreground", isToday && !on && "ring-2 ring-[var(--amber-accent)]")}>{l}</span>
                  })}
                </div>
              </div>
            </div>
          </Section>

          {showing ? (
            <Section title={doneToday && !chosen ? "Next time" : "Next up"}>
              {doneToday && (
                <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-[0.9375rem]" data-testid="done-today">
                  <Check className="size-4 shrink-0 text-link" strokeWidth={3} /> <span>Done today: <b className="font-semibold">{doneToday.name}</b></span>
                </div>
              )}
              {plan.length > 1 && (
                <div className="flex flex-wrap gap-2 px-4 pt-4" role="radiogroup" aria-label="Choose a workout">
                  {plan.map((p) => (
                    <button key={p.id} type="button" role="radio" aria-checked={p.id === showing.id} onClick={() => setChosen(p.id)}
                      className={cn("h-9 rounded-full px-3.5 text-[0.9375rem] font-medium", p.id === showing.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="px-4 pb-1 pt-3">
                <p className="text-[1.375rem] font-bold leading-tight" data-testid="next-name">{showing.name}</p>
                {showing.id === next?.id && plan.length > 1 && <p className="text-[0.875rem] text-muted-foreground">Next in your plan</p>}
              </div>
              {showing.exercises.map((id) => {
                const ex = w.exercise(id), last = lastSets(sessions, id, now)
                const top = last.length ? (ex.kind === "cardio" ? last[0] : bestSet({ exercise: id, sets: last }, metricsOf(ex, sessions)[0])) : undefined
                return (
                  <Row key={id} className="py-2">
                    <span className="min-w-0 flex-1 truncate font-medium">{ex.name}</span>
                    <span className="shrink-0 text-[0.875rem] tabular-nums text-muted-foreground">{top ? `Last: ${setText(top, ex.kind, u)}` : "First time"}</span>
                  </Row>
                )
              })}
              <div className="flex flex-col gap-2 p-4">
                <PrimaryButton onClick={() => setEditing(blank(sessions, showing, now))}>Start {showing.name}</PrimaryButton>
                <TintButton className="bg-transparent" onClick={() => setEditing(blank(sessions, undefined, now))}><Plus /> Log another workout</TintButton>
              </div>
            </Section>
          ) : (
            <Section>
              <div className="px-6 py-8 text-center">
                <p className="text-[1.0625rem] font-semibold">No plan yet</p>
                <p className="mt-1 text-muted-foreground">Add the workouts you do in turn, and Today shows the next one.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <TintButton onClick={() => setEditing(blank(sessions, undefined, now))}><Plus /> Log a session</TintButton>
                  <TintButton onClick={() => route("/plan")}>Make a plan</TintButton>
                </div>
              </div>
            </Section>
          )}
        </div>

        <div>
          <Section title="Recent" action={sessions.length > 4 ? <button type="button" onClick={() => route("/log")} className="-my-2 h-11 px-1 text-[0.9375rem] font-semibold text-link">All sessions</button> : undefined}>
            {recent.map((s) => <SessionRow key={s.id} session={s} exercise={w.exercise} units={u} bests={bests.get(s.id)} onOpen={() => setEditing(s)} />)}
            {!recent.length && <p className="px-4 py-6 text-center text-muted-foreground">No sessions yet. Start one, or tell your AI what you did.</p>}
          </Section>
          {latest.length > 0 && (
            <Section title="Latest bests" footer="Every exercise's best is on Progress.">
              {latest.map(({ ex, b }) => (
                <Row key={ex.id + b.metric}>
                  <Trophy className="size-4 shrink-0 text-link" />
                  <span className="min-w-0 flex-1 truncate font-medium">{ex.name}</span>
                  <span className="shrink-0 tabular-nums">{bestText(b, ex, u)}</span>
                  <span className="w-14 shrink-0 text-right text-[0.875rem] text-muted-foreground">{shortDate(b.session.date)}</span>
                </Row>
              ))}
            </Section>
          )}
        </div>
      </div>
      <SessionSheet editing={editing} onClose={() => setEditing(null)} />
    </>
  )
}
