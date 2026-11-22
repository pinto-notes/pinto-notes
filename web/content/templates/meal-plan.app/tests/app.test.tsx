import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { addAmounts, AISLES, itemKey, plus, today, weekOf } from "@/lib/meals"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const week = weekOf(today())
/** A day of this week: 0 is Monday, 6 is Sunday; -7 is last Monday. */
const on = (n: number) => plus(week, n)
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
const sheet = (name: string) => screen.findByRole("dialog", { name })
const dinners = () => values().dinners as { id: string; date: string; dish: string; cook?: string; recipe?: string; ingredients: { name: string; qty?: string; aisle?: string }[] }[]
const dish = (name: string) => dinners().find((d) => d.dish === name)!
/** The aisles' headings on the grocery list, in order: "Fruit and veg · 0 of 2". */
const aisleHeadings = () => screen.getAllByRole("heading").map((h) => h.textContent ?? "").filter((t) => / · \d+ of \d+$/.test(t))

const lemonChicken = { id: "d1", date: on(0), dish: "Lemon chicken with rice", cook: "Me", recipe: "Recipes/Lemon chicken", ingredients: [
  { name: "Chicken thighs", qty: "600 g", aisle: "Meat and fish" }, { name: "Lemons", qty: "2", aisle: "Fruit and veg" }, { name: "Rice", aisle: "Dry goods" },
] }
const fishTacos = { id: "d2", date: on(1), dish: "Fish tacos", cook: "Oskar", ingredients: [
  { name: "White fish", qty: "400 g", aisle: "Meat and fish" }, { name: "Limes", qty: "2", aisle: "Fruit and veg" }, { name: "Tortillas", qty: "8", aisle: "Bakery" }, { name: "lemon", qty: "1", aisle: "Fruit and veg" },
] }
const roast = { id: "d0", date: on(-7), dish: "Roast chicken", cook: "Oskar", recipe: "Recipes/Roast chicken", ingredients: [
  { name: "Whole chicken", aisle: "Meat and fish" }, { name: "Potatoes", qty: "1 kg", aisle: "Fruit and veg" },
] }

// Start each test from a known week, whatever data the app holds: two dinners this week.
beforeEach(async () => {
  route("/")
  await amber.store.set("dinners", [lemonChicken, fishTacos])
  await amber.store.set("extras", [])
  await amber.store.set("bought", {})
  await amber.store.set("cooks", ["Me", "Oskar"])
  await amber.store.set("aisles", AISLES)
  await amber.store.set("cupboard", ["Olive oil", "Rice", "Garlic"])
})

