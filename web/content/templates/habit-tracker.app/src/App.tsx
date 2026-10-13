import { Router, Route } from "amber-router"
import { CalendarDays, CircleCheck, ListChecks } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import Today from "@/screens/today"
import History from "@/screens/history"
import Manage from "@/screens/manage"

// Today (tick off), History (five weeks, tick any day), Habits (add, rename, reorder, remove). A tab bar on iPhone, a sidebar from 900 px.
const screens = [
  { path: "/", label: "Today", icon: CircleCheck },
  { path: "/history", label: "History", icon: CalendarDays },
  { path: "/habits", label: "Habits", icon: ListChecks },
]

export default function App() {
  return (
    <AppShell title="Habit tracker" screens={screens}>
      <div className="mx-auto max-w-4xl px-4 pt-4 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Today} default />
          <Route path="/history" component={History} />
          <Route path="/habits" component={Manage} />
        </Router>
      </div>
    </AppShell>
  )
}
