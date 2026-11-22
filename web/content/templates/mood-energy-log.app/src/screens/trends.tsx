import { useState } from "react"
import { Pills, Section, Title } from "@/components/kit"
import { MoodEnergyChart, SleepChart } from "@/components/trend-chart"
import { averages, between, ENOUGH, hours, one, plural, plus, sleepPatterns, tagPatterns, today, useMood, type TagPattern } from "@/lib/mood"
import { cn } from "@/lib/utils"

const RANGES = ["30 days", "90 days"] as const
type Range = (typeof RANGES)[number]

// The last 30 or 90 days: mood and energy as lines, sleep as bars, and simple patterns from the
// person's own days, each with how many days it rests on. Averages only: no causes, no advice.
export default function Trends() {
  const m = useMood()
  const [range, setRange] = useState<Range>("30 days")
  const n = range === "30 days" ? 30 : 90
  const now = today(), from = plus(now, -(n - 1))
  const es = between(m.all, from, now)
  const a = averages(es)
  const tags = tagPatterns(es, m.tags)
  const bands = sleepPatterns(es)
  const sleepDays = bands.reduce((t, b) => t + b.days, 0)

  return (
    <>
      <Title subtitle="Trends" title={`Last ${range}`} />
      <div className="mb-5"><Pills label="Range" options={RANGES} value={range} onChange={setRange} /></div>
      <Section>
        <div className={cn("grid gap-2 p-4", m.logSleep ? "grid-cols-2 min-[700px]:grid-cols-4" : "grid-cols-3")}>
          <Big label="Days logged" value={`${a.days}`} sub={`of ${n}`} testId="range-days" />
          <Big label="Mood" value={one(a.mood)} sub="on average" testId="range-mood" />
          <Big label="Energy" value={one(a.energy)} sub="on average" testId="range-energy" />
          {m.logSleep && <Big label="Sleep" value={a.sleep === null ? "–" : hours(a.sleep)} sub="a night" testId="range-sleep" />}
        </div>
      </Section>
      <div className="grid grid-cols-1 gap-x-8 min-[1100px]:grid-cols-2">
        <Section title="Mood and energy" footer={es.length ? undefined : "Nothing logged in these days yet."}>
          <div className="px-3 pb-3 pt-4">
            <div className="mb-2 flex gap-4 px-1 text-[0.8125rem] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-[3px] w-4 rounded-full bg-mood-line" />Mood</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-[3px] w-4 rounded-full bg-energy" />Energy</span>
            </div>
            <MoodEnergyChart from={from} days={n} entries={es} label={`Mood and energy over the last ${range}: mood ${one(a.mood)} and energy ${one(a.energy)} on average, from ${plural(a.days, "day")}.`} />
          </div>
        </Section>
        {m.logSleep && (
          <Section title="Sleep" footer={`The dashed line is the ${hours(m.sleepGoal)} you aim for (Settings).`}>
            <div className="px-3 pb-3 pt-4">
              <SleepChart from={from} days={n} entries={es} goal={m.sleepGoal} label={`Hours slept over the last ${range}: ${a.sleep === null ? "none logged" : `${hours(a.sleep)} a night on average, from ${plural(a.sleepDays, "night")}`}.`} />
            </div>
          </Section>
        )}
      </div>

      <h2 className="px-1 pb-3 pt-2 text-[1.375rem] font-bold tracking-tight">Patterns</h2>
      <div className="grid grid-cols-1 gap-x-8 min-[1100px]:grid-cols-2">
        <Section title="Mood with and without each tag" footer={`Average mood on days with the tag against days without it, over the last ${range}. A tag needs ${ENOUGH} days on each side.`}>
          {tags.length === 0 && <p className="px-4 py-3 text-muted-foreground">No tags yet. Add them in Settings.</p>}
          {tags.map((t) => <TagRow key={t.tag} p={t} />)}
        </Section>
        {m.logSleep && (
          <Section title="Energy after a night of" footer={sleepDays ? `Average energy the day after, over ${plural(sleepDays, "night")} with hours logged.` : "Log hours slept to see this."}>
            {bands.map((b) => (
              <div key={b.band} className="border-t border-border px-4 py-3 first:border-t-0" data-testid="sleep-band">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{b.band}</span>
                  <span className="text-[0.875rem] tabular-nums text-muted-foreground">
                    {b.days ? <><span className="text-[1.0625rem] font-semibold text-foreground">{one(b.energy)}</span> energy · {plural(b.days, "day")}</> : "No days"}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Energy after ${b.band.toLowerCase()}`} aria-valuemin={0} aria-valuemax={5} aria-valuenow={Math.round((b.energy ?? 0) * 10) / 10}>
                  <div className="h-full rounded-full bg-energy transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: `${((b.energy ?? 0) / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </Section>
        )}
      </div>
      <p className="px-1 pb-8 text-[0.8125rem] text-muted-foreground text-balance" data-testid="not-advice">
        These are averages from your own log, with the days they rest on. They show what tends to go together, not what causes what, and they aren&apos;t medical advice.
      </p>
    </>
  )
}

function TagRow({ p }: { p: TagPattern }) {
  const diff = p.enough && p.with.mood !== null && p.without.mood !== null ? Math.round((p.with.mood - p.without.mood) * 10) / 10 : null
  return (
    <div className="border-t border-border px-4 py-3 first:border-t-0" data-testid="tag-pattern" role="group" aria-label={p.tag}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-medium">{p.tag}</span>
        {diff !== null && <span className={cn("text-[0.875rem] font-semibold tabular-nums", diff > 0 ? "text-link" : "text-muted-foreground")}>{diff === 0 ? "no difference" : `${diff > 0 ? "+" : "−"}${Math.abs(diff)}`}</span>}
      </div>
      {p.enough
        ? (
          <p className="mt-0.5 text-[0.875rem] tabular-nums text-muted-foreground">
            Mood <span className="font-semibold text-foreground">{one(p.with.mood)}</span> on {plural(p.with.days, "day")} with it, <span className="font-semibold text-foreground">{one(p.without.mood)}</span> on {plural(p.without.days, "day")} without. Energy {one(p.with.energy)} against {one(p.without.energy)}.
          </p>
        )
        : <p className="mt-0.5 text-[0.875rem] text-muted-foreground">Not enough days yet: {plural(p.with.days, "day")} with it, {p.without.days} without.</p>}
    </div>
  )
}

function Big({ label, value, sub, testId }: { label: string; value: string; sub: string; testId: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2.5">
      <p className="text-[0.8125rem] text-muted-foreground">{label}</p>
      <p className="text-[1.5rem] font-bold leading-tight tabular-nums" data-testid={testId}>{value}</p>
      <p className="text-[0.75rem] text-muted-foreground">{sub}</p>
    </div>
  )
}
