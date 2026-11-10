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
  it("shows the newest card on the first screen, question over answer, and names the boxes plainly", async () => {
    await amber.store.set("cards", [
      card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology", 3, today),
      card("c2", "What is ATP for?", "Energy the cell can use", "Biology", 1),
    ])
    render(<App />)
    const newest = await screen.findByTestId("newest")
    await waitFor(() => expect(newest).toHaveTextContent("What is ATP for?"))
    expect(newest).toHaveTextContent("Energy the cell can use")
    expect(newest).toHaveTextContent("Biology · New")
    expect(screen.queryByText("Tmrw")).toBeNull()
    // How well you know them is under the cards, in words: never "Box 3".
    await go("Cards")
    expect(await screen.findByRole("img", { name: "Cards by how well you know them: New 1, Shaky 0, Steady 1, Strong 0, Solid 0" })).toBeInTheDocument()
    expect(screen.queryByText(/^Box \d/)).toBeNull()
  })

  it("studies the due cards: shows the answer, then moves each card by how you did", async () => {
    await amber.store.set("cards", [
      card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology", 2),
      card("c2", "What is ATP for?", "Energy the cell can use", "Biology", 1),
    ])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("2 cards"))
    await userEvent.click(screen.getByRole("button", { name: "Study now" }))
    // Lowest box first.
    await waitFor(() => expect(screen.getByTestId("question")).toHaveTextContent("What is ATP for?"))
    expect(screen.queryByTestId("answer")).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await waitFor(() => expect(screen.getByTestId("answer")).toHaveTextContent("Energy the cell can use"))
    // A new card: Good brings it back in two days, Easy in four.
    expect(screen.getByRole("button", { name: "Good, back in 2 days" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Easy, back in 4 days" }))
    await waitFor(() => expect(values().cards[1]).toEqual({ ...card("c2", "What is ATP for?", "Energy the cell can use", "Biology", 3, today), interval: 4, ease: 2.65 }))

    await waitFor(() => expect(screen.getByTestId("question")).toHaveTextContent("Where does glycolysis happen?"))
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Hard, back in 1 day" }))
    await waitFor(() => expect(values().cards[0]).toEqual({ ...card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology", 1, today), interval: 1, ease: 2.35 }))

    expect(await screen.findByText("2 answers, 0 again")).toBeInTheDocument()
    expect(values().studied[today]).toBe(2)
    await userEvent.click(screen.getByRole("button", { name: "Done" }))
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("Nothing due"))
  })

  it("leaves out cards that aren't due yet", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology", 3, today), card("c2", "Q two", "A two", "Biology", 1)])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("1 card"))
    expect(screen.getByText("2 cards in 1 topic")).toBeInTheDocument()
  })

  it("studies one topic", async () => {
    await amber.store.set("cards", [card("c1", "Q bio", "A", "Biology"), card("c2", "Q chem", "A", "Chemistry"), card("c3", "Q chem 2", "A", "Chemistry")])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("3 cards"))
    await userEvent.click(screen.getByRole("radio", { name: "Chemistry" }))
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("2 cards"))
    await userEvent.click(screen.getByRole("button", { name: "Study now" }))
    expect(await screen.findByText("1 of 2")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId("question")).toHaveTextContent("Q chem"))
  })

  it("puts Study now under what's due, and the topics under their own heading after it", async () => {
    await amber.store.set("cards", [card("c1", "Q bio", "A", "Biology"), card("c2", "Q chem", "A", "Chemistry")])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("2 cards"))
    const button = screen.getByRole("button", { name: "Study now" })
    const heading = screen.getByRole("heading", { name: "Topics" })
    const topics = screen.getByRole("radiogroup", { name: "Topic" })
    // In reading order: the button, then the heading, then its topics.
    expect(button.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(heading.compareDocumentPosition(topics) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // The streak names itself; no "Streak" heading repeats it.
    expect(screen.queryByRole("heading", { name: "Streak" })).toBeNull()
  })

  it("ends a session early", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology")])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Study now" }))
    await userEvent.click(await screen.findByRole("button", { name: "End" }))
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("1 card"))
    expect(values().cards[0].seen).toBeUndefined()
  })
})

