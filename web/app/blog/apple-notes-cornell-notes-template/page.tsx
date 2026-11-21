import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-cornell-notes-template", { title: "Cornell notes in Apple Notes: a template that works" });

// Written 21 November 2026 for "apple notes cornell notes template" (Google autocomplete 20 Nov: apple notes cornell
// notes template, cornell notes apple notes, cornell notes template for apple notes; topic-research-2026-11-20.md row 4).
// The result page: an Apple Education thread with a Pages file, template.net, Notion, xtiles and affine; nobody gives a
// Notes layout. Apple Notes facts, all from apple-notes-tables (tried on macOS 27): Format, Table (Option-Command-T)
// makes a table of two rows and two columns; type rows with a tab between columns, select them and press the Table
// button, and every tab becomes a column; Tab in the last cell adds a row; Notes sets column widths itself and they
// can't be dragged. Paste as Markdown is NOT used for the table here: only headings, lists and checklists were
// verified for it. File, Duplicate Note (apple-notes-meal-planner-template). Pinto side:
// web/content/templates/cornell-notes.json (one ### section per lecture with a Cue | Notes table and a Summary line;
// "quiz me" asks the cues one at a time and keeps the missed ones under Cues to revisit as a checklist). The picture is
// BlogSnapshots.cornellNotesForTemplatePost: the template's own example, drawn offscreen by NoteDetailView.

// Tabs between the cue and the note: select those lines in Notes and press the Table button.
const TEMPLATE = `Supply and demand, 5 November

Cue\tNotes
What shifts the demand curve?\tIncome, tastes, related prices
What moves along the curve?\tOnly the good's own price
What is the equilibrium price?\tWhere demand equals supply
What does a price ceiling cause?\tA shortage, if it's below equilibrium

Summary: The good's own price moves you along the demand curve; income, tastes and related prices shift it. The price settles where demand equals supply.
`;

const FAQ = [
  { q: "Can you do Cornell notes in Apple Notes?", a: [
    "Yes, with a table. Make a two-column table, put questions in the left column and your notes in the right, and write a two or three sentence summary under it. To revise, cover the right column and answer the questions.",
  ] },
  { q: "How do I make a two-column table in Apple Notes?", a: [
    "On a Mac, choose Format, Table, or press Option-Command-T. You get two rows and two columns, and Tab in the last cell adds a row. You can also type rows with a tab between the two parts, select them and press the Table button.",
  ] },
  { q: "Can I make the cue column narrower?", a: [
    "No. Notes sets column widths itself and you can't drag them. Keep the cues short, a question of a few words, and the notes column gets the room.",
  ] },
  { q: "Is there a Cornell notes app that quizzes me?", a: [
    "Pinto Notes has a free Cornell notes template. Paste your lecture notes into ChatGPT or Claude and it writes the cues and the summary, then quizzes you on the cues and keeps the ones you missed.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-cornell-notes-template"
      intro={<>
        Cornell notes work because they turn your notes into questions you can test yourself on. Apple Notes doesn&apos;t have the layout
        built in, but a two-column table gets you there. Here&apos;s a Cornell notes template for Apple Notes, how to revise with it, and
        where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#revise", label: "Revise with it" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Notes that quiz you" },
        ]}>
          <p>
            Apple Notes has no Cornell template, but a two-column table works: a short question on the left, your note on the right, one
            row per idea, and a two or three sentence summary under the table. Use one note per lecture, and cover the right column to
            revise.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-cornell-notes-template" position="answer" title="Want the cues written, and a quiz?">
            <p>Pinto Notes works like Apple Notes and has a free Cornell notes template. Paste your lecture notes into ChatGPT or Claude and it writes the cues and summary, then quizzes you.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/cornell-notes-note" width={1520} height={1010} maxWidth={620}
        alt="A Cornell notes note in Pinto Notes on a Mac: a Supply and demand lecture with a Cue and Notes table of four rows, a summary, and a Cues to revisit checklist."
        caption="Cornell notes in Pinto Notes: cues on the left, notes on the right, a summary, and the cues you missed. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: cues, notes, summary</h2>
      <p>
        The original Cornell page has three parts, and a note can hold all of them. The notes column is what you wrote in class, in short
        lines. The cue column is a question each line answers, written after class. The summary is two or three sentences in your own
        words, which is where most of the remembering happens.
      </p>
      <Keep title="Cornell notes for Apple Notes" text={TEMPLATE}
        note="Each table line has a tab between the cue and the note. Paste it, then turn those lines into a table." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the template into a new note, select the five lines from Cue to the last
          note, and press the Table button. Every tab becomes a column, so you get Cue and Notes side by side.
        </li>
        <li>
          <strong>Or start empty.</strong> Choose Format, Table for two rows and two columns. Type Cue and Notes in the first row, and Tab
          in the last cell adds the next row.
        </li>
        <li>
          <strong>Keep the cues short.</strong> Notes sets the column widths itself and you can&apos;t drag them, so a long cue squeezes your
          notes. A few words, as a question.
        </li>
        <li>
          <strong>One note per lecture.</strong> Keep them in a folder per course, and choose File, Duplicate Note to start the next
          lecture from the last one.
        </li>
      </ul>
      <p>
        In class, fill in only the Notes column. Write the cues and the summary the same evening, while you still remember what the
        lecture meant. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers everything a table in Notes can and can&apos;t
        do.
      </p>

      <h2 id="revise">Revise with it</h2>
      <ul>
        <li><strong>Cover the right column.</strong> Hold a card or your hand over the notes and answer each cue out loud.</li>
        <li><strong>Mark what you missed.</strong> Keep a short checklist under the summary of the cues you got wrong, and tick each once you get it right.</li>
        <li><strong>Read the summaries first.</strong> Before an exam, the summaries of every lecture are the fastest way back into a course.</li>
      </ul>
      <p>
        For other notes to paste in the same way, see <a href="/blog/apple-notes-templates">Apple Notes templates</a>, and for keeping a
        week of study on track, the <a href="/blog/apple-notes-habit-tracker">Apple Notes habit tracker</a> works for revision sessions
        too.
      </p>

      <h2 id="limits">Where Cornell notes in Notes stop</h2>
      <ul>
        <li><strong>The cues are on you.</strong> Turning every line of notes into a good question is the slow part, and it&apos;s the part people skip.</li>
        <li><strong>No quiz.</strong> Covering a column with your hand works, but nothing asks you the questions or remembers which ones you missed.</li>
        <li><strong>Lectures stay apart.</strong> Revising a topic that ran over three lectures means opening three notes.</li>
      </ul>

      <h2 id="pinto-notes">Cornell notes that quiz you</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/cornell-notes">Cornell notes</a> template is one note per course: a section per lecture
        with a Cue and Notes table and a summary, and a list of cues to revisit.
      </p>
      <p>
        Paste your lecture or reading notes into your AI. It puts your notes on the right in short rows, writes a question for each on the
        left, and closes with a summary in plain sentences. Say &ldquo;quiz me on supply and demand&rdquo; and it asks the cues one at a
        time without showing the answers, then adds the ones you missed to Cues to revisit and ticks them when you get them right later.
        You can still write and edit every row yourself, and every earlier version of the note is kept.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
    </PostPage>
  );
}
