import type { SiteEvent } from "./posthog";

// The live meal plan on /blog/apple-notes-meal-planner-template (lib/LiveMealPlan.tsx): the Pinto Notes
// Meal plan and groceries template (content/templates/meal-plan.app) running in the post, with its data in
// memory only. Like the live budget (lib/live-budget.ts), the app can't run in a page as it is (it needs
// "amber", Pinto's runtime, and its own Tailwind build), so this is the smallest faithful version of what
// the app does with a week: a dinner a day, and the grocery list made from the dinners, by aisle, one line
// per thing, less what's always in the cupboard. itemKey is the app's, word for word (a test keeps it so),
// and groceryList follows the app's (src/lib/meals.ts) without amounts, extras or ticks.
// 26 November 2026, experiment B44 (blog-growth/research/meal-planner-deep-pass-2026-11-26.md).

export const LIVE_TEMPLATE = "meal-plan";

// The app's own aisles and cupboard, from the template's data.json.
export const AISLES = ["Fruit and veg", "Bakery", "Meat and fish", "Dairy and eggs", "Dry goods", "Tins and jars", "Frozen", "Other"];
export const CUPBOARD = ["Olive oil", "Salt", "Pepper", "Rice", "Pasta", "Oats", "Onions", "Garlic"];
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type Ingredient = { name: string; aisle: string };
export type Dish = { id: string; dish: string; short: string; ingredients: Ingredient[] };

const i = (name: string, aisle: string): Ingredient => ({ name, aisle });
// The first six are the Apple Notes template's dinners, with the ingredients the side-by-side's Pinto
// picture was drawn from (scripts/blog-side-by-side-apps.ts, meal-plan); the last four are more
// weeknight dinners, so a reader can make a week of their own.
export const DISHES: Dish[] = [
  { id: "lemon-chicken", dish: "Lemon chicken with rice", short: "Lemon chicken", ingredients: [i("Chicken thighs", "Meat and fish"), i("Lemons", "Fruit and veg"), i("Rice", "Dry goods")] },
  { id: "pasta", dish: "Pasta with tomato and basil", short: "Tomato pasta", ingredients: [i("Pasta", "Dry goods"), i("Cherry tomatoes", "Fruit and veg"), i("Basil", "Fruit and veg")] },
  { id: "fish-tacos", dish: "Fish tacos", short: "Fish tacos", ingredients: [i("White fish", "Meat and fish"), i("Limes", "Fruit and veg"), i("Tortillas", "Bakery")] },
  { id: "curry", dish: "Chickpea curry", short: "Chickpea curry", ingredients: [i("Chickpeas", "Tins and jars"), i("Coconut milk", "Tins and jars"), i("Onions", "Fruit and veg"), i("Rice", "Dry goods")] },
  { id: "pizza", dish: "Homemade pizza", short: "Pizza", ingredients: [i("Pizza dough", "Bakery"), i("Mozzarella", "Dairy and eggs"), i("Basil", "Fruit and veg")] },
  { id: "roast", dish: "Roast chicken and potatoes", short: "Roast chicken", ingredients: [i("Whole chicken", "Meat and fish"), i("Potatoes", "Fruit and veg"), i("Garlic", "Fruit and veg")] },
  { id: "spaghetti", dish: "Spaghetti with meat sauce", short: "Spaghetti", ingredients: [i("Ground beef", "Meat and fish"), i("Crushed tomatoes", "Tins and jars"), i("Carrots", "Fruit and veg"), i("Onions", "Fruit and veg"), i("Pasta", "Dry goods")] },
  { id: "salmon", dish: "Salmon with green beans", short: "Salmon", ingredients: [i("Salmon", "Meat and fish"), i("Green beans", "Fruit and veg"), i("Lemons", "Fruit and veg"), i("Potatoes", "Fruit and veg")] },
  { id: "stir-fry", dish: "Chicken stir fry", short: "Stir fry", ingredients: [i("Chicken thighs", "Meat and fish"), i("Bell peppers", "Fruit and veg"), i("Noodles", "Dry goods"), i("Soy sauce", "Tins and jars"), i("Garlic", "Fruit and veg")] },
  { id: "omelet", dish: "Veggie omelet", short: "Omelet", ingredients: [i("Eggs", "Dairy and eggs"), i("Spinach", "Fruit and veg"), i("Feta", "Dairy and eggs")] },
];

