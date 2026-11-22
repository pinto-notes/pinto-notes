import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-meal-planner-template", { title: "Apple Notes meal planner template, with the grocery list" });

// Written 17 November 2026 for "apple notes meal planner template"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0, Edit, Paste as Markdown, sorting on): the
// dinners stay a dashed list, the groceries become checklists under their aisle headings; Lemons, Basil, Chicken thighs and
// Tortillas ticked, each dropped to the bottom of its aisle. Sharing a note to edit: Apple's guide, as the post said before.
// Pinto Notes: the meal plan template's note (content/templates/meal-plan.json) with the same dinners, the same groceries and
// the same four ticks, drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySide).

const TEMPLATE = `# Dinners, week of 23 November

## Dinners
- Monday: lemon chicken with rice
- Tuesday: pasta with tomato and basil (Oskar cooks)
- Wednesday: fish tacos
- Thursday: chickpea curry (Oskar cooks)
- Friday: homemade pizza
- Saturday: out with friends
- Sunday: roast chicken and potatoes

## Fruit and veg
- [ ] Lemons
- [ ] Basil
- [ ] Cherry tomatoes
- [ ] Limes
- [ ] Potatoes

## Meat and fish
- [ ] Chicken thighs
- [ ] White fish
- [ ] Whole chicken

## Everything else
- [ ] Tortillas
- [ ] Chickpeas
- [ ] Coconut milk
- [ ] Pizza dough
- [ ] Mozzarella

## Always in the cupboard
- Olive oil, salt, pepper
- Rice, pasta, oats
- Onions, garlic
`;

const FAQ = [
  { q: "Does Apple Notes have a meal planner template?", a: [
    "No. Apple Notes has no meal planner and no templates. One note with the week's dinners at the top and the grocery list as checklists below works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "Can I share a meal plan in Apple Notes with my partner?", a: [
    "Yes. Share the note and choose that people can make changes. You both need an Apple Account, and a locked note can't be shared to edit. Ticks show up on both phones.",
  ] },
  { q: "Should the grocery list go in Notes or Reminders?", a: [
    "Reminders has a Groceries list type, from iOS 17, that sorts items by section as you add them. Notes keeps the list next to the dinners it came from. If you plan the week first, keeping both in one note saves copying.",
  ] },
  { q: "Is there a meal planner that writes the grocery list for you?", a: [
    "Pinto Notes has a free meal plan template: the week's dinners, who cooks, and the groceries by aisle. ChatGPT or Claude can plan the week in it and write the list, leaving out what's always in the cupboard.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-meal-planner-template"
      cover={false}
      intro={<>The week&apos;s dinners at the top, and the groceries they need by aisle under them.</>}
      answer={<>
        <Keep title="Meal planner for Apple Notes" text={TEMPLATE} fold={10}
          note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
        <SideBySide slug="apple-notes-meal-planner-template"
          apple={{ src: "/blog/side-by-side/meal-planner-template-apple-notes", width: 822, height: 1465, line: "Holds the plan and the list. You write the list from the recipes yourself.",
            alt: "The meal planner template in Apple Notes on macOS 27: seven dinners as a list, then groceries by aisle as checklists, with Lemons, Basil, Chicken thighs and Tortillas ticked." }}
          pinto={{ frame: false, title: "The same week in Pinto Notes", line: "Ask your AI to plan the week and it writes the list by aisle, leaving out what's in the cupboard.",
            alt: "The same dinners in the Pinto Notes meal plan template, as a table with who cooks each night, and the same grocery list with four things ticked.",
            phone: { src: "/blog/side-by-side/meal-plan-pinto-phone", width: 780, height: 1600 },
            desk: { src: "/blog/side-by-side/meal-plan-pinto-mac", width: 1520, height: 1208 },
            href: "/templates/meal-plan", button: "Get the meal plan template" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the dinners, then the groceries they need. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the lines, select the groceries and tap the checklist button.</li>
        <li>Turn on Automatically sort checked items in the Notes settings. In the shop, each thing you tick drops to the bottom of its aisle.</li>
        <li>Next week, duplicate the note and untick each aisle: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-trip-planner-template">a trip planner</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
