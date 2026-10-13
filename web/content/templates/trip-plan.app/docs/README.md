# Trip plan: notes for whoever works on this app next

## What it's for
One trip, before and during it: how long until you go, the plan for each day, the bookings and whether they're paid, and the packing list. The person's AI drafts the day-by-day plan, adds bookings from pasted confirmations and adds what the trip needs to the packing list.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- trip: { name, place, start: "yyyy-mm-dd", end: "yyyy-mm-dd" }. The countdown and the day numbers come from start and end.
- days: [{ date: "yyyy-mm-dd", title, items: [text] }]. One per day, three to five items each, in plain sentences.
- bookings: [{ id, what, when, ref, paid }]. when and ref are free text ("23 Oct, 20:00"); paid is true or false.
- packing: [{ id, text, packed }].
- ids are any unique text ("b6", "p15").

## Decisions
- The first screen answers "how long until I go, and what's still open": the countdown, then bookings paid and items packed, then the first day of the plan. During the trip the countdown becomes "Day 2 of 5" and the plan shows today.
- Paid and packed are one-tap ticks, like Reminders. Packed items drop to the bottom of the list.
- The person is in control without the AI: change the trip and its dates (Edit on the Trip tab), add, edit and delete days, bookings and packing items. Deleting shows Undo in a bar at the top of the screen.
- Four tabs (Trip, Days, Bookings, Packing): each is one job.
- The app sets the note's summary line to "Lisbon: 9 days to go, 5 of 14 packed".

## Known gaps
- A day's plan is edited as text, one line per item; there is no reordering of items within a day.
- No costs per booking, no map, no weather (the network is off unless the person allows a host).
