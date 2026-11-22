import { describe, it, expect, beforeEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { addDays, day, DEFAULT_STAGES, today } from "@/lib/jobs"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const jobs = () => (values().jobs ?? []) as any[]
const job = (id: string) => jobs().find((j) => j.id === id)
const now = today()
// A date field takes a whole date at once, the way the date picker sets it.
const pick = async (label: string, value: string) => { fireEvent.input(await screen.findByLabelText(label), { target: { value } }); await new Promise((r) => setTimeout(r, 0)) }
// The sidebar (Mac) and the tab bar (iPhone) both have the screens' links; either one goes there.
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
/** Only the fields named in want, so a check says what matters and nothing else. */
const fields = (o: any, want: Record<string, unknown>) => (o ? Object.fromEntries(Object.keys(want).map((k) => [k, o[k]])) : o)
// A pointer at a place on the screen, the way a mouse drags.
const pointer = (el: EventTarget, type: string, x: number, y: number) => fireEvent(el as Element, new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerType: "mouse", pointerId: 1 }))
const column = (name: string) => screen.getByRole("region", { name })
const cardsIn = (name: string) => within(column(name)).queryAllByRole("button", { name: /^(?!Move |Add to )/ }).map((b) => b.getAttribute("aria-label"))

const tideway = { id: "tideway", company: "Tideway", role: "Senior designer", stage: "applied", applied: addDays(now, -10), steps: [], questions: [], ask: [] }
const marlow = { id: "marlow", company: "Marlow Studio", role: "Design lead", stage: "applied", applied: addDays(now, -6), steps: [], questions: [], ask: [] }
const finch = { id: "finch", company: "Finch Bikes", role: "Product designer", stage: "saved", steps: [], questions: [], ask: [] }
const northlight = { id: "northlight", company: "Northlight", role: "UX designer", stage: "interview", applied: addDays(now, -20), heard: addDays(now, -12), steps: [], questions: [], ask: [] }

// Start each test from a known board, whatever data the app holds.
beforeEach(async () => {
  route("/")
  await amber.store.set("stages", DEFAULT_STAGES)
  await amber.store.set("jobs", [finch, tideway, marlow, northlight])
  await amber.store.set("settings", { followUpDays: 7 })
  await amber.store.set("started", addDays(now, -30))
})

