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
  await amber.store.set("skips", {})
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
    expect(await screen.findByText("All done today")).toBeInTheDocument()
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
    expect(await screen.findByText("Every day · 20 reps a day")).toBeInTheDocument()
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
  const first = new Date(today().getFullYear(), today().getMonth(), 1, 12)

  it("ticks, skips and clears a day from the month calendar", async () => {
    await amber.store.set("habits", [walk])
    route("/month")
    render(<App />)
    const name = `Walk, ${label(first)}`
    await userEvent.click(await screen.findByRole("button", { name }))
    await waitFor(() => expect(values().days?.[iso(first)]?.walk).toBe(1))
    expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(screen.getByRole("button", { name }))
    await waitFor(() => expect(values().skips?.[iso(first)]).toEqual(["walk"]))
    expect(values().days?.[iso(first)]).toBeUndefined()
    expect(await screen.findByRole("button", { name: `${name}, skipped` })).toHaveAttribute("data-state", "skipped")
    await userEvent.click(screen.getByRole("button", { name: `${name}, skipped` }))
    await waitFor(() => expect(values().skips?.[iso(first)]).toBeUndefined())
    expect(await screen.findByRole("button", { name })).toHaveAttribute("data-state", "none")
  })

  it("goes back a month and ticks a day there, and can't tick the future", async () => {
    const back = new Date(today().getFullYear(), today().getMonth() - 1, 3, 12), ahead = addDays(today(), 1)
    await amber.store.set("habits", [water])
    route("/month")
    render(<App />)
    const future = await screen.findAllByRole("button", { name: `Water, ${label(ahead)}` }).catch(() => [])
    for (const b of future) expect(b).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "Previous month" }))
    expect(await screen.findByRole("heading", { name: back.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) })).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: `Water, ${label(back)}` }))
    await waitFor(() => expect(values().days?.[iso(back)]?.water).toBe(8))
  })
})

describe("Month", () => {
  it("shows how often each habit was done, its streak and its best", async () => {
    await amber.store.set("habits", [walk])
    await amber.store.set("days", { [day]: { walk: 1 }, [iso(addDays(today(), -1))]: { walk: 1 } })
    route("/month")
    render(<App />)
    expect(await screen.findByText(/^\d+ of \d+ · now 2 in a row · best 2$/)).toBeInTheDocument()
  })
})

