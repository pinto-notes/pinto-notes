import { describe, it, expect, beforeEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { AREAS, daysBetween, late, money, nextDue, parseEvery, plusDays, plusMonths, statusOf, today, webAddress, writeEvery } from "@/lib/home"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const now = today(), year = now.slice(0, 4)
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
const sheet = (name: string) => screen.findByRole("dialog", { name })
type Job = { id: string; name: string; area?: string; every: string; last?: string; contact?: string; cost?: number; note?: string }
type Done = { id: string; job: string; date: string; cost?: number; note?: string }
const jobs = () => values().jobs as Job[]
const job = (name: string) => jobs().find((j) => j.name === name)!
const history = () => values().history as Done[]
/** The section under a heading, and the jobs listed in it, in order. */
const section = (title: string) => screen.getByRole("heading", { name: title }).closest("section") as HTMLElement
const listed = (title: string) => within(section(title)).queryAllByTestId("job").map((r) => r.querySelector("button")!.getAttribute("aria-label"))
const date = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })
const kr = (n: number) => money(n, "kr")

// A home a year in: the smoke alarms a month late, the gutters about ten days late, the dishwasher
// filter due today, the boiler in about six weeks.
const smoke: Job = { id: "j1", name: "Test the smoke alarms", area: "Safety", every: "6 months", last: plusMonths(now, -7) }
const filter: Job = { id: "j2", name: "Clean the dishwasher filter", area: "Kitchen", every: "4 weeks", last: plusDays(now, -28) }
const boiler: Job = { id: "j3", name: "Service the boiler", area: "Heating", every: "1 year", last: plusDays(plusMonths(now, -12), 45), contact: "c1", cost: 1450 }
const gutters: Job = { id: "j4", name: "Clear the gutters", area: "Outside", every: "6 months", last: plusDays(plusMonths(now, -6), -10), cost: 850 }
const past: Done[] = [
  { id: "h1", job: "j3", date: boiler.last!, cost: 1450, note: "New pressure valve" },
  { id: "h2", job: "j4", date: gutters.last!, cost: 850 },
  { id: "h3", job: "j1", date: smoke.last! },
]
/** What the fixture's history spent this calendar year. */
const spentBefore = past.filter((h) => h.date.startsWith(year)).reduce((a, h) => a + (h.cost ?? 0), 0)
const dishwasher = { id: "a1", name: "Dishwasher", area: "Kitchen", model: "Bosch Series 4 SMV4HCX48E", serial: "FD 9912 00341", bought: plusMonths(now, -23), warranty: plusDays(now, 30), manual: webAddress("www.bosch-home.com/manuals") }
const fridge = { id: "a2", name: "Fridge freezer", area: "Kitchen", model: "Electrolux LNT7ME34X2", warranty: plusMonths(now, 20) }
const washer = { id: "a3", name: "Washing machine", area: "Bathroom", warranty: plusDays(now, -40) }
const heating = { id: "c1", name: "Värme & Rör AB", trade: "Heating engineer", phone: "08-465 004 51" }
const plumber = { id: "c2", name: "Nordin & Son", trade: "Plumber", phone: "08-465 004 27", email: "jobb@nordin.example" }

// Start each test from a known home, whatever data the app holds.
beforeEach(async () => {
  route("/")
  await amber.store.set("jobs", [smoke, filter, boiler, gutters])
  await amber.store.set("history", past)
  await amber.store.set("areas", AREAS)
  await amber.store.set("appliances", [dishwasher, fridge, washer])
  await amber.store.set("details", [{ id: "i1", name: "Water stopcock", value: "Under the kitchen sink" }])
  await amber.store.set("contacts", [heating, plumber])
  await amber.store.set("currency", "kr")
})

