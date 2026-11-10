import { useState } from "react"
import { Check, ChevronRight, Minus, Plus } from "lucide-react"
import { route } from "amber-router"
import { Ring, Row, Section, SHORT, Title, TintButton, useMedia } from "@/components/kit"
import { HabitSheet } from "@/components/habit-sheet"
import { addDays, amount, done, doneInWeek, dueToday, iso, LETTERS, parse, scheduled, skipped, streak, today, week, weekStart, WEEKDAYS, weekday, useHabits, type Days, type Habit, type Skips } from "@/lib/habits"
import { cn } from "@/lib/utils"

// The app's main job: tick off today's habits in one tap, and see the week at a glance. Habits that
// aren't for today (a weekday habit on Sunday, a weekly goal already met) wait under Not today.
// From 700 px the week sits beside the list as a grid of every habit, except between 900 and 1100 px,
// where the sidebar leaves too little room for two columns (a habit's name was cut to "No …").
export default function Today() {
  const hb = useHabits()
  const { habits, days, skips, from } = hb
  const [open, setOpen] = useState<string | null>(null)
  // One column and little height (a small phone, the smallest window): a smaller ring and rows
  // without their week strip, so four habits show where one did under 120 pt of empty card
  // (council round 4). The week is still the ring.
  const short = useMedia(SHORT)
  const now = today(), day = iso(now)
  const w = week(days, skips, habits, now, from)
  const due = habits.filter((h) => dueToday(days, h, now))
  const later = habits.filter((h) => !due.includes(h))
  const doneCount = due.filter((h) => done(days, h, day)).length
  const allDone = due.length > 0 && doneCount === due.length
  // The first day counted is today (a Monday, or the day the tracker was started) with nothing but
  // daily habits: the week so far is today.
  const sameAsWeek = w.first === day && w.got === doneCount && w.of === due.length
  // "Since Monday", or since the day the tracker was started when that's later in the week.
  const since = `Since ${WEEKDAYS[weekday(parse(w.first))]}`
  const dateLine = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
  const showing = habits.find((h) => h.id === open) ?? null

  if (!habits.length) return (
    <>
      <Title subtitle={dateLine} title="Today" className={short ? "pb-3" : undefined} />
      <Section className="max-w-xl">
        <div className="px-6 py-10 text-center">
          <p className="text-[1.0625rem] font-semibold">No habits yet</p>
          <p className="mt-1 text-muted-foreground">Add two or three small ones to start.</p>
          <TintButton className="mt-5" onClick={() => route("/habits")}><Plus /> Add a habit</TintButton>
        </div>
      </Section>
    </>
  )

  const row = (h: Habit) => <HabitRow key={h.id} habit={h} days={days} skips={skips} from={from} set={hb.set} onOpen={() => setOpen(h.id)} compact={short} />
  return (
    <>
      <Title subtitle={dateLine} title="Today" className={short ? "pb-3" : undefined} />
      <div className="min-[700px]:grid min-[700px]:grid-cols-2 min-[900px]:block min-[1100px]:grid min-[1100px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[700px]:items-start min-[700px]:gap-6">
        <div>
          <Section className={short ? "mb-2" : undefined}>
            <div className={cn("flex items-center", short ? "gap-4 px-4 py-3" : "gap-5 p-5")}>
              <Ring value={w.share} size={short ? 56 : 96} stroke={short ? 7 : 11} label={`This week ${Math.round(w.share * 100)}%`}>
                {allDone ? <Check className={cn("text-link", short ? "size-6" : "size-9")} strokeWidth={3} /> : <span className={cn("font-bold tabular-nums", short ? "text-[0.8125rem]" : "text-xl")}>{Math.round(w.share * 100)}%</span>}
              </Ring>
              {/* The ring is the week, so the lines beside it are the week too: a label, then the
                  count on one line whatever the numbers ("2 of 4 since Monday" broke in two beside
                  the ring), and today under it. Counting starts on Monday or on the day the
                  tracker was started, whichever is later ("Since Wednesday"). When that day is
                  today the week so far is today: the label says Today and today's own line, which
                  would say the count twice, is left out (council rounds 2 and 3). "This week" is
                  the grid's heading under this card. */}
              <div className="min-w-0">
                <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground" data-testid="week-label">{sameAsWeek ? "Today" : since}</p>
                <p className={cn("whitespace-nowrap font-bold tabular-nums", short ? "text-[1.0625rem] leading-tight" : "text-[1.375rem] leading-snug")} data-testid="week-count">{w.got} of {w.of}</p>
                {(allDone || !sameAsWeek) && <p className="text-[0.9375rem] text-muted-foreground tabular-nums" data-testid="today-count">{allDone ? "All done today" : `Today: ${doneCount} of ${due.length} done`}</p>}
              </div>
            </div>
          </Section>
          <WeekGrid habits={habits} days={days} skips={skips} from={from} className="hidden min-[700px]:block min-[900px]:hidden min-[1100px]:block" />
        </div>
        <div>
          <Section title={short ? undefined : "Habits"} footer={later.length ? undefined : "Choose a habit to see or change it."}>
            {due.map(row)}
            {!due.length && <p className="px-4 py-5 text-center text-muted-foreground">Nothing is due today. Enjoy the day off.</p>}
          </Section>
          {later.length > 0 && (
            <Section title="Not today" footer="Choose a habit to see or change it.">
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
function WeekGrid({ habits, days, skips, from, className }: { habits: Habit[]; days: Days; skips: Skips; from: string; className?: string }) {
  const now = today(), start = weekStart(now)
  return (
    <Section title="This week" className={className}>
      <div className="px-4 py-3" role="img" aria-label="This week, every habit">
        <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,18px)] items-center gap-x-1 gap-y-2.5">
          <span />
          {LETTERS.map((l, i) => <span key={i} className={cn("text-center text-[0.75rem] font-semibold", iso(addDays(start, i)) === iso(now) ? "text-link" : "text-muted-foreground")}>{l}</span>)}
          {habits.map((h) => (
            <Dots key={h.id} habit={h} days={days} skips={skips} start={start} now={now} from={from} />
          ))}
        </div>
      </div>
    </Section>
  )
}

// Days to come and days the habit isn't for are faint. A day before the tracker was started has no
// dot at all: there was nothing to do that day (council round 3).
function Dots({ habit: h, days, skips, start, now, from }: { habit: Habit; days: Days; skips: Skips; start: Date; now: Date; from: string }) {
  return (
    <>
      <span className="truncate text-[0.9375rem] font-medium">{h.name}</span>
      {LETTERS.map((_, i) => {
        const d = addDays(start, i), k = iso(d), v = amount(days, h, k), full = v >= h.target
        return <span key={i} className={cn("mx-auto size-[18px] rounded-full",
          full ? "bg-[var(--amber-accent)]" : skipped(skips, h, k) ? "border-[1.5px] border-dashed border-muted-foreground/60"
            : v > 0 ? "bg-[var(--amber-accent-soft)]" : k < from ? "invisible" : k > iso(now) || !scheduled(h, d) ? "bg-muted/50" : "bg-muted",
          k === iso(now) && !full && "ring-[1.5px] ring-[var(--amber-accent)]")} />
      })}
    </>
  )
}

function HabitRow({ habit: h, days, skips, from, set, onOpen, compact }: { habit: Habit; days: Days; skips: Skips; from: string; compact?: boolean; set: (h: Habit, v: number | ((was: number) => number), on?: string) => unknown; onOpen: () => void }) {
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
    <Row className={compact ? "py-2" : "py-3"}>
      <button type="button" aria-label={`Open ${h.name}`} onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="flex items-center gap-1 text-[1.0625rem] font-semibold leading-tight">{h.name}<ChevronRight className="size-4 text-muted-foreground" /></p>
        {/* The line and the streak wrap as two pieces, never mid-phrase ("streak" sat alone on a line:
            council round 3). The dot between them hangs in the gap, so when the streak takes a line
            of its own the dot falls outside the paragraph and is cut off, not left dangling. */}
        <p className="mt-0.5 flex flex-wrap gap-x-3 overflow-hidden text-[0.875rem] text-muted-foreground tabular-nums">
          {line}
          {s > 0 && <span className="relative whitespace-nowrap"><span aria-hidden="true" className="absolute -left-2">{" · "}</span><span className="text-link">{s}-{h.perWeek ? "week" : "day"} streak</span></span>}
        </p>
        {!compact && <span className="mt-2 flex gap-1.5 min-[700px]:hidden min-[900px]:flex min-[1100px]:hidden" aria-hidden="true">
          {LETTERS.map((l, i) => {
            const d = addDays(start, i), k = iso(d), got = amount(days, h, k)
            const full = got >= h.target, part = got > 0 && !full
            return (
              <span key={i} className={cn("grid size-6 place-items-center rounded-full text-[0.75rem] font-semibold",
                full ? "bg-[var(--amber-accent)] text-mark-text" : part ? "bg-[var(--amber-accent-soft)] text-link"
                  : skipped(skips, h, k) ? "border-[1.5px] border-dashed border-muted-foreground/60 text-muted-foreground"
                  : k < from ? "invisible" : !scheduled(h, d) ? "bg-muted/50 text-muted-foreground/60" : "bg-muted text-muted-foreground",
                k === day && !full && "ring-[1.5px] ring-[var(--amber-accent)]")}>{l}</span>
            )
          })}
        </span>}
      </button>
      {counted ? (
        <div className="flex items-center gap-2">
          <button type="button" aria-label={`One less ${h.name}`} disabled={value === 0} onClick={() => set(h, (was) => Math.max(0, was - 1))}
            className="grid size-11 place-items-center rounded-full bg-muted text-foreground disabled:opacity-30"><Minus className="size-5" /></button>
          <button type="button" aria-label={`One more ${h.name}`} onClick={() => { if (value + 1 === h.target) pop(); set(h, (was) => was + 1) }}
            onAnimationEnd={settle} className={cn("relative grid place-items-center rounded-full", compact ? "size-11" : "size-12", popping && "tick-pop")}>
            <Ring value={value / h.target} size={compact ? 44 : 48} stroke={5} />
            <span className="absolute inset-0 grid place-items-center">{isDone ? <Check className="size-5 text-link" strokeWidth={3} /> : <Plus className="size-5 text-link" strokeWidth={2.5} />}</span>
          </button>
        </div>
      ) : (
        <button type="button" aria-label={`Done: ${h.name}`} aria-pressed={isDone} onAnimationEnd={settle} onClick={() => { if (!isDone) pop(); set(h, isDone ? 0 : 1) }}
          className={cn("grid shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none", compact ? "size-11" : "size-12",
            isDone ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent",
            popping && "tick-pop")}>
          <Check className={cn("size-6 transition-transform duration-200 motion-reduce:transition-none", isDone ? "scale-100" : "scale-50")} strokeWidth={3} />
        </button>
      )}
    </Row>
  )
}
