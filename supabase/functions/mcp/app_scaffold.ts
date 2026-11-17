// The project every new app starts from (create_app): a normal Vite + React + TypeScript + Tailwind +
// shadcn/ui project, the stack AIs know best, so an AI works on it the way it would anywhere. Amber
// Notes compiles it on save (nothing is installed: package.json is there for orientation) and runs
// React on preact/compat. shadcn's components, the app shell, index.css and lib/ come from the
// stack's own starter (app_stack.gen.ts).

// The starter's files are big: loaded when a project is made, not when the server starts.

/** The person runs their app themselves, like any real app, not only through their AI (Emil,
 *  2026-10-13). Said in every app's README, the apps guide and the server's instructions. */
export const IN_CONTROL = "The person stays in control inside the app, as in any real app, not only through their AI: whatever the app keeps, they can add, edit, rename, reorder and remove themselves (a habit tracker lets them manage its habits), settings are changed in the app, deletes can be undone, and everything is saved in data.json.";

/** What the test runner has (scripts/page-render/test-harness.js): part of every app's README, so an
 *  AI doesn't spend a fix round finding out (2026-11-17: seven missing features cost five apps a
 *  round each). Anything not listed fails with a message that names it. */
export const TEST_RUNNER = `Pinto Notes runs the tests in its own runner, in WebKit: the parts of Vitest and Testing Library below. Anything else fails with a message that names it.
- vitest: describe, it and test (with .skip, .only, .todo, .each, .skipIf, .runIf), beforeEach, afterEach, beforeAll, afterAll. expect with .not, .resolves and .rejects: toBe, toEqual, toStrictEqual, toMatchObject, toContain, toContainEqual, toHaveLength, toHaveProperty, toMatch, toBeTruthy, toBeFalsy, toBeNull, toBeUndefined, toBeDefined, toBeNaN, toBeTypeOf, toBeInstanceOf, toBeOneOf, toSatisfy, toBeGreaterThan(OrEqual), toBeLessThan(OrEqual), toBeCloseTo, toThrow, toHaveBeenCalled, toHaveBeenCalledOnce, toHaveBeenCalledTimes, toHaveBeenCalledWith, toHaveBeenLastCalledWith, toHaveBeenNthCalledWith, toHaveReturned, toHaveReturnedWith; expect.any, anything, objectContaining, arrayContaining, stringContaining, stringMatching, closeTo, poll, extend, assertions, hasAssertions. vi.fn (mockReturnValue, mockResolvedValue, mockImplementation and their Once forms), vi.spyOn, vi.mocked, vi.clearAllMocks, resetAllMocks, restoreAllMocks, vi.stubGlobal, vi.waitFor, vi.waitUntil, and the clock: vi.useFakeTimers, vi.setSystemTime, vi.advanceTimersByTime(Async), vi.runAllTimers, vi.runOnlyPendingTimers, vi.useRealTimers. Not vi.mock: test through the screen and pinto.data, or spy on an object.
- @testing-library/react: render (with wrapper or container), renderHook, screen, within, waitFor, waitForElementToBeRemoved, act, cleanup, fireEvent (any event: fireEvent.keyDown, fireEvent.pointerDown…). Queries getBy, getAllBy, queryBy, queryAllBy, findBy and findAllBy with Role (name, level, checked, pressed, selected, expanded, current, hidden), Text (selector, ignore), LabelText (a <label>, aria-label or aria-labelledby; selector), PlaceholderText, DisplayValue, AltText, Title and TestId. Implicit roles include form, region (a <section> with a label), banner, contentinfo, option, listbox, group, separator, progressbar and columnheader.
- @testing-library/user-event (userEvent, or userEvent.setup()): click, dblClick, tripleClick, type (with {Enter}, {Backspace}, {Delete}, {Tab}, {Escape}, arrows, {Shift>}…{/Shift}; Enter adds a line in a textarea and submits the form from a field; keys the app prevents do nothing), keyboard, clear, paste, selectOptions, deselectOptions, tab, hover, unhover, upload.
- @testing-library/jest-dom: toBeInTheDocument, toBeVisible, toHaveTextContent, toHaveValue, toHaveDisplayValue, toBeChecked, toBePartiallyChecked, toBeDisabled, toBeEnabled, toBeRequired, toBeValid, toBeInvalid, toHaveAttribute, toHaveClass, toHaveStyle, toHaveFocus, toHaveAccessibleName, toHaveAccessibleDescription, toHaveRole, toBeEmptyDOMElement, toContainElement, toContainHTML.
- As with React: render, fireEvent and each userEvent step (each key, each click) run the renders and effects they cause before returning, so a handler sees the state of the last keystroke. A sonner toast and its action work.
- An error in the app's own handlers or timers fails the test it happened in, saying where (a "click" handler, a timer).
- All test files run in one page, one after another; each file starts with no spies, stubs or fake clock left from the one before.
- A variable at the top of a module keeps its value from one test to the next (in Vitest too): keep state in a component or the store, or clear it when the component that shows it unmounts.
- Close a sheet, clear a field and offer Undo first, then await the save: done once the save is confirmed, they can land after the person (or the test) has moved on, and shut, wipe or undo the wrong thing.`;