describe("Board", () => {
  it("shows a column per stage, with each application and the count per stage", async () => {
    render(<App />)
    await waitFor(() => expect(cardsIn("Applied")).toEqual(["Tideway, Senior designer", "Marlow Studio, Design lead"]))
    expect(cardsIn("Saved")).toEqual(["Finch Bikes, Product designer"])
    expect(cardsIn("Interview")).toEqual(["Northlight, UX designer"])
    expect(screen.getByTestId("count-saved")).toHaveTextContent("1")
    expect(screen.getByTestId("count-applied")).toHaveTextContent("2")
    expect(screen.getByTestId("count-offer")).toHaveTextContent("0")
    expect(screen.getByRole("heading", { name: "Applications" })).toBeInTheDocument()
    expect(screen.getByText("4 in all")).toBeInTheDocument()
  })

  it("shows the response rate: sent applications that heard back", async () => {
    render(<App />)
    // Three sent (Tideway, Marlow, Northlight), one heard back (Northlight is interviewing).
    await waitFor(() => expect(screen.getByTestId("response-rate")).toHaveTextContent("33%"))
    expect(screen.getByTestId("response-rate")).toHaveTextContent("Heard back from 1 of 3")
  })

  it("lists the stages with their counts as a strip to jump between them on a phone", async () => {
    render(<App />)
    const strip = await screen.findByRole("navigation", { name: "Stages", hidden: true })
    expect(within(strip).getAllByRole("button", { hidden: true }).map((b) => b.textContent)).toEqual(["Saved1", "Applied2", "Interview1", "Offer0", "Closed0"])
  })

  it("adds an application with its link, salary and contact", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add" }))
    await userEvent.type(screen.getByLabelText("Company"), "Harbor Labs")
    await userEvent.type(screen.getByLabelText("Role"), "Design systems lead")
    await userEvent.type(screen.getByLabelText("Link to the ad"), "harbor.example/jobs/12")
    await userEvent.type(screen.getByLabelText("Salary"), "60–65k")
    await userEvent.type(screen.getByLabelText("Contact"), "Ines, recruiter")
    await userEvent.click(screen.getByRole("button", { name: "Add Harbor Labs" }))
    const harbor = { role: "Design systems lead", link: "harbor.example/jobs/12", salary: "60–65k", contact: "Ines, recruiter", stage: "saved" }
    await waitFor(() => expect(fields(jobs().find((j) => j.company === "Harbor Labs"), harbor)).toEqual(harbor))
    await waitFor(() => expect(cardsIn("Saved")).toEqual(["Finch Bikes, Product designer", "Harbor Labs, Design systems lead"]))
    expect(within(column("Saved")).getByText("60–65k")).toBeInTheDocument()
  })

  it("adds straight into Applied from its column: the day you applied and a follow-up a week later", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add to Applied" }))
    await userEvent.type(screen.getByLabelText("Company"), "Kestrel")
    await userEvent.click(screen.getByRole("button", { name: "Add Kestrel" }))
    await waitFor(() => expect(jobs().find((j) => j.company === "Kestrel")?.stage).toBe("applied"))
    expect(jobs().find((j) => j.company === "Kestrel").applied).toBe(now)
    await waitFor(() => expect(within(column("Applied")).getByTestId("next-step")).toHaveTextContent(`Follow up${day(addDays(now, 7))}`))
  })

  it("moves a card to another stage with its Move menu", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Move Tideway" }))
    await userEvent.click(within(screen.getByRole("menu")).getByRole("menuitem", { name: "Interview" }))
    await waitFor(() => expect(job("tideway").stage).toBe("interview"))
    expect(job("tideway").heard).toBe(now)
    await waitFor(() => expect(cardsIn("Interview")).toEqual(["Northlight, UX designer", "Tideway, Senior designer"]))
    expect(screen.getByTestId("response-rate")).toHaveTextContent("Heard back from 2 of 3")
  })

  it("closes an application with a reason from the Move menu", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Move Marlow Studio" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Closed: they said no" }))
    await waitFor(() => expect(fields(job("marlow"), { stage: "closed", outcome: "rejected", heard: now })).toEqual({ stage: "closed", outcome: "rejected", heard: now }))
    await waitFor(() => expect(within(column("Closed")).getByText("They said no")).toBeInTheDocument())
    // A no is an answer: two of three heard back.
    expect(screen.getByTestId("response-rate")).toHaveTextContent("Heard back from 2 of 3")
  })

  it("moving a saved job on sets the day you applied", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Move Finch Bikes" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Applied" }))
    await waitFor(() => expect(fields(job("finch"), { stage: "applied", applied: now })).toEqual({ stage: "applied", applied: now }))
    expect(job("finch").steps.map((x: any) => [x.kind, x.date])).toEqual([["follow-up", addDays(now, 7)]])
  })

  it("drags a card to another stage", async () => {
    render(<App />)
    const card = (await screen.findByRole("button", { name: "Finch Bikes, Product designer" })).closest("[data-job]") as HTMLElement
    const from = card.getBoundingClientRect(), to = column("Offer").getBoundingClientRect()
    const at = { x: from.left + 20, y: from.top + 10 }
    pointer(card, "pointerdown", at.x, at.y)
    pointer(window, "pointermove", at.x + 30, at.y)
    pointer(window, "pointermove", to.left + to.width / 2, to.top + 60)
    pointer(window, "pointerup", to.left + to.width / 2, to.top + 60)
    await waitFor(() => expect(job("finch").stage).toBe("offer"))
    await waitFor(() => expect(cardsIn("Offer")).toEqual(["Finch Bikes, Product designer"]))
    expect(cardsIn("Saved")).toEqual([])
  })

  it("drags a card above another in its own stage, and the order is kept", async () => {
    render(<App />)
    const card = (await screen.findByRole("button", { name: "Marlow Studio, Design lead" })).closest("[data-job]") as HTMLElement
    const above = (screen.getByRole("button", { name: "Tideway, Senior designer" }).closest("[data-job]") as HTMLElement).getBoundingClientRect()
    const from = card.getBoundingClientRect()
    pointer(card, "pointerdown", from.left + 20, from.top + 10)
    pointer(window, "pointermove", from.left + 20, above.top + 2)
    pointer(window, "pointerup", from.left + 20, above.top + 2)
    await waitFor(() => expect(jobs().filter((j) => j.stage === "applied").map((j) => j.id)).toEqual(["marlow", "tideway"]))
    await waitFor(() => expect(cardsIn("Applied")).toEqual(["Marlow Studio, Design lead", "Tideway, Senior designer"]))
  })

  it("opens an application on a tap, not on a drag", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tideway, Senior designer" }))
    expect(await screen.findByRole("heading", { name: "Tideway" })).toBeInTheDocument()
    expect(screen.getByTestId("stage")).toHaveTextContent("Applied")
  })

  it("moves a card up and down within its stage from the Move menu", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Move Marlow Studio" }))
    expect(screen.getByRole("button", { name: "Down" })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "Up" }))
    await waitFor(() => expect(cardsIn("Applied")).toEqual(["Marlow Studio, Design lead", "Tideway, Senior designer"]))
    expect(jobs().filter((j) => j.stage === "applied").map((j) => j.id)).toEqual(["marlow", "tideway"])
  })

  it("shows each card's next date: an interview with its time", async () => {
    await amber.store.set("jobs", [{ ...northlight, steps: [
      { id: "s1", kind: "interview", what: "Second interview", date: addDays(now, 3), time: "14:00" },
      { id: "s2", kind: "follow-up", date: addDays(now, 9) },
    ] }])
    render(<App />)
    await waitFor(() => expect(within(column("Interview")).getByTestId("next-step")).toHaveTextContent(`Second interview${day(addDays(now, 3))}, 14:00`))
  })
})

