# Study flashcards: notes for whoever works on this app next

## What it's for
A student studies flashcards a few minutes a day, mostly on their iPhone. Their AI makes the cards from pasted lecture notes or a chapter, and can quiz them in chat too, moving cards between boxes the same way the app does.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- cards: [{ id, q, a, topic, box, seen?, interval?, ease? }]
  - q and a are the question and the answer, short and plain.
  - seen is the day the card was last studied ("yyyy-mm-dd"). New cards have none and are due at once.
  - interval is the days from seen until it's due again; ease (2.5 to start, at least 1.3) is how fast the interval grows.
  - box 1 to 5 follows the interval: 1 up to a day, 2 up to 3 days, 3 up to a week, 4 up to three weeks, 5 longer. It feeds the chart and is what an AI quizzing in chat can sort by.
  - A card from before 1.2.27 has box and seen but no interval: it's due GAP[box] days after seen (1, 2, 4, 8, 16) and is graded from there.
- studied: { "yyyy-mm-dd": count } cards answered each day. Missing is fine.
- Grading (next() in src/lib/cards.ts), like Anki's, simplified: Again: interval 1, ease -0.2. Hard: interval x1.2 (at least 1), ease -0.15. Good: interval x ease (a new card: 1 day). Easy: interval x ease x1.3 (a new card: 4 days), ease +0.15. All set seen to today and add one to studied[today]. An AI quizzing in chat should do the same.
- ids are any unique text ("c21").

## Decisions
- The app starts with no cards. Three sample biology cards used to be in a new deck, due at once: someone else's questions in the person's deck (council round 3). With no cards the Study screen is one step, "Make your first cards" with Add a card, and shows no numbers: no "Nothing due", no "No streak yet", no empty week.
- The calendar can be read without guessing: each column is a week with the month over its first week, today's square has a ring, and the lines beside it say a square is a day and darker is more cards (beside, not under: under made the card too tall for the template library's stage). The streak over it is the run of squares that ends today or yesterday.
- The first screen says how many cards are due and has one big button, Study now, right under it. Topic pills under a "Topics" heading narrow it to one subject; they sit after the button so the picked topic never reads as a second button. The streak card has no heading: "6-day streak" says it.
- A session asks the lowest box first, one card at a time: the question, Show answer, then Again, Hard, Good or Easy, each showing when the card comes back (1d, 8d, 2w): the thing Anki users say makes it feel right. Again asks the card once more at the end of the session. On a Mac, Space shows the answer and 1 to 4 grade. The answer fades in; there is no 3D flip.
- The streak is days in a row with a card studied; the calendar shows the last 12 weeks. Coming up shows how many cards fall due on each of the next seven days, so a pile-up is visible early.
- Adding is fast: the Cards tab starts with the add form; Return in the answer adds the card and puts the cursor back in the question, keeping the topic. Paste many turns "question - answer" lines (also " | ", tab, ": ", or after a question mark) into cards, says how many it found, and has Undo. Search filters the list.
- Two columns from 700 px on Study, from 900 px on Cards.
- The person is in control without the AI: add, edit (tap a card) and delete cards; deleting shows Undo in a bar at the top of the screen.
- The first screen shows the newest card, question over answer, before any chart: it says what a card is, and it is the card your AI (or you) just added, so you can check it.
- The chart (How well you know them) shows where the cards are. It sits on the Cards screen, under the cards. A box has a plain name on screen: 1 New, 2 Shaky, 3 Steady, 4 Strong, 5 Solid (LEVELS in src/lib/cards.ts). The data still says box 1 to 5.
- Coming up names every day by its weekday ("Tue"), tomorrow too: "Tmrw" read as a typo.
- The app sets the note's summary line to "12 cards due today".
- No text under 12 px (0.75rem), Apple's minimum. Tests check text that changes after an action (saving and grading are async) inside waitFor, never on the first find.

- Colour: three ambers, one job each, the same three the Mac app has (src/index.css). The accent (`--amber-accent`, #D96A06 in the light, #F4AD33 in the dark) is for ticks, rings, bars and dots. `text-link` is its ink shade (#A85700 in the light) for amber text. `bg-primary` is the primary button: #BB5B05 with a white label in the light, white with a black label in the dark, as the Mac's own buttons are (dark-mode buttons are white or black, never amber). Before round 5 `--primary` was the ink shade, so a tick, a done day's dot and the button were three different oranges in one view. Letters on an accent fill use `text-mark-text` (the page's ink in the light: white on the accent is 3.5:1).

## Known gaps
- No typed answers or multiple choice; grading is the person's own call.
- No daily limit on new cards, no reversed (answer to question) cards, no cloze deletions, no import of Anki decks (.apkg).
- No images on cards (files could be added with device.photos.pick()).
