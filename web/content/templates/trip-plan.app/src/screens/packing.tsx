import { useLayoutEffect, useState } from "react"
import { Check, Pencil, Plus, X } from "lucide-react"
import { Bar, DeleteButton, Field, inputClass, offerUndo, Pills, PrimaryButton, Section, Sheet, Title, TintButton } from "@/components/kit"
import { GROUPS, useTrip, type Item } from "@/lib/trip"
import { cn } from "@/lib/utils"

// The packing list, by group (documents, clothes, toiletries, tech, other): tap a row to pack it.
// What's left to pack stays on top of each group. The pencil renames an item or moves it to another
// group; the cross deletes it (with Undo). The list stays for the next trip: New trip unpacks it.
// Groups sit side by side on a wide note.
export default function Packing() {
  const { packing, packed, togglePacked, addItem, updateItem, updateItemGroup, removeItem, restorePacking, unpackAll } = useTrip()
  const [text, setText] = useState("")
  const [group, setGroup] = useState<string>("Clothes")
  const [editing, setEditing] = useState<Item | null>(null)
  const [name, setName] = useState("")
  const [moveTo, setMoveTo] = useState<string>("Other")
  useLayoutEffect(() => { if (editing) { setName(editing.text); setMoveTo(editing.group ?? "Other") } }, [editing])
  // A list from before groups (no item has one) is shown as one list.
  const grouped = packing.some((x) => x.group)
  const groups = grouped ? [...GROUPS, ...new Set(packing.map((x) => x.group).filter((g): g is string => !!g && !(GROUPS as readonly string[]).includes(g)))] : ["All"]
  const inGroup = (g: string) => packing.filter((x) => !grouped || (x.group ?? "Other") === g)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await addItem(text.trim(), group)
    setText("")
  }
  const drop = async (x: Item) => {
    const before = packing
    setEditing(null)
    await removeItem(x.id)
    offerUndo(`Deleted ${x.text}`, () => restorePacking(before))
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !name.trim()) return
    if (name.trim() !== editing.text) await updateItem(editing.id, name.trim())
    if (moveTo !== (editing.group ?? "Other")) await updateItemGroup(editing.id, moveTo)
    setEditing(null)
  }
  const unpack = async () => {
    const before = packing
    await unpackAll()
    offerUndo("Unpacked everything", () => restorePacking(before))
  }

  return (
    <>
      <Title title="Packing" subtitle={`${packed} of ${packing.length} packed`} action={packed > 0 ? <TintButton onClick={unpack}>Unpack all</TintButton> : undefined} />
      <Bar className="mb-5" value={packing.length ? packed / packing.length : 0} label="Packed" />
      <Section title="Add to the list">
        <form onSubmit={add} className="px-4 py-3">
          <div className="flex items-center gap-2">
            <input aria-label="New item" placeholder="Add an item" className={cn(inputClass, "h-10 min-w-0 flex-1")} value={text} onInput={(e) => setText(e.currentTarget.value)} />
            <TintButton type="submit" aria-label="Add item" disabled={!text.trim()} className="h-10 w-10 shrink-0 px-0"><Plus /></TintButton>
          </div>
          <div className="mt-3"><Pills label="Group" options={GROUPS} value={group as (typeof GROUPS)[number]} onChange={setGroup} /></div>
        </form>
      </Section>
      {!packing.length && <p className="px-1 pb-6 text-muted-foreground">Nothing on the list yet. Type the first thing to pack above and tap +.</p>}
      <div className="grid gap-x-6 min-[700px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {groups.map((g) => {
          const items = inGroup(g)
          if (!items.length) return null
          const order = [...items.filter((x) => !x.packed), ...items.filter((x) => x.packed)]
          return (
            <Section key={g} title={grouped ? `${g} · ${items.filter((x) => x.packed).length} of ${items.length}` : undefined}>
              {order.map((x) => (
                <div key={x.id} className="flex min-h-11 items-center border-t border-border first:border-t-0">
                  <button type="button" aria-label={x.text} aria-pressed={x.packed} onClick={() => togglePacked(x.id)} className="flex min-h-12 min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left">
                    <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 motion-reduce:transition-none", x.packed ? "border-transparent bg-[var(--amber-accent)] text-[var(--amber-on-accent)]" : "border-[var(--amber-field-border)] text-transparent")}>
                      <Check className="size-3.5" strokeWidth={3.5} />
                    </span>
                    <span className={cn("min-w-0 flex-1", x.packed && "text-muted-foreground line-through decoration-1")}>{x.text}</span>
                  </button>
                  <button type="button" aria-label={`Edit ${x.text}`} onClick={() => setEditing(x)} className="grid size-11 place-items-center rounded-full text-muted-foreground"><Pencil className="size-4" /></button>
                  <button type="button" aria-label={`Delete ${x.text}`} onClick={() => drop(x)} className="mr-1 grid size-11 place-items-center rounded-full text-muted-foreground"><X className="size-4" /></button>
                </div>
              ))}
            </Section>
          )
        })}
      </div>
      <p className="px-1 pb-6 text-[0.8125rem] text-muted-foreground">The list stays for your next trip: Start a new trip (Edit on the Trip tab) unpacks it, ready to pack again.</p>
      <Sheet open={editing !== null} title="Edit item" onClose={() => setEditing(null)}>
        <form onSubmit={save}>
          <Field label="Item" htmlFor="p-name"><input id="p-name" className={inputClass} value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
          <div className="mb-4">
            <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground">Group</p>
            <Pills label="Move to group" options={GROUPS} value={moveTo as (typeof GROUPS)[number]} onChange={setMoveTo} />
          </div>
          <PrimaryButton type="submit" disabled={!name.trim()}>Save</PrimaryButton>
          {editing && <DeleteButton onClick={() => drop(editing)}>Delete item</DeleteButton>}
        </form>
      </Sheet>
    </>
  )
}
