import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { addMonths, averages, clean, dayName, entries, longDay, monthName, monthOf, plus, sleepPatterns, tagPatterns, TAGS, today, type Days } from "@/lib/mood"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const days = () => (values().days ?? {}) as Days
const now = today()
/** n days before today. */
const ago = (n: number) => plus(now, -n)
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
const sheet = (name: string) => screen.findByRole("dialog", { name })
const pick = (label: string) => userEvent.click(screen.getByRole("radio", { name: new RegExp(`^${label}`) }))

const base: Days = {
  [ago(1)]: { mood: 4, energy: 4, sleep: 8, tags: ["Exercise"], note: "Swim before work" },
  [ago(2)]: { mood: 2, energy: 2, sleep: 5.5, tags: ["Work stress"], note: "Deadline" },
  [ago(3)]: { mood: 3, energy: 3, sleep: 7 },
}

// Start each test from a known log, whatever data the app holds: three days, the four tags.
beforeEach(async () => {
  route("/")
  await amber.store.set("days", base)
  await amber.store.set("tags", TAGS)
  await amber.store.set("logSleep", true)
  await amber.store.set("sleepGoal", 8)
})

describe("Today", () => {
  it("logs today in a few taps: mood, energy, sleep, a tag and a line", async () => {
    render(<App />)
    await screen.findByRole("heading", { name: "How was today?" })
    const log = screen.getByRole("button", { name: "Log today" })
    expect(log).toBeDisabled()
    await pick("Mood 4")
    await pick("Energy 3")
    // The first step starts from the person's usual night: 8, 5.5 and 7 make 7.
    await userEvent.click(screen.getByRole("button", { name: "More sleep" }))
    await waitFor(() => expect(screen.getByLabelText("Hours slept")).toHaveValue("7"))
    await userEvent.click(screen.getByRole("button", { name: "More sleep" }))
    await userEvent.click(screen.getByRole("button", { name: "Exercise" }))
    await userEvent.type(screen.getByLabelText("A line about the day"), "Walked to work")
    await userEvent.click(log)
    await waitFor(() => expect(days()[now]).toEqual({ mood: 4, energy: 3, sleep: 7.5, tags: ["Exercise"], note: "Walked to work" }))
    const card = await screen.findByTestId("today-card")
    expect(card).toHaveTextContent("Good")
    expect(card).toHaveTextContent("7.5 h")
    expect(card).toHaveTextContent("Walked to work")
  })

  it("opens a new log on today's check-in and says the AI can log it too", async () => {
    await amber.store.set("days", {})
    render(<App />)
    expect(await screen.findByRole("heading", { name: "How was today?" })).toBeInTheDocument()
    expect(screen.getByText(/slept 6 hours, mood 3, energy 2, long day at work/)).toBeInTheDocument()
    expect(screen.getByTestId("week-mood")).toHaveTextContent("–")
    expect(screen.getAllByRole("button", { name: /^Log (Yesterday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/ })).toHaveLength(7)
  })

  it("saves only what was picked: no sleep, no tags, no line", async () => {
    render(<App />)
    await screen.findByRole("heading", { name: "How was today?" })
    await pick("Mood 3")
    await pick("Energy 2")
    await userEvent.click(screen.getByRole("button", { name: "Log today" }))
    await waitFor(() => expect(days()[now]).toEqual({ mood: 3, energy: 2 }))
  })

  it("edits today's check-in", async () => {
    await amber.store.set("days", { ...base, [now]: { mood: 4, energy: 3, sleep: 7 } })
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit" }))
    const s = await sheet("Today")
    await waitFor(() => expect(within(s).getByRole("radio", { name: /^Mood 4/ })).toHaveAttribute("aria-checked", "true"))
    await userEvent.click(within(s).getByRole("radio", { name: /^Mood 2/ }))
    await userEvent.click(within(s).getByRole("button", { name: "Social" }))
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(days()[now]).toEqual({ mood: 2, energy: 3, sleep: 7, tags: ["Social"] }))
    await waitFor(() => expect(screen.getByTestId("today-card")).toHaveTextContent("Low"))
  })

  it("logs a day that was missed, from the week", async () => {
    render(<App />)
    const name = dayName(ago(4))
    await userEvent.click(await screen.findByRole("button", { name: `Log ${name}` }))
    const s = await sheet(longDay(ago(4)))
    await userEvent.click(within(s).getByRole("radio", { name: /^Mood 5/ }))
    await userEvent.click(within(s).getByRole("radio", { name: /^Energy 4/ }))
    await userEvent.type(within(s).getByLabelText("Hours slept"), "9")
    await userEvent.click(within(s).getByRole("button", { name: "Log this day" }))
    await waitFor(() => expect(days()[ago(4)]).toEqual({ mood: 5, energy: 4, sleep: 9 }))
    expect(await screen.findByRole("button", { name: `${name}: mood 5, energy 4` })).toBeInTheDocument()
  })

  it("deletes a day, and Undo brings it back", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Yesterday: mood 4, energy 4" }))
    await userEvent.click(within(await sheet("Yesterday")).getByRole("button", { name: "Delete this day" }))
    await waitFor(() => expect(days()[ago(1)]).toBeUndefined())
    expect(await screen.findByText("Deleted Yesterday")).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Log Yesterday" })).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(days()[ago(1)]).toEqual(base[ago(1)]))
  })

  it("adds a tag of the person's own while logging", async () => {
    render(<App />)
    await screen.findByRole("heading", { name: "How was today?" })
    await userEvent.click(screen.getByRole("button", { name: "Tag" }))
    await userEvent.type(screen.getByLabelText("New tag"), "Meditation")
    await userEvent.click(screen.getByRole("button", { name: "Add tag" }))
    await waitFor(() => expect(values().tags).toEqual([...TAGS, "Meditation"]))
    await waitFor(() => expect(screen.getByRole("button", { name: "Meditation" })).toHaveAttribute("aria-pressed", "true"))
    await pick("Mood 4")
    await pick("Energy 4")
    await userEvent.click(screen.getByRole("button", { name: "Log today" }))
    await waitFor(() => expect(days()[now]).toEqual({ mood: 4, energy: 4, tags: ["Meditation"] }))
  })

  it("shows the last seven days at a glance, coloured by mood", async () => {
    render(<App />)
    const strip = await screen.findByTestId("week-strip")
    await waitFor(() => expect(strip.getAttribute("aria-label")).toContain(`${dayName(ago(1))} mood 4, energy 4; ${dayName(now)} not logged.`))
    expect(strip.querySelectorAll(".bg-mood-4")).toHaveLength(1)
    expect(strip.querySelectorAll(".bg-mood-2")).toHaveLength(1)
  })

  it("shows the last seven days' averages", async () => {
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("week-mood")).toHaveTextContent("3"))
    expect(screen.getByTestId("week-energy")).toHaveTextContent("3")
    expect(screen.getByTestId("week-sleep")).toHaveTextContent("6.8 h")
    expect(screen.getByText(/3 of 7 days logged/)).toBeInTheDocument()
  })

  it("shows the last 30 days as a chart, and opens Trends from it", async () => {
    render(<App />)
    expect(await screen.findByRole("img", { name: "Mood and energy over the last 30 days: mood 3 and energy 3 on average, from 3 days." })).toBeInTheDocument()
    expect(screen.getAllByTestId("mood-dot")).toHaveLength(3)
    await userEvent.click(screen.getByRole("button", { name: "Trends" }))
    expect(await screen.findByRole("heading", { name: "Last 30 days", level: 1 })).toBeInTheDocument()
  })

  it("shows what your AI logs while the app is open", async () => {
    render(<App />)
    await screen.findByRole("heading", { name: "How was today?" })
    // "Slept 6 hours, mood 3, energy 2, long day at work", as the template's prompt says to write it.
    await amber.store.set("days", { ...base, [now]: { mood: 3, energy: 2, sleep: 6, tags: ["Work stress"], note: "Long day at work" } })
    const card = await screen.findByTestId("today-card")
    expect(card).toHaveTextContent("Long day at work")
    expect(card).toHaveTextContent("6 h")
    expect(card).toHaveTextContent("Work stress")
  })

  it("sets the note's summary line to today's check-in, or the week's mood", async () => {
    const summary = vi.fn(async () => ({ ok: true }))
    amber.setSummary = summary
    render(<App />)
    await waitFor(() => expect(summary).toHaveBeenCalledWith("Not logged today · mood 3 this week"))
    await amber.store.set("days", { ...base, [now]: { mood: 3, energy: 2, sleep: 6 } })
    await waitFor(() => expect(summary).toHaveBeenCalledWith("Today: mood 3, energy 2 · slept 6 h"))
  })
})