describe("Cards", () => {
  it("adds a card to box 1, due at once", async () => {
    // A deck with nothing in it opens on the first screen; the Cards screen's own form is for a
    // deck that has cards. This one's card isn't due, so what's due is the new one.
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology", 3, today)])
    render(<App />)
    await go("Cards")
    await userEvent.type(await screen.findByLabelText("Question"), "What is a codon?")
    await userEvent.type(screen.getByLabelText("Answer"), "Three bases")
    await userEvent.clear(screen.getByLabelText("Topic"))
    await userEvent.type(screen.getByLabelText("Topic"), "DNA")
    await userEvent.click(screen.getByRole("button", { name: "Add card" }))
    await waitFor(() => expect(values().cards.slice(1).map(({ id, ...c }: { id: string }) => c)).toEqual([{ q: "What is a codon?", a: "Three bases", topic: "DNA", box: 1 }]))
    expect(await screen.findByText("What is a codon?")).toBeInTheDocument()
    await go("Study")
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("1 card"))
  })

  it("edits a card", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology", 3, today)])
    route("/cards")
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Edit Q one" }))
    const sheet = within(await screen.findByRole("dialog", { name: "Edit card" }))
    const answer = sheet.getByLabelText("Answer")
    await waitFor(() => expect(answer).toHaveValue("A one"))
    await userEvent.clear(answer)
    await userEvent.type(answer, "A better answer")
    await userEvent.click(sheet.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().cards).toEqual([card("c1", "Q one", "A better answer", "Biology", 3, today)]))
    expect(await screen.findByText("A better answer")).toBeInTheDocument()
  })

  it("opens a new app on Make your first cards, alone, with no numbers about none", async () => {
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Make your first cards" })).toBeInTheDocument()
    expect(screen.getByTestId("ai-hint")).toHaveTextContent("Add one here, or tell your AI and it sets this up.")
    expect(screen.queryByTestId("due")).toBeNull()
    expect(screen.queryByTestId("streak")).toBeNull()
    expect(screen.queryByText("Coming up")).toBeNull()
    expect(screen.queryByRole("link", { name: "Cards" })).toBeNull()
    expect(screen.getByRole("button", { name: "Write a question and its answer to start" })).toBeDisabled()
  })

  it("goes from the first screen to a studied card: write one, study it, grade it", async () => {
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Question"), "What is a codon?")
    await userEvent.type(screen.getByLabelText("Answer"), "Three bases")
    await userEvent.type(screen.getByLabelText("Topic (optional)"), "DNA")
    await userEvent.click(await screen.findByRole("button", { name: "Add card" }))
    await waitFor(() => expect(values().cards.map(({ id, ...c }: { id: string }) => c)).toEqual([{ q: "What is a codon?", a: "Three bases", topic: "DNA", box: 1 }]))
    // The app itself, from here on: one card due.
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("1 card"))
    await userEvent.click(screen.getByRole("button", { name: "Study now" }))
    expect(await screen.findByText("What is a codon?")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    expect(await screen.findByText("Three bases")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /^Good/ }))
    await waitFor(() => expect(values().cards[0].seen).toBe(today))
    await waitFor(() => expect(values().studied?.[today]).toBe(1))
  })

  it("leaves the first screen by itself when your AI makes the cards, and offers to add the one you had written", async () => {
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Question"), "What is a codon?")
    await userEvent.type(screen.getByLabelText("Answer"), "Three bases")
    // The person's AI adds cards, as its prompt says.
    await amber.store.set("cards", [card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology")])
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("1 card"))
    expect(screen.queryByRole("heading", { name: "Make your first cards" })).toBeNull()
    expect(await screen.findByText("Your AI made your first cards. The card you were writing wasn't added.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Add it" }))
    await waitFor(() => expect(values().cards.map((c: { q: string }) => c.q)).toEqual(["Where does glycolysis happen?", "What is a codon?"]))
  })

  it("brings a half-written card to the Cards screen to finish, when your AI makes the cards first", async () => {
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Question"), "What is a codon?")
    await amber.store.set("cards", [card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology")])
    expect(await screen.findByText("Your AI made your first cards. The card you were writing isn't finished.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Finish it" }))
    await waitFor(() => expect(screen.getByLabelText("Question")).toHaveValue("What is a codon?"))
    expect(screen.getByRole("heading", { name: "Cards" })).toBeInTheDocument()
  })

  it("says nothing more when your AI makes the cards and you hadn't typed anything", async () => {
    render(<App />)
    await screen.findByRole("heading", { name: "Make your first cards" })
    await amber.store.set("cards", [card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology")])
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("1 card"))
    expect(screen.queryByRole("button", { name: "Add it" })).toBeNull()
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

  it("gives a new card four different answers: soon, tomorrow, two days, four days", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology")])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Study now" }))
    await userEvent.click(await screen.findByRole("button", { name: "Show answer" }))
    expect(await screen.findByRole("button", { name: "Again, once more this session, then back in 1 day" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Hard, back in 1 day" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Good, back in 2 days" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Easy, back in 4 days" })).toBeInTheDocument()
    const shown = ["again", "hard", "good", "easy"].map((g) => screen.getByTestId(`when-${g}`).textContent)
    expect(shown).toEqual(["soon", "1d", "2d", "4d"])
    expect(new Set(shown).size).toBe(4)
    await userEvent.click(screen.getByRole("button", { name: "Good, back in 2 days" }))
    await waitFor(() => expect(values().cards[0]).toEqual({ ...card("c1", "Q one", "A one", "Biology", 2, today), interval: 2, ease: 2.5 }))
  })

  it("says tomorrow, not soon, the second time a card gets Again in one session", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology")])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Study now" }))
    await userEvent.click(await screen.findByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Again, once more this session, then back in 1 day" }))
    await userEvent.click(await screen.findByRole("button", { name: "Show answer" }))
    expect(await screen.findByRole("button", { name: "Again, back in 1 day" })).toBeInTheDocument()
    expect(screen.getByTestId("when-again")).toHaveTextContent("1d")
  })

  it("asks a card again at the end of the session after Again", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology"), card("c2", "Q two", "A two", "Biology")])
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: "Study now" }))
    await waitFor(() => expect(screen.getByTestId("question")).toHaveTextContent("Q one"))
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Again, once more this session, then back in 1 day" }))
    expect(await screen.findByText("2 of 3")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: /^Good/ }))
    await waitFor(() => expect(screen.getByTestId("question")).toHaveTextContent("Q one"))
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: /^Good/ }))
    expect(await screen.findByText("3 answers, 1 again")).toBeInTheDocument()
  })

  it("keeps cards from before intervals: due by their box, and graded from there", async () => {
    // Box 3 meant four days; seen four days ago, so it's due.
    await amber.store.set("cards", [card("c1", "Q old", "A old", "Biology", 3, plus(today, -4))])
    render(<App />)
    await waitFor(() => expect(screen.getByTestId("due")).toHaveTextContent("1 card"))
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
    await waitFor(() => expect(screen.getByTestId("answer")).toHaveTextContent("A one"))
    await userEvent.keyboard("3")
    await waitFor(() => expect(values().cards[0].interval).toBe(2))
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
    await waitFor(() => expect(screen.getByTestId("streak")).toHaveTextContent("2-day streak"))
    await userEvent.click(screen.getByRole("button", { name: "Study now" }))
    await userEvent.click(await screen.findByRole("button", { name: "Show answer" }))
    await userEvent.click(screen.getByRole("button", { name: /^Good/ }))
    expect(await screen.findByText(/^3-day streak\./)).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Done" }))
    await waitFor(() => expect(screen.getByTestId("streak")).toHaveTextContent("3-day streak"))
    expect(screen.getByText("1 card today.")).toBeInTheDocument()
  })
})

