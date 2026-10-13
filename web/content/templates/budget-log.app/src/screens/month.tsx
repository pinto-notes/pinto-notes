import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Repeat } from "lucide-react"
import { route } from "amber-router"
import { ExpenseSheet } from "@/components/add-expense"
import { Bar, PrimaryButton, Row, Section, TintButton } from "@/components/kit"
import { billDate, daysIn, iso, money, monthName, monthOf, ordinal, shiftMonth, thisMonth, useBudget, type Expense } from "@/lib/budget"
import { cn } from "@/lib/utils"

// The app's main job: how much is left this month, where it went, and adding what you just spent.
// Then how this month compares (the last six months, and last month by this day) and the bills
// still to come. Two columns from 700 px.
export default function Month() {
  const b = useBudget()
  const [m, setM] = useState(thisMonth())
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)
  const mo = b.month(m)
  const current = m === thisMonth()
  const todayNum = new Date().getDate()
  const daysLeft = current ? daysIn(m) - todayNum + 1 : 0
  const upcoming = current ? b.bills.filter((x) => (x.last ?? "") < m && billDate(x, m) > iso(new Date())) : []
  const toCome = upcoming.reduce((t, x) => t + x.amount, 0)
  const free = mo.left - toCome
  const perDay = daysLeft > 0 && free > 0 ? free / daysLeft : 0
  const fmt = (n: number) => money(n, b.currency)

  // The last six months, ending with the one shown.
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(m, i - 5))
  const series = months.map((x) => ({ m: x, spent: b.month(x).spent }))
  const top = Math.max(1, mo.budget, ...series.map((x) => x.spent))
  // Last month by this day of the month, for a fair comparison mid-month.
  const prev = shiftMonth(m, -1)
  const prevByNow = b.expenses.filter((e) => monthOf(e.date) === prev && Number(e.date.slice(8)) <= (current ? todayNum : 31)).reduce((t, e) => t + (Number(e.amount) || 0), 0)
  const diff = mo.spent - prevByNow
  const hasPrev = b.expenses.some((e) => monthOf(e.date) === prev)

  return (
    <>
      <header className="flex items-center gap-1 pb-4 pt-2">
        <h1 className="min-w-0 flex-1 text-[2rem] font-bold leading-tight tracking-tight">{monthName(m)}</h1>
        <button type="button" aria-label="Previous month" onClick={() => setM(shiftMonth(m, -1))} className="grid size-11 place-items-center rounded-full text-primary"><ChevronLeft className="size-6" /></button>
        <button type="button" aria-label="Next month" disabled={current} onClick={() => setM(shiftMonth(m, 1))} className="grid size-11 place-items-center rounded-full text-primary disabled:opacity-30"><ChevronRight className="size-6" /></button>
      </header>

      <div className="min-[700px]:grid min-[700px]:grid-cols-2 min-[700px]:items-start min-[700px]:gap-6">
        <div>
          <Section>
            <div className="p-5">
              <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">{mo.left >= 0 ? (current ? "Left this month" : "Left over") : "Over budget"}</p>
              <p data-testid="left" className={cn("mt-0.5 text-[2.5rem] font-bold leading-tight tracking-tight tabular-nums", mo.left < 0 && "text-destructive")}>{fmt(Math.abs(mo.left))}</p>
              <Bar className="mt-3 h-2.5" value={mo.budget ? mo.spent / mo.budget : 0} over={mo.left < 0} label="Spent of budget" />
              <p className="mt-2.5 text-[0.9375rem] text-muted-foreground tabular-nums" data-testid="month-line">
                {fmt(mo.spent)} spent of {fmt(mo.budget)}
                {mo.carried !== 0 && <> ({mo.carried > 0 ? `${fmt(mo.carried)} carried over` : `${fmt(-mo.carried)} over last month`})</>}
                {current && daysLeft > 0 && <> · {daysLeft} {daysLeft === 1 ? "day" : "days"} left{perDay > 0 && <>, about {fmt(Math.floor(perDay))} a day{toCome > 0 ? " after bills" : ""}</>}</>}
              </p>
            </div>
          </Section>
          <PrimaryButton className="mb-6" onClick={() => setAdding(true)}><Plus /> Add expense</PrimaryButton>

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
                <p className="mt-1.5 text-[0.8125rem] text-muted-foreground tabular-nums">
                  {c.budget >= 0 ? <>{fmt(c.spent)} of {fmt(c.budget)}{c.carried ? ` (${c.carried > 0 ? "+" : "−"}${fmt(Math.abs(c.carried))} from last month)` : ""}</>
                    : <>{fmt(c.spent)} spent, and {fmt(-c.carried)} over from last month</>}
                </p>
              </Row>
            ))}
            {mo.by.every((c) => !c.budget && !c.spent) && <p className="px-4 py-6 text-center text-muted-foreground">No budget yet. Add your categories in the Budget tab.</p>}
          </Section>
        </div>

        <div>
          <Section title="Last six months" footer={hasPrev ? undefined : "Bars fill in as the months go by. The line is your monthly budget."}>
            <div className="px-4 pb-3 pt-4">
              {hasPrev && (
                <p className="mb-3 text-[0.9375rem] tabular-nums" data-testid="pace">
                  <span className="font-semibold">{diff <= 0 ? `${fmt(-diff)} less` : `${fmt(diff)} more`}</span>
                  <span className="text-muted-foreground"> than {monthName(prev, false)}{current ? ` by the ${ordinal(todayNum)}` : ""}</span>
                </p>
              )}
              <div className="relative flex h-32 items-end gap-2" role="img" aria-label={`Spent per month: ${series.map((x) => `${monthName(x.m, false)} ${fmt(x.spent)}`).join(", ")}`}>
                {mo.budget > 0 && (
                  <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/60" style={{ bottom: `${(mo.budget / top) * 100}%` }}>
                    <span className="absolute -top-[1.15rem] right-0 bg-card pl-1 text-[0.6875rem] font-medium text-muted-foreground">Budget</span>
                  </div>
                )}
                {series.map((x) => (
                  <button key={x.m} type="button" aria-label={`Show ${monthName(x.m)}`} onClick={() => setM(x.m)} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                    <span className={cn("block w-full rounded-t-md transition-[height] duration-500 motion-reduce:transition-none",
                      x.m === m ? "bg-[var(--amber-accent)]" : "bg-[var(--amber-accent)] opacity-40", mo.budget && x.spent > mo.budget && "bg-destructive")}
                      style={{ height: `${Math.max(2, (x.spent / top) * 100)}%` }} />
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex gap-2">
                {series.map((x) => <span key={x.m} className={cn("min-w-0 flex-1 text-center text-[0.75rem]", x.m === m ? "font-semibold text-foreground" : "text-muted-foreground")}>{monthName(x.m, false).slice(0, 3)}</span>)}
              </div>
            </div>
          </Section>

          {current && b.bills.length > 0 && (
            <Section title="Bills this month" action={<TintButton className="-my-2 h-11 bg-transparent px-2 text-[0.9375rem]" onClick={() => route("/budget")}>Change</TintButton>}
              footer={toCome > 0 ? `${fmt(toCome)} still to come this month.` : "All of this month's bills are in."}>
              {b.bills.map((x) => {
                const posted = (x.last ?? "") >= m
                return (
                  <Row key={x.id}>
                    <Repeat className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{x.what}</p>
                      <p className="text-[0.8125rem] text-muted-foreground">{x.category} · {posted ? "Paid" : `Due ${new Date(billDate(x, m) + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}</p>
                    </div>
                    <span className={cn("font-semibold tabular-nums", posted && "text-muted-foreground")}>{fmt(x.amount)}</span>
                  </Row>
                )
              })}
            </Section>
          )}

          <Section title="Recent" action={mo.items.length > 5 ? <TintButton className="-my-2 h-11 bg-transparent px-2 text-[0.9375rem]" onClick={() => route("/expenses")}>See all</TintButton> : undefined}>
            {mo.items.slice(0, 5).map((e) => (
              <Row key={e.id} className="p-0">
                <button type="button" aria-label={`Edit ${e.what}`} onClick={() => setEditing(e)} className="flex min-h-11 w-full items-center gap-3 px-4 py-2.5 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{e.what}</p>
                    <p className="text-[0.8125rem] text-muted-foreground">{e.category} · {e.date === iso(new Date()) ? "Today" : new Date(e.date + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{e.rec ? " · Monthly" : ""}</p>
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