describe("Month", () => {
  it("colours each day by its mood and shows its energy", async () => {
    await amber.store.set("days", { [now]: { mood: 5, energy: 2, sleep: 8 } })
    render(<App />)
    await go("Month")
    expect(await screen.findByRole("heading", { name: monthName(monthOf(now)) })).toBeInTheDocument()
    const day = await screen.findByRole("button", { name: `${longDay(now)}: mood 5, energy 2, slept 8 h` })
    expect(day).toHaveAttribute("data-mood", "5")
    expect(day).toHaveAttribute("data-energy", "2")
    expect(day.querySelector(".bg-mood-5")).not.toBeNull()
    expect(day.querySelectorAll(".bg-energy")).toHaveLength(2)
    // A day of this month not logged, and the days to come, which can't be tapped.
    const first = monthOf(now)
    if (first !== now) expect(screen.getByRole("button", { name: `${longDay(first)}, not logged` })).toBeInTheDocument()
    const tomorrow = plus(now, 1)
    if (monthOf(tomorrow) === first) expect(screen.getByRole("button", { name: longDay(tomorrow) })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled()
  })

  it("steps back a month, with that month's days and numbers", async () => {
    const prev = addMonths(monthOf(now), -1)
    const log: Days = {}
    ;[[5, 4, 8], [4, 4, 7.5], [3, 3, 7], [2, 2, 5], [1, 2, 6], [4, 3, 7]].forEach(([mood, energy, sleep], i) => { log[plus(prev, i)] = { mood, energy, sleep, note: `Day ${i + 1}` } })
    await amber.store.set("days", log)
    render(<App />)
    await go("Month")
    await userEvent.click(await screen.findByRole("button", { name: "Previous month" }))
    expect(await screen.findByRole("heading", { name: monthName(prev) })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: `${longDay(prev)}: mood 5, energy 4, slept 8 h` })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId("month-days")).toHaveTextContent("6"))
    expect(screen.getByTestId("month-mood")).toHaveTextContent("3.2")
    expect(screen.getByTestId("month-energy")).toHaveTextContent("3")
    expect(screen.getByTestId("month-sleep")).toHaveTextContent("6.8 h")
    // Its best and hardest days, with their lines.
    expect(within(screen.getByRole("heading", { name: "Best days" }).closest("section")!).getAllByRole("button")[0]).toHaveTextContent("Day 1")
    expect(within(screen.getByRole("heading", { name: "Hardest days" }).closest("section")!).getAllByRole("button")[0]).toHaveTextContent("Day 5")
    expect(screen.getByRole("button", { name: "Next month" })).toBeEnabled()
  })

  it("logs or changes a day from the calendar", async () => {
    await amber.store.set("days", { [now]: { mood: 4, energy: 4 } })
    render(<App />)
    await go("Month")
    await userEvent.click(await screen.findByRole("button", { name: `${longDay(now)}: mood 4, energy 4` }))
    const s = await sheet("Today")
    await userEvent.click(within(s).getByRole("radio", { name: /^Mood 1/ }))
    await userEvent.click(within(s).getByRole("button", { name: "Save" }))
    await waitFor(() => expect(days()[now]).toEqual({ mood: 1, energy: 4 }))
    expect(await screen.findByRole("button", { name: `${longDay(now)}: mood 1, energy 4` })).toHaveAttribute("data-mood", "1")
  })
})

