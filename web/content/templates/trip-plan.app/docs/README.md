# Trip plan: notes for whoever works on this app next

## What it's for
One trip, before and during it: how long until you go, the plan for each day, the bookings and whether they're paid, and the packing list. The person's AI drafts the day-by-day plan, adds bookings from pasted confirmations and adds what the trip needs to the packing list.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- trip: { name, place, start: "yyyy-mm-dd", end: "yyyy-mm-dd" }. The countdown and the day numbers come from start and end.
- days: [{ date: "yyyy-mm-dd", title, items: [text] }]. One per day, three to five items each, in plain sentences. An item that starts with a time ("09:30 Tram 28") is placed at that time on the timeline; one without stays after the line before it.
- bookings: [{ id, what, kind?, date?, time?, ref?, paid, when? }]. kind is flight, train, stay, food, activity or other; date "yyyy-mm-dd" and time "hh:mm" put it on that day's timeline. when is free text from before bookings had a date ("23 Oct, 20:00"): still shown, and editable as "When (as written)".
- packing: [{ id, text, group?, packed }]. group is Documents, Clothes, Toiletries, Tech or Other. A list where no item has a group shows as one list (lists from 1.2.26).
- past: [{ name, place, start, end }]. Trips before this one, from Start a new trip. Missing is fine.
- ids are any unique text ("b6", "p15").

## Decisions
- The first screen answers "how long until I go, and what's still open": the countdown, then bookings paid and items packed, then the first day of the plan. During the trip the countdown becomes "Day 2 of 5" and the plan shows today.
- Paid and packed are one-tap ticks, like Reminders. Packed items drop to the bottom of the list.
- The person is in control without the AI: change the trip and its dates (Edit on the Trip tab), add, edit and delete days, bookings and packing items. Deleting shows Undo in a bar at the top of the screen.
- Four tabs (Trip, Days, Bookings, Packing): each is one job.
- Days is a timeline (src/components/timeline.tsx), the thing people love in TripIt: the plan's lines and the bookings with a date, merged by time, a card for every day of the trip (planned or not). Two columns from 900 px.
- Share sends a day, or the whole trip, as a text file through share() (the share sheet on iPhone, a Save panel on the Mac) for a partner or a group chat. It says Shared after, or why it couldn't.
- Packing remembers: Start a new trip (in the trip's Edit sheet) moves this trip to past, clears days and bookings and unpacks the list, so the next trip starts from what you packed last time. Undo puts everything back. Unpack all does just the unpacking.
- Packing is grouped, groups side by side on a wide note.
- The Trip tab has two columns from 700 px: the countdown and to-dos, and the next day's timeline with Share.
- The app sets the note's summary line to "Lisbon: 9 days to go, 5 of 14 packed".

## Known gaps
- A day's plan is edited as text, one line per item; there is no reordering of items within a day.
- No costs per booking, no map, no weather (the network is off unless the person allows a host).
- No parsing of pasted confirmations in the app: the person's AI does that into bookings.
- No travel time between stops, no shared editing with travel companions (Share sends a copy).