describe("An application", () => {
  it("edits the company and role, and the board follows", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tideway, Senior designer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Edit application" }))
    const company = screen.getByLabelText("Company")
    await userEvent.clear(company)
    await userEvent.type(company, "Tideway Freight")
    await userEvent.clear(screen.getByLabelText("Role"))
    await userEvent.type(screen.getByLabelText("Role"), "Design lead")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(fields(job("tideway"), { company: "Tideway Freight", role: "Design lead", stage: "applied" })).toEqual({ company: "Tideway Freight", role: "Design lead", stage: "applied" }))
    expect(await screen.findByRole("heading", { name: "Tideway Freight" })).toBeInTheDocument()
  })

  it("changes the stage from the edit sheet, keeping the other changes", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tideway, Senior designer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Edit application" }))
    await userEvent.type(screen.getByLabelText("Salary"), "55k")
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "Stage" })).getByRole("radio", { name: "Offer" }))
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(fields(job("tideway"), { stage: "offer", salary: "55k" })).toEqual({ stage: "offer", salary: "55k" }))
    await waitFor(() => expect(screen.getByTestId("stage")).toHaveTextContent("Offer"))
  })

  it("deletes an application and brings it back with Undo", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Marlow Studio, Design lead" }))
    await userEvent.click(await screen.findByRole("button", { name: "Edit application" }))
    await userEvent.click(screen.getByRole("button", { name: "Delete application" }))
    await waitFor(() => expect(job("marlow")).toBeUndefined())
    expect(await screen.findByText("Deleted Marlow Studio")).toBeInTheDocument()
    await waitFor(() => expect(cardsIn("Applied")).toEqual(["Tideway, Senior designer"]))
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(fields(job("marlow"), { company: "Marlow Studio", stage: "applied" })).toEqual({ company: "Marlow Studio", stage: "applied" }))
    await waitFor(() => expect(cardsIn("Applied")).toEqual(["Tideway, Senior designer", "Marlow Studio, Design lead"]))
  })

  it("adds an interview date with its time, which shows under Due on the day", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Northlight, UX designer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Add date" }))
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "Kind" })).getByRole("radio", { name: "Interview" }))
    await pick("Day", now)
    await pick("Time", "14:00")
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add date" }))
    await waitFor(() => expect(job("northlight").steps.map((x: any) => [x.kind, x.date, x.time])).toEqual([["interview", now, "14:00"]]))
    expect(await screen.findByText("Today, 14:00")).toBeInTheDocument()
    await go("Due")
    const item = (await screen.findByText("Interview: Northlight")).closest("[data-testid=due-item]")!
    expect(item.parentElement).toHaveTextContent("Today14:00")
  })

  it("ticks a date done on the application's page, and deletes one with Undo", async () => {
    await amber.store.set("jobs", [{ ...tideway, steps: [{ id: "f1", kind: "follow-up", date: addDays(now, -1) }] }])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tideway, Senior designer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Done: Follow up" }))
    await waitFor(() => expect(job("tideway").steps[0].done).toBe(true))
    await waitFor(() => expect(screen.getByRole("button", { name: "Done: Follow up" })).toHaveAttribute("aria-pressed", "true"))
    await userEvent.click(screen.getByRole("button", { name: "Delete Follow up" }))
    await waitFor(() => expect(job("tideway").steps).toEqual([]))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(job("tideway").steps).toHaveLength(1))
  })

  it("keeps interview prep: a question with your answer, changed, then deleted and undone", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Northlight, UX designer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Add question" }))
    await userEvent.type(screen.getByLabelText("Question"), "Why Northlight?")
    await userEvent.type(screen.getByLabelText("Your answer"), "I like their accessibility work.")
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add question" }))
    await waitFor(() => expect(job("northlight").questions).toEqual([{ q: "Why Northlight?", a: "I like their accessibility work." }]))
    expect(await screen.findByText("I like their accessibility work.")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Edit question: Why Northlight?" }))
    const answer = screen.getByLabelText("Your answer")
    await userEvent.clear(answer)
    await userEvent.type(answer, "Their screen reader work.")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(job("northlight").questions[0].a).toBe("Their screen reader work."))

    await userEvent.click(await screen.findByRole("button", { name: "Delete question: Why Northlight?" }))
    await waitFor(() => expect(job("northlight").questions).toEqual([]))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(job("northlight").questions).toHaveLength(1))
  })

  it("keeps questions to ask them: add one, remove one", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Northlight, UX designer" }))
    await userEvent.type(await screen.findByLabelText("A question to ask them"), "What does a good first month look like?")
    await userEvent.click(screen.getByRole("button", { name: "Add the question" }))
    await waitFor(() => expect(job("northlight").ask).toEqual(["What does a good first month look like?"]))
    expect(screen.getByLabelText("A question to ask them")).toHaveValue("")
    await userEvent.click(screen.getByRole("button", { name: "Delete: What does a good first month look like?" }))
    await waitFor(() => expect(job("northlight").ask).toEqual([]))
  })

  it("saves notes when you leave the field", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tideway, Senior designer" }))
    await userEvent.type(await screen.findByLabelText("Notes"), "Karin cares about plain prototypes.")
    await userEvent.tab()
    await waitFor(() => expect(job("tideway").notes).toBe("Karin cares about plain prototypes."))
  })

  it("opens the ad's link through the device", async () => {
    await amber.store.set("jobs", [{ ...tideway, link: "tideway.example/jobs/designer", salary: "52–58k", contact: "Karin, design manager" }])
    const device = amber.device as any, was = device.openURL
    const open = vi.fn(() => Promise.resolve({ ok: true }))
    device.openURL = open
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tideway, Senior designer" }))
    expect(await screen.findByText("52–58k")).toBeInTheDocument()
    expect(screen.getByText("Karin, design manager")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /tideway\.example\/jobs\/designer/ }))
    try {
      await waitFor(() => expect(open.mock.calls.map((c: any[]) => String(c[0]))).toEqual([["https:", "", "tideway.example/jobs/designer"].join("/")]))
    } finally { device.openURL = was }
  })
})

