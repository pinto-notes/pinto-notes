import { describe, it, expect, beforeEach } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { iso, plus } from "@/lib/cards"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const today = iso(new Date())
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
const card = (id: string, q: string, a: string, topic: string, box = 1, seen?: string) => ({ id, q, a, topic, box, ...(seen ? { seen } : {}) })

// Start each test from no cards, whatever data the app holds.
beforeEach(async () => {
  route("/")
  await amber.store.set("cards", [])
  await amber.store.set("studied", {})
})

describe("Study", () => {
  it("studies the due cards: shows the answer, then moves each card by how you did", async () => {
    await amber.store.set("cards", [
      card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology", 2),
      card("c2", "What is ATP for?", "Energy the cell can use", "Biology", 1),
    ])
    render(<App />)
    expect(await screen.findByTestId("due")).toHaveTextContent("2 cards")
    await userEvent.click(screen.getByRole("button", { name: "Study now" }))
    // Lowest box first.
    expect(await screen.findByTestId("question")).toHaveTextContent("What is ATP for?")
    expect(screen.queryByTestId("answer")).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    expect(await screen.findByTestId("answer")).toHaveTextContent("Energy the cell can use")
    // A new card: Good brings it back tomorrow, Easy in four days.
    expect(screen.getByRole("button", { name: "Good, back in 1 day" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Easy, back in 4 days" }))
    await waitFor(() => expect(values().cards[1]).toEqual({ ...card("c2", "What is ATP for?", "Energy the cell can use", "Biology", 3, today), interval: 4, ease: 2.65 }))

    expect(await screen.findByTestId("question")).toHaveTextContent("Where does glycolysis happen?")
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Hard, back in 1 day" }))
    await waitFor(() => expect(values().cards[0]).toEqual({ ...card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology", 1, today), interval: 1, ease: 2.35 }))

    expect(await screen.findByText("2 answers, 0 again")).toBeInTheDocument()
    expect(values().studied[today]).toBe(2)
    await userEvent.click(screen.getByRole("button", { name: "Done" }))
    expect(await screen.findByTestId("due")).toHaveTextContent("Nothing due")
  })

  it("leaves out cards that aren't due yet", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology", 3, today), card("c2", "Q two", "A two", "Biology", 1)])
    render(<App />)
    expect(await screen.findByTestId("due")).toHaveTextContent("1 card")
    expect(screen.getByText("2 cards in 1 topic")).toBeInTheDocument()
  })

  it("studies one topic", async () => {
    await amber.store.set("cards", [card("c1", "Q bio", "A", "Biology"), card("c2", "Q chem", "A", "Chemistry"), card("c3", "Q chem 2", "A", "Chemistry")])
    render(<App />)
    expect(await screen.findByTestId("due")).toHaveTextContent("3 cards")
    await userEvent.click(screen.getByRole("radio", { name: "Chemistry" }))
    expect(await screen.findByTestId("due")).toHaveTextContent("2 cards")
    await userEvent.click(screen.getByRole("button", { name: "Study now" }))
    expect(await screen.findByText("1 of 2")).toBeInTheDocument()
    expect(screen.getByTestId("question")).toHaveTextContent("Q chem")
  })

  it("ends a session early", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology")])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Study now" }))
    await userEvent.click(await screen.findByRole("button", { name: "End" }))
    expect(await screen.findByTestId("due")).toHaveTextContent("1 card")
    expect(values().cards[0].seen).toBeUndefined()
  })
})

describe("Cards", () => {
  it("adds a card to box 1, due at once", async () => {
    render(<App />)
    await go("Cards")
    await userEvent.type(await screen.findByLabelText("Question"), "What is a codon?")
    await userEvent.type(screen.getByLabelText("Answer"), "Three bases")
    await userEvent.type(screen.getByLabelText("Topic"), "DNA")
    await userEvent.click(screen.getByRole("button", { name: "Add card" }))
    await waitFor(() => expect(values().cards.map(({ id, ...c }: { id: string }) => c)).toEqual([{ q: "What is a codon?", a: "Three bases", topic: "DNA", box: 1 }]))
    expect(await screen.findByText("What is a codon?")).toBeInTheDocument()
    await go("Study")
    expect(await screen.findByTestId("due")).toHaveTextContent("1 card")
  })

  it("edits a card", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology", 3, today)])
    route("/cards")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit Q one" }))
    const sheet = within(await screen.findByRole("dialog", { name: "Edit card" }))
    const answer = sheet.getByLabelText("Answer")
    expect(answer).toHaveValue("A one")
    await userEvent.clear(answer)
    await userEvent.type(answer, "A better answer")
    await userEvent.click(sheet.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().cards).toEqual([card("c1", "Q one", "A better answer", "Biology", 3, today)]))
    expect(await screen.findByText("A better answer")).toBeInTheDocument()
  })

  it("says how to start when there are no cards", async () => {
    render(<App />)
    expect(await screen.findByText("No cards yet. Add the first one in the Cards tab.")).toBeInTheDocument()
    await go("Cards")
    expect(await screen.findByText(/^No cards yet\. Add the first one here/)).toBeInTheDocument()
  })

  it("deletes a card, with Undo", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology"), card("c2", "Q two", "A two", "Biology")])
    route("/cards")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Delete Q one" }))
    await waitFor(() => expect(values().cards.map((c: { id: string }) => c.id)).toEqual(["c2"]))
    await waitFor(() => expect(screen.queryByText("Q one")).not.toBeInTheDocument())
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().cards.map((c: { id: string }) => c.id)).toEqual(["c1", "c2"]))
  })
})

