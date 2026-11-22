import { useLayoutEffect, useState } from "react"
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Sheet, TintButton } from "@/components/kit"
import { distIn, distUnit, kgFrom, kmFrom, newBests, num, parseTime, timeText, weightIn, useWorkouts, type Item, type Kind, type Session, type Units, type WorkSet } from "@/lib/workouts"
import { cn } from "@/lib/utils"

// Log a session or change one: its name and date, each exercise's sets (reps and weight, or
// distance and time), how hard it felt and a note. Exercises can be added (or made), moved and
// taken out; sets added and removed. Delete is at the bottom, with Undo.
type DSet = { key: number; a: string; b: string }
type DItem = { key: number; exercise: string; sets: DSet[] }
let keys = 0
const toDraft = (s: WorkSet, kind: Kind, u: Units): DSet => kind === "cardio"
  ? { key: keys++, a: s.km ? String(distIn(s.km, u)) : "", b: s.min ? timeText(s.min) : "" }
  : { key: keys++, a: s.reps ? String(s.reps) : "", b: s.kg ? String(weightIn(s.kg, u)) : "" }
function fromDraft(d: DSet, kind: Kind, u: Units): WorkSet | null {
  if (kind === "cardio") {
    const km = num(d.a), min = parseTime(d.b)
    const out: WorkSet = {}
    if (km > 0) out.km = kmFrom(km, u)
    if (min) out.min = min
    return out.km || out.min ? out : null
  }
  const reps = Math.round(num(d.a)), kg = num(d.b)
  if (!(reps > 0)) return null
  return kg > 0 ? { reps, kg: kgFrom(kg, u) } : { reps }
}
const EFFORT = ["", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]
const KINDS = ["Weights", "Cardio"] as const

