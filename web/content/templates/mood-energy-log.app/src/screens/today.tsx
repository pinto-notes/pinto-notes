import { useState } from "react"
import { route } from "amber-router"
import { ChevronRight, Pencil, Plus } from "lucide-react"
import { Section, Title, TintButton } from "@/components/kit"
import { DayForm } from "@/components/day-form"
import { DaySheet } from "@/components/day-sheet"
import { EnergyPips, moodFill, MoodMark } from "@/components/marks"
import { MoodEnergyChart } from "@/components/trend-chart"
import { averages, between, dayName, energyWord, hours, longDay, moodWord, one, plus, shortDay, today, useMood, type Day } from "@/lib/mood"
import { cn } from "@/lib/utils"

// Today: log the day in a few taps, or see what was logged and change it. Beside it (under it on
// iPhone) the last seven days, with their averages; a day not logged is one tap from its sheet.
export default function Today() {
  const m = useMood()
  const [editing, setEditing] = useState<string | null>(null)
  const now = today()
  const saved = m.day(now)
  const week = Array.from({ length: 7 }, (_, i) => plus(now, -i - 1))
  const last7 = averages(between(m.all, plus(now, -6), now))
  const before = averages(between(m.all, plus(now, -13), plus(now, -7)))
  const month = between(m.all, plus(now, -29), now)
  const last30 = averages(month)

  return (
    <>
      <Title subtitle={longDay(now)} title="Today" />
      <WeekStrip />
      <div className="grid grid-cols-1 gap-x-8 min-[1100px]:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          {saved
            ? (
              <Section title="Today" action={<TintButton className="-my-2 h-9" onClick={() => setEditing(now)}><Pencil /> Edit</TintButton>}>
                <DayCard day={saved} sleep={m.logSleep} />
              </Section>
            )
            : (
              <Section title="How was today?" footer={<>Or tell your AI: &ldquo;slept 6 hours, mood 3, energy 2, long day at work&rdquo;.</>}>
                <div className="p-4"><DayForm date={now} initial={null} submit="Log today" onSave={(d) => m.saveDay(now, d)} /></div>
              </Section>
            )}
          <Section title="Last 30 days" action={<TintButton className="-my-2 h-9" onClick={() => route("/trends")}>Trends <ChevronRight /></TintButton>}>
            <div className="px-3 pb-3 pt-4">
              <MoodEnergyChart from={plus(now, -29)} days={30} entries={month} height={140} label={`Mood and energy over the last 30 days: mood ${one(last30.mood)} and energy ${one(last30.energy)} on average, from ${last30.days} days.`} />
              <div className="mt-2 flex gap-4 px-1 text-[0.8125rem] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-[3px] w-4 rounded-full bg-mood-line" />Mood</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-[3px] w-4 rounded-full bg-energy" />Energy</span>
              </div>
            </div>
          </Section>
        </div>
        <div>
          <Section title="Last 7 days" footer={last7.days ? `${last7.days} of 7 days logged${before.days ? `. The week before: mood ${one(before.mood)}, energy ${one(before.energy)}.` : "."}` : "Nothing logged this week yet."}>
            <div className={cn("grid gap-2 p-4", m.logSleep ? "grid-cols-3" : "grid-cols-2")}>
              <Stat label="Mood" value={one(last7.mood)} testId="week-mood" />
              <Stat label="Energy" value={one(last7.energy)} testId="week-energy" />
              {m.logSleep && <Stat label="Sleep" value={last7.sleep === null ? "–" : hours(last7.sleep)} testId="week-sleep" />}
            </div>
          </Section>
          <Section title="Earlier this week">
            {week.map((date) => {
              const d = m.day(date)
              const label = date === plus(now, -1) ? "Yesterday" : dayName(date)
              return (
                <button key={date} type="button" onClick={() => setEditing(date)} aria-label={d ? `${label}: mood ${d.mood}, energy ${d.energy}` : `Log ${label}`}
                  className="flex min-h-14 w-full items-center gap-3 border-t border-border py-2 pl-4 pr-3 text-left first:border-t-0">
                  <span className="w-10 shrink-0 text-center leading-none">
                    <span className="block text-[0.75rem] font-medium text-muted-foreground">{shortDay(date)}</span>
                    <span className="mt-0.5 block text-[1.0625rem] font-semibold tabular-nums">{Number(date.slice(8))}</span>
                  </span>
                  {d
                    ? (
                      <>
                        <MoodMark value={d.mood} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-[0.875rem]"><EnergyPips value={d.energy} />{m.logSleep && typeof d.sleep === "number" && <span className="tabular-nums text-muted-foreground">{hours(d.sleep)}</span>}</span>
                          <span className="block truncate text-[0.875rem] text-muted-foreground">{d.note || (d.tags ?? []).join(", ") || moodWord(d.mood)}</span>
                        </span>
                        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                      </>
                    )
                    : (
                      <>
                        <span className="flex-1 text-muted-foreground">Not logged</span>
                        <Plus className="size-4 shrink-0 text-muted-foreground" />
                      </>
                    )}
                </button>
              )
            })}
          </Section>
        </div>
      </div>
      <DaySheet date={editing} onClose={() => setEditing(null)} />
    </>
  )
}

