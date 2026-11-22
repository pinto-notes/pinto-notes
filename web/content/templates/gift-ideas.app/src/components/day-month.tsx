import { inputClass } from "@/components/kit"
import { MONTHS } from "@/lib/gifts"
import { cn } from "@/lib/utils"

/** A day that comes round every year ("mm-dd"), as a day and a month: no year, since a birthday's
 *  year isn't needed and often isn't known. "" until both are chosen. */
export function DayMonth({ id, value, onChange, label }: { id: string; value: string; onChange: (md: string) => void; label: string }) {
  const [mo, d] = value ? value.split("-") : ["", ""]
  const set = (m: string, day: string) => onChange(m && day ? `${m}-${day}` : m ? `${m}-` : day ? `-${day}` : "")
  const days = mo ? new Date(2024, Number(mo), 0).getDate() : 31
  return (
    <fieldset className="mb-4">
      <legend className="mb-1.5 block text-[0.8125rem] font-medium text-muted-foreground">{label}</legend>
      <div className="flex gap-3">
        <select id={`${id}-day`} aria-label={`${label}: day`} className={cn(inputClass, "w-24")} value={d ?? ""} onChange={(e) => set(mo ?? "", e.currentTarget.value)}>
          <option value="">Day</option>
          {Array.from({ length: days }, (_, k) => String(k + 1).padStart(2, "0")).map((v) => <option key={v} value={v}>{Number(v)}</option>)}
        </select>
        <select id={`${id}-month`} aria-label={`${label}: month`} className={cn(inputClass, "min-w-0 flex-1")} value={mo ?? ""} onChange={(e) => set(e.currentTarget.value, d ?? "")}>
          <option value="">Month</option>
          {MONTHS.map((m, k) => <option key={m} value={String(k + 1).padStart(2, "0")}>{m}</option>)}
        </select>
      </div>
    </fieldset>
  )
}
/** Both halves chosen. */
export const complete = (md: string) => /^\d{2}-\d{2}$/.test(md)
