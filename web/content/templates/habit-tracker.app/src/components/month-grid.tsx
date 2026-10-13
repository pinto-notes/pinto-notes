import { addDays, amount, iso, LETTERS, scheduled, skipped, today, weekday, type Days, type Habit, type Skips } from "@/lib/habits"
import { cn } from "@/lib/utils"

const long = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })

// A habit's month as a calendar, a day a circle (44 pt targets). Filled: done; a soft fill: part of
// a count; a dashed ring: skipped on purpose; faint: a day the habit isn't for. Tap a day to tick
// it, again to skip it, again to clear it. Days to come can't be tapped.
export function MonthGrid({ habit: h, days, skips, first, onTap, className }: { habit: Habit; days: Days; skips: Skips; first: Date; onTap: (day: string) => unknown; className?: string }) {
  const now = iso(today())
  const lead = weekday(first)
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null)
  for (let d = first; d.getMonth() === first.getMonth(); d = addDays(d, 1)) cells.push(d)
  return (
    <div className={cn("grid grid-cols-7", className)}>
      {LETTERS.map((l, i) => <span key={"h" + i} className="pb-1 text-center text-[0.75rem] font-semibold text-muted-foreground">{l}</span>)}
      {cells.map((d, i) => {
        if (!d) return <span key={"x" + i} />
        const k = iso(d), v = amount(days, h, k), full = v >= h.target, skip = skipped(skips, h, k)
        const off = !!h.perWeek || !scheduled(h, d), future = k > now
        return (
          <button key={k} type="button" disabled={future} aria-pressed={full} data-state={full ? "done" : skip ? "skipped" : "none"}
            aria-label={`${h.name}, ${long(d)}${skip ? ", skipped" : ""}`} onClick={() => onTap(k)}
            className="grid min-h-11 place-items-center">
            <span className={cn("grid size-[34px] place-items-center rounded-full text-[0.8125rem] font-medium tabular-nums transition-colors duration-150 motion-reduce:transition-none",
              future ? "text-muted-foreground/50"
                : full ? "bg-primary font-semibold text-primary-foreground"
                : skip ? "border-[1.5px] border-dashed border-muted-foreground/60 text-muted-foreground"
                : v > 0 ? "bg-[var(--amber-accent-soft)] text-primary"
                : off ? "text-muted-foreground/60"
                : "bg-muted text-muted-foreground",
              k === now && !full && "ring-[1.5px] ring-[var(--amber-accent)]")}>{d.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}