/** How an app runs in Pinto Notes: part of every app's README, so any AI working on it reads it. */
export const appGuide = () => `## How this app runs in Pinto Notes

- Design it as its own product, with a look that fits what it does.
- ${IN_CONTROL}
- It is the note: opening the note opens the app, on iPhone (320-440 pt wide, safe areas, the keyboard shrinks the view) and on the Mac (a window from about 500 to 1,800 px, resized live). Light and dark follow the device.
- A normal Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui project. Pinto Notes compiles it when a file is saved (TSX, the @/ alias, imports without extensions, Tailwind from the classes used) and says what broke; nothing is installed. React runs on preact/compat.
- Available by name: react, react-dom, radix-ui, lucide-react, recharts, date-fns, zod, motion, sonner, react-day-picker, clsx, tailwind-merge, class-variance-authority, pinto-router (Router, Route, route(), back()), chart.js, d3, three, tone, dayjs, marked, dompurify, animejs, canvas-confetti.
- Data is JSON that Pinto Notes keeps for the app (encrypted, synced, with Undo): useStore(key, initial), useCollection(name), useSettings(defaults), batch(fn), setSummary(text) from "@/lib/pinto". A function update (set((old) => …)) always builds on the newest value, even for quick taps before a save lands, so no wrapper is needed. localStorage works too and is kept the same way. The person's AI reads and edits it as data.json, so keep its shape simple and describe it in docs/README.md.
- Several files at once (a screen and its test, or a whole app) go in one write: path the app, and files with each one. That's one version and one check. Written one by one, each save is checked alone, so a half-written app is held back on the way and a 40-file app takes over a minute.
- The internet works like on any web page: fetch, XMLHttpRequest and WebSocket to any https or wss address, with no prompt. A key for a service is something the person pastes into the app's settings, kept in the store.
- Links to the person's notes and apps are plain links, written like a [[link]] in a note: <a href="pinto:Work/Acme">Acme</a> (the title, or the folders and the title), pinto:Acme#Agenda for a heading, pinto:Work/Habits.app for another app. Tapping one opens it in Pinto Notes the way a [[link]] does (on iPhone, Back returns to this app); a note that doesn't exist is offered to be made. Anything can be the link (wrap a card in it, or use <Button asChild>); a test checks its href.
- The device: device.openURL(url) opens a web link once the person agrees to it, share(file) exports one, device.photos.pick() and device.files.pick() let the person choose. Reminders, Calendar, notifications, the camera, contacts, location, Maps and on-device AI are not available yet.`;

/** shadcn/ui's own starter colours (neutral, new-york-v4), switched by the device's light or dark
 *  setting instead of a .dark class. No Pinto colours: the app picks its own look (Emil, 2026-11-17). */
const NEUTRAL_CSS = `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (@media (prefers-color-scheme: dark));

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.922 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
    --chart-1: oklch(0.488 0.243 264.376);
    --chart-2: oklch(0.696 0.17 162.48);
    --chart-3: oklch(0.769 0.188 70.08);
    --chart-4: oklch(0.627 0.265 303.9);
    --chart-5: oklch(0.645 0.246 16.439);
  }
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
`;

