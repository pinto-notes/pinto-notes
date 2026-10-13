import { describe, it, expect, beforeEach, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { iso } from "@/lib/trip"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const day = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }
// A date field takes a whole date at once, the way the date picker sets it.
const pick = async (label: string, value: string) => { fireEvent.input(await screen.findByLabelText(label), { target: { value } }); await new Promise((r) => setTimeout(r, 0)) }
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
const trip = (start: number, end: number) => ({ name: "Lisbon", place: "Portugal", start: day(start), end: day(end) })

// Start each test from a known trip, whatever data the app holds.
beforeEach(async () => {
  route("/")
  await amber.store.set("trip", trip(9, 13))
  await amber.store.set("days", [{ date: day(9), title: "Arrive", items: ["Lunch at Time Out Market"] }])
  await amber.store.set("bookings", [{ id: "b1", what: "Hotel", when: "4 nights", ref: "4821", paid: false }])
  await amber.store.set("packing", [{ id: "p1", text: "Passport", packed: false }, { id: "p2", text: "Sunglasses", packed: false }])
  await amber.store.set("past", [])
})

describe("Trip", () => {
  it("counts down to the trip and shows what's left to do", async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("countdown")).toHaveTextContent(/^9\s*days to go/))
    expect(screen.getByText(/^0 of 1 paid · next to pay: Hotel$/)).toBeInTheDocument()
    expect(screen.getByText("0 of 2 packed")).toBeInTheDocument()
    expect(screen.getByText("Lunch at Time Out Market")).toBeInTheDocument()
  })

  it("shows which day it is during the trip", async () => {
    await amber.store.set("trip", trip(-1, 3))
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("countdown")).toHaveTextContent("Day 2 of 5"))
  })
})

describe("Trip details", () => {
  it("changes the trip's dates, and the countdown follows", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit trip" }))
    await pick("First day", day(3))
    await pick("Last day", day(6))
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().trip).toEqual({ name: "Lisbon", place: "Portugal", start: day(3), end: day(6) }))
    await waitFor(() => expect(screen.getByTestId("countdown")).toHaveTextContent(/^3\s*days to go/))
  })

  it("starts a trip from nothing", async () => {
    await amber.store.set("trip", null)
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Plan a trip" }))
    await userEvent.type(await screen.findByLabelText("Where to"), "Rome")
    await pick("First day", day(10))
    await pick("Last day", day(12))
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().trip).toEqual({ name: "Rome", start: day(10), end: day(12) }))
    expect(await screen.findByRole("heading", { name: "Rome" })).toBeInTheDocument()
  })
})

describe("Packing", () => {
  it("packs an item with one tap, and unpacks it", async () => {
    render(<App />)
    await go("Packing")
    await userEvent.click(await screen.findByRole("button", { name: "Passport" }))
    await waitFor(() => expect(values().packing[0]).toEqual({ id: "p1", text: "Passport", packed: true }))
    expect(await screen.findByText("1 of 2 packed")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Passport" })).toHaveAttribute("aria-pressed", "true"))
    await userEvent.click(screen.getByRole("button", { name: "Passport" }))
    await waitFor(() => expect(values().packing[0].packed).toBe(false))
  })

  it("adds and removes an item", async () => {
    render(<App />)
    await go("Packing")
    await userEvent.type(await screen.findByLabelText("New item"), "Travel adapter")
    await userEvent.click(screen.getByRole("button", { name: "Add item" }))
    await waitFor(() => expect(values().packing.map((x: { text: string }) => x.text)).toEqual(["Passport", "Sunglasses", "Travel adapter"]))
    expect(await screen.findByRole("button", { name: "Travel adapter" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Delete Sunglasses" }))
    await waitFor(() => expect(values().packing.map((x: { text: string }) => x.text)).toEqual(["Passport", "Travel adapter"]))
  })
})

describe("Packing, more", () => {
  it("renames an item, and brings a deleted one back with Undo", async () => {
    render(<App />)
    await go("Packing")
    await userEvent.click(await screen.findByRole("button", { name: "Edit Passport" }))
    const field = await screen.findByLabelText("Item")
    await userEvent.clear(field)
    await userEvent.type(field, "Passport and ID card")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().packing[0].text).toBe("Passport and ID card"))
    await userEvent.click(await screen.findByRole("button", { name: "Delete Sunglasses" }))
    await waitFor(() => expect(values().packing).toHaveLength(1))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().packing.map((x: { text: string }) => x.text)).toEqual(["Passport and ID card", "Sunglasses"]))
  })
})

