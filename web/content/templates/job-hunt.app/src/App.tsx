import { useEffect, useRef } from "react"
import { Router, Route } from "amber-router"
import { BellRing, Columns3, Settings2 } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { firstScreenPage, offerUndo, UndoBar } from "@/components/kit"
import Board from "@/screens/board"
import Due from "@/screens/due"
import JobPage from "@/screens/job"
import Settings from "@/screens/settings"
import First, { draft } from "@/screens/first"
import { useJobs } from "@/lib/jobs"

// Board (a column per stage, drag or Move a card), Due (follow-ups and interviews due today or
// late), Settings (the stages, the follow-up). An application opens on its own page (/job/<id>).
const screens = [
  { path: "/", label: "Board", icon: Columns3 },
  { path: "/due", label: "Due", icon: BellRing },
  { path: "/settings", label: "Settings", icon: Settings2 },
]

export default function App() {
  const { jobs, started } = useJobs()
  const fresh = !started && !jobs.length
  // The person's AI added an application while they were typing theirs: the app shows the board,
  // and what they had typed is a tap away.
  const was = useRef(fresh)
  useEffect(() => {
    if (was.current && !fresh && draft.touched && !draft.mine && draft.use) {
      offerUndo(`Your AI added ${jobs[0]?.company ?? "an application"}. What you typed here wasn't added.`, draft.use, "Add mine", true)
    }
    was.current = fresh
  }, [fresh])
  // A new app opens on Which job are you after?, alone: an empty board says nothing yet.
  if (fresh) return <div className={firstScreenPage}><First /></div>
  return (
    <AppShell title="Job hunt" screens={screens}>
      <div className="mx-auto max-w-[1400px] px-4 pt-4 min-[700px]:px-6 min-[900px]:px-8 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Board} default />
          <Route path="/due" component={Due} />
          <Route path="/settings" component={Settings} />
          <Route path="/job/:id" component={JobPage} />
        </Router>
      </div>
    </AppShell>
  )
}