export async function scaffold(title: string, lang = "en"): Promise<Record<string, string>> {
  const [{ STACK_FILES }, { SHADCN_UI }] = await Promise.all([import("./app_stack.gen.ts"), import("./shadcn-ui.ts")]);
  const safe = title.replace(/[<>&"`$\\{}]/g, "").trim() || "App";
  // The Training demo's frame (app-shell.tsx, stat-card.tsx) stays in the demo, not in every app.
  const { "/src/components/app-shell.tsx": _shell, "/src/components/stat-card.tsx": _stat, ...stack } = STACK_FILES
  return {
    ...stack,
    ...SHADCN_UI,
    "/src/index.css": NEUTRAL_CSS,
    "/package.json": JSON.stringify({
      name: safe.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app",
      private: true, type: "module",
      scripts: { dev: "vite", build: "vite build", test: "vitest" },
      "//": "Pinto Notes compiles this project when a file is saved and runs it inside the note. Nothing is installed: these are the packages the app provides.",
      dependencies: {
        react: "19", "react-dom": "19", "radix-ui": "1.4", "lucide-react": "0.544", recharts: "2.15", "date-fns": "4", zod: "3.25", motion: "11", sonner: "2", "react-day-picker": "9",
        clsx: "2", "tailwind-merge": "3", "class-variance-authority": "0.7", pinto: "*", "pinto-router": "*",
      },
      devDependencies: { typescript: "5", vite: "7", tailwindcss: "4", vitest: "3", "@testing-library/react": "16", "@testing-library/user-event": "14", "@testing-library/jest-dom": "6" },
    }, null, 2) + "\n",
    "/tsconfig.json": JSON.stringify({
      compilerOptions: { target: "ES2020", module: "ESNext", moduleResolution: "bundler", jsx: "react-jsx", strict: true, skipLibCheck: true, baseUrl: ".", paths: { "@/*": ["./src/*"] } },
      include: ["src"],
    }, null, 2) + "\n",
    "/index.html": `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="amber-base" content="none" />
    <title>${safe}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    "/src/main.tsx": `import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(<App />)
`,
    "/src/App.tsx": `import { Router, Route } from "pinto-router"
import { Toaster } from "@/components/ui/sonner"
import Home from "@/screens/home"
import Settings from "@/screens/settings"

export default function App() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <nav className="mb-6 flex gap-4 text-sm">
        <a href="#/">Home</a>
        <a href="#/settings">Settings</a>
      </nav>
      <Router>
        <Route path="/" component={Home} default />
        <Route path="/settings" component={Settings} />
      </Router>
      <Toaster position="top-center" />
    </main>
  )
}
`,
    "/src/screens/home.tsx": `import { useState } from "react"
import { Check, Pencil, Plus, Trash2 } from "lucide-react"
import { useCollection } from "@/lib/pinto"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Item = { id: string; text: string }

export default function Home() {
  const items = useCollection("items")
  const list = items.items as Item[]
  const [text, setText] = useState("")
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null)
  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    await items.add({ text: text.trim() })
    setText("")
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !editing.text.trim()) return
    await items.update(editing.id, { text: editing.text.trim() })
    setEditing(null)
  }
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">${safe}</h1>
      <form onSubmit={add} className="flex gap-2">
        <Label htmlFor="new-item" className="sr-only">New item</Label>
        <Input id="new-item" placeholder="New item" value={text} onChange={(e) => setText(e.currentTarget.value)} />
        <Button type="submit"><Plus /> Add</Button>
      </form>
      <Card className="mt-4 gap-0 py-0">
        {list.length ? list.map((item) => (
          <div key={item.id} className="flex items-center gap-2 border-t px-4 py-2 first:border-0">
            {editing?.id === item.id ? (
              <form onSubmit={save} className="flex flex-1 items-center gap-2">
                <Label htmlFor="edit-item" className="sr-only">Edit item</Label>
                <Input id="edit-item" autoFocus value={editing.text} onChange={(e) => setEditing({ id: item.id, text: e.currentTarget.value })} />
                <Button type="submit" size="sm"><Check /> Save</Button>
              </form>
            ) : (
              <>
                <span className="min-w-0 flex-1">{item.text}</span>
                <Button variant="ghost" size="icon" aria-label={\`Edit \${item.text}\`} onClick={() => setEditing({ id: item.id, text: item.text })}><Pencil /></Button>
                <Button variant="ghost" size="icon" aria-label={\`Remove \${item.text}\`} onClick={() => items.remove(item.id)}><Trash2 /></Button>
              </>
            )}
          </div>
        )) : <p className="px-4 py-6 text-center text-muted-foreground">Nothing here yet.</p>}
      </Card>
    </>
  )
}
`,
    "/tests/app.test.tsx": `import { describe, it, expect } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { pinto } from "pinto"
import App from "@/App"

// Each feature gets a test like these: do what the person does, check what they see, and check
// what was saved in the app's data. Each test starts with no data.
const saved = () => (pinto.data.collections.items ?? []).map((item: { text: string }) => item.text)

describe("Home", () => {
  it("adds an item, edits it, and saves the change", async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText("New item"), "Milk")
    await userEvent.click(screen.getByRole("button", { name: "Add" }))
    expect(await screen.findByText("Milk")).toBeInTheDocument()
    await waitFor(() => expect(saved()).toEqual(["Milk"]))

    await userEvent.click(screen.getByRole("button", { name: "Edit Milk" }))
    const field = screen.getByLabelText("Edit item")
    await userEvent.clear(field)
    await userEvent.type(field, "Oat milk")
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Oat milk")).toBeInTheDocument()
    await waitFor(() => expect(saved()).toEqual(["Oat milk"]))
  })

  it("removes an item", async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText("New item"), "Bread")
    await userEvent.click(screen.getByRole("button", { name: "Add" }))
    await userEvent.click(await screen.findByRole("button", { name: "Remove Bread" }))
    await waitFor(() => expect(screen.queryByText("Bread")).not.toBeInTheDocument())
    await waitFor(() => expect(saved()).toEqual([]))
  })
})
`,
    "/src/screens/settings.tsx": `import { useSettings } from "@/lib/pinto"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DEFAULTS = { name: "" }

// What the person can change without asking an AI, kept in the app's data.
export default function Settings() {
  const [settings, update] = useSettings(DEFAULTS)
  return (
    <>
      <h1 className="mb-4 text-2xl font-semibold">Settings</h1>
      <Card className="gap-0 py-0">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Label htmlFor="name" className="flex-1">Name</Label>
          <Input id="name" className="w-48" value={settings.name} onChange={(e) => update({ name: e.currentTarget.value })} />
        </div>
      </Card>
    </>
  )
}
`,
    "/README.md": `# ${safe}

What this app is for, in one sentence.

**Read docs/ first.** It's this app's memory: what it's for, the shape of its data, the decisions made and why, and what's missing. Keep it current whenever you change the app.

## Screens
- Home (src/screens/home.tsx)
- Settings (src/screens/settings.tsx)

## Tests
\`npm test\` runs Vitest. Tests live in tests/*.test.tsx and use Testing Library (render, screen, userEvent) with the jest-dom matchers. Each test starts with no data, whatever data.json holds: set up what a test needs by using the app as the person would, or with \`await pinto.store.set("key", value)\` before render. \`pinto\` (from "pinto") shows what was saved. Pinto Notes runs the tests, and a quick check that the app opens and its buttons work over a scrambled sample of data.json, on every save: a version that fails isn't shown to the person; the last one that passed keeps running until the failures are fixed.

**Every feature you add gets a test like the ones in tests/app.test.tsx**: do what the person does, check what they see, and check what was saved. When the app changes on purpose, change its tests to match the new behaviour. Never weaken, skip or delete a test just to make it pass: fix the app instead.

### What the test runner has
${TEST_RUNNER}

${appGuide()}
`,
    "/docs/README.md": `# ${safe}: notes for whoever works on this app next

## What it's for
(One or two sentences: who uses it and for what.)

## Data
How data.json is shaped (the person's AI reads and edits it directly):
- items: [{ id, text }] (useCollection("items"))
- settings: { name } (useSettings)

## Decisions
(What was chosen and why, newest first. "Kept the list on one screen: it's a quick-capture app.")

## Known gaps
(What's missing or rough, so the next change can start there.)
`,
  };
}
