# Study flashcards: notes for whoever works on this app next

## What it's for
A student studies flashcards a few minutes a day, mostly on their iPhone. Their AI makes the cards from pasted lecture notes or a chapter, and can quiz them in chat too, moving cards between boxes the same way the app does.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- cards: [{ id, q, a, topic, box, seen }]
  - q and a are the question and the answer, short and plain.
  - box is 1 to 5 (Leitner boxes). New cards start in box 1 with no seen.
  - seen is the day the card was last studied ("yyyy-mm-dd").
- A card is due when it has no seen, or when seen plus its box's gap has come: box 1 after 1 day, 2 after 2, 3 after 4, 4 after 8, 5 after 16 (GAP in src/lib/cards.ts).
- Grading: knew it moves the card up one box (at most 5); didn't know puts it back in box 1. Both set seen to today. An AI quizzing in chat should do the same.
- ids are any unique text ("c21").

## Decisions
- The first screen says how many cards are due and has one big button, Study now. Topic pills narrow it to one subject.
- A session asks the lowest box first, one card at a time: the question, Show answer, then Didn't know or Knew it. The answer fades in; there is no 3D flip.
- The person is in control without the AI: add, edit (tap a card) and delete cards; deleting shows Undo in a bar at the top of the screen.
- The Boxes chart shows where the cards are, so progress is visible without a streak.
- The app sets the note's summary line to "12 cards due today".

## Known gaps
- No typed answers or multiple choice; grading is the person's own call.
- No images on cards (files could be added with device.photos.pick()).
