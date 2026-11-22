import { useLayoutEffect, useState } from "react"
import { Minus, Plus } from "lucide-react"
import { inputClass, PrimaryButton, TintButton } from "@/components/kit"
import { moodFill } from "@/components/marks"
import { avg, energyWord, ENERGY_WORDS, hasTag, moodWord, MOOD_WORDS, one, tagKey, useMood, type Day } from "@/lib/mood"
import { cn } from "@/lib/utils"

// A day's check-in in a few taps: mood and energy from 1 to 5, hours slept, tags, one line. The
// same form logs today on the Today screen and edits any day in a sheet.
export function DayForm({ date, initial, submit, onSave }: { date: string; initial: Day | null; submit: string; onSave: (d: Day) => unknown }) {
  const m = useMood()
  const [mood, setMood] = useState(0)
  const [energy, setEnergy] = useState(0)
  const [sleep, setSleep] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [newTag, setNewTag] = useState<string | null>(null)
  // Start from what the day has saved (or nothing) whenever another day is opened, or the saved
  // day changes under the form (the person's AI logged it).
  const key = date + JSON.stringify(initial)
  useLayoutEffect(() => {
    setMood(initial?.mood ?? 0); setEnergy(initial?.energy ?? 0)
    setSleep(typeof initial?.sleep === "number" ? one(initial.sleep) : "")
    setTags(initial?.tags ?? []); setNote(initial?.note ?? ""); setNewTag(null)
  }, [key])

  // The tags to pick from: the person's list, then any this day has that the list doesn't.
  const choices = [...m.allTags]
  for (const t of tags) if (!choices.some((c) => tagKey(c) === tagKey(t))) choices.push(t)
  const on = (t: string) => hasTag({ mood: 0, energy: 0, tags }, t)
  const toggle = (t: string) => setTags(on(t) ? tags.filter((x) => tagKey(x) !== tagKey(t)) : [...tags, t])
  const addTag = async () => {
    const t = (newTag ?? "").trim()
    setNewTag(null)
    if (!t) return
    const known = m.allTags.find((c) => tagKey(c) === tagKey(t))
    if (!on(known ?? t)) setTags([...tags, known ?? t])
    if (!known) await m.setTags([...m.tags, t])
  }

  // Hours slept, in half hours. The first step starts from the person's usual night.
  const usual = Math.round((avg(m.all.slice(-14).map((e) => e.sleep).filter((x): x is number => typeof x === "number")) ?? 7.5) * 2) / 2
  const parsed = sleep.trim() === "" ? null : parseFloat(sleep.replace(",", "."))
  const step = (by: number) => setSleep(one(Math.max(0, Math.min(24, parsed === null || !Number.isFinite(parsed) ? usual : parsed + by))))
  const sleepOk = parsed === null || (Number.isFinite(parsed) && parsed >= 0 && parsed <= 24)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mood || !energy || !sleepOk) return
    await onSave({ mood, energy, ...(m.logSleep && parsed !== null ? { sleep: parsed } : {}), ...(tags.length ? { tags } : {}), ...(note.trim() ? { note: note.trim() } : {}) })
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Scale label="Mood" words={MOOD_WORDS} value={mood} onChange={setMood} fill={moodFill} />
      <Scale label="Energy" words={ENERGY_WORDS} value={energy} onChange={setEnergy} fill={() => "bg-energy text-on-energy"} />
      {m.logSleep && (
        <div>
          <label htmlFor={`sleep-${date}`} className="mb-1.5 block text-[0.8125rem] font-medium text-muted-foreground">Hours slept</label>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Less sleep" onClick={() => step(-0.5)} className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-foreground active:opacity-70"><Minus className="size-5" /></button>
            <input id={`sleep-${date}`} inputMode="decimal" placeholder="–" value={sleep} onInput={(e) => setSleep(e.currentTarget.value)}
              className={cn(inputClass, "w-20 text-center text-[1.0625rem] font-semibold tabular-nums", !sleepOk && "border-destructive")} />
            <button type="button" aria-label="More sleep" onClick={() => step(0.5)} className="grid size-11 shrink-0 place-items-center rounded-full bg-muted text-foreground active:opacity-70"><Plus className="size-5" /></button>
            <span className={cn("text-[0.875rem]", sleepOk ? "text-muted-foreground" : "text-destructive")}>{sleepOk ? "last night" : "0 to 24 hours"}</span>
          </div>
        </div>
      )}
      <div>
        <p className="mb-1.5 text-[0.8125rem] font-medium text-muted-foreground" id={`tags-${date}`}>Tags</p>
        <div role="group" aria-labelledby={`tags-${date}`} className="flex flex-wrap gap-2">
          {choices.map((t) => (
            <button key={t} type="button" aria-pressed={on(t)} onClick={() => toggle(t)}
              className={cn("h-11 rounded-full px-4 text-[0.9375rem] font-medium mouse:h-9", on(t) ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
              {t}
            </button>
          ))}
          {newTag === null
            ? <button type="button" onClick={() => setNewTag("")} className="inline-flex h-11 items-center gap-1 rounded-full border border-dashed border-input px-4 text-[0.9375rem] font-medium text-muted-foreground mouse:h-9"><Plus className="size-4" /> Tag</button>
            : (
              <span className="flex items-center gap-2">
                <input aria-label="New tag" autoFocus placeholder="Your own tag" value={newTag} onInput={(e) => setNewTag(e.currentTarget.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } if (e.key === "Escape") { e.preventDefault(); setNewTag(null) } }}
                  className={cn(inputClass, "h-11 w-40 mouse:h-9")} />
                <TintButton type="button" className="h-11 mouse:h-9" onClick={addTag} disabled={!newTag.trim()}>Add tag</TintButton>
              </span>
            )}
        </div>
      </div>
      <div>
        <label htmlFor={`note-${date}`} className="mb-1.5 block text-[0.8125rem] font-medium text-muted-foreground">A line about the day</label>
        <input id={`note-${date}`} className={inputClass} placeholder="Optional" value={note} onInput={(e) => setNote(e.currentTarget.value)} />
      </div>
      <PrimaryButton type="submit" disabled={!mood || !energy || !sleepOk}>{submit}</PrimaryButton>
    </form>
  )
}

/** One to five, as five buttons in a row; the word for the chosen one beside the label. */
function Scale({ label, words, value, onChange, fill }: { label: string; words: string[]; value: number; onChange: (n: number) => void; fill: (n: number) => string }) {
  const word = label === "Mood" ? moodWord(value) : energyWord(value)
  return (
    <div>
      <p className="mb-1.5 flex items-baseline gap-2 text-[0.8125rem] font-medium text-muted-foreground">
        <span>{label}</span>
        {value > 0 && <span className="font-semibold text-foreground">{word}</span>}
      </p>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${label} ${n}, ${words[n - 1]}`} onClick={() => onChange(n)}
            className={cn("h-12 rounded-xl text-[1.125rem] font-semibold tabular-nums transition-colors duration-150 motion-reduce:transition-none mouse:h-10",
              value === n ? fill(n) : "bg-muted text-foreground")}>
            {n}
          </button>
        ))}
      </div>
      <div aria-hidden className="mt-1 flex justify-between px-1 text-[0.75rem] text-muted-foreground"><span>{words[0]}</span><span>{words[4]}</span></div>
    </div>
  )
}
