import { DeleteButton, offerUndo, Sheet } from "@/components/kit"
import { DayForm } from "@/components/day-form"
import { dayLabel, useMood } from "@/lib/mood"

/** Logs or edits any day in a sheet, and deletes it with Undo. */
export function DaySheet({ date, onClose }: { date: string | null; onClose: () => void }) {
  const m = useMood()
  const saved = date ? m.day(date) : null
  const label = date ? dayLabel(date) : ""
  const remove = async () => {
    if (!date) return
    const before = m.snapshot()
    onClose()
    await m.removeDay(date)
    offerUndo(`Deleted ${label}`, () => m.restore(before))
  }
  return (
    <Sheet open={date !== null} title={label} onClose={onClose}>
      {date && (
        <>
          <DayForm date={date} initial={saved} submit={saved ? "Save" : "Log this day"} onSave={async (d) => { await m.saveDay(date, d); onClose() }} />
          {saved && <DeleteButton onClick={remove}>Delete this day</DeleteButton>}
        </>
      )}
    </Sheet>
  )
}
