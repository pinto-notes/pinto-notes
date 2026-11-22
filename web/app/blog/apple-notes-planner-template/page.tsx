import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-planner-template", { title: "Apple Notes planner template: plan your week in one note" });

// Written 21 November 2026 for "apple notes planner template", removed 21 November (PR #735), restored 22 November 2026 in
// pattern E (lib/SideBySide.tsx), Emil's go. Apple Notes: blog-growth/research/apple-notes-side-by-side-more-2026-11-22
// (macOS 27.0, Edit, Paste as Markdown, sorting off): the # line the title, a heading per day, every task a checklist; Send
// the Q4 budget, Monday's two and the dentist ticked. The daily version pasted the same way (four headings, six items).
// File, Duplicate Note and Format, More, Uncheck All are from earlier posts tried on macOS 27, as the post said before.
// Pinto Notes: the weekly planner template's note (content/templates/weekly-planner.json) with the same tasks under the same
// days and the same four ticks, drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySideMore).

const WEEKLY = `# Weekly planner

## Top three this week
- [ ] Send the Q4 budget to Jonas
- [ ] Book flights home for Christmas
- [ ] Run three times

## Monday
- [ ] Team meeting at 9:00
- [ ] Finish the budget draft

## Tuesday
- [ ] Dentist at 8:30
- [ ] Run 5 km

## Wednesday
- [ ] Call Mum
- [ ] Review Emma's slides

## Thursday
- [ ] Run 5 km before work
- [ ] Dinner with Sara at 19:00

## Friday
- [ ] Pick up the dry cleaning

## Saturday
- [ ] Long run, 10 km
- [ ] Farmers' market

## Sunday
- [ ] Plan next week

## Later
- [ ] Renew my passport
- [ ] Fix the bike light
`;

const DAILY = `# Today

## Top three
- [ ] Finish the budget draft
- [ ] Call Mum
- [ ] Run 5 km

## Morning
- [ ] Team meeting at 9:00

## Afternoon
- [ ] Review Emma's slides

## Evening
- [ ] Dinner with Sara at 19:00
`;

const FAQ = [
  { q: "Does Apple Notes have a planner template?", a: [
    "No. Apple Notes has no templates. One note per week with a heading for each day and that day's to-dos as a checklist works as a planner, and you can paste the template on this page straight in.",
  ] },
  { q: "How do I use Apple Notes as a planner?", a: [
    "Keep one note per week in a Planner folder and pin this week's note to the top. Put your top three first, each task under its day, and anything without a day under Later. On Sunday, duplicate the note for next week and move what's left.",
  ] },
  { q: "Can I make a daily planner in Notes on iPhone?", a: [
    "Yes. Type the headings and tasks, select the tasks and tap the checklist button. Paste as Markdown is on the Mac, so the quickest way is to paste the template on a Mac and let the note sync to your iPhone.",
  ] },
  { q: "Is there a planner app that works like Apple Notes?", a: [
    "Pinto Notes looks and works like Apple Notes and has a free weekly planner template. Tell ChatGPT or Claude what's on this week and it puts each task under its day and keeps your top three.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-planner-template"
      cover={false}
      intro={<>The week in one note: your top three, each day&apos;s to-dos and a list for later.</>}
      answer={<>
        <Keep title="Weekly planner for Apple Notes" text={WEEKLY} fold={10}
          note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
        <SideBySide slug="apple-notes-planner-template"
          apple={{ src: "/blog/side-by-side/planner-template-apple-notes", width: 578, height: 1591, line: "Holds the week. You move what's left to next week by hand.",
            alt: "The weekly planner template in Apple Notes on macOS 27: top three, Monday to Sunday and Later as checklists, with four tasks ticked." }}
          pinto={{ frame: false, title: "The same week in Pinto Notes", line: "Tell your AI what's on and it puts each task under its day. On Sunday it moves what's left to Monday.",
            alt: "The same week in the Pinto Notes weekly planner template: the same top three and tasks under the same days, with the same four ticked.",
            phone: { src: "/blog/side-by-side/weekly-planner-pinto-phone", width: 780, height: 1600 },
            desk: { src: "/blog/side-by-side/weekly-planner-pinto-mac", width: 1520, height: 1208 },
            href: "/templates/weekly-planner", button: "Get the weekly planner template" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the tasks to yours. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type it in, select the tasks and tap the checklist button.</li>
        <li>Pin this week&apos;s note so it&apos;s on top. Tick each task as you go.</li>
        <li>On Sunday, copy the note for next week, move what&apos;s left and untick the rest: <MenuPath steps={["File", "Duplicate Note"]} /></li>
      </Steps>
      <p>Rather plan one day at a time? Paste this one the same way.</p>
      <Keep title="Daily planner for Apple Notes" text={DAILY} fold={10} />
      <p>More for Apple Notes: <a href="/blog/apple-notes-meeting-notes-template">meeting notes with action items</a>, <a href="/blog/apple-notes-habit-tracker">a habit tracker</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
