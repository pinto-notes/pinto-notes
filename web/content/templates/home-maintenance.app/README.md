# Home maintenance

The jobs that keep a home working (how often, when last done, who to call, what it costs), what's due, and what was spent. Mark a job done and the app works out when it's next. Appliances with their warranties and manuals, home details, and contacts sit beside them.

**Read docs/ first.** It's this app's memory: what it's for, the shape of its data, the decisions made and why, and what's missing. Keep it current whenever you change the app.

## Screens
- Due (src/screens/due.tsx): overdue, due this month and coming up, each by date; Done on a row marks the job done today. Above, the counts and what was spent this year; beside them on a wide note, warranties ending soon and what was done lately. A new app offers the usual jobs to start with.
- Jobs (src/screens/jobs.tsx): every job by area; tap one to change it (src/components/sheets.tsx: the job, its area, how often, when last done, who to call, its usual cost and a note, and its history), Reorder moves jobs within their area. The areas: add, rename, reorder and remove, with Undo.
- History (src/screens/history.tsx): a year at a time, the total and by area, and every time a job was done, newest first; tap one to change its date, cost or note, or remove it. The currency.
- Home (src/screens/home.tsx): appliances (model, serial, bought, warranty, manual), home details and who to call: add, edit, reorder and delete, with Undo.

The data, the dates and when a job is due are in src/lib/home.ts; every sheet in src/components/sheets.tsx; a job's row in src/components/job-row.tsx; the shared pieces (sections, rows, bar, sheet, Undo) in src/components/kit.tsx.
## Tests
`npm test` runs Vitest. Tests live in tests/*.test.tsx and use Testing Library (render, screen, userEvent) with the jest-dom matchers; `amber` (from "amber") shows what was saved. A test can start over a sample of the app's data, so each test here sets the data it needs first (beforeEach). Pinto Notes runs them, and a quick check that the app opens and its buttons work, on every save: a version that fails isn't shown to the person; the last one that passed keeps running until the failures are fixed.

**Every feature you add gets a test like the ones in tests/app.test.tsx**: do what the person does, check what they see, and check what was saved. When the app changes on purpose, change its tests to match the new behaviour. Never weaken, skip or delete a test just to make it pass: fix the app instead.

## How this app runs in Pinto Notes

- It is the note: opening the note opens the app, on iPhone (320-440 pt wide, safe areas, the keyboard shrinks the view) and on the Mac (a window from about 500 to 1,800 px, resized live). Light and dark follow the device.
- A normal Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui project. Pinto Notes compiles it when a file is saved (TSX, the @/ alias, imports without extensions, Tailwind from the classes used) and says what broke; nothing is installed. React runs on preact/compat.
- Available by name: react, react-dom, radix-ui, lucide-react, recharts, date-fns, zod, motion, sonner, react-day-picker, clsx, tailwind-merge, class-variance-authority, amber-router (Router, Route, route(), back()), chart.js, d3, three, tone, dayjs, marked, dompurify, animejs, canvas-confetti.
- Data is JSON that Pinto Notes keeps for the app (encrypted, synced, with Undo): useStore(key, initial), useCollection(name), useSettings(defaults), batch(fn), setSummary(text) from "@/lib/amber". localStorage works too and is kept the same way. The person's AI reads and edits it as data.json, so keep its shape simple and describe it in docs/README.md.
- Links to the person's notes are plain links written like a [[link]]: <a href="pinto:Home/Kitchen renovation">. Tapping one opens the note in Pinto Notes.
- No network except hosts the person allows: declare them in index.html with <meta name="amber-needs" content='{"hosts": ["api.open-meteo.com"]}'> and call fetch(url) from "@/lib/amber"; API keys live in Pinto Notes › Settings › API Keys (declare { "keys": [{ "name", "hosts", "query" or "header" }] } and pass { key: name }).
- The device: device.openURL(url) opens a link once the person agrees to it (a manual, a phone number: src/screens/home.tsx), share(file) exports one, device.photos.pick() and device.files.pick() let the person choose. Reminders, Calendar, notifications, the camera, contacts, location, Maps and on-device AI are not available yet.