describe("Due", () => {
  beforeEach(async () => {
    await amber.store.set("jobs", [
      { ...tideway, steps: [{ id: "a", kind: "follow-up", date: addDays(now, -2) }] },
      { ...northlight, steps: [{ id: "b", kind: "interview", date: now, time: "14:00" }, { id: "c", kind: "follow-up", date: addDays(now, 4) }] },
      { ...marlow, steps: [{ id: "d", kind: "follow-up", date: addDays(now, -1), done: true }] },
      { ...finch, stage: "closed", outcome: "withdrew", steps: [{ id: "e", kind: "deadline", date: addDays(now, -3) }] },
    ])
  })

  it("lists follow-ups and interviews due today or late, with their dates, and what's coming up", async () => {
    render(<App />)
    await go("Due")
    await waitFor(() => expect(screen.getAllByTestId("due-item").map((x) => x.textContent)).toEqual([
      "Follow up: TidewaySenior designer", "Interview: NorthlightUX designer", "Follow up: NorthlightUX designer",
    ]))
    expect(screen.getByText("2 to do, 1 late")).toBeInTheDocument()
    expect(screen.getByText("2 days late")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Coming up" })).toBeInTheDocument()
    expect(screen.getByText(day(addDays(now, 4)))).toBeInTheDocument()
    // Done steps and closed applications aren't due.
    expect(screen.queryByText(/Marlow|Finch/)).toBeNull()
  })

  it("counts what's due on the board", async () => {
    render(<App />)
    expect(await screen.findByRole("button", { name: "Due: 2" })).toBeInTheDocument()
  })

  it("ticks a follow-up done, and Undo brings it back", async () => {
    render(<App />)
    await go("Due")
    await userEvent.click(await screen.findByRole("button", { name: "Done: Follow up, Tideway" }))
    await waitFor(() => expect(job("tideway").steps[0].done).toBe(true))
    await waitFor(() => expect(screen.getByText("1 to do")).toBeInTheDocument())
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(job("tideway").steps[0].done).toBe(false))
  })

  it("says so when nothing is due", async () => {
    await amber.store.set("jobs", [finch])
    render(<App />)
    await go("Due")
    expect(await screen.findByText("Nothing due today. Follow-ups and interviews show here on their day.")).toBeInTheDocument()
  })
})

