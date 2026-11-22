import { cn } from "@/lib/utils"

// How mood and energy look everywhere in the app: mood is the accent, stronger the better the day
// (the calendar's fill, the mood buttons); energy is blue pips, one to five. Colours are solid and
// set for light and dark in index.css.

/** Mood fill classes, 1 to 5 (whole class names, so Tailwind sees them). Days 1 to 3 carry the
 *  page's ink, 4 and 5 the ink that reads on the accent. */
export const MOOD_FILL = ["bg-mood-1 text-foreground", "bg-mood-2 text-foreground", "bg-mood-3 text-foreground", "bg-mood-4 text-mark-text", "bg-mood-5 text-mark-text"]
export const moodFill = (n: number) => MOOD_FILL[Math.round(n) - 1] ?? "bg-muted text-muted-foreground"

/** A mood score in its colour: a rounded square with the number. */
export function MoodMark({ value, className }: { value: number; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-[0.9375rem] font-semibold tabular-nums", moodFill(value), className)}>
      {value || "–"}
    </span>
  )
}

/** Energy as five pips, the first `value` filled. */
export function EnergyPips({ value, className, size = "size-1.5" }: { value: number; className?: string; size?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-[3px]", className)}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={cn("rounded-full", size, i <= value ? "bg-energy" : "bg-muted")} />)}
    </span>
  )
}

/** The legend for both: the mood ramp from 1 to 5 and the energy pips. */
export function Legend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.8125rem] text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1.5">
        Mood
        <span className="text-[0.75rem]">low</span>
        {[1, 2, 3, 4, 5].map((n) => <span key={n} className={cn("size-3.5 rounded-[4px]", moodFill(n))} />)}
        <span className="text-[0.75rem]">great</span>
      </span>
      <span className="inline-flex items-center gap-1.5">Energy <EnergyPips value={3} /></span>
    </div>
  )
}
