/// The search copy for the templates that come with a note app: the page's h1, what you can do in
/// the app (its own controls, from each app's docs/README.md in content/templates/<slug>.app), a few
/// questions with FAQPage data, and the how-to post that goes with it. The title and the meta
/// description stay in the template's JSON (seoTitle, description).
///
/// Searches it aims at (checked 13 October 2026, free sources only: Google autocomplete, and
/// RankHero's public keyword pages, whose volumes are third-party estimates): "habit tracker template"
/// (habit tracker, ~110k a month), "budget tracker template" (budget tracker, ~15k), "trip planner"
/// and "itinerary template" (~450k and ~50k), "flashcard maker" (flashcards, ~450k, mostly printable).
///
/// Truth: only what the template apps in content/templates/<slug>.app do (they reach the app from
/// this site, so they change when the site deploys) and what Mac 1.2.26 does. The iPhone app isn't on the App Store yet, and there's no iPad app.

export type TemplateSeo = {
  h1: string;
  /// What the person does in the app, without their AI: one line each.
  can: { name: string; text: string }[];
  faq: { q: string; a: string[] }[];
  /// The how-to post for "make a <thing> with ChatGPT or Claude".
  post: { slug: string; title: string };
};

const IPHONE =
  "The Mac app is a free download now, for macOS 26 or later. The iPhone app isn't on the App Store yet, so for now the app runs on your Mac and your AI can update it from any device where you use ChatGPT or Claude.";

const AI_SAME_DATA = { name: "Your AI sees the same data", text: "The app keeps its data with the note. ChatGPT, Claude or Claude Code reads and changes that data when you ask, and the app shows the change." };

