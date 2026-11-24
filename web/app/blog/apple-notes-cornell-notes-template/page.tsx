import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-cornell-notes-template", { title: "Cornell notes in Apple Notes: a template that works" });

// Written 21 November 2026 for "apple notes cornell notes template", removed 21 November (PR #735), restored 22 November
// 2026 in pattern E (lib/SideBySide.tsx), Emil's go. Apple Notes: blog-growth/research/apple-notes-side-by-side-more-2026-11-22
// (macOS 27.0, a plain Command-V, then the five lines from Cue to the last cue selected and the Table button pressed, then the
// two lines under Cues to revisit selected and the Checklist button pressed; the second cue ticked). Format, Table (Option-
// Command-T), Tab in the last cell adds a row, and column widths can't be dragged: apple-notes-tables, tried on macOS 27.
// Pinto Notes: the Cornell notes template's note (content/templates/cornell-notes.json) with the same lecture, the same four
// cues and notes, the same summary and the same tick, drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift,
// appleNotesSideBySideMore). At a phone's width its table scrolls sideways, so the Notes column is cut off in the picture.

// Tabs between the cue and the note: select those lines in Notes and press the Table button.
const TEMPLATE = `Supply and demand, 5 November

Cue\tNotes
What shifts the demand curve?\tIncome, tastes, related prices
What moves along the curve?\tOnly the good's own price
What is the equilibrium price?\tWhere demand equals supply
What does a price ceiling cause?\tA shortage, if it's below equilibrium

Summary: The good's own price moves you along the demand curve. Income, tastes and related prices shift it. The price settles where demand equals supply, and a ceiling below that leaves a shortage.

Cues to revisit
What shifts the demand curve?
What does a price ceiling cause?
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
      cover={false}
      intro={<>A two-column table: questions on the left, your notes on the right, a summary below.</>}
      answer={<>
        <Keep title="Cornell notes for Apple Notes" text={TEMPLATE} fold={10}
          note="After pasting, select the five lines from Cue to the last cue and press the Table button. Then select the two lines under Cues to revisit and press the Checklist button." />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-cornell-notes-template" position="answer" title="Want notes that quiz you?">
          <p>Paste your notes into your AI. Pinto Notes&apos; free Cornell notes template gets the cues and the summary, and your AI quizzes you on them.</p>
        </PostCta>
        <SideBySide slug="apple-notes-cornell-notes-template"
          apple={{ src: "/blog/side-by-side/cornell-notes-template-apple-notes", width: 1116, height: 909, line: "Holds the notes. You write every cue and the summary yourself.",
            alt: "The Cornell notes template in Apple Notes on macOS 27: a Cue and Notes table of four rows, the summary under it and two cues to revisit, one ticked." }}
          pinto={{ frame: false, title: "The same notes in Pinto Notes", line: "Your AI writes the cues and the summary from your notes, then quizzes you and keeps the cues you missed.",
            alt: "The same lecture in the Pinto Notes Cornell notes template: the same four cues and notes in a table, the summary and the same two cues to revisit, one ticked.",
            phone: { src: "/blog/side-by-side/cornell-notes-pinto-phone", width: 780, height: 1408 },
            desk: { src: "/blog/side-by-side/cornell-notes-pinto-mac", width: 1520, height: 1196 },
            template: "cornell-notes" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Paste the template into a new note, select the five lines from Cue to the last cue and press the Table button: <MenuPath steps={["Format", "Table"]} keys="⌥⌘T" /></li>
        <li>In class, write your notes in the right column. Tab in the last cell adds a row.</li>
        <li>After class, write a short question for each note on the left, and two or three sentences under the table.</li>
        <li>To revise, cover the right column and answer each cue. Put the ones you missed under Cues to revisit.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-for-school">all the templates for school</a>, <a href="/blog/apple-notes-flashcards">flashcards to study with</a>, <a href="/blog/apple-notes-tables">what tables in Notes can and can&apos;t do</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
