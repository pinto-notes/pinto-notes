import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-recipe-template", { title: "Apple Notes recipe template, with a recipe box" });

// Written 20 November 2026 for "apple notes recipe template", removed 21 November (PR #735), restored 22 November 2026 in
// pattern E (lib/SideBySide.tsx), Emil's go. Apple Notes: blog-growth/research/apple-notes-side-by-side-more-2026-11-22
// (macOS 27.0, Edit, Paste as Markdown): the # line becomes the title, ## lines headings, the ingredients a checklist and the
// steps a numbered list; 250 g red lentils and 1 onion ticked. The index note pasted the same way (four headings, dashed
// lists). Format, More, Uncheck All and Edit, Add Link are from Apple's Notes guides, as the post said before.
// Pinto Notes: a recipe as the recipe box template saves it (content/templates/recipe-box.json, its demo's sub-note), with the
// same words and the same two ticks, drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySideMore).

const TEMPLATE = `# Lentil soup with lemon

Serves 4, 35 minutes.

## Ingredients
- [ ] 250 g red lentils
- [ ] 1 onion
- [ ] 2 carrots
- [ ] 2 cloves of garlic
- [ ] 1 tsp ground cumin
- [ ] 2 lemons

From the cupboard: olive oil, salt.

## Steps
1. Soften the onion, carrots and garlic in olive oil with the cumin.
2. Add the lentils and a litre of water. Simmer for 20 minutes.
3. Blend half of it, then stir in the lemon juice and salt to taste.
`;

const INDEX = `# Recipe box

## Weeknight
- Lentil soup with lemon

## Weekend
- Roast chicken with potatoes

## Baking
- Banana bread

## Want to try
- Sesame noodles
`;

const FAQ = [
  { q: "Does Apple Notes have a recipe template?", a: [
    "No. Apple Notes has no templates. One note per recipe, with the ingredients as a checklist and the steps as a numbered list, works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "How do I organize recipes in Apple Notes?", a: [
    "Put every recipe in a Recipes folder, one note each, and keep one index note that links to them under headings like Weeknight, Weekend and Baking. Search finds a recipe by any word in it, so an ingredient works too.",
  ] },
  { q: "Can I scale a recipe in Apple Notes?", a: [
    "Not by itself. Notes can do sums you type with Math Results, but it won't halve a list of ingredients. You change each amount by hand.",
  ] },
  { q: "Is there a recipe app that works like Apple Notes?", a: [
    "Pinto Notes looks and works like Apple Notes and has a free recipe box template. Paste a recipe into ChatGPT or Claude and it saves a clean copy with the ingredients as a checklist, then files it in your box.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-recipe-template"
      cover={false}
      intro={<>One note per recipe: the servings, the ingredients to tick off and the steps.</>}
      answer={<>
        <Keep title="Recipe for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-recipe-template" position="answer" title="Want recipes that tidy themselves?">
          <p>Paste a recipe into your AI and Pinto Notes&apos; free recipe box saves a clean copy, with the ingredients as a checklist.</p>
        </PostCta>
        <SideBySide slug="apple-notes-recipe-template"
          apple={{ src: "/blog/side-by-side/recipe-template-apple-notes", width: 937, height: 833, line: "Holds the recipe. You type it out and tidy it yourself.",
            alt: "The recipe template in Apple Notes on macOS 27: Lentil soup with lemon, six ingredients as a checklist with the lentils and onion ticked, and three numbered steps." }}
          pinto={{ frame: false, title: "The same recipe in Pinto Notes", line: "Paste a recipe into your AI and it saves a clean copy like this, then files it in your recipe box.",
            alt: "The same lentil soup in Pinto Notes, as the recipe box saves it: serves 4, the six ingredients with two ticked, the cupboard line and the three steps.",
            phone: { src: "/blog/side-by-side/recipe-pinto-phone", width: 780, height: 912 },
            desk: { src: "/blog/side-by-side/recipe-pinto-mac", width: 1520, height: 818 },
            template: "recipe-box" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the recipe to yours. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type it in, select the ingredients and tap the checklist button.</li>
        <li>Tick the ingredients as you shop or cook. Reset them for next time: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
        <li>Keep one index note, Recipe box, and link each name to its recipe: <MenuPath steps={["Edit", "Add Link"]} keys="⌘K" /></li>
      </Steps>
      <Keep title="Recipe box index for Apple Notes" text={INDEX} fold={10} />
      <p>More for Apple Notes: <a href="/blog/apple-notes-grocery-list-template">a grocery list by aisle</a>, <a href="/blog/apple-notes-meal-planner-template">a meal planner</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
