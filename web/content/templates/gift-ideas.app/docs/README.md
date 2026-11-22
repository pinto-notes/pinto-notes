# Gift ideas: notes for whoever works on this app next

## What it's for
Someone who hears the perfect gift idea in March and forgets it by December. Who they buy for, each person's birthday, Christmas and other days, a budget for each, the ideas they've heard with a link, price and shop, and where each gift is: an idea, bought, wrapped or given. Upcoming answers "what's next, and have I bought it?". Past gifts stay, so nobody gets the same scarf twice. Their AI does the typing: "Mum would love that blue scarf from Arket, 450 kr" saves the idea under Mum, and "what should I get Oskar for under 300?" is answered from his likes, his budget and what he was given before.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- people: [{ id, name, likes?, sizes?, has?, occasions }], in the person's order (People shows them so).
  - id: any unique text ("mum", "oskar"). Keep it as it is; rename by changing name.
  - likes, sizes, has (what they already have): free text, a line or two each.
  - occasions: [{ id, kind, name?, date?, budget? }]. kind is "birthday", "christmas", "anniversary" or "other" (with a name: "Mother's Day", "Name day"). date is "mm-dd", the same day every year ("03-14"); a date with its year ("1958-03-14") is read as its day and month. Christmas has no date: it's settings.christmas, the same for everyone. budget is a number in the currency, for one gift on that occasion. id: unique within the person; "birthday" and "christmas" for those.
- ideas: [{ id, person, title, occasion?, year?, link?, price?, shop?, status, given? }], in the person's order of their ideas.
  - person: a person's id. (Their name works too and is read as that person; write the id.)
  - occasion: an id from that person's occasions, or left out for "any time". (A kind or name, "christmas", works too.)
  - year: which time round the occasion it's for (2026 for Christmas 2026). The app sets it to the occasion's next time when you add or buy one; leave it out and it's the next time.
  - price: a number, no currency ("450", not "450 kr"). shop: where to buy it ("Arket"). link: the address.
  - status: "idea", "bought", "wrapped" or "given". Bought, wrapped and given count against the occasion's budget for that year. A given gift is a past gift: it shows under "Given before" with its year, and given is the day ("yyyy-mm-dd").
- settings: { currency, christmas }. currency is shown with amounts ("kr" after, "$", "€" and "£" before; "" guesses from the device). christmas is "12-24" or "12-25".
- started: "yyyy-mm-dd". Set when the first person is added. With no started and no people the app opens on its first screen.

**When the person tells you an idea** ("Mum would love that blue scarf from Arket, 450 kr"), add { id, person: "mum", title: "Blue scarf", shop: "Arket", price: 450, status: "idea" } to values.ideas, with occasion when they say one; add the person first if they're new. **When they buy, wrap or give one**, set status (and given: today for a given one). **When they mention a size, a like or something the person already has**, add it to that person's sizes, likes or has. **When they ask what to get someone**, read that person's likes, sizes and has, their next occasion's budget less what's bought for it, and their ideas with status "given" (never suggest one of those again), then suggest from their ideas first.

## Decisions
- Upcoming is the first screen, because the question on opening is "what's next, and have I got something?". Every occasion comes round once a year, so the list is all of them, by their next date. Each row: the date as a calendar leaf; who, and Bought (or Wrapped, Given) or Not bought yet; the occasion and the days left (in the accent within two weeks); then spent of the budget as a bar and as "299 of 300 kr" (the currency once). Three short lines rather than columns, so nothing is cut off on a 320 pt iPhone.
- Occasions shared by several people (Christmas, or an "other" occasion of the same name on the same day) are one event: one row on Upcoming, a total card with spent of everyone's budgets, "4 of 6 bought", what's left and who's still to buy for, and its own page with each person's part. Birthdays and anniversaries are one person's.
- A budget is per person per occasion, and counts the gifts for that time round (year): last Christmas's gifts don't use this Christmas's budget. Bought, wrapped and given count; ideas don't.
- Buying an idea that has no occasion puts it on the person's next occasion, so the money shows somewhere. Giving one dates it; its year is the occasion just past (up to 30 days ago) or the next.
- "Given before" is kept per person, newest year first. A new idea whose words match a past gift ("Blue silk scarf" and "Wool scarf") says "Given before: Wool scarf, Christmas 2024" in the sheet. It's a warning, not a block: a second scarf can be the right gift.
- Status is a button on each idea that opens the four choices; the idea opens its sheet. Ideas, occasions and people reorder with an Edit button over their list (up, down, remove), as in Reminders. No dragging: the lists are short.
- Day and month are two pickers, with no year: a birthday's year isn't needed and often isn't known. 29 February falls on the 28th in other years.
- The person is in control without the AI: add, edit, rename, reorder and remove people, occasions and ideas; change likes, sizes and what they have; change the currency and Christmas's day. Every delete shows Undo in a bar at the top. Removing someone removes their ideas too; Undo brings both back.
- First use (src/screens/first.tsx): "Who do you buy gifts for?", alone, with no tabs: name, birthday and Christmas, then Upcoming with their days on it. When the person's AI adds someone while the first screen is open, the app leaves it; if the person had typed something, a bar that stays says so and offers "Add mine".
- Writes go through the store's updater over the data as it is now, not as the screen last drew it (src/lib/gifts.ts), so a tap never drops what the person's AI added a moment before.
- The note's summary line: "6 people. Next: Oskar's birthday in 9 days".
- Three tabs: Upcoming, People, Settings. A person and a shared occasion open on their own screen (Back returns). Upcoming is two columns from 1000 px (the list, then the totals); a person two from 900 px (ideas and past gifts, then occasions and about).
- Colour: three ambers, one job each, the same three the Mac app has (src/index.css). The accent (`--amber-accent`) for bars and soft fills; `text-link` for amber text (days left, Bought); `bg-primary` for the primary button; the danger colour only for a budget gone over. No other colours.
- No text under 12 px (0.75rem), Apple's minimum. Tests check text that changes after an action (saving is async) inside waitFor, never on the first find.

## Known gaps
- No reminders before an occasion: Pinto Notes apps can't send notifications yet. Upcoming is where the next ones are.
- No prices or pictures from a link: the app doesn't fetch shop pages. The person's AI can fill in a price and shop from a link it reads.
- One budget per occasion for the whole gift; no splitting a gift between people.
- No list of what you received, or thank-you notes.
