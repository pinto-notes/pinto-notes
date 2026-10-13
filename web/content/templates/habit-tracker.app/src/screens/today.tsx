import { format } from "date-fns"
import { Check, Flame, ListChecks } from "lucide-react"
import { useCollection } from "@/lib/amber"
import { PageHeader } from "@/components/app-shell"
import { StatCard } from "@/components/stat-card"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { dayKey, doneOn, lastDays, streak, type Day, type Habit } from "@/lib/habits"

export default function Today() {
  const habits = useCollection("habits")
  const days = useCollection("days")
  const list = habits.items as Habit[]
  const log = days.items as Day[]
  const now = new Date()
  const today = dayKey(now)
  const record = log.find((d) => d.date === today)
  const doneToday = list.filter((h) => record?.done.includes(h.id)).length
  const best = Math.max(0, ...list.map((h) => streak(log, h.id, now)))
  const week = lastDays(now, 7)

  const toggle = async (h: Habit) => {
    if (!record) { await days.add({ date: today, done: [h.id] }); return }
    const done = record.done.includes(h.id) ? record.done.filter((x) => x !== h.id) : [...record.done, h.id]
    await days.update(record.id, { done })
  }

  return (
    <>
      <PageHeader title="Today" subtitle={format(now, "EEEE d MMMM")} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={ListChecks} value={`${doneToday} of ${list.length}`} label="Done today" />
        <StatCard icon={Flame} value={best === 1 ? "1 day" : `${best} days`} label="Longest streak now" />
      </div>
      <Card className="mt-4 gap-0 py-0">
        {list.length ? list.map((h) => {
          const done = !!record?.done.includes(h.id)
          const run = streak(log, h.id, now)
          return (
            <button
              key={h.id}
              type="button"
              role="checkbox"
              aria-checked={done}
              aria-label={h.name}
              onClick={() => toggle(h)}
              className="flex min-h-14 w-full items-center gap-3 border-t px-4 py-2.5 text-left first:border-0 hover:bg-accent/60"
            >
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors", done ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
                {done && <Check className="size-4" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block font-medium", done && "text-muted-foreground line-through")}>{h.name}</span>
                {h.detail && <span className="block truncate text-sm text-muted-foreground">{h.detail}</span>}
              </span>
              {run > 0 && <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{run} {run === 1 ? "day" : "days"}</span>}
            </button>
          )
        }) : <p className="px-4 py-6 text-center text-muted-foreground">No habits yet. Add them under Habits.</p>}
      </Card>

      {list.length > 0 && (
        <section className="mt-8" aria-labelledby="week">
          <h2 id="week" className="pb-3 text-lg font-semibold tracking-tight">This week</h2>
          <Card className="gap-0 overflow-x-auto px-4 py-3">
            <table className="w-full border-separate border-spacing-y-1.5 text-sm">
              <thead>
                <tr>
                  <th className="text-left font-normal text-muted-foreground"><span className="sr-only">Habit</span></th>
                  {week.map((d) => <th key={dayKey(d)} scope="col" className="w-10 text-center font-normal text-muted-foreground">{format(d, "EEEEE")}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.map((h) => (
                  <tr key={h.id}>
                    <th scope="row" className="truncate pr-3 text-left font-medium">{h.name}</th>
                    {week.map((d) => {
                      const on = doneOn(log, dayKey(d), h.id)
                      return (
                        <td key={dayKey(d)} className="text-center">
                          <span aria-label={`${format(d, "EEEE")}: ${on ? "done" : "not done"}`} className={cn("inline-block size-4 rounded-full", on ? "bg-primary" : "border-2 border-input")} />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
      )}
    </>
  )
}
