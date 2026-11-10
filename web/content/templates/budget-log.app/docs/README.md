# Budget and expenses: notes for whoever works on this app next

## What it's for
A person or a household keeps a monthly budget per category and logs what they spend, often right after paying. Their AI logs expenses for them too ("412 on groceries and 85 on the bus card") and writes month-end comparisons.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- currency: "kr". Shown after amounts; "$", "€" and "£" are shown before them. Missing or "" shows plain numbers.
- categories: [{ name, budget }]. The monthly budget per category, a plain number.
- expenses: [{ id, date: "yyyy-mm-dd", what, category, amount, rec? }]. amount is a positive number in the currency; category is one of the categories' names. id is any unique text ("e" plus a few letters is fine). rec is the id of the monthly bill it came from.
- recurring: [{ id, what, category, amount, day, last? }]. Monthly bills. On or after its day (the 31st means the month's last day) the app adds the bill's expense once, with rec set, and sets last to that month ("yyyy-mm"). A bill added mid-month whose day has passed is added for this month too. Deleting that expense doesn't bring it back; last says it's done.
- started: "yyyy-mm-dd". The day the person set their budget. Missing is fine once anything is spent.
- rollover: "yyyy-mm" or null. From that month on, each category's budget carries what was left (or what went over) into the next month. Missing is fine (off).

A new budget has categories (six suggestions, amounts written in kronor), no currency, no started and nothing spent. **To set one up, write the person's categories with their own amounts, set currency to theirs and started to today's date.** Without started (and with nothing spent and no bills) the app opens on Set your monthly budget and treats the categories as suggestions.

To log an expense, append to expenses with a new id. To add a bill, append to recurring without last. A category that's removed keeps its expenses; they still count, under their old name, with no budget.

## Decisions
- Every category must show under "By category": rows that are cut off make the ones on screen disagree with the summary over them (council round 4: "2,829 kr spent of 6,300 kr" over two rows that came to 2,039 of 5,500). So with two columns (700 px or more) Add expense is in the header beside the month's arrows, not over the categories; and a short one-column note (no taller than 640 px: a small phone, the smallest window; kit.tsx, SHORT) draws the summary in two lines and each category in two, without its "left" line.
- The first screen's frame is the same in the four template apps (kit.tsx, FirstScreen): alone in the note with no tabs, a 576 px column in the middle, the title at 2rem, one line saying what to do, a quiet line saying the person's AI can do it too, the form, one primary button and a foot line. Made with an AI, the person is asked the same thing in the app and in the chat; the quiet line ("Pick here, or tell your AI and it sets this up.") says either works.
- When the person's AI sets the app up while the first screen is open, the app leaves it by itself and shows the result. If the person had changed anything there, a bar that stays says so and offers it back ("Use mine"); with nothing touched, nothing more is said. Tested in tests/app.test.tsx, "First use".
- First use (src/screens/setup.tsx): a budget with no started, no expenses and no bills opens on "Set your monthly budget", alone, with no tab bar. The categories in the data are suggestions: change a name or an amount, remove one, add your own, set the currency, then "Start with 6,300 kr a month". Nothing is "left" and there is no per-day figure there: those belong to the person's own numbers (council round 3: a new budget opened on "11,800 kr left, about 561 kr a day" before anyone had set one).
- The currency is a guess from the device's language and region (guessCurrency: "sv-SE" is kr, "en-GB" is £), shown in the first screen's Currency field to change. The suggested amounts are written in kronor; a tenth of each is shown for $, € and £, and they are left blank where the currency isn't known. With no currency, amounts are plain numbers.
- Last six months shows once an earlier month has something spent in it. A first month has no history, so there is no chart and no caption about empty bars.
- The first screen answers one question: how much is left this month. The bar and the per-day figure ("about 377 kr a day") come from the same numbers; with bills still to come this month the per-day figure is what's left after them.
- Monthly bills are posted by the app (App.tsx, Bills), not by the AI, so they come in even when nobody asks. They are listed on Month ("Paid" or "Due 25 Oct") and managed on Budget, or made by turning on Every month when adding an expense.
- Roll-over is the YNAB habit people love, without its learning curve: one switch. It starts from the month it's turned on, so old months don't suddenly change this month's numbers.
- Last six months: a bar per month with the budget as a dashed line, and "X kr less than September by the 13th", a fair mid-month comparison (Copilot does this). Choose a bar to open that month.
- From 700 px Month and Budget have two columns.
- Add expense is the one big button; the sheet starts on the amount, with the decimal keypad on iPhone.
- The person is in control without the AI: add, edit (tap an expense) and delete expenses; add, rename (tap the name) and remove categories; change each budget and the currency. Deleting shows Undo in a bar at the top of the screen.
- Over budget is the only place with a second colour (the system's red); everything else uses Pinto's amber.
- Colour: three ambers, one job each, the same three the Mac app has (src/index.css). The accent (`--amber-accent`, #D96A06 in the light, #F4AD33 in the dark) is for ticks, rings, bars and dots. `text-link` is its ink shade (#A85700 in the light) for amber text. `bg-primary` is the primary button: #BB5B05 with a white label in the light, white with a black label in the dark, as the Mac's own buttons are (dark-mode buttons are white or black, never amber). Before round 5 `--primary` was the ink shade, so a tick, a done day's dot and the button were three different oranges in one view. Letters on an accent fill use `text-mark-text` (the page's ink in the light: white on the accent is 3.5:1).
- Months run from the 1st. Earlier months are one tap back, on Month and on Expenses.
- The app sets the note's summary line to "7,165 kr left in October".
- No text under 12 px (0.75rem), Apple's minimum. Tests check text that changes after an action (saving and grading are async) inside waitFor, never on the first find.

## Known gaps
- No income, no budgets that differ by month, no savings goals per category.
- No export yet (share() could write a CSV).