describe("Trends", () => {
  // Ten days in the last 30 and ten more 50 to 59 days ago. Exercise on four of the recent ones
  // (mood 4), none of the rest (mood 3); Alcohol on two. Short nights (5 h) bring energy 2.
  const recent: Days = {}
  for (let i = 0; i < 10; i++) recent[ago(i)] = { mood: i < 4 ? 4 : 3, energy: i < 2 ? 2 : 4, sleep: i < 2 ? 5 : 7.5, tags: [...(i < 4 ? ["Exercise"] : []), ...(i === 5 || i === 6 ? ["Alcohol"] : [])] }
  const older: Days = {}
  for (let i = 50; i < 60; i++) older[ago(i)] = { mood: 2, energy: 2, sleep: 6.5 }

  it("shows the last 30 days, then 90", async () => {
    await amber.store.set("days", { ...recent, ...older })
    render(<App />)
    await go("Trends")
    expect(await screen.findByRole("heading", { name: "Last 30 days", level: 1 })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId("range-days")).toHaveTextContent("10"))
    expect(screen.getByTestId("range-mood")).toHaveTextContent("3.4")
    expect(screen.getByTestId("range-energy")).toHaveTextContent("3.6")
    expect(screen.getByTestId("range-sleep")).toHaveTextContent("7 h")
    expect(screen.getAllByTestId("mood-dot")).toHaveLength(10)
    expect(screen.getAllByTestId("energy-dot")).toHaveLength(10)
    expect(screen.getAllByTestId("sleep-bar")).toHaveLength(10)
    await userEvent.click(screen.getByRole("radio", { name: "90 days" }))
    expect(await screen.findByRole("heading", { name: "Last 90 days" })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId("range-days")).toHaveTextContent("20"))
    expect(screen.getByTestId("range-mood")).toHaveTextContent("2.7")
    expect(screen.getAllByTestId("mood-dot")).toHaveLength(20)
    expect(screen.getByRole("img", { name: /Mood and energy over the last 90 days: mood 2.7 and energy 2.8 on average, from 20 days/ })).toBeInTheDocument()
  })

  it("compares mood on days with and without each tag, with the days each rests on", async () => {
    await amber.store.set("days", recent)
    render(<App />)
    await go("Trends")
    const exercise = await screen.findByRole("group", { name: "Exercise" })
    await waitFor(() => expect(exercise).toHaveTextContent("Mood 4 on 4 days with it, 3 on 6 days without"))
    expect(exercise).toHaveTextContent("+1")
    expect(exercise).toHaveTextContent("Energy 3 against 4")
    // Two days isn't enough to say anything.
    expect(screen.getByRole("group", { name: "Alcohol" })).toHaveTextContent("Not enough days yet: 2 days with it, 8 without")
    expect(screen.getByRole("group", { name: "Social" })).toHaveTextContent("Not enough days yet: 0 days with it, 10 without")
  })

  it("shows a tag your AI used that isn't on the list", async () => {
    await amber.store.set("days", { ...recent, [ago(12)]: { mood: 5, energy: 5, tags: ["Travel"] } })
    render(<App />)
    await go("Trends")
    expect(await screen.findByRole("group", { name: "Travel" })).toHaveTextContent("Not enough days yet: 1 day with it, 10 without")
  })

  it("shows energy after short and long nights", async () => {
    await amber.store.set("days", recent)
    render(<App />)
    await go("Trends")
    await waitFor(() => expect(screen.getAllByTestId("sleep-band")).toHaveLength(4))
    const [under6, six, seven, eight] = screen.getAllByTestId("sleep-band")
    expect(under6).toHaveTextContent("Under 6 hours2 energy · 2 days")
    expect(six).toHaveTextContent("No days")
    expect(seven).toHaveTextContent("7 to 8 hours4 energy · 8 days")
    expect(eight).toHaveTextContent("No days")
    expect(screen.getByText("Average energy the day after, over 10 nights with hours logged.")).toBeInTheDocument()
  })

  it("says the patterns are averages, not causes or medical advice", async () => {
    render(<App />)
    await go("Trends")
    expect(await screen.findByTestId("not-advice")).toHaveTextContent("not what causes what, and they aren't medical advice")
  })

  it("draws the sleep you aim for, from Settings", async () => {
    await amber.store.set("sleepGoal", 7)
    render(<App />)
    await go("Trends")
    expect(await screen.findByText(/The dashed line is the 7 h you aim for/)).toBeInTheDocument()
    expect(screen.getByTestId("sleep-goal")).toBeInTheDocument()
  })
})

