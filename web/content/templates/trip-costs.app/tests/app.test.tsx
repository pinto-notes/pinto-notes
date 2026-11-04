import { describe, it, expect, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { balances, money, owed, settle, type Cost, type Person } from "@/lib/costs"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
// Typing is one input event with the whole value: the app reads what's in the field, and the
// tests stay well inside the 30 s a save gives them.
const type = async (label: string, text: string) => { fireEvent.input(await screen.findByLabelText(label), { target: { value: text } }) }
// The fields a test cares about, from what was saved (ids and days are the app's own).
const pick = (o: Record<string, unknown>, keys: string[]) => Object.fromEntries(keys.map((k) => [k, o[k]]))
const people: Person[] = [{ id: "s", name: "Sara" }, { id: "l", name: "Leo" }, { id: "m", name: "Maja" }]

// Start each test from a known trip, whatever data the app holds: Sara paid the flat, Leo a dinner.
beforeEach(async () => {
  route("/")
  await amber.store.set("name", "Lisbon")
  await amber.store.set("currency", "€")
  await amber.store.set("people", people)
  await amber.store.set("costs", [
    { id: "c1", what: "Flat, four nights", amount: 480, paidBy: "s", date: "2026-05-12", split: "equal", among: ["s", "l", "m"] },
    { id: "c2", what: "Dinner at Ramiro", amount: 96, paidBy: "l", date: "2026-05-13", split: "equal", among: ["s", "l", "m"] },
  ])
  await amber.store.set("payments", [])
})

describe("The sums", () => {
  it("splits a cost to the cent, adding up exactly", () => {
    const c: Cost = { id: "x", what: "Taxi", amount: 10, paidBy: "s", split: "equal", among: ["s", "l", "m"] }
    expect(owed(c, people)).toEqual({ s: 334, l: 333, m: 333 })
    expect(owed({ ...c, split: "shares", shares: { s: 2, l: 1 } }, people)).toEqual({ s: 667, l: 333 })
  })

  it("settles with the fewest payments", () => {
    const b = balances(people, [{ id: "a", what: "Flat", amount: 300, paidBy: "s", split: "equal" }], [])
    expect(settle(b)).toEqual([{ from: "l", to: "s", amount: 100 }, { from: "m", to: "s", amount: 100 }])
    expect(money(42, "€")).toBe("€42")
    expect(money(42.5, "€")).toBe("€42.50")
    expect(money(1200, "kr")).toBe("1,200 kr")
  })
})

describe("Who owes whom", () => {
  it("says who owes whom from the costs", async () => {
    render(<App />)
    const lines = await screen.findAllByTestId("owes")
    expect(lines.map((l) => l.textContent?.replace(/\s+/g, " ").trim())).toEqual(["Maja owes Sara €192", "Leo owes Sara €96"])
    expect(screen.getByText("€576 in all · 3 people")).toBeInTheDocument()
  })

  it("marks a payment as paid, and Undo takes it back", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Mark as paid: Maja owes Sara €192" }))
    await waitFor(() => expect((values().payments ?? []).map((p: Record<string, unknown>) => pick(p, ["from", "to", "amount"]))).toEqual([{ from: "m", to: "s", amount: 192 }]))
    await waitFor(() => expect(screen.getAllByTestId("owes").map((l) => l.textContent?.replace(/\s+/g, " ").trim())).toEqual(["Leo owes Sara €96"]))
    expect(screen.getByText("Paid back")).toBeInTheDocument()
    // The Undo shows once the payment is saved.
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().payments).toEqual([]))
  })

  it("is all square once everyone has paid back", async () => {
    await amber.store.set("payments", [{ id: "s1", from: "m", to: "s", amount: 192 }, { id: "s2", from: "l", to: "s", amount: 96 }])
    render(<App />)
    expect(await screen.findByTestId("square")).toHaveTextContent("All square.")
  })
})

