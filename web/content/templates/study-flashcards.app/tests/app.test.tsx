import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { iso } from "@/lib/cards"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const today = iso(new Date())
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
const card = (id: string, q: string, a: string, topic: string, box = 1, seen?: string) => ({ id, q, a, topic, box, ...(seen ? { seen } : {}) })

// Start each test from no cards, whatever data the app holds.
beforeEach(async () => {
  route("/")
  await amber.store.set("cards", [])
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
    await userEvent.click(screen.getByRole("button", { name: "Knew it" }))
    await waitFor(() => expect(values().cards[1]).toEqual(card("c2", "What is ATP for?", "Energy the cell can use", "Biology", 2, today)))

    expect(await screen.findByTestId("question")).toHaveTextContent("Where does glycolysis happen?")
    await userEvent.click(screen.getByRole("button", { name: "Show answer" }))
    await userEvent.click(await screen.findByRole("button", { name: "Didn't know" }))
    await waitFor(() => expect(values().cards[0]).toEqual(card("c1", "Where does glycolysis happen?", "In the cytoplasm", "Biology", 1, today)))

    expect(await screen.findByText("1 knew, 1 to see again")).toBeInTheDocument()
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
    await userEvent.click(await screen.findByRole("button", { name: "Add" }))
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
    const answer = await screen.findByLabelText("Answer")
    expect(answer).toHaveValue("A one")
    await userEvent.clear(answer)
    await userEvent.type(answer, "A better answer")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(values().cards).toEqual([card("c1", "Q one", "A better answer", "Biology", 3, today)]))
    expect(await screen.findByText("A better answer")).toBeInTheDocument()
  })

  it("says how to start when there are no cards", async () => {
    render(<App />)
    expect(await screen.findByText("No cards yet. Add the first one in the Cards tab.")).toBeInTheDocument()
    await go("Cards")
    expect(await screen.findByText(/^No cards yet\. Tap Add/)).toBeInTheDocument()
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
