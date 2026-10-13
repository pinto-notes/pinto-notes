import { Router, Route } from "amber-router"
import { Backpack, CalendarDays, Plane, Ticket } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import Overview from "@/screens/overview"
import Days from "@/screens/days"
import Bookings from "@/screens/bookings"
import Packing from "@/screens/packing"

// Trip (countdown and what's left to do), Days (the plan), Bookings (paid ticks), Packing (the list).
const screens = [
  { path: "/", label: "Trip", icon: Plane },
  { path: "/days", label: "Days", icon: CalendarDays },
  { path: "/bookings", label: "Bookings", icon: Ticket },
  { path: "/packing", label: "Packing", icon: Backpack },
]

export default function App() {
  return (
    <AppShell title="Trip plan" screens={screens}>
      <div className="mx-auto max-w-4xl px-4 pt-4 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Overview} default />
          <Route path="/days" component={Days} />
          <Route path="/bookings" component={Bookings} />
          <Route path="/packing" component={Packing} />
        </Router>
      </div>
    </AppShell>
  )
}
