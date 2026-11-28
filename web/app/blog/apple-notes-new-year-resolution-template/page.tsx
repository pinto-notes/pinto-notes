import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, MenuPaths, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-new-year-resolution-template", { title: "Apple Notes new year resolution template for 2027" });

// Written 28 November 2026 for "apple notes new year resolution template" (Google autocomplete, US: also "apple notes new year
// resolutions template", "apple notes new year template", "iphone notes new year template", "new year resolution tracker apple
// notes"), in pattern E (lib/SideBySide.tsx), experiment B48. Page 1 is Google's AI answer with a long resolutions template, a
// school Keynote template, a year in review template, an r/apple resolutions app and App Store resolution trackers. This is
// the resolutions as a checklist you tick each day and each week; bigger goals with weekly steps are iphone-notes-goals-template.
// Words: Codex, GPT-6.1 Sol, checked and edited. Research: blog-growth/research/apple-notes-new-year-2026-11-28.md.
// Apple Notes: macOS 27 VM, Edit, Paste as Markdown: the # line the title, the plain line text, two headings, six checklist
// items; Read 20 pages and Spanish ticked, sorting left off (Not Now). File, Pin Note and Duplicate Note, and Format, More,
// Uncheck All: the VM's own menus. iPhone Checklist button and "uncheck all items to start over": support.apple.com/102296.
// iPhone pin: support.apple.com/guide/iphone/organize-in-folders-ipha61270292/ios. iPhone Uncheck All: as on
// apple-notes-checklist-template. No advice on which resolutions to make or how to keep them.
// Pinto Notes: content/templates/habit-tracker.app drawn by scripts/blog-side-by-side-apps.ts (resolutions) with the same six
// lines as habits, started 1 January, on Thursday 14 January 2027. Each day starts unticked, weekly goals (perWeek) count the
// week and keep a streak of weeks, a skipped day doesn't break a streak, your AI ticks the day: habit-tracker.app/docs/README.md.

const TEMPLATE = `# 2027 resolutions

Each one as something you can tick. Untick the list each night, and the weekly ones each Monday.

## Every day
- [ ] Read 20 pages
- [ ] No phone in bed
- [ ] Spanish, 10 minutes

## Each week
- [ ] Walk 30 minutes, 3 times
- [ ] Cook at home, 4 nights
- [ ] Call Grandma on Sunday
`;

const FAQ = [
  { q: "How do I put my 2027 resolutions into iPhone Notes?", a: [
    "Make a new note, tap the Checklist button and type the first resolution. Each Return adds another item. Tap an empty circle to tick it.",
  ] },
  { q: "Can the resolutions note stay above my other notes?", a: [
    "Yes. On iPhone, touch and hold the note in the list, then tap Pin Note. On a Mac, choose File, Pin Note.",
  ] },
  { q: "Will my resolutions list clear itself each day and count this week's walks?", a: [
    "No. Notes keeps each box ticked until you untick it, and you count the week's walks yourself. To untick the whole note, choose Format, More, Uncheck All on a Mac, or on iPhone double-tap an item, then tap Checklist, Uncheck All.",
  ] },
  { q: "How can I keep this year's resolutions when next year starts?", a: [
    "Keep each year as its own note. On a Mac, choose File, Duplicate Note, then change the year in the copy, and the old note stays as you left it.",
  ] },
  { q: "Can ChatGPT or Claude tick off a resolution after I do it?", a: [
    "Yes, in Pinto Notes' free habit tracker. Tell your AI what you did and it ticks the day.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-new-year-resolution-template"
      cover={false}
      intro={<>Your 2027 resolutions as a checklist note for Apple Notes: three to tick every day and three to tick each week.</>}
      answer={<>
        <Keep title="2027 resolutions for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B48: the download card on the first screen, under the template, as on every template post (B39). */}
        <PostCta slug="apple-notes-new-year-resolution-template" position="answer" title="Unticking resolutions and counting the week by hand?">
          <p>Pinto Notes&apos; free habit tracker starts each day unticked and counts the weekly ones, like &quot;3 times a week&quot;. A day you skip on purpose doesn&apos;t break the streak.</p>
        </PostCta>
        <SideBySide slug="apple-notes-new-year-resolution-template"
          apple={{ src: "/blog/side-by-side/resolutions-template-apple-notes", width: 1096, height: 693, line: "Keeps the boxes you tick. You untick the day and count the week's walks yourself.",
            alt: "The 2027 resolutions checklist in Apple Notes on macOS 27: three every day and three each week, with Read 20 pages and Spanish, 10 minutes ticked." }}
          pinto={{ title: "The same resolutions in Pinto Notes", line: "Each day starts unticked. The weekly ones count themselves, and each keeps a streak.",
            alt: "The same six resolutions in the Pinto Notes habit tracker on Thursday 14 January 2027, started 1 January: 16 of 19 since Monday and 2 of 5 done today. Read 20 pages and Spanish 10 minutes are done, with 14-day and 6-day streaks. No phone in bed is not yet done, with an 8-day streak. Walk is 2 of 3 this week and Cook at home 3 of 4. Call Grandma waits under Not today, as it's for Sundays. On a Mac, the week as a grid of dots too.",
            phone: { src: "/blog/side-by-side/resolutions-pinto-phone", width: 780, height: 2220 },
            desk: { src: "/blog/side-by-side/resolutions-pinto-mac", width: 1526, height: 1328 },
            template: "habit-tracker" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the resolutions to yours. Write each as something you can tick, with a number where it helps, like &quot;20 pages&quot; or &quot;3 times&quot;. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On iPhone, tap the Checklist button and type your resolutions. Each Return adds another one. On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /></li>
        <li>Pin the note, so it stays at the top of your notes.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Touch and hold the note", "Pin Note"] },
            { on: "Mac", steps: ["File", "Pin Note"] },
          ]} /></li>
        <li>Untick the daily ones each night and the weekly ones each Monday. Uncheck All unticks the whole note, weekly ones too.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Double-tap an item", "Checklist", "Uncheck All"] },
            { on: "Mac", steps: ["Format", "More", "Uncheck All"] },
          ]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-habit-tracker">a habit tracker</a>, <a href="/blog/iphone-notes-goals-template">goals for the year, week by week</a> and <a href="/blog/apple-notes-checklist-template">a daily checklist</a>.</p>
    </PostPage>
  );
}
