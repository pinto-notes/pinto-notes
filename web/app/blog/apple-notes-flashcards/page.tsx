import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-flashcards", { title: "Apple Notes flashcards: a template to study with" });

// Written 21 November 2026 for "apple notes flashcards"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-side-by-side-more-2026-11-22 (macOS 27.0, a plain Command-V, then the five lines
// from Question to the last answer selected and the Table button pressed, then the line under Missed this time made a checklist
// with the Checklist button). Notes can't hide a column, flip, shuffle or know which card is due (apple-notes-tables, tried on
// macOS 27), so the post says to cover the right column. Format, More, Uncheck All: apple-notes-meal-planner-template.
// Pinto Notes: the study notes and flashcards template's app (content/templates/study-flashcards.app) with the same four cards,
// rendered with scripts/page-render on 25 November: the missed card is due with one other, a five-day streak, and the newest
// card under it (data in the side-by-side report). The app's rules are its docs/README.md.

// Tabs between the question and the answer: select those lines in Notes and press the Table button.
const TEMPLATE = `Cell respiration flashcards

Question\tAnswer
What does the cell break glucose down to make?\tATP, the cell's energy
What are the three stages?\tGlycolysis, the Krebs cycle, the electron transport chain
Which stage makes most of the ATP?\tThe electron transport chain
Where does the electron transport chain happen?\tIn the mitochondria

Missed this time
Which stage makes most of the ATP?
`;

const FAQ = [
  { q: "Can you make flashcards in Apple Notes?", a: [
    "Yes, with a two-column table: the question on the left, the answer on the right, one row per card. Notes can't hide an answer or flip a card, so you cover the right column to test yourself.",
  ] },
  { q: "Does Apple Notes have spaced repetition?", a: [
    "No. Notes doesn't know which cards are due or which ones you missed. A checklist of missed cards under the table, studied first next time, is the closest you get by hand.",
  ] },
  { q: "Can I shuffle flashcards in Apple Notes?", a: [
    "No. Tables in Notes don't sort or shuffle, so the cards come in the order you typed them. Starting from the bottom row now and then is the simple workaround.",
  ] },
  { q: "Is there a flashcard app that works like Apple Notes?", a: [
    "Pinto Notes looks and works like Apple Notes and has a free study notes and flashcards template with its own study app. Paste your notes into ChatGPT or Claude and it makes the cards; the app shows the ones that are due, one at a time.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-flashcards"
      cover={false}
      intro={<>A two-column table you cover to study, and a list of the cards you missed.</>}
      answer={<>
        <Keep title="Flashcards for Apple Notes" text={TEMPLATE} fold={10}
          note="After pasting, select the five lines from Question to the last answer and press the Table button. Then select the line under Missed this time and press the Checklist button." />
        <SideBySide slug="apple-notes-flashcards"
          apple={{ src: "/blog/side-by-side/flashcards-apple-notes", width: 890, height: 729, line: "Holds the cards. The answers are always showing, and you track the misses yourself.",
            alt: "The flashcard template in Apple Notes on macOS 27: a Question and Answer table of four cards, and Which stage makes most of the ATP? under Missed this time." }}
          pinto={{ title: "The same cards in Pinto Notes", line: "Shows the cards due today, one at a time. A card you miss comes back sooner.",
            alt: "The same four cards in the Pinto Notes flashcards app on 25 November: 2 cards due today, Study now, a 5-day streak and the newest card.",
            phone: { src: "/blog/side-by-side/flashcards-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/flashcards-pinto-mac", width: 1526, height: 1280 },
            href: "/templates/study-flashcards", button: "Get the flashcards template" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Paste the template into a new note, select the five lines from Question to the last answer and press the Table button: <MenuPath steps={["Format", "Table"]} keys="⌥⌘T" /></li>
        <li>Keep each question short. Tab in the last cell adds the next card.</li>
        <li>To study, cover the right column and answer each card out loud. Add the ones you miss under Missed this time.</li>
        <li>Next time, start with the misses. Tick each one you get right, and reset the list when they&apos;re all done: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-cornell-notes-template">Cornell notes</a>, <a href="/blog/apple-notes-tables">what tables in Notes can and can&apos;t do</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