describe("The week", () => {
  it("shows the week's dinners, Monday to Sunday, with who cooks and what they need", async () => {
    render(<App />)
    expect(await screen.findByRole("heading", { name: "This week" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Monday: Lemon chicken with rice" })).toHaveTextContent("You cook · 3 things to get")
    expect(screen.getByRole("button", { name: "Tuesday: Fish tacos" })).toHaveTextContent("Oskar cooks · 4 things to get")
    for (const day of ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) expect(screen.getByRole("button", { name: `Add dinner on ${day}` })).toBeInTheDocument()
    // The list the dinners make: Lemons and lemon are one thing, and the rice is in the cupboard.
    await waitFor(() => expect(screen.getByTestId("to-buy")).toHaveTextContent("5"))
  })

  it("opens a new meal plan on this week, empty, and says how to start", async () => {
    await amber.store.set("dinners", [])
    render(<App />)
    expect(await screen.findByRole("heading", { name: "This week" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^Add dinner on / })).toHaveLength(7)
    expect(screen.getByText(/ask your AI to plan the week/)).toBeInTheDocument()
    expect(screen.getByTestId("to-buy")).toHaveTextContent("0")
  })

  it("links a dinner to its recipe note", async () => {
    render(<App />)
    expect(await screen.findByRole("link", { name: "Recipe for Lemon chicken with rice" })).toHaveAttribute("href", "pinto:Recipes/Lemon chicken")
  })

  it("shows what your AI plans while the app is open, cooks it doesn't know included", async () => {
    render(<App />)
    await screen.findByRole("button", { name: "Monday: Lemon chicken with rice" })
    // The person's AI writes the dinners, as its prompt says.
    await amber.store.set("dinners", [lemonChicken, fishTacos, { id: "d3", date: on(3), dish: "Chickpea curry", cook: "Maja", ingredients: [{ name: "Chickpeas", qty: "2 tins", aisle: "Tins and jars" }] }])
    expect(await screen.findByRole("button", { name: "Thursday: Chickpea curry" })).toHaveTextContent("Maja cooks · 1 thing to get")
    await waitFor(() => expect(screen.getByTestId("to-buy")).toHaveTextContent("6"))
    await userEvent.click(screen.getByRole("button", { name: "Thursday: Chickpea curry" }))
    expect(within(await sheet("Edit dinner")).getByRole("radio", { name: "Maja" })).toHaveAttribute("aria-checked", "true")
  })

  it("sets the note's summary line to tonight's dinner and what's left to buy", async () => {
    const summary = vi.fn(async () => ({ ok: true }))
    amber.setSummary = summary
    await amber.store.set("dinners", [{ ...fishTacos, date: today() }])
    render(<App />)
    await waitFor(() => expect(summary).toHaveBeenCalledWith("Tonight: Fish tacos · 4 to buy"))
  })
})

describe("Dinners", () => {
  it("adds a dinner with who cooks and what it needs", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add dinner on Wednesday" }))
    const s = await sheet("Dinner on Wednesday")
    await userEvent.type(within(s).getByLabelText("Dish"), "Chickpea curry")
    await userEvent.click(within(s).getByRole("radio", { name: "Oskar" }))
    await userEvent.type(within(s).getByLabelText("New ingredient"), "Chickpeas")
    await userEvent.type(within(s).getByLabelText("New amount"), "2 tins")
    await userEvent.click(within(s).getByRole("button", { name: "Add ingredient" }))
    await waitFor(() => expect(within(s).getByLabelText("Ingredient 1")).toHaveValue("Chickpeas"))
    // A thing still in the field counts when the dinner is saved.
    await userEvent.type(within(s).getByLabelText("New ingredient"), "Coconut milk")
    await userEvent.click(within(s).getByRole("button", { name: "Add dinner" }))
    await waitFor(() => expect(dish("Chickpea curry")).toEqual({ id: dish("Chickpea curry").id, date: on(2), dish: "Chickpea curry", cook: "Oskar", ingredients: [
      { name: "Chickpeas", qty: "2 tins", aisle: "Other" }, { name: "Coconut milk", aisle: "Other" },
    ] }))
    expect(await screen.findByRole("button", { name: "Wednesday: Chickpea curry" })).toHaveTextContent("Oskar cooks · 2 things to get")
  })

  it("puts a new ingredient in the aisle it went in before", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add dinner on Friday" }))
    const s = await sheet("Dinner on Friday")
    await userEvent.type(within(s).getByLabelText("Dish"), "Lemon pasta")
    await userEvent.type(within(s).getByLabelText("New ingredient"), "Lemons")
    await userEvent.click(within(s).getByRole("button", { name: "Add ingredient" }))
    await waitFor(() => expect(within(s).getByLabelText("Aisle 1")).toHaveValue("Fruit and veg"))
    await userEvent.selectOptions(within(s).getByLabelText("Aisle 1"), "Other")
    await userEvent.selectOptions(within(s).getByLabelText("Aisle 1"), "Fruit and veg")
    await userEvent.click(within(s).getByRole("button", { name: "Add dinner" }))
    await waitFor(() => expect(dish("Lemon pasta").ingredients).toEqual([{ name: "Lemons", aisle: "Fruit and veg" }]))
  })

  it("edits a dinner: its name, who cooks, an amount, a recipe, and an ingredient removed", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tuesday: Fish tacos" }))
    const s = await sheet("Edit dinner")
    const name = within(s).getByLabelText("Dish")
    await waitFor(() => expect(name).toHaveValue("Fish tacos"))
    await userEvent.clear(name)
    await userEvent.type(name, "Fish tacos with slaw")
    await userEvent.click(within(s).getByRole("radio", { name: "Me" }))
    const amount = within(s).getByLabelText("Amount 1")
    await userEvent.clear(amount)
    await userEvent.type(amount, "500 g")
    await userEvent.type(within(s).getByLabelText("Recipe note (optional)"), "Recipes/Fish tacos")
    await userEvent.click(within(s).getByRole("button", { name: "Remove lemon" }))
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(dish("Fish tacos with slaw")).toEqual({ id: "d2", date: on(1), dish: "Fish tacos with slaw", cook: "Me", recipe: "Recipes/Fish tacos", ingredients: [
      { name: "White fish", qty: "500 g", aisle: "Meat and fish" }, { name: "Limes", qty: "2", aisle: "Fruit and veg" }, { name: "Tortillas", qty: "8", aisle: "Bakery" },
    ] }))
    expect(await screen.findByRole("link", { name: "Recipe for Fish tacos with slaw" })).toHaveAttribute("href", "pinto:Recipes/Fish tacos")
  })

  it("leaves who cooks open when you tap the chosen cook again", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tuesday: Fish tacos" }))
    const s = await sheet("Edit dinner")
    await userEvent.click(within(s).getByRole("radio", { name: "Oskar" }))
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(dish("Fish tacos").cook).toBeUndefined())
    expect(await screen.findByRole("button", { name: "Tuesday: Fish tacos" })).toHaveTextContent("4 things to get")
  })

  it("moves a dinner to another day, swapping with the dinner there", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tuesday: Fish tacos" }))
    const s = await sheet("Edit dinner")
    await userEvent.click(within(s).getByRole("radio", { name: "Monday" }))
    expect(await within(s).findByText("Swaps with Lemon chicken with rice, which moves to Tuesday.")).toBeInTheDocument()
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect([dish("Fish tacos").date, dish("Lemon chicken with rice").date]).toEqual([on(0), on(1)]))
    expect(await screen.findByRole("button", { name: "Monday: Fish tacos" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tuesday: Lemon chicken with rice" })).toBeInTheDocument()
  })

  it("puts a new dinner only on a free day", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add dinner on Sunday" }))
    const s = await sheet("Dinner on Sunday")
    expect(within(s).getByRole("radio", { name: "Monday" })).toBeDisabled()
    expect(within(s).getByRole("radio", { name: "Sunday" })).toHaveAttribute("aria-checked", "true")
    await userEvent.click(within(s).getByRole("radio", { name: "Saturday" }))
    await userEvent.type(within(s).getByLabelText("Dish"), "Pizza night")
    await userEvent.click(within(s).getByRole("button", { name: "Add dinner" }))
    await waitFor(() => expect(dish("Pizza night").date).toBe(on(5)))
  })

  it("deletes a dinner, and its groceries with it, with Undo", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Tuesday: Fish tacos" }))
    await userEvent.click(within(await sheet("Edit dinner")).getByRole("button", { name: "Delete dinner" }))
    await waitFor(() => expect(dinners().map((d) => d.dish)).toEqual(["Lemon chicken with rice"]))
    expect(await screen.findByRole("button", { name: "Add dinner on Tuesday" })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId("to-buy")).toHaveTextContent("2"))
    expect(await screen.findByText("Deleted Fish tacos")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(dinners()).toHaveLength(2))
    expect(await screen.findByRole("button", { name: "Tuesday: Fish tacos" })).toBeInTheDocument()
  })

  it("starts a dinner from one you've had before, recipe and ingredients included", async () => {
    await amber.store.set("dinners", [roast, { ...fishTacos, id: "d9", date: on(-6) }, lemonChicken, fishTacos])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Add dinner on Sunday" }))
    const s = await sheet("Dinner on Sunday")
    // Not what's on this week already.
    expect(within(s).queryByRole("button", { name: "Again: Fish tacos" })).toBeNull()
    await userEvent.click(within(s).getByRole("button", { name: "Again: Roast chicken" }))
    await waitFor(() => expect(within(s).getByLabelText("Dish")).toHaveValue("Roast chicken"))
    expect(within(s).getByLabelText("Ingredient 2")).toHaveValue("Potatoes")
    await userEvent.click(within(s).getByRole("button", { name: "Add dinner" }))
    await waitFor(() => expect(dinners().filter((d) => d.dish === "Roast chicken").map(({ id: _id, ...d }) => d)).toEqual([
      { date: on(-7), dish: "Roast chicken", cook: "Oskar", recipe: "Recipes/Roast chicken", ingredients: roast.ingredients },
      { date: on(6), dish: "Roast chicken", cook: "Oskar", recipe: "Recipes/Roast chicken", ingredients: roast.ingredients },
    ]))
  })
})

