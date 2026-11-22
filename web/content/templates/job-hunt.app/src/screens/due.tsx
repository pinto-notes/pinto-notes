import { route } from "amber-router"
import { Check } from "lucide-react"
import { offerUndo, Row, Section, Title } from "@/components/kit"
import { day, kindLabel, stepName, useJobs, type DueItem } from "@/lib/jobs"
import { cn } from "@/lib/utils"

// What needs doing: follow-ups, interviews and deadlines due today or late, oldest first, each with
// its date; then the next two weeks. Tick one when it's done; its card on the board moves on to
// the next date.
export default function Due() {
  const { due, soon, toggleStep, now, jobs } = useJobs()
  const done = async (x: DueItem) => {
    await toggleStep(x.job.id, x.step.id)
    offerUndo(`Done: ${stepName(x.step)}, ${x.job.company}`, () => toggleStep(x.job.id, x.step.id))
  }
  const late = due.filter((x) => x.late > 0).length
  return (
    <div className="max-w-2xl">
      <Title title="Due" subtitle={due.length ? `${due.length} to do${late ? `, ${late} late` : ""}` : "Nothing due"} />
      <Section footer={due.length ? "Tick one when it's done. Choose it to see the application." : undefined}>
        {!due.length && <p className="px-4 py-6 text-center text-muted-foreground">{jobs.length ? "Nothing due today. Follow-ups and interviews show here on their day." : "Add an application on the board, and its follow-ups and interviews show here on their day."}</p>}
        {due.map((x) => <Item key={x.job.id + x.step.id} x={x} now={now} onDone={() => done(x)} />)}
      </Section>
      {soon.length > 0 && (
        <Section title="Coming up">
          {soon.map((x) => <Item key={x.job.id + x.step.id} x={x} now={now} onDone={() => done(x)} />)}
        </Section>
      )}
    </div>
  )
}

function Item({ x, now, onDone }: { x: DueItem; now: string; onDone: () => void }) {
  const { job, step } = x
  const what = step.what ? stepName(step) : kindLabel(step.kind)
  return (
    <Row className="gap-2 py-2 pl-2 pr-3" >
      <button type="button" aria-label={`Done: ${what}, ${job.company}`} onClick={onDone} className="grid size-11 shrink-0 place-items-center">
        <span className="grid size-7 place-items-center rounded-full border-2 border-[var(--amber-field-border)] text-transparent"><Check className="size-4" strokeWidth={3} /></span>
      </button>
      <button type="button" onClick={() => route(`/job/${encodeURIComponent(job.id)}`)} className="min-w-0 flex-1 text-left" data-testid="due-item">
        <p className="font-semibold">{what}: {job.company}</p>
        <p className="text-[0.875rem] text-muted-foreground">{job.role}</p>
      </button>
      <div className="shrink-0 text-right">
        <p className={cn("text-[0.9375rem] font-medium tabular-nums", x.late >= 0 && "text-link")}>{day(step.date, now)}</p>
        {step.time && <p className="text-[0.875rem] tabular-nums text-muted-foreground">{step.time}</p>}
        {x.late > 0 && <p className="text-[0.8125rem] text-muted-foreground">{x.late} {x.late === 1 ? "day" : "days"} late</p>}
      </div>
    </Row>
  )
}
