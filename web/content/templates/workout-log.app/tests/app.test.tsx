import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { guessUnits } from "@/screens/setup"
import { addDays, dayText, e1rm, iso, parseTime, shortDate, timeText, today, type Session } from "@/lib/workouts"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const day = iso(today())
const ago = (n: number) => iso(addDays(today(), -n))
const squat = { id: "squat", name: "Squat", kind: "weight" }
const lunges = { id: "lunges", name: "Lunges", kind: "weight" }
const bench = { id: "bench-press", name: "Bench press", kind: "weight" }
const pullups = { id: "pull-ups", name: "Pull-ups", kind: "weight" }
const run = { id: "run", name: "Run", kind: "cardio" }
const legs = { id: "legs", name: "Legs", exercises: ["squat", "lunges"] }
const push = { id: "push", name: "Push", exercises: ["bench-press"] }
const easy = { id: "easy-run", name: "Easy run", exercises: ["run"] }
const fives = (kg: number, n = 3) => Array.from({ length: n }, () => ({ reps: 5, kg }))
const session = (id: string, date: string, name: string, items: Session["items"], more: Partial<Session> = {}): Session =>
  ({ id, date, name, items, ...(name === "Legs" ? { workout: "legs" } : name === "Push" ? { workout: "push" } : {}), ...more })
const sessionsNow = (): Session[] => values().sessions ?? []

// Start each test from a log that was set up long ago, with a small plan and nothing logged,
// whatever data the app holds (a new log opens on Set up your training: see "First use").
beforeEach(async () => {
  route("/")
  await amber.store.set("exercises", [squat, lunges, bench, pullups, run])
  await amber.store.set("plan", [legs, push, easy])
  await amber.store.set("sessions", [])
  await amber.store.set("units", "kg")
  await amber.store.set("goal", 3)
  await amber.store.set("started", "2026-01-05")
})
// The sidebar (Mac) and the tab bar (iPhone) both have the screens' links; either one goes there.
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement
const retype = async (name: string, text: string) => { const el = field(name); await userEvent.clear(el); await userEvent.type(el, text) }

describe("Today", () => {
  it("shows what's next in the plan with last time's sets, and logs it from there", async () => {
    await amber.store.set("sessions", [
      session("s1", ago(5), "Legs", [{ exercise: "squat", sets: fives(95) }]),
      session("s2", ago(3), "Push", [{ exercise: "bench-press", sets: fives(60) }]),
    ])
    await amber.store.set("plan", [legs, push])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("next-name")).toHaveTextContent("Legs"))
    expect(screen.getByText("Last: 95 kg × 5")).toBeInTheDocument()
    expect(screen.getByText("First time")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Start Legs" }))
    expect(await screen.findByRole("heading", { name: "Log session" })).toBeInTheDocument()
    expect(field("Squat set 1 weight")).toHaveValue("95")
    expect(field("Squat set 3 reps")).toHaveValue("5")
    await retype("Squat set 3 weight", "100")
    await userEvent.click(screen.getByRole("button", { name: "Log session" }))
    await waitFor(() => expect(sessionsNow()).toHaveLength(3))
    const s = sessionsNow()[2]
    // Lunges had nothing typed: an exercise with no sets isn't saved.
    expect({ ...s, id: undefined }).toEqual({ date: day, name: "Legs", workout: "legs", items: [{ exercise: "squat", sets: [{ reps: 5, kg: 95 }, { reps: 5, kg: 95 }, { reps: 5, kg: 100 }] }] })
    expect(await screen.findByText("Logged Legs. New best: Squat.")).toBeInTheDocument()
  })

  it("goes round the plan: after Legs comes Push, and you can pick another", async () => {
    await amber.store.set("sessions", [session("s1", ago(1), "Legs", [{ exercise: "squat", sets: fives(100) }])])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("next-name")).toHaveTextContent("Push"))
    expect(screen.getByText("Next in your plan")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("radio", { name: "Easy run" }))
    await waitFor(() => expect(screen.getByTestId("next-name")).toHaveTextContent("Easy run"))
    expect(screen.getByRole("button", { name: "Start Easy run" })).toBeInTheDocument()
  })

  it("after the last workout of the plan, starts again from the first", async () => {
    await amber.store.set("sessions", [session("s1", ago(2), "Easy run", [{ exercise: "run", sets: [{ km: 5, min: 30 }] }], { workout: "easy-run" })])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("next-name")).toHaveTextContent("Legs"))
  })

  it("counts this week's sessions against the weekly goal, which you set under Plan", async () => {
    await amber.store.set("sessions", [session("s1", day, "Legs", [{ exercise: "squat", sets: fives(100) }])])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("week-count")).toHaveTextContent("1 of 3 sessions"))
    expect(screen.getByTestId("week-left")).toHaveTextContent("2 to go")
    expect(screen.getByRole("img", { name: "This week 1 of 3" })).toBeInTheDocument()
    await go("Plan")
    await userEvent.click(await screen.findByRole("button", { name: "Fewer sessions a week" }))
    await userEvent.click(screen.getByRole("button", { name: "Fewer sessions a week" }))
    await waitFor(() => expect(values().goal).toBe(1))
    await go("Today")
    await waitFor(() => expect(screen.getByTestId("week-left")).toHaveTextContent("Goal met"))
  })

  it("says what was done today, and what's next time", async () => {
    await amber.store.set("sessions", [session("s1", day, "Legs", [{ exercise: "squat", sets: fives(100) }])])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("done-today")).toHaveTextContent("Done today: Legs"))
    expect(screen.getByRole("heading", { name: "Next time" })).toBeInTheDocument()
    expect(screen.getByTestId("next-name")).toHaveTextContent("Push")
  })

  it("invites you to make a plan when there is none", async () => {
    await amber.store.set("plan", [])
    render(<App />)
    expect(await screen.findByText("No plan yet")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Make a plan" }))
    expect(await screen.findByRole("heading", { name: "Plan" })).toBeInTheDocument()
  })
})

