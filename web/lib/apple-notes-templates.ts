import type { Template } from "./TemplatePicker";

// Each template's Pinto Notes twin (lib/PintoTwin.tsx, experiment B42, 25 Nov 2026): the Pinto template for the same job, as
// the side-by-side pictures show it (public/blog/side-by-side; the weekly review's are its template page's own, drawn by the
// app). The packing list is the same nine things in the trip plan; the others carry their template's example data. Lines
// written by GPT-6.1 Sol (blog-growth/research/templates-hub-deep-pass-2026-11-25.md) or kept from the template's own post.
const sbs = (name: string, w: number, h: number) => ({ src: `/blog/side-by-side/${name}`, width: w, height: h });

/// Written in Markdown, so Edit, Paste as Markdown in Notes on macOS 27 turns each into a title,
/// headings and real checklists. Every one was pasted that way in a clean macOS 27 VM on 8 October
/// 2026. Every list item has words in it: an empty "- [ ]" pastes as the literal text [ ], and an empty
/// "- " disappears.
export const APPLE_NOTES_TEMPLATES: Template[] = [
  {
    title: "Meeting notes",
    pinto: { slug: "meeting-notes", name: "meeting notes", rest: "where ChatGPT or Claude turns your rough notes into the decisions and who does what.",
      twin: { label: "The meeting notes template in Pinto Notes", frame: false,
        line: "Your AI turns rough meeting notes into a summary, decisions and action items with names.",
        apple: "Holds the meeting. You write the decisions and action items yourself.",
        alt: "The Pinto Notes meeting notes template with example data: three action items at the top with Emma's ticked, then the pricing sync in two lines and its two decisions.",
        phone: sbs("meeting-notes-pinto-phone", 780, 1083), desk: sbs("meeting-notes-pinto-mac", 1520, 947) } },
    text: `# Meeting notes
Date:
People:

## Agenda
- First topic

## Notes
- What was said

## Decisions
- What we agreed

## Action items
- [ ] Who: what, by when`,
  },
  {
    title: "Weekly review",
    pinto: { slug: "weekly-review", name: "weekly review", rest: "where your AI asks you five questions on Sunday and writes the week up.",
      twin: { label: "The weekly review template in Pinto Notes",
        line: "Your AI asks five questions and saves your answers in one note, newest week first.",
        apple: "Holds one week's review. You copy the form each week and answer the questions yourself.",
        alt: "The Pinto Notes weekly review template on iPhone: five questions above past reviews, starting with Week of 16 November.",
        phone: sbs("weekly-review-pinto-phone", 780, 1594), desk: sbs("weekly-review-pinto-mac", 1280, 800) } },
    text: `# Weekly review
Week of:

## What went well
- One thing

## What didn't, and why
- One thing

## What I learned
- One thing

## Top three for next week
- [ ] First
- [ ] Second
- [ ] Third`,
  },
  {
    title: "Packing list",
    pinto: { slug: "trip-plan", name: "trip plan", rest: "with a countdown, the days and the bookings next to the packing list.",
      twin: { label: "The same packing list in Pinto Notes",
        line: "Part of a trip plan, next to the days and bookings. The list stays for your next trip.",
        apple: "A blank copy for each trip. You untick it yourself.",
        alt: "The same nine things in the Pinto Notes trip plan's packing list, grouped under Documents, Clothes and Bag, with 0 of 9 packed.",
        phone: sbs("packing-pinto-phone", 780, 1688), desk: sbs("packing-pinto-mac", 1526, 1280) } },
    text: `# Packing list

## Documents
- [ ] Passport or ID
- [ ] Tickets and bookings
- [ ] Travel insurance details

## Clothes
- [ ] Clothes for each day
- [ ] Something warm
- [ ] Comfortable shoes

## Bag
- [ ] Chargers and cables
- [ ] Toiletries
- [ ] Medicines`,
  },
  {
    title: "Groceries by aisle",
    pinto: { slug: "grocery-list", name: "grocery list", rest: "where you tell your AI what you need and it files each item under its aisle.",
      twin: { label: "The grocery list template in Pinto Notes", frame: false,
        line: "Tell your AI what you need in one sentence. It puts each item under its aisle.",
        apple: "Holds the list. You put each thing under its aisle yourself.",
        alt: "The Pinto Notes grocery list template with example data: six aisles and their items, with Bananas and Butter ticked.",
        phone: sbs("grocery-list-pinto-phone", 780, 1593), desk: sbs("grocery-list-pinto-mac", 1520, 1208) } },
    text: `# Groceries

## Fruit and veg
- [ ] Bananas

## Bread and dairy
- [ ] Milk

## Meat and fish
- [ ] Chicken

## Cupboard
- [ ] Pasta

## Frozen
- [ ] Peas

## Household
- [ ] Dish soap`,
  },
  {
    title: "Daily plan",
    pinto: { slug: "weekly-planner", name: "weekly planner", rest: "where your AI puts each task under its day.",
      twin: { label: "The weekly planner template in Pinto Notes", frame: false,
        line: "Your AI files tasks by day in one note. Ask to move unfinished tasks to today.",
        apple: "Holds one day. You move unfinished tasks to tomorrow yourself.",
        alt: "The Pinto Notes weekly planner with example data: Tuesday's tasks with the three ticked ones last, then Wednesday.",
        phone: sbs("daily-planner-pinto-phone", 880, 997), desk: sbs("daily-planner-pinto-mac", 1520, 959) } },
    text: `# Today

## Top three
- [ ] First
- [ ] Second
- [ ] Third

## If there's time
- [ ] Something small

## Notes
- Anything to remember`,
  },
];
