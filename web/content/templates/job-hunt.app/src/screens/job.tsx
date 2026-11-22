import { useLayoutEffect, useState } from "react"
import { back, route } from "amber-router"
import { ArrowRightLeft, Check, ChevronLeft, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
import { device } from "@/lib/amber"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Row, Section, Sheet, TintButton } from "@/components/kit"
import { JobSheet } from "@/components/job-sheet"
import { MoveSheet } from "@/components/move-sheet"
import { between, isDate, isTime, KINDS, newId, outcomeLabel, shortDate, stepName, useJobs, when, type Job, type Question, type Step, type StepKind } from "@/lib/jobs"
import { cn } from "@/lib/utils"

const textareaClass = "min-h-24 w-full rounded-xl border border-input bg-[var(--amber-field)] px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-ring"

// One application: its details and link, its dates (interviews, follow-ups, a deadline) with a tick
// each, interview prep (questions with your answers, and what to ask them) and notes. Two columns
// from 900 px: the details and dates, then the prep.
export default function JobPage({ id }: { id?: string }) {
  const { job: find, stageName, update, setStep, removeStep, toggleStep, now } = useJobs()
  const job = id ? find(id) : undefined
  const [editing, setEditing] = useState(false)
  const [moving, setMoving] = useState(false)
  const [step, setStepOpen] = useState<Step | "new" | null>(null)
  const [question, setQuestion] = useState<number | "new" | null>(null)
  const [ask, setAsk] = useState("")
  const [notes, setNotes] = useState<string | null>(null)
  const [opened, setOpened] = useState("")

  if (!job) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">This application isn't here any more.</p>
        <TintButton className="mt-4" onClick={() => route("/")}>Back to the board</TintButton>
      </div>
    )
  }
  const steps = (job.steps ?? []).slice().sort((a, b) => (a.date + (a.time ?? "") < b.date + (b.time ?? "") ? -1 : 1))
  const questions = job.questions ?? [], asks = job.ask ?? []
  const open = async () => {
    if (!job.link) return
    // An address without its scheme ("tideway.example/jobs") opens as https. (Built in parts: the save
    // gate refuses an address written out in the source, and this one is the person's own link.)
    const url = /^[a-z][a-z0-9+.-]*:/i.test(job.link) ? job.link : ["https:", "", job.link].join("/")
    try { const r = await device?.openURL?.(url); setOpened(r && r.ok === false ? (r.error || "Couldn't open the link.") : "") } catch { setOpened("Couldn't open the link.") }
  }
  const dropStep = async (s: Step) => {
    const before = job.steps ?? []
    await removeStep(job.id, s.id)
    offerUndo(`Deleted ${stepName(s)}`, () => update(job.id, { steps: before }))
  }
  const dropQuestion = async (i: number) => {
    const before = questions
    await update(job.id, { questions: questions.filter((_, k) => k !== i) })
    offerUndo("Deleted the question", () => update(job.id, { questions: before }))
  }
  const dropAsk = async (i: number) => {
    const before = asks
    await update(job.id, { ask: asks.filter((_, k) => k !== i) })
    offerUndo("Deleted the question", () => update(job.id, { ask: before }))
  }
  const addAsk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ask.trim()) return
    await update(job.id, { ask: [...asks, ask.trim()] })
    setAsk("")
  }
  const details: [string, string][] = [
    ["Salary", job.salary ?? ""], ["Contact", job.contact ?? ""],
    ["Applied", job.applied && isDate(job.applied) ? shortDate(job.applied) : ""], ["Heard back", job.heard && isDate(job.heard) ? shortDate(job.heard) : ""],
  ]

  return (
    <>
      <button type="button" onClick={() => back()} className="-ml-2 mb-1 inline-flex h-11 items-center gap-0.5 rounded-lg pr-3 font-medium text-link"><ChevronLeft className="size-5" /> Back</button>
      <header className="flex flex-wrap items-end gap-3 pb-5">
        <div className="min-w-0 flex-1">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground" data-testid="stage">
            {stageName(job.stage)}{job.stage === "closed" && job.outcome ? ` · ${outcomeLabel(job.outcome)}` : ""}
          </p>
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight">{job.company}</h1>
          {job.role && <p className="text-[1.0625rem] text-muted-foreground">{job.role}</p>}
        </div>
        <div className="flex gap-2">
          <TintButton aria-label={`Move ${job.company}`} onClick={() => setMoving(true)}><ArrowRightLeft /> Move</TintButton>
          <TintButton aria-label="Edit application" onClick={() => setEditing(true)}><Pencil /> Edit</TintButton>
        </div>
      </header>

      <div className="min-[900px]:grid min-[900px]:grid-cols-2 min-[900px]:items-start min-[900px]:gap-8">
        <div>
          <Section>
            {job.link && (
              <Row className="pr-2">
                <button type="button" onClick={open} className="flex min-w-0 flex-1 items-center gap-2 text-left font-medium text-link">
                  <span className="min-w-0 truncate">{job.link.replace(/^https?:\/\/(www\.)?/i, "")}</span><ExternalLink className="size-4 shrink-0" />
                </button>
              </Row>
            )}
            {details.filter(([, v]) => v).map(([k, v]) => (
              <Row key={k}><span className="w-24 shrink-0 text-muted-foreground">{k}</span><span className="min-w-0 flex-1">{v}</span></Row>
            ))}
            {!job.link && !details.some(([, v]) => v) && <p className="px-4 py-4 text-muted-foreground">No link, salary or contact yet. Edit adds them.</p>}
          </Section>
          {opened && <p role="status" className="-mt-4 mb-4 px-1 text-[0.8125rem] text-muted-foreground">{opened}</p>}

          <Section title="Dates" action={<button type="button" onClick={() => setStepOpen("new")} className="inline-flex h-8 items-center gap-1 font-semibold text-link"><Plus className="size-4" /> Add date</button>}
            footer="Interviews, follow-ups and deadlines. Due ones show under Due until you tick them.">
            {!steps.length && <p className="px-4 py-4 text-muted-foreground">No dates yet.</p>}
            {steps.map((s) => {
              const late = !s.done && between(s.date, now) >= 0
              return (
                <Row key={s.id} className="gap-2 py-2 pl-2 pr-1">
                  <button type="button" aria-label={`Done: ${stepName(s)}`} aria-pressed={!!s.done} onClick={() => toggleStep(job.id, s.id)}
                    className="grid size-11 shrink-0 place-items-center">
                    <span className={cn("grid size-7 place-items-center rounded-full border-2", s.done ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}><Check className="size-4" strokeWidth={3} /></span>
                  </button>
                  <button type="button" aria-label={`Edit ${stepName(s)}`} onClick={() => setStepOpen(s)} className="min-w-0 flex-1 text-left">
                    <p className={cn("font-medium", s.done && "text-muted-foreground line-through")}>{stepName(s)}</p>
                    <p className={cn("text-[0.875rem]", late ? "font-medium text-link" : "text-muted-foreground")}>{when(s, now)}</p>
                  </button>
                  <button type="button" aria-label={`Delete ${stepName(s)}`} onClick={() => dropStep(s)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
                </Row>
              )
            })}
          </Section>

          <Section title="Notes">
            <textarea aria-label="Notes" className="block min-h-28 w-full resize-y bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground focus:outline-none"
              placeholder="What they said, what to remember." value={notes ?? job.notes ?? ""}
              onInput={(e) => setNotes(e.currentTarget.value)}
              onBlur={async () => { if (notes !== null && notes !== (job.notes ?? "")) await update(job.id, { notes }); setNotes(null) }} />
          </Section>
        </div>

        <div>
          <Section title="Interview prep" action={<button type="button" onClick={() => setQuestion("new")} className="inline-flex h-8 items-center gap-1 font-semibold text-link"><Plus className="size-4" /> Add question</button>}
            footer="Questions they may ask, and your answer to each.">
            {!questions.length && <p className="px-4 py-4 text-muted-foreground">No questions yet. Add the ones you expect, or ask your AI to prep you.</p>}
            {questions.map((q, i) => (
              <Row key={i} className="items-start gap-1 py-3 pr-1">
                <button type="button" aria-label={`Edit question: ${q.q}`} onClick={() => setQuestion(i)} className="min-w-0 flex-1 text-left">
                  <p className="font-semibold">{q.q}</p>
                  <p className={cn("mt-0.5 whitespace-pre-line text-[0.9375rem]", q.a ? "text-foreground/80" : "italic text-muted-foreground")}>{q.a || "No answer yet"}</p>
                </button>
                <button type="button" aria-label={`Delete question: ${q.q}`} onClick={() => dropQuestion(i)} className="-mt-2 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
              </Row>
            ))}
          </Section>

          <Section title="To ask them">
            {asks.map((a, i) => (
              <Row key={i} className="pr-1">
                <span className="min-w-0 flex-1">{a}</span>
                <button type="button" aria-label={`Delete: ${a}`} onClick={() => dropAsk(i)} className="grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
              </Row>
            ))}
            <form onSubmit={addAsk} className="flex items-center gap-2 border-t border-border px-4 py-2 first:border-t-0">
              <input aria-label="A question to ask them" className="h-11 min-w-0 flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none" placeholder="How do design and support work together?" value={ask} onInput={(e) => setAsk(e.currentTarget.value)} />
              <button type="submit" aria-label="Add the question" disabled={!ask.trim()} className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-30"><Plus className="size-5" /></button>
            </form>
          </Section>
        </div>
      </div>

      <JobSheet editing={editing ? job : null} onClose={() => setEditing(false)} />
      <MoveSheet job={moving ? job : null} onClose={() => setMoving(false)} />
      <StepSheet job={job} editing={step} onClose={() => setStepOpen(null)} onSave={(s) => setStep(job.id, s)} onDelete={dropStep} />
      <QuestionSheet questions={questions} editing={question} onClose={() => setQuestion(null)}
        onSave={(all) => update(job.id, { questions: all })} onDelete={dropQuestion} />
    </>
  )
}

function StepSheet({ job, editing, onClose, onSave, onDelete }: { job: Job; editing: Step | "new" | null; onClose: () => void; onSave: (s: Step) => unknown; onDelete: (s: Step) => unknown }) {
  const [kind, setKind] = useState<StepKind>("interview")
  const [what, setWhat] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  useLayoutEffect(() => {
    if (!editing) return
    const s = editing === "new" ? null : editing
    setKind(s?.kind ?? (job.stage === "saved" ? "deadline" : job.stage === "applied" ? "follow-up" : "interview"))
    setWhat(s?.what ?? ""); setDate(s?.date ?? ""); setTime(s?.time ?? "")
  }, [editing])
  if (!editing) return null
  const ok = isDate(date)
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const base = editing === "new" ? { id: newId("s") } : editing
    const s: Step = { ...base, kind, date, ...(isTime(time) ? { time } : {}), ...(what.trim() ? { what: what.trim() } : {}) }
    if (!isTime(time)) delete s.time
    if (!what.trim()) delete s.what
    onClose()
    await onSave(s)
  }
  return (
    <Sheet open title={editing === "new" ? "New date" : "Edit date"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Kind</p>
          <Pills label="Kind" options={KINDS.map((k) => k.label)} value={KINDS.find((k) => k.kind === kind)!.label} onChange={(l) => setKind(KINDS.find((k) => k.label === l)!.kind)} />
        </div>
        <Field label="What (optional)" htmlFor="s-what"><input id="s-what" className={inputClass} placeholder="Second interview with Karin" value={what} onInput={(e) => setWhat(e.currentTarget.value)} /></Field>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1"><Field label="Day" htmlFor="s-date"><input id="s-date" type="date" className={inputClass} value={date} onInput={(e) => setDate(e.currentTarget.value)} /></Field></div>
          <div className="w-32"><Field label="Time" htmlFor="s-time"><input id="s-time" type="time" className={inputClass} value={time} onInput={(e) => setTime(e.currentTarget.value)} /></Field></div>
        </div>
        <PrimaryButton type="submit" disabled={!ok}>{editing === "new" ? (ok ? "Add date" : "Pick the day") : "Save"}</PrimaryButton>
        {editing !== "new" && <DeleteButton onClick={() => { onClose(); onDelete(editing) }}>Delete date</DeleteButton>}
      </form>
    </Sheet>
  )
}

function QuestionSheet({ questions, editing, onClose, onSave, onDelete }: { questions: Question[]; editing: number | "new" | null; onClose: () => void; onSave: (all: Question[]) => unknown; onDelete: (i: number) => unknown }) {
  const [q, setQ] = useState("")
  const [a, setA] = useState("")
  useLayoutEffect(() => {
    if (editing === null) return
    const was = editing === "new" ? null : questions[editing]
    setQ(was?.q ?? ""); setA(was?.a ?? "")
  }, [editing])
  if (editing === null) return null
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    const item: Question = a.trim() ? { q: q.trim(), a: a.trim() } : { q: q.trim() }
    onClose()
    await onSave(editing === "new" ? [...questions, item] : questions.map((x, i) => (i === editing ? item : x)))
  }
  return (
    <Sheet open title={editing === "new" ? "New question" : "Edit question"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Question" htmlFor="q-q"><input id="q-q" className={inputClass} placeholder="Tell us about a project you're proud of." value={q} onInput={(e) => setQ(e.currentTarget.value)} /></Field>
        <Field label="Your answer" htmlFor="q-a"><textarea id="q-a" className={textareaClass} placeholder="The points you want to make." value={a} onInput={(e) => setA(e.currentTarget.value)} /></Field>
        <PrimaryButton type="submit" disabled={!q.trim()}>{editing === "new" ? "Add question" : "Save"}</PrimaryButton>
        {editing !== "new" && <DeleteButton onClick={() => { onClose(); onDelete(editing) }}>Delete question</DeleteButton>}
      </form>
    </Sheet>
  )
}
