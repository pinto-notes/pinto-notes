import { route } from "amber-router"
import { ChevronRight, Plus, ShieldAlert } from "lucide-react"
import { Section, Title, TintButton } from "@/components/kit"
import { JobRow } from "@/components/job-row"
import { edit } from "@/components/sheets"
import { everyLabel, monthName, newId, shortDate, useHome, warrantyOf, type Job } from "@/lib/home"
import { cn } from "@/lib/utils"

/** Jobs most homes have, to start a new list with a tap. */
export const SUGGESTIONS: Omit<Job, "id">[] = [
  { name: "Test the smoke alarms", area: "Safety", every: "6 months" },
  { name: "Clean the dishwasher filter", area: "Kitchen", every: "1 month" },
  { name: "Clean the extractor fan filter", area: "Kitchen", every: "3 months" },
  { name: "Clean the shower drain", area: "Bathroom", every: "3 months" },
  { name: "Service the boiler", area: "Heating", every: "1 year" },
  { name: "Bleed the radiators", area: "Heating", every: "autumn" },
  { name: "Clear the gutters", area: "Outside", every: "autumn" },
  { name: "Switch to winter tyres", area: "Car", every: "autumn" },
]

// What's due: overdue, due this month (or in its season now) and coming up, each by date. Done
// on a row marks it done today. Above, the counts and what was spent this year; beside it on a wide
// note, warranties ending soon, what was done lately and who to call.
export default function Due() {
  const h = useHome()
  const { overdue, now, later, unscheduled } = h.due
  const warranties = h.appliances.map((a) => ({ a, w: warrantyOf(a, h.now) })).filter((x) => x.w.state === "soon")
  const recent = [...h.history].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4)
  const add = (s: Omit<Job, "id">) => h.saveJob({ ...s, id: newId("j") })

  return (
    <>
      <Title subtitle={monthName(h.now)} title="Due" action={<TintButton aria-label="Add a job" onClick={() => edit.job()}><Plus /> Job</TintButton>} />
      <div className="mb-6 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)] gap-1.5 min-[380px]:gap-2 min-[700px]:grid-cols-3 min-[700px]:gap-3">
        <Stat label="Overdue" value={String(overdue.length)} tone={overdue.length ? "bad" : undefined} testId="overdue-count" />
        <Stat label="This month" value={String(now.length)} tone={now.length ? "accent" : undefined} testId="now-count" />
        <button type="button" onClick={() => route("/history")} aria-label="Spent this year" className="text-left">
          <Stat label={`Spent in ${h.year}`} short="Spent" value={h.money(h.spent)} testId="spent" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-x-8 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {!h.jobs.length && (
            <Section title="Start with the usual jobs" footer="Tap the ones your home has, then set when you last did each. Or add your own, or tell your AI what needs doing and when you last did it.">
              {SUGGESTIONS.map((s) => (
                <button key={s.name} type="button" aria-label={`Add ${s.name}`} onClick={() => add(s)} className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left first:border-t-0">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{s.name}</span>
                    <span className="block text-[0.8125rem] text-muted-foreground">{s.area} · {everyLabel(s.every)}</span>
                  </span>
                  <Plus className="size-4 shrink-0 text-link" />
                </button>
              ))}
            </Section>
          )}
          {overdue.length > 0 && <Section title="Overdue">{overdue.map((j) => <JobRow key={j.id} job={j} />)}</Section>}
          {h.jobs.length > 0 && (
            <Section title="Due this month">
              {now.map((j) => <JobRow key={j.id} job={j} />)}
              {!now.length && <p className="px-4 py-3 text-[0.9375rem] text-muted-foreground">All done for {monthName(h.now).split(" ")[0]}.</p>}
            </Section>
          )}
          {later.length + unscheduled.length > 0 && <Section title="Coming up">{[...later, ...unscheduled].map((j) => <JobRow key={j.id} job={j} />)}</Section>}
        </div>
        <div>
          {warranties.length > 0 && (
            <Section title="Warranties ending soon">
              {warranties.map(({ a, w }) => (
                <button key={a.id} type="button" onClick={() => edit.appliance(a)} className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left first:border-t-0">
                  <ShieldAlert className="size-5 shrink-0 text-link" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{a.name}</span>
                    <span className="block text-[0.8125rem] text-muted-foreground">{w.text}</span>
                  </span>
                </button>
              ))}
            </Section>
          )}
          {recent.length > 0 && (
            <Section title="Done lately" action={<button type="button" onClick={() => route("/history")} className="text-[0.9375rem] font-medium text-link">History</button>}>
              {recent.map((d) => (
                <button key={d.id} type="button" onClick={() => edit.done(d)} className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left first:border-t-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{h.job(d.job)?.name ?? "A job"}</span>
                    <span className="block text-[0.8125rem] text-muted-foreground">{shortDate(d.date, h.now)}</span>
                  </span>
                  {d.cost !== undefined && <span className="tabular-nums text-muted-foreground">{h.money(d.cost)}</span>}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </Section>
          )}
        </div>
      </div>
    </>
  )
}

function Stat({ label, short, value, tone, testId }: { label: string; short?: string; value: string; tone?: "bad" | "accent"; testId: string }) {
  return (
    <div className="h-full rounded-xl bg-card px-2 py-3 min-[380px]:px-3 min-[700px]:px-4">
      <p className="truncate text-[0.75rem] font-medium text-muted-foreground min-[700px]:text-[0.8125rem]">
        {short ? <><span className="min-[380px]:hidden">{short}</span><span className="hidden min-[380px]:inline">{label}</span></> : label}
      </p>
      <p className={cn("mt-0.5 truncate font-bold leading-tight tabular-nums min-[700px]:text-[1.75rem]", value.length > 7 ? "text-[1rem] min-[380px]:text-[1.25rem]" : "text-[1.375rem]", tone === "bad" ? "text-destructive" : tone === "accent" ? "text-link" : "")} data-testid={testId}>{value}</p>
    </div>
  )
}
