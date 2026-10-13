import { useState } from "react"
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, Undo2 } from "lucide-react"
import { batch, useCollection } from "@/lib/amber"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { shown, type Habit } from "@/lib/habits"

// The person manages their habits here themselves: add, rename, reorder and remove (with Undo).
export default function Habits() {
  const habits = useCollection("habits")
  const list = shown(habits.items as Habit[])
  const [name, setName] = useState("")
  const [detail, setDetail] = useState("")
  const [editing, setEditing] = useState<{ id: string; name: string; detail: string } | null>(null)
  // The last habit removed, while this screen is open: Undo brings it back.
  const [removed, setRemoved] = useState<Habit | null>(null)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const last = list.length ? Math.max(...list.map((h, i) => h.order ?? i)) : -1
    await habits.add({ name: name.trim(), ...(detail.trim() ? { detail: detail.trim() } : {}), order: last + 1 })
    setName("")
    setDetail("")
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editing.name.trim()) return
    await habits.update(editing.id, { name: editing.name.trim(), detail: editing.detail.trim() })
    setEditing(null)
  }
  // Moving one place swaps it with its neighbour; every habit gets its position written down.
  const move = (from: number, to: number) => batch(async () => {
    const next = [...list]
    const [h] = next.splice(from, 1)
    next.splice(to, 0, h)
    for (const [i, x] of next.entries()) if (x.order !== i) await habits.update(x.id, { order: i })
  })
  const remove = async (h: Habit) => {
    await habits.update(h.id, { removed: true })
    setRemoved(h)
  }
  const undo = async () => {
    if (!removed) return
    await habits.update(removed.id, { removed: false })
    setRemoved(null)
  }

  return (
    <>
      <PageHeader title="Habits" subtitle="What you want to do each day." />
      <form onSubmit={add} className="grid gap-2 min-[600px]:grid-cols-[1fr_1fr_auto]">
        <Label htmlFor="habit-name" className="sr-only">New habit</Label>
        <Input id="habit-name" placeholder="New habit" value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <Label htmlFor="habit-detail" className="sr-only">How much</Label>
        <Input id="habit-detail" placeholder="How much (optional)" value={detail} onChange={(e) => setDetail(e.currentTarget.value)} />
        <Button type="submit"><Plus /> Add</Button>
      </form>
      {removed && (
        <div role="status" className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-4 py-1.5 text-sm">
          <span className="min-w-0 flex-1 truncate">Removed {removed.name}</span>
          <Button variant="ghost" size="sm" onClick={undo}><Undo2 /> Undo</Button>
        </div>
      )}
      <Card className="mt-4 gap-0 py-0">
        {list.length ? list.map((h, i) => (
          <div key={h.id} className="flex items-center gap-1 border-t px-4 py-2 first:border-0">
            {editing?.id === h.id ? (
              <form onSubmit={save} className="grid flex-1 gap-2 min-[600px]:grid-cols-[1fr_1fr_auto]">
                <Label htmlFor="edit-name" className="sr-only">Name</Label>
                <Input id="edit-name" autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.currentTarget.value })} />
                <Label htmlFor="edit-detail" className="sr-only">How much</Label>
                <Input id="edit-detail" placeholder="How much (optional)" value={editing.detail} onChange={(e) => setEditing({ ...editing, detail: e.currentTarget.value })} />
                <Button type="submit" size="sm"><Check /> Save</Button>
              </form>
            ) : (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{h.name}</span>
                  {h.detail && <span className="block truncate text-sm text-muted-foreground">{h.detail}</span>}
                </span>
                <Button variant="ghost" size="icon" aria-label={`Move ${h.name} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp /></Button>
                <Button variant="ghost" size="icon" aria-label={`Move ${h.name} down`} disabled={i === list.length - 1} onClick={() => move(i, i + 1)}><ArrowDown /></Button>
                <Button variant="ghost" size="icon" aria-label={`Rename ${h.name}`} onClick={() => setEditing({ id: h.id, name: h.name, detail: h.detail ?? "" })}><Pencil /></Button>
                <Button variant="ghost" size="icon" aria-label={`Remove ${h.name}`} onClick={() => remove(h)}><Trash2 /></Button>
              </>
            )}
          </div>
        )) : <p className="px-4 py-6 text-center text-muted-foreground">No habits yet.</p>}
      </Card>
    </>
  )
}
