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
- The first screen says how many cards are due and has one big button, Study now. Topic pills narrow it to one subject.
- A session asks the lowest box first, one card at a time: the question, Show answer, then Again, Hard, Good or Easy, each showing when the card comes back (1d, 8d, 2w): the thing Anki users say makes it feel right. Again asks the card once more at the end of the session. On a Mac, Space shows the answer and 1 to 4 grade. The answer fades in; there is no 3D flip.
- The streak is days in a row with a card studied; the calendar shows the last 12 weeks. Coming up shows how many cards fall due on each of the next seven days, so a pile-up is visible early.
- Adding is fast: the Cards tab starts with the add form; Return in the answer adds the card and puts the cursor back in the question, keeping the topic. Paste many turns "question - answer" lines (also " | ", tab, ": ", or after a question mark) into cards, says how many it found, and has Undo. Search filters the list.
- Two columns from 700 px on Study, from 900 px on Cards.
- The person is in control without the AI: add, edit (tap a card) and delete cards; deleting shows Undo in a bar at the top of the screen.
- The box chart (How well you know them) shows where the cards are.
- The app sets the note's summary line to "12 cards due today".
- No text under 12 px (0.75rem), Apple's minimum. Tests check text that changes after an action (saving and grading are async) inside waitFor, never on the first find.

## Known gaps
- No typed answers or multiple choice; grading is the person's own call.
- No daily limit on new cards, no reversed (answer to question) cards, no cloze deletions, no import of Anki decks (.apkg).
- No images on cards (files could be added with device.photos.pick()).
