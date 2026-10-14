import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Ring, Section } from "@/components/kit"
import { MonthGrid } from "@/components/month-grid"
import { addDays, best, done, iso, month, scheduled, skipped, streak, today, useHabits } from "@/lib/habits"
import { cn } from "@/lib/utils"

// A month at a time: a calendar per habit (tap a day to tick it, again to skip it, again to clear
// it), how often each was done, and the month as a whole. Two or three calendars side by side on a
// wide note.
export default function History() {
  const { habits, days, skips, cycle } = useHabits()
  const now = today()
  const [first, setFirst] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1, 12))
  const current = first.getMonth() === now.getMonth() && first.getFullYear() === now.getFullYear()
  const shift = (by: number) => setFirst(new Date(first.getFullYear(), first.getMonth() + by, 1, 12))
  const stats = habits.map((h) => month(days, skips, h, first, now))
  const got = stats.reduce((t, s) => t + s.got, 0), of = stats.reduce((t, s) => t + s.of, 0)
  // A perfect day: every habit that was due that day was done (or skipped on purpose).
  let perfect = 0
  for (let d = first; d.getMonth() === first.getMonth() && iso(d) < iso(now); d = addDays(d, 1)) {
    const k = iso(d), due = habits.filter((h) => !h.perWeek && scheduled(h, d) && !skipped(skips, h, k))
    if (due.length && due.every((h) => done(days, h, k))) perfect++
  }

  return (
    <>
      <header className="flex items-center gap-1 pb-4 pt-2">
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">Month</p>
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight">{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h1>
        </div>
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="grid size-11 place-items-center rounded-full text-primary"><ChevronLeft className="size-6" /></button>
        <button type="button" aria-label="Next month" disabled={current} onClick={() => shift(1)} className="grid size-11 place-items-center rounded-full text-primary disabled:opacity-30"><ChevronRight className="size-6" /></button>
      </header>
      {habits.length === 0 && <p className="px-1 text-muted-foreground">Nothing to show yet. Add a habit in the Habits tab.</p>}
      {habits.length > 0 && (
        <Section>
          <div className="flex items-center gap-4 p-4">
            <Ring value={of ? got / of : 0} size={64} stroke={8} label={`${first.toLocaleDateString("en-GB", { month: "long" })} ${of ? Math.round((got / of) * 100) : 0}%`}>
              <span className="text-[0.9375rem] font-bold tabular-nums">{of ? Math.round((got / of) * 100) : 0}%</span>
            </Ring>
            <div className="min-w-0">
              <p className="font-semibold tabular-nums" data-testid="month-line">{got} of {of} done{current ? " so far" : ""}</p>
              <p className="text-[0.875rem] text-muted-foreground tabular-nums">{perfect} perfect {perfect === 1 ? "day" : "days"} · skipped days don't count against you</p>
            </div>
          </div>
        </Section>
      )}
      <div className="grid gap-x-5 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {habits.map((h, i) => {
          const s = stats[i]
          return (
            <Section key={h.id}>
              <div className="p-4" aria-label={`${h.name}: ${s.got} of ${s.of}`}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h2 className="text-[1.0625rem] font-semibold">{h.name}</h2>
                  <span className={cn("text-[0.9375rem] font-semibold tabular-nums", s.of ? "text-primary" : "text-muted-foreground")}>{s.of ? `${Math.round((s.got / s.of) * 100)}%` : "–"}</span>
                </div>
                <MonthGrid habit={h} days={days} skips={skips} first={first} onTap={(k) => cycle(h, k)} />
                <p className="mt-2 text-[0.875rem] text-muted-foreground tabular-nums">
                  {s.got} of {s.of} · now {streak(days, skips, h, now)} in a row · best {best(days, skips, h, now)}
                </p>
              </div>
            </Section>
          )
        })}
      </div>
      {habits.length > 0 && <p className="px-1 pb-6 text-[0.8125rem] text-muted-foreground">Tap a day to tick it, again to skip it (it keeps your streak), again to clear it.</p>}
    </>
  )
}
