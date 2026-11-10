import { useEffect, useRef } from "react"
import { Router, Route } from "amber-router"
import { CalendarDays, CircleCheck, ListChecks } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { firstScreenPage, offerUndo, UndoBar } from "@/components/kit"
import Today from "@/screens/today"
import History from "@/screens/history"
import Manage from "@/screens/manage"
import Setup, { draft } from "@/screens/setup"
import { useHabits } from "@/lib/habits"

// Today (tick off, skip, a habit's own page), Month (a calendar per habit: tick or skip any day),
// Habits (add, rename, schedule, reorder, remove). A tab bar on iPhone, a sidebar from 900 px; two
// columns from 700 px, so a wide Mac note is used, not stretched.
const screens = [
  { path: "/", label: "Today", icon: CircleCheck },
  { path: "/month", label: "Month", icon: CalendarDays },
  { path: "/habits", label: "Habits", icon: ListChecks },
]

export default function App() {
  const { fresh } = useHabits()
  // The person's AI set the tracker up while they were picking: the app shows the result, and what
  // they had picked isn't dropped without a word.
  const was = useRef(fresh)
  useEffect(() => {
    if (was.current && !fresh && draft.touched && !draft.mine && draft.use) {
      offerUndo("Your AI set up your habits. What you picked here wasn't used.", draft.use, "Use mine", true)
    }
    was.current = fresh
  }, [fresh])
  // A new tracker opens on Pick your habits, alone: there's nothing to see on the other screens
  // until the person has chosen what to track.
  if (fresh) return <div className={firstScreenPage}><Setup /></div>
  return (
    <AppShell title="Habit tracker" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Today} default />
          <Route path="/month" component={History} />
          <Route path="/history" component={History} />
          <Route path="/habits" component={Manage} />
        </Router>
      </div>
    </AppShell>
  )
}
