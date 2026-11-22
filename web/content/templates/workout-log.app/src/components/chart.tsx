import { lowerIsBetter, metricText, METRIC_NAMES, shortDate, type Metric, type Units } from "@/lib/workouts"
import { cn } from "@/lib/utils"

export type Point = { date: string; value: number; best: boolean }

// A session per point, oldest on the left: the line in the accent, a filled dot where a session set
// a new best. Up is always better, so for pace (fewer minutes per km is faster) the scale is turned
// over. The line is drawn in an SVG that stretches; the dots and the labels are HTML, so they stay
// round and readable at any width.
export function Chart({ points, metric, units, className }: { points: Point[]; metric: Metric; units: Units; className?: string }) {
  const vs = points.map((p) => p.value)
  const lo = Math.min(...vs), hi = Math.max(...vs), pad = hi === lo ? Math.max(1, hi * 0.05) : (hi - lo) * 0.12
  const min = lo - pad, max = hi + pad
  const flip = lowerIsBetter(metric)
  const x = (i: number) => (points.length === 1 ? 50 : 4 + (i / (points.length - 1)) * 92)
  const y = (v: number) => { const t = (v - min) / (max - min); return 100 - (flip ? 1 - t : t) * 100 }
  const label = `${METRIC_NAMES[metric]} per session: ${points.map((p) => `${shortDate(p.date)} ${metricText(metric, p.value, units)}`).join(", ")}`
  const top = flip ? lo : hi, bottom = flip ? hi : lo
  return (
    <div className={className}>
      <div className="relative h-40" role="img" aria-label={label}>
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
        <div className="absolute inset-x-0 bottom-0 border-t border-dashed border-border" />
        <svg className="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {points.length > 1 && (
            <polyline fill="none" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"
              className="stroke-[var(--amber-accent)]" points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")} />
          )}
        </svg>
        {points.map((p, i) => (
          <span key={i} className={cn("absolute -translate-x-1/2 -translate-y-1/2 rounded-full",
            p.best ? "size-3 bg-[var(--amber-accent)] ring-[3px] ring-card" : "size-2.5 border-2 border-[var(--amber-accent)] bg-card")}
            style={{ left: `${x(i)}%`, top: `${y(p.value)}%` }} />
        ))}
        <span className="absolute -top-2.5 right-0 bg-card pl-1 text-[0.75rem] font-medium tabular-nums text-muted-foreground">{metricText(metric, top, units)}</span>
        {hi !== lo && <span className="absolute -bottom-2.5 right-0 bg-card pl-1 text-[0.75rem] font-medium tabular-nums text-muted-foreground">{metricText(metric, bottom, units)}</span>}
      </div>
      <div className="mt-3 flex justify-between text-[0.75rem] text-muted-foreground">
        <span>{shortDate(points[0].date)}</span>
        {points.length > 1 && <span>{shortDate(points[points.length - 1].date)}</span>}
      </div>
    </div>
  )
}
