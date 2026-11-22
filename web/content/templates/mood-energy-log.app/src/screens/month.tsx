import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Section } from "@/components/kit"
import { DaySheet } from "@/components/day-sheet"
import { EnergyPips, Legend, moodFill, MoodMark } from "@/components/marks"
import { addMonths, averages, between, dayMonth, hours, longDay, monthDays, monthName, monthOf, one, plural, today, useMood, weekday, type Entry } from "@/lib/mood"
import { cn } from "@/lib/utils"

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"]

// A month as a calendar: each day filled by its mood, its energy as pips under it. Tap a day to log
// it or change it. Beside it (under it on iPhone) the month in numbers and its highs and lows.
export default function Month() {
  const m = useMood()
  const now = today()
  const [first, setFirst] = useState(monthOf(now))
  const [editing, setEditing] = useState<string | null>(null)
  const days = monthDays(first)
  const current = first === monthOf(now)
  const inMonth = between(m.all, days[0], days[days.length - 1])
  const a = averages(inMonth)
  const rank = (x: Entry) => x.mood * 10 + x.energy
  const best = [...inMonth].sort((x, y) => rank(y) - rank(x) || (x.date < y.date ? 1 : -1)).slice(0, 3)
  const hardest = [...inMonth].sort((x, y) => rank(x) - rank(y) || (x.date < y.date ? 1 : -1)).filter((x) => !best.includes(x)).slice(0, 3)
  const short = new Date(first + "T12:00:00").toLocaleDateString("en-GB", { month: "long" })

  return (
    <>
      <header className="flex items-center gap-1 pb-4 pt-2">
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">Month</p>
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight">{monthName(first)}</h1>
        </div>
        <button type="button" aria-label="Previous month" onClick={() => setFirst(addMonths(first, -1))} className="grid size-11 place-items-center rounded-full text-link"><ChevronLeft className="size-6" /></button>
        <button type="button" aria-label="Next month" disabled={current} onClick={() => setFirst(addMonths(first, 1))} className="grid size-11 place-items-center rounded-full text-link disabled:opacity-30"><ChevronRight className="size-6" /></button>
      </header>
      <div className="grid grid-cols-1 gap-x-8 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <Section footer="Tap a day to log it or change it.">
            <div className="p-3 min-[700px]:p-4">
              <div className="grid grid-cols-7 gap-y-1" data-testid="calendar">
                {LETTERS.map((l, i) => <span key={"h" + i} className="pb-1 text-center text-[0.75rem] font-semibold text-muted-foreground">{l}</span>)}
                {Array.from({ length: weekday(first) }, (_, i) => <span key={"x" + i} />)}
                {days.map((date) => {
                  const d = m.day(date), future = date > now
                  return (
                    <button key={date} type="button" disabled={future} onClick={() => setEditing(date)} data-mood={d?.mood ?? 0} data-energy={d?.energy ?? 0}
                      aria-label={`${longDay(date)}${d ? `: mood ${d.mood}, energy ${d.energy}${m.logSleep && typeof d.sleep === "number" ? `, slept ${hours(d.sleep)}` : ""}` : future ? "" : ", not logged"}`}
                      className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg py-1 mouse:min-h-12 min-[1100px]:min-h-16">
                      <span className={cn("grid size-9 place-items-center rounded-lg text-[0.875rem] font-semibold tabular-nums min-[700px]:size-10",
                        d ? moodFill(d.mood) : future ? "text-muted-foreground/50" : "text-muted-foreground",
                        date === now && "ring-2 ring-[var(--amber-accent)] ring-offset-2 ring-offset-[var(--amber-surface)]")}>{Number(date.slice(8))}</span>
                      {d ? <EnergyPips value={d.energy} size="size-1" className="gap-[2px]" /> : <span className="h-1" />}
                    </button>
                  )
                })}
              </div>
              <Legend className="mt-4 border-t border-border pt-3" />
            </div>
          </Section>
        </div>
        <div>
          <Section title={short}>
            <dl className="grid grid-cols-2 gap-2 p-4">
              <Num label="Days logged" value={`${a.days}`} testId="month-days" />
              <Num label="Mood" value={one(a.mood)} testId="month-mood" />
              <Num label="Energy" value={one(a.energy)} testId="month-energy" />
              {m.logSleep && <Num label="Sleep" value={a.sleep === null ? "–" : hours(a.sleep)} testId="month-sleep" />}
            </dl>
          </Section>
          {inMonth.length >= 5 && (
            <>
              <DayList title="Best days" days={best} onOpen={setEditing} />
              <DayList title="Hardest days" days={hardest} onOpen={setEditing} />
            </>
          )}
          {inMonth.length > 0 && inMonth.length < 5 && <p className="px-1 pb-6 text-[0.875rem] text-muted-foreground">Log {plural(5 - inMonth.length, "more day")} this month to see its best and hardest days.</p>}
        </div>
      </div>
      <DaySheet date={editing} onClose={() => setEditing(null)} />
    </>
  )
}

function Num({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2.5">
      <dt className="text-[0.8125rem] text-muted-foreground">{label}</dt>
      <dd className="text-[1.375rem] font-bold leading-tight tabular-nums" data-testid={testId}>{value}</dd>
    </div>
  )
}

function DayList({ title, days, onOpen }: { title: string; days: Entry[]; onOpen: (d: string) => void }) {
  return (
    <Section title={title}>
      {days.map((d) => (
        <button key={d.date} type="button" onClick={() => onOpen(d.date)} className="flex min-h-14 w-full items-center gap-3 border-t border-border px-4 py-2 text-left first:border-t-0">
          <MoodMark value={d.mood} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[0.875rem] font-medium">{dayMonth(d.date)} <EnergyPips value={d.energy} /></span>
            <span className="block truncate text-[0.875rem] text-muted-foreground">{d.note || (d.tags ?? []).join(", ") || "No note"}</span>
          </span>
        </button>
      ))}
    </Section>
  )
}
