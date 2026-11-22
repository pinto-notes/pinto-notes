import { ArrowDown, ArrowUp, Check } from "lucide-react"
import { Sheet } from "@/components/kit"
import { OUTCOMES, useJobs, type Job, type Outcome } from "@/lib/jobs"
import { cn } from "@/lib/utils"

/** "Move Tideway": every stage, one tap each (Closed once per reason), then up or down within the
 *  stage. The way to move a card without dragging it, and the way VoiceOver moves one. */
export function MoveSheet({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const { stages, move, nudge, byStage } = useJobs()
  if (!job) return null
  const col = byStage(job.stage), i = col.findIndex((j) => j.id === job.id)
  const go = async (stage: string, outcome?: Outcome) => { onClose(); await move(job.id, stage, undefined, outcome) }
  const row = "flex min-h-12 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left first:border-t-0 active:bg-accent"
  return (
    <Sheet open title={`Move ${job.company}`} onClose={onClose}>
      <div role="menu" aria-label={`Move ${job.company} to`} className="overflow-hidden rounded-xl bg-card">
        {stages.map((s) => s.id === "closed" ? OUTCOMES.map((o) => {
          const here = job.stage === "closed" && job.outcome === o.outcome
          return (
            <button key={o.outcome} type="button" role="menuitem" aria-current={here || undefined} onClick={() => go("closed", o.outcome)} className={row}>
              <span className="flex-1">{s.name}: {o.label.toLowerCase()}</span>
              {here && <Check className="size-5 text-link" />}
            </button>
          )
        }) : (
          <button key={s.id} type="button" role="menuitem" aria-current={job.stage === s.id || undefined} onClick={() => go(s.id)} className={row}>
            <span className={cn("flex-1", job.stage === s.id && "font-semibold")}>{s.name}</span>
            {job.stage === s.id && <Check className="size-5 text-link" />}
          </button>
        ))}
      </div>
      {col.length > 1 && (
        <div className="mt-4 flex gap-3">
          <button type="button" disabled={i <= 0} onClick={async () => { onClose(); await nudge(job.id, -1) }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted font-medium disabled:opacity-40"><ArrowUp className="size-4" /> Up</button>
          <button type="button" disabled={i >= col.length - 1} onClick={async () => { onClose(); await nudge(job.id, 1) }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-muted font-medium disabled:opacity-40"><ArrowDown className="size-4" /> Down</button>
        </div>
      )}
    </Sheet>
  )
}
