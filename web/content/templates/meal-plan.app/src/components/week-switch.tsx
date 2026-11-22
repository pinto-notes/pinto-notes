import { ChevronLeft, ChevronRight, Undo2 } from "lucide-react"
import { TintButton } from "@/components/kit"
import { plus, today, useWeek, weekOf } from "@/lib/meals"

/** Back and forward a week. Dinners and Groceries show the same week. Earlier weeks are kept as
 *  they were; a week ahead starts empty. */
export function WeekSwitch() {
  const [week, setWeek] = useWeek()
  const step = "grid size-11 place-items-center rounded-full bg-muted text-foreground active:opacity-70"
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button type="button" aria-label="Previous week" className={step} onClick={() => setWeek(plus(week, -7))}><ChevronLeft className="size-5" /></button>
      <button type="button" aria-label="Next week" className={step} onClick={() => setWeek(plus(week, 7))}><ChevronRight className="size-5" /></button>
    </div>
  )
}

/** Under the title when another week is showing: the way back, on its own line so the title keeps
 *  its room on a small phone. */
export function BackToThisWeek() {
  const [week, setWeek] = useWeek()
  const now = weekOf(today())
  if (week === now) return null
  return <TintButton className="-mt-2 mb-4 h-9 px-3 text-[0.9375rem]" onClick={() => setWeek(now)}><Undo2 /> Back to this week</TintButton>
}
