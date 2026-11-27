import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, MenuPaths, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-75-hard-template", { title: "75 Hard Apple Notes template for a daily checklist" });

// Written 26 November 2026 for "75 hard apple notes template" (Google autocomplete, US: also "75 hard apple notes", "75 hard
// notes template", "75 hard notes app template"), in pattern E (lib/SideBySide.tsx), experiment B43. Words: Codex, GPT-6.1 Sol,
// checked and edited. Research: blog-growth/research/apple-notes-75hard-christmas-2026-11-26.md.
// The rules: Andy Frisella's own page, andyfrisella.com/blogs/articles/what-is-75-hard ("75 HARD Rules", read 26 Nov 2026):
// a diet for your goals with no cheat meals and no alcohol; two workouts of at least 45 minutes, 3 hours apart, one outside,
// any kind; a gallon of water; at least 10 pages of a nonfiction book, audiobooks don't count; a progress picture. Miss any
// and you start over at day 1, no substitutions. The doctor line is his page's own (andyfrisella.com/pages/75hard-info).
// No health advice of our own.
// Apple Notes: macOS 27.0 VM, Edit, Paste as Markdown: the # line the title, the day line plain text, every rule a
// checklist; the day line edited to 14, three items ticked and sorted down. Format, More, Uncheck All and File, Pin Note:
// the VM's own menus. iPhone Uncheck All: as on apple-notes-checklist-template. iPhone pin: support.apple.com/guide/iphone/organize-in-folders-ipha61270292/ios ("touch and hold the note, then tap Pin Note").
// Pinto Notes: content/templates/habit-tracker.app rendered with scripts/page-render with the same six lines as habits,
// started 13 November, on Thursday 26 November (public/blog/side-by-side/75-hard-pinto-*). Each day starts unticked and each
// habit keeps its streak (habit-tracker.app/docs/README.md). It doesn't know 75 Hard or count to 75, and the post doesn't say so.

const TEMPLATE = `# 75 Hard

Day 1 of 75. Miss one and start again at day 1.

## Every day
- [ ] Diet, no cheat meals or alcohol
- [ ] Workout, 45 minutes
- [ ] Outdoor workout, 45 minutes
- [ ] Drink a gallon of water
- [ ] Read 10 pages
- [ ] Take a progress picture
`;

const FAQ = [
  { q: "Do the two 75 Hard workouts have to be apart?", a: [
    "Yes. Andy Frisella's rules say both workouts are at least 45 minutes, 3 hours apart, and one of the two is outside. Any kind of workout counts.",
  ] },
  { q: "Does missing one 75 Hard task mean starting again?", a: [
    "Yes. His rule is to start over at day 1 if you miss any task, even if you did the others. There are no substitutions.",
  ] },
  { q: "Does an audiobook count toward the 10 pages?", a: [
    "No. The rule is at least 10 pages of a nonfiction book meant to improve you, read, not listened to.",
  ] },
  { q: "Is there a quick way to clear yesterday's ticks?", a: [
    "Yes. On a Mac, choose Format, More, Uncheck All. On iPhone, double-tap an item, then tap Checklist, Uncheck All.",
  ] },
  { q: "Can my 75 Hard ticks start empty each day while I keep my streaks?", a: [
    "Pinto Notes' free habit tracker starts each day unticked and keeps a streak for each habit. Add the six as habits, then tick in the app, or tell ChatGPT or Claude what you did and it ticks the day.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-75-hard-template"
      cover={false}
      intro={<>The 75 Hard rules as a daily checklist note. Tick each one as you go, and untick the list each night.</>}
      answer={<>
        <Keep title="75 Hard checklist for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B43: the download card on the first screen, under the template, as on every template post (B39). */}
        <PostCta slug="apple-notes-75-hard-template" position="answer" title="Tired of unticking your 75 Hard list every night?">
          <p>In Pinto Notes&apos; free habit tracker, each day starts unticked, and each of the six keeps its own streak.</p>
        </PostCta>
        <SideBySide slug="apple-notes-75-hard-template"
          apple={{ src: "/blog/side-by-side/75-hard-template-apple-notes", width: 721, height: 583, line: "Ticked tasks sort to the bottom. You change the day and untick the list each night.",
            alt: "The 75 Hard checklist in Apple Notes on macOS 27, set to Day 14 of 75, with Workout, Read 10 pages and Take a progress picture ticked at the bottom." }}
          pinto={{ title: "The same 75 Hard list in Pinto Notes", line: "Each day starts unticked, and each task keeps its streak and this week's dots.",
            alt: "The same six tasks in the Pinto Notes habit tracker on Thursday 26 November, started 13 November: Workout, Read 10 pages and Take a progress picture done with 14-day streaks, the other three not yet with 13-day streaks, 3 of 6 done today and 21 of 24 since Monday.",
            phone: { src: "/blog/side-by-side/75-hard-pinto-phone", width: 780, height: 2080 },
            desk: { src: "/blog/side-by-side/75-hard-pinto-mac", width: 1600, height: 845 },
            template: "habit-tracker" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="rules">The 75 Hard rules</h2>
      <p>From <a href="https://andyfrisella.com/blogs/articles/what-is-75-hard" rel="noopener">Andy Frisella&apos;s own page</a>. Every day for 75 days, with no substitutions:</p>
      <Steps>
        <li>Follow a diet that fits your goals, any diet, with no cheat meals and no alcohol.</li>
        <li>Do two workouts of at least 45 minutes, 3 hours apart. One of them is outside.</li>
        <li>Drink a gallon of water.</li>
        <li>Read at least 10 pages of a nonfiction book. Audiobooks don&apos;t count.</li>
        <li>Take a progress picture.</li>
      </Steps>
      <p>Miss any of them and you start again at day 1. His page says to check with your doctor before you start.</p>
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Keep the six lines. Change the diet or workout words if you like, and keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, tap the Checklist button and type the six. Each Return adds another one.</li>
        <li>Pin the note, so it&apos;s at the top of your notes every day.
          <MenuPaths rows={[
            { on: "Mac", steps: ["File", "Pin Note"] },
            { on: "iPhone", steps: ["Touch and hold the note", "Pin Note"] },
          ]} /></li>
        <li>Each night, change the day number and untick everything. Notes doesn&apos;t count the days or reset the list for you.
          <MenuPaths rows={[
            { on: "Mac", steps: ["Format", "More", "Uncheck All"] },
            { on: "iPhone", steps: ["Double-tap an item", "Checklist", "Uncheck All"] },
          ]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-habit-tracker">a habit tracker</a>, <a href="/blog/apple-notes-workout-log-template">a workout log</a>, <a href="/blog/iphone-notes-gym-template">a gym split</a> and <a href="/blog/apple-notes-checklist-template">a daily checklist</a>.</p>
    </PostPage>
  );
}
