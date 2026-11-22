# Mood and energy log

An evening check-in in a few taps: mood and energy from 1 to 5, hours slept, a tag or two and a line about the day. The month shows as a calendar coloured by mood, Trends draws 30 or 90 days, and Patterns compares the person's own days.

**Read docs/ first.** It's this app's memory: what it's for, the shape of its data, the decisions made and why, and what's missing. Keep it current whenever you change the app.

## Screens
- Today (src/screens/today.tsx): today's check-in (src/components/day-form.tsx: mood, energy, hours slept, tags and the person's own new ones, one line), or what was logged with Edit. Beside it the last seven days' averages and each of those days (a day not logged is one tap from its sheet), and the last 30 days as a chart.
- Month (src/screens/month.tsx): a calendar, each day filled by its mood with its energy as pips; tap a day to log or change it (src/components/day-sheet.tsx, which also deletes it, with Undo). The month's averages, its best and hardest days.
- Trends (src/screens/trends.tsx): 30 or 90 days. Mood and energy as lines, sleep as bars with the goal as a dashed line (src/components/trend-chart.tsx); then Patterns: mood on days with and without each tag, and energy after nights of each length, each with the days it rests on.
- Settings (src/screens/settings.tsx): the tags (add, rename, reorder, remove, with Undo), whether to log sleep, and the hours the person aims for.

The data, dates and the patterns' arithmetic are in src/lib/mood.ts; the colours for mood and energy in src/components/marks.tsx and src/index.css; the shared pieces (sections, rows, sheet, Undo) in src/components/kit.tsx.

## Tests
`npm test` runs Vitest. Tests live in tests/*.test.tsx and use Testing Library (render, screen, userEvent) with the jest-dom matchers; `amber` (from "amber") shows what was saved. A test can start over a sample of the app's data, so each test here sets the data it needs first (beforeEach). Pinto Notes runs them, and a quick check that the app opens and its buttons work, on every save: a version that fails isn't shown to the person; the last one that passed keeps running until the failures are fixed.

**Every feature you add gets a test like the ones in tests/app.test.tsx**: do what the person does, check what they see, and check what was saved. When the app changes on purpose, change its tests to match the new behaviour. Never weaken, skip or delete a test just to make it pass: fix the app instead.

## How this app runs in Pinto Notes

- It is the note: opening the note opens the app, on iPhone (320-440 pt wide, safe areas, the keyboard shrinks the view) and on the Mac (a window from about 500 to 1,800 px, resized live). Light and dark follow the device.
- A normal Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui project. Pinto Notes compiles it when a file is saved (TSX, the @/ alias, imports without extensions, Tailwind from the classes used) and says what broke; nothing is installed. React runs on preact/compat.
- Available by name: react, react-dom, radix-ui, lucide-react, recharts, date-fns, zod, motion, sonner, react-day-picker, clsx, tailwind-merge, class-variance-authority, amber-router (Router, Route, route(), back()), chart.js, d3, three, tone, dayjs, marked, dompurify, animejs, canvas-confetti.
- Data is JSON that Pinto Notes keeps for the app (encrypted, synced, with Undo): useStore(key, initial), useCollection(name), useSettings(defaults), batch(fn), setSummary(text) from "@/lib/amber". localStorage works too and is kept the same way. The person's AI reads and edits it as data.json, so keep its shape simple and describe it in docs/README.md.
- Links to the person's notes are plain links written like a [[link]]: <a href="pinto:Journal/November">. Tapping one opens the note in Pinto Notes.
- No network except hosts the person allows: declare them in index.html with <meta name="amber-needs" content='{"hosts": ["api.open-meteo.com"]}'> and call fetch(url) from "@/lib/amber"; API keys live in Pinto Notes › Settings › API Keys (declare { "keys": [{ "name", "hosts", "query" or "header" }] } and pass { key: name }).
- The device: device.openURL(url) opens a link once the person agrees to it, share(file) exports one, device.photos.pick() and device.files.pick() let the person choose. Reminders, Calendar, notifications, the camera, contacts, location, Maps and on-device AI are not available yet.
