import { useLayoutEffect, useRef, useState } from "react"
import { ClipboardList, Search, Trash2 } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Row, Section, Sheet, Title, TintButton } from "@/components/kit"
import { dueOn, iso, parseLines, span, useCards, type Card } from "@/lib/cards"
import { cn } from "@/lib/utils"

// Every card by topic. Adding is fast: type the question, Tab, the answer, Return, and the next one
// is ready (the topic stays). Paste many turns lines like "question - answer" into cards at once.
// Search finds a card; tap one to edit it, or delete it (with Undo). Two columns on a wide note.
export default function Cards() {
  const { cards, topics, add, addMany, update, remove, restore } = useCards()
  const [editing, setEditing] = useState<Card | null>(null)
  const [q, setQ] = useState("")
  const [a, setA] = useState("")
  const [topic, setTopic] = useState(topics[0] === "No topic" ? "" : topics[0] ?? "")
  const [added, setAdded] = useState("")
  const [pasting, setPasting] = useState(false)
  const [find, setFind] = useState("")
  const qRef = useRef<HTMLTextAreaElement>(null), aRef = useRef<HTMLTextAreaElement>(null), tRef = useRef<HTMLInputElement>(null)
  const today = iso(new Date())

  const quick = async (e?: React.FormEvent) => {
    e?.preventDefault()
    // From the fields themselves: Return can come before the last keystroke has re-rendered.
    const qv = (qRef.current?.value ?? q).trim(), av = (aRef.current?.value ?? a).trim(), tv = (tRef.current?.value ?? topic).trim()
    if (!qv || !av) return
    await add({ q: qv, a: av, ...(tv ? { topic: tv } : {}) })
    setAdded(qv); setQ(""); setA("")
    qRef.current?.focus()
  }
  // Return in the answer adds the card (Shift-Return is a new line).
  const enter = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); quick() } }
  const drop = async (c: Card) => {
    const before = cards
    setEditing(null)
    await remove(c.id)
    offerUndo(`Deleted "${c.q}"`, () => restore(before))
  }
  const words = find.trim().toLowerCase()
  const shown = words ? cards.filter((c) => `${c.q} ${c.a} ${c.topic ?? ""}`.toLowerCase().includes(words)) : cards
  const shownTopics = topics.filter((t) => shown.some((c) => (c.topic || "No topic") === t))

  return (
    <>
      <Title title="Cards" subtitle={`${cards.length} cards`} action={<TintButton onClick={() => setPasting(true)}><ClipboardList /> Paste many</TintButton>} />
      <div className="min-[900px]:grid min-[900px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] min-[900px]:items-start min-[900px]:gap-6">
        <div className="min-[900px]:sticky min-[900px]:top-6">
          <Section title="Add a card" footer={added ? `Added "${added}". The next one is ready.` : "Return adds the card and starts the next. The topic stays."}>
            <form onSubmit={quick} className="p-4">
              <Field label="Question" htmlFor="c-q"><textarea ref={qRef} id="c-q" rows={2} className={cn(inputClass, "h-auto py-2")} placeholder="What is a codon?" value={q} onInput={(e) => setQ(e.currentTarget.value)} /></Field>
              <Field label="Answer" htmlFor="c-a"><textarea ref={aRef} id="c-a" rows={2} className={cn(inputClass, "h-auto py-2")} placeholder="Three bases that code for one amino acid" value={a} onInput={(e) => setA(e.currentTarget.value)} onKeyDown={enter} /></Field>
              <Field label="Topic" htmlFor="c-t"><input ref={tRef} id="c-t" list="topics" className={inputClass} placeholder={topics[0] && topics[0] !== "No topic" ? topics[0] : "Biology"} value={topic} onInput={(e) => setTopic(e.currentTarget.value)} /></Field>
              <datalist id="topics">{topics.map((t) => <option key={t} value={t} />)}</datalist>
              <PrimaryButton type="submit" disabled={!q.trim() || !a.trim()}>Add card</PrimaryButton>
            </form>
          </Section>
        </div>
        <div>
          {cards.length > 0 && (
            <div className="relative mb-5">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input aria-label="Search cards" type="search" placeholder="Search" className={cn(inputClass, "pl-9")} value={find} onInput={(e) => setFind(e.currentTarget.value)} />
            </div>
          )}
          {!cards.length && <p className="py-6 text-center text-muted-foreground">No cards yet. Add the first one here, use Paste many, or paste your notes to your AI and ask for flashcards.</p>}
          {cards.length > 0 && !shown.length && <p className="py-6 text-center text-muted-foreground">No card has "{find.trim()}".</p>}
          {shownTopics.map((t) => (
            <Section key={t} title={t}>
              {shown.filter((c) => (c.topic || "No topic") === t).map((c) => (
                <Row key={c.id} className="items-start py-3 pr-1">
                  <button type="button" aria-label={`Edit ${c.q}`} onClick={() => setEditing(c)} className="min-w-0 flex-1 text-left">
                    <p className="font-medium">{c.q}</p>
                    <p className="text-[0.875rem] text-muted-foreground">{c.a}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="flex items-center gap-1" aria-label={`Box ${c.box || 1} of 5`} role="img">
                        {[1, 2, 3, 4, 5].map((b) => <span key={b} className={cn("h-1.5 w-4 rounded-full", b <= (c.box || 1) ? "bg-[var(--amber-accent)]" : "bg-muted")} />)}
                      </span>
                      <span className="text-[0.75rem] text-muted-foreground">{!c.seen ? "New" : dueOn(c) <= today ? "Due" : `In ${span(Math.round((new Date(dueOn(c) + "T12:00").getTime() - new Date(today + "T12:00").getTime()) / 864e5))}`}</span>
                    </div>
                  </button>
                  <button type="button" aria-label={`Delete ${c.q}`} onClick={() => drop(c)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><Trash2 className="size-[18px]" /></button>
                </Row>
              ))}
            </Section>
          ))}
        </div>
      </div>
      <EditSheet card={editing} topics={topics} onClose={() => setEditing(null)} onSave={async (patch) => { if (editing) await update(editing.id, patch); setEditing(null) }} onDelete={drop} />
      <PasteSheet open={pasting} topic={topic} onClose={() => setPasting(false)} onAdd={async (cs) => { await addMany(cs); setPasting(false); offerUndo(`Added ${cs.length} cards`, () => restore(cards)) }} />
    </>
  )
}