describe("Due", () => {
  it("lists what's overdue, due this month and coming up, each by date", async () => {
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Due" })).toBeInTheDocument()
    expect(listed("Overdue")).toEqual(["Test the smoke alarms", "Clear the gutters"])
    expect(listed("Due this month")).toEqual(["Clean the dishwasher filter"])
    expect(listed("Coming up")).toEqual(["Service the boiler"])
    const row = within(section("Overdue")).getAllByTestId("job")[1]
    expect(row).toHaveTextContent(`${late(daysBetween(nextDue(gutters, gutters.last)!.date, now))} late`)
    expect(within(section("Due this month")).getByTestId("due")).toHaveTextContent("Due today")
    expect(within(section("Coming up")).getByTestId("job")).toHaveTextContent("Heating · Every year")
    expect(within(section("Coming up")).getByTestId("job")).toHaveTextContent("Värme & Rör AB")
  })

  it("counts what's overdue and due this month, and what was spent this year", async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("overdue-count")).toHaveTextContent("2"))
    expect(screen.getByTestId("now-count")).toHaveTextContent("1")
    expect(screen.getByTestId("spent")).toHaveTextContent(kr(spentBefore))
  })

  it("marks a job done today: its last date, its history with the usual cost, and when it's next", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Mark Clear the gutters done" }))
    await waitFor(() => expect(job("Clear the gutters").last).toBe(now))
    await waitFor(() => expect(history().filter((h) => h.job === "j4" && h.date === now).map((h) => h.cost)).toEqual([850]))
    expect(await screen.findByRole("status")).toHaveTextContent("Clear the gutters done today, 850 kr.")
    await waitFor(() => expect(listed("Coming up")).toContain("Clear the gutters"))
    expect(listed("Overdue")).toEqual(["Test the smoke alarms"])
    await waitFor(() => expect(screen.getByTestId("spent")).toHaveTextContent(kr(spentBefore + 850)))
  })

  it("undoes a job marked done by mistake", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Mark Test the smoke alarms done" }))
    const bar = await screen.findByRole("status")
    await waitFor(() => expect(bar).toHaveTextContent("Test the smoke alarms done today."))
    await userEvent.click(within(bar).getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(job("Test the smoke alarms").last).toBe(smoke.last))
    await waitFor(() => expect(history()).toEqual(past))
    await waitFor(() => expect(listed("Overdue")).toEqual(["Test the smoke alarms", "Clear the gutters"]))
  })

  it("shows what the AI logs while the app is open: the gutters cleaned today for 900 kr", async () => {
    render(<App />)
    await screen.findByRole("button", { name: "Mark Clear the gutters done" })
    // The person's AI does what its prompt says: a line in history, and the job's last date.
    await amber.store.set("history", [...past, { id: "h9", job: "j4", date: now, cost: 900 }])
    await amber.store.set("jobs", [smoke, filter, boiler, { ...gutters, last: now }])
    await waitFor(() => expect(listed("Coming up")).toContain("Clear the gutters"))
    await waitFor(() => expect(screen.getByTestId("spent")).toHaveTextContent(kr(spentBefore + 900)))
    expect(screen.getByTestId("overdue-count")).toHaveTextContent("1")
  })

  it("counts a job as done when only its history says so", async () => {
    // An AI that adds the history line and forgets the last date still moves the job on.
    await amber.store.set("history", [...past, { id: "h9", job: "j1", date: now }])
    render(<App />)
    await waitFor(() => expect(listed("Overdue")).toEqual(["Clear the gutters"]))
    expect(listed("Coming up")).toContain("Test the smoke alarms")
  })

  it("puts a job never done under this month, and says so", async () => {
    await amber.store.set("jobs", [...[smoke, filter, boiler, gutters], { id: "j5", name: "Clean the oven", area: "Kitchen", every: "3 months" }])
    render(<App />)
    await waitFor(() => expect(listed("Due this month")).toContain("Clean the oven"))
    const row = within(section("Due this month")).getAllByTestId("job").find((r) => r.textContent!.includes("Clean the oven"))!
    expect(row).toHaveTextContent("Not done yet")
  })

  it("flags a warranty ending soon", async () => {
    render(<App />)
    const s = await waitFor(() => section("Warranties ending soon"))
    expect(within(s).getByRole("button", { name: /Dishwasher/ })).toHaveTextContent("Warranty ends in 4 weeks")
    expect(s).not.toHaveTextContent("Fridge freezer")
  })

  it("sets the note's summary line to what's overdue and due this month", async () => {
    const summary = vi.fn(async () => ({ ok: true }))
    amber.setSummary = summary
    render(<App />)
    await waitFor(() => expect(summary).toHaveBeenCalledWith("2 overdue · 1 due this month"))
  })

  it("starts a new list from the usual jobs", async () => {
    await amber.store.set("jobs", [])
    await amber.store.set("history", [])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add Test the smoke alarms" }))
    await waitFor(() => expect(jobs()).toEqual([{ id: jobs()[0].id, name: "Test the smoke alarms", area: "Safety", every: "6 months" }]))
    await waitFor(() => expect(listed("Due this month")).toEqual(["Test the smoke alarms"]))
    expect(screen.queryByRole("button", { name: "Add Service the boiler" })).toBeNull()
  })
})