describe("Logging a session", () => {
  it("logs a session by hand: an exercise, its sets, how hard it was and a note", async () => {
    render(<App />)
    await go("Sessions")
    await userEvent.click(await screen.findByRole("button", { name: "Log" }))
    await retype("Workout", "Upper")
    await userEvent.selectOptions(screen.getByLabelText("Add exercise"), "Bench press")
    await userEvent.type(field("Bench press set 1 reps"), "8")
    await userEvent.type(field("Bench press set 1 weight"), "60")
    // A new set starts as a copy of the one before it.
    await userEvent.click(screen.getByRole("button", { name: "Add a set to Bench press" }))
    expect(field("Bench press set 2 weight")).toHaveValue("60")
    await retype("Bench press set 2 reps", "6")
    await userEvent.selectOptions(screen.getByLabelText("How hard (1 to 10)"), "7")
    await userEvent.type(field("Note"), "Felt strong")
    await userEvent.click(screen.getByRole("button", { name: "Log session" }))
    await waitFor(() => expect(sessionsNow()).toHaveLength(1))
    expect({ ...sessionsNow()[0], id: undefined }).toEqual({ date: day, name: "Upper", effort: 7, note: "Felt strong", items: [{ exercise: "bench-press", sets: [{ reps: 8, kg: 60 }, { reps: 6, kg: 60 }] }] })
    expect(await screen.findByText("Bench press 2 sets, best 60 kg × 8")).toBeInTheDocument()
    expect(screen.getByText("Effort 7")).toBeInTheDocument()
  })

  it("logs a run with its distance and time", async () => {
    render(<App />)
    await go("Sessions")
    await userEvent.click(await screen.findByRole("button", { name: "Log" }))
    await retype("Workout", "Run")
    await userEvent.selectOptions(screen.getByLabelText("Add exercise"), "Run")
    await userEvent.type(field("Run set 1 distance"), "5")
    await userEvent.type(field("Run set 1 time"), "29:30")
    await userEvent.click(screen.getByRole("button", { name: "Log session" }))
    await waitFor(() => expect(sessionsNow()[0]?.items).toEqual([{ exercise: "run", sets: [{ km: 5, min: 29.5 }] }]))
    expect(await screen.findByText("Run 5 km in 29:30")).toBeInTheDocument()
  })

  it("makes a new exercise from the session, and keeps it for next time", async () => {
    render(<App />)
    await go("Sessions")
    await userEvent.click(await screen.findByRole("button", { name: "Log" }))
    await userEvent.selectOptions(screen.getByLabelText("Add exercise"), "new")
    await userEvent.type(await screen.findByLabelText("New exercise"), "Hip thrust")
    await userEvent.click(screen.getByRole("button", { name: "Add Hip thrust" }))
    await userEvent.type(await screen.findByLabelText("Hip thrust set 1 reps"), "10")
    await userEvent.type(field("Hip thrust set 1 weight"), "80")
    await userEvent.click(screen.getByRole("button", { name: "Log session" }))
    await waitFor(() => expect(values().exercises.at(-1)).toEqual({ id: "hip-thrust", name: "Hip thrust", kind: "weight" }))
    await waitFor(() => expect(sessionsNow()[0]?.items).toEqual([{ exercise: "hip-thrust", sets: [{ reps: 10, kg: 80 }] }]))
  })

  it("moves an exercise up, takes one out and removes a set", async () => {
    render(<App />)
    await go("Sessions")
    await userEvent.click(await screen.findByRole("button", { name: "Log" }))
    await userEvent.selectOptions(screen.getByLabelText("Add exercise"), "Squat")
    await userEvent.selectOptions(screen.getByLabelText("Add exercise"), "Pull-ups")
    await userEvent.selectOptions(screen.getByLabelText("Add exercise"), "Bench press")
    await userEvent.click(screen.getByRole("button", { name: "Move Bench press up" }))
    await userEvent.click(screen.getByRole("button", { name: "Take Squat out" }))
    await userEvent.type(field("Bench press set 1 reps"), "5")
    await userEvent.type(field("Bench press set 1 weight"), "70")
    await userEvent.click(screen.getByRole("button", { name: "Add a set to Bench press" }))
    await userEvent.click(screen.getByRole("button", { name: "Remove set 2 of Bench press" }))
    // Pull-ups with reps and no weight: a bodyweight set.
    await userEvent.type(field("Pull-ups set 1 reps"), "8")
    await userEvent.click(screen.getByRole("button", { name: "Log session" }))
    await waitFor(() => expect(sessionsNow()[0]?.items).toEqual([
      { exercise: "bench-press", sets: [{ reps: 5, kg: 70 }] },
      { exercise: "pull-ups", sets: [{ reps: 8 }] },
    ]))
  })

  it("changes a session: its name and a weight", async () => {
    await amber.store.set("sessions", [session("s1", ago(2), "Legs", [{ exercise: "squat", sets: fives(100, 1) }])])
    render(<App />)
    await go("Sessions")
    await userEvent.click(await screen.findByRole("button", { name: `Legs, ${dayText(ago(2))}` }))
    expect(await screen.findByRole("heading", { name: "Edit session" })).toBeInTheDocument()
    await retype("Workout", "Leg day")
    await retype("Squat set 1 weight", "102.5")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(sessionsNow()).toEqual([{ id: "s1", date: ago(2), name: "Leg day", workout: "legs", items: [{ exercise: "squat", sets: [{ reps: 5, kg: 102.5 }] }] }]))
    expect(await screen.findByText("Squat 102.5 kg × 5")).toBeInTheDocument()
  })

  it("deletes a session, and Undo brings it back", async () => {
    const s1 = session("s1", ago(2), "Legs", [{ exercise: "squat", sets: fives(100) }])
    await amber.store.set("sessions", [s1])
    route("/log")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: `Legs, ${dayText(ago(2))}` }))
    await userEvent.click(await screen.findByRole("button", { name: "Delete session" }))
    await waitFor(() => expect(sessionsNow()).toEqual([]))
    expect(await screen.findByText("Deleted Legs")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(sessionsNow()).toEqual([s1]))
    expect(await screen.findByText("Squat 3 × 5 at 100 kg")).toBeInTheDocument()
  })

  it("Undo after logging takes the session back out", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Start Legs" }))
    await userEvent.type(field("Squat set 1 reps"), "5")
    await userEvent.type(field("Squat set 1 weight"), "80")
    await userEvent.click(screen.getByRole("button", { name: "Log session" }))
    await waitFor(() => expect(sessionsNow()).toHaveLength(1))
    expect(await screen.findByText("Logged Legs.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(sessionsNow()).toEqual([]))
  })
})

