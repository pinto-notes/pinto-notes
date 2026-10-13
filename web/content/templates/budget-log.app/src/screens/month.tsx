import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { route } from "amber-router"
import { ExpenseSheet } from "@/components/add-expense"
import { Bar, PrimaryButton, Row, Section, TintButton } from "@/components/kit"
import { daysIn, iso, money, monthName, shiftMonth, thisMonth, useBudget, type Expense } from "@/lib/budget"
import { cn } from "@/lib/utils"

// The app's main job: how much is left this month, where it went, and adding what you just spent.
export default function Month() {
  const b = useBudget()
  const [m, setM] = useState(thisMonth())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const mo = b.month(m)
  const current = m === thisMonth()
  const daysLeft = current ? daysIn(m) - new Date().getDate() + 1 : 0
  const perDay = daysLeft > 0 && mo.left > 0 ? mo.left / daysLeft : 0
  const fmt = (n: number) => money(n, b.currency)

  return (
    <>
      <header className="flex items-center gap-1 pb-4 pt-2">
        <h1 className="min-w-0 flex-1 text-[2rem] font-bold leading-tight tracking-tight">{monthName(m)}</h1>
        <button type="button" aria-label="Previous month" onClick={() => setM(shiftMonth(m, -1))} className="grid size-11 place-items-center rounded-full text-primary"><ChevronLeft className="size-6" /></button>
        <button type="button" aria-label="Next month" disabled={current} onClick={() => setM(shiftMonth(m, 1))} className="grid size-11 place-items-center rounded-full text-primary disabled:opacity-30"><ChevronRight className="size-6" /></button>
      </header>

      <div className="min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:gap-6 min-[900px]:items-start">
        <div>
          <Section>
            <div className="p-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">{mo.left >= 0 ? (current ? "Left this month" : "Left over") : "Over budget"}</p>
              <p data-testid="left" className={cn("mt-0.5 text-[2.5rem] font-bold leading-tight tracking-tight tabular-nums", mo.left < 0 && "text-destructive")}>{fmt(Math.abs(mo.left))}</p>
              <Bar className="mt-3 h-2.5" value={mo.budget ? mo.spent / mo.budget : 0} over={mo.left < 0} label="Spent of budget" />
              <p className="mt-2.5 text-[0.9375rem] text-muted-foreground tabular-nums">
                {fmt(mo.spent)} spent of {fmt(mo.budget)}
                {current && daysLeft > 0 && <> · {daysLeft} {daysLeft === 1 ? "day" : "days"} left{perDay > 0 && <>, about {fmt(Math.floor(perDay))} a day</>}</>}
              </p>
            </div>
          </Section>
          <PrimaryButton className="mb-6" onClick={() => setAdding(true)}><Plus /> Add expense</PrimaryButton>
        </div>

        <div>
          <Section title="By category">
            {mo.by.filter((c) => c.budget || c.spent).map((c) => (
              <Row key={c.name} className="block py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold">{c.name}</span>
                  <span className={cn("text-[0.9375rem] tabular-nums", c.left < 0 ? "font-semibold text-destructive" : "text-muted-foreground")}>
                    {c.left < 0 ? `${fmt(-c.left)} over` : `${fmt(c.left)} left`}
                  </span>
                </div>
                <Bar className="mt-2" value={c.budget ? c.spent / c.budget : c.spent ? 1 : 0} over={c.left < 0} label={`${c.name} spent of budget`} />
                <p className="mt-1.5 text-[0.8125rem] text-muted-foreground tabular-nums">{fmt(c.spent)} of {fmt(c.budget)}</p>
              </Row>
            ))}
            {mo.by.every((c) => !c.budget && !c.spent) && <p className="px-4 py-6 text-center text-muted-foreground">No budget yet. Add your categories in the Budget tab.</p>}
          </Section>

          <Section title="Recent" action={mo.items.length > 5 ? <TintButton className="-my-2 h-11 bg-transparent px-2 text-[0.9375rem]" onClick={() => route("/expenses")}>See all</TintButton> : undefined}>
            {mo.items.slice(0, 5).map((e) => (
              <Row key={e.id} className="p-0">
                <button type="button" aria-label={`Edit ${e.what}`} onClick={() => setEditing(e)} className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{e.what}</p>
                  <p className="text-[0.8125rem] text-muted-foreground">{e.category} · {e.date === iso(new Date()) ? "Today" : new Date(e.date + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                </div>
                <span className="font-semibold tabular-nums">{fmt(e.amount)}</span>
                </button>
              </Row>
            ))}
            {!mo.items.length && <p className="px-4 py-6 text-center text-muted-foreground">Nothing spent in {monthName(m, false)}. Tap Add expense to log the first one.</p>}
          </Section>
        </div>
      </div>
      <ExpenseSheet open={adding || !!editing} expense={editing} onClose={() => { setAdding(false); setEditing(null) }} />
    </>
  )
}
