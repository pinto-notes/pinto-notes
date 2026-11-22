import { useEffect, useRef, useState } from "react"
import { route } from "amber-router"
import { ArrowRightLeft, CalendarClock, Plus } from "lucide-react"
import { TintButton, Title } from "@/components/kit"
import { JobSheet } from "@/components/job-sheet"
import { MoveSheet } from "@/components/move-sheet"
import { between, kindLabel, nextStep, outcomeLabel, stepName, useJobs, when, type Job } from "@/lib/jobs"
import { cn } from "@/lib/utils"

const num = "text-[1.25rem] font-bold leading-tight tabular-nums min-[700px]:text-[1.5rem]"
const label = "text-[0.8125rem] text-muted-foreground"

type Drag = { id: string; x0: number; y0: number; mouse: boolean; active: boolean; timer?: ReturnType<typeof setTimeout> }
type Ghost = { id: string; dx: number; dy: number; over: string | null; index: number }

// The board: a column per stage, a card per application. Drag a card to another stage (or up and
// down its own), or use its Move button. On iPhone the columns scroll sideways one stage at a time,
// with the stages and their counts above as a strip that jumps to each; from 900 px every stage is
// side by side.
export default function Board() {
  const { stages, jobs, byStage, move, responses, due, open, now } = useJobs()
  const [editing, setEditing] = useState<Job | "new" | null>(null)
  const [addTo, setAddTo] = useState<string | undefined>()
  const [moving, setMoving] = useState<Job | null>(null)
  const [ghost, setGhost] = useState<Ghost | null>(null)
  const board = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const justDragged = useRef(false)
  const live = useRef({ move, jobs })
  live.current = { move, jobs }

  /** The stage under the pointer (or, above or below the board, the one under x), and the place
   *  among its cards above y. */
  const target = (x: number, y: number, id: string) => {
    const cols = [...(board.current?.querySelectorAll<HTMLElement>("[data-stage]") ?? [])].map((c) => ({ c, r: c.getBoundingClientRect() }))
    const inX = cols.filter(({ r }) => x >= r.left && x <= r.right)
    const col = (inX.find(({ r }) => y >= r.top && y <= r.bottom) ?? inX[0])?.c
    if (!col) return { over: null, index: 0 }
    const cards = [...col.querySelectorAll<HTMLElement>("[data-job]")].filter((c) => c.dataset.job !== id)
    const index = cards.filter((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2 < y }).length
    return { over: col.dataset.stage ?? null, index }
  }
  const stopScroll = (e: TouchEvent) => { if (drag.current?.active) e.preventDefault() }
  const end = () => {
    const d = drag.current
    if (d?.timer) clearTimeout(d.timer)
    drag.current = null
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerup", onUp)
    window.removeEventListener("pointercancel", onCancel)
    document.removeEventListener("touchmove", stopScroll)
  }
  const activate = (x: number, y: number) => {
    const d = drag.current
    if (!d) return
    d.active = true
    navigator.vibrate?.(8)
    setGhost({ id: d.id, dx: x - d.x0, dy: y - d.y0, ...target(x, y, d.id) })
  }
  function onMove(e: PointerEvent) {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x0, dy = e.clientY - d.y0
    if (!d.active) {
      // A mouse drags once it moves; a finger has to rest on the card first, or it's a scroll.
      if (Math.hypot(dx, dy) > (d.mouse ? 5 : 8)) { if (d.mouse) activate(e.clientX, e.clientY); else end() }
      return
    }
    e.preventDefault()
    const b = board.current
    if (b && b.scrollWidth > b.clientWidth) {
      const r = b.getBoundingClientRect()
      // Only inside the board's own edge: a pointer past it (off the screen) doesn't scroll.
      if (e.clientX > r.right - 36 && e.clientX <= r.right) b.scrollLeft += 14
      else if (e.clientX < r.left + 36 && e.clientX >= r.left) b.scrollLeft -= 14
    }
    setGhost({ id: d.id, dx, dy, ...target(e.clientX, e.clientY, d.id) })
  }
  function onUp(e: PointerEvent) {
    const d = drag.current
    end()
    if (!d?.active) return
    justDragged.current = true
    setTimeout(() => { justDragged.current = false }, 60)
    const t = target(e.clientX, e.clientY, d.id)
    setGhost(null)
    if (t.over) live.current.move(d.id, t.over, t.index)
  }
  function onCancel() { end(); setGhost(null) }
  useEffect(() => end, [])

  const down = (e: React.PointerEvent, id: string) => {
    if (e.pointerType === "mouse" && e.button !== 0) return
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return
    end()
    const mouse = e.pointerType === "mouse" || e.pointerType === "pen"
    drag.current = { id, x0: e.clientX, y0: e.clientY, mouse, active: false }
    if (!mouse) drag.current.timer = setTimeout(() => activate(drag.current?.x0 ?? 0, drag.current?.y0 ?? 0), 350)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    document.addEventListener("touchmove", stopScroll, { passive: false })
  }

  const jump = (id: string) => board.current?.querySelector<HTMLElement>(`[data-stage="${id}"]`)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
  const first = stages[0]?.id

  return (
    <>
      <Title title="Applications" subtitle={jobs.length ? `${jobs.length} in all` : "Nothing yet"}
        action={<TintButton onClick={() => { setAddTo(undefined); setEditing("new") }}><Plus /> Add</TintButton>} />

      {/* Compact on a phone, so the first cards show under them. */}
      <div className="mb-4 grid grid-cols-3 gap-2 min-[700px]:mb-5 min-[700px]:gap-3" data-testid="stats">
        <div className="rounded-xl bg-card px-3 py-2 min-[700px]:px-4 min-[700px]:py-3">
          <p className={num}>{open}</p>
          <p className={label}>Open</p>
        </div>
        <div className="rounded-xl bg-card px-3 py-2 min-[700px]:px-4 min-[700px]:py-3" data-testid="response-rate">
          <p className={num}>{responses.sent ? `${responses.rate}%` : "–"}</p>
          <p className={label}>{responses.sent ? <><span className="min-[700px]:hidden">Heard back</span><span className="hidden min-[700px]:inline">Heard back from {responses.heard} of {responses.sent}</span></> : "Heard back"}</p>
        </div>
        <button type="button" onClick={() => route("/due")} className="flex flex-col justify-start rounded-xl bg-card px-3 py-2 text-left min-[700px]:px-4 min-[700px]:py-3" aria-label={`Due: ${due.length}`}>
          <p className={cn(num, due.length > 0 && "text-link")}>{due.length}</p>
          <p className={label}>Due</p>
        </button>
      </div>

      {/* iPhone: the stages and their counts, a tap away. */}
      <nav aria-label="Stages" className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 min-[900px]:hidden">
        {stages.map((s) => (
          <button key={s.id} type="button" onClick={() => jump(s.id)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-muted px-3.5 text-[0.875rem] font-medium">
            {s.name}<span className="tabular-nums text-muted-foreground">{byStage(s.id).length}</span>
          </button>
        ))}
      </nav>

      <div ref={board} data-testid="board"
        className={cn("-mx-4 flex items-start scroll-px-4 gap-3 overflow-x-auto px-4 pb-6 min-[900px]:mx-0 min-[900px]:grid min-[900px]:snap-none min-[900px]:px-0",
          // Snapping would jump a whole stage while a card is dragged near the edge.
          !ghost && "snap-x snap-mandatory")}
        style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(168px, 1fr))` }}>
        {stages.map((s) => {
          const col = byStage(s.id)
          const over = ghost?.over === s.id
          return (
            <section key={s.id} data-stage={s.id} role="region" aria-label={s.name}
              className={cn("flex min-h-40 w-[84%] max-w-[340px] shrink-0 snap-start flex-col gap-2 rounded-2xl bg-muted/60 p-2 transition-shadow min-[600px]:w-[300px] min-[900px]:w-auto min-[900px]:max-w-none",
                over && "ring-2 ring-[var(--amber-accent)]")}>
              {/* The cards are the column's own rows (no list around them), so a column cut short
                  (the Mac library's stage) ends after its last whole card. */}
              <header className="flex items-center gap-2 pl-2">
                <h2 className="flex-1 text-[0.9375rem] font-semibold">{s.name} <span className="font-normal tabular-nums text-muted-foreground" data-testid={`count-${s.id}`}>{col.length}</span></h2>
                <button type="button" aria-label={`Add to ${s.name}`} onClick={() => { setAddTo(s.id); setEditing("new") }}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent"><Plus className="size-4" /></button>
              </header>
              {col.map((j, i) => (
                <div key={j.id} className="flex flex-col gap-2">
                  {over && ghost!.index === i && ghost!.id !== j.id && <div className="h-0.5 rounded-full bg-[var(--amber-accent)]" />}
                  <Card job={j} now={now} dragging={ghost?.id === j.id} ghost={ghost?.id === j.id ? ghost : null}
                    onPointerDown={(e) => down(e, j.id)}
                    onOpen={() => { if (!justDragged.current) route(`/job/${encodeURIComponent(j.id)}`) }}
                    onMove={() => setMoving(j)} />
                </div>
              ))}
              {over && ghost!.index >= col.filter((j) => j.id !== ghost!.id).length && <div className="h-0.5 rounded-full bg-[var(--amber-accent)]" />}
              {!col.length && (
                <p className="px-2 py-3 text-center text-[0.8125rem] text-muted-foreground">
                  {s.id === first && !jobs.length ? "Add a job, or paste an ad to your AI." : "Drag a card here."}
                </p>
              )}
            </section>
          )
        })}
      </div>
      <JobSheet editing={editing} stage={addTo} onClose={() => setEditing(null)} />
      <MoveSheet job={moving} onClose={() => setMoving(null)} />
    </>
  )
}

function Card({ job, now, dragging, ghost, onPointerDown, onOpen, onMove }: {
  job: Job; now: string; dragging: boolean; ghost: Ghost | null
  onPointerDown: (e: React.PointerEvent) => void; onOpen: () => void; onMove: () => void
}) {
  const step = nextStep(job)
  const late = step ? between(step.date, now) : -1
  return (
    <div data-job={job.id} onPointerDown={onPointerDown}
      className={cn("relative select-none rounded-xl bg-card dark:bg-muted shadow-[0_1px_2px_rgb(0_0_0/0.06)] [touch-action:manipulation] [-webkit-touch-callout:none]",
        dragging && "z-30 shadow-xl ring-2 ring-[var(--amber-accent)] pointer-events-none")}
      style={ghost ? { transform: `translate(${ghost.dx}px, ${ghost.dy}px) rotate(1.5deg)` } : undefined}>
      <button type="button" onClick={onOpen} aria-label={`${job.company}${job.role ? `, ${job.role}` : ""}`} className="block w-full px-3 py-2.5 text-left">
        <p className="pr-8 font-semibold leading-snug">{job.company}</p>
        {job.role && <p className="text-[0.875rem] leading-snug text-muted-foreground">{job.role}</p>}
        {job.stage === "closed" ? (
          job.outcome && <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">{outcomeLabel(job.outcome)}</p>
        ) : step && (
          <div className={cn("mt-2 flex gap-1.5 text-[0.8125rem] leading-snug", late >= 0 ? "text-link" : "text-muted-foreground")} data-testid="next-step">
            <CalendarClock className="mt-px size-3.5 shrink-0" />
            <p className="min-w-0"><span className="block">{step.what ? stepName(step) : kindLabel(step.kind)}</span><span className="block font-semibold">{when(step, now)}</span></p>
          </div>
        )}
        {job.salary && job.stage !== "closed" && <p className="mt-1 text-[0.8125rem] text-muted-foreground">{job.salary}</p>}
      </button>
      <button type="button" data-no-drag aria-label={`Move ${job.company}`} onClick={onMove}
        className="absolute right-0 top-0 grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-accent mouse:right-1 mouse:top-1 mouse:size-8 mouse:rounded-lg">
        <ArrowRightLeft className="size-4" />
      </button>
    </div>
  )
}
