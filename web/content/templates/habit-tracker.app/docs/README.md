# Habit tracker: notes for whoever works on this app next

## What it's for
A person building a few small daily habits ticks them off on their iPhone, often in bed or on the way out. Their AI logs days for them too ("walked, read 30 pages, 6 glasses") and answers questions like "which habit did I miss most this month?".

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- habits: [{ id, name, detail?, target, unit?, days?, perWeek? }]. id is a lowercase slug of the name ("no-phone-in-bed"). target 1 is a yes/no habit; a target above 1 is counted (Water, target 8, unit "glasses").
  - days: the weekdays the habit is for, 0 Monday to 6 Sunday ([0,1,2,3,4] is weekdays). Missing or empty: every day.
  - perWeek: a weekly goal instead of a daily one (3 is any three days a week). Its streak counts weeks.
- days: { "yyyy-mm-dd": { habitId: amount } }. A habit counts as done that day when amount >= its target. A day with nothing done has no key.
- skips: { "yyyy-mm-dd": [habitId] }. Days a habit was skipped on purpose (ill, travelling). Missing is fine (data from before 1.2.27 has none).

To log a day, set days[date][habitId]: 1 for a yes/no habit, the count for a counted one. To skip one, add its id to skips[date]. Keep ids as they are: renaming a habit changes name, never id.

## Decisions
- Today is the first screen and does one job: tick today. Habits not for today (a weekday habit on Sunday, a weekly goal already met) wait under Not today and aren't in today's count. The ring is this week (Monday to today), habit-days done of habit-days due; it never punishes days that haven't happened, days a habit isn't for, or skipped days.
- A streak counts days in a row up to today; today doesn't break it until it's over. Days a habit isn't for and skipped days neither count nor break it (streak anxiety is the most common complaint about habit apps; a skip is the honest way out). A weekly goal's streak counts weeks.
- Ticking a habit gives a small spring and a ring that fades (CSS, once, off with Reduce Motion). When everything due is done, the card says "All done today" with a check in the ring. No confetti: it's a daily app.
- Tapping a habit's name opens its page: streak, best run, this month's share, the month as a calendar, Skip today and Edit.
- Month: a calendar per habit (two or three across on a wide note). A tap ticks a day, a second skips it, a third clears it.
- From 700 px Today has two columns: the week card and a grid of every habit's week on the left, the list on the right.
- Counted habits get minus and plus buttons, and the plus button's ring fills toward the goal, like Activity rings.
- The person is in control without the AI: add, rename (the pencil opens an edit sheet), reorder and remove habits on the Habits tab, and tick, skip or clear any earlier day on Month or on the habit's page. Removing shows Undo in a bar at the top of the screen; its days stay in the data, so Undo (or adding it back with the same name) brings the history back.
- Today's week strip is a picture, not buttons: 24 pt dots are too small to tap, so earlier days are changed on Month, where each day is a 44 pt target.
- One accent (Pinto's amber); the only other colour is the danger red on Remove.
- The app sets the note's summary line to "2 of 4 habits today" (or "All 4 habits done today").
- No text under 12 px (0.75rem), Apple's minimum. Tests check text that changes after an action (saving and grading are async) inside waitFor, never on the first find.

## Known gaps
- No notes per day, no habit icons or colours, no year view.
- No reminders: Pinto Notes apps can't send notifications yet.
