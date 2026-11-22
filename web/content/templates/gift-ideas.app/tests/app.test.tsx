import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { amber } from "amber"
import { route } from "amber-router"
import App from "@/App"
import { addDays, between, dayLabel, nextOn, today } from "@/lib/gifts"

// Each test does what the person does, then checks what they see and what was saved in data.json.
const values = () => amber.data.values ?? {}
const people = () => (values().people ?? []) as any[]
const ideas = () => (values().ideas ?? []) as any[]
const idea = (id: string) => ideas().find((i) => i.id === id)
const byTitle = (title: string) => ideas().find((i) => i.title === title)
const now = today()
const year = Number(now.slice(0, 4))
/** The day n days from today, as an occasion keeps it: "mm-dd". */
const md = (n: number) => addDays(now, n).slice(5)
// The sidebar (Mac) and the tab bar (iPhone) both have the screens' links; either one goes there.
const go = async (name: string) => userEvent.click((await screen.findAllByRole("link", { name }))[0])
/** Only the fields named in want, so a check says what matters and nothing else. */
const fields = (o: any, want: Record<string, unknown>) => (o ? Object.fromEntries(Object.keys(want).map((k) => [k, o[k]])) : o)
/** A day that comes round every year, picked the way the person picks it: a day, then a month. */
const pickDay = async (label: string, day: string) => {
  await userEvent.selectOptions(screen.getByLabelText(`${label}: day`), day.slice(3))
  await userEvent.selectOptions(screen.getByLabelText(`${label}: month`), day.slice(0, 2))
}
const rows = () => screen.getAllByTestId("event").map((b) => b.getAttribute("aria-label"))
const row = (name: string) => screen.getByRole("button", { name })
const openPerson = async (name: string) => { await go("People"); await userEvent.click(await screen.findByRole("button", { name })) }
const christmas = nextOn("12-24", now)

const mum = {
  id: "mum", name: "Mum", likes: "Linen, gardening, anything from Arket", sizes: "M, shoe 39", has: "A good teapot",
  occasions: [{ id: "birthday", kind: "birthday", date: md(40), budget: 600 }, { id: "christmas", kind: "christmas", budget: 800 }],
}
const oskar = {
  id: "oskar", name: "Oskar", likes: "Dinosaurs, Lego, drawing",
  occasions: [{ id: "birthday", kind: "birthday", date: md(9), budget: 300 }, { id: "christmas", kind: "christmas", budget: 400 }],
}
const sam = { id: "sam", name: "Sam", occasions: [{ id: "anniversary", kind: "anniversary", date: md(100), budget: 1000 }] }
const start = [
  { id: "lego", person: "oskar", title: "Dinosaur Lego set", price: 299, shop: "Lekia", occasion: "birthday", status: "bought" },
  { id: "pencils", person: "oskar", title: "Watercolour pencils", price: 150, status: "idea" },
  { id: "pyjamas", person: "oskar", title: "Dinosaur pyjamas", price: 249, occasion: "christmas", status: "bought" },
  { id: "apron", person: "mum", title: "Linen apron", price: 350, shop: "Arket", occasion: "christmas", status: "idea" },
  { id: "scarf", person: "mum", title: "Wool scarf", price: 400, occasion: "christmas", year: year - 2, status: "given", given: `${year - 2}-12-24` },
]

// Start each test from a known list, whatever data the app holds.
beforeEach(async () => {
  route("/")
  await amber.store.set("people", [mum, oskar, sam])
  await amber.store.set("ideas", start)
  await amber.store.set("settings", { currency: "kr", christmas: "12-24" })
  await amber.store.set("started", addDays(now, -30))
})

