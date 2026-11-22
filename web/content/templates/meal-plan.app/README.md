# Meal plan and groceries

The week's dinners, and the grocery list they make: by aisle, things two dinners share on one line, and nothing that's always in the cupboard. Tick things off in the shop.

**Read docs/ first.** It's this app's memory: what it's for, the shape of its data, the decisions made and why, and what's missing. Keep it current whenever you change the app.

## Screens
- Week (src/screens/week.tsx): Monday to Sunday, a dinner a day with who cooks and a link to its recipe note; tap a day to add its dinner or change it (src/components/dinner-sheet.tsx: the dish, the day, who cooks, the recipe note, what it needs). Beside it the week's grocery list in short, and the earlier weeks, which are kept; an earlier week can be copied onto this one. The arrows step through the weeks (src/components/week-switch.tsx); a week ahead starts empty.
- Groceries (src/screens/groceries.tsx): the week's list by aisle, made from its dinners; tap to tick; add something by hand; rename a thing, move it to another aisle, say it's always in the cupboard, or take it off the list (with Undo).
- Settings (src/screens/settings.tsx): what's always in the cupboard, the aisles in the order you walk the shop, and who cooks: add, rename, reorder (the aisles) and remove, with Undo.

The data, the list's arithmetic and the dates are in src/lib/meals.ts; the shared pieces (sections, rows, bar, sheet, Undo) in src/components/kit.tsx.

## Tests
`npm test` runs Vitest. Tests live in tests/*.test.tsx and use Testing Library (render, screen, userEvent) with the jest-dom matchers; `amber` (from "amber") shows what was saved. A test can start over a sample of the app's data, so each test here sets the data it needs first (beforeEach). Pinto Notes runs them, and a quick check that the app opens and its buttons work, on every save: a version that fails isn't shown to the person; the last one that passed keeps running until the failures are fixed.

**Every feature you add gets a test like the ones in tests/app.test.tsx**: do what the person does, check what they see, and check what was saved. When the app changes on purpose, change its tests to match the new behaviour. Never weaken, skip or delete a test just to make it pass: fix the app instead.

## How this app runs in Pinto Notes

- It is the note: opening the note opens the app, on iPhone (320-440 pt wide, safe areas, the keyboard shrinks the view) and on the Mac (a window from about 500 to 1,800 px, resized live). Light and dark follow the device.
- A normal Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui project. Pinto Notes compiles it when a file is saved (TSX, the @/ alias, imports without extensions, Tailwind from the classes used) and says what broke; nothing is installed. React runs on preact/compat.
- Available by name: react, react-dom, radix-ui, lucide-react, recharts, date-fns, zod, motion, sonner, react-day-picker, clsx, tailwind-merge, class-variance-authority, amber-router (Router, Route, route(), back()), chart.js, d3, three, tone, dayjs, marked, dompurify, animejs, canvas-confetti.
- Data is JSON that Pinto Notes keeps for the app (encrypted, synced, with Undo): useStore(key, initial), useCollection(name), useSettings(defaults), batch(fn), setSummary(text) from "@/lib/amber". localStorage works too and is kept the same way. The person's AI reads and edits it as data.json, so keep its shape simple and describe it in docs/README.md.
- Links to the person's notes are plain links written like a [[link]]: <a href="pinto:Recipes/Lemon chicken">. Tapping one opens the note in Pinto Notes.
- No network except hosts the person allows: declare them in index.html with <meta name="amber-needs" content='{"hosts": ["api.open-meteo.com"]}'> and call fetch(url) from "@/lib/amber"; API keys live in Pinto Notes › Settings › API Keys (declare { "keys": [{ "name", "hosts", "query" or "header" }] } and pass { key: name }).
- The device: device.openURL(url) opens a link once the person agrees to it, share(file) exports one, device.photos.pick() and device.files.pick() let the person choose. Reminders, Calendar, notifications, the camera, contacts, location, Maps and on-device AI are not available yet.
