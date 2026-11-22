import { Check } from "lucide-react"
import { Sheet } from "@/components/kit"
import { STATUSES, useGifts, type Idea } from "@/lib/gifts"
import { cn } from "@/lib/utils"

/** Where a gift is: an idea, bought, wrapped or given. One tap each. */
export function StatusSheet({ idea, onClose }: { idea: Idea | null; onClose: () => void }) {
  const { setStatus } = useGifts()
  if (!idea) return null
  const row = "flex min-h-12 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left first:border-t-0 active:bg-accent"
  return (
    <Sheet open title={idea.title} onClose={onClose}>
      <div role="menu" aria-label={`Where ${idea.title} is`} className="overflow-hidden rounded-xl bg-card">
        {STATUSES.map((s) => (
          <button key={s.status} type="button" role="menuitemradio" aria-checked={idea.status === s.status} className={row}
            onClick={async () => { onClose(); if (s.status !== idea.status) await setStatus(idea.id, s.status) }}>
            <span className={cn("flex-1", idea.status === s.status && "font-semibold")}>{s.label}</span>
            {idea.status === s.status && <Check className="size-5 text-link" />}
          </button>
        ))}
      </div>
      <p className="px-1 pt-3 text-[0.8125rem] text-muted-foreground">Bought, wrapped and given count against the budget. A given gift is kept under Given before.</p>
    </Sheet>
  )
}
