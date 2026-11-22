import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Bar, inputClass, Section, Title, TintButton } from "@/components/kit"
import { edit } from "@/components/sheets"
import { guessCurrency, monthName, NO_AREA, shortDate, useHome } from "@/lib/home"
import { cn } from "@/lib/utils"

// What was done and what it cost, a year at a time: the year's total, by area, and every time a job
// was done, newest first, by month. Tap one to change its date, cost or note, or remove it.
export default function History() {
  const h = useHome()
  const [year, setYear] = useState(h.year)
  const lines = h.history.filter((d) => d.date.startsWith(year)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const total = h.spentIn(year)
  const areas = new Map<string, number>()
  for (const d of lines) {
    const j = h.job(d.job), a = j ? h.areaOf(j) : NO_AREA
    areas.set(a, (areas.get(a) ?? 0) + (d.cost ?? 0))
  }
  const byArea = [...areas.entries()].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  const months = [...new Set(lines.map((d) => d.date.slice(0, 7)))]
  const years = [...new Set([h.year, ...h.history.map((d) => d.date.slice(0, 4))])].sort()
  const arrow = "grid size-11 place-items-center rounded-full bg-muted text-foreground disabled:opacity-30"

  return (
    <>
      <Title subtitle="History" title={year} action={
        <div className="flex gap-2">
          <button type="button" aria-label="Previous year" disabled={year <= years[0]} onClick={() => setYear(String(Number(year) - 1))} className={arrow}><ChevronLeft className="size-5" /></button>
          <button type="button" aria-label="Next year" disabled={year >= h.year} onClick={() => setYear(String(Number(year) + 1))} className={arrow}><ChevronRight className="size-5" /></button>
        </div>
      } />
      <div className="grid grid-cols-1 items-start gap-x-8 min-[1100px]:grid-cols-[minmax(0,1fr)_340px] min-[1100px]:grid-rows-[auto_auto_1fr]">
        <div className="min-[1100px]:col-start-2 min-[1100px]:row-start-1">
          <Section>
            <div className="px-4 py-4">
              <p className="text-[0.8125rem] font-medium text-muted-foreground">{year === h.year ? "Spent this year" : `Spent in ${year}`}</p>
              <p className="text-[2rem] font-bold leading-tight tabular-nums" data-testid="year-total">{h.money(total)}</p>
              <p className="text-[0.875rem] text-muted-foreground">{lines.length} {lines.length === 1 ? "job" : "jobs"} done</p>
              {byArea.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  {byArea.map(([a, n]) => (
                    <div key={a} data-testid="area-spend">
                      <div className="flex items-baseline justify-between gap-3 text-[0.875rem]"><span className="font-medium">{a}</span><span className="tabular-nums text-muted-foreground">{h.money(n)}</span></div>
                      <Bar className="mt-1" value={total ? n / total : 0} label={a} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>
        <div className="min-[1100px]:col-start-1 min-[1100px]:row-span-3 min-[1100px]:row-start-1">
          <TintButton className="mb-6 w-full min-[700px]:w-auto" onClick={() => edit.done()} disabled={!h.jobs.length}><Plus /> Log a job done</TintButton>
          {months.map((m) => (
            <Section key={m} title={monthName(m + "-01")}>
              {lines.filter((d) => d.date.startsWith(m)).map((d) => (
                <button key={d.id} type="button" aria-label={`${h.job(d.job)?.name ?? "A job"}, ${shortDate(d.date, h.now)}`} onClick={() => edit.done(d)} className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left first:border-t-0">
                  <span className="w-12 shrink-0 text-[0.8125rem] tabular-nums text-muted-foreground">{shortDate(d.date, h.now).replace(/ \d{4}$/, "")}</span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 font-medium leading-snug">{h.job(d.job)?.name ?? "A job you deleted"}</span>
                    {d.note && <span className="block truncate text-[0.8125rem] text-muted-foreground">{d.note}</span>}
                  </span>
                  {d.cost !== undefined && <span className="shrink-0 tabular-nums">{h.money(d.cost)}</span>}
                </button>
              ))}
            </Section>
          ))}
          {!lines.length && <Section footer="Mark a job done on Due, or tell your AI what you did and what it cost."><p className="px-4 py-3 text-muted-foreground">Nothing done in {year} yet.</p></Section>}
        </div>
        <div className="min-[1100px]:col-start-2 min-[1100px]:row-start-2">
          <Currency />
        </div>
      </div>
    </>
  )
}

/** The currency costs are shown in: kr after the amount, $, € and £ before. */
function Currency() {
  const h = useHome()
  const [text, setText] = useState<string | null>(null)
  const shown = text ?? (h.currencySet ? h.currency : "")
  return (
    <Section title="Currency" footer={`Costs show as ${h.money(1250)}.`}>
      <div className="flex items-center gap-2 px-4 py-2.5">
        <input aria-label="Currency" className={cn(inputClass, "h-10 min-w-0 flex-1")} placeholder={guessCurrency() || "kr, $, €, £"} value={shown}
          onInput={(e) => setText(e.currentTarget.value)} onBlur={() => { if (text !== null) { h.setCurrency(text.trim()); setText(null) } }}
          onKeyDown={(e) => { if (e.key === "Enter" && text !== null) { h.setCurrency(text.trim()); setText(null) } }} />
      </div>
    </Section>
  )
}
