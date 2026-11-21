import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-flashcards", { title: "Apple Notes flashcards: a template to study with" });

// Written 21 November 2026 for "apple notes flashcards" (Google autocomplete 20 Nov: "apple notes flashcards" only; the
// rest of that list is Apple Card noise; topic-research-2026-11-20.md row 5). The result page: App Store flashcard apps
// (Mochi, Goodnotes, RemNote); nobody shows flashcards made in Notes itself. Apple Notes facts, all from earlier posts
// tried on macOS 27: Format, Table (Option-Command-T) makes a table of two rows and two columns; type rows with a tab
// between columns, select them and press the Table button; Tab in the last cell adds a row; column widths can't be
// dragged; tables don't add up or sort (apple-notes-tables, and the wording copied from
// apple-notes-cornell-notes-template). The checklist button (apple-notes-templates). Format, More, Uncheck All
// (apple-notes-meal-planner-template). File, Duplicate Note (apple-notes-meal-planner-template). Typing #word makes a
// tag (apple-notes-tags-smart-folders). Search reads every word in every note (apple-notes-recipe-template). Notes has
// no way to hide an answer, so the post says to cover the column, as the Cornell post does. Pinto side:
// web/content/templates/study-flashcards.json (a Study notes and flashcards note with its own app; paste notes and the AI
// makes five to ten cards; "quiz me" asks one card at a time, lowest box first, without the answer, and grades the
// card as the app does; the asks "Quiz me on biology, ten cards." and "Which cards do I keep missing?") and
// study-flashcards.app/README.md and docs/README.md (cards due today, Study now, Show answer, then Again, Hard, Good or
// Easy with when the card comes back; missed cards come back sooner; Paste many reads "question - answer" lines or a
// tab between them; add, edit and delete with Undo). The picture is BlogSnapshots.studyFlashcardsForTemplatePost: the
// template's own example note, drawn offscreen by the Mac app's NoteDetailView.

// Tabs between the question and the answer: select those lines in Notes and press the Table button.
const TEMPLATE = `Cell respiration flashcards

Question\tAnswer
What does the cell break glucose down to make?\tATP, the cell's energy
What are the three stages?\tGlycolysis, the Krebs cycle, the electron transport chain
Which stage makes most of the ATP?\tThe electron transport chain
Where does the electron transport chain happen?\tIn the mitochondria

Missed this time
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
      intro={<>
        Flashcards work because they make you answer before you see the answer. Apple Notes has no flashcard mode, but a two-column
        table gets close. Here&apos;s a flashcard template for Apple Notes to paste in, how to study with it, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#study", label: "Study with it" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Cards that come back when due" },
        ]}>
          <p>
            Apple Notes has no flashcards, but a two-column table works: the question on the left, the answer on the right, one row per
            card. Cover the right column to test yourself, and keep a short checklist of the cards you missed under the table.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-flashcards" position="answer" template="study-flashcards" title="Want the cards made, and shown when due?">
            <p>Pinto Notes works like Apple Notes and has a free flashcard template with a study app. Paste your notes into ChatGPT or Claude and it makes the cards; the ones you miss come back sooner.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/study-flashcards-note" width={1520} height={571} maxWidth={600}
        alt="A Study notes and flashcards note in Pinto Notes on a Mac: a line on how the cards work, then a Notes heading with a Cell respiration section of three bullet points."
        caption="Study notes in Pinto Notes, the note the flashcards are made from. Example data. Headings and bullets work the same in Apple Notes; the study app doesn't carry over." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one table per topic</h2>
      <p>
        Each row is one card. Keep the question short and the answer shorter: a card that takes a paragraph to answer is two cards. The
        line under the table is where the missed cards go, so the next session starts with them.
      </p>
      <Keep title="Flashcards for Apple Notes" text={TEMPLATE}
        note="Each table line has a tab between the question and the answer. Paste it, then turn those lines into a table." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the template into a new note, select the five lines from Question to the
          last answer, and press the Table button. Every tab becomes a column, so you get Question and Answer side by side.
        </li>
        <li>
          <strong>Or start empty.</strong> Choose Format, Table for two rows and two columns. Type Question and Answer in the first row,
          and Tab in the last cell adds the next card.
        </li>
        <li>
          <strong>Keep the questions short.</strong> Notes sets the column widths itself and you can&apos;t drag them, so a long question
          squeezes the answer.
        </li>
        <li>
          <strong>One note per topic.</strong> Keep them in a Study folder, add a tag like #biology to each, and choose File, Duplicate
          Note to start the next topic with the same layout.
        </li>
      </ul>
      <p>
        A list of &ldquo;question: answer&rdquo; lines works too, but the answer sits in plain sight next to the question. The table lets
        you hide a whole column at once. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers everything a table in Notes
        can and can&apos;t do.
      </p>

      <h2 id="study">Study with it</h2>
      <ul>
        <li><strong>Cover the right column.</strong> Hold a card or your hand over the answers and say each one out loud before you look.</li>
        <li><strong>Write down what you missed.</strong> Type the question under Missed this time and press the checklist button. Tick it once you get it right in a later session.</li>
        <li><strong>Start with the misses.</strong> Next time, go through the checklist before the table. Those are the cards that need the practice.</li>
        <li><strong>Reset for the next round.</strong> When every miss is ticked, choose Format, More, Uncheck All, or delete the ticked lines and start fresh.</li>
        <li><strong>Find a card by any word.</strong> Search reads every word in every note, so &ldquo;mitochondria&rdquo; finds the card wherever it is.</li>
      </ul>
      <p>
        If you take notes in class, Cornell notes put questions
        right beside your notes, which is a flashcard deck built as you write. More notes to paste in are in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <p>
        You can also keep scanned handouts and recorded lectures in Notes during the term.
      </p>

      <h2 id="limits">Where flashcards in Notes stop</h2>
      <ul>
        <li><strong>Nothing is due.</strong> Notes doesn&apos;t know when you last saw a card, so you either study every card every time or keep track yourself.</li>
        <li><strong>No flip.</strong> The answer is always on the page. Covering it works, but it&apos;s easy to glance.</li>
        <li><strong>No shuffle.</strong> Tables don&apos;t sort, so you learn the order of the cards along with the answers.</li>
        <li><strong>Making the cards is the slow part.</strong> Turning a chapter into good questions takes longer than studying them.</li>
      </ul>
      <p>
        For a test next week with twenty cards, a table in Notes is enough. For a whole course, the hard part is knowing which cards to
        study today, and Notes leaves that to you.
      </p>

      <h2 id="pinto-notes">Flashcards that come back when they&apos;re due</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and a note can also be a small app. The free{" "}
        <a href="/templates/study-flashcards">study notes and flashcards</a> template is one: your notes under a heading per topic, and
        a study app that shows how many cards are due today. Press Study now and it asks one card at a time. Show answer, then say how
        it went (Again, Hard, Good or Easy), and each button says when the card comes back. Cards you miss come back sooner; cards you
        know wait longer.
      </p>
      <p>
        You can add, edit and delete every card in the app yourself, or paste a list of question and answer lines and it makes the cards.
        With ChatGPT or Claude connected, paste your lecture notes or a chapter and it makes five to ten cards next to yours. Say
        &ldquo;quiz me on biology, ten cards&rdquo; and it asks them in the chat, one at a time without the answer, and updates each card
        the way the app does. Ask &ldquo;which cards do I keep missing?&rdquo; and it reads the deck to answer.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The study notes you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>,
        and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