describe("Schedules", () => {
  const tomorrow = (addDays(today(), 1).getDay() + 6) % 7

  it("adds a habit for some weekdays only", async () => {
    render(<App />)
    await go("Habits")
    await userEvent.click(await screen.findByRole("button", { name: "Add" }))
    await userEvent.type(await screen.findByLabelText("Name"), "Spanish")
    await userEvent.click(screen.getByRole("radio", { name: "Some days" }))
    // Monday to Friday are on to start with; take Friday off.
    await userEvent.click(screen.getByRole("button", { name: "Friday" }))
    expect(screen.getByRole("button", { name: "Friday" })).toHaveAttribute("aria-pressed", "false")
    await userEvent.click(screen.getByRole("button", { name: "Add habit" }))
    await waitFor(() => expect(values().habits).toEqual([{ id: "spanish", name: "Spanish", target: 1, days: [0, 1, 2, 3] }]))
    expect(await screen.findByText("Mon, Tue, Wed, Thu")).toBeInTheDocument()
  })

  it("adds a habit with a weekly goal, and shows the week's count on Today", async () => {
    render(<App />)
    await go("Habits")
    await userEvent.click(await screen.findByRole("button", { name: "Add" }))
    await userEvent.type(await screen.findByLabelText("Name"), "Gym")
    await userEvent.click(screen.getByRole("radio", { name: "A week" }))
    await userEvent.clear(screen.getByLabelText("Times a week"))
    await userEvent.type(screen.getByLabelText("Times a week"), "3")
    await userEvent.click(screen.getByRole("button", { name: "Add habit" }))
    await waitFor(() => expect(values().habits).toEqual([{ id: "gym", name: "Gym", target: 1, perWeek: 3 }]))
    await go("Today")
    expect(await screen.findByText("0 of 3 this week")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Done: Gym" }))
    expect(await screen.findByText("1 of 3 this week")).toBeInTheDocument()
  })

  it("puts a habit that isn't for today under Not today, and leaves it out of today's count", async () => {
    await amber.store.set("habits", [walk, { id: "spanish", name: "Spanish", target: 1, days: [tomorrow] }])
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Not today" })).toBeInTheDocument()
    expect(screen.getByTestId("today-count")).toHaveTextContent("0 of 1 done today")
    await userEvent.click(screen.getByRole("button", { name: "Done: Walk" }))
    expect(await screen.findByText("All done today")).toBeInTheDocument()
  })

  it("counts a weekly goal's streak in weeks", async () => {
    const lastMonday = addDays(today(), -((today().getDay() + 6) % 7) - 7)
    const log: Record<string, Record<string, number>> = {}
    for (const w of [0, -7]) for (const i of [0, 1, 2]) log[iso(addDays(lastMonday, w + i))] = { gym: 1 }
    await amber.store.set("habits", [{ id: "gym", name: "Gym", target: 1, perWeek: 3 }])
    await amber.store.set("days", log)
    render(<App />)
    expect(await screen.findByText("2-week streak")).toBeInTheDocument()
  })

  it("doesn't break a streak on a day the habit isn't for", async () => {
    const off = (addDays(today(), -1).getDay() + 6) % 7
    await amber.store.set("habits", [{ ...walk, days: [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== off) }])
    await amber.store.set("days", { [iso(addDays(today(), -2))]: { walk: 1 }, [iso(addDays(today(), -3))]: { walk: 1 } })
    render(<App />)
    expect(await screen.findByText("2-day streak")).toBeInTheDocument()
  })

  it("changes a habit's schedule from its page", async () => {
    await amber.store.set("habits", [walk])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Open Walk" }))
    await userEvent.click(await screen.findByRole("button", { name: "Edit habit" }))
    await userEvent.click(await screen.findByRole("radio", { name: "A week" }))
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().habits).toEqual([{ ...walk, perWeek: 3 }]))
  })
})

describe("Skipping", () => {
  it("skips today from the habit's page, keeping the streak, and takes the skip back", async () => {
    await amber.store.set("habits", [walk])
    await amber.store.set("days", { [iso(addDays(today(), -1))]: { walk: 1 }, [iso(addDays(today(), -2))]: { walk: 1 } })
    render(<App />)
    expect(await screen.findByText("2-day streak")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Open Walk" }))
    expect(await screen.findByRole("dialog", { name: "Walk" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Skip today" }))
    await waitFor(() => expect(values().skips?.[day]).toEqual(["walk"]))
    expect(await screen.findByRole("button", { name: "Don't skip today" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(await screen.findByText(/^Skipped today · 2-day streak$/)).toBeInTheDocument()
    expect(screen.getByText("2-day streak")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Open Walk" }))
    await userEvent.click(await screen.findByRole("button", { name: "Don't skip today" }))
    await waitFor(() => expect(values().skips?.[day]).toBeUndefined())
  })

  it("keeps a streak over a skipped day", async () => {
    await amber.store.set("habits", [walk])
    await amber.store.set("days", { [iso(addDays(today(), -1))]: { walk: 1 }, [iso(addDays(today(), -3))]: { walk: 1 } })
    await amber.store.set("skips", { [iso(addDays(today(), -2))]: ["walk"] })
    render(<App />)
    expect(await screen.findByText("2-day streak")).toBeInTheDocument()
  })

  it("ticking a skipped day clears the skip", async () => {
    await amber.store.set("habits", [walk])
    await amber.store.set("skips", { [day]: ["walk"] })
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Done: Walk" }))
    await waitFor(() => expect(values().days?.[day]?.walk).toBe(1))
    await waitFor(() => expect(values().skips?.[day]).toBeUndefined())
  })
})

describe("Older data", () => {
  it("opens data from before schedules and skips (no skips key, no days on habits)", async () => {
    await amber.store.set("skips", null)
    await amber.store.set("habits", [walk, water])
    await amber.store.set("days", { [iso(addDays(today(), -1))]: { walk: 1, water: 8 } })
    render(<App />)
    expect(await screen.findByTestId("today-count")).toHaveTextContent("0 of 2 done today")
    expect(screen.getAllByText("1-day streak").length).toBe(2)
  })
})
