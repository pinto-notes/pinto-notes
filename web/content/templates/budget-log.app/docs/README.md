# Budget and expenses: notes for whoever works on this app next

## What it's for
A person or a household keeps a monthly budget per category and logs what they spend, often right after paying. Their AI logs expenses for them too ("412 on groceries and 85 on the bus card") and writes month-end comparisons.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- currency: "kr". Shown after amounts; "$", "€" and "£" are shown before them.
- categories: [{ name, budget }]. The monthly budget per category, a plain number.
- expenses: [{ id, date: "yyyy-mm-dd", what, category, amount }]. amount is a positive number in the currency; category is one of the categories' names. id is any unique text ("e" plus a few letters is fine).

To log an expense, append to expenses with a new id. A category that's removed keeps its expenses; they still count, under their old name, with no budget.

## Decisions
- The first screen answers one question: how much is left this month. The bar and the per-day figure ("about 377 kr a day") come from the same numbers.
- Add expense is the one big button; the sheet starts on the amount, with the decimal keypad on iPhone.
- The person is in control without the AI: add, edit (tap an expense) and delete expenses; add, rename (tap the name) and remove categories; change each budget and the currency. Deleting shows Undo in a bar at the top of the screen.
- Over budget is the only place with a second colour (the system's red); everything else uses Pinto's amber.
- Months run from the 1st. Earlier months are one tap back, on Month and on Expenses.
- The app sets the note's summary line to "7,165 kr left in October".

## Known gaps
- No income, no recurring expenses, no budgets that differ by month.
- No export yet (share() could write a CSV).