describe("Spaced repetition", () => {
  it("grows a known card's interval with Good, and shows when it's back", async () => {
    await amber.store.set("cards", [{ ...card("c1", "Q one", "A one", "Biology", 2, plus(today, -3)), interval: 3, ease: 2.5 }])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Study now" }))
    await userEvent.click(await screen.findByRole("button", { name: "Show answer" }))
    // 3 days × 2.5 is 8 days (box 4).
    await userEvent.click(screen.getByRole("button", { name: "Good, back in 8 days" }))
    await waitFor(() => expect(values().cards[0]).toEqual({ ...card("c1", "Q one", "A one", "Biology", 4, today), interval: 8, ease: 2.5 }))
    await userEvent.click(await screen.findByRole("button", { name: "Done" }))
    await go("Cards")
    expect(await screen.findByText("In 8 days")).toBeInTheDocument()
  })

  it("asks a card again at the end of the session after Again", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology"), card("c2", "Q two", "A two", "Biology")])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Study now" }))
    expect(await screen.findByTestId("question")).toHaveTextContent("Q one")
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Again, back in 1 day" }))
    expect(await screen.findByText("2 of 3")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: /^Good/ }))
    expect(await screen.findByTestId("question")).toHaveTextContent("Q one")
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: /^Good/ }))
    expect(await screen.findByText("3 answers, 1 again")).toBeInTheDocument()
  })

  it("keeps cards from before intervals: due by their box, and graded from there", async () => {
    // Box 3 meant four days; seen four days ago, so it's due.
    await amber.store.set("cards", [card("c1", "Q old", "A old", "Biology", 3, plus(today, -4))])
    render(<App />)
    expect(await screen.findByTestId("due")).toHaveTextContent("1 card")
    await userEvent.click(screen.getByRole("button", { name: "Study now" }))
    await userEvent.click(await screen.findByRole("button", { name: "Show answer" }))
    await userEvent.click(screen.getByRole("button", { name: "Good, back in 10 days" }))
    await waitFor(() => expect(values().cards[0].interval).toBe(10))
  })

  it("grades with the keyboard: Space shows the answer, 3 is Good", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology")])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Study now" }))
    await screen.findByTestId("question")
    document.body.focus()
    await userEvent.keyboard(" ")
    expect(await screen.findByTestId("answer")).toHaveTextContent("A one")
    await userEvent.keyboard("3")
    await waitFor(() => expect(values().cards[0].interval).toBe(1))
  })

  it("shows what's coming up tomorrow", async () => {
    await amber.store.set("cards", [{ ...card("c1", "Q one", "A one", "Biology", 2, today), interval: 1 }, { ...card("c2", "Q two", "A two", "Biology", 2, today), interval: 1 }])
    render(<App />)
    expect(await screen.findByRole("img", { name: "Due in the next seven days: 2, 0, 0, 0, 0, 0, 0" })).toBeInTheDocument()
  })
})