describe("Working out when a job is due", () => {
  it("adds the interval to the last time, keeping the month's end", () => {
    expect(nextDue({ every: "3 months" }, "2026-08-14", "2026-11-22")).toEqual({ date: "2026-11-14", end: "2026-11-14", never: false })
    expect(nextDue({ every: "1 month" }, "2026-01-31")!.date).toBe("2026-02-28")
    expect(nextDue({ every: "2 weeks" }, "2026-11-20")!.date).toBe("2026-12-04")
    expect(nextDue({ every: "1 year" }, "2025-11-20")!.date).toBe("2026-11-20")
  })

  it("puts a season job in the next season after it was done", () => {
    expect(nextDue({ every: "autumn" }, "2026-10-15", "2026-11-22")!.date).toBe("2027-09-01")
    expect(nextDue({ every: "autumn" }, "2026-08-20", "2026-11-22")).toEqual({ date: "2026-09-01", end: "2026-11-30", season: "autumn", never: false })
    expect(nextDue({ every: "winter" }, "2026-01-10", "2026-11-22")!.date).toBe("2026-12-01")
    // Never done: the season it is now, or the next one.
    expect(nextDue({ every: "autumn" }, undefined, "2026-11-22")!.date).toBe("2026-09-01")
    expect(nextDue({ every: "autumn" }, undefined, "2026-12-05")!.date).toBe("2027-09-01")
    expect(nextDue({ every: "winter" }, undefined, "2027-01-20")!.date).toBe("2026-12-01")
  })

  it("calls a season job late only once its season is over", () => {
    const w = nextDue({ every: "autumn" }, "2025-10-01", "2026-11-22")!
    expect(statusOf(w, "2026-11-22")).toBe("now")
    expect(statusOf(w, "2026-12-01")).toBe("overdue")
    expect(statusOf(nextDue({ every: "1 month" }, "2026-11-01")!, "2026-11-22")).toBe("later")
  })

  it("reads how often the way people write it", () => {
    expect(parseEvery("Every 3 months")).toEqual({ n: 3, unit: "month" })
    expect(parseEvery("yearly")).toEqual({ n: 1, unit: "year" })
    expect(parseEvery("month")).toEqual({ n: 1, unit: "month" })
    expect(parseEvery("fall")).toEqual({ season: "autumn" })
    expect(parseEvery("sometimes")).toBeNull()
    expect(writeEvery({ n: 1, unit: "year" })).toBe("1 year")
    expect(writeEvery({ n: 6, unit: "month" })).toBe("6 months")
  })
})

