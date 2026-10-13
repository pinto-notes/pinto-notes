import { useLayoutEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Row, Section, Sheet, Title, TintButton } from "@/components/kit"
import { useCards, type Card } from "@/lib/cards"
import { cn } from "@/lib/utils"

// Every card by topic, with its box. Add a card, tap one to edit it, or delete it (with Undo).
export default function Cards() {
  const { cards, topics, add, update, remove, restore } = useCards()
  const [editing, setEditing] = useState<Card | "new" | null>(null)
  const [q, setQ] = useState("")
  const [a, setA] = useState("")
  const [topic, setTopic] = useState("")
  useLayoutEffect(() => {
    if (!editing) return
    setQ(editing === "new" ? "" : editing.q); setA(editing === "new" ? "" : editing.a); setTopic(editing === "new" ? topic : editing.topic ?? "")
  }, [editing])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!q.trim() || !a.trim() || !editing) return
    const fields = { q: q.trim(), a: a.trim(), ...(topic.trim() ? { topic: topic.trim() } : {}) }
    if (editing === "new") await add(fields); else await update(editing.id, { ...fields, topic: topic.trim() || undefined })
    setEditing(null)
  }
  const drop = async (c: Card) => {
    const before = cards
    setEditing(null)
    await remove(c.id)
    offerUndo(`Deleted "${c.q}"`, () => restore(before))
  }

  return (
    <>
      <Title title="Cards" subtitle={`${cards.length} cards`} action={<TintButton onClick={() => setEditing("new")}><Plus /> Add</TintButton>} />
      {!cards.length && <p className="py-6 text-center text-muted-foreground">No cards yet. Tap Add to write the first one, or paste your notes to your AI and ask for flashcards.</p>}
      {topics.map((t) => (
        <Section key={t} title={t}>
          {cards.filter((c) => (c.topic || "No topic") === t).map((c) => (
            <Row key={c.id} className="items-start py-3 pr-1">
              <button type="button" aria-label={`Edit ${c.q}`} onClick={() => setEditing(c)} className="min-w-0 flex-1 text-left">
                <p className="font-medium">{c.q}</p>
                <p className="text-[0.875rem] text-muted-foreground">{c.a}</p>
                <div className="mt-1.5 flex items-center gap-1" aria-label={`Box ${c.box || 1} of 5`} role="img">
                  {[1, 2, 3, 4, 5].map((b) => <span key={b} className={cn("h-1.5 w-4 rounded-full", b <= (c.box || 1) ? "bg-[var(--amber-accent)]" : "bg-muted")} />)}
                </div>
              </button>
              <button type="button" aria-label={`Delete ${c.q}`} onClick={() => drop(c)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
            </Row>
          ))}
        </Section>
      ))}
      <Sheet open={editing !== null} title={editing === "new" ? "New card" : "Edit card"} onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <Field label="Question" htmlFor="c-q"><textarea id="c-q" rows={2} className={cn(inputClass, "h-auto py-2")} value={q} onInput={(e) => setQ(e.currentTarget.value)} /></Field>
          <Field label="Answer" htmlFor="c-a"><textarea id="c-a" rows={2} className={cn(inputClass, "h-auto py-2")} value={a} onInput={(e) => setA(e.currentTarget.value)} /></Field>
          <Field label="Topic" htmlFor="c-t"><input id="c-t" list="topics" className={inputClass} placeholder={topics[0] ?? "Biology"} value={topic} onInput={(e) => setTopic(e.currentTarget.value)} /></Field>
          <datalist id="topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
          <PrimaryButton type="submit" disabled={!q.trim() || !a.trim()}>{editing === "new" ? "Add card" : "Save"}</PrimaryButton>
          {editing && editing !== "new" && <DeleteButton onClick={() => drop(editing)}>Delete card</DeleteButton>}
        </form>
      </Sheet>
    </>
  )
}
