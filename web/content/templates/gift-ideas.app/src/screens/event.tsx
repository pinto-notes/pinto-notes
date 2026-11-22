import { back, route } from "amber-router"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Row, Section, Spend, TintButton } from "@/components/kit"
import { shareStatus, TotalCard } from "@/components/events"
import { useGifts } from "@/lib/gifts"
import { cn } from "@/lib/utils"

// A shared occasion (Christmas 2026): the total across everyone, then each person's gift, spent
// and budget. Choose someone to see their ideas.
export default function EventPage({ id }: { id?: string }) {
  const { event, fmt } = useGifts()
  const e = id ? event(decodeURIComponent(id)) : undefined
  if (!e) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">This occasion isn't coming up any more.</p>
        <TintButton className="mt-4" onClick={() => route("/")}>Back to Upcoming</TintButton>
      </div>
    )
  }
  return (
    <div className="max-w-3xl">
      <button type="button" onClick={() => back()} className="-ml-2 mb-1 inline-flex h-11 items-center gap-0.5 rounded-lg pr-3 font-medium text-link"><ChevronLeft className="size-5" /> Back</button>
      <h1 className="pb-5 text-[2rem] font-bold leading-tight tracking-tight">{e.title}</h1>
      <TotalCard e={e} fmt={fmt} titled={false} />
      <Section title="Everyone" footer="Bought, wrapped and given gifts count against each budget.">
        {e.shares.map((s) => {
          const st = shareStatus(s)
          return (
            <Row key={s.person.id} className="p-0">
              <button type="button" aria-label={s.person.name} data-testid="share" onClick={() => route(`/person/${encodeURIComponent(s.person.id)}`)}
                className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:bg-accent">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{s.person.name}</p>
                  <p className={cn("flex items-center gap-1 text-[0.875rem]", st.done ? "text-link" : "text-muted-foreground")}>
                    {st.done && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
                    <span className="truncate">{st.done ? `${st.text}: ${st.more}` : `${st.text} · ${st.more}`}</span>
                  </p>
                </div>
                <Spend spent={s.spent} budget={s.budget} fmt={fmt} label={`${s.person.name}: spent of budget`} className="w-32 shrink-0 text-right" />
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </Row>
          )
        })}
      </Section>
    </div>
  )
}
