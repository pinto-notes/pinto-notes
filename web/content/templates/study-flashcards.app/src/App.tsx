import { useEffect, useRef } from "react"
import { route } from "amber-router"
import { Router, Route } from "amber-router"
import { GraduationCap, Layers } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { firstScreenPage, offerUndo, UndoBar } from "@/components/kit"
import Study from "@/screens/study"
import Cards from "@/screens/cards"
import First, { carry, draft } from "@/screens/first"
import { useCards } from "@/lib/cards"

// Study (what's due today, a card at a time) and Cards (every card by topic: add, edit, delete).
const screens = [
  { path: "/", label: "Study", icon: GraduationCap },
  { path: "/cards", label: "Cards", icon: Layers },
]

export default function App() {
  const { cards, add } = useCards()
  const none = !cards.length
  // The person's AI made the first cards while they were writing one: the app shows the cards, and
  // the one they were writing isn't dropped without a word.
  const was = useRef(none)
  useEffect(() => {
    const t = draft.typed
    if (was.current && !none && draft.touched && !draft.mine && t) {
      if (draft.whole) offerUndo("Your AI made your first cards. The card you were writing wasn't added.", () => add({ q: t.q, a: t.a, ...(t.topic ? { topic: t.topic } : {}) }), "Add it", true)
      else offerUndo("Your AI made your first cards. The card you were writing isn't finished.", () => { carry.card = t; route("/cards") }, "Finish it", true)
    }
    was.current = none
  }, [none])
  // A new app opens on Make your first cards, alone: there is nothing to study or count yet.
  if (none) return <div className={firstScreenPage}><First /></div>
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
