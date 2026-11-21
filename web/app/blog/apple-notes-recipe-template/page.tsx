import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-recipe-template", { title: "Apple Notes recipe template, with a recipe box" });

// Written 20 November 2026 for "apple notes recipe template" (Google autocomplete 20 Nov: apple notes template for
// recipes, apple notes recipe template, apple notes recipe book, use apple notes for recipes, iphone notes recipe
// template, using apple notes for recipes; topic-research-2026-11-20.md row 1). The result page that day: techpp, a
// newsletter, ClickUp, Notelyn and recipe-app listings; none gives a recipe note to paste, they say "duplicate a note".
// Why now: template posts are the converters (budget template 3 App Store of 10 entrants, week to 20 Nov). Apple Notes
// facts, all from earlier posts tried in Notes on macOS 27: Edit, Paste as Markdown turns #, ## and "- [ ]" lines into
// a title, headings and checklists, and an empty item doesn't survive (apple-notes-templates); Format, More, Uncheck
// All (apple-notes-meal-planner-template, from Apple's "Add lists in Notes on Mac"); Edit, Add Link, Command-K, links
// to another note (apple-notes-ios-27, from Apple's "Add links in Notes on iPhone"). Pinto side:
// web/content/templates/recipe-box.json (a Recipe box note with Weeknight, Weekend, Baking and Want to try; the AI
// cleans a pasted recipe into a sub-note with servings and time, the ingredients as a checklist, a From the cupboard
// line and numbered steps, and files its link; the asks "What can I make with chickpeas and spinach?" and "Halve the
// lentil soup for two."). The picture is BlogSnapshots.recipeForTemplatePost: the template's own example recipe as a
// note, drawn offscreen by the Mac app's NoteDetailView.

const TEMPLATE = `# Lentil soup with lemon

Serves 4, 35 minutes. From: Grandma's card

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

## Notes
- Made 14 Nov: needed more lemon.
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
      intro={<>
        Recipes end up in screenshots, open tabs and the back of an envelope. Apple Notes can hold them all in one place if every
        recipe looks the same. Here&apos;s a recipe template for Apple Notes to paste in, an index note to find them again, and where it
        stops being enough.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#recipe-box", label: "A recipe box" },
          { href: "#kitchen", label: "In the kitchen" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A box that files itself" },
        ]}>
          <p>
            Apple Notes has no recipe template, but one note per recipe does the job: the servings and time at the top, the ingredients as
            a checklist, the steps as a numbered list. Keep them in a Recipes folder with one index note that links to each, and copy the
            template below for every new one.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-recipe-template" position="answer" template="recipe-box" title="Want recipes cleaned up for you?">
            <p>Pinto Notes works like Apple Notes and has a free recipe box. Paste a recipe into ChatGPT or Claude and it saves a clean copy, ingredients as a checklist, and files it.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/recipe-note" width={1520} height={776} maxWidth={600}
        alt="A Lentil soup with lemon note in Pinto Notes on a Mac: serves 4, 35 minutes, six ingredients as a checklist with the lentils and onion ticked, a From the cupboard line and three numbered steps."
        caption="A recipe in Pinto Notes, the way the recipe box saves it. The same layout works in Apple Notes." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note per recipe</h2>
      <p>
        Every recipe gets the same four parts, so you can read it at a glance with flour on your hands. The cupboard line keeps oil and
        salt out of the shopping checklist. Keep a word in every line, because an empty checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="Recipe for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, each ## line into a heading and the
        ingredients into a checklist. A plain Command-V keeps the symbols as text. On iPhone, type it in, select the ingredients and tap
        the checklist button.
      </p>

      <h2 id="recipe-box">A recipe box: one index note</h2>
      <p>
        A folder of recipe notes sorts by date, which is no help when it&apos;s Tuesday and you want something quick. Keep one more note,
        Recipe box, with a heading for each kind of meal, and pin it to the top of the folder.
      </p>
      <Keep title="Recipe box index" text={INDEX} />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link"], keys: "⌘K" },
        { on: "iPhone", steps: ["Edit menu", "Add Link"] },
      ]} />
      <p>
        Then turn each name into a link: select it, choose Add Link and pick the recipe&apos;s note. Tapping it opens the recipe. Ideas you
        find but haven&apos;t cooked go under Want to try, so they stop living in your browser tabs.
      </p>

      <h2 id="kitchen">In the kitchen</h2>
      <ul>
        <li>
          <strong>Tick the ingredients while you shop or cook.</strong> The checklist doubles as the list for the shop, and in the
          kitchen it tells you what&apos;s already in the pan.
        </li>
        <li>
          <strong>Reset it for next time.</strong> Click in the ingredients and choose Format, More, Uncheck All.
        </li>
        <li>
          <strong>Write down what changed.</strong> A line under Notes, like &ldquo;needed more lemon&rdquo;, is how a recipe becomes yours.
        </li>
        <li>
          <strong>Search by ingredient.</strong> Notes search reads every word, so searching &ldquo;chickpeas&rdquo; finds every recipe that
          uses them.
        </li>
      </ul>
      <p>
        To plan the week&apos;s cooking from your box, the <a href="/blog/apple-notes-meal-planner-template">Apple Notes meal planner</a>{" "}
        puts the dinners and the shop in one note, and the <a href="/blog/apple-notes-grocery-list-template">grocery list template</a>{" "}
        sorts the shop by aisle. More notes to paste in are in <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a recipe box in Notes stops</h2>
      <ul>
        <li><strong>Every recipe is typed or tidied by hand.</strong> A recipe copied from a blog arrives with the life story, the ads and the comments.</li>
        <li><strong>The index is by hand.</strong> A new recipe isn&apos;t in the box until you add its link.</li>
        <li><strong>No scaling.</strong> Cooking for two from a recipe for six means changing every amount yourself.</li>
        <li><strong>Search finds words, not answers.</strong> It can find chickpeas. It can&apos;t tell you what to make with chickpeas and the spinach that needs using.</li>
      </ul>
      <p>
        For a few favourites, a folder of notes is all you need. For a real collection, the filing is the work, and it&apos;s left to you.
      </p>

      <h2 id="pinto-notes">A recipe box that files itself</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/recipe-box">recipe box</a> template is one note with Weeknight, Weekend, Baking and Want
        to try, and a note for each recipe inside it.
      </p>
      <p>
        Paste a recipe into your AI, page and all. It saves a clean copy as its own note: the servings and time, the ingredients as a
        checklist, what comes from the cupboard, and short numbered steps, without the life story. Then it files the link under the right
        heading. Ask &ldquo;what can I make with chickpeas and spinach?&rdquo; and it looks through the box, or &ldquo;halve the lentil soup
        for two&rdquo; and it does the sums. You can still write and edit every recipe yourself, and every earlier version of a note is
        kept. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The recipes you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