export function SessionSheet({ editing, onClose }: { editing: Session | null; onClose: () => void }) {
  const w = useWorkouts()
  const { units: u } = w
  const [name, setName] = useState("")
  const [date, setDate] = useState("")
  const [effort, setEffort] = useState("")
  const [note, setNote] = useState("")
  const [items, setItems] = useState<DItem[]>([])
  const [making, setMaking] = useState(false)
  const [newName, setNewName] = useState("")
  const [newKind, setNewKind] = useState<(typeof KINDS)[number]>("Weights")
  const isNew = !!editing && !w.sessions.some((s) => s.id === editing.id)
  useLayoutEffect(() => {
    if (!editing) return
    setName(editing.name ?? ""); setDate(editing.date); setEffort(editing.effort ? String(editing.effort) : ""); setNote(editing.note ?? "")
    setItems((editing.items ?? []).map((it) => {
      const kind = w.exercise(it.exercise).kind
      return { key: keys++, exercise: it.exercise, sets: it.sets.length ? it.sets.map((s) => toDraft(s, kind, u)) : [{ key: keys++, a: "", b: "" }] }
    }))
    setMaking(false); setNewName("")
  }, [editing])
  if (!editing) return null

  const kindOf = (id: string) => w.exercise(id).kind
  const change = (key: number, f: (it: DItem) => DItem | null) => setItems(items.flatMap((it) => (it.key === key ? [f(it)].filter(Boolean) as DItem[] : [it])))
  const addItem = (exercise: string) => setItems([...items, { key: keys++, exercise, sets: [{ key: keys++, a: "", b: "" }] }])
  const moveItem = (i: number, by: number) => { const n = items.slice(); [n[i], n[i + by]] = [n[i + by], n[i]]; setItems(n) }
  const makeExercise = () => {
    if (!newName.trim()) return
    addItem(w.addExercise(newName, newKind === "Cardio" ? "cardio" : "weight"))
    setMaking(false); setNewName("")
  }
  const unused = w.exercises.filter((e) => !items.some((it) => it.exercise === e.id))

  const built = (): Session => {
    const list: Item[] = items.map((it) => ({ exercise: it.exercise, sets: it.sets.map((s) => fromDraft(s, kindOf(it.exercise), u)).filter(Boolean) as WorkSet[] })).filter((it) => it.sets.length)
    const e = Math.round(num(effort))
    const out: Session = { id: editing.id, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : editing.date, name: name.trim() || "Workout", items: list }
    if (editing.workout) out.workout = editing.workout
    if (e >= 1 && e <= 10) out.effort = e
    if (note.trim()) out.note = note.trim()
    return out
  }
  const save = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const s = built()
    onClose()
    await w.saveSession(s)
    if (isNew) {
      const after = [...w.sessions, s]
      const bests = newBests(w.exercises, after).get(s.id) ?? []
      offerUndo(`Logged ${s.name}.${bests.length ? ` New best: ${bests.join(", ")}.` : ""}`, () => w.removeSession(s.id))
    }
  }
  const drop = async () => {
    const before = w.sessions
    onClose()
    await w.removeSession(editing.id)
    offerUndo(`Deleted ${editing.name || "the session"}`, () => w.restoreSessions(before))
  }

  return (
    <Sheet open title={isNew ? "Log session" : "Edit session"} onClose={onClose}>
      <form onSubmit={save}>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1"><Field label="Workout" htmlFor="s-name"><input id="s-name" className={inputClass} placeholder="Legs" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field></div>
          <div className="w-40 shrink-0"><Field label="Date" htmlFor="s-date"><input id="s-date" type="date" className={inputClass} value={date} onInput={(e) => setDate(e.currentTarget.value)} /></Field></div>
        </div>

        {items.map((it, i) => {
          const ex = w.exercise(it.exercise), cardio = ex.kind === "cardio"
          return (
            <section key={it.key} className="mb-4 rounded-xl bg-card px-3 pb-3 pt-1.5" aria-label={ex.name}>
              <div className="flex items-center gap-0.5">
                <h3 className="min-w-0 flex-1 truncate pl-1 font-semibold">{ex.name}</h3>
                <button type="button" aria-label={`Move ${ex.name} up`} disabled={i === 0} onClick={() => moveItem(i, -1)} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><ChevronUp className="size-5" /></button>
                <button type="button" aria-label={`Move ${ex.name} down`} disabled={i === items.length - 1} onClick={() => moveItem(i, 1)} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><ChevronDown className="size-5" /></button>
                <button type="button" aria-label={`Take ${ex.name} out`} onClick={() => change(it.key, () => null)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><X className="size-5" /></button>
              </div>
              <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-x-2 gap-y-2">
                <span />
                <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground">{cardio ? distUnit(u) : "Reps"}</span>
                <span className="text-[0.75rem] font-semibold uppercase tracking-wide text-muted-foreground">{cardio ? "Time" : u}</span>
                <span />
                {it.sets.map((s, j) => {
                  const n = j + 1, set = (patch: Partial<DSet>) => change(it.key, (x) => ({ ...x, sets: x.sets.map((y) => (y.key === s.key ? { ...y, ...patch } : y)) }))
                  return [
                    <span key={`${s.key}n`} className="text-center text-[0.9375rem] font-semibold tabular-nums text-muted-foreground">{n}</span>,
                    <input key={`${s.key}a`} aria-label={`${ex.name} set ${n} ${cardio ? "distance" : "reps"}`} inputMode="decimal" className={cn(inputClass, "tabular-nums")} placeholder={cardio ? "5" : "5"} value={s.a} onInput={(e) => set({ a: e.currentTarget.value })} />,
                    <input key={`${s.key}b`} aria-label={`${ex.name} set ${n} ${cardio ? "time" : "weight"}`} inputMode={cardio ? "text" : "decimal"} className={cn(inputClass, "tabular-nums")} placeholder={cardio ? "29:30" : u === "lb" ? "135" : "60"} value={s.b} onInput={(e) => set({ b: e.currentTarget.value })} />,
                    <button key={`${s.key}x`} type="button" aria-label={`Remove set ${n} of ${ex.name}`} disabled={it.sets.length === 1} onClick={() => change(it.key, (x) => ({ ...x, sets: x.sets.filter((y) => y.key !== s.key) }))} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><Trash2 className="size-[18px]" /></button>,
                  ]
                })}
              </div>
              <button type="button" onClick={() => change(it.key, (x) => ({ ...x, sets: [...x.sets, { ...(x.sets[x.sets.length - 1] ?? { a: "", b: "" }), key: keys++ }] }))}
                aria-label={`Add a set to ${ex.name}`} className="mt-2 inline-flex h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-link"><Plus className="size-[18px]" /> Add set</button>
              {!cardio && <p className="px-2 text-[0.8125rem] text-muted-foreground">No weight is bodyweight.</p>}
            </section>
          )
        })}

        {!making ? (
          <Field label="Add exercise" htmlFor="s-add">
            <select id="s-add" className={inputClass} value="" onChange={(e) => { const v = e.currentTarget.value; if (v === "new") setMaking(true); else if (v) addItem(v) }}>
              <option value="">Choose an exercise</option>
              {unused.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              <option value="new">New exercise…</option>
            </select>
          </Field>
        ) : (
          <div className="mb-4 rounded-xl bg-card p-3">
            <Field label="New exercise" htmlFor="s-new"><input id="s-new" className={inputClass} placeholder="Hip thrust" value={newName} onInput={(e) => setNewName(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); makeExercise() } }} /></Field>
            <Pills label="Kind" options={KINDS} value={newKind} onChange={setNewKind} />
            <div className="mt-3 flex gap-2">
              <TintButton type="button" disabled={!newName.trim()} onClick={makeExercise}><Plus /> Add {newName.trim() || "exercise"}</TintButton>
              <button type="button" onClick={() => setMaking(false)} className="h-11 rounded-xl px-3 font-semibold text-muted-foreground">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <div className="w-40 shrink-0">
            <Field label="How hard (1 to 10)" htmlFor="s-effort">
              <select id="s-effort" className={inputClass} value={effort} onChange={(e) => setEffort(e.currentTarget.value)}>
                {EFFORT.map((v) => <option key={v} value={v}>{v || "Not set"}</option>)}
              </select>
            </Field>
          </div>
          <div className="min-w-0 flex-1"><Field label="Note" htmlFor="s-note"><input id="s-note" className={inputClass} placeholder="Felt strong" value={note} onInput={(e) => setNote(e.currentTarget.value)} /></Field></div>
        </div>
        <PrimaryButton type="submit">{isNew ? "Log session" : "Save"}</PrimaryButton>
        {!isNew && <DeleteButton onClick={drop}>Delete session</DeleteButton>}
      </form>
    </Sheet>
  )
}