describe("Costs", () => {
  it("adds a cost split equally between the people ticked", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add cost" }))
    const sheet = await screen.findByRole("dialog", { name: "New cost" })
    await type("What", "Train to Sintra")
    await type("Amount (€)", "18")
    await userEvent.click(within(sheet).getByRole("radio", { name: "Leo" }))
    await userEvent.click(within(sheet).getByRole("button", { name: "Split with Maja" }))
    await waitFor(() => expect(within(sheet).getByTestId("part-Sara")).toHaveTextContent("€9"))
    await userEvent.click(within(sheet).getByRole("button", { name: "Add cost" }))
    await waitFor(() => expect(values().costs).toHaveLength(3))
    expect(pick(values().costs[2], ["what", "amount", "paidBy", "split", "among"])).toEqual({ what: "Train to Sintra", amount: 18, paidBy: "l", split: "equal", among: ["s", "l"] })
    expect(await screen.findByText("Train to Sintra")).toBeInTheDocument()
    expect(screen.getByText(/^Leo paid · Split between Sara and Leo/)).toBeInTheDocument()
  })

  it("adds a cost split by share", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add cost" }))
    const sheet = await screen.findByRole("dialog", { name: "New cost" })
    await type("What", "Wine")
    await type("Amount (€)", "30")
    await userEvent.click(within(sheet).getByRole("radio", { name: "By share" }))
    await type("Shares for Sara", "2")
    await type("Shares for Maja", "0")
    await waitFor(() => expect(within(sheet).getByTestId("part-Sara")).toHaveTextContent("€20"))
    await userEvent.click(within(sheet).getByRole("button", { name: "Add cost" }))
    await waitFor(() => expect(pick(values().costs[2] ?? {}, ["what", "amount", "paidBy", "split", "shares"])).toEqual({ what: "Wine", amount: 30, paidBy: "s", split: "shares", shares: { s: 2, l: 1 } }))
  })

  it("changes a cost, and deletes one with Undo", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit Dinner at Ramiro" }))
    await type("Amount (€)", "120")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().costs.find((c: Cost) => c.id === "c2").amount).toBe(120))
    await userEvent.click(await screen.findByRole("button", { name: "Delete Flat, four nights" }))
    await waitFor(() => expect(values().costs.map((c: Cost) => c.id)).toEqual(["c2"]))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().costs).toHaveLength(2))
  })

  it("starts with the people, then the first cost", async () => {
    await amber.store.set("people", [])
    await amber.store.set("costs", [])
    render(<App />)
    expect(await screen.findByRole("button", { name: "Add cost" })).toBeDisabled()
    await type("Name", "Sara")
    await userEvent.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect((values().people ?? []).map((p: Person) => p.name)).toEqual(["Sara"]))
    expect(screen.getByRole("button", { name: "Add cost" })).toBeEnabled()
  })
})

describe("People", () => {
  it("shows where each person stands, adds and renames someone", async () => {
    render(<App />)
    await go("People")
    expect(await screen.findByText("Is owed €288")).toBeInTheDocument()
    expect(screen.getByText("Owes €96")).toBeInTheDocument()
    await type("New person", "Ana")
    await userEvent.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(values().people.map((p: Person) => p.name)).toEqual(["Sara", "Leo", "Maja", "Ana"]))
    await userEvent.click(await screen.findByRole("button", { name: "Rename Leo" }))
    const sheet = await screen.findByRole("dialog", { name: "Edit Leo" })
    await type("Name", "Leon")
    await userEvent.click(within(sheet).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().people[1].name).toBe("Leon"))
  })

  it("won't remove someone who shares a cost, and removes someone who doesn't", async () => {
    await amber.store.set("people", [...people, { id: "a", name: "Ana" }])
    render(<App />)
    await go("People")
    await userEvent.click(await screen.findByRole("button", { name: "Remove Leo" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Leo paid or shares a cost.")
    expect(values().people).toHaveLength(4)
    fireEvent.keyDown(document, { key: "Escape" })
    await userEvent.click(await screen.findByRole("button", { name: "Remove Ana" }))
    await waitFor(() => expect(values().people.map((p: Person) => p.name)).toEqual(["Sara", "Leo", "Maja"]))
  })

  it("renames the trip and changes the currency", async () => {
    render(<App />)
    await go("People")
    await type("Currency", "kr")
    await userEvent.click(screen.getByRole("button", { name: "Save trip" }))
    await waitFor(() => expect(values().currency).toBe("kr"))
    await go("Costs")
    expect((await screen.findAllByTestId("owes"))[0].textContent?.replace(/\s+/g, " ").trim()).toBe("Maja owes Sara 192 kr")
  })
})