describe("Personal bests", () => {
  it("shows each exercise's best with its date, and marks the session that beat the one before", async () => {
    await amber.store.set("sessions", [
      session("s1", ago(10), "Legs", [{ exercise: "squat", sets: fives(100) }]),
      session("s2", ago(6), "Legs", [{ exercise: "squat", sets: fives(105) }]),
      session("s3", ago(2), "Legs", [{ exercise: "squat", sets: [{ reps: 3, kg: 100 }] }]),
    ])
    route("/log")
    render(<App />)
    const row = (n: number) => screen.findByRole("button", { name: `Legs, ${dayText(ago(n))}` })
    expect(within(await row(6)).getByTestId("new-best")).toBeInTheDocument()
    // The first time sets the best but beats nothing; a lighter session isn't one.
    expect(within(await row(10)).queryByTestId("new-best")).toBeNull()
    expect(within(await row(2)).queryByTestId("new-best")).toBeNull()
    await go("Progress")
    await waitFor(() => expect(screen.getByTestId("best-squat-e1rm")).toHaveTextContent(`105 kg × 5 ${shortDate(ago(6))}`))
  })

  it("updates the best when a session beats it, and says so", async () => {
    await amber.store.set("sessions", [session("s1", ago(4), "Legs", [{ exercise: "squat", sets: fives(100) }])])
    render(<App />)
    // Push is next after Legs; Legs is one tap away.
    await userEvent.click(await screen.findByRole("radio", { name: "Legs" }))
    await userEvent.click(await screen.findByRole("button", { name: "Start Legs" }))
    await retype("Squat set 1 weight", "107.5")
    await userEvent.click(screen.getByRole("button", { name: "Log session" }))
    expect(await screen.findByText("Logged Legs. New best: Squat.")).toBeInTheDocument()
    expect(await screen.findByText("Latest bests")).toBeInTheDocument()
    await go("Progress")
    await waitFor(() => expect(screen.getByTestId("best-squat-e1rm")).toHaveTextContent(`107.5 kg × 5 ${shortDate(day)}`))
  })

  it("weighs a heavy single against more reps by the estimated one-rep max", async () => {
    expect(Math.round(e1rm({ reps: 5, kg: 100 }))).toBe(117)
    expect(e1rm({ reps: 1, kg: 110 })).toBe(110)
    await amber.store.set("sessions", [
      session("s1", ago(6), "Legs", [{ exercise: "squat", sets: fives(100) }]),
      session("s2", ago(4), "Legs", [{ exercise: "squat", sets: [{ reps: 1, kg: 110 }] }]),
      session("s3", ago(2), "Legs", [{ exercise: "squat", sets: [{ reps: 3, kg: 112.5 }] }]),
    ])
    route("/log")
    render(<App />)
    expect(within(await screen.findByRole("button", { name: `Legs, ${dayText(ago(4))}` })).queryByTestId("new-best")).toBeNull()
    expect(within(screen.getByRole("button", { name: `Legs, ${dayText(ago(2))}` })).getByTestId("new-best")).toBeInTheDocument()
    await go("Progress")
    await waitFor(() => expect(screen.getByTestId("best-squat-e1rm")).toHaveTextContent("112.5 kg × 3"))
  })

  it("keeps a run's longest distance and its fastest pace", async () => {
    await amber.store.set("sessions", [
      session("r1", ago(5), "Easy run", [{ exercise: "run", sets: [{ km: 5, min: 30 }] }]),
      session("r2", ago(3), "Long run", [{ exercise: "run", sets: [{ km: 8, min: 50 }] }]),
      session("r3", ago(1), "Fast run", [{ exercise: "run", sets: [{ km: 5, min: 27 }] }]),
    ])
    route("/progress")
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("best-run-distance")).toHaveTextContent(`8 km ${shortDate(ago(3))}`))
    expect(screen.getByTestId("best-run-pace")).toHaveTextContent(`5:24 /km ${shortDate(ago(1))}`)
  })

  it("counts a bodyweight exercise's best in reps", async () => {
    await amber.store.set("sessions", [
      session("p1", ago(5), "Pull", [{ exercise: "pull-ups", sets: [{ reps: 8 }, { reps: 6 }] }]),
      session("p2", ago(2), "Pull", [{ exercise: "pull-ups", sets: [{ reps: 10 }] }]),
    ])
    route("/progress")
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("best-pull-ups-reps")).toHaveTextContent(`10 reps ${shortDate(ago(2))}`))
  })

  it("shows a session your AI logged, and whether it was a best", async () => {
    // "Did 3x5 squats at 100 kg and a 5 km run": what the person's AI writes, as docs/README.md says.
    await amber.store.set("sessions", [
      session("s1", ago(7), "Legs", [{ exercise: "squat", sets: fives(95) }]),
      { id: "s2", date: day, name: "Legs", workout: "legs", items: [{ exercise: "squat", sets: fives(100) }, { exercise: "run", sets: [{ km: 5 }] }] },
    ])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("done-today")).toHaveTextContent("Done today: Legs"))
    expect(within(screen.getByRole("button", { name: `Legs, ${dayText(day)}` })).getByTestId("new-best")).toBeInTheDocument()
    expect(screen.getByText("Squat 3 × 5 at 100 kg · Run 5 km")).toBeInTheDocument()
    expect(screen.getByText("Latest bests")).toBeInTheDocument()
  })
})

