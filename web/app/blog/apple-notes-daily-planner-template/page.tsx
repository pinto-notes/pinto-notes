import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-daily-planner-template", { title: "Apple Notes daily planner template for iPhone and Mac" });

// Written 24 November 2026 for "apple notes daily planner template" (Google autocomplete, US: also "how to use apple notes as
// a planner", "iphone notes daily planner"), in pattern E (lib/SideBySide.tsx). Words: Codex, GPT-6.1 Sol, checked and edited.
// Apple Notes: blog-growth/research/apple-notes-daily-school-2026-11-24.md (macOS 27.0 VM, Edit, Paste as Markdown): the # line
// the title, the ## lines headings, every item a checklist. The first tick asked about automatic sorting; with it on, Call the
// bank, 9:00 Team meeting and Buy milk and bread dropped to the bottom of their lists. Format, More, Delete Checked and File,
// Duplicate Note and Pin Note: the macOS 27 menus (apple-notes-todo-packing-2026-11-23). iPhone: Settings, Apps, Notes, Sort
// Checked Items (support.apple.com/102296); pin by swiping right (support.apple.com/118442).
// Pinto Notes: the weekly planner template's note (content/templates/weekly-planner.json) with the same day: its nine to-dos
// under Tuesday (the capture day), times written "at 12:30" as the template's prompt adds them, ticked ones last, and
// tomorrow's under Wednesday; the empty headings are left out. Drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift,
// appleNotesSideBySideDailySchool). Moving unfinished tasks to today, when asked, is the template's prompt.

const TEMPLATE = `# Daily planner

## Top three
- [ ] Finish the report draft
- [ ] Call the bank about my card
- [ ] Run 5 km

## Schedule
- [ ] 9:00 Team meeting
- [ ] 12:30 Lunch with Sara
- [ ] 16:00 Dentist

## Also today
- [ ] Buy milk and bread
- [ ] Reply to Jonas about Saturday
- [ ] Water the plants

## Tomorrow
- [ ] Book the car service
`;

const FAQ = [
  { q: "Is there a built-in daily planner template in Apple Notes?", a: [
    "No. Apple Notes has no templates feature, so a template is a note you keep and copy. Paste this one into a new note on a Mac and it syncs to your iPhone.",
  ] },
  { q: "How do I use Notes as a daily planner on iPhone?", a: [
    "Paste the template on a Mac and let it sync, or type it on your iPhone, select the tasks and tap the checklist button. Pin the note so it stays at the top: swipe right on it and tap Pin.",
  ] },
  { q: "Should I use a separate note for each day?", a: [
    "One note you reset each morning is the simplest. To keep a record of past days, keep each day's note in a Planner folder and start the next day from a copy.",
  ] },
  { q: "How do I start tomorrow's list?", a: [
    "On a Mac, click in each list and choose Format, More, Delete Checked, then move the tasks under Tomorrow into the day's lists. To keep the old day as well, choose File, Duplicate Note first and clear the copy.",
  ] },
  { q: "Is there a daily planner that plans the day for you?", a: [
    "Pinto Notes has a free weekly planner template with a heading for each day. Tell ChatGPT or Claude what's on and it puts each task under its day, and when you ask, it moves what you didn't finish to today.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-daily-planner-template"
      cover={false}
      intro={<>Your top three, the day&apos;s schedule and what&apos;s next, in one note you reset each morning.</>}
      answer={<>
        <Keep title="Daily planner for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-daily-planner-template" position="answer" title="Want one note for the whole week, not one a day?">
          <p>Pinto Notes&apos; free weekly planner gives each day its own checklist. Tell your AI what&apos;s on and it puts each task under its day.</p>
        </PostCta>
        <SideBySide slug="apple-notes-daily-planner-template"
          apple={{ src: "/blog/side-by-side/daily-planner-template-apple-notes", width: 565, height: 915, line: "Holds the day. Done tasks sort to the bottom, and you move tomorrow's up yourself.",
            alt: "The daily planner template in Apple Notes on macOS 27: Top three, Schedule, Also today and Tomorrow as checklists, with one task ticked at the bottom of each of the first three." }}
          pinto={{ frame: false, title: "The same day in Pinto Notes", line: "One note for the whole week. Your AI puts each task under its day, and moves what you didn't finish to today when you ask.",
            alt: "The same day in the Pinto Notes weekly planner: the nine tasks under Tuesday, with Lunch with Sara at 12:30, Dentist at 16:00 and the three ticked ones last, and Book the car service under Wednesday.",
            phone: { src: "/blog/side-by-side/daily-planner-pinto-phone", width: 880, height: 997 },
            desk: { src: "/blog/side-by-side/daily-planner-pinto-mac", width: 1520, height: 959 },
            template: "weekly-planner" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the tasks and times to yours. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the tasks, select them and tap the checklist button.</li>
        <li>Tick tasks as you go. To sort done ones to the bottom on iPhone, go to Settings, Apps, Notes, Sort Checked Items. On a Mac, Notes asks the first time you tick something.</li>
        <li>Each morning, clear the done tasks and move Tomorrow&apos;s up. Click in a list and choose <MenuPath steps={["Format", "More", "Delete Checked"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-planner-template">a weekly planner</a>, <a href="/blog/apple-notes-to-do-list-template">a to-do list</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
