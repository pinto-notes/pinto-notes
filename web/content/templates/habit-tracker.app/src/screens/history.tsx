import { Section, Title } from "@/components/kit"
import { addDays, iso, streak, today, weekStart, useHabits } from "@/lib/habits"
import { cn } from "@/lib/utils"

const WEEKS = 5
const LETTERS = ["M", "T", "W", "T", "F", "S", "S"]

// The last five weeks of each habit, a square a day, with how often it was done.
export default function History() {
  const { habits, days, set } = useHabits()
  const now = today(), day = iso(now)
  const first = addDays(weekStart(now), -7 * (WEEKS - 1))
  const cells = Array.from({ length: WEEKS * 7 }, (_, i) => iso(addDays(first, i)))
  const past = cells.filter((d) => d <= day)

  return (
    <>
      <Title subtitle="Last five weeks" title="History" />
      <p className="-mt-3 mb-4 px-1 text-[0.875rem] text-muted-foreground">Tap a day to tick it or untick it.</p>
      {habits.length === 0 && <p className="px-1 text-muted-foreground">Nothing to show yet. Add a habit in the Habits tab.</p>}
      <div className="grid gap-x-6 min-[700px]:grid-cols-2">
        {habits.map((h) => {
          const got = past.filter((d) => (days[d]?.[h.id] ?? 0) >= h.target).length
          const best = longest(past.map((d) => (days[d]?.[h.id] ?? 0) >= h.target))
          return (
            <Section key={h.id}>
              <div className="p-4" aria-label={`${h.name}: ${got} of ${past.length} days`}>
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h2 className="text-[1.0625rem] font-semibold">{h.name}</h2>
                  <span className="text-[0.9375rem] font-semibold tabular-nums text-primary">{Math.round((got / Math.max(1, past.length)) * 100)}%</span>
                </div>
                <div className="grid max-w-[360px] grid-cols-7">
                  {LETTERS.map((l, i) => <span key={"h" + i} className="text-center text-[0.75rem] font-semibold text-muted-foreground">{l}</span>)}
                  {cells.map((d) => {
                    const v = days[d]?.[h.id] ?? 0, full = v >= h.target
                    const label = new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
                    return (
                      <button key={d} type="button" disabled={d > day} aria-pressed={full} aria-label={`${h.name}, ${label}`} onClick={() => set(h, full ? 0 : h.target, d)}
                        className="grid aspect-square min-h-11 place-items-center">
                        <span className={cn("grid size-[34px] place-items-center rounded-full text-[0.8125rem] font-medium tabular-nums",
                          d > day ? "text-muted-foreground/50" : full ? "bg-primary font-semibold text-primary-foreground" : v > 0 ? "bg-[var(--amber-accent-soft)] text-primary" : "bg-muted text-muted-foreground",
                          d === day && !full && "ring-[1.5px] ring-[var(--amber-accent)]")}>{Number(d.slice(8))}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="mt-3 text-[0.875rem] text-muted-foreground tabular-nums">
                  {got} of {past.length} days · now {streak(days, h, now)} in a row · best {best}
                </p>
              </div>
            </Section>
          )
        })}
      </div>
    </>
  )
}

const longest = (xs: boolean[]) => { let best = 0, run = 0; for (const x of xs) { run = x ? run + 1 : 0; best = Math.max(best, run) } return best }
