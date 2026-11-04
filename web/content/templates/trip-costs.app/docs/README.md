# Trip costs: notes for whoever works on this app next

## What it's for
A trip shared by a few people: who paid for what, and who owes whom at the end. Add a cost as it happens ("Dinner, 96, Leo paid, split three ways") and the first screen says what settles it ("Maja owes Sara €160"). No AI is needed. The person's AI can add costs from a pasted receipt or a sentence, and answer "how much did we spend on food".

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- name: the trip's name ("Lisbon"), the title of the first screen.
- currency: "€", "$", "£" or a word like "kr". A sign goes in front (€42), a word after (42 kr).
- people: [{ id, name }].
- costs: [{ id, what, amount, paidBy, date, split, among, shares }]. amount is a number in the currency; paidBy is a person's id; date "yyyy-mm-dd".
  - split "equal": among lists the ids it's split between. Missing or empty: everyone in people.
  - split "shares": shares is { id: number }, each person's share ({ "p1": 2, "p2": 1 } is two thirds and one third). Missing or 0: none.
- payments: [{ id, from, to, amount, date }]. Money paid back to settle up (Mark as paid adds one).
- ids are any unique text ("p1", "c7").

## Decisions
- The first screen answers "who owes whom", in plain sentences: "Leo owes Sara €42". Then one big Add cost button (48 px, at least 44 pt on iPhone), then the costs.
- Settling up takes the fewest payments: the one who owes most pays the one owed most, until everyone is square (src/lib/costs.ts, settle). Everyone's part of a cost is worked out to the cent and adds up to the cost exactly; a cent left over goes to the first people in the list.
- A cost split equally stores who it's split between. Someone who joins later isn't in earlier costs.
- Mark as paid records a payment (with Undo), it doesn't delete costs: the trip's history stays.
- The person is in control without the AI: add, change and delete costs, payments and people; rename the trip and change the currency. Deleting shows Undo in a bar at the top of the screen.
- Removing someone is refused while they paid or share a cost, with the reason: the rest would no longer add up.
- The app sets the note's summary line to "Leo owes Sara €42" (or "All square, €594 in all").
- A note with a table of costs ("What | Paid by | Amount") can become this app in one tap (Make This a Cost Splitter in Pinto Notes): the table's rows come in as costs, the names in Paid by as people, each split equally.
- No text under 12 px (0.75rem), Apple's minimum.

## Known gaps
- One currency per trip; no exchange rates (the network is off unless the person allows a host).
- No receipt photos.
- Shared editing with the others on the trip comes with shared notes; until then, Share a copy.
