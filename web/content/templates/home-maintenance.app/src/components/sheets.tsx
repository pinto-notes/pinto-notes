import { useLayoutEffect, useState, type ReactNode } from "react"
import { Check, ChevronRight, Plus } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Sheet, TintButton } from "@/components/kit"
import {
  everyLabel, isDate, newId, parseEvery, readAmount, SEASONS, shortDate, today, useHome, webAddress, writeEvery,
  type Appliance, type Contact, type Detail, type Done, type Job, type Unit,
} from "@/lib/home"
import { cn } from "@/lib/utils"

// Every sheet in the app, opened from any screen: a job (add, edit, its history), a time a job was
// done, an appliance, a home detail, a contact. One open at a time; the screens call edit.*.
type Open =
  | { kind: "job"; job?: Job; area?: string }
  | { kind: "done"; done?: Done; job?: string }
  | { kind: "appliance"; appliance?: Appliance }
  | { kind: "detail"; detail?: Detail }
  | { kind: "contact"; contact?: Contact }
let open: Open | null = null
const subs = new Set<(o: Open | null) => void>()
const set = (o: Open | null) => { open = o; subs.forEach((f) => f(o)) }
export const edit = {
  job: (job?: Job, area?: string) => set({ kind: "job", job, area }),
  done: (done?: Done, job?: string) => set({ kind: "done", done, job }),
  appliance: (appliance?: Appliance) => set({ kind: "appliance", appliance }),
  detail: (detail?: Detail) => set({ kind: "detail", detail }),
  contact: (contact?: Contact) => set({ kind: "contact", contact }),
  close: () => set(null),
}

export function Sheets() {
  const [o, setO] = useState<Open | null>(open)
  useLayoutEffect(() => { subs.add(setO); setO(open); return () => { subs.delete(setO) } }, [])
  if (!o) return null
  if (o.kind === "job") return <JobSheet key={o.job?.id ?? "new"} job={o.job} area={o.area} />
  if (o.kind === "done") return <DoneSheet key={o.done?.id ?? "new"} done={o.done} jobId={o.job} />
  if (o.kind === "appliance") return <ApplianceSheet key={o.appliance?.id ?? "new"} appliance={o.appliance} />
  if (o.kind === "detail") return <DetailSheet key={o.detail?.id ?? "new"} detail={o.detail} />
  return <ContactSheet key={o.contact?.id ?? "new"} contact={o.contact} />
}

/** Marks a job done today, with Undo, and says when it's due next. */
export async function markDone(h: ReturnType<typeof useHome>, job: Job) {
  const before = h.snapshot()
  const next = await h.markDone(job.id)
  const cost = job.cost !== undefined ? `, ${h.money(job.cost)}` : ""
  const when = !next ? "" : next.season ? ` Next: ${next.season} ${next.date.slice(0, 4)}.` : ` Next: ${shortDate(next.date, h.now)}.`
  offerUndo(`${job.name} done today${cost}.${when}`, () => h.restore(before))
}

const optional = (s: string) => (s.trim() ? s.trim() : undefined)
/** An object without its empty fields, as data.json keeps it. */
const tidy = <T extends object>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== "")) as T
const costLabel = (label: string, currency: string) => (currency ? `${label} (${currency})` : label)

// MARK: a job

const UNITS: { value: Unit | (typeof SEASONS)[number]; label: string }[] = [
  { value: "week", label: "Weeks" }, { value: "month", label: "Months" }, { value: "year", label: "Years" },
  { value: "spring", label: "Spring (March to May)" }, { value: "summer", label: "Summer (June to August)" },
  { value: "autumn", label: "Autumn (September to November)" }, { value: "winter", label: "Winter (December to February)" },
]

