# Workout log: notes for whoever works on this app next

## What it's for
A person who trains a few times a week logs each session, often on their phone between sets or right after. They want to see their personal bests and whether they're getting stronger, and to know what's next. Their AI logs sessions for them too ("did 3x5 squats at 100 kg and a 5 km run"), says whether that was a best, and answers questions like "am I getting stronger on bench?".

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- exercises: [{ id, name, kind }]. kind is "weight" (sets of reps and weight) or "cardio" (distance and time). id is a lowercase slug of the name ("bench-press"). Renaming changes name, never id.
- plan: [{ id, name, exercises: [exercise id] }]. The workouts, in the order they're done in turn (Legs, Push, Pull, Easy run). Today shows the one after the last session's workout.
  - pick: false marks a suggestion that starts unticked on a new log's first screen. Only the starting data has it; Start doesn't save it.
- sessions: [{ id, date, name, workout?, effort?, note?, items }]. date is "yyyy-mm-dd"; name is what the person calls it ("Legs"); workout is the plan workout's id (missing is fine: a session whose name is a workout's name counts as that workout); effort is 1 to 10; note is a line of text. id is any unique text ("s" and a few letters is fine).
  - items: [{ exercise, sets }]. exercise is an id from exercises. A weight set is { reps, kg } (no kg: bodyweight, like pull-ups); a cardio set is { km, min } (either can be left out; min is minutes, 29.5 is 29:30).
  - **Weights are always kg and distances always km, whatever units says.** A person who says "225 lb" gets kg: 102.06 (lb ÷ 2.20462, two decimals); "3 miles" is km: 4.83.
- units: "kg" or "lb". What the app shows and takes. lb shows miles too. Missing: kg (the first screen guesses lb in the US).
- goal: sessions a week (1 to 14). Missing: 3.
- started: "yyyy-mm-dd". The day the log was set up. Missing is fine once anything is logged.

A new log has exercises (ten), a plan (four suggestions), goal 3, no units, no started and no sessions. **To set one up, write the person's plan (and any exercises it needs), goal and units, and set started to today's date.** Without started (and with no sessions) the app opens on Set up your training and treats the plan as suggestions.

To log a session, append to sessions with a new id. An exercise that isn't in exercises yet goes there first ({ id: slug of the name, name, kind }); the app shows an unknown id with a name made from it, so a missing one isn't lost.

### Personal bests
The app works them out from the sessions; nothing about them is stored. To tell the person whether a session was a best, do the same sums:
- Weight exercises: the estimated one-rep max (Epley) of the best set, weight × (1 + reps ÷ 30), and a single (1 rep) is its own weight. 100 kg × 5 is 116.7, so it beats 110 kg × 1. When no set of an exercise has a weight, the most reps in a set.
- Cardio: the longest distance in a session (its sets added up) and the fastest pace (time ÷ distance, from the sets that have both). Each is its own best.
- A session sets a new best when it beats every session before it (by date, then by order in the list). The first time an exercise is done sets its best but beats nothing, so it isn't marked.

## Decisions
- Today does one job: start the next workout. Start opens the session filled in with the plan's exercises and the sets each had last time, so logging a session like the last one is changing a number or two and Log session. Each exercise's line says what it was last time ("Last: 100 kg × 5") or "First time". The other workouts of the plan are pills over it, for a day that goes differently.
- What's next is the plan's workout after the last session that was one of its workouts (matched by workout, else by name); after the last of the plan it starts again from the first. A session today shows "Done today: Legs" and the card is titled Next time.
- The week runs Monday to Sunday and counts sessions, not workouts or minutes, against the weekly goal: a ring, "2 of 3 sessions", "1 to go" or "Goal met", and the days trained as filled letters. Days to come are never a miss.
- Bests are worked out every time from the sessions (src/lib/workouts.ts, records), never stored: editing or deleting a session can't leave a stale best behind, and the AI doesn't have to keep two places in step.
- One measure for a lift's best, the estimated 1RM, so 100 kg × 5 and 105 kg × 3 compare. Progress also charts the heaviest set. "New best" marks a session that beat an earlier best; the bar after Log session says which exercise ("Logged Legs. New best: Squat.").
- The chart: a point per session, oldest on the left, the last 24; filled dots are sessions that set a best. Up is always better, so pace is drawn with the scale turned over. The line is an SVG that stretches with the width; the dots and labels are HTML so they stay round and readable (src/components/chart.tsx).
- Units: stored in kg and km, shown and typed in kg or lb (lb also shows miles). Switching never changes the data, and the AI never has to know which is shown.
- Sets are typed in text fields with the decimal keypad on iPhone ("102,5" is read as 102.5). Times take "29", "29:30" or "1:05:00". A new set starts as a copy of the one before it. A set with no reps, or a run with no distance and no time, isn't saved, and an exercise with no sets is left out.
- The person is in control without the AI: log, edit and delete sessions (Undo); add, rename, reorder and remove exercises and workouts (Undo); add an exercise from inside a session; change the units and the weekly goal. Removing an exercise takes it out of the plan; its sessions keep it, and Undo brings back both.
- Sessions are in date order, newest first. A session's place is its date: changing the date moves it. Exercises in a session are moved with up and down in the session sheet.
- The first screen's frame is the same in the five template apps (kit.tsx, FirstScreen). Made with an AI, the person is asked the same thing in the app and in the chat; the quiet line ("Pick here, or tell your AI and it sets this up.") says either works. When the person's AI sets the log up while the first screen is open, the app leaves it by itself; if the person had changed anything there, a bar that stays offers it back ("Use mine"). Tested in tests/app.test.tsx, "First use".
- From 700 px Today has two columns (except between 900 and 1100 px, where the sidebar leaves too little room); from 1100 px Progress and Plan do too.
- Colour: one accent (Pinto's amber), and the danger red on Remove. The three ambers have one job each, as in the other template apps (src/index.css): `--amber-accent` for rings, dots and the chart, `text-link` for amber text, `bg-primary` for the primary button (white with a black label in the dark).
- The app sets the note's summary line to "2 of 3 sessions this week, next: Push".
- No text under 12 px (0.75rem), Apple's minimum. Tests check text that changes after an action (saving is async) inside waitFor, never on the first find.

## Known gaps
- No rest timer, no plate maths, and no program that adds weight by itself.
- Sessions on the same day can't be put in another order except by their date.
- No warm-up sets: every set counts toward a best.
- Doesn't read Apple Health or a watch, and can't export yet (share() could write a CSV).