function EditSheet({ card, topics, onClose, onSave, onDelete }: { card: Card | null; topics: string[]; onClose: () => void; onSave: (p: Partial<Card>) => unknown; onDelete: (c: Card) => unknown }) {
  const [q, setQ] = useState("")
  const [a, setA] = useState("")
  const [topic, setTopic] = useState("")
  useLayoutEffect(() => { if (card) { setQ(card.q); setA(card.a); setTopic(card.topic ?? "") } }, [card])
  const save = (e: React.FormEvent) => { e.preventDefault(); if (q.trim() && a.trim()) onSave({ q: q.trim(), a: a.trim(), topic: topic.trim() || undefined }) }
  return (
    <Sheet open={card !== null} title="Edit card" onClose={onClose}>
      <form onSubmit={save}>
        <Field label="Question" htmlFor="e-q"><textarea id="e-q" rows={2} className={cn(inputClass, "h-auto py-2")} value={q} onInput={(e) => setQ(e.currentTarget.value)} /></Field>
        <Field label="Answer" htmlFor="e-a"><textarea id="e-a" rows={2} className={cn(inputClass, "h-auto py-2")} value={a} onInput={(e) => setA(e.currentTarget.value)} /></Field>
        <Field label="Topic" htmlFor="e-t"><input id="e-t" list="topics" className={inputClass} placeholder={topics[0] ?? "Biology"} value={topic} onInput={(e) => setTopic(e.currentTarget.value)} /></Field>
        <PrimaryButton type="submit" disabled={!q.trim() || !a.trim()}>Save</PrimaryButton>
        {card && <DeleteButton onClick={() => onDelete(card)}>Delete card</DeleteButton>}
      </form>
    </Sheet>
  )
}

// Many cards at once: one a line, the question and the answer split by " - ", " | ", a tab, ": " or
// after a question mark. Shows how many it found before adding.
function PasteSheet({ open, topic: start, onClose, onAdd }: { open: boolean; topic: string; onClose: () => void; onAdd: (cs: { q: string; a: string; topic?: string }[]) => unknown }) {
  const [text, setText] = useState("")
  const [topic, setTopic] = useState("")
  useLayoutEffect(() => { if (open) { setText(""); setTopic(start) } }, [open])
  const found = parseLines(text)
  return (
    <Sheet open={open} title="Paste many cards" onClose={onClose}>
      <Field label="One card a line: question - answer" htmlFor="p-text">
        <textarea id="p-text" rows={7} className={cn(inputClass, "h-auto py-2")} placeholder={"Where is DNA kept? - In the nucleus\nWhat is a gene? | A stretch of DNA that codes for a protein"} value={text} onInput={(e) => setText(e.currentTarget.value)} />
      </Field>
      <Field label="Topic" htmlFor="p-topic"><input id="p-topic" className={inputClass} placeholder="Biology" value={topic} onInput={(e) => setTopic(e.currentTarget.value)} /></Field>
      <p className="mb-3 text-[0.9375rem] text-muted-foreground" data-testid="found">{found.length ? `${found.length} ${found.length === 1 ? "card" : "cards"} found` : "No cards found yet."}</p>
      <PrimaryButton disabled={!found.length} onClick={() => onAdd(found.map((c) => ({ ...c, ...(topic.trim() ? { topic: topic.trim() } : {}) })))}>{found.length ? `Add ${found.length} ${found.length === 1 ? "card" : "cards"}` : "Add cards"}</PrimaryButton>
    </Sheet>
  )
}
