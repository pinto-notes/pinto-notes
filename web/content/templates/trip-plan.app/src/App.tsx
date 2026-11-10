import { useEffect, useRef } from "react"
import { Router, Route } from "amber-router"
import { Backpack, CalendarDays, Plane, Ticket } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { firstScreenPage, offerUndo, UndoBar } from "@/components/kit"
import Overview from "@/screens/overview"
import Days from "@/screens/days"
import Bookings from "@/screens/bookings"
import Packing from "@/screens/packing"
import First, { draft } from "@/screens/first"
import { useTrip } from "@/lib/trip"

// Trip (countdown and what's left to do), Days (the plan), Bookings (paid ticks), Packing (the list).
const screens = [
  { path: "/", label: "Trip", icon: Plane },
  { path: "/days", label: "Days", icon: CalendarDays },
  { path: "/bookings", label: "Bookings", icon: Ticket },
  { path: "/packing", label: "Packing", icon: Backpack },
]

export default function App() {
  const { trip, past } = useTrip()
  // The person's AI planned the trip while they were typing theirs: the app shows the result, and
  // what they had typed isn't dropped without a word.
  const had = useRef(!!trip)
  useEffect(() => {
    if (!had.current && trip && draft.touched && !draft.mine && draft.use) {
      offerUndo(`Your AI planned ${trip.name}. What you typed here wasn't used.`, draft.use, "Use mine", true)
    }
    had.current = !!trip
  }, [!!trip])
  // A new app opens on Where are you going?, alone: there is no trip to count down to, and the
  // packing list it starts with isn't the person's until they have one.
  if (!trip && !past.length) return <div className={firstScreenPage}><First /></div>
  return (
    <AppShell title="Trip plan" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
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
