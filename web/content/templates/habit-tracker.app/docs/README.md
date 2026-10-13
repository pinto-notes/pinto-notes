# Habit tracker: notes for whoever works on this app next

## What it's for
A daily habit tracker. You tick off each habit for today, or tell your AI what you did and it records the day.

## Data
How data.json is shaped (the person's AI reads and edits it directly):
- collections.habits: [{ id, name, detail? }]: the habits, in the order they show. id is a short slug ("walk").
- collections.days: [{ id, date: "yyyy-mm-dd", done: [habit ids] }]: one record per day that has anything done. Leave a day out rather than writing an empty one; to untick, remove the id from done.

## Decisions
- Today is one tap per habit, and the week is a grid of dots under it: no separate history screen.
- A streak counts back from yesterday while today is still open, so it doesn't drop to 0 each morning.

## Known gaps
- No weekly goals ("3 times a week"): every habit is daily.
- No history beyond this week.
