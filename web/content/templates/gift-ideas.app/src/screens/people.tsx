import { useState } from "react"
import { route } from "amber-router"
import { ChevronRight, Plus } from "lucide-react"
import { EditToggle, offerUndo, Row, RowTools, Section, TintButton, Title } from "@/components/kit"
import { PersonSheet } from "@/components/person-sheet"
import { between, inDays, occasionName, useGifts, type Person } from "@/lib/gifts"

/** Someone's initial in a round tile, as Contacts shows a person without a photo. */
export function Initial({ name, className = "size-10 text-[1.0625rem]" }: { name: string; className?: string }) {
  return <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-[var(--amber-accent-soft)] font-semibold text-link ${className}`}>{(name.trim()[0] ?? "?").toUpperCase()}</span>
}

// Everyone you buy for, in your order: their next occasion and how many ideas are saved. Edit
// reorders and removes (with Undo); Add person adds one.
export default function People() {
  const { people, ideas, ideasOf, soonest, movePerson, removePerson, restore, now } = useGifts()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const drop = async (p: Person) => {
    const beforePeople = people, beforeIdeas = ideas
    await removePerson(p.id)
    offerUndo(`Removed ${p.name}`, () => restore(beforePeople, beforeIdeas))
  }
  const saved = ideas.filter((i) => i.status !== "given").length
  return (
    <div className="max-w-2xl">
      <Title title="People" subtitle={`${people.length} ${people.length === 1 ? "person" : "people"} · ${saved} ${saved === 1 ? "idea" : "ideas"}`}
        action={<TintButton onClick={() => setAdding(true)}><Plus /> Person</TintButton>} />
      <Section action={people.length > 1 ? <EditToggle on={editing} onChange={setEditing} label="people" /> : undefined}
        footer={editing ? "Removing someone removes their ideas too. Undo brings both back." : undefined}>
        {people.map((p, i) => {
          const next = soonest(p)
          const n = ideasOf(p.id).length
          return (
            <Row key={p.id} className="p-0 pr-1">
              <button type="button" aria-label={p.name} data-testid="person" onClick={() => route(`/person/${encodeURIComponent(p.id)}`)}
                className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 pr-2 text-left active:bg-accent">
                <Initial name={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-[0.875rem] text-muted-foreground">{next ? `${occasionName(next.o)} · ${inDays(between(now, next.date))}` : "No occasions yet"}</p>
                </div>
                {!editing && <span className="shrink-0 text-[0.875rem] tabular-nums text-muted-foreground">{n} {n === 1 ? "idea" : "ideas"}</span>}
                {!editing && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
              </button>
              {editing && <RowTools name={p.name} first={i === 0} last={i === people.length - 1} onMove={(by) => movePerson(p.id, by)} onRemove={() => drop(p)} />}
            </Row>
          )
        })}
      </Section>
      <PersonSheet editing={adding ? "new" : null} onClose={() => setAdding(false)} />
    </div>
  )
}
