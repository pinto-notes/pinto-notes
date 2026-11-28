import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-habit-tracker", { title: "Apple Notes habit tracker template, and where it stops" });

// Written 14 November 2026 for "apple notes habit tracker"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0, Edit, Paste as Markdown, sorting of checked
// items on): a heading per day, the habits as checklists, all 21 items; Monday all three ticked, Tuesday two, Wednesday one, and
// done habits drop to the bottom of their day. Duplicate Note and Uncheck All: Apple's Mac guide, as the post said before.
// Pinto Notes: content/templates/habit-tracker.app rendered with scripts/page-render with the same three habits and the same
// ticks this week, seen on Wednesday 18 November, plus the two weeks before it (public/blog/side-by-side/habit-pinto-*).

const TEMPLATE = `# Habits, week of 16 November

## Monday
- [ ] Walk 20 minutes
- [ ] Read 10 pages
- [ ] Bed by 11

## Tuesday
- [ ] Walk 20 minutes
- [ ] Read 10 pages
- [ ] Bed by 11

## Wednesday
- [ ] Walk 20 minutes
- [ ] Read 10 pages
- [ ] Bed by 11

## Thursday
- [ ] Walk 20 minutes
- [ ] Read 10 pages
- [ ] Bed by 11

## Friday
- [ ] Walk 20 minutes
- [ ] Read 10 pages
- [ ] Bed by 11

## Saturday
- [ ] Walk 20 minutes
- [ ] Read 10 pages
- [ ] Bed by 11

## Sunday
- [ ] Walk 20 minutes
- [ ] Read 10 pages
- [ ] Bed by 11

## How the week went
- Kept:
- Missed:
`;

const FAQ = [
  { q: "Does Apple Notes have a habit tracker?", a: [
    "No. Apple Notes has no habit tracker and no templates. A note with a heading for each day and a checklist of your habits under it works as one: tick the habits as you do them and start a fresh copy each week.",
  ] },
  { q: "How do I reset a checklist in Apple Notes?", a: [
    "On a Mac, click in the checklist and choose Format, More, Uncheck All. That loses what you ticked, so for a habit tracker, duplicate the note first and reset the copy.",
  ] },
  { q: "Can Apple Notes count my streak?", a: [
    "No. Notes doesn't count ticks across notes or days, so a streak is something you count yourself, scrolling back through the weeks.",
  ] },
  { q: "Is there a free habit tracker that works like a note?", a: [
    "Pinto Notes has a free habit tracker template: this week's ring, a tick per habit, streaks and a month view. Your AI can log what you did to it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-habit-tracker"
      cover={false}
      intro={<>One note a week: a heading for each day and your habits as a checklist under it.</>}
      answer={<>
        <Keep title="Weekly habit tracker for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-habit-tracker" position="answer" title="Want habits that start fresh every day?">
          <p>Pinto Notes&apos; free habit tracker shows today&apos;s habits to tick, and counts the week and your streaks for you.</p>
        </PostCta>
        <SideBySide slug="apple-notes-habit-tracker"
          apple={{ src: "/blog/side-by-side/habit-tracker-apple-notes", width: 694, height: 1763, line: "Ticks the day. Streaks you count yourself, one note per week.",
            alt: "The habit template in Apple Notes on macOS 27: a heading per day with three habits as a checklist, Monday all ticked, Tuesday two and Wednesday one." }}
          pinto={{ title: "The same habits in Pinto Notes", line: "Counts the week and your streaks. Tell your AI what you did and it ticks the day.",
            alt: "The same three habits in the Pinto Notes habit tracker on Wednesday 18 November: 6 of 9 since Monday, and a 10-day streak for Walk 20 minutes.",
            phone: { src: "/blog/side-by-side/habit-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/habit-pinto-mac", width: 1526, height: 1280 },
            template: "habit-tracker" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Swap in your habits, and keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the habits as lines, select them and tap the checklist button.</li>
        <li>Turn on Automatically sort checked items in the Notes settings, so what you&apos;ve done drops to the bottom of each day.</li>
        <li>On Monday, duplicate last week&apos;s note, change the date and untick each day: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-workout-log-template">a workout log</a>, <a href="/blog/apple-notes-mood-tracker">a mood tracker</a>, <a href="/blog/apple-notes-checklist-template">a daily checklist</a>, <a href="/blog/apple-notes-75-hard-template">a 75 Hard checklist</a>, <a href="/blog/apple-notes-new-year-resolution-template">new year resolutions</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