describe("Weeks", () => {
  it("starts next week fresh, and keeps this week as it was", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Next week" }))
    expect(await screen.findByRole("heading", { name: "Next week" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /^Add dinner on / })).toHaveLength(7)
    expect(screen.getByText(/A new week starts empty/)).toBeInTheDocument()
    expect(screen.getByTestId("to-buy")).toHaveTextContent("0")
    // Next week's dinner goes on next week's day.
    await userEvent.click(screen.getByRole("button", { name: "Add dinner on Monday" }))
    await userEvent.type(within(await sheet("Dinner on Monday")).getByLabelText("Dish"), "Soup")
    await userEvent.click(screen.getByRole("button", { name: "Add dinner" }))
    await waitFor(() => expect(dish("Soup").date).toBe(on(7)))
    await userEvent.click(screen.getByRole("button", { name: "Back to this week" }))
    expect(await screen.findByRole("button", { name: "Monday: Lemon chicken with rice" })).toBeInTheDocument()
  })

  // Planned at the weekend for the week ahead: on Sunday 22 November 2026 the app opened on the
  // week that was ending, and the dinners an AI had just planned for the next one were a tap away.
  it("opens on next week on a Saturday or Sunday once it's planned, and on this week otherwise", async () => {
    // The clock at a given moment (this runner has no fake timers): new Date() and Date.now() only.
    const Real = Date
    const at = (when: string) => {
      const off = new Real(when).getTime() - Real.now()
      globalThis.Date = class extends Real { constructor(...a: []) { if (a.length) super(...a); else super(Real.now() + off) } static now() { return Real.now() + off } } as DateConstructor
    }
    try {
      const soup = { id: "d9", date: "2026-11-23", dish: "Lentil soup", cook: "Oskar", ingredients: [{ name: "Red lentils", qty: "250 g", aisle: "Dry goods" }] }
      const pasta = { ...fishTacos, id: "d8", date: "2026-11-17", dish: "Pasta with pesto" }
      await amber.store.set("dinners", [pasta, soup])
      at("2026-11-22T18:00:00")
      const { unmount } = render(<App />)
      expect(await screen.findByRole("heading", { name: "Next week" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Monday: Lentil soup" })).toBeInTheDocument()
      await go("Groceries")
      expect(await screen.findByRole("button", { name: "Red lentils" })).toHaveTextContent("Red lentils · 250 g")
      await userEvent.click(screen.getByRole("button", { name: "Back to this week" }))
      expect(await screen.findByRole("button", { name: "White fish" })).toBeInTheDocument()
      unmount()
      // Saturday too. A weekday, a weekend with nothing planned ahead, or one with a dinner still to
      // come this week (tonight's), opens on this week.
      for (const [when, dinners, name] of [["2026-11-21T09:00:00", [pasta, soup], "Next week"], ["2026-11-19T18:00:00", [pasta, soup], "This week"], ["2026-11-22T18:00:00", [pasta], "This week"],
        ["2026-11-22T18:00:00", [pasta, { ...pasta, id: "d7", date: "2026-11-22", dish: "Tonight's stew" }, soup], "This week"]] as const) {
        at(when)
        await amber.store.set("dinners", [...dinners])
        route("/")
        const r = render(<App />)
        expect(await screen.findByRole("heading", { name })).toBeInTheDocument()
        r.unmount()
      }
    } finally {
      globalThis.Date = Real
    }
  })

  it("keeps earlier weeks, and opens one from the list or with the arrow", async () => {
    await amber.store.set("dinners", [roast, lemonChicken, fishTacos])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: /^Last week/ }))
    expect(await screen.findByRole("heading", { name: "Last week" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Monday: Roast chicken" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Back to this week" }))
    await userEvent.click(await screen.findByRole("button", { name: "Previous week" }))
    expect(await screen.findByRole("button", { name: "Monday: Roast chicken" })).toBeInTheDocument()
  })

  it("copies an earlier week onto this week's free days, with Undo", async () => {
    const pasta = { id: "d5", date: on(-5), dish: "Pasta with tomato", ingredients: [{ name: "Basil", aisle: "Fruit and veg" }] }
    await amber.store.set("dinners", [roast, pasta, lemonChicken, fishTacos])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Previous week" }))
    await userEvent.click(await screen.findByRole("button", { name: "Copy to this week" }))
    // Monday has a dinner already; Wednesday was free.
    await waitFor(() => expect(dinners().filter((d) => d.date >= on(0)).map((d) => [d.date, d.dish])).toEqual([
      [on(0), "Lemon chicken with rice"], [on(1), "Fish tacos"], [on(2), "Pasta with tomato"],
    ]))
    expect(await screen.findByRole("heading", { name: "This week" })).toBeInTheDocument()
    expect(await screen.findByText("Copied 1 dinner to this week")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(dinners()).toHaveLength(4))
  })
})

