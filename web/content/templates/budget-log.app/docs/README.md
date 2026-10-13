# Budget and expenses: notes for whoever works on this app next

## What it's for
A person or a household keeps a monthly budget per category and logs what they spend, often right after paying. Their AI logs expenses for them too ("412 on groceries and 85 on the bus card") and writes month-end comparisons.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- currency: "kr". Shown after amounts; "$", "€" and "£" are shown before them.
- categories: [{ name, budget }]. The monthly budget per category, a plain number.
- expenses: [{ id, date: "yyyy-mm-dd", what, category, amount, rec? }]. amount is a positive number in the currency; category is one of the categories' names. id is any unique text ("e" plus a few letters is fine). rec is the id of the monthly bill it came from.
- recurring: [{ id, what, category, amount, day, last? }]. Monthly bills. On or after its day (the 31st means the month's last day) the app adds the bill's expense once, with rec set, and sets last to that month ("yyyy-mm"). A bill added mid-month whose day has passed is added for this month too. Deleting that expense doesn't bring it back; last says it's done.
- rollover: "yyyy-mm" or null. From that month on, each category's budget carries what was left (or what went over) into the next month. Missing is fine (off).

To log an expense, append to expenses with a new id. To add a bill, append to recurring without last. A category that's removed keeps its expenses; they still count, under their old name, with no budget.

## Decisions
- The first screen answers one question: how much is left this month. The bar and the per-day figure ("about 377 kr a day") come from the same numbers; with bills still to come this month the per-day figure is what's left after them.
- Monthly bills are posted by the app (App.tsx, Bills), not by the AI, so they come in even when nobody asks. They are listed on Month ("Paid" or "Due 25 Oct") and managed on Budget, or made by turning on Every month when adding an expense.
- Roll-over is the YNAB habit people love, without its learning curve: one switch. It starts from the month it's turned on, so old months don't suddenly change this month's numbers.
- Last six months: a bar per month with the budget as a dashed line, and "X kr less than September by the 13th", a fair mid-month comparison (Copilot does this). Tap a bar to open that month.
- From 700 px Month and Budget have two columns.
- Add expense is the one big button; the sheet starts on the amount, with the decimal keypad on iPhone.
- The person is in control without the AI: add, edit (tap an expense) and delete expenses; add, rename (tap the name) and remove categories; change each budget and the currency. Deleting shows Undo in a bar at the top of the screen.
- Over budget is the only place with a second colour (the system's red); everything else uses Pinto's amber.
- Months run from the 1st. Earlier months are one tap back, on Month and on Expenses.
- The app sets the note's summary line to "7,165 kr left in October".

## Known gaps
- No income, no budgets that differ by month, no savings goals per category.
- No export yet (share() could write a CSV).