describe("Progress", () => {
  beforeEach(async () => {
    await amber.store.set("sessions", [
      session("s1", ago(7), "Legs", [{ exercise: "squat", sets: fives(100) }]),
      session("s2", ago(3), "Legs", [{ exercise: "squat", sets: fives(120) }]),
      session("r1", ago(5), "Easy run", [{ exercise: "run", sets: [{ km: 5, min: 30 }] }]),
    ])
    route("/progress")
  })

  it("draws an exercise's estimated 1RM per session, and its heaviest set", async () => {
    render(<App />)
    expect(await screen.findByRole("img", { name: `Est. 1RM per session: ${shortDate(ago(7))} 117 kg, ${shortDate(ago(3))} 140 kg` })).toBeInTheDocument()
    expect(screen.getByTestId("progress-line")).toHaveTextContent(`Best 140 kg · up 23 kg since ${shortDate(ago(7))}`)
    await userEvent.click(screen.getByRole("radio", { name: "Heaviest" }))
    expect(await screen.findByRole("img", { name: `Heaviest per session: ${shortDate(ago(7))} 100 kg, ${shortDate(ago(3))} 120 kg` })).toBeInTheDocument()
  })

  it("shows another exercise from its best, with distance and pace for a run", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: /^Run:/ }))
    expect(await screen.findByRole("img", { name: `Distance per session: ${shortDate(ago(5))} 5 km` })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("radio", { name: "Pace" }))
    expect(await screen.findByRole("img", { name: `Pace per session: ${shortDate(ago(5))} 6:00 /km` })).toBeInTheDocument()
  })

  it("chooses the exercise from the menu too", async () => {
    render(<App />)
    await userEvent.selectOptions(await screen.findByLabelText("Exercise"), "Run")
    expect(await screen.findByRole("img", { name: /^Distance per session/ })).toBeInTheDocument()
  })
})

