import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-grocery-list-template", { title: "Apple Notes grocery list template, sorted by aisle" });

// Written 20 November 2026 for "apple notes grocery list" (Google autocomplete 20 Nov: apple notes grocery list, apple
// notes grocery list template, ...template free, iphone notes grocery list template, apple notes sort grocery list,
// apple notes organize grocery list; topic-research-2026-11-20.md row 2). The result page that day: Apple Community
// threads asking how to sort the list, a MacRumors thread on Reminders and App Store apps. The honest answer: Notes
// can't sort by aisle, headings can, and Reminders sorts by category. Apple Notes facts, all from earlier posts or
// Apple's pages: Edit, Paste as Markdown (apple-notes-templates, macOS 27); "Automatically sort checked items" in the
// Notes settings, Format, More, Uncheck All (apple-notes-meal-planner-template, from Apple's "Add lists in Notes on
// Mac"); sharing a note to edit together needs everyone on an Apple Account, not on locked notes (Apple,
// support.apple.com/102462, read 17 Nov); Reminders has a Groceries list type from iOS 17 that sorts items into
// categories as you add them (Apple, support.apple.com/105086, read 17 Nov). Pinto side:
// web/content/templates/grocery-list.json (one list by aisle: Fruit and veg, Bread and dairy, Meat and fish,
// Cupboard, Frozen, Household; the AI files each item under its aisle, skips what's already on the list, and clears
// the ticked lines when you're back); sharing from Pinto Notes 1.4 (share-a-note-and-edit-it-together). The picture is
// BlogSnapshots.groceryListForTemplatePost: the template's own example list, drawn offscreen by NoteDetailView.

const TEMPLATE = `# Groceries

## Fruit and veg
- [ ] Apples
- [ ] Spinach
- [ ] Lemons

## Bread and dairy
- [ ] Oat milk
- [ ] Eggs

## Meat and fish
- [ ] Salmon fillets

## Cupboard
- [ ] Tinned tomatoes, 2 cans
- [ ] Rice

## Frozen
- [ ] Peas

## Household
- [ ] Dish soap
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
      intro={<>
        A grocery list in Apple Notes grows in the order things run out, so you walk the shop twice. A heading per aisle fixes most of
        it. Here&apos;s a grocery list template for Apple Notes to paste in, how to share it, and when Reminders is the better tool.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#share", label: "Share it" },
          { href: "#reminders", label: "Notes or Reminders" },
          { href: "#pinto-notes", label: "A list that sorts itself" },
        ]}>
          <p>
            Apple Notes can&apos;t sort a grocery list by aisle, but headings can. Make one note with a heading for each aisle and the items
            as a checklist under it, turn on Automatically sort checked items, and share it with whoever else shops. Copy the template
            below to start.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-grocery-list-template" position="answer" template="grocery-list" title="Want each item filed for you?">
            <p>Pinto Notes works like Apple Notes and has a free grocery list by aisle. Tell ChatGPT or Claude what you need and it puts each thing under the right aisle.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/grocery-list-note" width={1520} height={1444} maxWidth={600}
        alt="A Grocery list note in Pinto Notes on a Mac: headings Fruit and veg, Bread and dairy, Meat and fish and Cupboard, each with a checklist, with Bananas and Butter ticked."
        caption="A grocery list by aisle in Pinto Notes. The same layout works in Apple Notes. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one list, a heading per aisle</h2>
      <p>
        Put the aisles in the order you walk your shop, and you go through it once. Rename them to fit: a Deli, a Baby, a Pets. Keep a
        word in every line, because an empty checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="Grocery list for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Paste as Markdown"] },
        { on: "Mac", steps: ["Format", "More", "Uncheck All"] },
      ]} />
      <ul>
        <li>
          <strong>Paste it in.</strong> On a Mac with macOS 27, make a new note and choose Edit, Paste as Markdown: each ## line becomes a
          heading and the items a checklist. On iPhone, type the aisles, then the items, select them and tap the checklist button.
        </li>
        <li>
          <strong>Let ticked items drop.</strong> Turn on Automatically sort checked items in the Notes settings. In the shop, each thing
          you tick drops to the bottom of its aisle, so what&apos;s left is always on top.
        </li>
        <li>
          <strong>Keep one list, not one a week.</strong> Delete the ticked lines when you&apos;re home, or choose Format, More, Uncheck
          All for the things you buy every week.
        </li>
        <li>
          <strong>Pin it.</strong> A pinned note sits at the top of your notes, so it&apos;s the first thing you see in the shop.
        </li>
      </ul>

      <h2 id="share">Share it with the people you shop for</h2>
      <p>
        Share the note and choose that people can make changes. Anyone at home adds what ran out, and whoever is in the shop ticks it
        off; the changes show up on every phone. Everyone needs an Apple Account, and a locked note can&apos;t be shared to edit.
      </p>
      <p>
        If you plan dinners first, the <a href="/blog/apple-notes-meal-planner-template">Apple Notes meal planner</a> keeps the week&apos;s
        meals and this list in one note, and the <a href="/blog/apple-notes-recipe-template">recipe template</a> keeps each recipe&apos;s
        ingredients as a checklist you can shop from. More notes to paste in are in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="reminders">Notes or Reminders?</h2>
      <p>
        Be fair to Reminders: since iOS 17 it has a Groceries list type that sorts what you add into categories by itself, which is the
        one thing Notes can&apos;t do. If all you want is a list that sorts, use it.
      </p>
      <p>
        Notes wins when the list lives next to other things: a meal plan, a recipe, a note about who&apos;s coming for dinner. It also
        lets you choose the aisles and their order, where Reminders chooses its own categories.
      </p>

      <h2 id="limits">Where a grocery list in Notes stops</h2>
      <ul>
        <li><strong>You do the sorting.</strong> Every item goes under its aisle by hand, so a quick add on the way out lands at the bottom.</li>
        <li><strong>No duplicate check.</strong> Two people add milk, and you buy two.</li>
        <li><strong>Clearing is by hand.</strong> After the shop, the ticked lines stay until you delete them.</li>
      </ul>

      <h2 id="pinto-notes">A grocery list that sorts itself</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/grocery-list">grocery list</a> template is one list by aisle: fruit and veg, bread and
        dairy, meat and fish, the cupboard, frozen and household.
      </p>
      <p>
        Tell your AI what you need, even in one long sentence: &ldquo;we need eggs, two cans of tomatoes, spinach and dish soap&rdquo;. It
        files each thing under its aisle and skips what&apos;s already on the list. When you say you&apos;re back from the shop, it clears
        the ticked lines and tells you what&apos;s left. You can still type and tick every item yourself, and you
        can <a href="/blog/share-a-note-and-edit-it-together">share the note and edit it together</a>, with everyone&apos;s changes
        showing as they type. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
    </PostPage>
  );
}
