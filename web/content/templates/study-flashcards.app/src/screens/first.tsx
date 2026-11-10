import { useEffect, useState } from "react"
import { Field, FirstScreen, inputClass, PrimaryButton, Section } from "@/components/kit"
import { useCards } from "@/lib/cards"
import { cn } from "@/lib/utils"

type Typed = { q: string; a: string; topic: string }
/** What the person has on this screen right now, for App: when their AI makes the first cards
 *  while they are writing one, it isn't dropped without a word. touched: they typed something.
 *  mine: Add card was pressed here. whole: it has a question and an answer, so it can be added
 *  as it is; otherwise the Cards screen opens with it (carry), to finish there. */
export const draft: { touched: boolean; mine: boolean; whole: boolean; typed: Typed | null } = { touched: false, mine: false, whole: false, typed: null }
/** A half-written card on its way to the Cards screen's form, which takes it once. */
export const carry: { card: Typed | null } = { card: null }

// With no cards, the first screen: the first card is written here, question over answer, then one
// button. No "Nothing due", no streak and no empty week: there is nothing to count yet (council
// round 3). The app starts empty: sample cards would be someone else's biology in the person's deck.
export default function First() {
  const { add } = useCards()
  const [q, setQ] = useState("")
  const [a, setA] = useState("")
  const [topic, setTopic] = useState("")
  useEffect(() => { draft.touched = false; draft.mine = false; draft.whole = false; draft.typed = null }, [])

  const ok = !!q.trim() && !!a.trim()
  draft.touched = !!(q.trim() || a.trim())
  draft.whole = ok
  draft.typed = { q: q.trim(), a: a.trim(), topic: topic.trim() }

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!ok) return
    draft.mine = true
    await add({ q: q.trim(), a: a.trim(), ...(topic.trim() ? { topic: topic.trim() } : {}) })
  }
  // Return in the answer adds the card (Shift-Return is a new line), as on the Cards screen.
  const enter = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); save() } }

  return (
    <FirstScreen title="Make your first cards" lead="A question on one side, the answer on the other. Cards you miss come back sooner."
      ai="Add one here, or tell your AI and it sets this up." foot="Paste a whole list at once under Cards.">
      <form onSubmit={save}>
        <Section>
          <div className="px-4 pb-0 pt-4">
            <Field label="Question" htmlFor="f-q"><textarea id="f-q" rows={2} className={cn(inputClass, "h-auto py-2")} placeholder="What is a codon?" value={q} onInput={(e) => setQ(e.currentTarget.value)} /></Field>
            <Field label="Answer" htmlFor="f-a"><textarea id="f-a" rows={2} className={cn(inputClass, "h-auto py-2")} placeholder="Three bases that code for one amino acid" value={a} onInput={(e) => setA(e.currentTarget.value)} onKeyDown={enter} /></Field>
            <Field label="Topic (optional)" htmlFor="f-t"><input id="f-t" className={inputClass} placeholder="Biology" value={topic} onInput={(e) => setTopic(e.currentTarget.value)} /></Field>
          </div>
        </Section>
        <PrimaryButton type="submit" disabled={!ok}>{ok ? "Add card" : "Write a question and its answer to start"}</PrimaryButton>
      </form>
    </FirstScreen>
  )
}
