import { useLayoutEffect, useState } from "react"
import { ArrowDown, ArrowUp, Pencil, Plus, X } from "lucide-react"
import { Field, inputClass, PrimaryButton, Section, Sheet, TintButton } from "@/components/kit"
import { cn } from "@/lib/utils"

/** A list of names to add to, rename (tap the name), reorder and remove from (the areas). */
export function ListSection({ title, footer, items, add, field, placeholder, onAdd, onRename, onRemove, onMove }: {
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
          <button type="button" aria-label={`Rename ${x}`} onClick={() => onRename(x)} className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-left">
            <span className="min-w-0 truncate">{x}</span>
            <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
          </button>
          {onMove && <button type="button" aria-label={`Move ${x} up`} disabled={i === 0} onClick={() => onMove(x, -1)} className={icon}><ArrowUp className="size-4" /></button>}
          {onMove && <button type="button" aria-label={`Move ${x} down`} disabled={i === items.length - 1} onClick={() => onMove(x, 1)} className={icon}><ArrowDown className="size-4" /></button>}
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

export function RenameSheet({ name, onClose, onSave }: { name: string | null; onClose: () => void; onSave: (to: string) => unknown }) {
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