describe("The calendar", () => {
  it("can be read: the months over it, today ringed, and what darker means", async () => {
    await amber.store.set("cards", [card("c1", "Q one", "A one", "Biology", 2, plus(today, -1))])
    await amber.store.set("studied", { [plus(today, -1)]: 4 })
    const { container } = render(<App />)
    expect(await screen.findByText("A square a day.")).toBeInTheDocument()
    expect(screen.getByText("Today is ringed.")).toBeInTheDocument()
    expect(screen.getByText(/^Fewer\s*more$/)).toBeInTheDocument()
    expect(container.querySelectorAll("[data-today]")).toHaveLength(1)
    const month = new Date(today + "T12:00:00").toLocaleDateString("en-GB", { month: "short" })
    expect(screen.getAllByText(month).length).toBeGreaterThan(0)
    expect(screen.getByTestId("streak")).toHaveTextContent("1-day streak")
  })
})

describe("Adding fast", () => {
  it("adds one card after another with Return, keeping the topic", async () => {
    // On a deck that has a card (an empty one opens on the first screen).
    await amber.store.set("cards", [card("c0", "Q zero", "A zero", "Biology", 3, today)])
    route("/cards")
    render(<App />)
    await userEvent.clear(await screen.findByLabelText("Topic"))
    await userEvent.type(screen.getByLabelText("Topic"), "DNA")
    await userEvent.type(screen.getByLabelText("Question"), "What is a gene?")
    await userEvent.type(screen.getByLabelText("Answer"), "A stretch of DNA{enter}")
    await waitFor(() => expect(values().cards).toHaveLength(2))
    expect(await screen.findByText('Added "What is a gene?". The next one is ready.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText("Question")).toHaveValue(""))
    await waitFor(() => expect(screen.getByLabelText("Question")).toHaveFocus())
    await userEvent.type(screen.getByLabelText("Question"), "What is a codon?")
    await userEvent.type(screen.getByLabelText("Answer"), "Three bases{enter}")
    await waitFor(() => expect(values().cards.slice(1).map(({ id, ...c }: { id: string }) => c)).toEqual([
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
    await waitFor(() => expect(sheet.getByTestId("found")).toHaveTextContent("2 cards found"))
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
