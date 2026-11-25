import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-checklist-template", { title: "Apple Notes checklist template for iPhone and Mac" });

// Written 25 November 2026 for "apple notes checklist template" (Google autocomplete, US: also "iphone notes checklist
// template", "apple notes daily checklist", "apple notes checklist uncheck all", "...greyed out"), in pattern E
// (lib/SideBySide.tsx). Words: Codex, GPT-6.1 Sol, checked and edited. Searchers want "checklists that reset daily"
// (research/template-posts-diagnosis-2026-11-24.md), which Notes doesn't do.
// Apple Notes: blog-growth/research/apple-notes-checklist-wishlist-2026-11-25.md (macOS 27.0 VM, Edit, Paste as Markdown):
// the # line the title, the ## lines headings, every item a checklist; the three morning items ticked and sorted down.
// Apple's pages: support.apple.com/102296 (iPhone Checklist button, Sort Checked Items, "uncheck all items to start over",
// no Uncheck All on iPhone documented); the Notes User Guide for Mac, Add lists (Format, More, Uncheck All; Command-click
// ticks or unticks all; checklists need iCloud notes or notes on the Mac, "Some features aren't available when using
// accounts from other providers").
// Pinto Notes: content/templates/habit-tracker.app rendered with scripts/page-render with the same six things as habits on
// Wednesday 25 November, started 9 November (public/blog/side-by-side/checklist-pinto-*). Each day starts unticked and the
// streaks carry on (habit-tracker.app/docs/README.md).

const TEMPLATE = `# Daily checklist

## Morning
- [ ] Make the bed
- [ ] Take vitamins
- [ ] Drink a glass of water

## Evening
- [ ] Tidy the kitchen
- [ ] Lay out tomorrow's clothes
- [ ] Phone on the charger by 10
`;

const FAQ = [
  { q: "Are there ready-made checklists in Apple Notes?", a: [
    "No. Apple Notes has no templates feature, so a checklist template is a note you keep and use again. Paste this one on a Mac, change the items and untick them each morning.",
  ] },
  { q: "Can I clear all the checkmarks without deleting the items?", a: [
    "On a Mac, choose Format, More, Uncheck All. Command-click also works: it ticks or unticks every item at once, so Command-click until the list is clear. Apple documents no Uncheck All on iPhone, so tap each ticked item, or untick on a Mac and let the note sync.",
  ] },
  { q: "Why is the Checklist button grayed out?", a: [
    "Checklists need iCloud notes or notes stored on your device. Notes in an account from another provider, such as Gmail, can't have them. Use a note in iCloud, or one stored on your iPhone or Mac.",
  ] },
  { q: "How do I keep completed items at the bottom of each list?", a: [
    "On iPhone, go to Settings, Apps, Notes, Sort Checked Items and choose Automatically. On a Mac, turn on Automatically sort checked items in Notes settings. Notes also asks the first time you tick something.",
  ] },
  { q: "Can my daily ticks start empty while I keep my streaks?", a: [
    "Pinto Notes' free habit tracker starts each day with nothing ticked and counts each habit's streak. Tick in the app, or tell ChatGPT or Claude what you did and it ticks the day for you.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-checklist-template"
      cover={false}
      intro={<>Apple Notes has no checklist templates, so this is a daily note you keep and untick each morning.</>}
      answer={<>
        <Keep title="Daily checklist for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B41: the download card on the first screen, under the template, as on every template post (B39). */}
        <PostCta slug="apple-notes-checklist-template" position="answer" title="Want your daily checklist to start fresh each morning?">
          <p>In Pinto Notes&apos; free habit tracker, each day starts with nothing ticked, and your streaks carry on.</p>
        </PostCta>
        <SideBySide slug="apple-notes-checklist-template"
          apple={{ src: "/blog/side-by-side/checklist-template-apple-notes", width: 521, height: 591, line: "Ticked items sort to the bottom. You untick the list yourself each morning.",
            alt: "The daily checklist in Apple Notes on macOS 27: Morning and Evening as checklists, with Make the bed, Take vitamins and Drink a glass of water ticked at the bottom of Morning." }}
          pinto={{ title: "The same checklist in Pinto Notes", line: "Each day starts unticked, and every item keeps its streak and this week's dots.",
            alt: "The same six things in the Pinto Notes habit tracker on Wednesday 25 November: the three morning ones done, the evening ones not yet, a 10-day streak for Make the bed, and 14 of 18 since Monday.",
            phone: { src: "/blog/side-by-side/checklist-pinto-phone", width: 780, height: 2080 },
            desk: { src: "/blog/side-by-side/checklist-pinto-mac", width: 1600, height: 1048 },
            template: "habit-tracker" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the items to your morning and evening. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, tap the Checklist button and type the items. Each Return adds another one.</li>
        <li>Turn on sorting, so ticked items drop to the bottom of their list. On iPhone it&apos;s Settings, Apps, Notes, Sort Checked Items. On a Mac, Notes asks the first time you tick something.</li>
        <li>Keep the note, and untick everything each morning: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-to-do-list-template">a to-do list</a>, <a href="/blog/apple-notes-habit-tracker">a habit tracker</a>, <a href="/blog/apple-notes-packing-list-template">a packing list</a> and <a href="/blog/apple-notes-wishlist-template">a family wishlist</a>.</p>
    </PostPage>
  );
}
