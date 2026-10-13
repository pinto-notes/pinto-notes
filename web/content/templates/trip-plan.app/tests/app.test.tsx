import { describe, it, expect, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
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
})

describe("Trip", () => {
  it("counts down to the trip and shows what's left to do", async () => {
    render(<App />)
    expect(await screen.findByTestId("countdown")).toHaveTextContent(/^9\s*days to go/)
    expect(screen.getByText("0 of 1 paid")).toBeInTheDocument()
    expect(screen.getByText("0 of 2 packed")).toBeInTheDocument()
    expect(screen.getByText("Lunch at Time Out Market")).toBeInTheDocument()
  })

  it("shows which day it is during the trip", async () => {
    await amber.store.set("trip", trip(-1, 3))
    render(<App />)
    expect(await screen.findByTestId("countdown")).toHaveTextContent("Day 2 of 5")
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
    expect(await screen.findByTestId("countdown")).toHaveTextContent(/^3\s*days to go/)
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
    expect(screen.getByRole("button", { name: "Passport" })).toHaveAttribute("aria-pressed", "true")
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
    const when = await screen.findByLabelText("When")
    expect(when).toHaveValue("4 nights")
    await userEvent.clear(when)
    await userEvent.type(when, "5 nights")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().bookings[0]).toEqual({ id: "b1", what: "Hotel", when: "5 nights", ref: "4821", paid: false }))
    expect(await screen.findByText(/^5 nights/)).toBeInTheDocument()
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
    await userEvent.type(screen.getByLabelText("When"), "23 Oct, 20:00")
    await userEvent.click(screen.getByRole("button", { name: "Add booking" }))
    await waitFor(() => expect(values().bookings.map(({ id, ...b }: { id: string }) => b)).toEqual([
      { what: "Hotel", when: "4 nights", ref: "4821", paid: false },
      { what: "Dinner at Ramiro", when: "23 Oct, 20:00", paid: false },
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
    expect(date).toHaveValue(day(10))
    await userEvent.type(screen.getByLabelText("Title (optional)"), "Sintra")
    await userEvent.type(screen.getByLabelText("Plan, one line each"), "Train 09:10")
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
