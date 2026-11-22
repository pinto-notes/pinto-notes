import { useState } from "react"
import { route } from "amber-router"
import { BookOpen, ChevronRight, Copy, Plus } from "lucide-react"
import { Bar, offerUndo, Section, Title, TintButton } from "@/components/kit"
import { DinnerSheet, type Editing } from "@/components/dinner-sheet"
import { BackToThisWeek, WeekSwitch } from "@/components/week-switch"
import { cooks, dayName, range, shortDay, shownAisles, today, useMeals, useWeek, weekDays, weekName, weekOf, type Dinner } from "@/lib/meals"
import { cn } from "@/lib/utils"

// The week's dinners, Monday to Sunday: a tap on a day adds its dinner or opens it. Beside it (under
// it on iPhone) the grocery list the dinners make, and the earlier weeks, which are kept as they
// were. A week ahead starts empty; an earlier week can be copied onto this one.
export default function Week() {
  const m = useMeals()
  const [week, setWeek] = useWeek()
  const [editing, setEditing] = useState<Editing | null>(null)
  const now = today(), thisWeek = weekOf(now)
  const days = weekDays(week)
  const inWeek = m.dinners.filter((d) => days.includes(d.date))
  const list = m.list(week)
  const left = list.items.length - list.bought

  const drop = async (d: Dinner) => {
    const before = m.snapshot()
    setEditing(null)
    await m.removeDinner(d.id)
    offerUndo(`Deleted ${d.dish}`, () => m.restore(before))
  }
  const copy = async () => {
    const before = m.snapshot()
    const n = await m.copyWeek(week, thisWeek)
    setWeek(thisWeek)
    offerUndo(n ? `Copied ${n} ${n === 1 ? "dinner" : "dinners"} to this week` : "This week's days are all planned already", () => m.restore(before))
  }
  // Earlier weeks with dinners, newest first.
  const earlier = [...new Set(m.dinners.map((d) => weekOf(d.date)))].filter((w) => w < thisWeek && w !== week).sort().reverse().slice(0, 6)

  return (
    <>
      <Title subtitle={range(week)} title={weekName(week)} action={<WeekSwitch />} />
      <BackToThisWeek />
      <div className="grid grid-cols-1 gap-x-8 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <Section title="Dinners" action={week < thisWeek && inWeek.length > 0 ? <TintButton className="-my-2 h-9" onClick={copy}><Copy /> Copy to this week</TintButton> : undefined}
            footer={!inWeek.length ? (week > thisWeek ? "A new week starts empty. Tap a day to plan its dinner, or ask your AI to plan the week." : "Tap a day to plan its dinner, or ask your AI to plan the week. The grocery list builds itself from what the dinners need.") : undefined}>
            {days.map((date) => {
              const ds = inWeek.filter((d) => d.date === date)
              const tonight = date === now
              if (!ds.length) return (
                <div key={date} className="flex min-h-14 items-center border-t border-border first:border-t-0">
                  <button type="button" aria-label={`Add dinner on ${dayName(date)}`} onClick={() => setEditing({ date })} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left">
                    <DayMark date={date} tonight={tonight} />
                    <span className="flex-1 text-muted-foreground">{tonight ? "Nothing planned tonight" : "Add dinner"}</span>
                    <Plus className="size-4 text-muted-foreground" />
                  </button>
                </div>
              )
              return ds.map((d) => (
                <div key={d.id} className="flex min-h-14 items-center border-t border-border first:border-t-0">
                  <button type="button" aria-label={`${dayName(date)}: ${d.dish}`} onClick={() => setEditing({ dinner: d, date })} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 pl-4 pr-2 text-left">
                    <DayMark date={date} tonight={tonight} />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 font-semibold leading-snug">{d.dish}</span>
                      <span className="block truncate text-[0.8125rem] text-muted-foreground">{meta(d, tonight)}</span>
                    </span>
                  </button>
                  {d.recipe
                    ? <a href={`pinto:${d.recipe}`} aria-label={`Recipe for ${d.dish}`} className="mr-1 grid size-11 shrink-0 place-items-center rounded-full text-link"><BookOpen className="size-[18px]" /></a>
                    : <ChevronRight className="mr-4 size-4 shrink-0 text-muted-foreground" />}
                </div>
              ))
            })}
          </Section>
        </div>
        <div>
          <Section title="Groceries">
            <button type="button" onClick={() => route("/groceries")} aria-label="Open the grocery list" className="block w-full px-4 py-4 text-left">
              <span className="flex items-baseline gap-2">
                <span className="text-[2rem] font-bold leading-none tabular-nums" data-testid="to-buy">{left}</span>
                <span className="font-semibold">to buy</span>
                <span className="ml-auto text-[0.8125rem] text-muted-foreground">{list.bought} of {list.items.length} bought</span>
              </span>
              <Bar className="mt-3" value={list.items.length ? list.bought / list.items.length : 0} label="Bought" />
              {list.items.length > 0 && (
                <span className="mt-3 block space-y-1">
                  {shownAisles(m.aisles).map((a) => {
                    const here = list.items.filter((x) => x.aisle === a && !x.bought)
                    if (!here.length) return null
                    return <span key={a} className="block truncate text-[0.875rem]"><span className="font-medium">{a}:</span> <span className="text-muted-foreground">{here.map((x) => x.name).join(", ")}</span></span>
                  }).filter(Boolean).slice(0, 4)}
                </span>
              )}
              {!list.items.length && <span className="mt-3 block text-[0.875rem] text-muted-foreground">Add what a dinner needs and it lands here, by aisle.</span>}
            </button>
          </Section>
          {earlier.length > 0 && (
            <Section title="Earlier weeks" footer="Every week is kept. Open one to see what you ate, or copy it to this week.">
              {earlier.map((w) => {
                const ds = m.dinners.filter((d) => weekOf(d.date) === w).sort((a, b) => (a.date < b.date ? -1 : 1))
                return (
                  <button key={w} type="button" onClick={() => setWeek(w)} className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left first:border-t-0">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{weekName(w, thisWeek)}</span>
                      <span className="block truncate text-[0.8125rem] text-muted-foreground">{ds.map((d) => d.dish).join(", ")}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
            </Section>
          )}
        </div>
      </div>
      <DinnerSheet editing={editing} dinners={m.dinners} cooks={m.allCooks} aisles={m.aisles} aisleFor={m.aisleFor}
        onClose={() => setEditing(null)} onSave={async (d) => { await m.saveDinner(d); setEditing(null) }} onDelete={drop} />
    </>
  )
}

function meta(d: Dinner, tonight: boolean) {
  const n = d.ingredients.length
  return [tonight ? "Tonight" : "", d.cook ? cooks(d.cook) : "", n ? `${n} ${n === 1 ? "thing" : "things"} to get` : ""].filter(Boolean).join(" · ") || "Nothing to get"
}

/** The day, as a calendar would show it: Mon over 23. Tonight is filled with the accent. */
function DayMark({ date, tonight }: { date: string; tonight: boolean }) {
  return (
    <span className={cn("flex size-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none", tonight ? "bg-[var(--amber-accent)] text-mark-text" : "bg-muted text-foreground")}>
      <span className="text-[0.75rem] font-medium">{shortDay(date)}</span>
      <span className="mt-0.5 text-[1.0625rem] font-semibold tabular-nums">{Number(date.slice(8))}</span>
    </span>
  )
}