describe("Jobs", () => {
  it("adds a job: its area, how often, when last done, who to call and what it costs", async () => {
    render(<App />)
    await go("Jobs")
    await userEvent.click(await screen.findByRole("button", { name: "Add a job" }))
    const s = await sheet("New job")
    await userEvent.type(within(s).getByLabelText("Job"), "Check the washing machine hoses")
    await userEvent.selectOptions(within(s).getByLabelText("Area"), "Bathroom")
    const n = within(s).getByLabelText("How many")
    await userEvent.clear(n)
    await userEvent.type(n, "2")
    await userEvent.selectOptions(within(s).getByLabelText("Every"), "year")
    date(within(s).getByLabelText("Last done"), "2026-03-02")
    await userEvent.selectOptions(within(s).getByLabelText("Who to call"), "c2")
    await userEvent.type(within(s).getByLabelText("Usual cost (kr)"), "1 200")
    await userEvent.type(within(s).getByLabelText("Note"), "Shut-off valve behind the machine")
    await userEvent.click(within(s).getByRole("button", { name: "Add job" }))
    await waitFor(() => expect(job("Check the washing machine hoses")).toEqual({
      id: job("Check the washing machine hoses").id, name: "Check the washing machine hoses", area: "Bathroom", every: "2 years", last: "2026-03-02", contact: "c2", cost: 1200, note: "Shut-off valve behind the machine",
    }))
    const area = await waitFor(() => section("Bathroom"))
    expect(within(area).getByTestId("job")).toHaveTextContent("Every 2 years · last 2 Mar")
    expect(within(area).getByTestId("job")).toHaveTextContent("Nordin & Son")
  })

  it("renames a job and makes it a season job", async () => {
    render(<App />)
    await go("Jobs")
    await userEvent.click(await screen.findByRole("button", { name: "Clear the gutters" }))
    const s = await sheet("Edit job")
    const name = within(s).getByLabelText("Job")
    await waitFor(() => expect(name).toHaveValue("Clear the gutters"))
    await userEvent.clear(name)
    await userEvent.type(name, "Clear the gutters and downpipes")
    await userEvent.selectOptions(within(s).getByLabelText("Every"), "autumn")
    expect(within(s).queryByLabelText("How many")).toBeNull()
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(jobs().find((j) => j.id === "j4")).toEqual({ ...gutters, name: "Clear the gutters and downpipes", every: "autumn" }))
    expect(await screen.findByRole("button", { name: "Clear the gutters and downpipes" })).toHaveTextContent("Every autumn")
  })

  it("deletes a job with its history, and Undo brings both back", async () => {
    render(<App />)
    await go("Jobs")
    await userEvent.click(await screen.findByRole("button", { name: "Service the boiler" }))
    await userEvent.click(within(await sheet("Edit job")).getByRole("button", { name: "Delete job" }))
    await waitFor(() => expect(jobs().map((j) => j.id)).toEqual(["j1", "j2", "j4"]))
    await waitFor(() => expect(history().map((h) => h.id)).toEqual(["h2", "h3"]))
    const bar = await screen.findByRole("status")
    await waitFor(() => expect(bar).toHaveTextContent("Deleted Service the boiler"))
    await userEvent.click(within(bar).getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(jobs().map((j) => j.id)).toEqual(["j1", "j2", "j3", "j4"]))
    await waitFor(() => expect(history()).toEqual(past))
  })

  it("reorders the jobs in an area", async () => {
    await amber.store.set("jobs", [smoke, filter, boiler, gutters, { id: "j5", name: "Check the fire extinguisher", area: "Safety", every: "1 year", last: now }])
    render(<App />)
    await go("Jobs")
    await userEvent.click(await screen.findByRole("button", { name: "Reorder" }))
    expect(screen.getByRole("button", { name: "Move Test the smoke alarms up" })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "Move Check the fire extinguisher up" }))
    await waitFor(() => expect(jobs().map((j) => j.id)).toEqual(["j5", "j2", "j3", "j4", "j1"]))
    await waitFor(() => expect(listed("Safety")).toEqual(["Check the fire extinguisher", "Test the smoke alarms"]))
  })

  it("adds, renames, reorders and removes areas, and the jobs follow", async () => {
    render(<App />)
    await go("Jobs")
    await userEvent.type(await screen.findByLabelText("New area"), "Attic")
    await userEvent.click(screen.getByRole("button", { name: "Add an area" }))
    await waitFor(() => expect(values().areas).toEqual([...AREAS, "Attic"]))
    await userEvent.click(screen.getByRole("button", { name: "Move Attic up" }))
    await waitFor(() => expect((values().areas as string[]).slice(-2)).toEqual(["Attic", "Safety"]))
    await userEvent.click(screen.getByRole("button", { name: "Rename Outside" }))
    const s = await sheet("Rename Outside")
    const name = within(s).getByLabelText("Name")
    await userEvent.clear(name)
    await userEvent.type(name, "Roof and outside")
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(job("Clear the gutters").area).toBe("Roof and outside"))
    expect(await screen.findByRole("heading", { name: "Roof and outside" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Remove Heating" }))
    await waitFor(() => expect(values().areas).not.toContain("Heating"))
    await waitFor(() => expect(listed("Other")).toEqual(["Service the boiler"]))
    const bar = await screen.findByRole("status")
    await waitFor(() => expect(bar).toHaveTextContent("Removed Heating"))
    await userEvent.click(within(bar).getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().areas).toContain("Heating"))
    await waitFor(() => expect(listed("Heating")).toEqual(["Service the boiler"]))
  })
})

