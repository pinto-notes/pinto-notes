import { useState } from "react"
import { Check, ChevronRight, Minus, Plus } from "lucide-react"
import { route } from "amber-router"
import { Ring, Row, Section, Title, TintButton } from "@/components/kit"
import { HabitSheet } from "@/components/habit-sheet"
import { addDays, amount, done, doneInWeek, dueToday, iso, LETTERS, scheduled, skipped, streak, today, week, weekStart, useHabits, type Days, type Habit, type Skips } from "@/lib/habits"
import { cn } from "@/lib/utils"

// The app's main job: tick off today's habits in one tap, and see the week at a glance. Habits that
// aren't for today (a weekday habit on Sunday, a weekly goal already met) wait under Not today.
// From 700 px the week sits beside the list as a grid of every habit.
export default function Today() {
  const hb = useHabits()
  const { habits, days, skips } = hb
  const [open, setOpen] = useState<string | null>(null)
  const now = today(), day = iso(now)
  const w = week(days, skips, habits, now)
  const due = habits.filter((h) => dueToday(days, h, now))
  const later = habits.filter((h) => !due.includes(h))
  const doneCount = due.filter((h) => done(days, h, day)).length
  const allDone = due.length > 0 && doneCount === due.length
  const dateLine = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
  const showing = habits.find((h) => h.id === open) ?? null

  if (!habits.length) return (
    <>
      <Title subtitle={dateLine} title="Today" />
      <Section className="max-w-xl">
        <div className="px-6 py-10 text-center">
          <p className="text-[1.0625rem] font-semibold">No habits yet</p>
          <p className="mt-1 text-muted-foreground">Add two or three small ones to start.</p>
          <TintButton className="mt-5" onClick={() => route("/habits")}><Plus /> Add a habit</TintButton>
        </div>
      </Section>
    </>
  )

  const row = (h: Habit) => <HabitRow key={h.id} habit={h} days={days} skips={skips} set={hb.set} onOpen={() => setOpen(h.id)} />
  return (
    <>
      <Title subtitle={dateLine} title="Today" />
      <div className="min-[700px]:grid min-[700px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[700px]:items-start min-[700px]:gap-6">
        <div>
          <Section>
            <div className="flex items-center gap-5 p-5">
              <Ring value={w.share} size={96} stroke={11} label={`This week ${Math.round(w.share * 100)}%`}>
                {allDone ? <Check className="size-9 text-primary" strokeWidth={3} /> : <span className="text-xl font-bold tabular-nums">{Math.round(w.share * 100)}%</span>}
              </Ring>
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">This week</p>
                <p className="text-[1.375rem] font-bold leading-snug tabular-nums" data-testid="today-count">{allDone ? "All done today" : `${doneCount} of ${due.length} done today`}</p>
                <p className="text-[0.9375rem] text-muted-foreground tabular-nums">{w.got} of {w.of} since Monday</p>
              </div>
            </div>
          </Section>
          <WeekGrid habits={habits} days={days} skips={skips} className="hidden min-[700px]:block" />
        </div>
        <div>
          <Section title="Habits" footer={later.length ? undefined : "Tap a habit to see its month, skip a day or change it."}>
            {due.map(row)}
            {!due.length && <p className="px-4 py-5 text-center text-muted-foreground">Nothing is due today. Enjoy the day off.</p>}
          </Section>
          {later.length > 0 && (
            <Section title="Not today" footer="Tap a habit to see its month, skip a day or change it.">
              {later.map(row)}
            </Section>
          )}
        </div>
      </div>
      <HabitSheet habit={showing} onClose={() => setOpen(null)} />
    </>
  )
}

// Every habit's week, a dot a day (Mac and wide notes). Days to come are empty; a dashed ring is a skip.
function WeekGrid({ habits, days, skips, className }: { habits: Habit[]; days: Days; skips: Skips; className?: string }) {
  const now = today(), start = weekStart(now)
  return (
    <Section title="This week" className={className}>
      <div className="px-4 py-3" role="img" aria-label="This week, every habit">
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,28px)] items-center gap-x-1.5 gap-y-2.5">
          <span />
          {LETTERS.map((l, i) => <span key={i} className={cn("text-center text-[0.75rem] font-semibold", iso(addDays(start, i)) === iso(now) ? "text-primary" : "text-muted-foreground")}>{l}</span>)}
          {habits.map((h) => (
            <Dots key={h.id} habit={h} days={days} skips={skips} start={start} now={now} />
          ))}
        </div>
      </div>
    </Section>
  )
}