describe("Bookings", () => {
  it("edits a booking", async () => {
    render(<App />)
    await go("Bookings")
    await userEvent.click(await screen.findByRole("button", { name: "Edit Hotel" }))
    // A booking from before bookings had a day keeps what it said, as written.
    const when = await screen.findByLabelText("When (as written)")
    await waitFor(() => expect(when).toHaveValue("4 nights"))
    await userEvent.clear(when)
    await userEvent.type(when, "5 nights")
    await userEvent.click(screen.getByRole("radio", { name: "Stay" }))
    await pick("Day", day(9))
    await pick("Time", "15:00")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().bookings[0]).toEqual({ id: "b1", what: "Hotel", kind: "stay", date: day(9), time: "15:00", when: "5 nights", ref: "4821", paid: false }))
    expect(await screen.findByText(/, 15:00 · Ref 4821/)).toBeInTheDocument()
  })

  it("deletes a booking, with Undo", async () => {
    render(<App />)
    await go("Bookings")
    await userEvent.click(await screen.findByRole("button", { name: "Delete Hotel" }))
    await waitFor(() => expect(values().bookings).toEqual([]))
    expect(await screen.findByText(/^No bookings yet/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().bookings).toHaveLength(1))
  })

  it("ticks a booking as paid", async () => {
    render(<App />)
    await go("Bookings")
    expect(await screen.findByText("Not paid")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Paid: Hotel" }))
    await waitFor(() => expect(values().bookings[0].paid).toBe(true))
    expect(await screen.findByText("1 of 1 paid")).toBeInTheDocument()
    expect(screen.queryByText("Not paid")).not.toBeInTheDocument()
  })

  it("adds a booking, not yet paid", async () => {
    render(<App />)
    await go("Bookings")
    await userEvent.click(await screen.findByRole("button", { name: "Add" }))
    await userEvent.type(await screen.findByLabelText("What"), "Dinner at Ramiro")
    await userEvent.click(screen.getByRole("radio", { name: "Food" }))
    // The day starts on the trip's first day.
    await waitFor(() => expect(screen.getByLabelText("Day")).toHaveValue(day(9)))
    await pick("Day", day(10))
    await pick("Time", "20:00")
    await userEvent.click(screen.getByRole("button", { name: "Add booking" }))
    await waitFor(() => expect(values().bookings.map(({ id, ...b }: { id: string }) => b)).toEqual([
      { what: "Hotel", when: "4 nights", ref: "4821", paid: false },
      { what: "Dinner at Ramiro", kind: "food", date: day(10), time: "20:00", paid: false },
    ]))
    expect(await screen.findByText("Dinner at Ramiro")).toBeInTheDocument()
  })
})

