import { useState } from "react"
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react"
import { Field, inputClass, offerUndo, PrimaryButton, Row, Section, Sheet, Title } from "@/components/kit"
import { slug, useJobs, type Stage } from "@/lib/jobs"
import { cn } from "@/lib/utils"

const FOLLOW_UPS = [0, 3, 5, 7, 10, 14]

// The board's stages (add, rename, reorder, remove) and when to follow up after applying.
export default function Settings() {
  const { stages, jobs, settings, setStages, setSettings, restore, moveAll, byStage } = useJobs()
  const [editing, setEditing] = useState<Stage | "new" | null>(null)
  const [name, setName] = useState("")
  const open = (s: Stage | "new") => { setName(s === "new" ? "" : s.name); setEditing(s) }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = name.trim()
    if (!n || !editing) return
    if (editing === "new") {
      let id = slug(n), k = 2
      while (stages.some((s) => s.id === id)) id = `${slug(n)}-${k++}`
      // A new stage goes before Closed, where the steps of a hunt are.
      const at = stages.findIndex((s) => s.id === "closed")
      const all = [...stages]
      all.splice(at < 0 ? all.length : at, 0, { id, name: n })
      await setStages(all)
    } else await setStages(stages.map((s) => (s.id === editing.id ? { ...s, name: n } : s)))
    setEditing(null)
  }
  const shift = (i: number, by: -1 | 1) => {
    const all = [...stages], [s] = all.splice(i, 1)
    all.splice(i + by, 0, s)
    return setStages(all)
  }
  /** Removes a stage. Its applications move to the stage before it (the next one for the first), and
   *  Undo puts both back. */
  const drop = async (s: Stage, i: number) => {
    const beforeStages = stages, beforeJobs = jobs
    const to = stages[i - 1] ?? stages[i + 1]
    const moved = byStage(s.id).length
    await setStages(stages.filter((x) => x.id !== s.id))
    if (moved) await moveAll(s.id, to.id)
    offerUndo(moved ? `Removed ${s.name}. ${moved === 1 ? "Its application" : `Its ${moved} applications`} moved to ${to.name}.` : `Removed ${s.name}`,
      async () => { await setStages(beforeStages); if (moved) await restore(beforeJobs) })
  }

  return (
    <div className="max-w-2xl">
      <Title title="Settings" />
      <Section title="Stages" action={<button type="button" onClick={() => open("new")} className="inline-flex h-8 items-center gap-1 font-semibold text-link"><Plus className="size-4" /> Add stage</button>}
        footer="The board's columns, left to right. Removing one moves its applications to the stage before it.">
        {stages.map((s, i) => (
          <Row key={s.id} className="gap-0 pr-1">
            <button type="button" aria-label={`Rename ${s.name}`} onClick={() => open(s)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
              <span className="min-w-0 flex-1 font-medium">{s.name} <span className="font-normal tabular-nums text-muted-foreground">{byStage(s.id).length}</span></span>
              <Pencil className="mr-1 size-4 shrink-0 text-muted-foreground" />
            </button>
            <button type="button" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => shift(i, -1)} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><ChevronUp className="size-5" /></button>
            <button type="button" aria-label={`Move ${s.name} down`} disabled={i === stages.length - 1} onClick={() => shift(i, 1)} className="grid size-11 place-items-center rounded-full text-muted-foreground disabled:opacity-25"><ChevronDown className="size-5" /></button>
            <button type="button" aria-label={`Remove ${s.name}`} disabled={stages.length < 2} onClick={() => drop(s, i)} className="grid size-11 place-items-center rounded-full text-destructive disabled:opacity-25"><Trash2 className="size-5" /></button>
          </Row>
        ))}
      </Section>

      <Section title="Follow up" footer="When you move an application to Applied, a follow-up is added this many days later. It shows under Due on the day.">
        <div role="radiogroup" aria-label="Follow up after" className="flex flex-wrap gap-2 p-3">
          {FOLLOW_UPS.map((n) => (
            <button key={n} type="button" role="radio" aria-checked={settings.followUpDays === n} onClick={() => setSettings({ ...settings, followUpDays: n })}
              className={cn("h-11 rounded-full px-4 text-[0.9375rem] font-medium", settings.followUpDays === n ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
              {n === 0 ? "Off" : `${n} days`}
            </button>
          ))}
        </div>
      </Section>

      <Sheet open={editing !== null} title={editing === "new" ? "New stage" : "Rename stage"} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <Field label="Name" htmlFor="st-name"><input id="st-name" className={inputClass} placeholder="Phone screen" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
          <PrimaryButton type="submit" disabled={!name.trim()}>{editing === "new" ? "Add stage" : "Save"}</PrimaryButton>
        </form>
      </Sheet>
    </div>
  )
}