export const TEMPLATE_SEO: Record<string, TemplateSeo> = {
  "habit-tracker": {
    h1: "Habit tracker template with its own app",
    can: [
      { name: "Tick today in one tap", text: "Each habit has a tick, or minus and plus buttons for a counted one like 8 glasses of water. Streaks and this week's ring update as you go." },
      { name: "Set how often", text: "A habit can be for every day, for some weekdays, or a number of times a week, like the gym three times. Habits that aren't for today wait under Not today." },
      { name: "Skip a day without losing the streak", text: "Ill or travelling? Skip today on the habit's page. A skipped day, or a day the habit isn't for, doesn't break its streak." },
      { name: "See the month", text: "The Month tab shows a calendar for each habit. Tap a day to tick it, again to skip it, again to clear it." },
      { name: "Add, rename, reorder and remove habits", text: "On the Habits tab. Removing a habit shows Undo, and its days stay in the data, so Undo brings the history back." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this habit tracker free?", a: ["Yes. The template and Pinto Notes are free. To let an AI log days for you, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT keep my habit tracker for me?", a: ["Yes, once Pinto Notes is connected. Say \"walked, read 30 pages, 6 glasses of water\" and it ticks those habits for today in the app's data. You can still tick everything yourself, and the app shows what it changed."] },
      { q: "Can I change the habits?", a: ["Yes, in the app: add, rename, reorder and remove habits on the Habits tab, with Undo after a remove. Each habit can be daily, for some weekdays, or a number of times a week."] },
      { q: "Does it remind me?", a: ["No. Apps in Pinto Notes can't send notifications yet, so the tracker doesn't nag you. Put a reminder in your calendar if you want one."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
    post: { slug: "habit-tracker-with-chatgpt-or-claude", title: "How to make a habit tracker with ChatGPT or Claude" },
  },
  "budget-log": {
    h1: "Budget and expense tracker template",
    can: [
      { name: "See what's left this month", text: "The first screen shows what's left as a number and a bar, each category against its budget, and about how much a day you can spend." },
      { name: "Add an expense in a few taps", text: "Add expense starts on the amount. Tap any expense later to change it, or delete it, with Undo." },
      { name: "Set your own budget", text: "Add, rename and remove categories, change each monthly budget, and pick the currency, on the Budget tab." },
      { name: "Add bills once", text: "Rent and subscriptions go in as monthly bills. The app adds each one's expense on its day, and the first screen shows what's left after the bills still to come." },
      { name: "Roll over what's left", text: "Turn on roll-over and what's left in a category, or what went over, carries into the next month." },
      { name: "Compare with last month", text: "A chart of the last six months, and how this month compares with last month by the same day." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this budget tracker free?", a: ["Yes. The template and Pinto Notes are free, and the app connects to no bank. You add expenses yourself, or tell your AI what you spent."] },
      { q: "Can ChatGPT or Claude log my expenses?", a: ["Yes, once Pinto Notes is connected. Say \"412 on groceries and 85 on the bus card\" and it adds two expenses to the app's data. Ask \"how does October compare with September?\" and it reads the same numbers the app shows."] },
      { q: "Does it connect to my bank?", a: ["No. Nothing is imported. Every expense in it is one you or your AI added."] },
      { q: "What doesn't it do yet?", a: ["It has no income, no budgets that change by month and no savings goals, and it can't export a CSV yet. Your AI can read the expenses and write a summary into the note."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
    post: { slug: "budget-tracker-with-chatgpt-or-claude", title: "How to make a budget tracker with ChatGPT or Claude" },
  },
  "trip-plan": {
    h1: "Trip planner and itinerary template",
    can: [
      { name: "Count down and see what's open", text: "The Trip tab shows how many days are left, bookings paid and items packed. During the trip it says which day it is." },
      { name: "See each day as a timeline", text: "The Days tab puts each day's plan and its bookings in time order. Start a line with a time, like 09:30, to place it." },
      { name: "Share a day", text: "Share sends one day, or the whole trip, as text to a travel partner or a group chat." },
      { name: "Keep bookings and packing in one place", text: "Tick a booking once it's paid and an item once it's packed. The packing list is grouped. Add, edit or delete either, with Undo after a delete." },
      { name: "Pack from last time", text: "Start a new trip and the packing list stays, unpacked, ready for the next one." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this trip planner free?", a: ["Yes. The template and Pinto Notes are free. To let an AI draft the itinerary, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT plan my trip into this itinerary?", a: ["Yes, once Pinto Notes is connected. Ask for a five-day plan and it writes one day at a time into the app's data, three to five lines each. Paste a booking confirmation and it adds the booking with its time and reference."] },
      { q: "Can I change the itinerary myself?", a: ["Yes. Change the trip's name and dates with Edit on the Trip tab, and add, edit or delete days, bookings and packing items. A delete shows Undo. Share sends a day or the whole trip as text."] },
      { q: "Does it show maps or the weather?", a: ["No. There's no map, no weather and no cost per booking. The app has no network access unless you allow a site, and the template doesn't ask for one."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
    post: { slug: "plan-a-trip-with-chatgpt-or-claude", title: "How to plan a trip with ChatGPT or Claude" },
  },
  "study-flashcards": {
    h1: "Flashcard maker and study app",
    can: [
      { name: "Study what's due", text: "Study now asks one card at a time: the question, Show answer, then Again, Hard, Good or Easy. Each button shows when the card comes back. Topic pills narrow it to one subject." },
      { name: "Spaced repetition", text: "Cards you know come back later and later, from a day to weeks and months. Again brings a card back at the end of the session and tomorrow." },
      { name: "Keep a streak", text: "The streak counts days in a row you studied, with a calendar of the last 12 weeks and what's due in the next seven days." },
      { name: "Add cards fast", text: "Return adds a card and starts the next. Paste many turns lines like \"question - answer\" into cards at once. Tap a card to edit it; a delete shows Undo." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this flashcard maker free?", a: ["Yes. The template and Pinto Notes are free. To have an AI make the cards from your notes, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude make flashcards from my notes?", a: ["Yes, once Pinto Notes is connected. Paste lecture notes or a chapter and ask for cards: it adds short questions and answers to the app, in box 1, under the topic you name. Check them against your notes before an exam."] },
      { q: "How does it decide what to study?", a: ["Like Anki, made simpler. Each card has an interval: Good multiplies it, Easy jumps further, Hard grows it a little and Again starts it over at one day. The buttons show the next interval before you tap."] },
      { q: "Can I type my answers?", a: ["No. You say to yourself whether you knew it, and tap Again, Hard, Good or Easy. There's no typed answer, multiple choice or picture on a card yet."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
    post: { slug: "flashcards-with-chatgpt-or-claude", title: "How to make flashcards with ChatGPT or Claude" },
  },
};

export const templateSeo = (slug: string): TemplateSeo | undefined => TEMPLATE_SEO[slug];
