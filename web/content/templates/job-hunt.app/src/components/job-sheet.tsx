import { useLayoutEffect, useState } from "react"
import { route } from "amber-router"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Sheet } from "@/components/kit"
import { isDate, useJobs, type Job } from "@/lib/jobs"

/** Adds an application, or changes one: company, role, the ad's link, salary, contact, stage and
 *  the day you applied. Prep, dates and notes are on the application's own page. */
export function JobSheet({ editing, stage, onClose }: { editing: Job | "new" | null; stage?: string; onClose: () => void }) {
  const { stages, jobs, add, update, remove, restore, move } = useJobs()
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [link, setLink] = useState("")
  const [salary, setSalary] = useState("")
  const [contact, setContact] = useState("")
  const [applied, setApplied] = useState("")
  const [at, setAt] = useState("")
  useLayoutEffect(() => {
    if (!editing) return
    const j = editing === "new" ? null : editing
    setCompany(j?.company ?? ""); setRole(j?.role ?? ""); setLink(j?.link ?? ""); setSalary(j?.salary ?? "")
    setContact(j?.contact ?? ""); setApplied(j?.applied ?? ""); setAt(j?.stage ?? stage ?? stages[0]?.id ?? "saved")
  }, [editing === "new" ? "new" : editing?.id])
  if (!editing) return null
  const isNew = editing === "new"
  const ok = !!company.trim()
  const name = (id: string) => stages.find((s) => s.id === id)?.name ?? id

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const fields = { company: company.trim(), role: role.trim(), link: link.trim() || undefined, salary: salary.trim() || undefined, contact: contact.trim() || undefined, applied: isDate(applied) ? applied : undefined }
    const set = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as Partial<Job>
    if (isNew) await add({ ...(set as Omit<Job, "id" | "stage">), stage: at })
    else {
      const was = editing as Job
      const cleared = Object.fromEntries((["link", "salary", "contact", "applied"] as const).filter((k) => !(k in set) && was[k]).map((k) => [k, undefined]))
      if (at !== was.stage) await move(was.id, at, undefined, undefined, { ...set, ...cleared })
      else await update(was.id, { ...set, ...cleared })
    }
    onClose()
  }
  const drop = async () => {
    const j = editing as Job, before = jobs
    onClose()
    await remove(j.id)
    route("/")
    offerUndo(`Deleted ${j.company}`, () => restore(before))
  }

  return (
    <Sheet open title={isNew ? "New application" : "Edit application"} onClose={onClose}>
      <form onSubmit={save} noValidate>
        <Field label="Company" htmlFor="j-company"><input id="j-company" className={inputClass} placeholder="Tideway" value={company} onInput={(e) => setCompany(e.currentTarget.value)} /></Field>
        <Field label="Role" htmlFor="j-role"><input id="j-role" className={inputClass} placeholder="Senior designer" value={role} onInput={(e) => setRole(e.currentTarget.value)} /></Field>
        <Field label="Link to the ad" htmlFor="j-link"><input id="j-link" type="url" inputMode="url" className={inputClass} placeholder="Paste the address" value={link} onInput={(e) => setLink(e.currentTarget.value)} /></Field>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1"><Field label="Salary" htmlFor="j-salary"><input id="j-salary" className={inputClass} placeholder="If the ad says" value={salary} onInput={(e) => setSalary(e.currentTarget.value)} /></Field></div>
          <div className="min-w-0 flex-1"><Field label="Applied" htmlFor="j-applied"><input id="j-applied" type="date" className={inputClass} value={applied} onInput={(e) => setApplied(e.currentTarget.value)} /></Field></div>
        </div>
        <Field label="Contact" htmlFor="j-contact"><input id="j-contact" className={inputClass} placeholder="Name, and who they are" value={contact} onInput={(e) => setContact(e.currentTarget.value)} /></Field>
        <div className="mb-5">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Stage</p>
          <Pills label="Stage" options={stages.map((s) => s.name)} value={name(at)} onChange={(n) => setAt(stages.find((s) => s.name === n)?.id ?? at)} />
        </div>
        <PrimaryButton type="submit" disabled={!ok}>{isNew ? (ok ? `Add ${company.trim()}` : "Name the company to add it") : "Save"}</PrimaryButton>
        {!isNew && <DeleteButton onClick={drop}>Delete application</DeleteButton>}
      </form>
    </Sheet>
  )
}
