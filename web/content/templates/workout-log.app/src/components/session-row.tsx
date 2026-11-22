import { Trophy } from "lucide-react"
import { Row } from "@/components/kit"
import { bestSet, dayText, distText, parse, setText, weightText, type Exercise, type Item, type Session, type Units } from "@/lib/workouts"

/** An exercise's sets in a few words: "3 × 5 at 100 kg", "4 sets, best 100 kg × 5", "5 km in 29:00". */
export function itemText(it: Item, ex: Exercise, u: Units): string {
  const sets = it.sets ?? []
  if (!sets.length) return ""
  if (ex.kind === "cardio") {
    if (sets.length === 1) return setText(sets[0], "cardio", u)
    const km = sets.reduce((n, s) => n + (s.km ?? 0), 0)
    return `${sets.length} sets${km ? `, ${distText(km, u)}` : ""}`
  }
  const same = sets.every((s) => s.reps === sets[0].reps && (s.kg ?? 0) === (sets[0].kg ?? 0))
  if (same) return sets.length === 1 ? setText(sets[0], "weight", u) : `${sets.length} × ${sets[0].reps}${sets[0].kg ? ` at ${weightText(sets[0].kg, u)}` : ""}`
  const top = bestSet(it, sets.some((s) => s.kg) ? "e1rm" : "reps")!
  return `${sets.length} sets, best ${setText(top, "weight", u)}`
}

/** A session in a list: its day, its name, what was done, and a mark when it set a new best. */
export function SessionRow({ session: s, exercise, units, bests, onOpen }: { session: Session; exercise: (id: string) => Exercise; units: Units; bests?: string[]; onOpen: () => void }) {
  const d = parse(s.date)
  const what = (s.items ?? []).map((it) => { const ex = exercise(it.exercise); return `${ex.name} ${itemText(it, ex, units)}` }).join(" · ")
  return (
    <Row className="p-0">
      <button type="button" onClick={onOpen} aria-label={`${s.name}, ${dayText(s.date)}`} className="flex min-h-11 w-full min-w-0 items-center gap-3 px-4 py-2.5 text-left">
        <div className="w-10 shrink-0 text-center leading-tight">
          <p className="text-[0.75rem] font-semibold uppercase text-muted-foreground">{d.toLocaleDateString("en-GB", { weekday: "short" })}</p>
          <p className="text-[1.25rem] font-bold tabular-nums">{d.getDate()}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="truncate font-semibold">{s.name}</span>
            {s.effort ? <span className="shrink-0 text-[0.8125rem] tabular-nums text-muted-foreground">Effort {s.effort}</span> : null}
          </p>
          <p className="line-clamp-2 text-[0.875rem] text-muted-foreground">{what || "Nothing logged"}</p>
          {s.note && <p className="truncate text-[0.875rem] italic text-muted-foreground">{s.note}</p>}
        </div>
        {bests && bests.length > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--amber-accent-soft)] px-2 py-1 text-[0.75rem] font-semibold text-link" title={`New best: ${bests.join(", ")}`} data-testid="new-best">
            <Trophy className="size-3.5" /> New best
          </span>
        )}
      </button>
    </Row>
  )
}
