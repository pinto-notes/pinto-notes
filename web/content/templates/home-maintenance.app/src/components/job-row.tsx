import { ArrowDown, ArrowUp, Check } from "lucide-react"
import { edit, markDone } from "@/components/sheets"
import { daysBetween, everyLabel, late, shortDate, until, useHome, type JobView } from "@/lib/home"
import { cn } from "@/lib/utils"

/** When a job is due, in words: "2 weeks late", "Due today", "This autumn", "24 Nov". */
export function dueText(j: JobView, now: string) {
  const w = j.when
  if (!w) return { main: "No schedule", sub: "" }
  if (w.never && !w.season) return { main: "Not done yet", sub: "" }
  if (j.status === "overdue") return { main: `${late(daysBetween(w.end, now))} late`, sub: w.season ? `${cap(w.season)} ended ${shortDate(w.end, now)}` : `Was due ${shortDate(w.date, now)}` }
  if (w.season && w.date <= now) return { main: `This ${w.season}`, sub: `By ${shortDate(w.end, now)}` }
  if (w.season) return { main: `${cap(w.season)} ${w.date.slice(0, 4)}`, sub: `From ${shortDate(w.date, now)}` }
  const d = daysBetween(now, w.date)
  return { main: d === 0 ? "Due today" : shortDate(w.date, now), sub: d === 0 ? "" : until(d) }
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

/** A job on the Due list or in its area: what, where, how often and when last; when it's due on
 *  the right; and the Done button. Ordering shows arrows instead of Done. */
export function JobRow({ job, showArea = true, order }: { job: JobView; showArea?: boolean; order?: { up: boolean; down: boolean; move: (by: number) => unknown } }) {
  const h = useHome()
  const due = dueText(job, h.now)
  const who = h.contact(job.contact)
  const meta = [showArea ? h.areaOf(job) : "", everyLabel(job.every), job.lastDone ? `last ${shortDate(job.lastDone, h.now)}` : "", who ? who.name : ""].filter(Boolean).join(" · ")
  const tone = job.status === "overdue" ? "text-destructive" : job.status === "now" ? "text-link" : "text-foreground"
  const icon = "grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground disabled:opacity-30"
  return (
    <div className="flex min-h-14 items-center border-t border-border first:border-t-0" data-testid="job">
      <button type="button" aria-label={job.name} onClick={() => edit.job(job)} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pl-4 pr-2 text-left">
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 font-semibold leading-snug">{job.name}</span>
          <span className={cn("block text-[0.8125rem] font-medium min-[380px]:hidden", tone)}>{due.main}</span>
          <span className="block truncate text-[0.8125rem] text-muted-foreground">{meta}</span>
        </span>
        <span className="hidden shrink-0 text-right leading-tight min-[380px]:block" data-testid="due">
          <span className={cn("block text-[0.9375rem] font-medium tabular-nums", tone)}>{due.main}</span>
          {due.sub && <span className="block text-[0.75rem] text-muted-foreground">{due.sub}</span>}
        </span>
      </button>
      {order ? (
        <>
          <button type="button" aria-label={`Move ${job.name} up`} disabled={!order.up} onClick={() => order.move(-1)} className={icon}><ArrowUp className="size-4" /></button>
          <button type="button" aria-label={`Move ${job.name} down`} disabled={!order.down} onClick={() => order.move(1)} className={cn(icon, "mr-1")}><ArrowDown className="size-4" /></button>
        </>
      ) : (
        <button type="button" aria-label={`Mark ${job.name} done`} onClick={() => markDone(h, job)}
          className="mr-2 grid size-11 shrink-0 place-items-center rounded-full">
          <span className="grid size-8 place-items-center rounded-full border-2 border-[var(--amber-accent)] text-link"><Check className="size-4" strokeWidth={2.5} /></span>
        </button>
      )}
    </div>
  )
}
