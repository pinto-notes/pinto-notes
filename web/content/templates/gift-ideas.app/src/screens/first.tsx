import { useEffect, useState } from "react"
import { Field, FirstScreen, inputClass, PrimaryButton, Section } from "@/components/kit"
import { DayMonth } from "@/components/day-month"
import { ChristmasChoice, startingOccasions } from "@/components/person-sheet"
import { useGifts } from "@/lib/gifts"

/** What the person has on this screen right now, for App: when their AI adds someone while they
 *  are here, what they typed isn't dropped without a word (App offers "Add mine"). */
export const draft: { touched: boolean; mine: boolean; use: (() => unknown) | null } = { touched: false, mine: false, use: null }

// A new app's first screen, alone: the first person you buy for, their birthday and whether they
// get a Christmas gift, then Upcoming with their days on it. An empty list says nothing.
export default function First() {
  const { addPerson } = useGifts()
  const [name, setName] = useState("")
  const [birthday, setBirthday] = useState("")
  const [christmas, setChristmas] = useState(true)
  useEffect(() => { draft.touched = false; draft.mine = false; draft.use = null }, [])

  const ok = !!name.trim()
  const person = { name: name.trim(), occasions: startingOccasions(birthday, christmas) }
  draft.touched = !!(name.trim() || birthday)
  draft.use = ok ? () => addPerson(person) : null

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    draft.mine = true
    await addPerson(person)
  }
  return (
    <FirstScreen title="Who do you buy gifts for?" lead="Start with one person and their birthday. Ideas, budgets and the rest of the list come after."
      ai="Add them here, or tell your AI who's on your list."
      foot="Save an idea the moment you hear it, and see what's coming up and what's bought.">
      <form onSubmit={save} noValidate>
        <Section>
          <div className="px-4 pb-0 pt-4">
            <Field label="Name" htmlFor="f-name"><input id="f-name" className={inputClass} placeholder="Mum" value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
            <DayMonth id="f-birthday" label="Birthday (optional)" value={birthday} onChange={setBirthday} />
            <ChristmasChoice value={christmas} onChange={setChristmas} />
          </div>
        </Section>
        <PrimaryButton type="submit" disabled={!ok}>{ok ? `Add ${name.trim()}` : "Name someone to start"}</PrimaryButton>
      </form>
    </FirstScreen>
  )
}
