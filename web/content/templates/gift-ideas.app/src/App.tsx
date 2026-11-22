import { useEffect, useRef } from "react"
import { Router, Route } from "amber-router"
import { CalendarHeart, Settings2, Users } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { firstScreenPage, offerUndo, UndoBar } from "@/components/kit"
import Upcoming from "@/screens/upcoming"
import People from "@/screens/people"
import PersonPage from "@/screens/person"
import EventPage from "@/screens/event"
import Settings from "@/screens/settings"
import First, { draft } from "@/screens/first"
import { useGifts } from "@/lib/gifts"

// Upcoming (the next occasions by date, with days left, what's bought and the budget), People
// (everyone you buy for), Settings (currency, the day of Christmas). A person opens on their own
// page (/person/<id>), a shared occasion such as Christmas on its own (/event/<key>).
const screens = [
  { path: "/", label: "Upcoming", icon: CalendarHeart },
  { path: "/people", label: "People", icon: Users },
  { path: "/settings", label: "Settings", icon: Settings2 },
]

export default function App() {
  const { people, started } = useGifts()
  const fresh = !started && !people.length
  // The person's AI added someone while they were typing: the app shows the list, and what they
  // had typed is a tap away.
  const was = useRef(fresh)
  useEffect(() => {
    if (was.current && !fresh && draft.touched && !draft.mine && draft.use) {
      offerUndo(`Your AI added ${people[0]?.name ?? "someone"}. What you typed here wasn't added.`, draft.use, "Add mine", true)
    }
    was.current = fresh
  }, [fresh])
  // A new app opens on Who do you buy gifts for?, alone: an empty list says nothing yet.
  if (fresh) return <div className={firstScreenPage}><First /></div>
  return (
    <AppShell title="Gift ideas" screens={screens}>
      <div className="mx-auto max-w-[1200px] px-4 pt-4 min-[700px]:px-6 min-[900px]:px-8 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Upcoming} default />
          <Route path="/people" component={People} />
          <Route path="/settings" component={Settings} />
          <Route path="/person/:id" component={PersonPage} />
          <Route path="/event/:id" component={EventPage} />
        </Router>
      </div>
    </AppShell>
  )
}
