import { useState } from "react"
import { back, route } from "amber-router"
import { ExternalLink, Pencil, Plus, ChevronLeft } from "lucide-react"
import { device } from "@/lib/amber"
import { EditToggle, offerUndo, Row, RowTools, Section, Spend, TintButton } from "@/components/kit"
import { IdeaSheet } from "@/components/idea-sheet"
import { OccasionSheet } from "@/components/occasion-sheet"
import { PersonSheet } from "@/components/person-sheet"
import { StatusSheet } from "@/components/status-sheet"
import { Initial } from "@/screens/people"
import { dayLabel, ideaYear, inDays, occasionName, statusLabel, useGifts, type Idea, type Occasion, type Person } from "@/lib/gifts"
import { cn } from "@/lib/utils"

const add = "inline-flex h-8 items-center gap-1 font-semibold text-link"

// One person: their gift ideas (each with its price, shop, link and where it is), their occasions
// with the budget and what's spent, what they like, their sizes and what they already have, and
// the gifts given before, so none is given twice. Two columns from 900 px.
export default function PersonPage({ id }: { id?: string }) {
  const g = useGifts()
  const p = id ? g.person(id) : undefined
  const [editingPerson, setEditingPerson] = useState(false)
  const [idea, setIdea] = useState<Idea | "new" | null>(null)
  const [status, setStatus] = useState<Idea | null>(null)
  const [occasion, setOccasion] = useState<Occasion | "new" | null>(null)
  const [editIdeas, setEditIdeas] = useState(false)
  const [editOccasions, setEditOccasions] = useState(false)
  const [opened, setOpened] = useState("")

  if (!p) {
    return (
      <div className="py-10 text-center">
        <p className="text-muted-foreground">This person isn't on your list any more.</p>
        <TintButton className="mt-4" onClick={() => route("/people")}>Back to People</TintButton>
      </div>
    )
  }
  const ideas = g.ideasOf(p.id), given = g.givenTo(p.id), shares = g.sharesOf(p.id)
  const next = shares.slice().sort((a, b) => (a.event.date < b.event.date ? -1 : 1))[0]
  const oname = (oid?: string) => { const o = p.occasions.find((x) => x.id === oid); return o ? occasionName(o) : "" }

  const dropIdea = async (i: Idea) => {
    const before = g.ideas
    await g.removeIdea(i.id)
    offerUndo(`Deleted ${i.title}`, () => g.restoreIdeas(before))
  }
  const dropOccasion = async (o: Occasion) => {
    const before = g.people
    await g.removeOccasion(p.id, o.id)
    offerUndo(`Removed ${occasionName(o)}`, () => g.restore(before, g.ideas))
  }
  const open = async (i: Idea) => {
    if (!i.link) return
    // An address without its scheme ("arket.example/scarf") opens as https. (Built in parts: the save
    // gate refuses an address written out in the source, and this one is the person's own link.)
    const url = /^[a-z][a-z0-9+.-]*:/i.test(i.link) ? i.link : ["https:", "", i.link].join("/")
    try { const r = await device?.openURL?.(url); setOpened(r && r.ok === false ? (r.error || "Couldn't open the link.") : "") } catch { setOpened("Couldn't open the link.") }
  }

  return (
    <>
      <button type="button" onClick={() => back()} className="-ml-2 mb-1 inline-flex h-11 items-center gap-0.5 rounded-lg pr-3 font-medium text-link"><ChevronLeft className="size-5" /> Back</button>
      <header className="flex flex-wrap items-center gap-3 pb-5">
        <Initial name={p.name} className="size-14 text-[1.5rem]" />
        <div className="min-w-0 flex-1">
          <h1 className="text-[2rem] font-bold leading-tight tracking-tight">{p.name}</h1>
          <p className="text-[0.9375rem] text-muted-foreground" data-testid="next">{next ? `${next.event.shared ? next.event.title.replace(/ \d{4}$/, "") : next.event.title} · ${inDays(next.event.days)}` : "No occasions yet"}</p>
        </div>
        <div className="flex w-full gap-2 min-[600px]:w-auto">
          <TintButton className="flex-1 min-[600px]:flex-none" onClick={() => setIdea("new")}><Plus /> Idea</TintButton>
          <TintButton className="flex-1 min-[600px]:flex-none" aria-label="Edit person" onClick={() => setEditingPerson(true)}><Pencil /> Edit</TintButton>
        </div>
      </header>
      {opened && <p role="status" className="mb-4 px-1 text-[0.8125rem] text-muted-foreground">{opened}</p>}

      <div className="min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] min-[900px]:items-start min-[900px]:gap-8">
        <div>
          <Section title="Ideas" action={<div className="flex gap-3">{ideas.length > 1 && <EditToggle on={editIdeas} onChange={setEditIdeas} label="ideas" />}<button type="button" onClick={() => setIdea("new")} className={add}><Plus className="size-4" /> Add</button></div>}
            footer={ideas.length ? "Tap a status to move it on: bought, wrapped, given." : undefined}>
            {!ideas.length && <p className="px-4 py-4 text-muted-foreground">No ideas yet. Save one the moment you hear it, or tell your AI.</p>}
            {ideas.map((i, k) => (
              <Row key={i.id} className="gap-2 py-2 pl-3 pr-1">
                <button type="button" aria-label={`Status: ${i.title}`} onClick={() => setStatus(i)} data-testid="idea-status"
                  className={cn("h-8 w-[5.5rem] shrink-0 rounded-full text-[0.8125rem] font-semibold", i.status === "idea" ? "bg-muted text-muted-foreground" : "bg-[var(--amber-accent-soft)] text-link")}>
                  {statusLabel(i.status)}
                </button>
                <button type="button" aria-label={i.title} data-testid="idea" onClick={() => setIdea(i)} className="min-w-0 flex-1 py-1 text-left">
                  <p className="font-medium">{i.title}</p>
                  <p className="truncate text-[0.875rem] text-muted-foreground">{[i.price !== undefined ? g.fmt(i.price) : "", i.shop ?? "", oname(i.occasion)].filter(Boolean).join(" · ") || "No price yet"}</p>
                </button>
                {editIdeas
                  ? <RowTools name={i.title} first={k === 0} last={k === ideas.length - 1} onMove={(by) => g.moveIdea(i.id, by)} onRemove={() => dropIdea(i)} />
                  : i.link && <button type="button" aria-label={`Open the link for ${i.title}`} onClick={() => open(i)} className="grid size-11 shrink-0 place-items-center rounded-full text-link"><ExternalLink className="size-[18px]" /></button>}
              </Row>
            ))}
          </Section>

          <Section title="Given before" footer={given.length ? "So the same gift isn't given twice. A new idea says so when it's like one of these." : undefined}>
            {!given.length && <p className="px-4 py-4 text-muted-foreground">Gifts you give stay here, by year.</p>}
            {given.map((i) => (
              <Row key={i.id} className="p-0">
                <button type="button" aria-label={i.title} data-testid="given" onClick={() => setIdea(i)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left active:bg-accent">
                  <span className="w-12 shrink-0 font-semibold tabular-nums text-muted-foreground">{ideaYear(i, 0) > 0 ? ideaYear(i, 0) : ""}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{i.title}</span>
                    <span className="block text-[0.875rem] text-muted-foreground">{[oname(i.occasion), i.price !== undefined ? g.fmt(i.price) : ""].filter(Boolean).join(" · ")}</span>
                  </span>
                </button>
              </Row>
            ))}
          </Section>
        </div>

        <div>
          <Section title="Occasions" action={<div className="flex gap-3">{p.occasions.length > 1 && <EditToggle on={editOccasions} onChange={setEditOccasions} label="occasions" />}<button type="button" onClick={() => setOccasion("new")} className={add}><Plus className="size-4" /> Add</button></div>}
            footer="The budget for each, and what's bought for it so far.">
            {!p.occasions.length && <p className="px-4 py-4 text-muted-foreground">No occasions yet. Add a birthday, Christmas or an anniversary.</p>}
            {p.occasions.map((o, k) => {
              const s = shares.find((x) => x.occasion.id === o.id)
              return (
                <Row key={o.id} className="gap-1 p-0 pr-1">
                  <button type="button" aria-label={occasionName(o)} data-testid="occasion" onClick={() => setOccasion(o)} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 pr-2 text-left active:bg-accent">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{occasionName(o)}</p>
                      <p className="text-[0.875rem] text-muted-foreground">{s ? `${dayLabel(s.event.date)} · ${inDays(s.event.days)}` : "No day yet"}</p>
                    </div>
                    {!editOccasions && s && <Spend spent={s.spent} budget={o.budget} fmt={g.fmt} label={`${occasionName(o)}: spent of budget`} className="w-32 shrink-0 text-right" />}
                    {!editOccasions && !s?.spent && !o.budget && <span className="shrink-0 text-[0.875rem] text-muted-foreground">No budget</span>}
                  </button>
                  {editOccasions && <RowTools name={occasionName(o)} first={k === 0} last={k === p.occasions.length - 1} onMove={(by) => g.moveOccasion(p.id, o.id, by)} onRemove={() => dropOccasion(o)} />}
                </Row>
              )
            })}
          </Section>

          <About person={p} />
        </div>
      </div>

      <PersonSheet editing={editingPerson ? p : null} onClose={() => setEditingPerson(false)} />
      <IdeaSheet personId={p.id} editing={idea} onClose={() => setIdea(null)} />
      <StatusSheet idea={status} onClose={() => setStatus(null)} />
      <OccasionSheet person={p} editing={occasion} onClose={() => setOccasion(null)} onDelete={dropOccasion} />
    </>
  )
}

const FIELDS = [
  { key: "likes", label: "Likes", hint: "Colours, hobbies, favourite shops" },
  { key: "sizes", label: "Sizes", hint: "Clothes, shoes, rings" },
  { key: "has", label: "Already has", hint: "So you don't buy it twice" },
] as const

/** What they like, their sizes and what they already have: typed straight in, saved on leaving the field. */
function About({ person }: { person: Person }) {
  const { updatePerson } = useGifts()
  const [typing, setTyping] = useState<Record<string, string>>({})
  return (
    <Section title={`About ${person.name}`}>
      {FIELDS.map((f) => (
        <div key={f.key} className="border-t border-border px-4 py-2.5 first:border-t-0">
          <label htmlFor={`about-${f.key}`} className="block text-[0.8125rem] font-medium text-muted-foreground">{f.label}</label>
          <textarea id={`about-${f.key}`} rows={2} className="block w-full resize-none bg-transparent pt-0.5 text-base placeholder:text-muted-foreground/70 focus:outline-none [field-sizing:content]"
            placeholder={f.hint} value={typing[f.key] ?? person[f.key] ?? ""}
            onInput={(e) => { const v = e.currentTarget.value; setTyping((t) => ({ ...t, [f.key]: v })) }}
            onBlur={async () => {
              const v = typing[f.key]
              if (v === undefined) return
              setTyping((t) => { const { [f.key]: _, ...rest } = t; return rest })
              if (v.trim() !== (person[f.key] ?? "")) await updatePerson(person.id, { [f.key]: v.trim() || undefined })
            }} />
        </div>
      ))}
    </Section>
  )
}
