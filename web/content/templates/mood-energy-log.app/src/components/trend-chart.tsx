import { useLayoutEffect, useRef, useState } from "react"
import { dayMonth, plus, type Entry } from "@/lib/mood"

/** The width of an element, kept current as the note is resized. */
function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(600)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const f = () => setW(Math.max(200, Math.round(el.clientWidth)))
    f()
    if (typeof ResizeObserver !== "function") return
    const o = new ResizeObserver(f)
    o.observe(el)
    return () => o.disconnect()
  }, [])
  return [ref, w]
}

const LEFT = 22, RIGHT = 6, TOP = 8

/** Mood and energy, a line each over the days, on the 1 to 5 scale. A day not logged leaves a gap
 *  (two days apart are joined; longer gaps aren't). A dot for every logged day. */
export function MoodEnergyChart({ from, days, entries, label, height = 190 }: { from: string; days: number; entries: Entry[]; label: string; height?: number }) {
  const [ref, width] = useWidth()
  const bottom = 22
  const x = (date: string) => LEFT + ((width - LEFT - RIGHT) * index(from, date)) / Math.max(1, days - 1)
  const y = (v: number) => TOP + ((height - TOP - bottom) * (5 - v)) / 4
  const dot = days > 45 ? 2 : 3
  const series = (k: "mood" | "energy") => entries.filter((e) => e[k] > 0)
  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={label} className="block">
        {[1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={LEFT} x2={width - RIGHT} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
            <text x={LEFT - 8} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[0.75rem] tabular-nums">{v}</text>
          </g>
        ))}
        <Axis from={from} days={days} x={x} y={height - 6} width={width} />
        {(["energy", "mood"] as const).map((k) => {
          const es = series(k)
          const colour = k === "mood" ? "var(--mood-line)" : "var(--energy)"
          return (
            <g key={k} data-series={k}>
              {segments(es).map((seg, i) => seg.length > 1 && (
                <polyline key={i} fill="none" stroke={colour} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"
                  points={seg.map((e) => `${x(e.date)},${y(e[k])}`).join(" ")} />
              ))}
              {es.map((e) => <circle key={e.date} data-testid={`${k}-dot`} cx={x(e.date)} cy={y(e[k])} r={dot} fill={colour} />)}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Hours slept, a bar a night, with the hours the person aims for as a dashed line. */
export function SleepChart({ from, days, entries, goal, label }: { from: string; days: number; entries: Entry[]; goal: number; label: string }) {
  const [ref, width] = useWidth()
  const height = 140, bottom = 22
  const top = Math.max(10, Math.ceil(Math.max(goal, ...entries.map((e) => e.sleep ?? 0)) / 2) * 2)
  const step = (width - LEFT - RIGHT) / days
  const bar = Math.max(1.5, Math.min(14, step * 0.62))
  const y = (h: number) => TOP + ((height - TOP - bottom) * (top - h)) / top
  return (
    <div ref={ref} className="w-full">
      <svg width={width} height={height} role="img" aria-label={label} className="block">
        {[0, top / 2, top].map((h) => (
          <g key={h}>
            <line x1={LEFT} x2={width - RIGHT} y1={y(h)} y2={y(h)} className="stroke-border" strokeWidth={1} />
            <text x={LEFT - 8} y={y(h) + 4} textAnchor="end" className="fill-muted-foreground text-[0.75rem] tabular-nums">{h}</text>
          </g>
        ))}
        {entries.filter((e) => typeof e.sleep === "number").map((e) => (
          <rect key={e.date} data-testid="sleep-bar" x={LEFT + step * index(from, e.date) + (step - bar) / 2} y={y(e.sleep!)} width={bar} height={Math.max(0, y(0) - y(e.sleep!))} rx={Math.min(3, bar / 2)} className="fill-sleep" />
        ))}
        <line x1={LEFT} x2={width - RIGHT} y1={y(goal)} y2={y(goal)} stroke="var(--mood-line)" strokeWidth={1.5} strokeDasharray="4 4" data-testid="sleep-goal" />
        <Axis from={from} days={days} x={(d) => LEFT + step * (index(from, d) + 0.5)} y={height - 6} width={width} />
      </svg>
    </div>
  )
}

function Axis({ from, days, x, y, width }: { from: string; days: number; x: (d: string) => number; y: number; width: number }) {
  const last = plus(from, days - 1)
  const ticks = width < 420 ? [from, last] : [from, plus(from, Math.floor((days - 1) / 2)), last]
  return (
    <>
      {ticks.map((d, i) => (
        <text key={d} x={x(d)} y={y} textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"} className="fill-muted-foreground text-[0.75rem]">{i === ticks.length - 1 ? "Today" : dayMonth(d)}</text>
      ))}
    </>
  )
}

const index = (from: string, date: string) => Math.round((Date.parse(date + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / 86_400_000)

/** Runs of entries no more than two days apart, so a line doesn't bridge a long gap. */
function segments(es: Entry[]): Entry[][] {
  const out: Entry[][] = []
  for (const e of es) {
    const run = out[out.length - 1]
    if (run && index(run[run.length - 1].date, e.date) <= 2) run.push(e)
    else out.push([e])
  }
  return out
}
