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

// Start each test from no habits and no days, whatever data the app holds, in a tracker that was
// started long ago (a new one opens on Pick your habits: see "First use").
beforeEach(async () => {
  route("/")
  await amber.store.set("habits", [])
  await amber.store.set("days", {})
  await amber.store.set("skips", {})
  await amber.store.set("started", "2026-01-05")
})
// The sidebar (Mac) and the tab bar (iPhone) both have the screens' links; either one goes there.
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
// Today's count: its own line under the week's, except on a Monday when the week so far is today
// and the week's line says it alone.
const todayIs = (n: number, of: number) => waitFor(() => today().getDay() === 1
  ? expect(screen.getByTestId("week-count")).toHaveTextContent(`${n} of ${of}`)
  : expect(screen.getByTestId("today-count")).toHaveTextContent(`Today: ${n} of ${of} done`))

describe("Today", () => {
  it("ticks a habit for today in one tap, and unticks it", async () => {
    await amber.store.set("habits", [walk])
    render(<App />)
    const tick = await screen.findByRole("button", { name: "Done: Walk" })
    await waitFor(() => expect(tick).toHaveAttribute("aria-pressed", "false"))
    await userEvent.click(tick)
    await waitFor(() => expect(values().days?.[day]?.walk).toBe(1))
    expect(await screen.findByText("All done today")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Done: Walk" })).toHaveAttribute("aria-pressed", "true"))

    await userEvent.click(screen.getByRole("button", { name: "Done: Walk" }))
    await waitFor(() => expect(values().days?.[day]).toBeUndefined())
    await todayIs(0, 1)
  })

  it("says the week beside the week's ring, and today under it", async () => {
    await amber.store.set("habits", [walk])
    render(<App />)
    await todayIs(0, 1)
    expect(screen.getByTestId("week-label")).toHaveTextContent(today().getDay() === 1 ? "Today" : "Since Monday")
    await userEvent.click(screen.getByRole("button", { name: "Done: Walk" }))
    await waitFor(() => expect(screen.getByTestId("today-count")).toHaveTextContent("All done today"))
    // A walk a day since Monday: one done of the days so far, and the ring says the same share.
    const days = (today().getDay() + 6) % 7 + 1
    expect(screen.getByTestId("week-count")).toHaveTextContent(`1 of ${days}`)
    expect(screen.getByRole("img", { name: `This week ${Math.round(100 / days)}%` })).toBeInTheDocument()
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
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
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
    expect(await screen.findByText("No habits yet. Use Add to make your first one.")).toBeInTheDocument()
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
    await waitFor(() => expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true"))
    await userEvent.click(screen.getByRole("button", { name }))
    await waitFor(() => expect(values().skips?.[iso(first)]).toEqual(["walk"]))
    expect(values().days?.[iso(first)]).toBeUndefined()
    await waitFor(() => expect(screen.getByRole("button", { name: `${name}, skipped` })).toHaveAttribute("data-state", "skipped"))
    await userEvent.click(screen.getByRole("button", { name: `${name}, skipped` }))
    await waitFor(() => expect(values().skips?.[iso(first)]).toBeUndefined())
    await waitFor(() => expect(screen.getByRole("button", { name })).toHaveAttribute("data-state", "none"))
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
    await waitFor(() => expect(screen.getByRole("button", { name: "Friday" })).toHaveAttribute("aria-pressed", "false"))
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
    await todayIs(0, 1)
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

describe("First use", () => {
  // A new tracker: the habits it holds are suggestions, nothing is started and nothing is logged.
  const fresh = async (habits: unknown[]) => {
    await amber.store.set("started", null)
    await amber.store.set("habits", habits)
  }

  it("opens on Pick your habits, with no score and no other screens", async () => {
    await fresh([walk, water])
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Pick your habits" })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Track Walk" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByText("8 glasses a day")).toBeInTheDocument()
    expect(screen.queryByTestId("week-count")).toBeNull()
    expect(screen.queryByText(/%/)).toBeNull()
    expect(screen.queryByRole("link", { name: "Month" })).toBeNull()
    expect(values().started ?? null).toBeNull()
  })

  it("starts with the habits you keep, one renamed and one of your own", async () => {
    await fresh([walk, { id: "read", name: "Read", detail: "20 pages", target: 1 }, water])
    render(<App />)
    await userEvent.click(await screen.findByRole("checkbox", { name: "Track Water" }))
    const name = screen.getByLabelText("Name of Read")
    await userEvent.clear(name)
    await userEvent.type(name, "Read before bed")
    await userEvent.type(screen.getByLabelText("Add your own"), "Stretch")
    await userEvent.click(screen.getByRole("button", { name: "Add" }))
    await userEvent.click(await screen.findByRole("button", { name: "Start with 3 habits" }))

    await waitFor(() => expect(values().started).toBe(day))
    expect(values().habits).toEqual([
      { id: "walk", name: "Walk", detail: "30 minutes outside", target: 1 },
      { id: "read-before-bed", name: "Read before bed", detail: "20 pages", target: 1 },
      { id: "stretch", name: "Stretch", target: 1 },
    ])
    // Today, counted from today: the week so far is today, whatever the weekday.
    expect(await screen.findByRole("button", { name: "Done: Stretch" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "One more Water" })).toBeNull()
    await waitFor(() => expect(screen.getByTestId("week-label")).toHaveTextContent("Today"))
    expect(screen.getByTestId("week-count")).toHaveTextContent("0 of 3")
    expect(await screen.findAllByRole("link", { name: "Habits" })).not.toHaveLength(0)
  })

  it("starts with three ticked and the fourth left as a suggestion you can tick", async () => {
    const read = { id: "read", name: "Read", detail: "20 pages", target: 1 }
    const phone = { id: "no-phone-in-bed", name: "No phone in bed", detail: "Charges in the kitchen", target: 1, pick: false }
    await fresh([walk, read, water, phone])
    render(<App />)
    expect(await screen.findByText("Two or three are plenty. Tick the ones you want, or rename them.")).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Track Walk" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("checkbox", { name: "Track No phone in bed" })).toHaveAttribute("aria-checked", "false")
    expect(screen.getByRole("button", { name: "Start with 3 habits" })).toBeEnabled()
    // Ticking the fourth takes it along, and what's saved has no trace of the suggestion's mark.
    await userEvent.click(screen.getByRole("checkbox", { name: "Track No phone in bed" }))
    await userEvent.click(await screen.findByRole("button", { name: "Start with 4 habits" }))
    await waitFor(() => expect(values().started).toBe(day))
    expect(values().habits).toEqual([walk, read, water, { id: "no-phone-in-bed", name: "No phone in bed", detail: "Charges in the kitchen", target: 1 }])
  })

  it("leaves an unticked suggestion out when you start", async () => {
    await fresh([walk, { id: "no-phone-in-bed", name: "No phone in bed", target: 1, pick: false }])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Start with 1 habit" }))
    await waitFor(() => expect(values().habits).toEqual([walk]))
  })

  it("says your AI can set it up too, and shows an unticked suggestion as clearly as a ticked one", async () => {
    await fresh([walk, { id: "no-phone-in-bed", name: "No phone in bed", detail: "Charges in the kitchen", target: 1, pick: false }])
    render(<App />)
    expect(await screen.findByTestId("ai-hint")).toHaveTextContent("Pick here, or tell your AI and it sets this up.")
    // The tick alone shows the pick: nothing about the unticked row is faded.
    const row = screen.getByLabelText("Name of No phone in bed").closest("div")!
    expect(row.className).not.toMatch(/opacity/)
    expect(screen.getByLabelText("Name of No phone in bed").className).toContain("text-foreground")
  })

  it("leaves Pick your habits by itself when your AI sets it up, and keeps what you had picked within reach", async () => {
    await fresh([walk, water])
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Add your own"), "Stretch")
    // The person's AI writes their habits and the day counting starts, as its prompt says.
    await amber.store.set("habits", [{ id: "run", name: "Run", target: 1 }])
    await amber.store.set("started", day)
    expect(await screen.findByRole("button", { name: "Done: Run" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Pick your habits" })).toBeNull()
    expect(await screen.findByText("Your AI set up your habits. What you picked here wasn't used.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Use mine" }))
    await waitFor(() => expect(values().habits).toEqual([walk, water, { id: "stretch", name: "Stretch", target: 1 }]))
    expect(await screen.findByRole("button", { name: "Done: Stretch" })).toBeInTheDocument()
  })

  it("says nothing more when your AI sets it up and you hadn't touched the screen", async () => {
    await fresh([walk])
    render(<App />)
    await screen.findByRole("heading", { name: "Pick your habits" })
    await amber.store.set("habits", [{ id: "run", name: "Run", target: 1 }])
    await amber.store.set("started", day)
    expect(await screen.findByRole("button", { name: "Done: Run" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Use mine" })).toBeNull()
  })

  it("goes from the first screen to a first tick: pick, Start, tick", async () => {
    await fresh([walk, water, { id: "no-phone-in-bed", name: "No phone in bed", target: 1, pick: false }])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Start with 2 habits" }))
    await userEvent.click(await screen.findByRole("button", { name: "Done: Walk" }))
    await waitFor(() => expect(values().days?.[day]).toEqual({ walk: 1 }))
    await waitFor(() => expect(screen.getByTestId("week-count")).toHaveTextContent("1 of 2"))
    expect(screen.getByText("1-day streak")).toBeInTheDocument()
  })

  it("can't start with nothing picked", async () => {
    await fresh([walk])
    render(<App />)
    await userEvent.click(await screen.findByRole("checkbox", { name: "Track Walk" }))
    expect(await screen.findByRole("button", { name: "Pick a habit to start" })).toBeDisabled()
  })

  it("counts from the day you started, not from Monday", async () => {
    // Started yesterday with one daily habit, not done yesterday: one day missed, today to do.
    const yesterday = iso(addDays(today(), -1))
    await amber.store.set("started", yesterday)
    await amber.store.set("habits", [walk])
    render(<App />)
    const monday = today().getDay() === 1
    await waitFor(() => expect(screen.getByTestId("week-count")).toHaveTextContent(monday ? "0 of 1" : "0 of 2"))
    expect(screen.getByTestId("week-label")).toHaveTextContent(monday ? "Today"
      : `Since ${addDays(today(), -1).toLocaleDateString("en-GB", { weekday: "long" })}`)
  })

  it("draws no dots for the days before you started", async () => {
    // Started today: every earlier day of this week has no dot, in the week grid and in the row.
    await amber.store.set("started", day)
    await amber.store.set("habits", [walk])
    const { container } = render(<App />)
    await screen.findByRole("button", { name: "Done: Walk" })
    const before = (today().getDay() + 6) % 7
    // The row's strip and the week grid each draw the week once.
    await waitFor(() => expect(container.querySelectorAll("span.invisible")).toHaveLength(before * 2))
  })

  it("skips Pick your habits once something is logged (a tracker an AI filled in)", async () => {
    await fresh([walk])
    await amber.store.set("days", { [day]: { walk: 1 } })
    render(<App />)
    expect(await screen.findByRole("button", { name: "Done: Walk" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.queryByRole("heading", { name: "Pick your habits" })).toBeNull()
  })
})

describe("A short note", () => {
  // The test page is as tall as the screen it runs on, so the layout is asked for by its rule.
  it("has one rule for when rows go compact: one column, and no more than 640 px of height", async () => {
    const { SHORT } = await import("@/components/kit")
    expect(SHORT).toBe("(max-width: 699px) and (max-height: 640px)")
    expect(typeof matchMedia(SHORT).matches).toBe("boolean")
  })
})

describe("Habits tab", () => {
  it("says what happens to past check-ins when a habit is removed", async () => {
    await amber.store.set("habits", [walk])
    render(<App />)
    await go("Habits")
    expect(await screen.findByText(/Past check-ins are kept when you remove a habit\.$/)).toBeInTheDocument()
  })
})

describe("Older data", () => {
  it("opens data from before schedules and skips (no skips key, no days on habits)", async () => {
    await amber.store.set("skips", null)
    await amber.store.set("started", null)
    await amber.store.set("habits", [walk, water])
    await amber.store.set("days", { [iso(addDays(today(), -1))]: { walk: 1, water: 8 } })
    render(<App />)
    await todayIs(0, 2)
    expect(screen.getAllByText("1-day streak").length).toBe(2)
  })
})
