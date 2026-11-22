import { useLayoutEffect, useState } from "react"
import { History } from "lucide-react"
import { DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Sheet } from "@/components/kit"
import { alike, amount, ideaYear, occasionName, STATUSES, useGifts, type Idea, type Status } from "@/lib/gifts"

const ANY = "Any time"

/** Adds a gift idea or changes one: what it is, its price, where to buy it, a link, the occasion
 *  it's for and where it is (an idea, bought, wrapped, given). Says so when it's like a gift the
 *  person was given before. Opened from someone's page it's for them; from Upcoming you pick who. */
export function IdeaSheet({ personId, editing, occasion, onClose }: { personId?: string; editing: Idea | "new" | null; occasion?: string; onClose: () => void }) {
  const { people, person, ideas, givenTo, addIdea, updateIdea, setStatus, removeIdea, restoreIdeas, currency } = useGifts()
  const [who, setWho] = useState("")
  const [title, setTitle] = useState("")
  const [price, setPrice] = useState("")
  const [shop, setShop] = useState("")
  const [link, setLink] = useState("")
  const [forId, setFor] = useState("")
  const [status, setStatusHere] = useState<Status>("idea")
  useLayoutEffect(() => {
    if (!editing) return
    const i = editing === "new" ? null : editing
    setWho(i?.person ?? personId ?? people[0]?.id ?? ""); setTitle(i?.title ?? ""); setPrice(i?.price !== undefined ? String(i.price) : "")
    setShop(i?.shop ?? ""); setLink(i?.link ?? ""); setFor(i?.occasion ?? occasion ?? ""); setStatusHere(i?.status ?? "idea")
  }, [editing === "new" ? "new" : editing?.id])
  if (!editing) return null
  const isNew = editing === "new"
  const p = person(who)
  const ok = !!title.trim() && !!p
  const past = p ? alike(title, givenTo(p.id).filter((g) => isNew || g.id !== editing.id)) : []
  const label = (oid?: string) => (oid && p?.occasions.find((o) => o.id === oid) ? occasionName(p.occasions.find((o) => o.id === oid)!) : ANY)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ok) return
    const fields: Partial<Idea> = {
      title: title.trim(), price: price.trim() ? amount(price) : undefined, shop: shop.trim() || undefined,
      link: link.trim() || undefined, occasion: forId || undefined, status,
    }
    onClose()
    if (isNew) {
      const set = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined)) as Omit<Idea, "id" | "person">
      const made = await addIdea({ ...set, person: p.id })
      if (status !== "idea") await setStatus(made.id, status)
    } else {
      await updateIdea(editing.id, fields)
      // Where it is, with what that means: buying one puts it on an occasion, giving one dates it.
      await setStatus(editing.id, status)
    }
  }
  const drop = async () => {
    const i = editing as Idea, before = ideas
    onClose()
    await removeIdea(i.id)
    offerUndo(`Deleted ${i.title}`, () => restoreIdeas(before))
  }

  return (
    <Sheet open title={isNew ? (p && !personId ? `New idea for ${p.name}` : "New idea") : "Edit idea"} onClose={onClose}>
      <form onSubmit={save} noValidate>
        {isNew && !personId && people.length > 1 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">For</p>
            <Pills label="Who it's for" options={people.map((x) => x.name)} value={p?.name ?? ""} onChange={(n) => { setWho(people.find((x) => x.name === n)?.id ?? who); setFor("") }} />
          </div>
        )}
        <Field label="Gift" htmlFor="i-title"><input id="i-title" className={inputClass} placeholder="Blue wool scarf" value={title} onInput={(e) => setTitle(e.currentTarget.value)} /></Field>
        {past.length > 0 && (
          <p role="note" data-testid="given-before" className="-mt-2 mb-4 flex items-start gap-2 rounded-xl bg-[var(--amber-accent-soft)] px-3 py-2 text-[0.9375rem]">
            <History className="mt-0.5 size-4 shrink-0 text-link" />
            <span>Given before: {past.map((g) => `${g.title}, ${label(g.occasion) === ANY ? "" : label(g.occasion) + " "}${ideaYear(g, 0) > 0 ? ideaYear(g, 0) : ""}`.trim()).join("; ")}</span>
          </p>
        )}
        <div className="flex gap-3">
          <div className="w-32 shrink-0"><Field label={currency ? `Price (${currency})` : "Price"} htmlFor="i-price"><input id="i-price" inputMode="decimal" autoComplete="off" className={inputClass} placeholder="0" value={price} onInput={(e) => setPrice(e.currentTarget.value)} /></Field></div>
          <div className="min-w-0 flex-1"><Field label="Where to buy" htmlFor="i-shop"><input id="i-shop" className={inputClass} placeholder="Shop or website" value={shop} onInput={(e) => setShop(e.currentTarget.value)} /></Field></div>
        </div>
        <Field label="Link" htmlFor="i-link"><input id="i-link" type="url" inputMode="url" className={inputClass} placeholder="Paste the address" value={link} onInput={(e) => setLink(e.currentTarget.value)} /></Field>
        {p && p.occasions.length > 0 && (
          <div className="mb-4">
            <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Occasion</p>
            <Pills label="Occasion" options={[ANY, ...p.occasions.map(occasionName)]} value={label(forId)}
              onChange={(n) => setFor(n === ANY ? "" : p.occasions.find((o) => occasionName(o) === n)?.id ?? "")} />
          </div>
        )}
        <div className="mb-5">
          <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Status</p>
          <Pills label="Status" options={STATUSES.map((s) => s.label)} value={STATUSES.find((s) => s.status === status)!.label}
            onChange={(l) => setStatusHere(STATUSES.find((s) => s.label === l)!.status)} />
        </div>
        <PrimaryButton type="submit" disabled={!ok}>{isNew ? (ok ? "Add idea" : "Say what the idea is") : "Save"}</PrimaryButton>
        {!isNew && <DeleteButton onClick={drop}>Delete idea</DeleteButton>}
      </form>
    </Sheet>
  )
}
