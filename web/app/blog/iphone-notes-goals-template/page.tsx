import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, MenuPaths, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("iphone-notes-goals-template", { title: "iPhone Notes goals template for 2027, week by week" });

// Written 28 November 2026 for "iphone notes goals template" (Google autocomplete, US: also "apple notes goals template",
// "iphone notes goals tracker", "apple notes goals tracker", "apple notes goal tracker template", "notes app goals template",
// "2027 goals apple notes template"), in pattern E (lib/SideBySide.tsx), experiment B48. Page 1 is a general r/AppleNotesGang
// templates thread, an AI notes app's blog, an Etsy goals template, a goal and weekly review template, a Pinterest goal habit
// planner; for "goals tracker", App Store goal apps. This is a few goals for the year with the week's steps under each; daily
// resolutions are apple-notes-new-year-resolution-template. The old apple-notes-goal-template (removed 21 Nov, #735) was a
// document with no Pinto counterpart; this one has the habit tracker's weekly goals.
// Words: Codex, GPT-6.1 Sol, checked and edited. Research: blog-growth/research/apple-notes-new-year-2026-11-28.md.
// Apple Notes: macOS 27 VM, Edit, Paste as Markdown: the # line the title, the plain line text, three headings, eight checklist
// items; Run 1 and 2 and Write 1 and 2 ticked, sorting left off. File, Pin Note and Format, More, Uncheck All: the VM's menus.
// iPhone heading (the Format button, then Heading): support.apple.com/guide/iphone/create-and-format-notes-iph1ac0b3a2/ios.
// iPhone Checklist button: support.apple.com/102296. iPhone pin: support.apple.com/guide/iphone/organize-in-folders-ipha61270292/ios.
// No advice on which goals to set, how many, or how to reach them.
// Pinto Notes: content/templates/habit-tracker.app drawn by scripts/blog-side-by-side-apps.ts (goals) with the same three goals
// as weekly goals (perWeek 3, 1 and 4), started 4 January, on Wednesday 20 January 2027: each counts the week, starts again
// on Monday and keeps a streak of weeks; your AI logs what you did: habit-tracker.app/docs/README.md.

const TEMPLATE = `# Goals for 2027

Three goals, and what you do for each one this week. Untick them every Monday.

## Run a 10K in May
- [ ] Run 1 of 3
- [ ] Run 2 of 3
- [ ] Run 3 of 3

## Save $3,000 for Japan
- [ ] Save $60

## Finish a novel draft
- [ ] Write 500 words, 1 of 4
- [ ] Write 500 words, 2 of 4
- [ ] Write 500 words, 3 of 4
- [ ] Write 500 words, 4 of 4
`;

const FAQ = [
  { q: "How do I lay out a year's goals in iPhone Notes?", a: [
    "Type a goal, select it, then tap the Format button and choose Heading. Under it, tap the Checklist button and type this week's steps, with Return for each one.",
  ] },
  { q: "Is this goals template limited to three goals?", a: [
    "No, there's no set number. The template has three, and a few goals with short lists of steps fit on one screen.",
  ] },
  { q: "What progress will Notes show toward each goal?", a: [
    "Only the boxes you tick. Notes doesn't count the week, record which weeks you met a goal or keep a run of good weeks.",
  ] },
  { q: "Can each goal have a note of its own?", a: [
    "Yes. Give each goal its own note and keep them together in one folder. One note keeps the whole week on one screen.",
  ] },
  { q: "Can ChatGPT or Claude log a step toward a weekly goal?", a: [
    "Yes, in Pinto Notes' free habit tracker. Tell your AI what you did, like \"ran today\", and it logs it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="iphone-notes-goals-template"
      cover={false}
      intro={<>A few goals for 2027 in one iPhone Notes checklist, with a heading for each goal and this week&apos;s steps under it.</>}
      answer={<>
        <Keep title="2027 goals for iPhone Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B48: the download card on the first screen, under the template, as on every template post (B39). */}
        <PostCta slug="iphone-notes-goals-template" position="answer" title="Unticking every goal again each Monday?">
          <p>In Pinto Notes&apos; free habit tracker, a goal can be any three days a week. It counts the week, starts again on Monday and keeps a streak of the weeks you hit.</p>
        </PostCta>
        <SideBySide slug="iphone-notes-goals-template"
          apple={{ src: "/blog/side-by-side/goals-template-apple-notes", width: 1131, height: 820, line: "Keeps each tick beside its step. You untick on Monday and keep track of past weeks yourself.",
            alt: "The Goals for 2027 note in Apple Notes on macOS 27: a 10K, saving for Japan and a novel draft as headings, with Run 1 and 2 of 3 and Write 500 words 1 and 2 of 4 ticked." }}
          pinto={{ title: "The same goals in Pinto Notes", line: "Each goal counts the week, starts again on Monday and keeps a streak of the weeks you hit.",
            alt: "The same three goals in the Pinto Notes habit tracker on Wednesday 20 January 2027, started 4 January: Run for the 10K 2 of 3 this week and done today, Save $60 for Japan 0 of 1 and Write 500 words 2 of 4, each with a 2-week streak, and 4 of 8 since Monday. On a Mac, the week as a grid of dots too.",
            phone: { src: "/blog/side-by-side/goals-pinto-phone", width: 780, height: 1440 },
            desk: { src: "/blog/side-by-side/goals-pinto-mac", width: 1526, height: 940 },
            template: "habit-tracker" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Write your goals as headings, with this week&apos;s steps as checklist items under each one. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On iPhone, type a goal, select it, tap the Format button and choose Heading. Then tap the Checklist button and type its steps. Each Return adds another one. On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /></li>
        <li>Pin the goals note, so it stays at the top of your notes.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Touch and hold the note", "Pin Note"] },
            { on: "Mac", steps: ["File", "Pin Note"] },
          ]} /></li>
        <li>Tick each step as you do it, then untick everything each Monday. Notes keeps your ticks until you clear them.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Double-tap an item", "Checklist", "Uncheck All"] },
            { on: "Mac", steps: ["Format", "More", "Uncheck All"] },
          ]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-new-year-resolution-template">new year resolutions to tick each day</a>, <a href="/blog/apple-notes-habit-tracker">a habit tracker</a> and <a href="/blog/apple-notes-planner-template">a weekly planner</a>.</p>
    </PostPage>
  );
}
