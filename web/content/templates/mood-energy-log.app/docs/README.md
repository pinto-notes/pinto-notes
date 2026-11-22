# Mood and energy log: notes for whoever works on this app next

## What it's for
Someone who wants to see what lifts them and what drains them. Each evening they log the day in a few taps, or tell their AI ("slept 6 hours, mood 3, energy 2, long day at work"). After a few weeks the month reads at a glance as a calendar, and Trends answers the questions people actually ask: does exercise help my mood, does a short night cost me the next day. A note in Apple Notes can hold a table of scores, but it can't colour a month by them, draw them, or work out the averages.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- days: { "yyyy-mm-dd": { mood, energy, sleep?, tags?, note? } }. One entry a day, keyed by its date.
  - mood and energy: whole numbers from 1 (low) to 5 (great). Mood words: Awful, Low, Okay, Good, Great. Energy words: Drained, Low, Okay, Good, Full. A number written as text ("3") is read; anything outside 1 to 5 counts as not given, and a day with neither isn't shown.
  - sleep: hours slept the night before, a number (7.5). Text with a comma ("6,5") is read. Left out when not known.
  - tags: names from values.tags (["Exercise", "Work stress"]). Matched without regard to case. A tag a day has that isn't on the list still shows, on that day and in Patterns.
  - note: one short line about the day, in the person's words.
- tags: ["Exercise", "Alcohol", "Social", "Work stress"]. The tags to pick from, in this order.
- logSleep: true. False hides sleep everywhere (the check-in, Today, Month, Trends); hours already logged are kept.
- sleepGoal: 8. The hours the person aims for, from 4 to 12: a dashed line on the sleep chart.

**To log a day:** set days[date] to { mood, energy, sleep, tags, note }, today's date unless the person names another day. Leave out what they didn't say (no guessed sleep, no empty note). If a score isn't clear from their words, ask. A tag that isn't on values.tags goes there too. **Keep earlier days**: never delete one unless asked.

**To answer a question** ("how has my energy been on days I exercise?"): read days and work it out the way Trends does (below), say the numbers and how many days each rests on, and don't claim causes or give medical advice.

A new log has no days, the four tags, sleep on and a goal of 8 hours.

## Numbers (src/lib/mood.ts)
- Averages are plain means of the days that have the value, shown to one decimal without a trailing .0 ("3.6", "4").
- Today's "Last 7 days": today and the six days before. "The week before": the seven days before those.
- Trends: the last 30 or 90 days, today included. A day not logged leaves a gap in the lines; days up to two apart are joined.
- Tags (tagPatterns): for each tag, average mood and energy on the days in the range that have it and the days that don't. Shown as numbers only with at least 3 days on each side (ENOUGH); otherwise "Not enough days yet" with the counts. The difference is the mood with it less the mood without.
- Sleep (sleepPatterns): average energy (and mood) on days after nights under 6 hours, 6 to 7, 7 to 8, and 8 or more, with the days in each.
- Month: days logged and the averages; best days rank by mood, then energy (the three highest), hardest the three lowest that aren't among the best. Shown from 5 days logged.

## Decisions
- Four tabs, one job each: Today (log), Month (look back), Trends (patterns), Settings. The app opens on Today.
- The check-in is the Today screen itself when today isn't logged: no sheet, no extra tap. Mood and energy are five buttons each with the words at the ends; the word for the picked one shows by the label. Log today stays disabled until both are picked. Sleep is a field with half-hour steps; the first step starts from the person's usual night (the last 14 days' average). Nothing the person didn't pick is saved.
- Tags: tap to turn on. "+ Tag" adds one of the person's own to the list and to the day. Renaming a tag renames it on every day; removing it takes it off every day (Undo brings both back), so the patterns never count a tag the person dropped.
- Colour: mood is the accent, from a pale tint (1) to the full accent (5), each mixed with the card so it's solid (--mood-1 to --mood-5 in index.css); days 1 to 3 carry the page's ink and 4 and 5 the ink that reads on the accent, so the numbers read in both modes. Energy is one blue (--energy: deeper in the light, lighter in the dark), as pips under a day and as its line. Sleep bars are a neutral grey so the two lines stand out. The mood line uses the accent's ink shade (--mood-line), which reads on the page.
- Patterns say what tends to go together, with day counts, never what causes what, and the screen says so. No medical words, no scores of "wellbeing".
- Undo for deletes in the app's own bar at the top, as in the other template apps (kit.tsx).
- The note's summary line: "Today: mood 4, energy 3 · slept 7.5 h", or "Not logged today · mood 3.6 this week".
- Two columns on a wide note: Today from 1100 px (check-in and chart, the week beside it), Month from 1100 (calendar, numbers beside it), Trends' charts and patterns side by side from 1100, Settings from 900. No text under 12 px.
- Tests check text that changes after an action inside waitFor or a find, never on the first get; an Undo is clicked after its own message is on screen.

## Known gaps
- One entry a day: no morning and evening check-ins.
- No reminders (Pinto Notes apps can't send notifications yet).
- No export; the person's AI can read data.json and write a summary into a note.
- Patterns compare averages only: no trend lines, no correlation numbers, and nothing about the day after a tag (a late night's effect shows through sleep instead).
