import { PostPage, postMetadata } from "@/lib/PostPage";
import { MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";
import { TemplatePicker, type Template } from "@/lib/TemplatePicker";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-for-school", { title: "Apple Notes for school: four templates for students" });

// Written 24 November 2026 for "apple notes for school" (Google autocomplete, US: also "using apple notes for school", "apple
// notes for college", "is apple notes good for school", "apple notes for students", "how to use apple notes for school"), in
// pattern E (lib/SideBySide.tsx), as the hub for the Cornell notes and flashcards posts. Words: Codex, GPT-6.1 Sol, checked
// and edited. Apple Notes: blog-growth/research/apple-notes-daily-school-2026-11-24.md (macOS 27.0 VM): all four templates
// pasted with Edit, Paste as Markdown; the Markdown tables of Cornell notes and Flashcards became real Notes tables, their first
// row a plain row. The capture is Class notes. File, Pin Note: the macOS 27 File menu; iPhone pin: support.apple.com/118442.
// Record Audio and its live transcript: the iPhone User Guide (record and transcribe audio) and the Notes User Guide for Mac.
// Pinto Notes: the Cornell notes template's note (content/templates/cornell-notes.json) with the class notes' four points as
// cues and short notes, the same summary and one cue to revisit, drawn by the Mac app offscreen (PaneTests/HIG/
// BlogSnapshots.swift, appleNotesSideBySideDailySchool). The cues, summary and quiz are the template's prompt.

const TEMPLATES: Template[] = [
  {
    title: "Class notes",
    pinto: { slug: "cornell-notes", name: "Cornell notes", rest: "where your AI turns your class notes into cues and a summary, then quizzes you." },
    text: `# Biology, 24 November

## Notes
- Photosynthesis turns light, water and carbon dioxide into glucose and oxygen.
- It happens in the chloroplasts, mostly in the leaves.
- Chlorophyll takes in red and blue light and reflects green.
- Two stages: the light reactions, then the Calvin cycle.

## To ask
- [ ] Why do leaves turn yellow in autumn?

## Summary
Plants use light to turn water and carbon dioxide into glucose and oxygen, in the chloroplasts, in two stages.`,
  },
  {
    title: "Assignments",
    pinto: { slug: "weekly-planner", name: "weekly planner", rest: "where your AI puts each assignment under its day, and moves what's left to today when you ask." },
    text: `# Assignments

## Due this week
- [ ] History essay draft, Thursday
- [ ] Maths problem set 6, Friday
- [ ] Read chapter 7 for English, Friday

## Next week
- [ ] Biology lab report, Tuesday
- [ ] Spanish vocabulary quiz, Wednesday

## Exams
- Chemistry midterm, 9 December
- Biology final, 16 December`,
  },
  {
    title: "Cornell notes",
    pinto: { slug: "cornell-notes", name: "Cornell notes", rest: "where your AI writes the cues and the summary, and keeps the cues you miss." },
    text: `# Cornell notes: photosynthesis

| Cue | Notes |
| --- | --- |
| What does photosynthesis make? | Glucose and oxygen |
| Where does it happen? | In the chloroplasts |
| Why are leaves green? | Chlorophyll reflects green light |
| What are the two stages? | The light reactions, then the Calvin cycle |

Summary: Plants use light to make glucose and oxygen in the chloroplasts, in two stages.`,
  },
  {
    title: "Flashcards",
    pinto: { slug: "study-flashcards", name: "study notes and flashcards", rest: "where your AI makes the cards from your notes and the app shows the ones that are due." },
    text: `# Spanish flashcards

| Spanish | English |
| --- | --- |
| la biblioteca | the library |
| el horario | the timetable |
| la tarea | the homework |
| aprobar | to pass (an exam) |

## Missed this time
- [ ] el horario`,
  },
];

const FAQ = [
  { q: "Is Apple Notes enough for college?", a: [
    "For lecture notes, reading notes and assignment lists, yes, and with iCloud they're on your iPhone and Mac. Revision is the part you plan yourself, because Notes doesn't track what you've learned.",
  ] },
  { q: "How should I organize Apple Notes for school?", a: [
    "Make a folder for each class and keep its notes there. Keep one assignments note for everything that's due, and pin it so it stays at the top of the list.",
  ] },
  { q: "Can Apple Notes record a lecture?", a: [
    "Yes. In a note on iPhone, tap the Attachments button, then Record Audio, and Notes shows a live transcript. Notes on a Mac records and transcribes too.",
  ] },
  { q: "Will Apple Notes quiz me on my flashcards?", a: [
    "No. Notes can't hide an answer, flip a card or tell you which cards are due. A two-column table that you cover with your hand is the way to test yourself in Notes.",
  ] },
  { q: "What can turn lecture notes into a quiz?", a: [
    "Pinto Notes has a free Cornell notes template. Paste your lecture notes into ChatGPT or Claude and it writes the cues and a summary, then quizzes you one cue at a time and keeps the ones you miss.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-for-school"
      cover={false}
      intro={<>Apple Notes is good for class notes, assignment lists and simple tables, and it comes on every iPhone and Mac. It can&apos;t quiz you, hide an answer or tell you which flashcards are due, so revising is up to you.</>}
      answer={<>
        <TemplatePicker templates={TEMPLATES} legend="Pick a template" post="apple-notes-for-school" />
        <SideBySide slug="apple-notes-for-school"
          apple={{ src: "/blog/side-by-side/school-class-notes-apple-notes", width: 983, height: 687, line: "Holds the lecture. You write the questions and the summary yourself.",
            alt: "The class notes template in Apple Notes on macOS 27: Biology, 24 November, with four notes on photosynthesis as a dashed list, one question under To ask and a one-line summary." }}
          pinto={{ frame: false, title: "The same lecture in Pinto Notes", line: "Your AI writes the cues and the summary from your class notes, then quizzes you and keeps the cues you miss.",
            alt: "The same lecture in the Pinto Notes Cornell notes template: four cues with short notes in a table, the same summary, and What are the stages? under Cues to revisit.",
            phone: { src: "/blog/side-by-side/school-cornell-notes-pinto-phone", width: 880, height: 1263 },
            desk: { src: "/blog/side-by-side/school-cornell-notes-pinto-mac", width: 1520, height: 1149 },
            href: "/templates/cornell-notes", button: "Get the Cornell notes template" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use them</h2>
      <Steps>
        <li>Make a folder for each class, and keep that class&apos;s notes in it.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> The tables come through as Notes tables, and the note syncs to your iPhone.</li>
        <li>Pin the assignments note so it stays at the top. On iPhone, swipe right on it and tap Pin. On a Mac: <MenuPath steps={["File", "Pin Note"]} /></li>
        <li>To revise, cover the right column of a table and answer from the left. Put what you miss under its own heading and start there next time.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-cornell-notes-template">Cornell notes in more detail</a>, <a href="/blog/apple-notes-flashcards">flashcards to study with</a>, <a href="/blog/apple-notes-daily-planner-template">a daily planner</a> and <a href="/blog/apple-notes-templates">more templates</a>.</p>
    </PostPage>
  );
}
