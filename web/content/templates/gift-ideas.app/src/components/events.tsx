import { route } from "amber-router"
import { Check, ChevronRight } from "lucide-react"
import { Bar, Row, SpendText } from "@/components/kit"
import { dayLabel, inDays, statusLabel, type Event, type Share } from "@/lib/gifts"
import { cn } from "@/lib/utils"

/** Whether someone's gift for an occasion is bought: "Bought" (or wrapped, or given), else not yet. */
export function shareStatus(s: Share) {
  if (!s.bought.length) return { done: false, text: "Not bought yet", more: s.ideas.length ? `${s.ideas.length} ${s.ideas.length === 1 ? "idea" : "ideas"}` : "No ideas yet" }
  const best = s.bought.some((i) => i.status === "given") ? "given" : s.bought.every((i) => i.status === "wrapped") ? "wrapped" : "bought"
  return { done: true, text: statusLabel(best), more: s.bought.map((i) => i.title).join(", ") }
}
export const boughtCount = (e: Event) => e.shares.filter((s) => s.bought.length).length
export const openEvent = (e: Event) => route(e.shared ? `/event/${encodeURIComponent(e.key)}` : `/person/${encodeURIComponent(e.shares[0].person.id)}`)
/** "Mum, Birthday", or "Christmas 2026" for everyone's. */
export const eventName = (e: Event) => (e.shared ? e.title : `${e.shares[0].person.name}, ${e.title}`)

/** The day as a small calendar leaf: the month over the day's number. */
export function Leaf({ date, soon }: { date: string; soon?: boolean }) {
  const d = new Date(date + "T12:00:00")
  return (
    <div className={cn("grid w-12 shrink-0 place-items-center rounded-xl py-1.5 max-[379px]:w-11", soon ? "bg-[var(--amber-accent-soft)]" : "bg-muted")} aria-hidden>
      <span className={cn("text-[0.75rem] font-semibold uppercase leading-none", soon ? "text-link" : "text-muted-foreground")}>{d.toLocaleDateString("en-GB", { month: "short" })}</span>
      <span className="text-[1.375rem] font-bold leading-tight tabular-nums">{d.getDate()}</span>
    </div>
  )
}

/** One coming occasion: when, how many days are left, whether it's bought and the budget. */
export function EventRow({ e, fmt }: { e: Event; fmt: (n: number) => string }) {
  const one = e.shares[0]
  const st = shareStatus(one)
  const soon = e.days <= 14
  return (
    <Row className="p-0">
      <button type="button" aria-label={eventName(e)} data-testid="event" onClick={() => openEvent(e)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:bg-accent max-[379px]:gap-2.5 max-[379px]:px-3">
        <Leaf date={e.date} soon={soon} />
        {/* Who and whether it's bought; when; then spent of the budget, as a bar and in numbers. */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="min-w-0 truncate font-semibold">{e.shared ? <>{e.title.replace(/ \d{4}$/, "")}<span className="max-[519px]:hidden"> {e.year}</span></> : one.person.name}</p>
            <p data-testid="status" className={cn("flex shrink-0 items-center gap-1 text-[0.9375rem] font-medium", e.shared ? "" : st.done ? "text-link" : "text-muted-foreground")}>
              {!e.shared && st.done && <Check className="size-4 self-center" strokeWidth={3} />}
              {e.shared ? `${boughtCount(e)} of ${e.shares.length} bought` : st.text}
            </p>
          </div>
          <p className="truncate text-[0.875rem] text-muted-foreground">
            {e.shared ? `${e.shares.length} people · ` : `${e.title} · `}<span data-testid="days" className={cn(soon && "font-medium text-link")}>{inDays(e.days)}</span>
          </p>
          {e.budget > 0 ? (
            <div className="mt-1 flex items-center gap-3">
              <Bar value={e.spent / e.budget} over={e.spent > e.budget} label={`${eventName(e)}: spent of budget`} className="h-1.5 flex-1" />
              <SpendText spent={e.spent} budget={e.budget} fmt={fmt} className="shrink-0" />
            </div>
          ) : e.spent > 0 && <p data-testid="spend" className="mt-1 text-[0.875rem] tabular-nums text-muted-foreground">{fmt(e.spent)} spent</p>}
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground max-[379px]:hidden" />
      </button>
    </Row>
  )
}

/** A shared occasion's total across everyone: spent against all the budgets, and how many are bought. */
export function TotalCard({ e, fmt, onOpen, titled = true }: { e: Event; fmt: (n: number) => string; onOpen?: () => void; titled?: boolean }) {
  const over = e.budget > 0 && e.spent > e.budget
  const left = e.shares.filter((s) => !s.bought.length).map((s) => s.person.name)
  const body = (
    <>
      {titled && <h2 className="text-[1.0625rem] font-semibold">{e.title}</h2>}
      <p className="text-[0.875rem] text-muted-foreground">{dayLabel(e.date)} · {inDays(e.days)}</p>
      <p className="mt-3 tabular-nums" data-testid="total">
        <span className={cn("text-[2rem] font-bold leading-none tracking-tight", over && "text-destructive")}>{fmt(e.spent)}</span>
        {e.budget > 0 && <span className="text-muted-foreground"> of {fmt(e.budget)}</span>}
      </p>
      {e.budget > 0 && <Bar value={e.spent / e.budget} over={over} label={`${e.title}: spent of budget`} className="mt-3" />}
      <p className="mt-2.5 text-[0.9375rem] text-muted-foreground" data-testid="total-line">
        {boughtCount(e)} of {e.shares.length} bought
        {e.budget > 0 && (over ? ` · ${fmt(e.spent - e.budget)} over` : ` · ${fmt(e.budget - e.spent)} left`)}
      </p>
      {left.length > 0 && <p className="mt-1 text-[0.9375rem]" data-testid="still-to-buy">Still to buy for: {left.join(", ")}</p>}
    </>
  )
  return (
    <div className="mb-6 overflow-hidden rounded-xl bg-card" data-testid="total-card">
      <div className="p-4">{body}</div>
      {onOpen && (
        <button type="button" onClick={onOpen} aria-label={`${e.title}: everyone`} className="flex min-h-11 w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left font-medium text-link active:bg-accent">
          <span className="flex-1">Everyone's gifts</span><ChevronRight className="size-4" />
        </button>
      )}
    </div>
  )
}
