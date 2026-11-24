import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-meeting-notes-template", { title: "Apple Notes meeting notes template, with action items" });

// Written 21 November 2026 for "apple notes meeting notes template", removed 21 November (PR #735), restored 22 November
// 2026 in pattern E (lib/SideBySide.tsx), Emil's go. Apple Notes: blog-growth/research/apple-notes-side-by-side-more-2026-11-22
// (macOS 27.0, Edit, Paste as Markdown): title, headings, Notes and Decisions as dashed lists, the action items as a checklist;
// Emma's ticked. File, Duplicate Note and the Smart Folder rule Checklists: Unchecked are from earlier posts tried on macOS 27,
// as the post said before. Pinto Notes: the meeting notes template's note (content/templates/meeting-notes.json) with the same
// meeting written the template's way (action items first, then the meeting's two lines and decisions), the same three action
// items and the same tick, drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySideMore).

const TEMPLATE = `# Pricing sync, 24 November

People: Sara, Jonas, Emma

## Notes
- Sales want the new prices before December.
- Two of three testers missed the total in checkout.

## Decisions
- Three plans stay. No lifetime deal.
- The total moves above the card details.

## Action items
- [ ] Sara: send the new pricing to sales (Fri)
- [ ] Jonas: move the total in checkout (Wed)
- [ ] Emma: check the VAT rules for Norway (next week)
`;

const FAQ = [
  { q: "Does Apple Notes have a meeting notes template?", a: [
    "No. Apple Notes has no templates. One note per meeting, with headings for the notes, decisions and action items, works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "How do I keep track of action items from meetings in Apple Notes?", a: [
    "Write them as a checklist with the person's name first. Then make a Smart Folder with two rules, your Meetings folder and Checklists: Unchecked, and every meeting with something still open shows up in one place.",
  ] },
  { q: "Can Apple Notes record and summarize a meeting?", a: [
    "With Apple Intelligence, a recording in Notes turns into a transcript and a summary. It doesn't pull out who does what by when; you still write the action items yourself.",
  ] },
  { q: "Is there a meeting notes app that writes the action items for me?", a: [
    "Pinto Notes has a free meeting notes template. Paste your rough notes or a transcript into ChatGPT or Claude, and it writes the summary, the decisions and each action item with its owner and date.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-meeting-notes-template"
      cover={false}
      intro={<>One note per meeting: who was there, what was said, what was decided and who does what.</>}
      answer={<>
        <Keep title="Meeting notes for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-meeting-notes-template" position="answer" title="Want the action items written for you?">
          <p>Paste your rough notes into your AI. Pinto Notes&apos; free meeting notes template gets the summary, the decisions and who does what.</p>
        </PostCta>
        <SideBySide slug="apple-notes-meeting-notes-template"
          apple={{ src: "/blog/side-by-side/meeting-notes-template-apple-notes", width: 807, height: 737, line: "Holds the meeting. You write the decisions and action items yourself.",
            alt: "The meeting notes template in Apple Notes on macOS 27: Pricing sync, 24 November, with notes, two decisions and three action items, Emma's ticked." }}
          pinto={{ frame: false, title: "The same meeting in Pinto Notes", line: "Paste your rough notes into your AI. It writes the summary, the decisions and who does what.",
            alt: "The same meeting in the Pinto Notes meeting notes template: the three action items at the top with Emma's ticked, then the pricing sync in two lines and its two decisions.",
            phone: { src: "/blog/side-by-side/meeting-notes-pinto-phone", width: 780, height: 1083 },
            desk: { src: "/blog/side-by-side/meeting-notes-pinto-mac", width: 1520, height: 947 },
            template: "meeting-notes" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type it in, select the action items and tap the checklist button.</li>
        <li>Write each action item as name, task and day. Tick it when it&apos;s done.</li>
        <li>For the next meeting, copy this one and clear it: <MenuPath steps={["File", "Duplicate Note"]} /></li>
        <li>Keep the notes in a Meetings folder. A Smart Folder with the rule Checklists: Unchecked shows every meeting with something still open.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-planner-template">a weekly planner</a>, <a href="/blog/apple-notes-job-search-tracker">a job search tracker</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
