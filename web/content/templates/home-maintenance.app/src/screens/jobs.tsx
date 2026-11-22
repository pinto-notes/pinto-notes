import { useState } from "react"
import { Plus } from "lucide-react"
import { offerUndo, Section, Title, TintButton } from "@/components/kit"
import { JobRow } from "@/components/job-row"
import { ListSection, RenameSheet } from "@/components/list-section"
import { edit } from "@/components/sheets"
import { NO_AREA, useHome } from "@/lib/home"

// Every job, by area in the person's order (a job with no area, or one whose area was removed, is
// under Other). Tap one to change it; Reorder moves jobs within their area. The areas themselves are
// added, renamed, reordered and removed beside it, with Undo.
export default function Jobs() {
  const h = useHome()
  const [ordering, setOrdering] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const groups = [...h.areas, NO_AREA].filter((a, i, all) => all.indexOf(a) === i)
    .map((a) => ({ area: a, jobs: h.jobs.filter((j) => h.areaOf(j) === a) })).filter((g) => g.jobs.length)

  const removeArea = async (name: string) => {
    const before = h.snapshot()
    await h.setAreas(h.areas.filter((a) => a !== name))
    offerUndo(`Removed ${name}. Its jobs are under Other.`, () => h.restore(before))
  }
  const moveArea = (name: string, by: number) => {
    const a = [...h.areas], i = a.indexOf(name), j = i + by
    if (i < 0 || j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    return h.setAreas(a)
  }

  return (
    <>
      <Title subtitle={`${h.jobs.length} ${h.jobs.length === 1 ? "job" : "jobs"}`} title="Jobs" action={
        <div className="flex gap-2">
          {h.jobs.length > 1 && <TintButton onClick={() => setOrdering(!ordering)}>{ordering ? "Done" : "Reorder"}</TintButton>}
          <TintButton aria-label="Add a job" onClick={() => edit.job()}><Plus /> Job</TintButton>
        </div>
      } />
      <div className="grid grid-cols-1 gap-x-8 min-[1100px]:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {!groups.length && <Section footer="Add the jobs that keep your home working: what, how often, and when you last did it."><p className="px-4 py-3 text-muted-foreground">No jobs yet.</p></Section>}
          {groups.map((g) => (
            <Section key={g.area} title={g.area} action={<button type="button" aria-label={`Add a job in ${g.area}`} onClick={() => edit.job(undefined, g.area === NO_AREA ? "" : g.area)} className="grid size-8 place-items-center rounded-full text-link"><Plus className="size-4" /></button>}>
              {g.jobs.map((j, i) => (
                <JobRow key={j.id} job={j} showArea={false} order={ordering ? { up: i > 0, down: i < g.jobs.length - 1, move: (by) => h.moveJob(j.id, by) } : undefined} />
              ))}
            </Section>
          ))}
        </div>
        <div>
          <ListSection title="Areas" footer="Jobs and appliances are grouped by area, in this order. A job in an area you remove goes under Other."
            items={h.areas} add="Add an area" field="New area" placeholder="An area, like Attic"
            onAdd={(x) => (h.areas.includes(x) ? undefined : h.setAreas([...h.areas, x]))}
            onRename={(x) => setRenaming(x)} onRemove={removeArea} onMove={moveArea} />
        </div>
      </div>
      <RenameSheet name={renaming} onClose={() => setRenaming(null)} onSave={async (to) => { const from = renaming!; setRenaming(null); if (to !== from && !h.areas.includes(to)) await h.renameArea(from, to) }} />
    </>
  )
}