function Dots({ habit: h, days, skips, start, now }: { habit: Habit; days: Days; skips: Skips; start: Date; now: Date }) {
  return (
    <>
      <span className="truncate text-[0.9375rem] font-medium">{h.name}</span>
      {LETTERS.map((_, i) => {
        const d = addDays(start, i), k = iso(d), v = amount(days, h, k), full = v >= h.target
        return <span key={i} className={cn("mx-auto size-6 rounded-full",
          full ? "bg-primary" : skipped(skips, h, k) ? "border-[1.5px] border-dashed border-muted-foreground/60"
            : v > 0 ? "bg-[var(--amber-accent-soft)]" : k > iso(now) || !scheduled(h, d) ? "bg-muted/50" : "bg-muted",
          k === iso(now) && !full && "ring-[1.5px] ring-[var(--amber-accent)]")} />
      })}
    </>
  )
}

function HabitRow({ habit: h, days, skips, set, onOpen }: { habit: Habit; days: Days; skips: Skips; set: (h: Habit, v: number | ((was: number) => number), on?: string) => unknown; onOpen: () => void }) {
  const [popping, setPopping] = useState(false)
  const now = today(), day = iso(now)
  const value = amount(days, h, day)
  const isDone = value >= h.target
  const s = streak(days, skips, h, now)
  const counted = h.target > 1
  const start = weekStart(now)
  const skip = skipped(skips, h, day)
  const line = counted ? `${value} of ${h.target} ${h.unit ?? ""}`.trim()
    : h.perWeek ? `${doneInWeek(days, h, now)} of ${h.perWeek} this week`
    : skip ? "Skipped today" : h.detail || (isDone ? "Done" : "Not yet")
  const pop = () => setPopping(true)
  const settle = (e: React.AnimationEvent) => { if (e.animationName === "tick-ring") setPopping(false) }
  return (
    <Row className="py-3">
      <button type="button" aria-label={`Open ${h.name}`} onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-1 text-[1.0625rem] font-semibold leading-tight">{h.name}<ChevronRight className="size-4 text-muted-foreground" /></p>
        <p className="mt-0.5 text-[0.875rem] text-muted-foreground tabular-nums">
          {line}
          {s > 0 && <> · <span className="text-primary">{s}-{h.perWeek ? "week" : "day"} streak</span></>}
        </p>
        <span className="mt-2 flex gap-1.5 min-[700px]:hidden" aria-hidden="true">
          {LETTERS.map((l, i) => {
            const d = addDays(start, i), k = iso(d), got = amount(days, h, k)
            const full = got >= h.target, part = got > 0 && !full
            return (
              <span key={i} className={cn("grid size-6 place-items-center rounded-full text-[0.75rem] font-semibold",
                full ? "bg-primary text-primary-foreground" : part ? "bg-[var(--amber-accent-soft)] text-primary"
                  : skipped(skips, h, k) ? "border-[1.5px] border-dashed border-muted-foreground/60 text-muted-foreground"
                  : !scheduled(h, d) ? "bg-muted/50 text-muted-foreground/60" : "bg-muted text-muted-foreground",
                k === day && !full && "ring-[1.5px] ring-[var(--amber-accent)]")}>{l}</span>
            )
          })}
        </span>
      </button>
      {counted ? (
        <div className="flex items-center gap-2">
          <button type="button" aria-label={`One less ${h.name}`} disabled={value === 0} onClick={() => set(h, (was) => Math.max(0, was - 1))}
            className="grid size-11 place-items-center rounded-full bg-muted text-foreground disabled:opacity-30"><Minus className="size-5" /></button>
          <button type="button" aria-label={`One more ${h.name}`} onClick={() => { if (value + 1 === h.target) pop(); set(h, (was) => was + 1) }}
            onAnimationEnd={settle} className={cn("relative grid size-12 place-items-center rounded-full", popping && "tick-pop")}>
            <Ring value={value / h.target} size={48} stroke={5} />
            <span className="absolute inset-0 grid place-items-center">{isDone ? <Check className="size-5 text-primary" strokeWidth={3} /> : <Plus className="size-5 text-primary" strokeWidth={2.5} />}</span>
          </button>
        </div>
      ) : (
        <button type="button" aria-label={`Done: ${h.name}`} aria-pressed={isDone} onAnimationEnd={settle} onClick={() => { if (!isDone) pop(); set(h, isDone ? 0 : 1) }}
          className={cn("grid size-12 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none",
            isDone ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent",
            popping && "tick-pop")}>
          <Check className={cn("size-6 transition-transform duration-200 motion-reduce:transition-none", isDone ? "scale-100" : "scale-50")} strokeWidth={3} />
        </button>
      )}
    </Row>
  )
}
