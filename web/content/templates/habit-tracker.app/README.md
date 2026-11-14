# Habit tracker

Tick off a few small daily habits in one tap, and see the week and your streaks at a glance.

**Read docs/ first.** It's this app's memory: what it's for, the shape of its data, the decisions made and why, and what's missing. Keep it current whenever you change the app.

## Screens
- Pick your habits (src/screens/setup.tsx): a new tracker's first screen. The starting habits are suggestions to tick, untick or rename (three start ticked), with a field for your own; Start writes the habits and the day counting starts. Nothing is counted before it.
- Today (src/screens/today.tsx): this week's ring, then the habits due today with their tick (or a counter for habits with a goal, like water), streak and week, then those not for today. A habit's name opens its page (src/components/habit-sheet.tsx): streak, best, its month, Skip today, Edit.
- Month (src/screens/history.tsx): a calendar per habit; tap a day to tick it, again to skip it, again to clear it.
- Habits (src/screens/manage.tsx, src/components/habit-editor.tsx): add, rename, schedule (every day, some weekdays, or times a week), reorder and remove habits (with Undo).

The data and the date maths are in src/lib/habits.ts; the shared pieces (sections, rows, ring, sheet) in src/components/kit.tsx.

## Tests
`npm test` runs Vitest. Tests live in tests/*.test.tsx and use Testing Library (render, screen, userEvent) with the jest-dom matchers; `pinto` (from "pinto") shows what was saved. A test can start over a sample of the app's data, so each test here sets the data it needs first (beforeEach). Pinto Notes runs them, and a quick check that the app opens and its buttons work, on every save: a version that fails isn't shown to the person; the last one that passed keeps running until the failures are fixed.

**Every feature you add gets a test like the ones in tests/app.test.tsx**: do what the person does, check what they see, and check what was saved. When the app changes on purpose, change its tests to match the new behaviour. Never weaken, skip or delete a test just to make it pass: fix the app instead.

## How this app runs in Pinto Notes

- It is the note: opening the note opens the app, on iPhone (320-440 pt wide, safe areas, the keyboard shrinks the view) and on the Mac (a window from about 500 to 1,800 px, resized live). Light and dark follow the device.
- A normal Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui project. Pinto Notes compiles it when a file is saved (TSX, the @/ alias, imports without extensions, Tailwind from the classes used) and says what broke; nothing is installed. React runs on preact/compat.
- Available by name: react, react-dom, radix-ui, lucide-react, recharts, date-fns, zod, motion, sonner, react-day-picker, clsx, tailwind-merge, class-variance-authority, pinto-router (Router, Route, route(), back()), chart.js, d3, three, tone, dayjs, marked, dompurify, animejs, canvas-confetti.
- Data is JSON that Pinto Notes keeps for the app (encrypted, synced, with Undo): useStore(key, initial), useCollection(name), useSettings(defaults), batch(fn), setSummary(text) from "@/lib/amber". localStorage works too and is kept the same way. The person's AI reads and edits it as data.json, so keep its shape simple and describe it in docs/README.md.
- The internet works like on any web page: fetch, XMLHttpRequest and WebSocket to any https or wss address, with no prompt. A key for a service is something the person pastes into the app's settings, kept in the store.
- The device: device.openURL(url) opens a link once the person agrees to it, share(file) exports one, device.photos.pick() and device.files.pick() let the person choose. Reminders, Calendar, notifications, the camera, contacts, location, Maps and on-device AI are not available yet.
