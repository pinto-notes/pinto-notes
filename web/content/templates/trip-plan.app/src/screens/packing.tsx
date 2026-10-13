import { useLayoutEffect, useState } from "react"
import { Check, Pencil, Plus, X } from "lucide-react"
import { Bar, DeleteButton, Field, inputClass, offerUndo, PrimaryButton, Section, Sheet, Title, TintButton } from "@/components/kit"
import { useTrip, type Item } from "@/lib/trip"
import { cn } from "@/lib/utils"

// The packing list: tap a row to pack it. What's left to pack stays on top. The pencil renames an
// item; the cross deletes it (with Undo).
export default function Packing() {
  const { packing, packed, togglePacked, addItem, updateItem, removeItem, restorePacking } = useTrip()
  const [text, setText] = useState("")
  const [editing, setEditing] = useState<Item | null>(null)
  const [name, setName] = useState("")
  const order = [...packing.filter((x) => !x.packed), ...packing.filter((x) => x.packed)]
  useLayoutEffect(() => { if (editing) setName(editing.text) }, [editing])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await addItem(text.trim())
    setText("")
  }
  const drop = async (x: Item) => {
    const before = packing
    setEditing(null)
    await removeItem(x.id)
    offerUndo(`Deleted ${x.text}`, () => restorePacking(before))
  }
  const rename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !name.trim()) return
    await updateItem(editing.id, name.trim())
    setEditing(null)
  }

  return (
    <>
      <Title title="Packing" subtitle={`${packed} of ${packing.length} packed`} />
      <Bar className="mb-5" value={packing.length ? packed / packing.length : 0} label="Packed" />
      <Section footer={packing.length ? undefined : "Nothing on the list yet. Type the first thing to pack above and tap +."}>
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
        <form onSubmit={add} className="flex items-center gap-2 border-t border-border px-4 py-2.5 first:border-t-0">
          <input aria-label="New item" placeholder="Add an item" className={cn(inputClass, "h-10 min-w-0 flex-1")} value={text} onInput={(e) => setText(e.currentTarget.value)} />
          <TintButton type="submit" aria-label="Add item" disabled={!text.trim()} className="h-10 w-10 shrink-0 px-0"><Plus /></TintButton>
        </form>
      </Section>
      <Sheet open={editing !== null} title="Edit item" onClose={() => setEditing(null)}>
        <form onSubmit={rename}>
          <Field label="Item" htmlFor="p-name"><input id="p-name" className={inputClass} value={name} onInput={(e) => setName(e.currentTarget.value)} /></Field>
          <PrimaryButton type="submit" disabled={!name.trim()}>Save</PrimaryButton>
          {editing && <DeleteButton onClick={() => drop(editing)}>Delete item</DeleteButton>}
        </form>
      </Sheet>
    </>
  )
}