describe("Settings", () => {
  it("adds a tag, and it's there to pick when you log a day", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.type(await screen.findByLabelText("New tag"), "Meditation")
    await userEvent.click(screen.getByRole("button", { name: "Add a tag" }))
    await waitFor(() => expect(values().tags).toEqual([...TAGS, "Meditation"]))
    await go("Today")
    expect(await screen.findByRole("button", { name: "Meditation" })).toHaveAttribute("aria-pressed", "false")
  })

  it("renames a tag, on the days that have it too", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Rename Exercise" }))
    const name = within(await sheet("Rename Exercise")).getByLabelText("Name")
    await userEvent.clear(name)
    await userEvent.type(name, "Workout")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().tags).toEqual(["Workout", "Alcohol", "Social", "Work stress"]))
    await waitFor(() => expect(days()[ago(1)].tags).toEqual(["Workout"]))
  })

  it("reorders the tags", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Move Social up" }))
    await waitFor(() => expect(values().tags).toEqual(["Exercise", "Social", "Alcohol", "Work stress"]))
    await userEvent.click(screen.getByRole("button", { name: "Move Exercise down" }))
    await waitFor(() => expect(values().tags).toEqual(["Social", "Exercise", "Alcohol", "Work stress"]))
  })

  it("removes a tag from the list and its days, and Undo brings both back", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Remove Work stress" }))
    await waitFor(() => expect(values().tags).toEqual(["Exercise", "Alcohol", "Social"]))
    await waitFor(() => expect(days()[ago(2)]).toEqual({ mood: 2, energy: 2, sleep: 5.5, note: "Deadline" }))
    expect(await screen.findByText("Removed Work stress from the list and 1 day")).toBeInTheDocument()
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().tags).toEqual(TAGS))
    await waitFor(() => expect(days()[ago(2)].tags).toEqual(["Work stress"]))
  })

  it("turns sleep off, and the check-in stops asking for it", async () => {
    render(<App />)
    await go("Settings")
    const sw = await screen.findByRole("switch", { name: "Log hours slept" })
    expect(sw).toHaveAttribute("aria-checked", "true")
    await userEvent.click(sw)
    await waitFor(() => expect(values().logSleep).toBe(false))
    expect(await screen.findByText("Sleep is hidden. Hours already logged are kept.")).toBeInTheDocument()
    await go("Today")
    await screen.findByRole("heading", { name: "How was today?" })
    expect(screen.queryByLabelText("Hours slept")).toBeNull()
    expect(screen.queryByTestId("week-sleep")).toBeNull()
    await pick("Mood 4")
    await pick("Energy 4")
    await userEvent.click(screen.getByRole("button", { name: "Log today" }))
    await waitFor(() => expect(days()[now]).toEqual({ mood: 4, energy: 4 }))
    // Hours already logged are kept.
    expect(days()[ago(1)].sleep).toBe(8)
  })

  it("changes the sleep you aim for", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("button", { name: "Aim for less sleep" }))
    await waitFor(() => expect(values().sleepGoal).toBe(7.5))
    await waitFor(() => expect(screen.getByTestId("sleep-goal-value")).toHaveTextContent("7.5 h"))
    await userEvent.click(screen.getByRole("button", { name: "Aim for more sleep" }))
    await userEvent.click(screen.getByRole("button", { name: "Aim for more sleep" }))
    await waitFor(() => expect(values().sleepGoal).toBe(8.5))
  })

  it("says how many days are kept", async () => {
    render(<App />)
    await go("Settings")
    expect(await screen.findByTestId("data-count")).toHaveTextContent("3 days logged, since")
  })
})