describe("Upcoming", () => {
  it("lists the next occasions by date, with the days left", async () => {
    render(<App />)
    const want = [["Oskar, Birthday", 9], ["Mum, Birthday", 40], ["Sam, Anniversary", 100], [`Christmas ${christmas.year}`, between(now, christmas.date)]] as const
    const sorted = [...want].sort((a, b) => a[1] - b[1] || (a[0].startsWith("Christmas") ? 1 : -1))
    await waitFor(() => expect(rows()).toEqual(sorted.map((x) => x[0])))
    expect(within(row("Oskar, Birthday")).getByTestId("days")).toHaveTextContent("In 9 days")
    expect(within(row("Sam, Anniversary")).getByTestId("days")).toHaveTextContent("In 100 days")
  })

  it("says whether each gift is bought yet, with what's spent of the budget", async () => {
    render(<App />)
    const oskarsDay = await screen.findByRole("button", { name: "Oskar, Birthday" })
    expect(within(oskarsDay).getByTestId("status")).toHaveTextContent("Bought")
    expect(within(oskarsDay).getByTestId("spend")).toHaveTextContent("299 of 300 kr")
    expect(within(row("Mum, Birthday")).getByTestId("status")).toHaveTextContent("Not bought yet")
    expect(within(row("Mum, Birthday")).getByTestId("spend")).toHaveTextContent("0 of 600 kr")
  })

  it("shows Christmas across everyone: spent of all the budgets, and how many are bought", async () => {
    render(<App />)
    const card = await screen.findByTestId("total-card")
    expect(within(card).getByRole("heading", { name: `Christmas ${christmas.year}` })).toBeInTheDocument()
    // Mum 800 and Oskar 400; Oskar's pyjamas are bought.
    expect(within(card).getByTestId("total")).toHaveTextContent("249 kr of 1,200 kr")
    expect(within(card).getByTestId("total-line")).toHaveTextContent("1 of 2 bought · 951 kr left")
    expect(within(card).getByTestId("still-to-buy")).toHaveTextContent("Still to buy for: Mum")
    expect(within(row(`Christmas ${christmas.year}`)).getByTestId("status")).toHaveTextContent("1 of 2 bought")
  })

  it("opens Christmas with each person's gift and budget, and each person from there", async () => {
    render(<App />)
    await userEvent.click(await screen.findByRole("button", { name: `Christmas ${christmas.year}: everyone` }))
    expect(await screen.findByRole("heading", { name: `Christmas ${christmas.year}`, level: 1 })).toBeInTheDocument()
    expect(screen.getAllByTestId("share").map((b) => b.textContent)).toEqual([
      "MumNot bought yet · 1 idea0 of 800 kr",
      "OskarBought: Dinosaur pyjamas249 of 400 kr",
    ])
    await userEvent.click(screen.getByRole("button", { name: "Mum" }))
    expect(await screen.findByRole("heading", { name: "Mum" })).toBeInTheDocument()
  })

  it("shows next year's date for an occasion already past this year, and Today on the day", async () => {
    await amber.store.set("people", [mum, { ...oskar, occasions: [{ ...oskar.occasions[0], date: md(0) }] }, { ...sam, occasions: [{ ...sam.occasions[0], date: md(-3) }] }])
    render(<App />)
    await waitFor(() => expect(within(row("Oskar, Birthday")).getByTestId("days")).toHaveTextContent("Today"))
    const next = nextOn(md(-3), now)
    expect(between(now, next.date)).toBeGreaterThan(300)
    expect(within(row("Sam, Anniversary")).getByTestId("days")).toHaveTextContent(`In ${between(now, next.date)} days`)
  })

  it("adds an idea for whoever you pick", async () => {
    render(<App />)

    await userEvent.click(await screen.findByRole("button", { name: "Idea" }))
    await userEvent.click(screen.getByRole("radio", { name: "Sam" }))
    await userEvent.type(screen.getByLabelText("Gift"), "Concert tickets")
    await userEvent.type(screen.getByLabelText("Price (kr)"), "900")
    await userEvent.click(screen.getByRole("radio", { name: "Anniversary" }))
    await userEvent.click(screen.getByRole("button", { name: "Add idea" }))
    const want = { person: "sam", price: 900, occasion: "anniversary", status: "idea", year: nextOn(md(100), now).year }
    await waitFor(() => expect(fields(byTitle("Concert tickets"), want)).toEqual(want))
    expect(within(row("Sam, Anniversary")).getByTestId("status")).toHaveTextContent("Not bought yet")
  })
})

