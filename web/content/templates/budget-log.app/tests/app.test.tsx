import { describe, it, expect, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { iso, shiftMonth, thisMonth } from "@/lib/budget"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const today = iso(new Date())
const cats = [{ name: "Groceries", budget: 1000 }, { name: "Eating out", budget: 500 }]
const saved = () => (values().expenses ?? []).map(({ id, ...rest }: { id: string }) => rest)
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])

// Start each test from a known budget and no expenses, whatever data the app holds.
beforeEach(async () => {
  route("/")
  await amber.store.set("currency", "kr")
  await amber.store.set("categories", cats)
  await amber.store.set("expenses", [])
})

describe("Month", () => {
  it("adds an expense from the quick add sheet, and what's left goes down", async () => {
    render(<App />)
    expect(await screen.findByTestId("left")).toHaveTextContent("1,500 kr")
    await userEvent.click(screen.getByRole("button", { name: "Add expense" }))
    await userEvent.type(await screen.findByLabelText("Amount (kr)"), "120")
    await userEvent.type(screen.getByLabelText("What"), "Lunch")
    await userEvent.click(screen.getByRole("radio", { name: "Eating out" }))
    await userEvent.click(screen.getByRole("button", { name: "Add" }))
    await waitFor(() => expect(saved()).toEqual([{ date: today, what: "Lunch", category: "Eating out", amount: 120 }]))
    expect(await screen.findByText("Lunch")).toBeInTheDocument()
    expect(screen.getByTestId("left")).toHaveTextContent("1,380 kr")
    expect(screen.getByText("380 kr left")).toBeInTheDocument()
  })

  it("won't add an expense without an amount", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add expense" }))
    await userEvent.type(await screen.findByLabelText("What"), "Coffee")
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled()
  })

  it("shows a category that's over its budget", async () => {
    await amber.store.set("expenses", [{ id: "a", date: today, what: "Birthday dinner", category: "Eating out", amount: 620 }])
    render(<App />)
    expect(await screen.findByText("120 kr over")).toBeInTheDocument()
    expect(screen.getByTestId("left")).toHaveTextContent("880 kr")
  })

  it("goes back a month and shows that month's spending", async () => {
    const last = shiftMonth(thisMonth(), -1)
    await amber.store.set("expenses", [{ id: "a", date: `${last}-15`, what: "Concert tickets", category: "Groceries", amount: 300 }])
    render(<App />)
    expect(await screen.findByText(/^Nothing spent in/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Previous month" }))
    expect(await screen.findByText("Concert tickets")).toBeInTheDocument()
    expect(screen.getByTestId("left")).toHaveTextContent("1,200 kr")
  })
})

describe("Expenses", () => {
  it("lists expenses by day and deletes one, with Undo", async () => {
    await amber.store.set("expenses", [
      { id: "a", date: today, what: "Weekly shop", category: "Groceries", amount: 412 },
      { id: "b", date: today, what: "Pizza", category: "Eating out", amount: 260 },
    ])
    render(<App />)
    await go("Expenses")
    expect(await screen.findByText("Weekly shop")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Delete Pizza" }))
    await waitFor(() => expect(saved().map((e: { what: string }) => e.what)).toEqual(["Weekly shop"]))
    await waitFor(() => expect(screen.queryByText("Pizza")).not.toBeInTheDocument())
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(saved().map((e: { what: string }) => e.what)).toEqual(["Weekly shop", "Pizza"]))
    expect(await screen.findByText("Pizza")).toBeInTheDocument()
  })

  it("edits an expense: amount, what and category", async () => {
    await amber.store.set("expenses", [{ id: "a", date: today, what: "Shop", category: "Groceries", amount: 412 }])
    render(<App />)
    await go("Expenses")
    await userEvent.click(await screen.findByRole("button", { name: "Edit Shop" }))
    const amount = await screen.findByLabelText("Amount (kr)")
    expect(amount).toHaveValue("412")
    await userEvent.clear(amount)
    await userEvent.type(amount, "98")
    await userEvent.clear(screen.getByLabelText("What"))
    await userEvent.type(screen.getByLabelText("What"), "Takeaway")
    await userEvent.click(screen.getByRole("radio", { name: "Eating out" }))
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().expenses).toEqual([{ id: "a", date: today, what: "Takeaway", category: "Eating out", amount: 98 }]))
    expect(await screen.findByText("Takeaway")).toBeInTheDocument()
  })

  it("deletes an expense from its edit sheet", async () => {
    await amber.store.set("expenses", [{ id: "a", date: today, what: "Shop", category: "Groceries", amount: 412 }])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit Shop" }))
    await userEvent.click(await screen.findByRole("button", { name: "Delete expense" }))
    await waitFor(() => expect(values().expenses).toEqual([]))
    expect(await screen.findByText("Deleted Shop")).toBeInTheDocument()
    expect(screen.getByTestId("left")).toHaveTextContent("1,500 kr")
  })
})

describe("Budget", () => {
  it("changes a category's budget", async () => {
    render(<App />)
    await go("Budget")
    const field = await screen.findByLabelText("Groceries budget")
    await userEvent.clear(field)
    await userEvent.type(field, "2500")
    await waitFor(() => expect(values().categories).toEqual([{ name: "Groceries", budget: 2500 }, { name: "Eating out", budget: 500 }]))
    expect(await screen.findByText("3,000 kr a month")).toBeInTheDocument()
  })

  it("adds and removes a category", async () => {
    render(<App />)
    await go("Budget")
    await userEvent.type(await screen.findByLabelText("New category"), "Gifts")
    await userEvent.type(screen.getByLabelText("New category budget"), "400")
    await userEvent.click(screen.getByRole("button", { name: "Add category" }))
    await waitFor(() => expect(values().categories.map((c: { name: string }) => c.name)).toEqual(["Groceries", "Eating out", "Gifts"]))
    await userEvent.click(screen.getByRole("button", { name: "Remove Eating out" }))
    await waitFor(() => expect(values().categories).toEqual([{ name: "Groceries", budget: 1000 }, { name: "Gifts", budget: 400 }]))
  })

  it("renames a category, and its expenses move with it", async () => {
    await amber.store.set("expenses", [{ id: "a", date: today, what: "Shop", category: "Groceries", amount: 412 }])
    render(<App />)
    await go("Budget")
    const field = await screen.findByLabelText("Groceries name")
    await userEvent.clear(field)
    await userEvent.type(field, "Food")
    // Leaving the field saves the new name (so does Return).
    fireEvent.blur(field)
    await waitFor(() => expect(values().categories).toEqual([{ name: "Food", budget: 1000 }, { name: "Eating out", budget: 500 }]))
    await waitFor(() => expect(values().expenses[0].category).toBe("Food"))
  })

  it("removes a category, with Undo", async () => {
    render(<App />)
    await go("Budget")
    await userEvent.click(await screen.findByRole("button", { name: "Remove Groceries" }))
    await waitFor(() => expect(values().categories).toEqual([{ name: "Eating out", budget: 500 }]))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().categories).toEqual(cats))
  })

  it("says how to start when there are no categories", async () => {
    await amber.store.set("categories", [])
    render(<App />)
    await go("Budget")
    expect(await screen.findByText(/^No categories yet\. Add the first one below/)).toBeInTheDocument()
  })

  it("changes the currency shown with amounts", async () => {
    render(<App />)
    await go("Budget")
    const field = await screen.findByLabelText("Shown with amounts")
    await userEvent.clear(field)
    await userEvent.type(field, "€")
    await waitFor(() => expect(values().currency).toBe("€"))
    expect(await screen.findByText("€1,500 a month")).toBeInTheDocument()
  })
})
