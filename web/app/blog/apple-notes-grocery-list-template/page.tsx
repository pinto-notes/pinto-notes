import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-grocery-list-template", { title: "Apple Notes grocery list template, sorted by aisle" });

// Written 20 November 2026 for "apple notes grocery list", removed 21 November (PR #735), restored 22 November 2026 in
// pattern E (lib/SideBySide.tsx), Emil's go. Apple Notes: blog-growth/research/apple-notes-side-by-side-more-2026-11-22
// (macOS 27.0, Edit, Paste as Markdown): a heading per aisle and the items as checklists; Bananas and Butter ticked. Sharing a
// note to edit needs an Apple Account for each person and doesn't work on a locked note (support.apple.com/102462); Reminders
// has a Groceries list type from iOS 17 (support.apple.com/105086), as the post said before.
// Pinto Notes: the grocery list template's note (content/templates/grocery-list.json) with the same items in the same aisles
// and the same two ticks, drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySideMore).

const TEMPLATE = `# Grocery list

## Fruit and veg
- [ ] Apples
- [ ] Spinach
- [ ] Lemons
- [ ] Bananas

## Bread and dairy
- [ ] Oat milk
- [ ] Sourdough
- [ ] Eggs
- [ ] Butter

## Meat and fish
- [ ] Salmon fillets
- [ ] Minced beef

## Cupboard
- [ ] Tinned tomatoes, 2 cans
- [ ] Rice
- [ ] Coffee

## Frozen
- [ ] Peas

## Household
- [ ] Bin bags
`;

const FAQ = [
  { q: "Can Apple Notes sort a grocery list?", a: [
    "Not by aisle. Notes keeps items in the order you type them. Put a heading for each aisle and add items under the right one, and turn on Automatically sort checked items so what's in the basket drops to the bottom.",
  ] },
  { q: "Notes or Reminders for groceries?", a: [
    "Reminders has a Groceries list type, from iOS 17, that sorts items into categories as you add them. Notes is better when the list sits next to a meal plan or recipes, or when you want your own aisles in your shop's order.",
  ] },
  { q: "Can my family add to the same grocery list?", a: [
    "Yes. Share the note and let people make changes. Everyone needs an Apple Account, and a locked note can't be shared to edit. Ticks and new items show up on every phone.",
  ] },
  { q: "Is there a grocery list that sorts itself?", a: [
    "Pinto Notes has a free grocery list template sorted by aisle. Tell ChatGPT or Claude what you need, even in one long sentence, and it files each item under its aisle.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-grocery-list-template"
      cover={false}
      intro={<>One list with a heading per aisle, so you walk the shop once.</>}
      answer={<>
        <Keep title="Grocery list for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-grocery-list-template" position="answer" title="Want a grocery list that sorts itself by aisle?">
          <p>Tell your AI what you need, in one sentence, and Pinto Notes&apos; free grocery list puts each thing under its aisle.</p>
        </PostCta>
        <SideBySide slug="apple-notes-grocery-list-template"
          apple={{ src: "/blog/side-by-side/grocery-list-template-apple-notes", width: 489, height: 1283, line: "Holds the list. You put each thing under its aisle.",
            alt: "The grocery list template in Apple Notes on macOS 27: six aisles as headings with a checklist under each, Bananas and Butter ticked." }}
          pinto={{ frame: false, title: "The same list in Pinto Notes", line: "Tell your AI what you need, in one sentence, and it puts each thing under its aisle.",
            alt: "The same grocery list in the Pinto Notes grocery list template: the same six aisles and items, with Bananas and Butter ticked.",
            phone: { src: "/blog/side-by-side/grocery-list-pinto-phone", width: 780, height: 1593 },
            desk: { src: "/blog/side-by-side/grocery-list-pinto-mac", width: 1520, height: 1208 },
            template: "grocery-list" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Put the aisles in the order you walk your shop. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the aisles and items, select the items and tap the checklist button.</li>
        <li>Turn on Automatically sort checked items in the Notes settings. Each thing you tick drops to the bottom of its aisle.</li>
        <li>Pin the note, and share it so everyone at home can add to it. Untick the weekly things when you&apos;re back: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-meal-planner-template">a meal planner</a>, <a href="/blog/apple-notes-recipe-template">a recipe template</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
