import { Router, Route } from "amber-router"
import { GraduationCap, Layers } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import Study from "@/screens/study"
import Cards from "@/screens/cards"

// Study (what's due today, a card at a time) and Cards (every card by topic: add, edit, delete).
const screens = [
  { path: "/", label: "Study", icon: GraduationCap },
  { path: "/cards", label: "Cards", icon: Layers },
]

export default function App() {
  return (
    <AppShell title="Flashcards" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Study} default />
          <Route path="/cards" component={Cards} />
        </Router>
      </div>
    </AppShell>
  )
}
