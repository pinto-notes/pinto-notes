import { useLayoutEffect, useState } from "react"
import { ArrowDown, ArrowUp, Pencil, Plus, X } from "lucide-react"
import { Field, inputClass, offerUndo, PrimaryButton, Section, Sheet, Title, TintButton } from "@/components/kit"
import { itemKey, OTHER, useMeals } from "@/lib/meals"
import { cn } from "@/lib/utils"

// What the app needs to know about the household: what's always in the cupboard (left off every
// list), the aisles in the order the person walks the shop (the list follows it), and who cooks.
// Each list is added to, renamed, reordered (the aisles) and removed from here, with Undo.
export default function Settings() {
  const m = useMeals()
  const [renaming, setRenaming] = useState<{ kind: "aisle" | "cook" | "cupboard"; name: string } | null>(null)

  const remove = async (kind: "aisle" | "cook" | "cupboard", name: string) => {
    const before = m.snapshot()
    if (kind === "aisle") await m.setAisles(m.aisles.filter((a) => a !== name))
    if (kind === "cook") await m.setCooks(m.cooks.filter((c) => c !== name))
    if (kind === "cupboard") await m.setCupboard(m.cupboard.filter((c) => c !== name))
    offerUndo(kind === "aisle" ? `Removed ${name}. What was in it is under Other.` : `Removed ${name}`, () => m.restore(before))
  }
  const move = (name: string, by: number) => {
    const a = [...m.aisles], i = a.indexOf(name), j = i + by
    if (i < 0 || j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    return m.setAisles(a)
  }
  const rename = async (to: string) => {
    if (!renaming) return
    const { kind, name } = renaming
    setRenaming(null)
    if (!to || to === name) return
    if (kind === "aisle") await m.renameAisle(name, to)
    if (kind === "cook") await m.renameCook(name, to)
    if (kind === "cupboard") await m.setCupboard(m.cupboard.map((c) => (c === name ? to : c)))
  }

  return (
    <>
      <Title title="Settings" subtitle="Meal plan" />
      <div className="grid grid-cols-1 gap-x-6 min-[900px]:grid-cols-2">
        <div>
          <ListSection title="Always in the cupboard" footer="Left off every grocery list. Things run low? Remove them here and they're back on the list."
            items={m.cupboard} add="Add to the cupboard" field="New cupboard item" placeholder="Something you always have"
            onAdd={(x) => (m.cupboard.some((c) => itemKey(c) === itemKey(x)) ? undefined : m.setCupboard([...m.cupboard, x]))}
            onRename={(name) => setRenaming({ kind: "cupboard", name })} onRemove={(x) => remove("cupboard", x)} />
          <ListSection title="Who cooks" footer="The names to pick from when you plan a dinner."
            items={m.cooks} add="Add a cook" field="New cook" placeholder="A name"
            onAdd={(x) => (m.cooks.includes(x) ? undefined : m.setCooks([...m.cooks, x]))}
            onRename={(name) => setRenaming({ kind: "cook", name })} onRemove={(x) => remove("cook", x)} />
        </div>
        <ListSection title="Aisles, in the order you shop" footer="The grocery list follows this order. Anything in an aisle you remove goes under Other."
          items={m.aisles} add="Add an aisle" field="New aisle" placeholder="An aisle, like Spices"
          onAdd={(x) => (m.aisles.includes(x) ? undefined : m.setAisles(m.aisles.includes(OTHER) ? [...m.aisles.filter((a) => a !== OTHER), x, OTHER] : [...m.aisles, x]))}
          onRename={(name) => setRenaming({ kind: "aisle", name })} onRemove={(x) => remove("aisle", x)} onMove={move} />
      </div>
      <RenameSheet name={renaming?.name ?? null} onClose={() => setRenaming(null)} onSave={rename} />
    </>
  )
}

function ListSection({ title, footer, items, add, field, placeholder, onAdd, onRename, onRemove, onMove }: {
  title: string; footer: string; items: string[]; add: string; field: string; placeholder: string
  onAdd: (x: string) => unknown; onRename: (x: string) => unknown; onRemove: (x: string) => unknown; onMove?: (x: string, by: number) => unknown
}) {
  const [text, setText] = useState("")
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await onAdd(text.trim())
    setText("")
  }
  const icon = "grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground disabled:opacity-30"
  return (
    <Section title={title} footer={footer}>
      {items.map((x, i) => (
        <div key={x} className="flex min-h-11 items-center gap-1 border-t border-border py-0.5 pl-4 pr-1 first:border-t-0">
          <span className="min-w-0 flex-1 truncate">{x}</span>
          {onMove && <button type="button" aria-label={`Move ${x} up`} disabled={i === 0} onClick={() => onMove(x, -1)} className={icon}><ArrowUp className="size-4" /></button>}
          {onMove && <button type="button" aria-label={`Move ${x} down`} disabled={i === items.length - 1} onClick={() => onMove(x, 1)} className={icon}><ArrowDown className="size-4" /></button>}
          <button type="button" aria-label={`Rename ${x}`} onClick={() => onRename(x)} className={icon}><Pencil className="size-4" /></button>
          <button type="button" aria-label={`Remove ${x}`} onClick={() => onRemove(x)} className={icon}><X className="size-4" /></button>
        </div>
      ))}
      <form onSubmit={submit} className="flex items-center gap-2 border-t border-border px-4 py-2.5 first:border-t-0">
        <input aria-label={field} placeholder={placeholder} className={cn(inputClass, "h-10 min-w-0 flex-1")} value={text} onInput={(e) => setText(e.currentTarget.value)} />
        <TintButton type="submit" aria-label={add} disabled={!text.trim()} className="h-10 w-10 shrink-0 px-0"><Plus /></TintButton>
      </form>
    </Section>
  )
}

function RenameSheet({ name, onClose, onSave }: { name: string | null; onClose: () => void; onSave: (to: string) => unknown }) {
  const [text, setText] = useState("")
  useLayoutEffect(() => { if (name !== null) setText(name) }, [name])
  return (
    <Sheet open={name !== null} title={`Rename ${name ?? ""}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) onSave(text.trim()) }}>
        <Field label="Name" htmlFor="r-name"><input id="r-name" className={inputClass} value={text} onInput={(e) => setText(e.currentTarget.value)} /></Field>
        <PrimaryButton type="submit" disabled={!text.trim()}>Save</PrimaryButton>
      </form>
    </Sheet>
  )
}
