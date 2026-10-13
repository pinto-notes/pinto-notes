import { Router, Route } from "amber-router"
import { CalendarCheck, ListChecks } from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { AppShell } from "@/components/app-shell"
import Today from "@/screens/today"
import Habits from "@/screens/habits"

// The app's places: a tab bar on iPhone, a sidebar from 900 px (components/app-shell.tsx).
const screens = [
  { path: "/", label: "Today", icon: CalendarCheck },
  { path: "/habits", label: "Habits", icon: ListChecks },
]

export default function App() {
  return (
    <AppShell title="Habit tracker" screens={screens}>
      <div className="mx-auto max-w-3xl px-4 pt-4 min-[900px]:px-10 min-[900px]:pt-8">
        <Router>
          <Route path="/" component={Today} default />
          <Route path="/habits" component={Habits} />
        </Router>
      </div>
      <Toaster position="top-center" />
    </AppShell>
  )
}
