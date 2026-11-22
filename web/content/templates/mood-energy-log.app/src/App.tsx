import { CalendarDays, LineChart, Settings2, SunMedium } from "lucide-react"
import { Router, Route } from "amber-router"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import Today from "@/screens/today"
import Month from "@/screens/month"
import Trends from "@/screens/trends"
import Settings from "@/screens/settings"
import { useSummary } from "@/lib/mood"

// Today (log the day in a few taps, and the week so far), Month (a calendar coloured by mood),
// Trends (30 or 90 days of mood, energy and sleep, and patterns from the person's own days),
// Settings (tags, sleep). A tab bar on iPhone, a sidebar from 900 px.
const screens = [
  { path: "/", label: "Today", icon: SunMedium },
  { path: "/month", label: "Month", icon: CalendarDays },
  { path: "/trends", label: "Trends", icon: LineChart },
  { path: "/settings", label: "Settings", icon: Settings2 },
]

export default function App() {
  useSummary()
  return (
    <AppShell title="Mood and energy" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Today} default />
          <Route path="/month" component={Month} />
          <Route path="/trends" component={Trends} />
          <Route path="/settings" component={Settings} />
        </Router>
      </div>
    </AppShell>
  )
}
