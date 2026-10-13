import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import App from "@/App"
import { dayKey, shown, streak, type Day, type Habit } from "@/lib/habits"

// Each test starts from the app's data as it is (the template's habits, or the person's), so it
// adds what it needs and checks only what it changed.
const habits = () => (amber.data.collections.habits ?? []) as Habit[]
const days = () => (amber.data.collections.days ?? []) as Day[]
const today = () => days().find((d) => d.date === dayKey(new Date()))

// The sidebar and the tab bar both link each screen: either goes there.
const go = (name: string) => userEvent.click(screen.getAllByRole("link", { name })[0])

async function addHabit(name: string) {
  await go("Habits")
  await userEvent.type(await screen.findByLabelText("New habit"), name)
  await userEvent.click(screen.getByRole("button", { name: "Add" }))
  await screen.findByText(name)
  await waitFor(() => expect(habits().some((h) => h.name === name)).toBe(true))
  return habits().find((h) => h.name === name)!.id
}

describe("Habits", () => {
  const shownNames = () => shown(habits()).map((h) => h.name)

  it("adds a habit, removes it, and brings it back with Undo", async () => {
    render(<App />)
    await addHabit("Stretch")
    await userEvent.click(screen.getByRole("button", { name: "Remove Stretch" }))
    await waitFor(() => expect(shownNames()).not.toContain("Stretch"))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(shownNames()).toContain("Stretch"))
    expect(screen.queryByText("Removed Stretch")).not.toBeInTheDocument()
  })

  it("renames a habit", async () => {
    render(<App />)
    await addHabit("Stretch")
    await userEvent.click(screen.getByRole("button", { name: "Rename Stretch" }))
    const field = screen.getByLabelText("Name")
    await userEvent.clear(field)
    await userEvent.type(field, "Stretch 10 minutes")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Stretch 10 minutes")).toBeInTheDocument()
    await waitFor(() => expect(shownNames()).toContain("Stretch 10 minutes"))
  })

  it("moves a habit up and down", async () => {
    render(<App />)
    await addHabit("Stretch")
    const before = shownNames()
    expect(before.at(-1)).toBe("Stretch")
    await userEvent.click(screen.getByRole("button", { name: "Move Stretch up" }))
    await waitFor(() => expect(shownNames().at(-2)).toBe("Stretch"))
    await userEvent.click(screen.getByRole("button", { name: "Move Stretch down" }))
    await waitFor(() => expect(shownNames()).toEqual(before))
  })
})

describe("Today", () => {
  it("ticks a habit for today and saves the day, then unticks it", async () => {
    render(<App />)
    const id = await addHabit("Stretch")
    await go("Today")
    const box = () => screen.getByRole("checkbox", { name: "Stretch" })
    await waitFor(() => expect(box()).toHaveAttribute("aria-checked", "false"))
    await userEvent.click(box())
    await waitFor(() => expect(box()).toHaveAttribute("aria-checked", "true"))
    await waitFor(() => expect(today()?.done).toContain(id))
    await userEvent.click(box())
    await waitFor(() => expect(today()?.done).not.toContain(id))
  })
})

describe("streak", () => {
  const log: Day[] = [
    { id: "a", date: "2026-10-10", done: ["walk"] },
    { id: "b", date: "2026-10-11", done: ["walk", "read"] },
    { id: "c", date: "2026-10-12", done: ["walk"] },
  ]
  it("counts days in a row back from today, or from yesterday while today is open", () => {
    expect(streak(log, "walk", new Date(2026, 9, 12))).toBe(3)
    expect(streak(log, "walk", new Date(2026, 9, 13))).toBe(3)
    expect(streak(log, "read", new Date(2026, 9, 12))).toBe(1)
    expect(streak(log, "read", new Date(2026, 9, 13))).toBe(0)
    expect(streak(log, "walk", new Date(2026, 9, 14))).toBe(0)
  })
})
