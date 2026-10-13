import { Router, Route } from "amber-router"
import { ChartPie, ReceiptText, SlidersHorizontal } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import Month from "@/screens/month"
import Expenses from "@/screens/expenses"
import Budget from "@/screens/budget"

// Month (what's left, by category, quick add), Expenses (every one, by day: edit, delete), Budget (rename, change, add, remove categories).
const screens = [
  { path: "/", label: "Month", icon: ChartPie },
  { path: "/expenses", label: "Expenses", icon: ReceiptText },
  { path: "/budget", label: "Budget", icon: SlidersHorizontal },
]

export default function App() {
  return (
    <AppShell title="Budget" screens={screens}>
      <div className="mx-auto max-w-4xl px-4 pt-4 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Month} default />
          <Route path="/expenses" component={Expenses} />
          <Route path="/budget" component={Budget} />
        </Router>
      </div>
    </AppShell>
  )
}
