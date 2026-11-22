import { useState } from "react"
import { Router, Route } from "amber-router"
import { CalendarDays, Settings2, ShoppingBasket } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { UndoBar } from "@/components/kit"
import Week from "@/screens/week"
import Groceries from "@/screens/groceries"
import Settings from "@/screens/settings"
import { resetWeek, useSummary } from "@/lib/meals"

// Week (the dinners, Monday to Sunday), Groceries (the list the dinners make, by aisle, ticked off
// in the shop), Settings (the cupboard, the aisles in shop order, who cooks). A tab bar on iPhone,
// a sidebar from 900 px.
const screens = [
  { path: "/", label: "Week", icon: CalendarDays },
  { path: "/groceries", label: "Groceries", icon: ShoppingBasket },
  { path: "/settings", label: "Settings", icon: Settings2 },
]

export default function App() {
  // The app opens on this week.
  useState(() => resetWeek())
  useSummary()
  return (
    <AppShell title="Meal plan" screens={screens}>
      <div className="mx-auto max-w-6xl px-4 pt-4 min-[700px]:px-6 min-[900px]:px-10 min-[900px]:pt-8">
        <UndoBar />
        <Router>
          <Route path="/" component={Week} default />
          <Route path="/groceries" component={Groceries} />
          <Route path="/settings" component={Settings} />
        </Router>
      </div>
    </AppShell>
  )
}
