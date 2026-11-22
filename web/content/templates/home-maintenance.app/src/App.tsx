import { Router, Route } from "amber-router"
import { CalendarCheck, House, ListChecks, ReceiptText } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import { Sheets } from "@/components/sheets"
import Due from "@/screens/due"
import Jobs from "@/screens/jobs"
import History from "@/screens/history"
import Home from "@/screens/home"
import { useSummary } from "@/lib/home"

// Due (what's overdue, due this month and coming up, marked done with a tap), Jobs (every job by
// area, and the areas), History (what was done and spent, a year at a time) and Home (appliances,
// home details, who to call). A tab bar on iPhone, a sidebar from 900 px.
const screens = [
  { path: "/", label: "Due", icon: CalendarCheck },
  { path: "/jobs", label: "Jobs", icon: ListChecks },
  { path: "/history", label: "History", icon: ReceiptText },
  { path: "/home", label: "Home", icon: House },
]

export default function App() {
  useSummary()
  return (
    <AppShell title="Home maintenance" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Due} default />
          <Route path="/jobs" component={Jobs} />
          <Route path="/history" component={History} />
          <Route path="/home" component={Home} />
        </Router>
      </div>
      <Sheets />
    </AppShell>
  )
}