describe("Settings", () => {
  it("adds a stage, before Closed, and it shows on the board", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Add stage" }))
    await userEvent.type(screen.getByLabelText("Name"), "Take-home task")
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add stage" }))
    await waitFor(() => expect(values().stages.map((s: any) => s.name)).toEqual(["Saved", "Applied", "Interview", "Offer", "Take-home task", "Closed"]))
    expect(values().stages[4].id).toBe("take-home-task")
    await go("Board")
    expect(await screen.findByRole("region", { name: "Take-home task" })).toBeInTheDocument()
  })

  it("renames a stage, and its applications stay in it", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Rename Interview" }))
    const name = screen.getByLabelText("Name")
    await userEvent.clear(name)
    await userEvent.type(name, "Interviewing")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().stages[2]).toEqual({ id: "interview", name: "Interviewing" }))
    expect(job("northlight").stage).toBe("interview")
    await go("Board")
    await waitFor(() => expect(cardsIn("Interviewing")).toEqual(["Northlight, UX designer"]))
  })

  it("reorders stages", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Move Offer up" }))
    await waitFor(() => expect(values().stages.map((s: any) => s.id)).toEqual(["saved", "applied", "offer", "interview", "closed"]))
  })

  it("removes a stage, moving its applications to the stage before, and Undo puts both back", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Remove Interview" }))
    await waitFor(() => expect(values().stages.map((s: any) => s.id)).toEqual(["saved", "applied", "offer", "closed"]))
    await waitFor(() => expect(job("northlight").stage).toBe("applied"))
    expect(await screen.findByText("Removed Interview. Its application moved to Applied.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().stages.map((s: any) => s.id)).toEqual(["saved", "applied", "interview", "offer", "closed"]))
    await waitFor(() => expect(job("northlight").stage).toBe("interview"))
  })

  it("changes when to follow up, or turns it off", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("radio", { name: "3 days" }))
    await waitFor(() => expect(values().settings).toEqual({ followUpDays: 3 }))
    await go("Board")
    await userEvent.click(await screen.findByRole("button", { name: "Move Finch Bikes" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Applied" }))
    await waitFor(() => expect(job("finch").steps.map((x: any) => [x.kind, x.date])).toEqual([["follow-up", addDays(now, 3)]]))

    await go("Settings")
    await userEvent.click(await screen.findByRole("radio", { name: "Off" }))
    await waitFor(() => expect(values().settings.followUpDays).toBe(0))
    await go("Board")
    await userEvent.click(await screen.findByRole("button", { name: "Add to Saved" }))
    await userEvent.type(screen.getByLabelText("Company"), "Kestrel")
    await userEvent.click(screen.getByRole("button", { name: "Add Kestrel" }))
    await userEvent.click(await screen.findByRole("button", { name: "Move Kestrel" }))
    await userEvent.click(screen.getByRole("menuitem", { name: "Applied" }))
    await waitFor(() => expect(jobs().find((j) => j.company === "Kestrel")?.stage).toBe("applied"))
    expect(jobs().find((j) => j.company === "Kestrel").steps).toEqual([])
  })
})