describe("People", () => {
  it("lists everyone with their next occasion and how many ideas", async () => {
    render(<App />)
    await go("People")
    await waitFor(() => expect(screen.getAllByTestId("person").map((b) => b.getAttribute("aria-label"))).toEqual(["Mum", "Oskar", "Sam"]))
    expect(row("Oskar")).toHaveTextContent("Birthday · In 9 days")
    expect(row("Oskar")).toHaveTextContent("3 ideas")
    expect(row("Mum")).toHaveTextContent("1 idea")
  })

  it("adds someone with their birthday and Christmas, and opens their page", async () => {
    render(<App />)
    await go("People")
    await userEvent.click(await screen.findByRole("button", { name: "Person" }))
    await userEvent.type(screen.getByLabelText("Name"), "Maja")
    await pickDay("Birthday (optional)", "03-14")
    await userEvent.click(screen.getByRole("button", { name: "Add Maja" }))
    await waitFor(() => expect(people().find((p) => p.name === "Maja")?.occasions).toEqual([{ id: "birthday", kind: "birthday", date: "03-14" }, { id: "christmas", kind: "christmas" }]))
    expect(await screen.findByRole("heading", { name: "Maja" })).toBeInTheDocument()
    expect(screen.getAllByTestId("occasion").map((b) => b.getAttribute("aria-label"))).toEqual(["Birthday", "Christmas"])
  })

  it("renames someone", async () => {
    render(<App />)
    await openPerson("Sam")
    await userEvent.click(await screen.findByRole("button", { name: "Edit person" }))
    await userEvent.clear(screen.getByLabelText("Name"))
    await userEvent.type(screen.getByLabelText("Name"), "Sam Lind")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(people().find((p) => p.id === "sam").name).toBe("Sam Lind"))
    expect(await screen.findByRole("heading", { name: "Sam Lind" })).toBeInTheDocument()
  })

  it("reorders people, and the order is kept", async () => {
    render(<App />)
    await go("People")
    await userEvent.click(await screen.findByRole("button", { name: "Edit people" }))
    await userEvent.click(screen.getByRole("button", { name: "Move Sam up" }))
    await waitFor(() => expect(people().map((p) => p.id)).toEqual(["mum", "sam", "oskar"]))
    expect(screen.getByRole("button", { name: "Move Mum up" })).toBeDisabled()
    await userEvent.click(screen.getByRole("button", { name: "Done editing people" }))
    await waitFor(() => expect(screen.getAllByTestId("person").map((b) => b.getAttribute("aria-label"))).toEqual(["Mum", "Sam", "Oskar"]))
  })

  it("removes someone with their ideas, and Undo brings both back", async () => {
    render(<App />)
    await go("People")
    await userEvent.click(await screen.findByRole("button", { name: "Edit people" }))
    await userEvent.click(screen.getByRole("button", { name: "Remove Oskar" }))
    await waitFor(() => expect(people().map((p) => p.id)).toEqual(["mum", "sam"]))
    expect(ideas().filter((i) => i.person === "oskar")).toEqual([])
    expect(await screen.findByText("Removed Oskar")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(people().map((p) => p.id)).toEqual(["mum", "oskar", "sam"]))
    expect(ideas().filter((i) => i.person === "oskar").map((i) => i.id)).toEqual(["lego", "pencils", "pyjamas"])
  })
})

