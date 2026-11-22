import { useEffect, useLayoutEffect, useState } from "react"
import { Check, ChevronDown, ChevronUp, Minus, Pencil, Plus, Trash2 } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Row, Section, Sheet, Title, TintButton } from "@/components/kit"
import { useWorkouts, type Exercise, type Units, type Workout } from "@/lib/workouts"
import { cn } from "@/lib/utils"

const KINDS = ["Weights", "Cardio"] as const
const UNITS = ["kg", "lb"] as const

// The plan and everything the person keeps: the workouts in the order they're done (Today shows the
// one after the last session), the exercises (renaming keeps their history), the units and the
// weekly goal. Removing shows Undo.
export default function Plan() {
  const w = useWorkouts()
  const [workout, setWorkout] = useState<Workout | "new" | null>(null)
  const [exercise, setExercise] = useState<Exercise | "new" | null>(null)
  // The goal as shown, ahead of the store while a change is saved, so quick taps add up.
  const [goal, setGoal] = useState(w.goal)
  useEffect(() => setGoal(w.goal), [w.goal])
  const step = (by: number) => { const v = Math.max(1, Math.min(14, goal + by)); setGoal(v); return w.setGoal(v) }
  const name = (id: string) => w.exercise(id).name
  const dropWorkout = async (x: Workout) => {
    const before = w.plan
    await w.removeWorkout(x.id)
    offerUndo(`Removed ${x.name}`, () => w.restore({ plan: before }))
  }
  const dropExercise = async (x: Exercise) => {
    const before = { exercises: w.exercises, plan: w.plan }
    await w.removeExercise(x.id)
    offerUndo(`Removed ${x.name}`, () => w.restore(before))
  }
  const icon = "grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground disabled:opacity-25"

  return (
    <>
      <Title title="Plan" />
      <div className="min-[1100px]:grid min-[1100px]:grid-cols-2 min-[1100px]:items-start min-[1100px]:gap-6">
        <div>
          <Section title="Workouts" action={<TintButton aria-label="New workout" className="-my-2 h-11 bg-transparent px-2 text-[0.9375rem]" onClick={() => setWorkout("new")}><Plus /> Add</TintButton>}
            footer="In the order you do them. Today shows the one after your last session.">
            {w.plan.map((x, i) => (
              <Row key={x.id} className="gap-0 pr-1">
                <span className="mr-3 w-5 shrink-0 text-center font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                <button type="button" aria-label={`Edit ${x.name}`} onClick={() => setWorkout(x)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{x.name}</p>
                    <p className="truncate text-[0.875rem] text-muted-foreground">{x.exercises.map(name).join(", ") || "No exercises yet"}</p>
                  </div>
                  <Pencil className="mr-1 size-4 shrink-0 text-muted-foreground" />
                </button>
                <button type="button" aria-label={`Move ${x.name} up`} disabled={i === 0} onClick={() => w.moveWorkout(x.id, -1)} className={icon}><ChevronUp className="size-5" /></button>
                <button type="button" aria-label={`Move ${x.name} down`} disabled={i === w.plan.length - 1} onClick={() => w.moveWorkout(x.id, 1)} className={icon}><ChevronDown className="size-5" /></button>
                <button type="button" aria-label={`Remove ${x.name}`} onClick={() => dropWorkout(x)} className={cn(icon, "text-destructive")}><Trash2 className="size-5" /></button>
              </Row>
            ))}
            {!w.plan.length && <p className="px-4 py-6 text-center text-muted-foreground">No workouts yet. Add the ones you do, like Legs, Push and Pull.</p>}
          </Section>

          <Section title="Settings">
            <Row>
              <span className="flex-1 font-medium">Units</span>
              <Pills label="Units" options={UNITS} value={w.units} onChange={(v) => w.setUnits(v as Units)} />
            </Row>
            <Row>
              <span className="flex-1 font-medium">Sessions a week</span>
              <button type="button" aria-label="Fewer sessions a week" disabled={goal <= 1} onClick={() => step(-1)} className={cn(icon, "bg-muted text-foreground")}><Minus className="size-5" /></button>
              <span className="w-8 text-center text-[1.0625rem] font-semibold tabular-nums" data-testid="goal">{goal}</span>
              <button type="button" aria-label="More sessions a week" disabled={goal >= 14} onClick={() => step(1)} className={cn(icon, "bg-muted text-foreground")}><Plus className="size-5" /></button>
            </Row>
          </Section>
        </div>

        <Section title="Exercises" action={<TintButton aria-label="New exercise" className="-my-2 h-11 bg-transparent px-2 text-[0.9375rem]" onClick={() => setExercise("new")}><Plus /> Add</TintButton>}
          footer="Renaming an exercise keeps its sessions and bests. Removing one takes it out of the plan; its sessions are kept.">
          {w.exercises.map((x, i) => (
            <Row key={x.id} className="gap-0 pr-1">
              <button type="button" aria-label={`Edit ${x.name}`} onClick={() => setExercise(x)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{x.name}</p>
                  <p className="text-[0.875rem] text-muted-foreground">{x.kind === "cardio" ? "Distance and time" : "Reps and weight"}</p>
                </div>
                <Pencil className="mr-1 size-4 shrink-0 text-muted-foreground" />
              </button>
              <button type="button" aria-label={`Move ${x.name} up`} disabled={i === 0} onClick={() => w.moveExercise(x.id, -1)} className={icon}><ChevronUp className="size-5" /></button>
              <button type="button" aria-label={`Move ${x.name} down`} disabled={i === w.exercises.length - 1} onClick={() => w.moveExercise(x.id, 1)} className={icon}><ChevronDown className="size-5" /></button>
              <button type="button" aria-label={`Remove ${x.name}`} onClick={() => dropExercise(x)} className={cn(icon, "text-destructive")}><Trash2 className="size-5" /></button>
            </Row>
          ))}
          {!w.exercises.length && <p className="px-4 py-6 text-center text-muted-foreground">No exercises yet.</p>}
        </Section>
      </div>
      <WorkoutEditor editing={workout} onClose={() => setWorkout(null)} onRemove={dropWorkout} />
      <ExerciseEditor editing={exercise} onClose={() => setExercise(null)} onRemove={dropExercise} />
    </>
  )
}

// A workout: its name and which exercises it has, in the order they're ticked.
function WorkoutEditor({ editing, onClose, onRemove }: { editing: Workout | "new" | null; onClose: () => void; onRemove: (w: Workout) => unknown }) {
  const w = useWorkouts()
  const [name, setName] = useState("")
  const [picked, setPicked] = useState<string[]>([])
  useLayoutEffect(() => {
    if (!editing) return
    setName(editing === "new" ? "" : editing.name); setPicked(editing === "new" ? [] : editing.exercises)
  }, [editing])
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !editing) return
    // In the order they were ticked: the number beside each says where it comes.
    const list = picked
    if (editing === "new") await w.addWorkout(name, list)
    else await w.updateWorkout(editing.id, { name: name.trim(), exercises: list })
    onClose()
  }
  const toggle = (id: string) => setPicked(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id])
  return (
    <Sheet open={editing !== null} title={editing === "new" ? "New workout" : "Edit workout"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Name" htmlFor="w-name"><input id="w-name" className={inputClass} placeholder="Legs" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
        <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Exercises</p>
        <div className="mb-4 overflow-hidden rounded-xl bg-card">
          {w.exercises.map((x) => {
            const on = picked.includes(x.id)
            return (
              <Row key={x.id} className="p-0">
                <button type="button" role="checkbox" aria-checked={on} aria-label={x.name} onClick={() => toggle(x.id)} className="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left">
                  <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", on ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}><Check className="size-3.5" strokeWidth={3} /></span>
                  <span className="min-w-0 flex-1 truncate">{x.name}</span>
                  {on && <span className="text-[0.8125rem] tabular-nums text-muted-foreground">{picked.indexOf(x.id) + 1}</span>}
                </button>
              </Row>
            )
          })}
        </div>
        <PrimaryButton type="submit" disabled={!name.trim()}>{editing === "new" ? "Add workout" : "Save"}</PrimaryButton>
        {editing && editing !== "new" && <DeleteButton onClick={() => { onClose(); onRemove(editing) }}>Remove workout</DeleteButton>}
      </form>
    </Sheet>
  )
}

