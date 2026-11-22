# Home maintenance: notes for whoever works on this app next

## What it's for
Keeping on top of the jobs a home needs, a few times a year: the smoke alarms, the boiler service, the gutters, the dishwasher filter. The person opens it to see what's due, marks a job done in one tap, and looks up the boiler's model or the plumber's number when something breaks. Or they tell their AI ("cleaned the gutters today, cost 900 kr") and ask it ("what's due this month?"). A note in Apple Notes can list the jobs, but can't work out when each is next, sort them by what's late, add up what they cost this year, or flag a warranty about to run out.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- jobs: [{ id, name, area?, every, last?, contact?, cost?, note? }]. Ids are any unique text ("j7").
  - every: how often. "2 weeks", "1 month", "3 months", "6 months", "1 year", "2 years", or a season: "spring" (March to May), "summer" (June to August), "autumn" (September to November), "winter" (December to February). The app also reads "monthly", "yearly", "quarterly", "every 3 months" and "fall", and writes the short form.
  - last: the last day it was done, "yyyy-mm-dd". Leave it out if it's never been done.
  - area: one of values.areas (anything else shows under Other).
  - contact: the id of one of values.contacts.
  - cost: what it usually costs, a plain number in values.currency (1450, not "1 450 kr"). Mark done logs it.
- history: [{ id, job, date, cost?, note? }]. Each time a job was done; job is the job's id, date "yyyy-mm-dd", cost a number.
- areas: ["Kitchen", "Bathroom", "Heating", "Outside", "Garden", "Car", "Safety"]. In the person's order: the Jobs screen follows it.
- appliances: [{ id, name, area?, model?, serial?, bought?, warranty?, manual?, note? }]. bought and warranty (the day the warranty ends) are "yyyy-mm-dd"; manual is a web address.
- details: [{ id, name, value }]. Home details: "Water stopcock": "Under the kitchen sink".
- contacts: [{ id, name, trade?, phone?, email?, note? }]. trade: "Plumber", "Electrician".
- currency: "kr". Shown after amounts; "$", "€" and "£" go before. "" means the app guesses from the device.

**When a job is done:** add { id, job, date, cost?, note? } to history and set the job's last to that date (if it's later than last). That's all: the app works out when it's next. A job the person names that isn't in jobs yet: add it first, with every. **Don't delete history**: it's what the year's spending is made of.

**When is a job due (to answer "what's due this month?"):** take the later of last and the newest history date for that job. Add every to it: "3 months" is three calendar months on (31 January and a month is 28 February). A season job is due from the first day of the next start of its season after that date (spring 1 March, summer 1 June, autumn 1 September, winter 1 December) and is late only once that season is over. A job with no last date and no history is due now (a season job: in its season, now or next). Overdue: past its date. Due this month: on or before the last day of this month. Spent this year: the costs in history dated this year.

A new home maintenance app has no jobs (its first screen offers eight usual ones), the seven areas, and nothing else.

## Decisions
- Four tabs, one job each: Due (what to do now), Jobs (the list, by area), History (what was done and spent), Home (appliances, details, contacts). The app opens on Due.
- Due's three groups: Overdue (past its date; a season job, past its season), Due this month (by the month's last day, or in its season now) and Coming up. Each sorted by date. A job never done is due now and says "Not done yet": the person marks it done or sets when they last did it.
- Done marks the job done today in one tap: no sheet. It logs the job's usual cost, sets last to today, and the bar at the top says when it's next, with Undo. A different day, cost or note: "Log a time" in the job's sheet, or "Log a job done" on History; a line in history can be changed or removed later.
- A job's last date is the later of last and its newest history (so an AI that writes only one of them still moves the job on). Removing a history line that set last moves last back to the line before.
- Deleting a job deletes its history (Undo brings both back). Removing an area leaves its jobs and appliances where they are, under Other; renaming one renames it on every job and appliance. Deleting a contact takes them off the jobs that named them (Undo puts them back).
- Order is the person's: areas with arrows in the list, jobs within an area and appliances, details and contacts with Reorder, which shows arrows in place of the row's own button.
- Warranties ending within 90 days are flagged on Home and listed on Due; one that has ended says so.
- Manuals and phone numbers open through device.openURL, so Pinto Notes asks the person first; the links also carry the address as href.
- Costs are numbers in the app's one currency; History adds them up by year and by area.
- The note's summary line: "2 overdue · 3 due this month", or "Nothing due this month · next: Service the boiler, 20 Jan".
- Due has two columns from 1100 px: the jobs, and warranties and what was done lately. History puts its total beside the list. Home puts the contacts beside appliances and details.
- Colour and type as in the other template apps: one accent (Pinto's amber) for Done, due-this-month dates and bars; the danger colour only for late jobs; `text-link` for amber text; `bg-primary` for the primary button (white in dark mode). No text under 12 px.
- Tests check text that changes after an action inside waitFor or a find, never on the first get; an Undo is clicked after its own message is on screen. Their dates are counted from today, so they pass on any day.

## Known gaps
- Seasons are the northern hemisphere's.
- No reminders or notifications (not available to apps yet): the note's summary line and the Due tab are the reminder.
- Jobs that hang on use rather than time ("every 10,000 km", "after 50 washes") need a time instead.
- No photos of receipts or of the appliance's label yet (device.photos.pick() could add them).
- One currency for everything.
