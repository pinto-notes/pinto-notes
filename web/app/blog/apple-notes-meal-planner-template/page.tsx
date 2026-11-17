import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-meal-planner-template", { title: "Apple Notes meal planner template, with the grocery list" });

// Written 17 November 2026 for "apple notes meal planner" (Google autocomplete 17 Nov: apple notes meal plan template,
// apple notes meal planner template, iphone notes meal plan template, using apple notes for meal planning). Why now:
// apple-notes-budget-template, the same template pattern, became the blog's best converter (7 entrants, 2 App Store
// clicks from its card, week to 17 Nov). Apple Notes facts, all from earlier posts or Apple's pages: Edit, Paste as
// Markdown turns #, ## and "- [ ]" lines into a title, headings and checklists and drops empty items
// (apple-notes-templates, apple-notes-ios-27); "Automatically sort checked items" in Notes settings, File, Duplicate
// Note, Format, More, Uncheck All (apple-notes-habit-tracker, from Apple's "Add lists in Notes on Mac"); Add Link to
// another note (apple-notes-ios-27); sharing a note to edit together needs everyone on an Apple Account, up to 100
// people, not on locked notes (Apple, "If you can't collaborate in the Notes app", support.apple.com/102462, read
// 17 Nov); Reminders has a Groceries list type from iOS 17 that sorts items into categories as you add them (Apple,
// "Create grocery lists in Reminders on your iPhone", support.apple.com/105086, read 17 Nov). Pinto side:
// web/content/templates/meal-plan.json (Dinners table with who cooks, Groceries by aisle, Always in the cupboard; the
// AI prompt asks which nights you cook, plans dinners, fills the list by aisle and skips the cupboard). Shots: the
// Apple Notes groceries note from best-notes-app-for-mac; SHOTS.aiEdit is a real Pinto Notes capture.

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
      intro={<>
        Deciding what&apos;s for dinner at six, then finding out there&apos;s no rice. A meal plan fixes both, and Apple Notes can hold one
        next to the grocery list it needs. Here&apos;s a template to paste in, how to set it up so the list works in the shop, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#better", label: "Make it work better" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A plan that writes the list" },
        ]}>
          <p>
            Apple Notes has no meal planner, but one note does the job. Put the week&apos;s dinners at the top, one line a day, and the
            groceries below as checklists under a heading per aisle. Copy the template below.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-meal-planner-template" position="answer" title="Want the grocery list written for you?">
            <p>Pinto Notes works like Apple Notes and has a free meal plan template. Tell ChatGPT or Claude what you feel like this week and it plans the dinners and writes the grocery list by aisle, without what&apos;s already in the cupboard.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="A Groceries note in Apple Notes on a Mac: a checklist of eight items to buy, with Sourdough, Eggs and Spinach ticked and sorted to the bottom."
        caption="A grocery checklist in Apple Notes on a Mac. With Automatically sort checked items on, what's in the basket drops to the bottom." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note per week</h2>
      <p>
        A week of dinners for two, as an example. Change the dinners first, then the groceries they need. Keep every line with a word
        in it, because an empty checklist item doesn&apos;t survive the paste. The last heading is a plain list of what you always have,
        so you don&apos;t buy olive oil every week.
      </p>
      <Keep title="Meal planner for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="The same Markdown pasted twice in Apple Notes on macOS 27: with Command-V the symbols stay as text, and with Edit, Paste as Markdown it becomes a heading, a list and bold text."
        caption="Plain paste on the left, Paste as Markdown on the right. Checklist lines work the same way." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, make a new note and choose Edit, Paste as Markdown. The # line becomes the title, each ## line a
        heading, the dinners stay a list and the groceries become checklists. A plain Command-V keeps the symbols as text. On iPhone,
        type the lines, select the groceries and tap the checklist button.
      </p>
      <p>
        Then turn on Automatically sort checked items in the Notes settings. In the shop, each thing you tick drops to the bottom of its
        list, so what&apos;s left stays on top.
      </p>

      <h2 id="better">Make it work better</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "Duplicate Note"] },
        { on: "Mac", steps: ["Format", "More", "Uncheck All"] },
      ]} />
      <ul>
        <li>
          <strong>Next week from this one.</strong> On Sunday, choose File, Duplicate Note, change the dinners, and click in each aisle
          and choose Format, More, Uncheck All. Most weeks share half their groceries.
        </li>
        <li>
          <strong>Recipes one tap away.</strong> Keep each recipe in its own note and link it from its dinner with Add Link. On iOS 27
          and macOS 27 a link can point at a heading too, so &ldquo;Ingredients&rdquo; opens right where you need it.{" "}
          <a href="/blog/apple-notes-ios-27">What&apos;s new in Apple Notes in iOS 27</a> has the details.
        </li>
        <li>
          <strong>Shared with whoever cooks.</strong> Share the note and let people make changes. Whoever is in the shop ticks things off,
          and the other phone sees it. You both need an Apple Account, and a locked note can&apos;t be shared this way.
        </li>
      </ul>
      <p>
        If you&apos;d rather see the week as a grid with a column for who cooks, Format, Table makes one;{" "}
        <a href="/blog/apple-notes-tables">tables in Apple Notes</a> shows how. For more notes to paste in the same way, see{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a meal planner in Notes stops</h2>
      <ul>
        <li><strong>The list is by hand.</strong> Notes doesn&apos;t know a curry needs coconut milk. You read each recipe and type what it needs, every week.</li>
        <li><strong>No sorting by aisle.</strong> You decide where lemons go. Reminders has a Groceries list that sorts items by section as you add them, but then the list lives apart from the dinners.</li>
        <li><strong>No memory of what you have.</strong> Notes can&apos;t tell you there&apos;s rice at home. The cupboard list helps only if you read it before you write the groceries.</li>
        <li><strong>No ideas.</strong> When nobody knows what to cook, the note waits.</li>
      </ul>
      <p>
        Sharing is the part Notes does well. Planning the dinners and turning them into a list is the part you still do yourself.
      </p>

      <h2 id="pinto-notes">A meal plan that writes the grocery list</h2>
      <Figure shot={SHOTS.aiEdit} caption="A Groceries note in Pinto Notes on a Mac. The five lines ChatGPT just added are tinted, with Undo at the bottom." />
      <p>
        That&apos;s why I made Pinto Notes. It looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your
        notes from the chat you already use. The free <a href="/templates/meal-plan">meal plan</a> template is a note with the
        week&apos;s dinners and who cooks, the groceries by aisle, and what&apos;s always in the cupboard.
      </p>
      <p>
        On the weekend, ask your AI to plan the week. It asks which nights you&apos;re cooking and what to skip, suggests dinners, fills
        in the week, then writes the grocery list by aisle and leaves out what&apos;s already in the cupboard. Say &ldquo;add oat milk&rdquo;
        on Wednesday and it lands under the right aisle. Every line it adds is tinted, with Undo, and every
        earlier version of the note is kept. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed.
      </p>
    </PostPage>
  );
}
