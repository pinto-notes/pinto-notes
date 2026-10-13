import { useEffect, useRef } from "react"
import { Router, Route } from "amber-router"
import { ChartPie, ReceiptText, SlidersHorizontal } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import Month from "@/screens/month"
import Expenses from "@/screens/expenses"
import Budget from "@/screens/budget"
import { thisMonth, useBudget } from "@/lib/budget"

// Month (what's left, by category, quick add), Expenses (every one, by day: edit, delete), Budget (rename, change, add, remove categories).
const screens = [
  { path: "/", label: "Month", icon: ChartPie },
  { path: "/expenses", label: "Expenses", icon: ReceiptText },
  { path: "/budget", label: "Budget", icon: SlidersHorizontal },
]

// Monthly bills: each one's expense is added on its day, once a month (recurring[].last says which
// month it was last added). Runs wherever the app opens, once per bill and month.
function Bills() {
  const { bills, postBills } = useBudget()
  const posted = useRef(new Set<string>()).current
  const m = thisMonth()
  const key = bills.filter((b) => (b.last ?? "") < m).map((b) => b.id + b.day).join()
  useEffect(() => {
    if (!key || posted.has(m + key)) return
    posted.add(m + key)
    postBills()
  }, [key])
  return null
}

export default function App() {
  return (
    <AppShell title="Budget" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Bills />
        <Router>
          <Route path="/" component={Month} default />
          <Route path="/expenses" component={Expenses} />
          <Route path="/budget" component={Budget} />
        </Router>
      </div>
    </AppShell>
  )
}