describe("Groceries", () => {
  it("builds one list from the dinners: by aisle, merged, less what's in the cupboard", async () => {
    render(<App />)
    await go("Groceries")
    await waitFor(() => expect(aisleHeadings()).toEqual(["Fruit and veg · 0 of 2", "Bakery · 0 of 1", "Meat and fish · 0 of 2"]))
    const lemons = screen.getAllByRole("button", { name: "Lemons" })
    expect(lemons).toHaveLength(1)
    expect(lemons[0]).toHaveTextContent("Lemons · 3")
    expect(lemons[0]).toHaveTextContent("For Lemon chicken with rice, Fish tacos")
    expect(screen.getByRole("button", { name: "Chicken thighs" })).toHaveTextContent("Chicken thighs · 600 g")
    expect(screen.queryByRole("button", { name: "Rice" })).toBeNull()
    expect(screen.getByTestId("left-out")).toHaveTextContent("Left off, already in the cupboard: Rice.")
    expect(screen.getByTestId("bought")).toHaveTextContent("0 of 5 bought")
  })

  it("ticks things off in the shop, for this week", async () => {
    render(<App />)
    await go("Groceries")
    await userEvent.click(await screen.findByRole("button", { name: "Limes" }))
    await waitFor(() => expect(values().bought).toEqual({ [week]: ["lime"] }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Limes" })).toHaveAttribute("aria-pressed", "true"))
    expect(screen.getByTestId("bought")).toHaveTextContent("1 of 5 bought")
    expect(screen.getByRole("heading", { name: "Fruit and veg · 1 of 2" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Limes" }))
    await waitFor(() => expect(values().bought).toEqual({ [week]: [] }))
  })

  it("adds something the dinners don't need, and a thing it already has goes on the same line", async () => {
    render(<App />)
    await go("Groceries")
    await userEvent.type(await screen.findByLabelText("New item"), "Oat milk")
    await userEvent.type(screen.getByLabelText("Amount"), "2 l")
    await userEvent.selectOptions(screen.getByLabelText("Aisle"), "Dairy and eggs")
    await userEvent.click(screen.getByRole("button", { name: "Add item" }))
    await waitFor(() => expect(values().extras.map(({ id: _id, ...x }: { id: string }) => x)).toEqual([{ week, name: "Oat milk", qty: "2 l", aisle: "Dairy and eggs" }]))
    expect(await screen.findByRole("heading", { name: "Dairy and eggs · 0 of 1" })).toBeInTheDocument()
    // The aisle follows where a thing went before.
    await userEvent.type(screen.getByLabelText("New item"), "Lemon")
    await waitFor(() => expect(screen.getByLabelText("Aisle")).toHaveValue("Fruit and veg"))
    await userEvent.click(screen.getByRole("button", { name: "Add item" }))
    await waitFor(() => expect(values().extras).toHaveLength(2))
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Lemons" })).toHaveLength(1))
    expect(screen.getByRole("button", { name: "Lemons" })).toHaveTextContent("Lemons · 3")
  })

  it("renames a thing and moves it to another aisle", async () => {
    render(<App />)
    await go("Groceries")
    await userEvent.click(await screen.findByRole("button", { name: "Edit Tortillas" }))
    const s = await sheet("Edit item")
    const name = within(s).getByLabelText("Item")
    await userEvent.clear(name)
    await userEvent.type(name, "Corn tortillas")
    await userEvent.selectOptions(within(s).getByLabelText("Aisle"), "Dry goods")
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(dish("Fish tacos").ingredients[2]).toEqual({ name: "Corn tortillas", qty: "8", aisle: "Dry goods" }))
    expect(await screen.findByRole("heading", { name: "Dry goods · 0 of 1" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Corn tortillas" })).toBeInTheDocument()
  })

  it("changes the amount of something added by hand", async () => {
    await amber.store.set("extras", [{ id: "x1", week, name: "Oat milk", qty: "1 l", aisle: "Dairy and eggs" }])
    render(<App />)
    await go("Groceries")
    await userEvent.click(await screen.findByRole("button", { name: "Edit Oat milk" }))
    const amount = within(await sheet("Edit item")).getByLabelText("Amount")
    await waitFor(() => expect(amount).toHaveValue("1 l"))
    await userEvent.clear(amount)
    await userEvent.type(amount, "2 l")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().extras).toEqual([{ id: "x1", week, name: "Oat milk", qty: "2 l", aisle: "Dairy and eggs" }]))
    expect(await screen.findByRole("button", { name: "Oat milk" })).toHaveTextContent("Oat milk · 2 l")
  })

  it("takes a thing off the list, with Undo", async () => {
    render(<App />)
    await go("Groceries")
    await userEvent.click(await screen.findByRole("button", { name: "Remove Limes" }))
    await waitFor(() => expect(dish("Fish tacos").ingredients.map((i) => i.name)).toEqual(["White fish", "Tortillas", "lemon"]))
    expect(await screen.findByText("Took Limes off the list")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Limes" })).toBeNull()
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    expect(await screen.findByRole("button", { name: "Limes" })).toBeInTheDocument()
    await waitFor(() => expect(dish("Fish tacos").ingredients).toHaveLength(4))
  })

  it("marks a thing as always in the cupboard, so it's left off, with Undo", async () => {
    render(<App />)
    await go("Groceries")
    await userEvent.click(await screen.findByRole("button", { name: "Edit Tortillas" }))
    await userEvent.click(within(await sheet("Edit item")).getByRole("button", { name: "Always in the cupboard" }))
    await waitFor(() => expect(values().cupboard).toEqual(["Olive oil", "Rice", "Garlic", "Tortillas"]))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Tortillas" })).toBeNull())
    expect(screen.getByTestId("left-out")).toHaveTextContent("Rice, Tortillas")
    expect(await screen.findByText("Tortillas is in the cupboard now: left off every list")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    expect(await screen.findByRole("button", { name: "Tortillas" })).toBeInTheDocument()
  })

  it("gives each week its own list, and keeps this week's ticks", async () => {
    await amber.store.set("bought", { [week]: ["lime"] })
    render(<App />)
    await go("Groceries")
    await userEvent.click(await screen.findByRole("button", { name: "Next week" }))
    expect(await screen.findByText("Nothing on the list yet")).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText("New item"), "Coffee")
    await userEvent.click(screen.getByRole("button", { name: "Add item" }))
    await waitFor(() => expect(values().extras.map((x: { week: string; name: string }) => [x.week, x.name])).toEqual([[on(7), "Coffee"]]))
    expect(await screen.findByRole("button", { name: "Coffee" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Back to this week" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Limes" })).toHaveAttribute("aria-pressed", "true"))
    expect(screen.queryByRole("button", { name: "Coffee" })).toBeNull()
  })

  it("reads a week your AI wrote under another of its days, and unticks it there", async () => {
    // The AI may write any day of the week; the app writes the Monday.
    await amber.store.set("bought", { [on(3)]: ["lime"] })
    await amber.store.set("extras", [{ id: "x1", week: on(2), name: "Coffee", aisle: "Dry goods" }])
    render(<App />)
    await go("Groceries")
    await waitFor(() => expect(screen.getByRole("button", { name: "Limes" })).toHaveAttribute("aria-pressed", "true"))
    expect(screen.getByRole("button", { name: "Coffee" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Limes" }))
    await waitFor(() => expect(values().bought).toEqual({ [on(3)]: [] }))
    await userEvent.click(screen.getByRole("button", { name: "Limes" }))
    await waitFor(() => expect(values().bought).toEqual({ [on(3)]: [], [week]: ["lime"] }))
  })
})

describe("Settings", () => {
  it("takes something out of the cupboard and it's back on the list, and adds one", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Remove Rice" }))
    await waitFor(() => expect(values().cupboard).toEqual(["Olive oil", "Garlic"]))
    await userEvent.type(screen.getByLabelText("New cupboard item"), "Lemons")
    await userEvent.click(screen.getByRole("button", { name: "Add to the cupboard" }))
    await waitFor(() => expect(values().cupboard).toEqual(["Olive oil", "Garlic", "Lemons"]))
    await go("Groceries")
    expect(await screen.findByRole("button", { name: "Rice" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Lemons" })).toBeNull()
    expect(screen.getByTestId("left-out")).toHaveTextContent("Lemons")
  })

  it("brings a removed cupboard thing back with Undo", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Remove Garlic" }))
    await waitFor(() => expect(values().cupboard).toEqual(["Olive oil", "Rice"]))
    expect(await screen.findByText("Removed Garlic")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().cupboard).toEqual(["Olive oil", "Rice", "Garlic"]))
  })

  it("reorders the aisles, and the list follows the shop", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Move Bakery up" }))
    await waitFor(() => expect(values().aisles.slice(0, 2)).toEqual(["Bakery", "Fruit and veg"]))
    await userEvent.click(screen.getByRole("button", { name: "Move Fruit and veg down" }))
    await waitFor(() => expect(values().aisles.slice(0, 3)).toEqual(["Bakery", "Meat and fish", "Fruit and veg"]))
    await go("Groceries")
    await waitFor(() => expect(aisleHeadings()).toEqual(["Bakery · 0 of 1", "Meat and fish · 0 of 2", "Fruit and veg · 0 of 2"]))
  })

  it("renames an aisle, and what's in it moves along", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Rename Fruit and veg" }))
    const name = within(await sheet("Rename Fruit and veg")).getByLabelText("Name")
    await userEvent.clear(name)
    await userEvent.type(name, "Produce")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().aisles[0]).toBe("Produce"))
    await waitFor(() => expect(dish("Fish tacos").ingredients[1].aisle).toBe("Produce"))
    await go("Groceries")
    expect(await screen.findByRole("heading", { name: "Produce · 0 of 2" })).toBeInTheDocument()
  })

  it("removes an aisle: its things go under Other, and Undo brings it back", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Remove Bakery" }))
    await waitFor(() => expect(values().aisles).not.toContain("Bakery"))
    await go("Groceries")
    expect(await screen.findByRole("heading", { name: "Other · 0 of 1" })).toBeInTheDocument()
    expect(await screen.findByText("Removed Bakery. What was in it is under Other.")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().aisles).toEqual(AISLES))
    expect(await screen.findByRole("heading", { name: "Bakery · 0 of 1" })).toBeInTheDocument()
  })

  it("adds an aisle before Other", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.type(await screen.findByLabelText("New aisle"), "Spices")
    await userEvent.click(screen.getByRole("button", { name: "Add an aisle" }))
    await waitFor(() => expect(values().aisles.slice(-2)).toEqual(["Spices", "Other"]))
  })

  it("adds, renames and removes who cooks", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.type(await screen.findByLabelText("New cook"), "Maja")
    await userEvent.click(screen.getByRole("button", { name: "Add a cook" }))
    await waitFor(() => expect(values().cooks).toEqual(["Me", "Oskar", "Maja"]))
    await userEvent.click(screen.getByRole("button", { name: "Rename Oskar" }))
    const name = within(await sheet("Rename Oskar")).getByLabelText("Name")
    await userEvent.clear(name)
    await userEvent.type(name, "Oskar B")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().cooks).toEqual(["Me", "Oskar B", "Maja"]))
    await waitFor(() => expect(dish("Fish tacos").cook).toBe("Oskar B"))
    await userEvent.click(await screen.findByRole("button", { name: "Remove Me" }))
    await waitFor(() => expect(values().cooks).toEqual(["Oskar B", "Maja"]))
    // The new cook is there to pick when you plan a dinner.
    await go("Week")
    await userEvent.click(await screen.findByRole("button", { name: "Add dinner on Friday" }))
    expect(within(await sheet("Dinner on Friday")).getByRole("radio", { name: "Maja" })).toBeInTheDocument()
  })
})

