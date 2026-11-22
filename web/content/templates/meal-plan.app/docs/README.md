# Meal plan and groceries: notes for whoever works on this app next

## What it's for
A household deciding the week's dinners, usually at the weekend, and shopping for them once. The person plans a few dinners in the app, or asks their AI ("plan dinners for this week, Oskar cooks Tuesday and Thursday"), and the grocery list writes itself: every dinner's ingredients in one list, by aisle, merged, less what's always at home. In the shop they tick things off on their iPhone. A note in Apple Notes can hold the dinners and a checklist, but can't make one from the other, merge two dinners' lemons, or leave out the rice that's always in the cupboard.

## Data
data.json, all under "values" (the person's AI reads and edits it directly):
- dinners: [{ id, date: "yyyy-mm-dd", dish, cook?, recipe?, ingredients: [{ name, qty?, aisle? }] }]. One a day; ids are any unique text ("d7").
  - cook: a name, as on values.cooks. "Me" shows as "You cook". A name that isn't on cooks still shows, and can be picked for other dinners.
  - recipe: a note's path without .md ("Recipes/Lemon chicken"); the app links to it as pinto:Recipes/Lemon chicken.
  - ingredients: what the dinner needs. qty is free text ("2", "400 g", "1 bunch"); aisle is one of values.aisles (anything else shows under Other).
  - A dinner with no ingredients ("Out with friends") is fine.
- extras: [{ id, week, name, qty?, aisle? }]. Things to buy that no dinner needs (oat milk, coffee). week is that week's Monday, "yyyy-mm-dd"; any other day of the same week is read as that week.
- bought: { "yyyy-mm-dd": [key] }. What's ticked off on a week's list, under the week's Monday (the app writes the Monday; a key under another day of the week counts for that week). A key is the thing's name in lower case, without a plural s ("lemon" for Lemons; itemKey in src/lib/meals.ts). Leave it to the app: the person ticks in the shop.
- cooks: ["Me", "Oskar"]. Who can cook.
- aisles: ["Fruit and veg", "Bakery", "Meat and fish", "Dairy and eggs", "Dry goods", "Tins and jars", "Frozen", "Other"]. In the order the person walks the shop: the list follows it. Other is always shown last, even if removed.
- cupboard: ["Olive oil", "Salt", …]. Always at home: left off every list, whatever the dinners need.

**To plan dinners:** add { id, date, dish, cook, ingredients } to dinners, one per day, with each ingredient's aisle. Don't add the groceries anywhere else: the app makes the list from the ingredients. A new cook's name goes in cooks too. **To add something to buy** that isn't for a dinner, add it to extras with the week's Monday. **Keep earlier weeks**: don't delete past dinners; the person looks back at them and copies them.

A new meal plan has no dinners, cooks ["Me"], the eight aisles and eight cupboard staples.

## The list (src/lib/meals.ts, groceryList)
- A week runs Monday to Sunday. Its list is every ingredient of the dinners dated in it, then its extras.
- The app opens on this week. On a Saturday or Sunday it opens on next week instead when next week has a dinner and this week has none left from today on, so dinners planned at the weekend (by the person or their AI) and their list are what shows; tonight's dinner keeps this week. "Back to this week" goes to the week that's ending.
- To plan "this week" on a Saturday or Sunday, plan the week from the coming Monday, and say so.
- One line per thing: names are matched by itemKey (case, spaces and a plural s or es don't matter: "Lemons", "lemon" and "Lemon " are one). The line keeps the first name written.
- Amounts are added up when they share a unit ("2" and "1" are 3; "400 g" and "200 g" are 600 g; "1 tin" and "2 tins" are 3 tins; "1 bunch" twice is 2 bunches). Amounts that don't add up are both kept: "1 bunch + a handful".
- The line's aisle is the first one given for it; one that isn't on aisles goes under Other.
- Anything on cupboard is left off, and named under the list ("Left off, already in the cupboard: Rice, Garlic").
- Under each line, the dinners it's for.

## Decisions
- Three tabs, one job each: Week (plan), Groceries (shop), Settings (the household). The app opens on this week; Dinners and Groceries show the same week, and the arrows step through weeks. "Back to this week" sits under the title, on its own line, so a long title ("Week of 9 November") keeps its room on a 320 pt phone.
- Weeks: next week starts empty (nothing to clear), earlier weeks stay as they were, and the Week tab lists the earlier weeks that have dinners. An earlier week can be copied onto this week's free days (with Undo): the cheapest plan is last week's.
- A new dinner can start from one you've had before (Had before, in its sheet): the dish, its recipe and its ingredients come with it, so a dinner's groceries are typed once. Dinners already on this week aren't offered.
- A new ingredient goes in the aisle that thing went in last time (any week), and so does a thing typed on the list; the person can pick another.
- A dinner moved to a day that has one swaps with it (the sheet says so first). A new dinner goes on a free day: the taken days can't be picked.
- Taking a thing off the list takes it out of that week's dinners and extras (the list is made from them; there's no second copy to fall out of step). Undo puts it back. To stop buying something every week, the sheet's "Always in the cupboard" adds it to cupboard. Things run low? Remove them from the cupboard in Settings and they're back on the list.
- Renaming a thing on the list renames it in that week's dinners; moving it to another aisle moves it there too. An amount set by hand (an extra) is changed on the list; one from dinners is changed in the dinner.
- Renaming an aisle renames it in every week's ingredients and extras; removing one leaves them where they are and shows them under Other (Undo brings the aisle back). Renaming a cook renames them on their dinners; removing one keeps them on past dinners.
- Ticked things drop to the bottom of their aisle and spring once when ticked (not when the list opens; off with Reduce Motion). Aisles sit side by side on a wide note (two from 700 px, three from 1100).
- Week has two columns from 1100 px: the dinners, and the list in short with the earlier weeks. Under that, one column.
- Undo for deletes in the app's own bar at the top, as in the other template apps (kit.tsx).
- The note's summary line: "Tonight: Fish tacos · 9 to buy", or "5 dinners this week · 9 to buy", or "No dinners planned this week".
- Colour and type as in the other template apps: one accent (Pinto's amber) for ticks, the bar and tonight's day; `text-link` for amber text; `bg-primary` for the primary button (white in dark mode). No text under 12 px.
- Tests check text that changes after an action inside waitFor or a find, never on the first get; an Undo is clicked after its own message is on screen.

## Known gaps
- No servings: amounts are what the dinner needs as written.
- Matching is by name only: "Chicken thighs" and "Chicken" are two lines, and "Tomatoes" and "Cherry tomatoes" are two lines.
- No sharing of the list yet (share() could send it as text), and no shared ticking between two phones beyond sync.
- No drag to reorder dinners or aisles: the day picker and the arrows do it.
