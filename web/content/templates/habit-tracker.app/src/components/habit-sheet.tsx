import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Sheet, TintButton } from "@/components/kit"
import { HabitEditor } from "@/components/habit-editor"
import { MonthGrid } from "@/components/month-grid"
import { amount, best, iso, month, schedule, skipped, streak, today, useHabits, type Habit } from "@/lib/habits"

// A habit's own page: its streak, its best, this month as a calendar (tap a day to tick, skip or
// clear it), Skip today, and Edit.
export function HabitSheet({ habit: h, onClose }: { habit: Habit | null; onClose: () => void }) {
  const { days, skips, skip, cycle } = useHabits()
  const [editing, setEditing] = useState<Habit | null>(null)
  const now = today(), day = iso(now)
  const [first, setFirst] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1, 12))
  if (!h) return null
  const s = streak(days, skips, h, now), b = best(days, skips, h, now), m = month(days, skips, h, first, now)
  const isSkipped = skipped(skips, h, day), isDone = amount(days, h, day) >= h.target
  const unit = h.perWeek ? "week" : "day"
  const thisMonth = first.getMonth() === now.getMonth() && first.getFullYear() === now.getFullYear()
  const shift = (by: number) => setFirst(new Date(first.getFullYear(), first.getMonth() + by, 1, 12))
  return (
    <>
      <Sheet open={!editing} title={h.name} onClose={onClose}>
        <p className="-mt-1 mb-4 text-[0.9375rem] text-muted-foreground">{schedule(h)}{h.detail ? ` · ${h.detail}` : ""}</p>
        <div className="mb-5 grid grid-cols-3 gap-2 text-center">
          {[[`${s}`, s === 1 ? `${unit} streak` : `${unit}s in a row`], [`${b}`, "best run"], [m.of ? `${Math.round((m.got / m.of) * 100)}%` : "–", "this month"]].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-card px-2 py-3">
              <p className="text-[1.5rem] font-bold leading-tight tabular-nums">{v}</p>
              <p className="text-[0.8125rem] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        <div className="mb-1 flex items-center">
          <p className="flex-1 font-semibold">{first.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
          <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className="grid size-11 place-items-center rounded-full text-primary"><ChevronLeft className="size-5" /></button>
          <button type="button" aria-label="Next month" disabled={thisMonth} onClick={() => shift(1)} className="grid size-11 place-items-center rounded-full text-primary disabled:opacity-30"><ChevronRight className="size-5" /></button>
        </div>
        <MonthGrid habit={h} days={days} skips={skips} first={first} onTap={(k) => cycle(h, k)} />
        <p className="mt-2 text-[0.8125rem] text-muted-foreground">Tap a day to tick it, again to skip it, again to clear it. A skipped day keeps your streak.</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {!isDone && !h.perWeek && <TintButton onClick={() => skip(h, day, !isSkipped)}>{isSkipped ? "Don't skip today" : "Skip today"}</TintButton>}
          <TintButton className={isDone || h.perWeek ? "col-span-2" : ""} onClick={() => setEditing(h)}>Edit habit</TintButton>
        </div>
      </Sheet>
      <HabitEditor editing={editing} onClose={() => { setEditing(null); onClose() }} />
    </>
  )
}