describe("The list's arithmetic", () => {
  it("treats one thing in any case or plural as one", () => {
    expect(itemKey("Lemons")).toBe(itemKey(" lemon "))
    expect(itemKey("Tomatoes")).toBe(itemKey("tomato"))
    expect(itemKey("Berries")).toBe(itemKey("berry"))
    expect(itemKey("Peaches")).toBe(itemKey("peach"))
    expect(itemKey("Glass")).not.toBe(itemKey("Gla"))
  })

  it("adds up amounts that share a unit and keeps the rest side by side", () => {
    expect(addAmounts(["2", "1", undefined])).toBe("3")
    expect(addAmounts(["400 g", "200 g"])).toBe("600 g")
    expect(addAmounts(["1,5 kg", "0.5 kg"])).toBe("2 kg")
    expect(addAmounts(["1 bunch", "a handful"])).toBe("1 bunch + a handful")
    expect(addAmounts(["1 bunch", "1 bunch"])).toBe("2 bunches")
    expect(addAmounts(["2 tins", "1 tin"])).toBe("3 tins")
    expect(addAmounts(["1 loaf", "1 loaf"])).toBe("2 loaves")
    expect(addAmounts(["2 tins"])).toBe("2 tins")
    expect(addAmounts([])).toBe("")
  })
})