describe("Plan", () => {
  it("adds, renames, reorders and removes workouts, with Undo", async () => {
    route("/plan")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "New workout" }))
    await userEvent.type(await screen.findByLabelText("Name"), "Upper")
    await userEvent.click(screen.getByRole("checkbox", { name: "Bench press" }))
    await userEvent.click(screen.getByRole("checkbox", { name: "Pull-ups" }))
    await userEvent.click(screen.getByRole("button", { name: "Add workout" }))
    await waitFor(() => expect(values().plan.at(-1)).toEqual({ id: "upper", name: "Upper", exercises: ["bench-press", "pull-ups"] }))

    await userEvent.click(await screen.findByRole("button", { name: "Edit Legs" }))
    await retype("Name", "Lower")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().plan[0]).toEqual({ id: "legs", name: "Lower", exercises: ["squat", "lunges"] }))

    await userEvent.click(await screen.findByRole("button", { name: "Move Upper up" }))
    await waitFor(() => expect(values().plan.map((w: { id: string }) => w.id)).toEqual(["legs", "push", "upper", "easy-run"]))
    await userEvent.click(screen.getByRole("button", { name: "Remove Push" }))
    await waitFor(() => expect(values().plan.map((w: { id: string }) => w.id)).toEqual(["legs", "upper", "easy-run"]))
    expect(await screen.findByText("Removed Push")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().plan.map((w: { id: string }) => w.id)).toEqual(["legs", "push", "upper", "easy-run"]))
  })

  it("adds, renames, reorders and removes exercises; a renamed one keeps its sessions and bests", async () => {
    await amber.store.set("sessions", [session("s1", ago(2), "Legs", [{ exercise: "squat", sets: fives(100) }])])
    route("/plan")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "New exercise" }))
    await userEvent.type(await screen.findByLabelText("Name"), "Rowing machine")
    await userEvent.click(screen.getByRole("radio", { name: "Cardio" }))
    await userEvent.click(screen.getByRole("button", { name: "Add exercise" }))
    await waitFor(() => expect(values().exercises.at(-1)).toEqual({ id: "rowing-machine", name: "Rowing machine", kind: "cardio" }))

    await userEvent.click(await screen.findByRole("button", { name: "Edit Squat" }))
    await retype("Name", "Back squat")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().exercises[0]).toEqual({ id: "squat", name: "Back squat", kind: "weight" }))

    await userEvent.click(await screen.findByRole("button", { name: "Move Lunges up" }))
    await waitFor(() => expect(values().exercises.slice(0, 2).map((e: { id: string }) => e.id)).toEqual(["lunges", "squat"]))

    await userEvent.click(screen.getByRole("button", { name: "Remove Bench press" }))
    await waitFor(() => expect(values().exercises.some((e: { id: string }) => e.id === "bench-press")).toBe(false))
    expect(values().plan.find((w: { id: string }) => w.id === "push").exercises).toEqual([])
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().plan.find((w: { id: string }) => w.id === "push").exercises).toEqual(["bench-press"]))
    expect(values().exercises.some((e: { id: string }) => e.id === "bench-press")).toBe(true)

    await go("Progress")
    await waitFor(() => expect(screen.getByTestId("best-squat-e1rm")).toHaveTextContent("100 kg × 5"))
    expect(screen.getByRole("button", { name: /^Back squat:/ })).toBeInTheDocument()
  })

  it("switches to pounds: shows and takes lb, and saves kilograms", async () => {
    await amber.store.set("sessions", [session("s1", ago(2), "Legs", [{ exercise: "squat", sets: fives(100) }])])
    route("/plan")
    render(<App />)
    await userEvent.click(await screen.findByRole("radio", { name: "lb" }))
    await waitFor(() => expect(values().units).toBe("lb"))
    await go("Sessions")
    expect(await screen.findByText("Squat 3 × 5 at 220.5 lb")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Log" }))
    await userEvent.selectOptions(screen.getByLabelText("Add exercise"), "Squat")
    await userEvent.type(field("Squat set 1 reps"), "5")
    await userEvent.type(field("Squat set 1 weight"), "225")
    await userEvent.click(screen.getByRole("button", { name: "Log session" }))
    await waitFor(() => expect(sessionsNow().at(-1)?.items).toEqual([{ exercise: "squat", sets: [{ reps: 5, kg: 102.06 }] }]))
    expect(await screen.findByText("Squat 225 lb × 5")).toBeInTheDocument()
  })

  it("shows runs in miles once the units are lb", async () => {
    await amber.store.set("units", "lb")
    await amber.store.set("sessions", [session("r1", ago(1), "Easy run", [{ exercise: "run", sets: [{ km: 8.05, min: 48 }] }])])
    route("/log")
    render(<App />)
    expect(await screen.findByText("Run 5 mi in 48:00")).toBeInTheDocument()
  })
})