describe("First use", () => {
  beforeEach(async () => {
    await amber.store.set("jobs", [])
    await amber.store.set("started", null)
  })

  it("opens on Which job are you after?, alone, with no board and no tabs", async () => {
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Which job are you after?" })).toBeInTheDocument()
    expect(screen.getByTestId("ai-hint")).toHaveTextContent("Add it here, or paste the ad to your AI and it adds it.")
    expect(screen.queryByTestId("board")).toBeNull()
    expect(screen.queryByRole("link", { name: "Due" })).toBeNull()
    expect(screen.getByRole("button", { name: "Name the company to start" })).toBeDisabled()
  })

  it("adds the first job, then shows the board with it", async () => {
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Company"), "Tideway")
    await userEvent.type(screen.getByLabelText("Role"), "Senior designer")
    await userEvent.click(screen.getByRole("button", { name: "Add Tideway" }))
    await waitFor(() => expect(jobs().map((j) => [j.company, j.role, j.stage])).toEqual([["Tideway", "Senior designer", "saved"]]))
    expect(values().started).toBe(now)
    await waitFor(() => expect(cardsIn("Saved")).toEqual(["Tideway, Senior designer"]))
  })

  it("starts in Applied when you have applied already", async () => {
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Company"), "Tideway")
    await userEvent.click(screen.getByRole("radio", { name: "Yes, I applied" }))
    await userEvent.click(screen.getByRole("button", { name: "Add Tideway" }))
    await waitFor(() => expect(fields(jobs()[0], { stage: "applied", applied: now })).toEqual({ stage: "applied", applied: now }))
  })

  it("leaves the first screen by itself when your AI adds a job, and keeps what you typed a tap away", async () => {
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Company"), "Kestrel")
    // The person's AI adds the ad they pasted, as its prompt says.
    await amber.store.set("jobs", [tideway])
    expect(await screen.findByRole("heading", { name: "Applications" })).toBeInTheDocument()
    expect(await screen.findByText("Your AI added Tideway. What you typed here wasn't added.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Add mine" }))
    await waitFor(() => expect(jobs().map((j) => j.company)).toEqual(["Tideway", "Kestrel"]))
  })

  it("says nothing more when your AI adds a job and you hadn't typed anything", async () => {
    render(<App />)
    await screen.findByRole("heading", { name: "Which job are you after?" })
    await amber.store.set("jobs", [tideway])
    expect(await screen.findByRole("heading", { name: "Applications" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add mine" })).toBeNull()
  })
})

describe("Your AI fills it in", () => {
  it("shows a job your AI added from a pasted ad: link, salary, contact and the deadline", async () => {
    await amber.store.set("jobs", [...jobs(), {
      id: "j-harbor", company: "Harbor Labs", role: "Design systems lead", link: "harbor.example/jobs/12", salary: "60–65k",
      contact: "Ines Duarte, recruiter", stage: "saved", steps: [{ id: "s-apply", kind: "deadline", date: addDays(now, 5) }], questions: [], ask: [],
    }])
    render(<App />)
    await waitFor(() => expect(cardsIn("Saved")).toEqual(["Finch Bikes, Product designer", "Harbor Labs, Design systems lead"]))
    expect(within(column("Saved")).getByTestId("next-step")).toHaveTextContent(`Apply by${day(addDays(now, 5))}`)
    await userEvent.click(screen.getByRole("button", { name: "Harbor Labs, Design systems lead" }))
    expect(await screen.findByText("Ines Duarte, recruiter")).toBeInTheDocument()
    expect(screen.getByText("harbor.example/jobs/12")).toBeInTheDocument()
  })

  it("follows your AI moving Tideway to Interview with a date and time", async () => {
    render(<App />)
    await waitFor(() => expect(cardsIn("Applied")).toContain("Tideway, Senior designer"))
    // "I heard back from Tideway, interview Thursday 14:00": the stage, the day heard back and the interview.
    await amber.store.set("jobs", jobs().map((j) => j.id === "tideway"
      ? { ...j, stage: "interview", heard: now, steps: [{ id: "s-int", kind: "interview", date: now, time: "14:00" }] } : j))
    // The board keeps the order of jobs in data.json: Tideway was before Northlight there.
    await waitFor(() => expect(cardsIn("Interview")).toEqual(["Tideway, Senior designer", "Northlight, UX designer"]))
    expect(within(column("Interview")).getAllByTestId("next-step")[0]).toHaveTextContent("InterviewToday, 14:00")
    expect(screen.getByRole("button", { name: "Due: 1" })).toBeInTheDocument()
    expect(screen.getByTestId("response-rate")).toHaveTextContent("Heard back from 2 of 3")
  })

  it("opens data an AI wrote loosely: a stage by its name, no steps and no prep", async () => {
    await amber.store.set("jobs", [{ id: "j9", company: "Quill", role: "Designer", stage: "Interview" }])
    render(<App />)
    await waitFor(() => expect(cardsIn("Interview")).toEqual(["Quill, Designer"]))
    await userEvent.click(screen.getByRole("button", { name: "Quill, Designer" }))
    expect(await screen.findByText("No questions yet. Add the ones you expect, or ask your AI to prep you.")).toBeInTheDocument()
    expect(screen.getByText("No dates yet.")).toBeInTheDocument()
  })
})
