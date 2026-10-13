# Trip plan

One trip in one place: the countdown, the plan for each day, the bookings with paid ticks, and the packing list.

**Read docs/ first.** It's this app's memory: what it's for, the shape of its data, the decisions made and why, and what's missing. Keep it current whenever you change the app.

## Screens
- Trip (src/screens/overview.tsx): the countdown (or which day of the trip it is), bookings paid, items packed, and the next day as a timeline with Share; Edit changes the trip and its dates, or starts a new trip that keeps the packing list (src/components/trip-sheet.tsx).
- Days (src/screens/days.tsx): every day of the trip as a timeline of its plan and bookings (src/components/timeline.tsx); share a day or the whole trip; add, edit or delete a day.
- Bookings (src/screens/bookings.tsx): each booking with its kind, day, time and confirmation; tick it once it's paid; add, edit or delete one.
- Packing (src/screens/packing.tsx): the list by group, a tap to pack; add, rename, regroup or delete items; unpack all.

The data and the date maths are in src/lib/trip.ts; the shared pieces (sections, rows, ring, bar, sheet) in src/components/kit.tsx.

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
