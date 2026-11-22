# Gift ideas

Everyone you buy gifts for: their occasions with a budget each, their gift ideas from idea to given, what's coming up next, and the gifts given before.

**Read docs/ first.** It's this app's memory: what it's for, the shape of its data, the decisions made and why, and what's missing. Keep it current whenever you change the app.

## Screens
- Who do you buy gifts for? (src/screens/first.tsx): a new app's first screen, alone: a name, their birthday and whether they get a Christmas gift, then Upcoming.
- Upcoming (src/screens/upcoming.tsx): the next occasions by date (src/components/events.tsx), each with how many days are left, whether the gift is bought and what's spent of its budget. Christmas is one row for everyone, and its total across everyone is a card at the top (beside the list from 1000 px). "Idea" adds an idea for anyone (src/components/idea-sheet.tsx).
- A shared occasion (src/screens/event.tsx, /event/<key>, such as /event/christmas-2026): the total, then each person's gift, spent and budget.
- People (src/screens/people.tsx): everyone, in your order, with their next occasion and how many ideas. Edit reorders and removes; Person adds one (src/components/person-sheet.tsx).
- A person (src/screens/person.tsx, /person/<id>): their ideas (a status button each: idea, bought, wrapped, given, src/components/status-sheet.tsx), their occasions with budgets (src/components/occasion-sheet.tsx), what they like, their sizes and what they already have, and the gifts given before, by year.
- Settings (src/screens/settings.tsx): the currency, and the day Christmas is on (24 or 25 December).

The data, the dates and the sums are in src/lib/gifts.ts; the shared pieces (sections, rows, sheet, undo bar, edit buttons, spent of budget) in src/components/kit.tsx.

## Tests
`npm test` runs Vitest. Tests live in tests/*.test.tsx and use Testing Library (render, screen, userEvent) with the jest-dom matchers; `amber` (from "amber") shows what was saved. A test can start over a sample of the app's data, so each test here sets the data it needs first (beforeEach). Pinto Notes runs them, and a quick check that the app opens and its buttons work, on every save: a version that fails isn't shown to the person; the last one that passed keeps running until the failures are fixed.

**Every feature you add gets a test like the ones in tests/app.test.tsx**: do what the person does, check what they see, and check what was saved. When the app changes on purpose, change its tests to match the new behaviour. Never weaken, skip or delete a test just to make it pass: fix the app instead.

## How this app runs in Pinto Notes

- It is the note: opening the note opens the app, on iPhone (320-440 pt wide, safe areas, the keyboard shrinks the view) and on the Mac (a window from about 500 to 1,800 px, resized live). Light and dark follow the device.
- A normal Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui project. Pinto Notes compiles it when a file is saved (TSX, the @/ alias, imports without extensions, Tailwind from the classes used) and says what broke; nothing is installed. React runs on preact/compat.
- Available by name: react, react-dom, radix-ui, lucide-react, recharts, date-fns, zod, motion, sonner, react-day-picker, clsx, tailwind-merge, class-variance-authority, amber-router (Router, Route, route(), back()), chart.js, d3, three, tone, dayjs, marked, dompurify, animejs, canvas-confetti.
- Data is JSON that Pinto Notes keeps for the app (encrypted, synced, with Undo): useStore(key, initial), useCollection(name), useSettings(defaults), batch(fn), setSummary(text) from "@/lib/amber". localStorage works too and is kept the same way. The person's AI reads and edits it as data.json, so keep its shape simple and describe it in docs/README.md.
- No network except hosts the person allows: declare them in index.html with <meta name="amber-needs" content='{"hosts": ["api.open-meteo.com"]}'> and call fetch(url) from "@/lib/amber"; API keys live in Pinto Notes › Settings › API Keys (declare { "keys": [{ "name", "hosts", "query" or "header" }] } and pass { key: name }).
- The device: device.openURL(url) opens a link once the person agrees to it, share(file) exports one, device.photos.pick() and device.files.pick() let the person choose. Reminders, Calendar, notifications, the camera, contacts, location, Maps and on-device AI are not available yet.
