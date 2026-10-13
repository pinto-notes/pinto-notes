# Habit tracker: notes for whoever works on this app next

## What it's for
A person building a few small daily habits ticks them off on their iPhone, often in bed or on the way out. Their AI logs days for them too ("walked, read 30 pages, 6 glasses") and answers questions like "which habit did I miss most this month?".

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- habits: [{ id, name, detail?, target, unit? }]. id is a lowercase slug of the name ("no-phone-in-bed"). target 1 is a yes/no habit; a target above 1 is counted (Water, target 8, unit "glasses").
- days: { "yyyy-mm-dd": { habitId: amount } }. A habit counts as done that day when amount >= its target. A day with nothing done has no key.

To log a day, set days[date][habitId]: 1 for a yes/no habit, the count for a counted one. Keep ids as they are: renaming a habit changes name, never id.

## Decisions
- Today is the first screen and does one job: tick today. The ring is this week (Monday to today), habit-days done of habit-days so far; it never punishes days that haven't happened.
- A streak counts days in a row up to today; today doesn't break it until it's over.
- Counted habits get minus and plus buttons, and the plus button's ring fills toward the goal, like Activity rings.
- The person is in control without the AI: add, rename (the pencil opens an edit sheet), reorder and remove habits on the Habits tab, and tick or untick any earlier day on History. Removing shows Undo in a bar at the top of the screen; its days stay in the data, so Undo (or adding it back with the same name) brings the history back.
- Today's week strip is a picture, not buttons: 24 pt dots are too small to tap, so earlier days are changed on History, where each day is a 44 pt target.
- One accent (Pinto's amber); the only other colour is the danger red on Remove.
- The app sets the note's summary line to "2 of 4 habits today".

## Known gaps
- No weekly goals (three times a week); every habit is daily.
- No reminders: Pinto Notes apps can't send notifications yet.
