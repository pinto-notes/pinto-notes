import { Router, Route } from "amber-router"
import { Receipt, Users } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import Costs from "@/screens/costs"
import People from "@/screens/people"

// Costs (who owes whom, Add cost and the list) and People (who's on the trip, the name and currency).
const screens = [
  { path: "/", label: "Costs", icon: Receipt },
  { path: "/people", label: "People", icon: Users },
]

export default function App() {
  return (
    <AppShell title="Trip costs" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Costs} default />
          <Route path="/people" component={People} />
        </Router>
      </div>
    </AppShell>
  )
}