describe("Days", () => {
  it("adds a day with its plan, one line each", async () => {
    render(<App />)
    await go("Days")
    await userEvent.click(await screen.findByRole("button", { name: "Add day" }))
    const date = await screen.findByLabelText("Date")
    await waitFor(() => expect(date).toHaveValue(day(10)))
    await userEvent.type(screen.getByLabelText("Title (optional)"), "Sintra")
    await userEvent.type(screen.getByLabelText("Plan, one line each (start with a time to order it)"), "Train 09:10")
    await userEvent.click(screen.getByRole("button", { name: "Save day" }))
    await waitFor(() => expect(values().days).toEqual([
      { date: day(9), title: "Arrive", items: ["Lunch at Time Out Market"] },
      { date: day(10), title: "Sintra", items: ["Train 09:10"] },
    ]))
    expect(await screen.findByText(/^Day 2 · /)).toBeInTheDocument()
  })

  it("edits a day, and deletes it with Undo", async () => {
    const label = new Date(day(9) + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    render(<App />)
    await go("Days")
    await userEvent.click(await screen.findByRole("button", { name: `Edit ${label}` }))
    const title = await screen.findByLabelText("Title (optional)")
    await userEvent.clear(title)
    await userEvent.type(title, "Arrive and settle in")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().days[0].title).toBe("Arrive and settle in"))
    await userEvent.click(await screen.findByRole("button", { name: `Edit ${label}` }))
    await userEvent.click(await screen.findByRole("button", { name: "Delete day" }))
    await waitFor(() => expect(values().days).toEqual([]))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().days).toHaveLength(1))
  })

  it("shows the plan a day at a time, numbered from the start", async () => {
    render(<App />)
    await go("Days")
    expect(await screen.findByText(/^Day 1 · /)).toBeInTheDocument()
    expect(screen.getByText("Arrive")).toBeInTheDocument()
  })
})

describe("Timeline", () => {
  const label = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
  const plan = async () => {
    await amber.store.set("days", [{ date: day(9), title: "Arrive", items: ["13:00 Lunch at Time Out Market", "09:00 Tram 28", "Walk down to the river"] }])
    await amber.store.set("bookings", [{ id: "b1", what: "Hotel", kind: "stay", date: day(9), time: "10:30", ref: "4821", paid: false }])
  }

  it("puts a day's plan and its bookings in time order", async () => {
    await plan()
    render(<App />)
    await go("Days")
    const list = (await screen.findAllByRole("list", { name: "Timeline" }))[0]
    const texts = within(list).getAllByRole("listitem").map((li) => li.textContent)
    // A line without a time stays after the line before it (Walk follows the tram).
    expect(texts).toEqual(["09:00Tram 28", "Walk down to the river", "10:30HotelRef 4821 · Not paid", "13:00Lunch at Time Out Market"])
  })

  it("shows every day of the trip, planned or not, and plans an empty one", async () => {
    render(<App />)
    await go("Days")
    expect(await screen.findByText(/^Day 5 · /)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: `Edit ${label(day(11))}` }))
    await waitFor(() => expect(screen.getByLabelText("Date")).toHaveValue(day(11)))
    expect(screen.queryByRole("button", { name: "Delete day" })).toBeNull()
    await userEvent.type(screen.getByLabelText(/^Plan, one line each/), "Belém")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().days.map((d: { date: string }) => d.date)).toEqual([day(9), day(11)]))
  })

  it("shows the first day's timeline on the Trip tab", async () => {
    await plan()
    render(<App />)
    expect(await screen.findByText("Tram 28")).toBeInTheDocument()
    expect(screen.getByText("Hotel")).toBeInTheDocument()
  })
})

