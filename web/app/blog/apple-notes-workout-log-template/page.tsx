import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-workout-log-template", { title: "Apple Notes workout log template, with your bests" });

// Written 19 November 2026 for "apple notes workout log template"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0, Edit, Paste as Markdown, sorting off): title,
// headings, the sets as checklists, Program and Personal bests as dashed lists. Monday's three sets and Wednesday's bench
// press ticked.
// Pinto Notes: the workout log app (content/templates/workout-log.app, an app since 22 November 2026) with the same program
// (Legs, Push, Pull), Monday's legs and Wednesday's bench press logged as sessions, and the sessions that set the same four
// bests (squat 2 Nov, bench 4 Nov, 5 km run 5 Nov, deadlift 6 Nov), seen on Wednesday 25 November: Today on a Mac, Progress
// with the personal bests on iPhone. Drawn by scripts/blog-side-by-side-apps.ts (workout-log) with the render service's code.

const TEMPLATE = `# Workout log, week of 23 November

## Program
- Legs: squat, lunges, calf raises
- Push: bench press, overhead press, dips
- Pull: deadlift, rows, pull-ups

## Monday: legs
- [ ] Squat 3 x 5 at 100 kg
- [ ] Lunges 3 x 10 at 16 kg
- [ ] Calf raises 3 x 15

## Wednesday: push
- [ ] Bench press 3 x 6 at 70 kg
- [ ] Overhead press 3 x 8 at 40 kg
- [ ] Dips 3 x 10

## Friday: pull
- [ ] Deadlift 3 x 3 at 120 kg
- [ ] Rows 3 x 8 at 60 kg
- [ ] Pull-ups 3 x 6

## Personal bests
- Deadlift: 120 kg x 3 (6 Nov)
- Squat: 100 kg x 5 (2 Nov)
- Bench press: 70 kg x 6 (4 Nov)
- 5 km run: 29 min (5 Nov)
`;

const FAQ = [
  { q: "Does Apple Notes have a workout template?", a: [
    "No. Apple Notes has no templates and no workout log. One note per week, with a heading for each training day and the sets as a checklist, works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "Should I log workouts in a checklist or a table?", a: [
    "A checklist is quicker in the gym: tick each set and change the weight if it was different. A table, from Format, Table, lines up dates and weights, but Notes can't sort it or add it up.",
  ] },
  { q: "How do I track personal bests in Apple Notes?", a: [
    "Keep a Personal bests list at the bottom of the note and change a line when you beat it, with the date. Notes won't spot a new best for you, so check the list after each session.",
  ] },
  { q: "Is there a workout log that keeps my bests for me?", a: [
    "Pinto Notes has a free workout log template, a small app in a note: your plan, every session, and the personal bests it works out from them. Tell ChatGPT or Claude what you did after training and it logs the session and tells you if it was a best.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-workout-log-template"
      cover={false}
      intro={<>One note a week: your program, each day&apos;s sets as a checklist, and your bests.</>}
      answer={<>
        <Keep title="Workout log for Apple Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-workout-log-template" position="answer" title="Want your bests spotted for you?">
          <p>Pinto Notes&apos; free workout log works out your personal bests from every session. Tell your AI what you lifted and it logs it.</p>
        </PostCta>
        <SideBySide slug="apple-notes-workout-log-template"
          apple={{ src: "/blog/side-by-side/workout-log-template-apple-notes", width: 800, height: 1186, line: "Ticks the sets. Spotting a new best is up to you.",
            alt: "The workout template in Apple Notes on macOS 27: the program, Monday's three sets and Wednesday's bench press ticked, Friday's sets open, and four personal bests." }}
          pinto={{ title: "The same week in Pinto Notes", line: "Logs every session and works out your bests. Tell your AI what you lifted and it logs it.",
            alt: "The same week in the Pinto Notes workout log app on Wednesday 25 November: 2 of 3 sessions done, Pull next with last time's weights, and the same personal bests.",
            phone: { src: "/blog/side-by-side/workout-log-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/workout-log-pinto-mac", width: 1526, height: 1280 },
            template: "workout-log" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the program and the exercises to yours, then the weights. Keep a word in every line.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the lines, select the sets and tap the checklist button.</li>
        <li>Tick each set as you finish it. If the weight was different, change the line there and then.</li>
        <li>When a set beats a line in Personal bests, change that line and its date. On Sunday, duplicate the note and untick each day: <MenuPath steps={["Format", "More", "Uncheck All"]} /></li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-habit-tracker">a habit tracker</a>, <a href="/blog/apple-notes-mood-tracker">a mood tracker</a>, <a href="/blog/apple-notes-75-hard-template">a 75 Hard checklist</a> and <a href="/blog/iphone-notes-gym-template">a gym split for your iPhone</a>. Pinto Notes has a free <a href="/templates/workout-log">workout log template</a>.</p>
    </PostPage>
  );
}