function JobSheet({ job, area }: { job?: Job; area?: string }) {
  const h = useHome()
  const isNew = !job
  const often = parseEvery(job?.every) ?? { n: 3, unit: "month" as Unit }
  const [name, setName] = useState(job?.name ?? "")
  const [where, setWhere] = useState(job?.area ?? area ?? "")
  const [n, setN] = useState("season" in often ? "1" : String(often.n))
  const [unit, setUnit] = useState<string>("season" in often ? often.season : often.unit)
  const [last, setLast] = useState(job?.last ?? "")
  const [contact, setContact] = useState(job?.contact ?? "")
  const [cost, setCost] = useState(job?.cost !== undefined ? String(job.cost) : "")
  const [note, setNote] = useState(job?.note ?? "")
  const season = (SEASONS as readonly string[]).includes(unit)
  const count = Number(n)
  const ok = !!name.trim() && (season || (Number.isInteger(count) && count > 0))
  const view = job ? h.job(job.id) : undefined
  const done = job ? h.historyOf(job.id) : []

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const every = writeEvery(season ? { season: unit as (typeof SEASONS)[number] } : { n: count, unit: unit as Unit })
    await h.saveJob(tidy({ id: job?.id ?? newId("j"), name: name.trim(), area: optional(where), every, last: isDate(last) ? last : undefined, contact: optional(contact), cost: readAmount(cost), note: optional(note) }))
    edit.close()
  }
  const remove = async () => {
    const before = h.snapshot()
    edit.close()
    await h.removeJob(job!.id)
    offerUndo(`Deleted ${job!.name}`, () => h.restore(before))
  }

  return (
    <Sheet open title={isNew ? "New job" : "Edit job"} onClose={edit.close}>
      <form onSubmit={save}>
        <Field label="Job" htmlFor="j-name"><input id="j-name" className={inputClass} placeholder="Clear the gutters" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
        <Field label="Area" htmlFor="j-area">
          <select id="j-area" className={inputClass} value={h.areas.includes(where) ? where : ""} onChange={(e) => setWhere(e.currentTarget.value)}>
            <option value="">No area</option>
            {h.areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <div className="mb-4">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">How often</p>
          <div className="flex gap-2">
            {!season && <input aria-label="How many" inputMode="numeric" className={cn(inputClass, "w-20 shrink-0 text-center")} value={n} onInput={(e) => setN(e.currentTarget.value)} />}
            <select aria-label="Every" className={cn(inputClass, "min-w-0 flex-1")} value={unit} onChange={(e) => setUnit(e.currentTarget.value)}>
              {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>
        <Field label="Last done" htmlFor="j-last"><input id="j-last" type="date" className={inputClass} value={last} max={today()} onInput={(e) => setLast(e.currentTarget.value)} onChange={(e) => setLast(e.currentTarget.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Who to call" htmlFor="j-contact">
            <select id="j-contact" className={inputClass} value={h.contacts.some((c) => c.id === contact) ? contact : ""} onChange={(e) => setContact(e.currentTarget.value)}>
              <option value="">Nobody</option>
              {h.contacts.map((c) => <option key={c.id} value={c.id}>{c.trade ? `${c.name}, ${c.trade.toLowerCase()}` : c.name}</option>)}
            </select>
          </Field>
          <Field label={costLabel("Usual cost", h.currency)} htmlFor="j-cost"><input id="j-cost" inputMode="decimal" className={inputClass} placeholder="0" value={cost} onInput={(e) => setCost(e.currentTarget.value)} /></Field>
        </div>
        <Field label="Note" htmlFor="j-note"><input id="j-note" className={inputClass} placeholder="Ladder in the shed" value={note} onInput={(e) => setNote(e.currentTarget.value)} /></Field>
        <PrimaryButton type="submit" disabled={!ok}>{isNew ? "Add job" : "Save"}</PrimaryButton>
      </form>
      {job && (
        <div className="mt-6">
          <div className="flex items-end justify-between gap-3 px-1 pb-2">
            <h3 className="text-[0.8125rem] font-semibold uppercase tracking-wide text-muted-foreground">History</h3>
            <span className="text-[0.8125rem] text-muted-foreground">{view?.when ? `Next ${view.when.season ? view.when.season : shortDate(view.when.date, h.now)}` : everyLabel(job.every)}</span>
          </div>
          <div className="overflow-hidden rounded-xl bg-card">
            {done.map((d) => (
              <button key={d.id} type="button" aria-label={`Done ${shortDate(d.date, h.now)}`} onClick={() => edit.done(d)} className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left first:border-t-0">
                <span className="min-w-0 flex-1">
                  <span className="block">{shortDate(d.date, h.now)}</span>
                  {d.note && <span className="block truncate text-[0.8125rem] text-muted-foreground">{d.note}</span>}
                </span>
                {d.cost !== undefined && <span className="tabular-nums text-muted-foreground">{h.money(d.cost)}</span>}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {!done.length && <p className="px-4 py-3 text-[0.9375rem] text-muted-foreground">{view?.lastDone ? `Last done ${shortDate(view.lastDone, h.now)}, before you kept a history here.` : "Not done yet."}</p>}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <TintButton type="button" onClick={async () => { edit.close(); await markDone(h, job) }}><Check /> Done today</TintButton>
            <TintButton type="button" onClick={() => edit.done(undefined, job.id)}><Plus /> Log a time</TintButton>
          </div>
        </div>
      )}
      {job && <DeleteButton onClick={remove}>Delete job</DeleteButton>}
    </Sheet>
  )
}

// MARK: a time a job was done

function DoneSheet({ done, jobId }: { done?: Done; jobId?: string }) {
  const h = useHome()
  const first = done?.job ?? jobId ?? h.jobs[0]?.id ?? ""
  const [job, setJob] = useState(first)
  const [date, setDate] = useState(done?.date ?? today())
  const [cost, setCost] = useState(done?.cost !== undefined ? String(done.cost) : (!done && h.job(first)?.cost !== undefined ? String(h.job(first)!.cost) : ""))
  const [note, setNote] = useState(done?.note ?? "")
  const ok = !!h.job(job) && isDate(date)
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    if (done) await h.saveDone(tidy({ ...done, job, date, cost: readAmount(cost), note: optional(note) }))
    else await h.markDone(job, date, readAmount(cost) ?? null, optional(note))
    edit.close()
    if (!done) offerUndo(`Logged ${h.job(job)!.name}, ${shortDate(date, h.now)}`, () => h.restore(before))
  }
  const before = h.snapshot()
  const remove = async () => {
    const was = h.snapshot()
    edit.close()
    await h.removeDone(done!.id)
    offerUndo(`Removed ${h.job(done!.job)?.name ?? "it"}, ${shortDate(done!.date, h.now)}`, () => h.restore(was))
  }
  // The usual cost comes with the job picked, unless a cost was typed.
  const pick = (id: string) => { const was = h.job(job), next = h.job(id); if (!cost || (was?.cost !== undefined && cost === String(was.cost))) setCost(next?.cost !== undefined ? String(next.cost) : ""); setJob(id) }
  return (
    <Sheet open title={done ? "Edit done" : "Log a job done"} onClose={edit.close}>
      <form onSubmit={save}>
        <Field label="Job" htmlFor="h-job">
          <select id="h-job" className={inputClass} value={job} onChange={(e) => pick(e.currentTarget.value)}>
            {!h.job(job) && <option value="">Pick a job</option>}
            {h.jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor="h-date"><input id="h-date" type="date" className={inputClass} value={date} onInput={(e) => setDate(e.currentTarget.value)} onChange={(e) => setDate(e.currentTarget.value)} /></Field>
          <Field label={costLabel("Cost", h.currency)} htmlFor="h-cost"><input id="h-cost" inputMode="decimal" className={inputClass} placeholder="0" value={cost} onInput={(e) => setCost(e.currentTarget.value)} /></Field>
        </div>
        <Field label="Note" htmlFor="h-note"><input id="h-note" className={inputClass} placeholder="Two downpipes blocked" value={note} onInput={(e) => setNote(e.currentTarget.value)} /></Field>
        <PrimaryButton type="submit" disabled={!ok}>{done ? "Save" : "Log it"}</PrimaryButton>
        {done && <DeleteButton onClick={remove}>Remove from history</DeleteButton>}
      </form>
    </Sheet>
  )
}

// MARK: appliances, details, contacts

/** A sheet of text fields that saves one thing, and deletes it with Undo. */
function FormSheet({ title, ok, onSave, onDelete, deleteLabel, isNew, add, children }: {
  title: string; ok: boolean; onSave: () => unknown; onDelete?: () => unknown; deleteLabel: string; isNew: boolean; add: string; children: ReactNode
}) {
  return (
    <Sheet open title={title} onClose={edit.close}>
      <form onSubmit={async (e) => { e.preventDefault(); if (!ok) return; await onSave(); edit.close() }}>
        {children}
        <PrimaryButton type="submit" disabled={!ok}>{isNew ? add : "Save"}</PrimaryButton>
        {!isNew && onDelete && <DeleteButton onClick={async () => { edit.close(); await onDelete() }}>{deleteLabel}</DeleteButton>}
      </form>
    </Sheet>
  )
}
function Text({ id, label, value, set, placeholder, type = "text", inputMode }: { id: string; label: string; value: string; set: (v: string) => void; placeholder?: string; type?: string; inputMode?: "tel" | "email" | "url" }) {
  return (
    <Field label={label} htmlFor={id}>
      <input id={id} type={type} inputMode={inputMode} className={inputClass} placeholder={placeholder} value={value} onInput={(e) => set(e.currentTarget.value)} onChange={(e) => set(e.currentTarget.value)} />
    </Field>
  )
}

function ApplianceSheet({ appliance: a }: { appliance?: Appliance }) {
  const h = useHome()
  const [f, setF] = useState({ name: a?.name ?? "", area: a?.area ?? "", model: a?.model ?? "", serial: a?.serial ?? "", bought: a?.bought ?? "", warranty: a?.warranty ?? "", manual: a?.manual ?? "", note: a?.note ?? "" })
  const put = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }))
  const manual = webAddress(f.manual)
  return (
    <FormSheet title={a ? "Edit appliance" : "New appliance"} isNew={!a} add="Add appliance" ok={!!f.name.trim()} deleteLabel="Delete appliance"
      onSave={() => h.saveAppliance(tidy({ id: a?.id ?? newId("a"), name: f.name.trim(), area: optional(f.area), model: optional(f.model), serial: optional(f.serial), bought: isDate(f.bought) ? f.bought : undefined, warranty: isDate(f.warranty) ? f.warranty : undefined, manual: optional(manual), note: optional(f.note) }))}
      onDelete={async () => { const before = h.snapshot(); await h.removeAppliance(a!.id); offerUndo(`Deleted ${a!.name}`, () => h.restore(before)) }}>
      <Text id="a-name" label="Name" value={f.name} set={put("name")} placeholder="Dishwasher" />
      <Field label="Area" htmlFor="a-area">
        <select id="a-area" className={inputClass} value={h.areas.includes(f.area) ? f.area : ""} onChange={(e) => put("area")(e.currentTarget.value)}>
          <option value="">No area</option>
          {h.areas.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Text id="a-model" label="Model" value={f.model} set={put("model")} placeholder="Series 4" />
        <Text id="a-serial" label="Serial number" value={f.serial} set={put("serial")} />
        <Text id="a-bought" label="Bought" type="date" value={f.bought} set={put("bought")} />
        <Text id="a-warranty" label="Warranty ends" type="date" value={f.warranty} set={put("warranty")} />
      </div>
      <Text id="a-manual" label="Manual (web address)" inputMode="url" value={f.manual} set={put("manual")} placeholder="bosch-home.com/manuals" />
      <Text id="a-note" label="Note" value={f.note} set={put("note")} placeholder="Filter is under the bottom rack" />
    </FormSheet>
  )
}

function DetailSheet({ detail: d }: { detail?: Detail }) {
  const h = useHome()
  const [name, setName] = useState(d?.name ?? "")
  const [value, setValue] = useState(d?.value ?? "")
  return (
    <FormSheet title={d ? "Edit detail" : "New home detail"} isNew={!d} add="Add detail" ok={!!name.trim()} deleteLabel="Delete detail"
      onSave={() => h.saveDetail({ id: d?.id ?? newId("i"), name: name.trim(), value: value.trim() })}
      onDelete={async () => { const before = h.snapshot(); await h.removeDetail(d!.id); offerUndo(`Deleted ${d!.name}`, () => h.restore(before)) }}>
      <Text id="i-name" label="What" value={name} set={setName} placeholder="Water stopcock" />
      <Text id="i-value" label="Detail" value={value} set={setValue} placeholder="Under the kitchen sink, turn clockwise" />
    </FormSheet>
  )
}

function ContactSheet({ contact: c }: { contact?: Contact }) {
  const h = useHome()
  const [f, setF] = useState({ name: c?.name ?? "", trade: c?.trade ?? "", phone: c?.phone ?? "", email: c?.email ?? "", note: c?.note ?? "" })
  const put = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }))
  return (
    <FormSheet title={c ? "Edit contact" : "New contact"} isNew={!c} add="Add contact" ok={!!f.name.trim()} deleteLabel="Delete contact"
      onSave={() => h.saveContact(tidy({ id: c?.id ?? newId("c"), name: f.name.trim(), trade: optional(f.trade), phone: optional(f.phone), email: optional(f.email), note: optional(f.note) }))}
      onDelete={async () => { const before = h.snapshot(); await h.removeContact(c!.id); offerUndo(`Deleted ${c!.name}`, () => h.restore(before)) }}>
      <Text id="c-name" label="Name" value={f.name} set={put("name")} placeholder="Nordin & Son" />
      <Text id="c-trade" label="What they do" value={f.trade} set={put("trade")} placeholder="Plumber" />
      <div className="grid grid-cols-2 gap-3">
        <Text id="c-phone" label="Phone" type="tel" inputMode="tel" value={f.phone} set={put("phone")} />
        <Text id="c-email" label="Email" type="email" inputMode="email" value={f.email} set={put("email")} />
      </div>
      <Text id="c-note" label="Note" value={f.note} set={put("note")} placeholder="Ask for Sami" />
    </FormSheet>
  )
}
