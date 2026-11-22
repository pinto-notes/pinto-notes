import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { ArrowDown, ArrowUp, Minus, Pencil, Plus, X } from "lucide-react"
import { Field, inputClass, offerUndo, PrimaryButton, Section, Sheet, Title, TintButton } from "@/components/kit"
import { hours, plural, tagKey, useMood } from "@/lib/mood"
import { cn } from "@/lib/utils"

// The tags to pick from (added, renamed, reordered and removed here, with Undo), whether the app
// asks for hours slept, and the hours the person aims for.
export default function Settings() {
  const m = useMood()
  const [renaming, setRenaming] = useState<string | null>(null)
  const [text, setText] = useState("")
  // The goal as last tapped: two quick taps add a whole hour, even before the first is saved.
  const goal = useRef(m.sleepGoal)
  useEffect(() => { goal.current = m.sleepGoal }, [m.sleepGoal])
  const stepGoal = (by: number) => { goal.current = Math.max(4, Math.min(12, goal.current + by)); return m.setSleepGoal(goal.current) }
  const count = (tag: string) => m.all.filter((e) => (e.tags ?? []).some((t) => tagKey(t) === tagKey(tag))).length

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    if (!m.tags.some((x) => tagKey(x) === tagKey(t))) await m.setTags([...m.tags, t])
    setText("")
  }
  const remove = async (tag: string) => {
    const before = m.snapshot(), n = count(tag)
    await m.removeTag(tag)
    offerUndo(n ? `Removed ${tag} from the list and ${plural(n, "day")}` : `Removed ${tag}`, () => m.restore(before))
  }
  const move = (tag: string, by: number) => {
    const a = [...m.tags], i = a.indexOf(tag), j = i + by
    if (i < 0 || j < 0 || j >= a.length) return
    ;[a[i], a[j]] = [a[j], a[i]]
    return m.setTags(a)
  }
  const rename = async (to: string) => {
    const from = renaming
    setRenaming(null)
    if (!from || !to || to === from) return
    await m.renameTag(from, to)
  }
  const icon = "grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground disabled:opacity-30"

  return (
    <>
      <Title title="Settings" subtitle="Mood and energy" />
      <div className="grid grid-cols-1 gap-x-8 min-[900px]:grid-cols-2">
        <Section title="Tags" footer="Tap them when you log a day; Trends compares your mood on days with and without each. Renaming or removing a tag changes the days that have it.">
          {m.tags.map((t, i) => (
            <div key={t} className="flex min-h-11 items-center gap-1 border-t border-border py-0.5 pl-4 pr-1 first:border-t-0">
              <span className="min-w-0 flex-1 py-1">
                <span className="block break-words leading-snug">{t}</span>
                <span className="block text-[0.8125rem] text-muted-foreground tabular-nums">{plural(count(t), "day")}</span>
              </span>
              <button type="button" aria-label={`Move ${t} up`} disabled={i === 0} onClick={() => move(t, -1)} className={icon}><ArrowUp className="size-4" /></button>
              <button type="button" aria-label={`Move ${t} down`} disabled={i === m.tags.length - 1} onClick={() => move(t, 1)} className={icon}><ArrowDown className="size-4" /></button>
              <button type="button" aria-label={`Rename ${t}`} onClick={() => setRenaming(t)} className={icon}><Pencil className="size-4" /></button>
              <button type="button" aria-label={`Remove ${t}`} onClick={() => remove(t)} className={icon}><X className="size-4" /></button>
            </div>
          ))}
          <form onSubmit={add} className="flex items-center gap-2 border-t border-border px-4 py-2.5 first:border-t-0">
            <input aria-label="New tag" placeholder="A tag, like Meditation" className={cn(inputClass, "h-10 min-w-0 flex-1")} value={text} onInput={(e) => setText(e.currentTarget.value)} />
            <TintButton type="submit" aria-label="Add a tag" disabled={!text.trim()} className="h-10 w-10 shrink-0 px-0"><Plus /></TintButton>
          </form>
        </Section>
        <div>
          <Section title="Sleep" footer={m.logSleep ? "Hours slept are asked for with each day, drawn on Trends, and compared with your energy." : "Sleep is hidden. Hours already logged are kept."}>
            <div className="flex min-h-11 items-center gap-3 px-4 py-2.5">
              <span className="flex-1">Log hours slept</span>
              <button type="button" role="switch" aria-checked={m.logSleep} aria-label="Log hours slept" onClick={() => m.setLogSleep(!m.logSleep)}
                className={cn("relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 motion-reduce:transition-none", m.logSleep ? "bg-[var(--amber-accent)]" : "bg-muted")}>
                <span className={cn("absolute top-[2px] size-[27px] rounded-full bg-white shadow transition-[left] duration-200 motion-reduce:transition-none", m.logSleep ? "left-[22px]" : "left-[2px]")} />
              </button>
            </div>
            {m.logSleep && (
              <div className="flex min-h-11 items-center gap-2 border-t border-border py-1.5 pl-4 pr-2">
                <span className="flex-1">Sleep you aim for</span>
                <button type="button" aria-label="Aim for less sleep" disabled={m.sleepGoal <= 4} onClick={() => stepGoal(-0.5)} className={icon}><Minus className="size-4" /></button>
                <span className="w-14 text-center font-semibold tabular-nums" data-testid="sleep-goal-value">{hours(m.sleepGoal)}</span>
                <button type="button" aria-label="Aim for more sleep" disabled={m.sleepGoal >= 12} onClick={() => stepGoal(0.5)} className={icon}><Plus className="size-4" /></button>
              </div>
            )}
          </Section>
          <Section title="Your data" footer="Every day is kept in this note's app, synced with your other devices. Your AI reads and writes the same days when you ask it to.">
            <div className="px-4 py-3 tabular-nums" data-testid="data-count">{plural(m.all.length, "day")} logged{m.all.length ? `, since ${new Date(m.all[0].date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}</div>
          </Section>
        </div>
      </div>
      <RenameSheet name={renaming} onClose={() => setRenaming(null)} onSave={rename} />
    </>
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
