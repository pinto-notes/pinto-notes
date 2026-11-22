/// The search copy for the templates that come with a note app: the page's h1, what you can do in
/// the app (its own controls, from each app's docs/README.md in content/templates/<slug>.app), a few
/// questions with FAQPage data, and the how-to post that goes with it. The title and the meta
/// description stay in the template's JSON (seoTitle, description).
///
/// Searches it aims at (checked 13 October 2026, free sources only: Google autocomplete, and
/// RankHero's public keyword pages, whose volumes are third-party estimates): "habit tracker template"
/// (habit tracker, ~110k a month), "budget tracker template" (budget tracker, ~15k), "trip planner"
/// and "itinerary template" (~450k and ~50k), "flashcard maker" (flashcards, ~450k, mostly printable),
/// "workout log template", "home maintenance tracker" and "home maintenance checklist" (not checked).
///
/// Truth: only what the template apps in content/templates/<slug>.app do (they reach the app from
/// this site, so they change when the site deploys) and what Mac 1.2.26 does. There's no iPad app in 1.2.

export type TemplateSeo = {
  h1: string;
  /// What the person does in the app, without their AI: a short title and at most about eight words
  /// each, shown beside the app's capture (Emil, 14 October 2026: the longer lines were too much text).
  can: { name: string; text: string }[];
  /// Things to say to your AI to change the app itself (its data or its code: the app is a small React
  /// project the AI edits through Pinto Notes). Only changes it can make; several fill a known gap from
  /// the app's docs/README.md.
  make: string[];
  faq: { q: string; a: string[] }[];
  /// The how-to post for "make a <thing> with ChatGPT or Claude", where there is one.
  post?: { slug: string; title: string };
};

const IPHONE =
  "Pinto Notes is free for Mac (macOS 26 or later) and iPhone (iOS 26 or later). Your AI can update the app from any device where you use ChatGPT or Claude.";

const AI_SAME_DATA = { name: "Your AI sees the same data", text: "Do it yourself, or ask your AI to." };

