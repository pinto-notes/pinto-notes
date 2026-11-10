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
- Days has one Share, in its header, for the whole trip. One day is shared from its own sheet (the pencil). Add day is after the last day. Before round 5 the view had three Share buttons, two pencils and Add day, and the header's Share ended 18 px inside the pencils' column; both now end 8 px inside the cards' edge.
- The packing list the app starts with is ten things in four groups, each a thing you pack (Toothbrush, Sunscreen; not a group called Toiletries holding one item called Toiletries).
- The first screen's frame is the same in the four template apps (kit.tsx, FirstScreen): alone in the note with no tabs, a 576 px column in the middle, the title at 2rem, one line saying what to do, a quiet line saying the person's AI can do it too, the form, one primary button and a foot line. Made with an AI, the person is asked the same thing in the app and in the chat; the quiet line ("Pick here, or tell your AI and it sets this up.") says either works.
- When the person's AI sets the app up while the first screen is open, the app leaves it by itself and shows the result. If the person had changed anything there, a bar that stays says so and offers it back ("Use mine"); with nothing touched, nothing more is said. Tested in tests/app.test.tsx, "First use".
- First use (src/screens/first.tsx): a new app opens on "Where are you going?" with the place and the dates in the screen itself, and the button reads "Plan Lisbon" once the place is named. There is no countdown, no count and no packing list before there is a trip. After a trip has been put away (Start a new trip) the same screen shows inside the app, and says the packing list is waiting.
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
- No text under 12 px (0.75rem), Apple's minimum. Tests check text that changes after an action (saving and grading are async) inside waitFor, never on the first find.

- Colour: three ambers, one job each, the same three the Mac app has (src/index.css). The accent (`--amber-accent`, #D96A06 in the light, #F4AD33 in the dark) is for ticks, rings, bars and dots. `text-link` is its ink shade (#A85700 in the light) for amber text. `bg-primary` is the primary button: #BB5B05 with a white label in the light, white with a black label in the dark, as the Mac's own buttons are (dark-mode buttons are white or black, never amber). Before round 5 `--primary` was the ink shade, so a tick, a done day's dot and the button were three different oranges in one view. Letters on an accent fill use `text-mark-text` (the page's ink in the light: white on the accent is 3.5:1).

## Known gaps
- A day's plan is edited as text, one line per item; there is no reordering of items within a day.
- No costs per booking, no map, no weather (the network is off unless the person allows a host).
- No parsing of pasted confirmations in the app: the person's AI does that into bookings.
- No travel time between stops, no shared editing with travel companions (Share sends a copy).