describe("Sharing", () => {
  it("shares a day as text, and says it's shared", async () => {
    const share = vi.fn(async () => ({ ok: true }))
    amber.device.share = share
    await amber.store.set("days", [{ date: day(9), title: "Arrive", items: ["09:00 Tram 28"] }])
    render(<App />)
    await go("Days")
    await userEvent.click((await screen.findAllByRole("button", { name: `Share ${new Date(day(9) + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}` }))[0])
    await waitFor(() => expect(share).toHaveBeenCalled())
    const file = (share.mock.calls[0] as unknown[])[0] as { name: string; type: string; text: string }
    expect(file.name).toBe("Lisbon, day 1.txt")
    expect(file.type).toBe("text/plain")
    expect(file.text).toMatch(/^Lisbon, day 1, .+: Arrive\n09:00 Tram 28$/)
    expect(await screen.findByText("Shared")).toBeInTheDocument()
  })

  it("shares the whole trip", async () => {
    const share = vi.fn(async () => ({ ok: true }))
    amber.device.share = share
    render(<App />)
    await go("Days")
    await userEvent.click(await screen.findByRole("button", { name: "Share the whole trip" }))
    await waitFor(() => expect(share).toHaveBeenCalled())
    const file = (share.mock.calls[0] as unknown[])[0] as { name: string; text: string }
    expect(file.name).toBe("Lisbon plan.txt")
    expect(file.text).toContain("Lunch at Time Out Market")
    expect(file.text.split("\n\n")).toHaveLength(5)
  })

  it("says so when sharing doesn't work", async () => {
    amber.device.share = vi.fn(async () => ({ ok: false, error: "Sharing isn't available here." }))
    render(<App />)
    await go("Days")
    await userEvent.click(await screen.findByRole("button", { name: "Share the whole trip" }))
    expect(await screen.findByText("Sharing isn't available here.")).toBeInTheDocument()
  })
})

describe("Next trip", () => {
  it("starts a new trip: keeps the packing list, unpacked, and Undo brings the old trip back", async () => {
    await amber.store.set("packing", [{ id: "p1", text: "Passport", group: "Documents", packed: true }, { id: "p2", text: "Sunglasses", group: "Clothes", packed: false }])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit trip" }))
    await userEvent.click(await screen.findByRole("button", { name: "Start a new trip" }))
    await waitFor(() => expect(values().trip ?? null).toBeNull())
    expect(values().days).toEqual([])
    expect(values().bookings).toEqual([])
    expect(values().packing).toEqual([{ id: "p1", text: "Passport", group: "Documents", packed: false }, { id: "p2", text: "Sunglasses", group: "Clothes", packed: false }])
    expect(values().past.map((t: { name: string }) => t.name)).toEqual(["Lisbon"])
    expect(await screen.findByText("Your packing list from Lisbon is ready: 2 things.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().trip?.name).toBe("Lisbon"))
    await waitFor(() => expect(values().past).toEqual([]))
    expect(values().packing[0].packed).toBe(true)
  })
})

describe("Packing groups", () => {
  it("adds an item to a group and shows it there", async () => {
    render(<App />)
    await go("Packing")
    await userEvent.type(await screen.findByLabelText("New item"), "Charger")
    await userEvent.click(screen.getByRole("radio", { name: "Tech" }))
    await userEvent.click(screen.getByRole("button", { name: "Add item" }))
    await waitFor(() => expect(values().packing[2]).toEqual({ id: values().packing[2].id, text: "Charger", group: "Tech", packed: false }))
    expect(await screen.findByRole("heading", { name: "Tech · 0 of 1" })).toBeInTheDocument()
    // Items from before groups go under Other.
    expect(screen.getByRole("heading", { name: "Other · 0 of 2" })).toBeInTheDocument()
  })

  it("moves an item to another group", async () => {
    await amber.store.set("packing", [{ id: "p1", text: "Passport", group: "Other", packed: false }])
    render(<App />)
    await go("Packing")
    await userEvent.click(await screen.findByRole("button", { name: "Edit Passport" }))
    await userEvent.click(within(await screen.findByRole("dialog", { name: "Edit item" })).getByRole("radio", { name: "Documents" }))
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().packing[0].group).toBe("Documents"))
    expect(await screen.findByRole("heading", { name: "Documents · 0 of 1" })).toBeInTheDocument()
  })

  it("unpacks everything at once, with Undo", async () => {
    await amber.store.set("packing", [{ id: "p1", text: "Passport", packed: true }, { id: "p2", text: "Sunglasses", packed: true }])
    render(<App />)
    await go("Packing")
    await userEvent.click(await screen.findByRole("button", { name: "Unpack all" }))
    await waitFor(() => expect(values().packing.every((x: { packed: boolean }) => !x.packed)).toBe(true))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().packing.every((x: { packed: boolean }) => x.packed)).toBe(true))
  })
})
