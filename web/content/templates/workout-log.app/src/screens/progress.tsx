import { useState } from "react"
import { ChevronRight, Trophy } from "lucide-react"
import { Pills, Row, Section, Title } from "@/components/kit"
import { Chart, type Point } from "@/components/chart"
import { bestText, chartMetrics, history, lowerIsBetter, metricText, METRIC_NAMES, records, shortDate, value, useWorkouts, type Metric } from "@/lib/workouts"
import { cn } from "@/lib/utils"

// Progress: one exercise over time (a point per session: the estimated one-rep max or the heaviest
// set; for cardio the distance or the pace) and every exercise's personal best with its date.
export default function Progress() {
  const w = useWorkouts()
  const { sessions, units: u } = w
  const done = w.all.filter((e) => history(sessions, e.id).length)
  const [picked, setPicked] = useState<string | null>(null)
  const [metricPick, setMetric] = useState<Metric | null>(null)
  // The exercise shown: the one chosen, else the one with the most sessions.
  const ex = done.find((e) => e.id === picked) ?? done.slice().sort((a, b) => history(sessions, b.id).length - history(sessions, a.id).length)[0]

  if (!ex) return (
    <>
      <Title title="Progress" />
      <Section className="max-w-xl"><p className="px-6 py-10 text-center text-muted-foreground">Log a session and your bests and progress show here.</p></Section>
    </>
  )

  const options = chartMetrics(ex, sessions)
  const metric = metricPick && options.includes(metricPick) ? metricPick : options[0]
  const names = options.map((m) => METRIC_NAMES[m])
  // A point per session; a filled dot where it beat every session before it.
  let top: number | undefined
  const points: Point[] = []
  for (const h of history(sessions, ex.id)) {
    const v = value(h.item, metric)
    if (v === undefined) continue
    const best = top !== undefined && (lowerIsBetter(metric) ? v < top - 1e-9 : v > top + 1e-9)
    if (top === undefined || best) top = v
    points.push({ date: h.session.date, value: v, best })
  }
  const shown = points.slice(-24)
  const first = shown[0], last = shown[shown.length - 1]
  const change = first && last && shown.length > 1 ? (lowerIsBetter(metric) ? first.value - last.value : last.value - first.value) : 0

  return (
    <>
      <Title title="Progress" />
      <div className="min-[1100px]:grid min-[1100px]:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] min-[1100px]:items-start min-[1100px]:gap-6">
        <Section>
          <div className="p-4">
            <label htmlFor="p-exercise" className="sr-only">Exercise</label>
            <select id="p-exercise" value={ex.id} onChange={(e) => { setPicked(e.currentTarget.value); setMetric(null) }}
              className="-ml-1 mb-1 max-w-full rounded-lg bg-transparent text-[1.375rem] font-bold focus:outline-2 focus:outline-ring">
              {done.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <p className="mb-4 text-[0.9375rem] text-muted-foreground" data-testid="progress-line">
              {top !== undefined ? <>Best {metricText(metric, top, u)}</> : null}
              {shown.length > 1 && change !== 0 ? <> · {metric === "pace"
                ? `${metricText("pace", Math.abs(change), u)} ${change > 0 ? "faster" : "slower"}`
                : `${change > 0 ? "up" : "down"} ${metricText(metric, Math.abs(change), u)}`} since {shortDate(first.date)}</> : null}
            </p>
            {options.length > 1 && <div className="mb-5"><Pills label="Measure" options={names} value={METRIC_NAMES[metric]} onChange={(n) => setMetric(options[names.indexOf(n)])} /></div>}
            {shown.length ? <Chart points={shown} metric={metric} units={u} /> : <p className="py-6 text-center text-muted-foreground">No {METRIC_NAMES[metric].toLowerCase()} logged for {ex.name} yet.</p>}
            {metric === "e1rm" && <p className="mt-4 text-[0.8125rem] text-muted-foreground">Est. 1RM is what you could lift once, from your best set: weight × (1 + reps ÷ 30).</p>}
          </div>
        </Section>

        <Section title="Personal bests" footer="Updated as you log. A filled dot on the chart is a session that set a new best.">
          {done.map((e) => {
            const r = records(e, sessions), b = r.best
            return (
              <Row key={e.id} className="p-0">
                <button type="button" aria-pressed={e.id === ex.id} onClick={() => { setPicked(e.id); setMetric(null) }}
                  className={cn("flex min-h-11 w-full min-w-0 items-center gap-3 px-4 py-2.5 text-left", e.id === ex.id && "bg-[var(--amber-accent-soft)]")}
                  aria-label={`${e.name}: ${b.map((x) => bestText(x, e, u)).join(", ")}`}>
                  <Trophy className={cn("size-4 shrink-0", e.id === ex.id ? "text-link" : "text-muted-foreground")} />
                  <span className="min-w-0 flex-1 truncate font-medium">{e.name}</span>
                  <span className="shrink-0 text-right leading-tight">
                    {b.map((x) => (
                      <span key={x.metric} className="block tabular-nums" data-testid={`best-${e.id}-${x.metric}`}>
                        {bestText(x, e, u)} <span className="text-[0.8125rem] text-muted-foreground">{shortDate(x.session.date)}</span>
                      </span>
                    ))}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </Row>
            )
          })}
        </Section>
      </div>
    </>
  )
}