describe("First use", () => {
  const fresh = async () => {
    await amber.store.set("started", null)
    await amber.store.set("sessions", [])
    await amber.store.set("units", null)
    await amber.store.set("plan", [legs, push, { ...easy, pick: false }])
  }

  it("opens on Set up your training, with no other screens", async () => {
    await fresh()
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Set up your training" })).toBeInTheDocument()
    expect(screen.queryAllByRole("link", { name: "Progress" })).toHaveLength(0)
    expect(screen.getByTestId("ai-hint")).toHaveTextContent("Pick here, or tell your AI and it sets this up.")
    expect(screen.getByRole("checkbox", { name: "Do Legs" })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: "Do Easy run" })).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Start with 2 workouts" })).toBeInTheDocument()
  })

  it("starts with the workouts you keep, one renamed, your sessions a week and your units", async () => {
    await fresh()
    render(<App />)
    await userEvent.click(await screen.findByRole("checkbox", { name: "Do Easy run" }))
    await retype("Name of Push", "Chest")
    await userEvent.click(screen.getByRole("button", { name: "More sessions a week" }))
    await userEvent.click(screen.getByRole("radio", { name: "lb" }))
    await userEvent.click(screen.getByRole("button", { name: "Start with 3 workouts" }))
    await waitFor(() => expect(values().started).toBe(day))
    expect(values().plan).toEqual([legs, { ...push, name: "Chest" }, easy])
    expect(values().goal).toBe(4)
    expect(values().units).toBe("lb")
    await waitFor(() => expect(screen.getByTestId("next-name")).toHaveTextContent("Legs"))
    expect(screen.getByTestId("week-count")).toHaveTextContent("0 of 4 sessions")
  })

  it("can't start with nothing picked", async () => {
    await fresh()
    render(<App />)
    await userEvent.click(await screen.findByRole("checkbox", { name: "Do Legs" }))
    await userEvent.click(screen.getByRole("checkbox", { name: "Do Push" }))
    expect(await screen.findByRole("button", { name: "Pick a workout to start" })).toBeDisabled()
  })

  it("leaves the first screen by itself when your AI sets it up, and keeps what you picked within reach", async () => {
    await fresh()
    render(<App />)
    await userEvent.click(await screen.findByRole("checkbox", { name: "Do Push" }))
    // The person's AI writes the plan and the day the log starts, as its prompt says.
    await amber.store.set("plan", [easy])
    await amber.store.set("started", day)
    expect(await screen.findByRole("button", { name: "Start Easy run" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Set up your training" })).toBeNull()
    expect(await screen.findByText("Your AI set up your training. What you picked here wasn't used.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Use mine" }))
    await waitFor(() => expect(values().plan).toEqual([legs]))
  })

  it("skips the first screen once a session is logged (a log an AI filled in)", async () => {
    await fresh()
    await amber.store.set("sessions", [session("s1", day, "Legs", [{ exercise: "squat", sets: fives(100) }])])
    render(<App />)
    expect(await screen.findByTestId("done-today")).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Set up your training" })).toBeNull()
  })

  it("guesses pounds in the US and kilograms elsewhere", () => {
    expect(guessUnits("en-US")).toBe("lb")
    expect(guessUnits("sv-SE")).toBe("kg")
    expect(guessUnits("en-GB")).toBe("kg")
  })
})

describe("Data your AI writes", () => {
  it("opens a session with an exercise the list doesn't have, and no effort, note or workout", async () => {
    await amber.store.set("sessions", [{ id: "x1", date: ago(1), name: "Carries", items: [{ exercise: "farmer-carry", sets: [{ reps: 4, kg: 40 }] }] }])
    route("/log")
    render(<App />)
    expect(await screen.findByText("Carries")).toBeInTheDocument()
    expect(screen.getByText("Farmer carry 40 kg × 4")).toBeInTheDocument()
  })

  it("reads times as minutes, with or without seconds", () => {
    expect(parseTime("29")).toBe(29)
    expect(parseTime("29:30")).toBe(29.5)
    expect(parseTime("1:05:00")).toBe(65)
    expect(parseTime("")).toBeUndefined()
    expect(timeText(29.5)).toBe("29:30")
    expect(timeText(65)).toBe("1:05:00")
  })
})