describe("Streak", () => {
  it("counts days in a row with cards studied, and today joins it", async () => {
    await amber.store.set("studied", { [plus(today, -1)]: 5, [plus(today, -2)]: 8, [plus(today, -4)]: 3 })
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology")])
    render(<App />)
    expect(await screen.findByTestId("streak")).toHaveTextContent("2-day streak")
    await userEvent.click(screen.getByRole("button", { name: "Study now" }))
    await userEvent.click(await screen.findByRole("button", { name: "Show answer" }))
    await userEvent.click(screen.getByRole("button", { name: /^Good/ }))
    expect(await screen.findByText(/^3-day streak\./)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Done" }))
    expect(await screen.findByTestId("streak")).toHaveTextContent("3-day streak")
    expect(screen.getByText("1 card today.")).toBeInTheDocument()
  })
})

describe("Adding fast", () => {
  it("adds one card after another with Return, keeping the topic", async () => {
    route("/cards")
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Topic"), "DNA")
    await userEvent.type(screen.getByLabelText("Question"), "What is a gene?")
    await userEvent.type(screen.getByLabelText("Answer"), "A stretch of DNA{enter}")
    await waitFor(() => expect(values().cards).toHaveLength(1))
    expect(await screen.findByText('Added "What is a gene?". The next one is ready.')).toBeInTheDocument()
    expect(screen.getByLabelText("Question")).toHaveValue("")
    expect(screen.getByLabelText("Question")).toHaveFocus()
    await userEvent.type(screen.getByLabelText("Question"), "What is a codon?")
    await userEvent.type(screen.getByLabelText("Answer"), "Three bases{enter}")
    await waitFor(() => expect(values().cards.map(({ id, ...c }: { id: string }) => c)).toEqual([
      { q: "What is a gene?", a: "A stretch of DNA", topic: "DNA", box: 1 },
      { q: "What is a codon?", a: "Three bases", topic: "DNA", box: 1 },
    ]))
  })

  it("pastes many cards at once, with Undo", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology")])
    route("/cards")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Paste many" }))
    const sheet = within(await screen.findByRole("dialog", { name: "Paste many cards" }))
    // Pasted text arrives in one go.
    fireEvent.input(sheet.getByLabelText("One card a line: question - answer"), { target: { value: "Where is DNA kept? - In the nucleus\nWhat is a gene? | A stretch of DNA\nnot a card" } })
    const topic = sheet.getByLabelText("Topic")
    await userEvent.clear(topic)
    await userEvent.type(topic, "DNA")
    expect(sheet.getByTestId("found")).toHaveTextContent("2 cards found")
    await userEvent.click(sheet.getByRole("button", { name: "Add 2 cards" }))
    await waitFor(() => expect(values().cards.map(({ id, ...c }: { id: string }) => c)).toEqual([
      { q: "Q one", a: "A one", topic: "Biology", box: 1 },
      { q: "Where is DNA kept?", a: "In the nucleus", topic: "DNA", box: 1 },
      { q: "What is a gene?", a: "A stretch of DNA", topic: "DNA", box: 1 },
    ]))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(values().cards).toHaveLength(1))
  })

  it("finds a card by search", async () => {
    await amber.store.set("cards", [card("c1", "Where is DNA kept?", "In the nucleus", "DNA"), card("c2", "What is ATP for?", "Energy", "Biology")])
    route("/cards")
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Search cards"), "nucleus")
    expect(await screen.findByText("Where is DNA kept?")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText("What is ATP for?")).toBeNull())
  })
})
