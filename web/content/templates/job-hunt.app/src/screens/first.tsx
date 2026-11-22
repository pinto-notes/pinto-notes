import { useEffect, useState } from "react"
import { Field, FirstScreen, inputClass, Pills, PrimaryButton, Section } from "@/components/kit"
import { useJobs, type Job } from "@/lib/jobs"

/** What the person has on this screen right now, for App: when their AI adds an application while
 *  they are here, what they typed isn't dropped without a word (App offers "Add mine"). */
export const draft: { touched: boolean; mine: boolean; use: (() => unknown) | null } = { touched: false, mine: false, use: null }

// A new app's first screen, alone: the first job you're after, then the board. An empty board of
// five empty columns says nothing; one card on it says how it works.
export default function First() {
  const { add, stages } = useJobs()
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [link, setLink] = useState("")
  const choices = stages.filter((s) => s.id === "saved" || s.id === "applied")
  const [stage, setStage] = useState(choices[0]?.id ?? stages[0]?.id ?? "saved")
  useEffect(() => { draft.touched = false; draft.mine = false; draft.use = null }, [])

  const ok = !!company.trim()
  const job: Omit<Job, "id"> = { company: company.trim(), role: role.trim(), ...(link.trim() ? { link: link.trim() } : {}), stage }
  draft.touched = !!(company.trim() || role.trim() || link.trim())
  draft.use = ok ? () => add(job) : null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    draft.mine = true
    await add(job)
  }
  return (
    <FirstScreen title="Which job are you after?" lead="Add the first one: the company, the role and a link to the ad. The rest of the board comes after."
      ai="Add it here, or paste the ad to your AI and it adds it."
      foot="Move it along the board as you hear back. Change the stages any time in Settings.">
      <form onSubmit={save} noValidate>
        <Section>
          <div className="px-4 pb-0 pt-4">
            <Field label="Company" htmlFor="f-company"><input id="f-company" className={inputClass} placeholder="Tideway" value={company} onInput={(e) => setCompany(e.currentTarget.value)} /></Field>
            <Field label="Role" htmlFor="f-role"><input id="f-role" className={inputClass} placeholder="Senior designer" value={role} onInput={(e) => setRole(e.currentTarget.value)} /></Field>
            <Field label="Link to the ad (optional)" htmlFor="f-link"><input id="f-link" type="url" inputMode="url" className={inputClass} placeholder="Paste the address" value={link} onInput={(e) => setLink(e.currentTarget.value)} /></Field>
            {choices.length > 1 && (
              <div className="mb-4">
                <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Have you applied?</p>
                <Pills label="Stage" options={choices.map((s) => s.id === "saved" ? "Not yet" : "Yes, I applied")} value={stage === "saved" ? "Not yet" : "Yes, I applied"}
                  onChange={(v) => setStage(v === "Not yet" ? "saved" : "applied")} />
              </div>
            )}
          </div>
        </Section>
        <PrimaryButton type="submit" disabled={!ok}>{ok ? `Add ${company.trim()}` : "Name the company to start"}</PrimaryButton>
      </form>
    </FirstScreen>
  )
}