describe("A person", () => {
  it("adds an occasion with its day and budget, and it shows on Upcoming", async () => {
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(within(screen.getByRole("region", { name: "Occasions" })).getByRole("button", { name: "Add" }))
    await userEvent.click(screen.getByRole("radio", { name: "Other" }))
    await userEvent.type(screen.getByLabelText("Name"), "Name day")
    await pickDay("Day", md(20))
    await userEvent.type(screen.getByLabelText("Budget (kr)"), "200")
    await userEvent.click(screen.getByRole("button", { name: "Add occasion" }))
    await waitFor(() => expect(fields(people()[0].occasions[2], { kind: "other", name: "Name day", date: md(20), budget: 200 })).toEqual({ kind: "other", name: "Name day", date: md(20), budget: 200 }))
    await go("Upcoming")
    expect(within(await screen.findByRole("button", { name: "Mum, Name day" })).getByTestId("days")).toHaveTextContent("In 20 days")
  })

  it("changes an occasion's budget, and what's spent shows against it", async () => {
    render(<App />)
    await openPerson("Oskar")
    await userEvent.click(await screen.findByRole("button", { name: "Birthday" }))
    const budget = screen.getByLabelText("Budget (kr)")
    await userEvent.clear(budget)
    await userEvent.type(budget, "250")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(people().find((p) => p.id === "oskar").occasions[0].budget).toBe(250))
    await waitFor(() => expect(within(screen.getByRole("button", { name: "Birthday" })).getByTestId("spend")).toHaveTextContent("299 of 250 kr"))
    expect(within(screen.getByRole("button", { name: "Birthday" })).getByRole("progressbar").firstElementChild).toHaveClass("bg-destructive")
  })

  it("removes an occasion, and Undo puts it back", async () => {
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(await screen.findByRole("button", { name: "Edit occasions" }))
    await userEvent.click(screen.getByRole("button", { name: "Remove Birthday" }))
    await waitFor(() => expect(people()[0].occasions.map((o: any) => o.id)).toEqual(["christmas"]))
    await userEvent.click(await screen.findByRole("button", { name: "Undo" }))
    await waitFor(() => expect(people()[0].occasions.map((o: any) => o.id)).toEqual(["birthday", "christmas"]))
  })

  it("reorders occasions", async () => {
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(await screen.findByRole("button", { name: "Edit occasions" }))
    await userEvent.click(screen.getByRole("button", { name: "Move Christmas up" }))
    await waitFor(() => expect(people()[0].occasions.map((o: any) => o.id)).toEqual(["christmas", "birthday"]))
    expect(screen.getAllByTestId("occasion").map((b) => b.getAttribute("aria-label"))).toEqual(["Christmas", "Birthday"])
  })

  it("adds an idea with its price, shop, link and occasion", async () => {
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(within(screen.getByRole("region", { name: "Ideas" })).getByRole("button", { name: "Add" }))
    await userEvent.type(screen.getByLabelText("Gift"), "Blue linen shirt")
    await userEvent.type(screen.getByLabelText("Price (kr)"), "690")
    await userEvent.type(screen.getByLabelText("Where to buy"), "Arket")
    await userEvent.type(screen.getByLabelText("Link"), "arket.example/blue-shirt")
    await userEvent.click(screen.getByRole("radio", { name: "Birthday" }))
    await userEvent.click(screen.getByRole("button", { name: "Add idea" }))
    const want = { person: "mum", price: 690, shop: "Arket", link: "arket.example/blue-shirt", occasion: "birthday", status: "idea" }
    await waitFor(() => expect(fields(byTitle("Blue linen shirt"), want)).toEqual(want))
    expect(await screen.findByRole("button", { name: "Blue linen shirt" })).toHaveTextContent("690 kr · Arket · Birthday")
  })

  it("moves an idea on to Bought, and it counts against the occasion's budget", async () => {
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(await screen.findByRole("button", { name: "Status: Linen apron" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Bought" }))
    await waitFor(() => expect(fields(idea("apron"), { status: "bought", year: christmas.year })).toEqual({ status: "bought", year: christmas.year }))
    await waitFor(() => expect(within(screen.getByRole("button", { name: "Christmas" })).getByTestId("spend")).toHaveTextContent("350 of 800 kr"))
    expect(screen.getByRole("button", { name: "Status: Linen apron" })).toHaveTextContent("Bought")
  })

  it("puts a bought idea that wasn't for an occasion on the person's next one", async () => {
    render(<App />)
    await openPerson("Oskar")
    await userEvent.click(await screen.findByRole("button", { name: "Status: Watercolour pencils" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Wrapped" }))
    await waitFor(() => expect(fields(idea("pencils"), { status: "wrapped", occasion: "birthday" })).toEqual({ status: "wrapped", occasion: "birthday" }))
    await waitFor(() => expect(within(screen.getByRole("button", { name: "Birthday" })).getByTestId("spend")).toHaveTextContent("449 of 300 kr"))
  })

  it("keeps a given gift under Given before, dated, by year", async () => {
    render(<App />)
    await openPerson("Oskar")
    await userEvent.click(await screen.findByRole("button", { name: "Status: Dinosaur Lego set" }))
    await userEvent.click(screen.getByRole("menuitemradio", { name: "Given" }))
    await waitFor(() => expect(fields(idea("lego"), { status: "given", given: now })).toEqual({ status: "given", given: now }))
    await waitFor(() => expect(screen.getAllByTestId("given").map((b) => b.textContent)).toEqual([`${nextOn(md(9), now).year}Dinosaur Lego setBirthday · 299 kr`]))
    expect(screen.queryByRole("button", { name: "Status: Dinosaur Lego set" })).toBeNull()
  })

  it("lists the gifts given before, newest first", async () => {
    await amber.store.set("ideas", [...start, { id: "book", person: "mum", title: "Garden book", price: 250, occasion: "birthday", status: "given", year: year - 1 }])
    render(<App />)
    await openPerson("Mum")
    await waitFor(() => expect(screen.getAllByTestId("given").map((b) => b.textContent)).toEqual([
      `${year - 1}Garden bookBirthday · 250 kr`, `${year - 2}Wool scarfChristmas · 400 kr`,
    ]))
  })

  it("says so when a new idea is like a gift given before", async () => {
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(within(screen.getByRole("region", { name: "Ideas" })).getByRole("button", { name: "Add" }))
    await userEvent.type(screen.getByLabelText("Gift"), "Blue silk scarf")
    expect(await screen.findByTestId("given-before")).toHaveTextContent(`Given before: Wool scarf, Christmas ${year - 2}`)
    await userEvent.clear(screen.getByLabelText("Gift"))
    await userEvent.type(screen.getByLabelText("Gift"), "Garden gloves")
    expect(screen.queryByTestId("given-before")).toBeNull()
  })

  it("edits an idea's name and price", async () => {
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(await screen.findByRole("button", { name: "Linen apron" }))
    await userEvent.clear(screen.getByLabelText("Gift"))
    await userEvent.type(screen.getByLabelText("Gift"), "Striped linen apron")
    await userEvent.clear(screen.getByLabelText("Price (kr)"))
    await userEvent.type(screen.getByLabelText("Price (kr)"), "395")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(fields(idea("apron"), { title: "Striped linen apron", price: 395, occasion: "christmas" })).toEqual({ title: "Striped linen apron", price: 395, occasion: "christmas" }))
    expect(await screen.findByRole("button", { name: "Striped linen apron" })).toHaveTextContent("395 kr · Arket · Christmas")
  })

  it("deletes an idea, and Undo brings it back", async () => {
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(await screen.findByRole("button", { name: "Linen apron" }))
    await userEvent.click(screen.getByRole("button", { name: "Delete idea" }))
    await waitFor(() => expect(idea("apron")).toBeUndefined())
    expect(await screen.findByText("Deleted Linen apron")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Undo" }))
    await waitFor(() => expect(idea("apron")?.title).toBe("Linen apron"))
    expect(await screen.findByRole("button", { name: "Linen apron" })).toBeInTheDocument()
  })

  it("reorders ideas", async () => {
    render(<App />)
    await openPerson("Oskar")
    await userEvent.click(await screen.findByRole("button", { name: "Edit ideas" }))
    await userEvent.click(screen.getByRole("button", { name: "Move Dinosaur pyjamas up" }))
    await waitFor(() => expect(ideas().filter((i) => i.person === "oskar").map((i) => i.id)).toEqual(["lego", "pyjamas", "pencils"]))
    expect(screen.getAllByTestId("idea").map((b) => b.getAttribute("aria-label"))).toEqual(["Dinosaur Lego set", "Dinosaur pyjamas", "Watercolour pencils"])
  })

  it("keeps what they like, their sizes and what they already have", async () => {
    render(<App />)
    await openPerson("Oskar")
    expect(await screen.findByLabelText("Likes")).toHaveValue("Dinosaurs, Lego, drawing")
    await userEvent.type(screen.getByLabelText("Sizes"), "Age 7, 122 cm")
    await userEvent.type(screen.getByLabelText("Already has"), "Every dinosaur book in the library")
    await userEvent.tab()
    await waitFor(() => expect(fields(people().find((p) => p.id === "oskar"), { sizes: "Age 7, 122 cm", has: "Every dinosaur book in the library" }))
      .toEqual({ sizes: "Age 7, 122 cm", has: "Every dinosaur book in the library" }))
  })

  it("opens an idea's link through the device", async () => {
    await amber.store.set("ideas", [...start.slice(0, 3), { ...start[3], link: "arket.example/linen-apron" }, start[4]])
    const device = amber.device as any, was = device.openURL
    const open = vi.fn(() => Promise.resolve({ ok: true }))
    device.openURL = open
    render(<App />)
    await openPerson("Mum")
    await userEvent.click(await screen.findByRole("button", { name: "Open the link for Linen apron" }))
    try {
      await waitFor(() => expect(open.mock.calls.map((c: any[]) => String(c[0]))).toEqual([["https:", "", "arket.example/linen-apron"].join("/")]))
    } finally { device.openURL = was }
  })
})

describe("Settings", () => {
  it("changes the currency, and amounts follow", async () => {
    render(<App />)
    await go("Settings")
    const field = await screen.findByLabelText("Shown with amounts")
    await userEvent.clear(field)
    await userEvent.type(field, "€")
    await userEvent.tab()
    await waitFor(() => expect(values().settings).toEqual({ currency: "€", christmas: "12-24" }))
    await go("Upcoming")
    expect(within(await screen.findByRole("button", { name: "Oskar, Birthday" })).getByTestId("spend")).toHaveTextContent("€299 of €300")
  })

  it("moves Christmas to the 25th for everyone", async () => {
    render(<App />)
    await go("Settings")
    await userEvent.click(await screen.findByRole("radio", { name: "25 December" }))
    await waitFor(() => expect(values().settings.christmas).toBe("12-25"))
    await go("Upcoming")
    const on25 = nextOn("12-25", now)
    expect(await screen.findByTestId("total-card")).toHaveTextContent(dayLabel(on25.date))
  })
})

describe("First use", () => {
  beforeEach(async () => {
    await amber.store.set("people", [])
    await amber.store.set("ideas", [])
    await amber.store.set("started", null)
  })

  it("opens on Who do you buy gifts for?, alone, with no tabs", async () => {
    render(<App />)
    expect(await screen.findByRole("heading", { name: "Who do you buy gifts for?" })).toBeInTheDocument()
    expect(screen.getByTestId("ai-hint")).toHaveTextContent("Add them here, or tell your AI who's on your list.")
    expect(screen.queryByRole("link", { name: "People" })).toBeNull()
    expect(screen.getByRole("button", { name: "Name someone to start" })).toBeDisabled()
  })

  it("adds the first person with their birthday, then shows Upcoming with them", async () => {
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Name"), "Oskar")
    await pickDay("Birthday (optional)", md(9))
    await userEvent.click(screen.getByRole("button", { name: "Add Oskar" }))
    await waitFor(() => expect(people().map((p) => [p.name, p.occasions.map((o: any) => o.kind)])).toEqual([["Oskar", ["birthday", "christmas"]]]))
    expect(values().started).toBe(now)
    expect(within(await screen.findByRole("button", { name: "Oskar, Birthday" })).getByTestId("days")).toHaveTextContent("In 9 days")
  })

  it("leaves the first screen by itself when your AI adds someone, and keeps what you typed a tap away", async () => {
    render(<App />)
    await userEvent.type(await screen.findByLabelText("Name"), "Maja")
    // The person's AI adds who they named, as its prompt says.
    await amber.store.set("people", [oskar])
    expect(await screen.findByRole("heading", { name: "Upcoming" })).toBeInTheDocument()
    expect(await screen.findByText("Your AI added Oskar. What you typed here wasn't added.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Add mine" }))
    await waitFor(() => expect(people().map((p) => p.name)).toEqual(["Oskar", "Maja"]))
  })

  it("says nothing more when your AI adds someone and you hadn't typed anything", async () => {
    render(<App />)
    await screen.findByRole("heading", { name: "Who do you buy gifts for?" })
    await amber.store.set("people", [oskar])
    expect(await screen.findByRole("heading", { name: "Upcoming" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add mine" })).toBeNull()
  })
})

describe("Your AI fills it in", () => {
  it("shows the idea your AI saved: \"Mum would love that blue scarf from Arket, 450 kr\"", async () => {
    render(<App />)
    await openPerson("Mum")
    await amber.store.set("ideas", [...ideas(), { id: "i-scarf", person: "mum", title: "Blue scarf", shop: "Arket", price: 450, status: "idea" }])
    expect(await screen.findByRole("button", { name: "Blue scarf" })).toHaveTextContent("450 kr · Arket")
    expect(screen.getByRole("button", { name: "Status: Blue scarf" })).toHaveTextContent("Idea")
  })

  it("follows your AI marking a gift bought for Christmas", async () => {
    render(<App />)
    await waitFor(() => expect(within(screen.getByTestId("total-card")).getByTestId("total-line")).toHaveTextContent("1 of 2 bought"))
    await amber.store.set("ideas", ideas().map((i) => (i.id === "apron" ? { ...i, status: "bought" } : i)))
    await waitFor(() => expect(within(screen.getByTestId("total-card")).getByTestId("total")).toHaveTextContent("599 kr of 1,200 kr"))
    expect(within(screen.getByTestId("total-card")).getByTestId("total-line")).toHaveTextContent("2 of 2 bought · 601 kr left")
    expect(within(screen.getByTestId("total-card")).queryByTestId("still-to-buy")).toBeNull()
  })

  it("opens data an AI wrote loosely: a person and an occasion by name, a price with its currency, a birthday with its year", async () => {
    await amber.store.set("people", [{ name: "Grandpa", occasions: [{ kind: "Birthday", date: `1948-${md(5)}`, budget: "500 kr" }, { kind: "Christmas" }] }])
    await amber.store.set("ideas", [{ person: "Grandpa", title: "Audiobook subscription", price: "300 kr", occasion: "Birthday", status: "Bought" }])
    render(<App />)
    const day = await screen.findByRole("button", { name: "Grandpa, Birthday" })
    expect(within(day).getByTestId("days")).toHaveTextContent("In 5 days")
    expect(within(day).getByTestId("status")).toHaveTextContent("Bought")
    expect(within(day).getByTestId("spend")).toHaveTextContent("300 of 500 kr")
    await userEvent.click(day)
    expect(await screen.findByRole("button", { name: "Audiobook subscription" })).toHaveTextContent("300 kr · Birthday")
  })
})