/** The last seven days at a glance, under the title on a phone or a narrow note (a wide one has the
 *  week's list beside the check-in): each day filled by its mood, its energy as pips, today ringed. */
function WeekStrip() {
  const m = useMood()
  const now = today()
  const week = Array.from({ length: 7 }, (_, i) => plus(now, i - 6))
  const said = week.map((date) => { const d = m.day(date); return `${dayName(date)} ${d ? `mood ${d.mood}, energy ${d.energy}` : "not logged"}` }).join("; ")
  return (
    <div role="img" aria-label={`The last 7 days: ${said}.`} data-testid="week-strip" className="mb-6 grid grid-cols-7 gap-1.5 min-[1100px]:hidden">
      {week.map((date) => {
        const d = m.day(date)
        return (
          <div key={date} className="flex flex-col items-center gap-1">
            <span className="text-[0.75rem] font-medium text-muted-foreground">{shortDay(date).slice(0, 1)}</span>
            <span className={cn("grid aspect-square w-full max-w-12 place-items-center rounded-xl text-[0.9375rem] font-semibold tabular-nums",
              d ? moodFill(d.mood) : "border-[1.5px] border-dashed border-input text-muted-foreground",
              date === now && d && "ring-2 ring-[var(--amber-accent)] ring-offset-2 ring-offset-[var(--amber-bg)]")}>{Number(date.slice(8))}</span>
            {d ? <EnergyPips value={d.energy} size="size-1" className="gap-[2px]" /> : <span className="h-1" />}
          </div>
        )
      })}
    </div>
  )
}

function Stat({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2.5">
      <p className="text-[0.8125rem] text-muted-foreground">{label}</p>
      <p className="text-[1.375rem] font-bold leading-tight tabular-nums" data-testid={testId}>{value}</p>
    </div>
  )
}

/** A logged day: mood and energy with their words, hours slept, tags and the line about it. */
export function DayCard({ day, sleep }: { day: Day; sleep: boolean }) {
  return (
    <div className="p-4" data-testid="today-card">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <span className="flex items-center gap-3">
          <MoodMark value={day.mood} className="size-12 rounded-xl text-[1.375rem]" />
          <span><span className="block text-[0.8125rem] text-muted-foreground">Mood</span><span className="font-semibold">{moodWord(day.mood) || "–"}</span></span>
        </span>
        <span className="flex items-center gap-3">
          <span aria-hidden className="grid size-12 place-items-center rounded-xl bg-energy text-[1.375rem] font-semibold tabular-nums text-on-energy">{day.energy || "–"}</span>
          <span><span className="block text-[0.8125rem] text-muted-foreground">Energy</span><span className="font-semibold">{energyWord(day.energy) || "–"}</span></span>
        </span>
        {sleep && typeof day.sleep === "number" && (
          <span><span className="block text-[0.8125rem] text-muted-foreground">Slept</span><span className="text-[1.375rem] font-bold tabular-nums">{hours(day.sleep)}</span></span>
        )}
      </div>
      {(day.tags?.length ?? 0) > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">{day.tags!.map((t) => <span key={t} className="rounded-full bg-muted px-3 py-1 text-[0.875rem] font-medium">{t}</span>)}</div>
      )}
      {day.note && <p className="mt-3 text-[1.0625rem]">{day.note}</p>}
    </div>
  )
}