// An exercise: its name and whether it's sets of reps and weight or distance and time.
function ExerciseEditor({ editing, onClose, onRemove }: { editing: Exercise | "new" | null; onClose: () => void; onRemove: (x: Exercise) => unknown }) {
  const w = useWorkouts()
  const [name, setName] = useState("")
  const [kind, setKind] = useState<(typeof KINDS)[number]>("Weights")
  useLayoutEffect(() => {
    if (!editing) return
    setName(editing === "new" ? "" : editing.name); setKind(editing !== "new" && editing.kind === "cardio" ? "Cardio" : "Weights")
  }, [editing])
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !editing) return
    const k = kind === "Cardio" ? "cardio" : "weight"
    if (editing === "new") await w.addExercise(name, k)
    else await w.updateExercise(editing.id, { name: name.trim(), kind: k })
    onClose()
  }
  return (
    <Sheet open={editing !== null} title={editing === "new" ? "New exercise" : "Edit exercise"} onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Name" htmlFor="x-name"><input id="x-name" className={inputClass} placeholder="Hip thrust" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
        <div className="mb-5">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Logged as</p>
          <Pills label="Kind" options={KINDS} value={kind} onChange={setKind} />
          <p className="mt-2 text-[0.8125rem] text-muted-foreground">{kind === "Cardio" ? "Each set is a distance and a time." : "Each set is reps and a weight. Leave the weight out for bodyweight."}</p>
        </div>
        <PrimaryButton type="submit" disabled={!name.trim()}>{editing === "new" ? "Add exercise" : "Save"}</PrimaryButton>
        {editing && editing !== "new" && <DeleteButton onClick={() => { onClose(); onRemove(editing) }}>Remove exercise</DeleteButton>}
      </form>
    </Sheet>
  )
}