describe("History", () => {
  it("shows a job's history in its sheet, with what each time cost", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Service the boiler" }))
    const s = await sheet("Edit job")
    expect(within(s).getByRole("heading", { name: "History" })).toBeInTheDocument()
    const line = within(s).getAllByRole("button").find((b) => (b.getAttribute("aria-label") ?? "").startsWith("Done "))!
    expect(line).toHaveTextContent("New pressure valve")
    expect(line).toHaveTextContent(kr(1450))
  })

  it("logs a time a job was done, with its date, cost and note", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Test the smoke alarms" }))
    await userEvent.click(within(await sheet("Edit job")).getByRole("button", { name: "Log a time" }))
    const s = await sheet("Log a job done")
    expect(within(s).getByLabelText("Job")).toHaveValue("j1")
    date(within(s).getByLabelText("Date"), plusDays(now, -3))
    await userEvent.type(within(s).getByLabelText("Cost (kr)"), "189")
    await userEvent.type(within(s).getByLabelText("Note"), "New battery in the hall")
    await userEvent.click(within(s).getByRole("button", { name: "Log it" }))
    await waitFor(() => expect(history().find((h) => h.job === "j1" && h.date === plusDays(now, -3))).toEqual({ id: history().at(-1)!.id, job: "j1", date: plusDays(now, -3), cost: 189, note: "New battery in the hall" }))
    await waitFor(() => expect(job("Test the smoke alarms").last).toBe(plusDays(now, -3)))
    await waitFor(() => expect(listed("Coming up")).toContain("Test the smoke alarms"))
  })

  it("logs a job done with no cost when the cost is cleared", async () => {
    render(<App />)
    await go("History")
    await userEvent.click(await screen.findByRole("button", { name: "Log a job done" }))
    const s = await sheet("Log a job done")
    await userEvent.selectOptions(within(s).getByLabelText("Job"), "j3")
    await waitFor(() => expect(within(s).getByLabelText("Cost (kr)")).toHaveValue("1450"))
    await userEvent.clear(within(s).getByLabelText("Cost (kr)"))
    await userEvent.click(within(s).getByRole("button", { name: "Log it" }))
    await waitFor(() => expect(history().filter((h) => h.job === "j3" && h.date === now).map((h) => h.cost)).toEqual([undefined]))
  })

  it("changes a time's cost and note, and removes it with Undo", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Service the boiler" }))
    const line = within(await sheet("Edit job")).getAllByRole("button").find((b) => (b.getAttribute("aria-label") ?? "").startsWith("Done "))!
    await userEvent.click(line)
    const s = await sheet("Edit done")
    const cost = within(s).getByLabelText("Cost (kr)")
    await waitFor(() => expect(cost).toHaveValue("1450"))
    await userEvent.clear(cost)
    await userEvent.type(cost, "1650")
    await userEvent.type(within(s).getByLabelText("Note"), ", and a flue check")
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(history().find((h) => h.id === "h1")).toEqual({ id: "h1", job: "j3", date: boiler.last, cost: 1650, note: "New pressure valve, and a flue check" }))
    await go("History")
    const year1 = boiler.last!.slice(0, 4)
    while ((await screen.findByRole("heading", { level: 1 })).textContent !== year1) await userEvent.click(screen.getByRole("button", { name: "Previous year" }))
    await userEvent.click(await screen.findByRole("button", { name: /^Service the boiler, / }))
    await userEvent.click(within(await sheet("Edit done")).getByRole("button", { name: "Remove from history" }))
    await waitFor(() => expect(history().map((h) => h.id)).toEqual(["h2", "h3"]))
    // The job's last date was that day: it goes back to the time before (none here).
    await waitFor(() => expect(job("Service the boiler").last).toBeUndefined())
    const bar = await screen.findByRole("status")
    await waitFor(() => expect(bar).toHaveTextContent("Removed Service the boiler"))
    await userEvent.click(within(bar).getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(history().map((h) => h.id)).toEqual(["h1", "h2", "h3"]))
    await waitFor(() => expect(job("Service the boiler").last).toBe(boiler.last))
  })

  it("adds up a year's costs, by area, and steps back a year", async () => {
    const y = Number(year)
    await amber.store.set("history", [
      { id: "h1", job: "j3", date: `${y}-01-01`, cost: 1450 },
      { id: "h2", job: "j4", date: `${y}-01-01`, cost: 850, note: "Two downpipes blocked" },
      { id: "h3", job: "j2", date: `${y}-01-01` },
      { id: "h4", job: "j3", date: `${y - 1}-06-03`, cost: 1390 },
    ])
    render(<App />)
    await go("History")
    expect(await screen.findByRole("heading", { name: year })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId("year-total")).toHaveTextContent(kr(2300)))
    expect(screen.getByText("3 jobs done")).toBeInTheDocument()
    expect(screen.getAllByTestId("area-spend").map((e) => e.textContent)).toEqual([`Heating${kr(1450)}`, `Outside${kr(850)}`])
    expect(screen.getByRole("button", { name: /^Clear the gutters, / })).toHaveTextContent("Two downpipes blocked")
    expect(screen.getByRole("button", { name: "Next year" })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "Previous year" }))
    expect(await screen.findByRole("heading", { name: String(y - 1) })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId("year-total")).toHaveTextContent(kr(1390)))
    expect(screen.getByRole("button", { name: "Previous year" })).toBeDisabled()
  })

  it("shows costs in the currency the person sets", async () => {
    await amber.store.set("history", [{ id: "h1", job: "j3", date: now, cost: 1450 }])
    render(<App />)
    await go("History")
    const c = await screen.findByLabelText("Currency")
    await userEvent.clear(c)
    await userEvent.type(c, "£")
    fireEvent.blur(c)
    await waitFor(() => expect(values().currency).toBe("£"))
    await waitFor(() => expect(screen.getByTestId("year-total")).toHaveTextContent("£1,450"))
  })
})

