import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-to-do-list-template", { title: "Apple Notes to-do list template for iPhone and Mac" });

// Written 23 November 2026 for "apple notes to do list template" (Google autocomplete, US: also "iphone notes to do list
// template", "iphone notes to do list sort", "mac notes to do list"), in pattern E (lib/SideBySide.tsx). Words: Codex,
// GPT-6.1 Sol, checked and edited. Apple Notes: blog-growth/research/apple-notes-todo-packing-2026-11-23.md (macOS 27.0 VM,
// Edit, Paste as Markdown): the # line the title, the ## lines headings, every item a checklist. The first tick asked "Would you
// like to enable automatic sorting of checked items?"; with it on, Pay the electricity bill and Reply to Sara dropped to the
// bottom of Today. File, Pin Note pinned it. Format, More holds Check All, Uncheck All, Move Checked to Bottom and Delete
// Checked. iPhone: Settings, Apps, Notes, Sort Checked Items, drag to reorder (support.apple.com/102296); Mac: Automatically sort
// checked items, Control-Command-Up/Down Arrow (support.apple.com/guide/notes/apd93c815aa0/mac); pin on iPhone by swiping right
// (support.apple.com/118442).
// Pinto Notes: the weekly planner template's note (content/templates/weekly-planner.json) with the same items and ticks:
// Today's under Monday (the capture day), This week's as the top three, Later as Later, the ticked ones last; the days with
// nothing on them are left out of the note, so it shows only filled sections. Drawn by the Mac
// app offscreen (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySideToDo). Ticked items sink by default
// (Pane/Editor/EditorController.swift, ChecklistSorting); the AI's moves are the template's prompt.

const TEMPLATE = `# To-do list

## Today
- [ ] Pay the electricity bill
- [ ] Call the dentist about Tuesday
- [ ] Reply to Sara about Saturday
- [ ] Buy a birthday card for Mum

## This week
- [ ] Book flights home for Christmas
- [ ] Return the parcel
- [ ] Renew the car insurance

## Later
- [ ] Fix the bike light
- [ ] Sort the summer photos
- [ ] Clear out the garage
`;

const FAQ = [
  { q: "Does Apple Notes have a to-do list template?", a: [
    "No. Apple Notes has no templates feature, so a template is a note you copy. Paste this list into a new note on your Mac and it syncs to your iPhone. To start a fresh copy on a Mac, choose File, Duplicate Note.",
  ] },
  { q: "How do I sort a to-do list in Notes on iPhone?", a: [
    "Open Settings, Apps, Notes, Sort Checked Items and choose Automatically. On a Mac, turn on Automatically sort checked items in Notes settings. Each task you tick then moves to the bottom of its own list, under its own heading.",
  ] },
  { q: "Can I reorder the tasks in a Notes checklist?", a: [
    "Yes. On iPhone, drag a task to where you want it. On a Mac, click and hold a task and drag it, or press Control-Command-Up Arrow or Control-Command-Down Arrow.",
  ] },
  { q: "How do I clear the done tasks from a to-do list on a Mac?", a: [
    "Click in the list and choose Format, More, Delete Checked. Move Checked to Bottom and Uncheck All are in the same menu.",
  ] },
  { q: "Is there a to-do list that moves unfinished tasks for you?", a: [
    "Pinto Notes has a free weekly planner template with a heading for each day. Tell ChatGPT or Claude what's on and it puts each task under its day. Ask it, and it moves what you didn't finish to today.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-to-do-list-template"
      cover={false}
      intro={<>Today&apos;s tasks, this week&apos;s and the ones that can wait, in one note.</>}
      answer={<>
        <Keep title="To-do list for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-to-do-list-template" position="answer" title="Want a to-do list that plans your week?">
          <p>In Pinto Notes&apos; free weekly planner, tell your AI what&apos;s on and it puts each task under its day. Ask, and it moves what&apos;s left to today.</p>
        </PostCta>
        <SideBySide slug="apple-notes-to-do-list-template"
          apple={{ src: "/blog/side-by-side/to-do-list-template-apple-notes", width: 578, height: 841, line: "Holds the list. Done tasks sort to the bottom, and you move the rest to the next day yourself.",
            alt: "The to-do list template in Apple Notes on macOS 27: Today, This week and Later as checklists, with two of Today's tasks ticked at the bottom." }}
          pinto={{ frame: false, title: "The same to-dos in Pinto Notes", line: "Tell your AI what's on and it puts each task under its day. Ask it, and it moves what you didn't finish to today.",
            alt: "The same to-dos in the Pinto Notes weekly planner: the week's three tasks as the top three, today's four under Monday with two ticked last, and Later.",
            phone: { src: "/blog/side-by-side/to-do-weekly-planner-pinto-phone", width: 780, height: 1091 },
            desk: { src: "/blog/side-by-side/to-do-weekly-planner-pinto-mac", width: 1520, height: 1053 },
            template: "weekly-planner" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the tasks to yours. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the tasks, select them and tap the checklist button.</li>
        <li>Turn on sorting so done tasks drop to the bottom. On iPhone it&apos;s Settings, Apps, Notes, Sort Checked Items. On a Mac, Notes asks the first time you tick something.</li>
        <li>Pin the note so it stays on top of the list. On iPhone, swipe right on it and tap the pin. On a Mac: <MenuPath steps={["File", "Pin Note"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-planner-template">a weekly planner</a>, <a href="/blog/apple-notes-packing-list-template">a packing list</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