export const TEMPLATE_SEO: Record<string, TemplateSeo> = {
  "habit-tracker": {
    h1: "Habit tracker template with its own app",
    make: ["Add stretching, on weekdays only.", "Make water count to 10 glasses.", "Show a year view for each habit.", "Let me add a short note to each day."],
    can: [
      { name: "Tick today in one tap", text: "A tick, or plus and minus for counts." },
      { name: "Set how often", text: "Every day, some weekdays, or times a week." },
      { name: "Skip a day without losing the streak", text: "A skipped day never breaks a streak." },
      { name: "See the month", text: "A calendar per habit. Tap any day to tick it." },
      { name: "Add, rename, reorder and remove habits", text: "All on the Habits tab, with Undo." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this habit tracker free?", a: ["Yes. The template and Pinto Notes are free. To let an AI log days for you, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT keep my habit tracker for me?", a: ["Yes, once Pinto Notes is connected. Say \"walked, read 30 pages, 6 glasses of water\" and it ticks those habits for today in the app's data. You can still tick everything yourself, and the app shows what it changed."] },
      { q: "Can I change the habits?", a: ["Yes, in the app: add, rename, reorder and remove habits on the Habits tab, with Undo after a remove. Each habit can be daily, for some weekdays, or a number of times a week."] },
      { q: "Does it remind me?", a: ["No. Apps in Pinto Notes can't send notifications yet, so the tracker doesn't nag you. Put a reminder in your calendar if you want one."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
  "budget-log": {
    h1: "Budget and expense tracker template",
    make: ["Add a Kids category with 1,000 kr.", "Switch the currency to euros.", "Add rent as a monthly bill on the 25th.", "Show my spending by week."],
    can: [
      { name: "See what's left this month", text: "What's left, by category and by day." },
      { name: "Add an expense in a few taps", text: "Type the amount, pick a category, done." },
      { name: "Set your own budget", text: "Your categories, budgets and currency." },
      { name: "Add bills once", text: "Monthly bills add themselves on their day." },
      { name: "Roll over what's left", text: "What's left or over carries into next month." },
      { name: "Compare with last month", text: "A six-month chart, and this month against last." },
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
    make: ["Add a day for Sintra.", "Add a Beach group to the packing list.", "Show a cost for each booking.", "Add our flight home on Sunday."],
    can: [
      { name: "Count down and see what's open", text: "Days left, bookings paid, items packed." },
      { name: "See each day as a timeline", text: "Each day's plan and bookings in time order." },
      { name: "Share a day", text: "Send a day or the trip as text." },
      { name: "Keep bookings and packing in one place", text: "Tick bookings paid and items packed." },
      { name: "Pack from last time", text: "The packing list stays for the next trip." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this trip planner free?", a: ["Yes. The template and Pinto Notes are free. To let an AI draft the itinerary, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT plan my trip into this itinerary?", a: ["Yes, once Pinto Notes is connected. Ask for a five-day plan and it writes one day at a time into the app's data, three to five lines each. Paste a booking confirmation and it adds the booking with its time and reference."] },
      { q: "Can I change the itinerary myself?", a: ["Yes. Change the trip's name and dates with Edit on the Trip tab, and add, edit or delete days, bookings and packing items. A delete shows Undo. Share sends a day or the whole trip as text."] },
      { q: "Does it show maps or the weather?", a: ["No. There's no map, no weather and no cost per booking. The app has no network access unless you allow a site, and the template doesn't ask for one."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
  "gift-ideas": {
    h1: "Gift list template with its own app",
    make: ["Add Mother's Day for Mum, 300 kr.", "Show what I spent on gifts this year.", "Add a Secret Santa draw for Christmas.", "Let me add a photo to each idea."],
    can: [
      { name: "See what's coming up", text: "The next birthdays and Christmas, with days left." },
      { name: "Know what's bought", text: "Idea, bought, wrapped, given: one tap each." },
      { name: "Keep to a budget", text: "Spent against budget, per person and occasion." },
      { name: "See Christmas for everyone", text: "One total across everyone you buy for." },
      { name: "Never give the same gift twice", text: "Past gifts kept per person, by year." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this gift list template free?", a: ["Yes. The template and Pinto Notes are free. To have an AI save ideas when you hear them, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude keep my gift list?", a: ["Yes, once Pinto Notes is connected. Say \"Mum would love that blue scarf from Arket, 450 kr\" and it saves the idea under Mum with its shop and price. Ask \"what should I get Oskar for under 300?\" and it answers from his likes, his budget and what he was given before."] },
      { q: "Can I set a budget for Christmas?", a: ["Yes. Each person has a budget for each occasion, and Christmas shows one total across everyone: what's spent, what's left and how many gifts are bought. Bought, wrapped and given gifts count; ideas don't."] },
      { q: "Does it remind me before a birthday?", a: ["Not with a notification. Pinto Notes apps can't send them yet. Upcoming lists the next birthdays and holidays with the days left and whether a gift is bought."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
  "study-flashcards": {
    h1: "Flashcard maker and study app",
    make: ["Add ten cards on Spanish verbs.", "Add a reverse mode, answer to question.", "Cap new cards at 20 a day.", "Let me type the answer before it shows."],
    can: [
      { name: "Study what's due", text: "One card at a time, Again to Easy." },
      { name: "Spaced repetition", text: "Cards you know come back later and later." },
      { name: "Keep a streak", text: "Days in a row, and what's due next." },
      { name: "Add cards fast", text: "Paste a list, get a stack of cards." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this flashcard maker free?", a: ["Yes. The template and Pinto Notes are free. To have an AI make the cards from your notes, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude make flashcards from my notes?", a: ["Yes, once Pinto Notes is connected. Paste lecture notes or a chapter and ask for cards: it adds short questions and answers to the app, in box 1, under the topic you name. Check them against your notes before an exam."] },
      { q: "How does it decide what to study?", a: ["Like Anki, made simpler. Each card has an interval: Good multiplies it, Easy jumps further, Hard grows it a little and Again starts it over at one day. The buttons show the next interval before you tap."] },
      { q: "Can I type my answers?", a: ["No. You say to yourself whether you knew it, and tap Again, Hard, Good or Easy. There's no typed answer, multiple choice or picture on a card yet."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
  "meal-plan": {
    h1: "Meal planner and grocery list template",
    make: ["Add a Spices aisle before Dry goods.", "Show how many people each dinner serves.", "Let me share the grocery list as text.", "Plan lunches too, not only dinners."],
    can: [
      { name: "Plan the week's dinners", text: "A dinner a day, who cooks, its recipe." },
      { name: "Get the grocery list made for you", text: "From the dinners, by aisle, merged." },
      { name: "Skip what's in the cupboard", text: "Staples never land on the list." },
      { name: "Tick things off in the shop", text: "In the order you walk the aisles." },
      { name: "Look back at earlier weeks", text: "Copy last week's dinners in one tap." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this meal planner free?", a: ["Yes. The template and Pinto Notes are free. To let an AI plan the week, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude plan my meals into it?", a: ["Yes, once Pinto Notes is connected. Say \"plan dinners for this week, Oskar cooks Tuesday and Thursday\" and it adds the dinners with what each one needs. The grocery list follows by itself, by aisle, without what's always in the cupboard."] },
      { q: "Can I plan the week myself?", a: ["Yes. Tap a day to add its dinner, who cooks and what it needs, or start from a dinner you've had before. Rename, move and remove things on the list, and change the aisles and the cupboard in Settings. A delete shows Undo."] },
      { q: "Does it know recipes or nutrition?", a: ["No. It has no recipe database, no calories and no servings. A dinner can link to your own recipe note, and your AI can suggest dinners."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
  "workout-log": {
    h1: "Workout log template with its own app",
    make: ["Add a rest timer between sets.", "Show my total volume per week.", "Add a 12-week strength program.", "Let me log a session from a photo of my notes."],
    can: [
      { name: "Log a session in one go", text: "Next up in your plan, with last time's sets." },
      { name: "See your personal bests", text: "Per exercise, with the date, updated as you log." },
      { name: "Watch an exercise improve", text: "Est. 1RM or heaviest set, per session." },
      { name: "Keep a weekly goal", text: "This week's sessions against your goal." },
      { name: "Weights and cardio", text: "Reps and weight, or distance and time, in kg or lb." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this workout log free?", a: ["Yes. The template and Pinto Notes are free. To log sessions by telling an AI, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude log my workouts?", a: ["Yes, once Pinto Notes is connected. Say \"did 3x5 squats at 100 kg and a 5 km run\" and it adds the session to the app's data, then tells you whether it beat your best. Ask \"am I getting stronger on bench?\" and it reads the same sessions the app charts."] },
      { q: "How does it work out a personal best?", a: ["For weights, by the estimated one-rep max of your best set: weight times one plus reps over 30, so 100 kg for 5 beats 110 kg for 1. Bodyweight exercises count reps. For runs it keeps the longest distance and the fastest pace."] },
      { q: "What doesn't it do yet?", a: ["It has no rest timer, no plate maths and no programs that add weight for you, and it doesn't read a watch or Apple Health. Your AI can add some of these to the app."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
    post: { slug: "apple-notes-workout-log-template", title: "Apple Notes workout log template, with your bests" },
  },
  "job-hunt": {
    h1: "Job application tracker template",
    make: ["Add a Phone screen stage after Applied.", "Follow up five days after I apply.", "Prep me for the Tideway interview.", "Show how many I applied to each week."],
    can: [
      { name: "See every application by stage", text: "A board from Saved to Offer." },
      { name: "Move a card along", text: "Drag it, or use its Move button." },
      { name: "See what's due today", text: "Follow-ups and interviews, late ones first." },
      { name: "Know your response rate", text: "How many of the jobs you applied to answered." },
      { name: "Prep each interview", text: "Questions, your answers, and what to ask." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this job application tracker free?", a: ["Yes. The template and Pinto Notes are free. To have an AI add jobs from ads you paste, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude add a job ad to the tracker?", a: ["Yes, once Pinto Notes is connected. Paste the ad or its link and it adds a card in Saved with the company, the role, the link, and the salary and contact when the ad gives them. Say you heard back and it moves the card and adds the interview with its date and time."] },
      { q: "Can I change the stages?", a: ["Yes. In Settings you add, rename, reorder and remove stages, and set how many days after applying a follow-up is due. A removed stage's applications move to the stage before it, and Undo puts them back."] },
      { q: "Does it remind me to follow up?", a: ["Not with a notification. Pinto Notes apps can't send them yet. Follow-ups and interviews show under Due on their day, and the board shows each card's next date."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
  "mood-energy-log": {
    h1: "Mood tracker template with its own app",
    make: ["Add a tag for coffee after 2 pm.", "Show a year of moods as small squares.", "Let me log a morning and an evening check-in.", "Show my mood by day of the week."],
    can: [
      { name: "Log a day in a few taps", text: "Mood, energy, sleep, tags and a line." },
      { name: "See the month by mood", text: "A calendar coloured by mood, energy too." },
      { name: "Look at 30 or 90 days", text: "Mood, energy and sleep on one screen." },
      { name: "Find your own patterns", text: "Mood with and without each tag." },
      { name: "Keep your own tags", text: "Add, rename and remove them, with Undo." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this mood tracker free?", a: ["Yes. The template and Pinto Notes are free. To let an AI log your days, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude log my mood for me?", a: ["Yes, once Pinto Notes is connected. Say \"slept 6 hours, mood 3, energy 2, long day at work\" and it logs today. Ask \"how has my energy been on days I exercise?\" and it answers from your own days, with how many days that rests on."] },
      { q: "Can I log days myself?", a: ["Yes. Tap a mood and an energy from 1 to 5, add your hours of sleep, a tag or two and a line. Change or delete any day from the calendar; a delete shows Undo. Your tags and sleep goal are in Settings."] },
      { q: "Does it give health advice?", a: ["No. It shows averages from your own log and how many days each rests on. It doesn't diagnose anything or say what causes what."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
  "home-maintenance": {
    h1: "Home maintenance tracker with its own app",
    make: ["Add the chimney sweep, every autumn.", "Show what I spent per area last year.", "Add a photo of each appliance's label.", "Track the car's service by kilometres too."],
    can: [
      { name: "See what's due", text: "Overdue, this month and coming up, by date." },
      { name: "Mark a job done in one tap", text: "It works out when the job is next." },
      { name: "Weeks, months, years or a season", text: "Every 3 months, or every autumn." },
      { name: "Know what you've spent", text: "Each job's history, and this year's total." },
      { name: "Keep the boring facts", text: "Models, serials, warranties, manuals, contacts." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this home maintenance tracker free?", a: ["Yes. The template and Pinto Notes are free. To tell an AI what you did, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude keep it up to date?", a: ["Yes, once Pinto Notes is connected. Say \"cleaned the gutters today, cost 900 kr\" and it logs the job with its cost, and the app moves the next date on. Ask \"what's due this month?\" and it answers from the same data the app shows."] },
      { q: "Can I keep it up myself?", a: ["Yes. Add, rename, reorder and remove jobs, areas, appliances and contacts in the app. Tap Done when you finish a job, or log one on another day with its cost and a note. A delete shows Undo."] },
      { q: "Does it remind me when something is due?", a: ["Not with a notification. The note's summary line says what's overdue and due this month, and the Due tab lists it. Warranties ending in the next three months are flagged."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
  "gift-ideas": {
    h1: "Gift list template with its own app",
    make: ["Add Mother's Day for Mum, 300 kr.", "Show what I spent on gifts this year.", "Add a Secret Santa draw for Christmas.", "Let me add a photo to each idea."],
    can: [
      { name: "See what's coming up", text: "The next birthdays and Christmas, with days left." },
      { name: "Know what's bought", text: "Idea, bought, wrapped, given: one tap each." },
      { name: "Keep to a budget", text: "Spent against budget, per person and occasion." },
      { name: "See Christmas for everyone", text: "One total across everyone you buy for." },
      { name: "Never give the same gift twice", text: "Past gifts kept per person, by year." },
      AI_SAME_DATA,
    ],
    faq: [
      { q: "Is this gift list template free?", a: ["Yes. The template and Pinto Notes are free. To have an AI save ideas when you hear them, you need ChatGPT on a plan that allows custom apps, or Claude, or Claude Code."] },
      { q: "Can ChatGPT or Claude keep my gift list?", a: ["Yes, once Pinto Notes is connected. Say \"Mum would love that blue scarf from Arket, 450 kr\" and it saves the idea under Mum with its shop and price. Ask \"what should I get Oskar for under 300?\" and it answers from his likes, his budget and what he was given before."] },
      { q: "Can I set a budget for Christmas?", a: ["Yes. Each person has a budget for each occasion, and Christmas shows one total across everyone: what's spent, what's left and how many gifts are bought. Bought, wrapped and given gifts count; ideas don't."] },
      { q: "Does it remind me before a birthday?", a: ["Not with a notification. Pinto Notes apps can't send them yet. Upcoming lists the next birthdays and holidays with the days left and whether a gift is bought."] },
      { q: "Does it work on iPhone?", a: [IPHONE] },
    ],
  },
};

export const templateSeo = (slug: string): TemplateSeo | undefined => TEMPLATE_SEO[slug];