describe("Home", () => {
  it("adds an appliance with its model, serial, dates and manual", async () => {
    render(<App />)
    await go("Home")
    await userEvent.click(await screen.findByRole("button", { name: "Add an appliance" }))
    const s = await sheet("New appliance")
    await userEvent.type(within(s).getByLabelText("Name"), "Heat pump")
    await userEvent.selectOptions(within(s).getByLabelText("Area"), "Heating")
    await userEvent.type(within(s).getByLabelText("Model"), "Nibe F2120")
    await userEvent.type(within(s).getByLabelText("Serial number"), "06 5432 1188")
    date(within(s).getByLabelText("Bought"), "2024-09-12")
    date(within(s).getByLabelText("Warranty ends"), "2029-09-12")
    await userEvent.type(within(s).getByLabelText("Manual (web address)"), "nibe.eu/manuals")
    await userEvent.click(within(s).getByRole("button", { name: "Add appliance" }))
    await waitFor(() => expect((values().appliances as { name: string }[]).at(-1)).toEqual({
      id: (values().appliances as { id: string }[]).at(-1)!.id, name: "Heat pump", area: "Heating", model: "Nibe F2120", serial: "06 5432 1188", bought: "2024-09-12", warranty: "2029-09-12", manual: webAddress("nibe.eu/manuals"),
    }))
    const row = await screen.findByRole("button", { name: "Heat pump" })
    expect(row).toHaveTextContent("Nibe F2120 · bought 12 Sept 2024".replace("Sept", new Date("2024-09-12T12:00:00").toLocaleDateString("en-GB", { month: "short" })))
    expect(row).toHaveTextContent("Serial 06 5432 1188")
    expect(screen.getByRole("link", { name: "Manual for Heat pump" }).getAttribute("href")).toMatch(/^https:\/\/nibe\.eu\/manuals$/)
  })

  it("flags a warranty ending soon, and says when one has ended", async () => {
    render(<App />)
    await go("Home")
    expect(await screen.findByRole("button", { name: "Dishwasher" })).toHaveTextContent("Warranty ends in 4 weeks")
    expect(screen.getByRole("button", { name: "Washing machine" })).toHaveTextContent("Warranty ended")
    expect(screen.getByRole("button", { name: "Fridge freezer" })).toHaveTextContent("Warranty to")
  })

  it("edits an appliance, and deletes it with Undo", async () => {
    render(<App />)
    await go("Home")
    await userEvent.click(await screen.findByRole("button", { name: "Fridge freezer" }))
    const s = await sheet("Edit appliance")
    const name = within(s).getByLabelText("Name")
    await waitFor(() => expect(name).toHaveValue("Fridge freezer"))
    await userEvent.clear(name)
    await userEvent.type(name, "Fridge")
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect((values().appliances as { id: string; name: string }[]).find((a) => a.id === "a2")!.name).toBe("Fridge"))
    await userEvent.click(await screen.findByRole("button", { name: "Fridge" }))
    await userEvent.click(within(await sheet("Edit appliance")).getByRole("button", { name: "Delete appliance" }))
    await waitFor(() => expect((values().appliances as { id: string }[]).map((a) => a.id)).toEqual(["a1", "a3"]))
    const bar = await screen.findByRole("status")
    await waitFor(() => expect(bar).toHaveTextContent("Deleted Fridge"))
    await userEvent.click(within(bar).getByRole("button", { name: "Undo" }))
    await waitFor(() => expect((values().appliances as { id: string }[]).map((a) => a.id)).toEqual(["a1", "a2", "a3"]))
  })

  it("reorders the appliances", async () => {
    render(<App />)
    await go("Home")
    await userEvent.click(await screen.findByRole("button", { name: "Reorder appliances" }))
    await userEvent.click(screen.getByRole("button", { name: "Move Dishwasher down" }))
    await waitFor(() => expect((values().appliances as { id: string }[]).map((a) => a.id)).toEqual(["a2", "a1", "a3"]))
    expect(screen.getByRole("button", { name: "Move Washing machine down" })).toBeDisabled()
  })

  it("keeps home details: adds, edits and deletes one with Undo", async () => {
    render(<App />)
    await go("Home")
    await userEvent.click(await screen.findByRole("button", { name: "Add a home detail" }))
    let s = await sheet("New home detail")
    await userEvent.type(within(s).getByLabelText("What"), "Living room paint")
    await userEvent.type(within(s).getByLabelText("Detail"), "Jotun Lady 1024 Tidløs, matt")
    await userEvent.click(within(s).getByRole("button", { name: "Add detail" }))
    await waitFor(() => expect((values().details as { name: string; value: string }[]).map((d) => [d.name, d.value])).toEqual([["Water stopcock", "Under the kitchen sink"], ["Living room paint", "Jotun Lady 1024 Tidløs, matt"]]))
    await userEvent.click(await screen.findByRole("button", { name: "Water stopcock" }))
    s = await sheet("Edit detail")
    await userEvent.type(within(s).getByLabelText("Detail"), ", turn clockwise")
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect((values().details as { value: string }[])[0].value).toBe("Under the kitchen sink, turn clockwise"))
    await userEvent.click(await screen.findByRole("button", { name: "Living room paint" }))
    await userEvent.click(within(await sheet("Edit detail")).getByRole("button", { name: "Delete detail" }))
    await waitFor(() => expect(values().details as unknown[]).toHaveLength(1))
    const bar = await screen.findByRole("status")
    await waitFor(() => expect(bar).toHaveTextContent("Deleted Living room paint"))
    await userEvent.click(within(bar).getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().details as unknown[]).toHaveLength(2))
  })

  it("adds a contact, with a link to call them", async () => {
    render(<App />)
    await go("Home")
    await userEvent.click(await screen.findByRole("button", { name: "Add a contact" }))
    const s = await sheet("New contact")
    await userEvent.type(within(s).getByLabelText("Name"), "Volt Fix")
    await userEvent.type(within(s).getByLabelText("What they do"), "Electrician")
    await userEvent.type(within(s).getByLabelText("Phone"), "08-465 004 63")
    await userEvent.click(within(s).getByRole("button", { name: "Add contact" }))
    await waitFor(() => expect((values().contacts as { name: string }[]).at(-1)).toEqual({ id: (values().contacts as { id: string }[]).at(-1)!.id, name: "Volt Fix", trade: "Electrician", phone: "08-465 004 63" }))
    expect(await screen.findByRole("link", { name: "Call Volt Fix" })).toHaveAttribute("href", "tel:0846500463")
    expect(screen.getByRole("button", { name: "Värme & Rör AB" })).toHaveTextContent("For service the boiler")
  })

  it("deletes a contact with Undo, and the job that named them gets them back", async () => {
    render(<App />)
    await go("Home")
    await userEvent.click(await screen.findByRole("button", { name: "Värme & Rör AB" }))
    await userEvent.click(within(await sheet("Edit contact")).getByRole("button", { name: "Delete contact" }))
    await waitFor(() => expect((values().contacts as { id: string }[]).map((c) => c.id)).toEqual(["c2"]))
    await waitFor(() => expect(job("Service the boiler").contact).toBeUndefined())
    const bar = await screen.findByRole("status")
    await waitFor(() => expect(bar).toHaveTextContent("Deleted Värme & Rör AB"))
    await userEvent.click(within(bar).getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(job("Service the boiler").contact).toBe("c1"))
    await waitFor(() => expect((values().contacts as { id: string }[]).map((c) => c.id)).toEqual(["c1", "c2"]))
  })

  it("reorders the contacts", async () => {
    render(<App />)
    await go("Home")
    await userEvent.click(await screen.findByRole("button", { name: "Reorder contacts" }))
    await userEvent.click(screen.getByRole("button", { name: "Move Nordin & Son up" }))
    await waitFor(() => expect((values().contacts as { id: string }[]).map((c) => c.id)).toEqual(["c2", "c1"]))
  })
})