describe("Reading what your AI wrote", () => {
  it("reads scores and hours written as text, and leaves out what can't be a day", () => {
    expect(clean({ mood: "3", energy: 2, sleep: "6,5", tags: ["Work stress", ""], note: " Long day " })).toEqual({ mood: 3, energy: 2, sleep: 6.5, tags: ["Work stress"], note: "Long day" })
    expect(clean({ mood: 9, energy: 0 })).toBeNull()
    expect(clean({ mood: 4, energy: 7, sleep: 30 })).toEqual({ mood: 4, energy: 0 })
    expect(clean(null)).toBeNull()
    expect(entries({ "not a date": { mood: 3, energy: 3 }, [ago(1)]: { mood: 3, energy: 3 }, [ago(2)]: { mood: 1, energy: 1 } }).map((e) => e.date)).toEqual([ago(2), ago(1)])
  })

  it("matches a tag whatever its case, and averages only the days that have a score", () => {
    const es = entries({
      [ago(1)]: { mood: 5, energy: 4, tags: ["exercise"] }, [ago(2)]: { mood: 4, energy: 4, tags: ["Exercise"] }, [ago(3)]: { mood: 3, energy: 0, tags: ["EXERCISE"] },
      [ago(4)]: { mood: 2, energy: 2 }, [ago(5)]: { mood: 2, energy: 3 }, [ago(6)]: { mood: 3, energy: 2 },
    })
    const [ex] = tagPatterns(es, ["Exercise"])
    expect(ex.with.days).toBe(3)
    expect(ex.with.mood).toBe(4)
    expect(ex.with.energy).toBe(4)
    expect(ex.without.mood).toBeCloseTo(7 / 3)
    expect(ex.enough).toBe(true)
    expect(averages([]).mood).toBeNull()
    expect(sleepPatterns(entries({ [ago(1)]: { mood: 3, energy: 2, sleep: 6 }, [ago(2)]: { mood: 3, energy: 4, sleep: 8 } })).map((b) => b.days)).toEqual([0, 1, 0, 1])
  })
})
