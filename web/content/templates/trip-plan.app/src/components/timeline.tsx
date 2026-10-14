import { useState } from "react"
import { BedDouble, Check, MapPin, Plane, Share, Ticket, TrainFront, UtensilsCrossed, type LucideIcon } from "lucide-react"
import { share } from "@/lib/amber"
import { timeline, type Booking, type Day, type Kind } from "@/lib/trip"
import { cn } from "@/lib/utils"

export const KIND_ICON: Record<Kind, LucideIcon> = { flight: Plane, train: TrainFront, stay: BedDouble, food: UtensilsCrossed, activity: Ticket, other: MapPin }

// A day as a timeline: the plan's lines and that day's bookings, by time, on a thin rail. A booking
// shows its kind, its reference and whether it's paid.
export function Timeline({ day, bookings, date }: { day?: Day; bookings: Booking[]; date: string }) {
  const stops = timeline(day, bookings, date)
  if (!stops.length) return <p className="px-4 py-3 text-muted-foreground">Nothing planned yet.</p>
  return (
    <ol className="relative px-4 py-2" aria-label="Timeline">
      <span aria-hidden="true" className="absolute bottom-4 left-[80px] top-4 w-px bg-border" />
      {stops.map((s, i) => {
        const Icon = s.booking ? KIND_ICON[s.booking.kind ?? "other"] : null
        return (
          <li key={i} className="relative flex gap-3 py-1.5">
            <span className="w-11 shrink-0 pt-px text-right text-[0.8125rem] font-semibold tabular-nums text-muted-foreground">{s.time}</span>
            <span aria-hidden="true" className="relative z-[1] mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <span className={cn("grid place-items-center rounded-full", Icon ? "size-[18px] bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "size-3 border-2 border-[var(--amber-accent)] bg-card")}>
                {Icon && <Icon className="size-[11px]" strokeWidth={2.5} />}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className={cn("block", s.booking && "font-semibold")}>{s.text}</span>
              {s.booking && (
                <span className="block text-[0.8125rem] text-muted-foreground">
                  {s.booking.ref ? `Ref ${s.booking.ref} · ` : ""}{s.booking.paid ? "Paid" : <span className="font-medium text-primary">Not paid</span>}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Shares text as a file through the share sheet (iPhone) or a Save panel (Mac). Says Shared after. */
export function ShareButton({ label, name, text, className }: { label: string; name: string; text: () => string; className?: string }) {
  const [state, setState] = useState<"idle" | "done" | string>("idle")
  const go = async () => {
    try {
      const r = await share({ name, type: "text/plain", text: text() })
      setState(r && r.ok === false ? (r.error || "Couldn't share.") : "done")
    } catch (e) { setState(String((e as Error)?.message ?? e) || "Couldn't share.") }
    setTimeout(() => setState("idle"), 2500)
  }
  return (
    <>
      <button type="button" aria-label={label} onClick={go} className={cn("-my-2 inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-[0.9375rem] font-semibold text-primary", className)}>
        {state === "done" ? <><Check className="size-4" /> Shared</> : <><Share className="size-4" /> Share</>}
      </button>
      {state !== "idle" && state !== "done" && <span role="status" className="text-[0.8125rem] text-destructive">{state}</span>}
    </>
  )
}
