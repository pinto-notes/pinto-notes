import { Check, Minus, Plus } from "lucide-react"
import { route } from "amber-router"
import { Ring, Row, Section, Title, TintButton } from "@/components/kit"
import { addDays, done, iso, streak, today, week, weekStart, useHabits, type Habit } from "@/lib/habits"
import { cn } from "@/lib/utils"

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"]

// The app's main job: tick off today's habits in one tap, and see the week at a glance.
export default function Today() {
  const { habits, days, set } = useHabits()
  const now = today(), day = iso(now)
  const w = week(days, habits, now)
  const doneToday = habits.filter((h) => done(days, h, day)).length
  const dateLine = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })

  return (
    <>
      <Title subtitle={dateLine} title="Today" />
      {habits.length === 0 ? (
        <Section>
          <div className="px-6 py-10 text-center">
            <p className="text-[1.0625rem] font-semibold">No habits yet</p>
            <p className="mt-1 text-muted-foreground">Add two or three small ones to start.</p>
            <TintButton className="mt-5" onClick={() => route("/habits")}><Plus /> Add a habit</TintButton>
          </div>
        </Section>
      ) : (
        <div className="min-[900px]:grid min-[900px]:grid-cols-[300px_1fr] min-[900px]:gap-6 min-[900px]:items-start">
          <Section>
            <div className="flex items-center gap-5 p-5 min-[900px]:flex-col min-[900px]:text-center">
              <Ring value={w.share} size={96} stroke={11} label={`This week ${Math.round(w.share * 100)}%`}>
                <span className="text-xl font-bold tabular-nums">{Math.round(w.share * 100)}%</span>
              </Ring>
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">This week</p>
                <p className="text-[1.375rem] font-bold leading-snug tabular-nums" data-testid="today-count">{doneToday} of {habits.length} done today</p>
                <p className="text-[0.9375rem] text-muted-foreground tabular-nums">{w.got} of {w.of} since Monday</p>
              </div>
            </div>
          </Section>
          <Section title="Habits" footer="To change an earlier day, tap it in History.">
            {habits.map((h) => <HabitRow key={h.id} habit={h} days={days} set={set} />)}
          </Section>
        </div>
      )}
    </>
  )
}

function HabitRow({ habit: h, days, set }: { habit: Habit; days: Record<string, Record<string, number>>; set: (h: Habit, v: number | ((was: number) => number), on?: string) => unknown }) {
  const now = today(), day = iso(now)
  const value = days[day]?.[h.id] ?? 0
  const isDone = value >= h.target
  const s = streak(days, h, now)
  const counted = h.target > 1
  const start = weekStart(now)
  return (
    <Row className="py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[1.0625rem] font-semibold leading-tight">{h.name}</p>
        <p className="mt-0.5 text-[0.875rem] text-muted-foreground tabular-nums">
          {counted ? `${value} of ${h.target} ${h.unit ?? ""}`.trim() : h.detail || (isDone ? "Done" : "Not yet")}
          {s > 0 && <> · <span className="text-primary">{s}-day streak</span></>}
        </p>
        <div className="mt-2 flex gap-1.5" aria-hidden="true">
          {LETTERS.map((l, i) => {
            const d = iso(addDays(start, i)), got = (days[d]?.[h.id] ?? 0)
            const full = got >= h.target, part = got > 0 && !full
            return (
              <span key={i} className={cn("grid size-6 place-items-center rounded-full text-[0.75rem] font-semibold",
                full ? "bg-primary text-primary-foreground" : part ? "bg-[var(--amber-accent-soft)] text-primary" : "bg-muted text-muted-foreground",
                d === day && !full && "ring-[1.5px] ring-[var(--amber-accent)]")}>{l}</span>
            )
          })}
        </div>
      </div>
      {counted ? (
        <div className="flex items-center gap-2">
          <button type="button" aria-label={`One less ${h.name}`} disabled={value === 0} onClick={() => set(h, (was) => Math.max(0, was - 1))}
            className="grid size-11 place-items-center rounded-full bg-muted text-foreground disabled:opacity-30"><Minus className="size-5" /></button>
          <button type="button" aria-label={`One more ${h.name}`} onClick={() => set(h, (was) => was + 1)}
            className="relative grid size-12 place-items-center">
            <Ring value={value / h.target} size={48} stroke={5} />
            <span className="absolute inset-0 grid place-items-center">{isDone ? <Check className="size-5 text-primary" strokeWidth={3} /> : <Plus className="size-5 text-primary" strokeWidth={2.5} />}</span>
          </button>
        </div>
      ) : (
        <button type="button" aria-label={`Done: ${h.name}`} aria-pressed={isDone} onClick={() => set(h, isDone ? 0 : 1)}
          className={cn("grid size-12 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none",
            isDone ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}>
          <Check className={cn("size-6 transition-transform duration-200 motion-reduce:transition-none", isDone ? "scale-100" : "scale-50")} strokeWidth={3} />
        </button>
      )}
    </Row>
  )
}