/** The week the page opens on: Monday to Thursday from the Apple Notes template. */
export const START_WEEK: (string | null)[] = ["lemon-chicken", "pasta", "fish-tacos", "curry", null, null, null];

/** A dinner tapped: off the week if it's on it, else on the first free day (as a new dinner in the app
 *  goes on a free day). A full week stays as it is. */
export function toggle(week: (string | null)[], id: string): (string | null)[] {
  if (week.includes(id)) return week.map((d) => (d === id ? null : d));
  const free = week.indexOf(null);
  return free < 0 ? week : week.map((d, n) => (n === free ? id : d));
}

// From the app's src/lib/meals.ts.
/** One name for one thing, whatever its case or plural: "Lemons", "lemon" and " Lemon " are one. */
export function itemKey(name: string) {
  const s = name.trim().toLowerCase().replace(/\s+/g, " ")
  if (s.endsWith("ies") && s.length > 4) return s.slice(0, -3) + "y"
  if (s.endsWith("oes") && s.length > 4) return s.slice(0, -2)
  if (/(ch|sh|x)es$/.test(s)) return s.slice(0, -2)
  if (s.endsWith("s") && !s.endsWith("ss") && s.length > 3) return s.slice(0, -1)
  return s
}

export type Grocery = { key: string; name: string; aisle: string; for: string[] };

/** The week's list, as the app makes it: every dinner's ingredients, day by day, one line per thing
 *  (merged by itemKey, the first name and aisle kept), in the aisles' order, less what's in the
 *  cupboard, which is named under the list. */
export function groceryList(week: (string | null)[]) {
  const home = new Set(CUPBOARD.map(itemKey));
  const by = new Map<string, Grocery>();
  const leftOut = new Map<string, string>();
  for (const id of week) {
    const d = DISHES.find((x) => x.id === id);
    if (!d) continue;
    for (const ing of d.ingredients) {
      const key = itemKey(ing.name);
      if (home.has(key)) { if (!leftOut.has(key)) leftOut.set(key, ing.name); continue; }
      const g = by.get(key) ?? { key, name: ing.name, aisle: AISLES.includes(ing.aisle) ? ing.aisle : "Other", for: [] };
      if (!g.for.includes(d.dish)) g.for.push(d.dish);
      by.set(key, g);
    }
  }
  const items = [...by.values()];
  const aisles = AISLES.map((name) => ({ name, items: items.filter((g) => g.aisle === name) })).filter((a) => a.items.length);
  return { count: items.length, aisles, leftOut: [...leftOut.values()] };
}

/** The Monday of the week being planned: this week, or the coming one on a Saturday or Sunday, when a
 *  household plans the week ahead (the app opens on next week then too, when it's planned). */
export function plannedMonday(now: Date) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + (day >= 5 ? 7 : 0));
  return d;
}

/** The week as a note for Apple Notes. "markdown" for a Mac, pasted with Edit, Paste as Markdown, like
 *  the post's template; "plain" for iPhone, where Notes pastes a web page's text as it is (B39), so
 *  the lines carry no # or - [ ] marks and the reader turns the groceries into a checklist with the
 *  checklist button. */
export function noteText(week: (string | null)[], monday: Date, format: "markdown" | "plain") {
  const md = format === "markdown";
  const title = `Dinners, week of ${monday.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`;
  const list = groceryList(week);
  const out = [md ? `# ${title}` : title, "", md ? "## Dinners" : "Dinners"];
  week.forEach((id, n) => {
    const d = DISHES.find((x) => x.id === id);
    if (d) out.push(`${md ? "- " : ""}${DAYS[n]}: ${d.dish.charAt(0).toLowerCase()}${d.dish.slice(1)}`);
  });
  for (const a of list.aisles) {
    out.push("", md ? `## ${a.name}` : a.name);
    for (const g of a.items) out.push(`${md ? "- [ ] " : ""}${g.name}`);
  }
  if (list.leftOut.length) out.push("", md ? "## Always in the cupboard" : "Always in the cupboard", `${md ? "- " : ""}${list.leftOut.join(", ")}`);
  return out.join("\n") + "\n";
}

/// Sent once per page view, on the reader's first change to the live meal plan. Only the page and the
/// template are named: what they picked never leaves the page.
export const editedEvent = (path: string, slug: string): SiteEvent =>
  ({ event: "blog_live_template_edited", properties: { path, slug, template: LIVE_TEMPLATE }, leaves: false });
