import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { useCollection } from "@/lib/amber"
import { PageHeader } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Habit } from "@/lib/habits"

export default function Habits() {
  const habits = useCollection("habits")
  const list = habits.items as Habit[]
  const [name, setName] = useState("")
  const [detail, setDetail] = useState("")
  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await habits.add({ name: name.trim(), ...(detail.trim() ? { detail: detail.trim() } : {}) })
    setName("")
    setDetail("")
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
      <Card className="mt-4 gap-0 py-0">
        {list.length ? list.map((h) => (
          <div key={h.id} className="flex items-center gap-2 border-t px-4 py-2 first:border-0">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{h.name}</span>
              {h.detail && <span className="block truncate text-sm text-muted-foreground">{h.detail}</span>}
            </span>
            <Button variant="ghost" size="icon" aria-label={`Remove ${h.name}`} onClick={() => habits.remove(h.id)}><Trash2 /></Button>
          </div>
        )) : <p className="px-4 py-6 text-center text-muted-foreground">No habits yet.</p>}
      </Card>
    </>
  )
}
