import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { addDays, iso, today } from "@/lib/habits"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const day = iso(today())
const walk = { id: "walk", name: "Walk", detail: "30 minutes outside", target: 1 }
const water = { id: "water", name: "Water", target: 8, unit: "glasses" }

// Start each test from no habits and no days, whatever data the app holds.
beforeEach(async () => {
  route("/")
  await amber.store.set("habits", [])
  await amber.store.set("days", {})
})
// The sidebar (Mac) and the tab bar (iPhone) both have the screens' links; either one goes there.
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])

describe("Today", () => {
  it("ticks a habit for today in one tap, and unticks it", async () => {
    await amber.store.set("habits", [walk])
    render(<App />)
    const tick = await screen.findByRole("button", { name: "Done: Walk" })
    expect(tick).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(tick)
    await waitFor(() => expect(values().days?.[day]?.walk).toBe(1))
    expect(await screen.findByText("1 of 1 done today")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Done: Walk" })).toHaveAttribute("aria-pressed", "true")

    await userEvent.click(screen.getByRole("button", { name: "Done: Walk" }))
    await waitFor(() => expect(values().days?.[day]).toBeUndefined())
    expect(await screen.findByText("0 of 1 done today")).toBeInTheDocument()
  })

  it("counts a habit with a goal, like glasses of water", async () => {
    await amber.store.set("habits", [water])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "One more Water" }))
    expect(await screen.findByText("1 of 8 glasses")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "One more Water" }))
    expect(await screen.findByText("2 of 8 glasses")).toBeInTheDocument()
    await waitFor(() => expect(values().days?.[day]?.water).toBe(2))
    await userEvent.click(screen.getByRole("button", { name: "One less Water" }))
    await waitFor(() => expect(values().days?.[day]?.water).toBe(1))
    expect(await screen.findByText("1 of 8 glasses")).toBeInTheDocument()
  })

  it("shows the streak and this week's share", async () => {
    const d1 = iso(addDays(today(), -1)), d2 = iso(addDays(today(), -2))
    await amber.store.set("habits", [walk])
    await amber.store.set("days", { [d1]: { walk: 1 }, [d2]: { walk: 1 } })
    render(<App />)
    expect(await screen.findByText("2-day streak")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Done: Walk" }))
    expect(await screen.findByText("3-day streak")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: /^This week \d+%$/ })).toBeInTheDocument()
  })

  it("invites you to add a habit when there are none", async () => {
    render(<App />)
    expect(await screen.findByText("No habits yet")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Add a habit" }))
    expect(await screen.findByRole("heading", { name: "Habits" })).toBeInTheDocument()
  })
})

describe("Habits", () => {
  it("adds a habit, which then shows on Today", async () => {
    render(<App />)
    await go("Habits")
    await userEvent.click(await screen.findByRole("button", { name: "Add" }))
    await userEvent.type(await screen.findByLabelText("Name"), "Stretch")
    await userEvent.click(screen.getByRole("button", { name: "Add habit" }))
    await waitFor(() => expect(values().habits).toEqual([{ id: "stretch", name: "Stretch", target: 1 }]))
    await go("Today")
    expect(await screen.findByRole("button", { name: "Done: Stretch" })).toBeInTheDocument()
  })

  it("adds a counted habit with its unit", async () => {
    render(<App />)
    await go("Habits")
    await userEvent.click(await screen.findByRole("button", { name: "Add" }))
    await userEvent.type(await screen.findByLabelText("Name"), "Push-ups")
    await userEvent.clear(screen.getByLabelText("Times a day"))
    await userEvent.type(screen.getByLabelText("Times a day"), "20")
    await userEvent.type(screen.getByLabelText("Unit (optional)"), "reps")
    await userEvent.click(screen.getByRole("button", { name: "Add habit" }))
    await waitFor(() => expect(values().habits).toEqual([{ id: "push-ups", name: "Push-ups", target: 20, unit: "reps" }]))
    expect(await screen.findByText("20 reps a day")).toBeInTheDocument()
  })

  it("reorders and removes habits", async () => {
    await amber.store.set("habits", [walk, water])
    route("/habits")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Move Water up" }))
    await waitFor(() => expect(values().habits.map((h: { id: string }) => h.id)).toEqual(["water", "walk"]))
    await userEvent.click(screen.getByRole("button", { name: "Remove Walk" }))
    await waitFor(() => expect(values().habits.map((h: { id: string }) => h.id)).toEqual(["water"]))
    await waitFor(() => expect(screen.queryByText("Walk")).not.toBeInTheDocument())
  })

  it("brings a removed habit back with Undo", async () => {
    await amber.store.set("habits", [walk, water])
    route("/habits")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Remove Walk" }))
    await waitFor(() => expect(values().habits.map((h: { id: string }) => h.id)).toEqual(["water"]))
    expect(await screen.findByText("Removed Walk")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().habits.map((h: { id: string }) => h.id)).toEqual(["walk", "water"]))
    expect(await screen.findByText("Walk")).toBeInTheDocument()
  })

  it("renames a habit and changes its goal, keeping its days", async () => {
    await amber.store.set("habits", [walk])
    await amber.store.set("days", { [day]: { walk: 1 } })
    route("/habits")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit Walk" }))
    const field = await screen.findByLabelText("Name")
    await userEvent.clear(field)
    await userEvent.type(field, "Long walk")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().habits).toEqual([{ id: "walk", name: "Long walk", detail: "30 minutes outside", target: 1 }]))
    expect(values().days[day]).toEqual({ walk: 1 })
    expect(await screen.findByText("Long walk")).toBeInTheDocument()
  })

  it("removes a habit from its edit sheet", async () => {
    await amber.store.set("habits", [walk])
    route("/habits")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit Walk" }))
    await userEvent.click(await screen.findByRole("button", { name: "Remove habit" }))
    await waitFor(() => expect(values().habits).toEqual([]))
    expect(await screen.findByText("No habits yet. Tap Add to make your first one.")).toBeInTheDocument()
  })
})

describe("Any day", () => {
  const label = (d: Date) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })

  it("ticks and unticks an earlier day from History", async () => {
    const monday = addDays(today(), -((today().getDay() + 6) % 7))
    await amber.store.set("habits", [walk])
    route("/history")
    render(<App />)
    const dot = await screen.findByRole("button", { name: `Walk, ${label(monday)}` })
    await userEvent.click(dot)
    await waitFor(() => expect(values().days?.[iso(monday)]?.walk).toBe(1))
    expect(screen.getByRole("button", { name: `Walk, ${label(monday)}` })).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(screen.getByRole("button", { name: `Walk, ${label(monday)}` }))
    await waitFor(() => expect(values().days?.[iso(monday)]).toBeUndefined())
  })

  it("ticks a day weeks ago from History, and can't tick the future", async () => {
    const back = addDays(today(), -20), ahead = addDays(today(), 1)
    await amber.store.set("habits", [water])
    route("/history")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: `Water, ${label(back)}` }))
    await waitFor(() => expect(values().days?.[iso(back)]?.water).toBe(8))
    const future = screen.queryAllByRole("button", { name: `Water, ${label(ahead)}` })
    for (const b of future) expect(b).toBeDisabled()
  })
})

describe("History", () => {
  it("shows how many of the last days each habit was done", async () => {
    await amber.store.set("habits", [walk])
    await amber.store.set("days", { [day]: { walk: 1 }, [iso(addDays(today(), -1))]: { walk: 1 } })
    route("/history")
    render(<App />)
    expect(await screen.findByText(/^2 of \d+ days · now 2 in a row · best 2$/)).toBeInTheDocument()
  })
})
