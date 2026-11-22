import { useEffect, useRef } from "react"
import { Router, Route } from "amber-router"
import { ChartLine, Dumbbell, ListOrdered, NotebookText } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { firstScreenPage, offerUndo, UndoBar } from "@/components/kit"
import Today from "@/screens/today"
import Log from "@/screens/log"
import Progress from "@/screens/progress"
import Plan from "@/screens/plan"
import Setup, { draft } from "@/screens/setup"
import { useWorkouts } from "@/lib/workouts"

// Today (the week against the goal, what's next, start it), Sessions (every one: edit, delete),
// Progress (a chart per exercise, every personal best), Plan (workouts in turn, exercises, units,
// the weekly goal). A tab bar on iPhone, a sidebar from 900 px.
const screens = [
  { path: "/", label: "Today", icon: Dumbbell },
  { path: "/log", label: "Sessions", icon: NotebookText },
  { path: "/progress", label: "Progress", icon: ChartLine },
  { path: "/plan", label: "Plan", icon: ListOrdered },
]

export default function App() {
  const { fresh } = useWorkouts()
  // The person's AI set the log up while they were picking: the app shows the result, and what
  // they had picked isn't dropped without a word.
  const was = useRef(fresh)
  useEffect(() => {
    if (was.current && !fresh && draft.touched && !draft.mine && draft.use) {
      offerUndo("Your AI set up your training. What you picked here wasn't used.", draft.use, "Use mine", true)
    }
    was.current = fresh
  }, [fresh])
  // A new log opens on Set up your training, alone: nothing is counted until the person has said
  // what they train.
  if (fresh) return <div className={firstScreenPage}><Setup /></div>
  return (
    <AppShell title="Workout log" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Today} default />
          <Route path="/log" component={Log} />
          <Route path="/progress" component={Progress} />
          <Route path="/plan" component={Plan} />
        </Router>
      </div>
    </AppShell>
  )
}
