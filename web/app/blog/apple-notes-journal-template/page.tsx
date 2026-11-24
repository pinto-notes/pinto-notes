import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-journal-template", { title: "Apple Notes journal template, one entry a day" });

// Written 21 November 2026 for "apple notes journal template", removed 21 November (PR #735), restored 22 November 2026 in
// pattern E (lib/SideBySide.tsx), Emil's go. Apple Notes: blog-growth/research/apple-notes-side-by-side-more-2026-11-22
// (macOS 27.0, Edit, Paste as Markdown): title, a heading for the questions and each day, the questions numbered and each
// day's lines dashed. Locked notes open with a password, Face ID or Touch ID; search reads every word; #word makes a tag that a
// Smart Folder can use: from earlier posts tried on macOS 27, as the post said before.
// Pinto Notes: the daily journal template's note (content/templates/daily-journal.json) with the same questions and the same
// two days in the same words, drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySideMore).

const TEMPLATE = `# Daily journal

## Questions
1. What happened today?
2. What took energy, and what gave it back?
3. What do I want to remember?
4. What's one thing for tomorrow?

## Sunday 22 November
- Today: quiet day. Finished the bookshelf and went for a long walk.
- Energy: low after lunch, better after coffee with Jonas.
- Remember: the bakery on the corner opens at seven.
- Tomorrow: call Mum.

## Saturday 21 November
- Today: helped Maja move. It went faster than we feared.
- Energy: the stairs took it, the pizza after gave it back.
- Remember: Maja said the new flat gets the evening sun.
- Tomorrow: reply to the landlord before noon.
`;

const FAQ = [
  { q: "Does Apple Notes have a journal template?", a: [
    "No. Apple Notes has no templates. One note with a few questions at the top and a heading for each day works as a journal, and you can paste the template on this page straight in.",
  ] },
  { q: "Should I use one note per day or one note for the whole journal?", a: [
    "One note is easier to keep up: it's always in the same place, and the last few days are right under the questions. When it gets long, start a new note for the next month.",
  ] },
  { q: "Can I lock my journal in Apple Notes?", a: [
    "Yes. Apple Notes can lock a note, and a locked note opens with a password, Face ID or Touch ID. Lock the journal note itself, and every day in it is locked with it.",
  ] },
  { q: "How do I find an old journal entry?", a: [
    "Search reads every word in every note, so search for a name, a place or a word you remember writing. A tag like #trip on the days that matter lets a Smart Folder gather those notes.",
  ] },
  { q: "Is there a journal that writes the entry for me?", a: [
    "Pinto Notes has a free daily journal template with the same four questions. Tell ChatGPT or Claude about your day, or let it ask the questions, and it writes the entry in your words, newest day first.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-journal-template"
      cover={false}
      intro={<>Four short questions and a few lines a day, newest day first.</>}
      answer={<>
        <Keep title="Daily journal for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-journal-template" position="answer" title="Want a journal that asks you the questions?">
          <p>Tell your AI about your day, or let it ask. Pinto Notes&apos; free daily journal gets the entry in your words, newest day first.</p>
        </PostCta>
        <SideBySide slug="apple-notes-journal-template"
          apple={{ src: "/blog/side-by-side/journal-template-apple-notes", width: 990, height: 813, line: "Holds the journal. You write each day by hand.",
            alt: "The journal template in Apple Notes on macOS 27: four questions, then Sunday 22 and Saturday 21 November with four lines each." }}
          pinto={{ frame: false, title: "The same journal in Pinto Notes", line: "Tell your AI about your day, or let it ask the questions. It writes the entry in your words.",
            alt: "The same two days in the Pinto Notes daily journal template, under the same four questions, newest day first.",
            phone: { src: "/blog/side-by-side/daily-journal-pinto-phone", width: 780, height: 1373 },
            desk: { src: "/blog/side-by-side/daily-journal-pinto-mac", width: 1520, height: 1123 },
            template: "daily-journal" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> Then delete the two example days.</li>
        <li>Each evening, add the day as a heading under the questions and answer them in a line each. Newest day first.</li>
        <li>Pin the note so it&apos;s always on top. To keep it private, lock it.</li>
        <li>When it gets long, start a new note for the next month.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-mood-tracker">a mood tracker</a>, <a href="/blog/apple-notes-habit-tracker">a habit tracker</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
