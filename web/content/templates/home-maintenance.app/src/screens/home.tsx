import { useState, type ReactNode } from "react"
import { ArrowDown, ArrowUp, BookOpen, ChevronRight, Mail, Phone, Plus } from "lucide-react"
import { Section, Title } from "@/components/kit"
import { edit } from "@/components/sheets"
import { device } from "@/lib/amber"
import { shortDate, useHome, warrantyOf } from "@/lib/home"
import { cn } from "@/lib/utils"

type List = "appliances" | "details" | "contacts"

// The home's facts: appliances (model, serial, when bought, the warranty and its manual), home
// details (where the stopcock is, the paint colours) and who to call. Each is added, changed,
// reordered and deleted here, with Undo. A warranty ending within three months is flagged.
export default function Home() {
  const h = useHome()
  const [ordering, setOrdering] = useState<List | null>(null)
  const reorder = (l: List, n: number) => n > 1
    ? <button type="button" aria-label={ordering === l ? "Done reordering" : `Reorder ${l}`} onClick={() => setOrdering(ordering === l ? null : l)} className="text-[0.9375rem] font-medium text-link">{ordering === l ? "Done" : "Reorder"}</button>
    : undefined
  const arrows = (l: List, id: string, name: string, i: number, n: number, move: (id: string, by: number) => unknown) => ordering === l ? (
    <>
      <button type="button" aria-label={`Move ${name} up`} disabled={i === 0} onClick={() => move(id, -1)} className={icon}><ArrowUp className="size-4" /></button>
      <button type="button" aria-label={`Move ${name} down`} disabled={i === n - 1} onClick={() => move(id, 1)} className={cn(icon, "mr-1")}><ArrowDown className="size-4" /></button>
    </>
  ) : null

  return (
    <>
      <Title subtitle="Appliances and contacts" title="Home" />
      <div className="grid grid-cols-1 gap-x-8 min-[1100px]:grid-cols-2">
        <div>
          <Section title="Appliances" action={reorder("appliances", h.appliances.length)} footer={!h.appliances.length ? "Model and serial numbers, warranties and manuals, for when something breaks." : undefined}>
            {h.appliances.map((a, i) => {
              const w = warrantyOf(a, h.now)
              const sub = [a.model, a.bought ? `bought ${shortDate(a.bought, h.now)}` : ""].filter(Boolean).join(" · ")
              return (
                <Line key={a.id} label={a.name} onOpen={() => edit.appliance(a)} end={arrows("appliances", a.id, a.name, i, h.appliances.length, h.moveAppliance) ?? (a.manual ? <Out href={a.manual} label={`Manual for ${a.name}`} icon={<BookOpen className="size-[18px]" />} /> : null)}>
                  <span className="block font-semibold">{a.name}</span>
                  {sub && <span className="block truncate text-[0.8125rem] text-muted-foreground">{sub}</span>}
                  {a.serial && <span className="block truncate text-[0.8125rem] text-muted-foreground">Serial {a.serial}</span>}
                  {w.text && <span data-testid="warranty" className={cn("block text-[0.8125rem]", w.state === "soon" ? "font-medium text-link" : "text-muted-foreground")}>{w.text}</span>}
                </Line>
              )
            })}
            <Add label="Add an appliance" onClick={() => edit.appliance()} />
          </Section>
          <Section title="Home details" action={reorder("details", h.details.length)} footer={!h.details.length ? "Where the stopcock and the fuse box are, the paint colours, the alarm code's hint." : undefined}>
            {h.details.map((d, i) => (
              <Line key={d.id} label={d.name} onOpen={() => edit.detail(d)} end={arrows("details", d.id, d.name, i, h.details.length, h.moveDetail)}>
                <span className="block text-[0.8125rem] font-medium text-muted-foreground">{d.name}</span>
                <span className="block">{d.value}</span>
              </Line>
            ))}
            <Add label="Add a home detail" onClick={() => edit.detail()} />
          </Section>
        </div>
        <div>
          <Section title="Who to call" action={reorder("contacts", h.contacts.length)} footer={!h.contacts.length ? "The plumber, the electrician, the chimney sweep. Pick one on a job to see them there." : undefined}>
            {h.contacts.map((c, i) => {
              const jobs = h.jobs.filter((j) => j.contact === c.id).map((j) => j.name)
              return (
                <Line key={c.id} label={c.name} onOpen={() => edit.contact(c)} end={arrows("contacts", c.id, c.name, i, h.contacts.length, h.moveContact) ?? (
                  c.phone ? <Out href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} label={`Call ${c.name}`} icon={<Phone className="size-[18px]" />} />
                    : c.email ? <Out href={`mailto:${c.email}`} label={`Email ${c.name}`} icon={<Mail className="size-[18px]" />} /> : null
                )}>
                  <span className="block font-semibold">{c.name}</span>
                  <span className="block truncate text-[0.8125rem] text-muted-foreground">{[c.trade, c.phone].filter(Boolean).join(" · ")}</span>
                  {jobs.length > 0 && <span className="block truncate text-[0.8125rem] text-muted-foreground">For {jobs.join(", ").toLowerCase()}</span>}
                </Line>
              )
            })}
            <Add label="Add a contact" onClick={() => edit.contact()} />
          </Section>
        </div>
      </div>
    </>
  )
}

const icon = "grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground disabled:opacity-30"

function Line({ label, onOpen, end, children }: { label: string; onOpen: () => void; end?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center border-t border-border first:border-t-0" data-testid="line">
      <button type="button" aria-label={label} onClick={onOpen} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 pr-2 text-left">
        <span className="min-w-0 flex-1">{children}</span>
        {!end && <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
      </button>
      {end}
    </div>
  )
}

/** A link out of the app (a manual, a phone number): Pinto Notes asks the person first. */
function Out({ href, label, icon: i }: { href: string; label: string; icon: ReactNode }) {
  return (
    <a href={href} aria-label={label} onClick={(e) => { e.preventDefault(); device?.openURL?.(href) }} className="mr-1 grid size-11 shrink-0 place-items-center rounded-full text-link">{i}</a>
  )
}

function Add({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left font-medium text-link first:border-t-0">
      <Plus className="size-4" /> {label}
    </button>
  )
}

