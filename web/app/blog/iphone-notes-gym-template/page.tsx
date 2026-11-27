import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, MenuPaths, PasteSteps, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("iphone-notes-gym-template", { title: "iPhone Notes gym template: push, pull and legs" });

// Written 27 November 2026 for "iphone notes gym template" (Google autocomplete, US: also "apple notes gym template", "apple
// notes gym tracker", "iphone notes workout template", "iphone notes workout plan", "notes app workout template"), in pattern E
// (lib/SideBySide.tsx), experiment B46. Page 1 is two workout apps' blogs with copy-paste splits, App Store workout apps and
// r/AppleNotesGang. This is the split you reuse every session with last time's weight on each line; the weekly log with
// personal bests is apple-notes-workout-log-template. Words: Codex, GPT-6.1 Sol, checked and edited. Research:
// blog-growth/research/apple-notes-gym-itinerary-2026-11-27.md.
// Apple Notes: macOS 27.0 VM, Edit, Paste as Markdown: the # line the title, the plain line text, each day a heading, every lift
// a checklist; Deadlift and Rows ticked, sorting left off (Not Now). File, Pin Note: the VM's File menu. iPhone pin:
// support.apple.com/guide/iphone/organize-in-folders-ipha61270292/ios. iPhone Checklist button: support.apple.com/102296.
// Pinto Notes: content/templates/workout-log.app drawn by scripts/blog-side-by-side-apps.ts (gym-template) with the same split
// and the same last weights, on Friday 27 November: Today, Pull next, "Last: 125 kg × 3". Start filled in with last time's
// sets, the AI logging a session and saying if it was a best: workout-log.app/docs/README.md.

const TEMPLATE = `# Gym: push, pull, legs

The weight after each lift is last time's. Change it when you go up.

## Push
- [ ] Bench press 3 x 6, last 72.5 kg
- [ ] Overhead press 3 x 8, last 40 kg
- [ ] Dips 3 x 10

## Pull
- [ ] Deadlift 3 x 3, last 125 kg
- [ ] Rows 3 x 8, last 60 kg
- [ ] Pull-ups 3 x 6

## Legs
- [ ] Squat 3 x 5, last 102.5 kg
- [ ] Lunges 3 x 10, last 16 kg
- [ ] Calf raises 3 x 15
`;

const FAQ = [
  { q: "What does push, pull, legs mean in this note?", a: [
    "Each heading is one gym day, with its lifts under it. You do the three days in turn and reuse the same checklists each time.",
  ] },
  { q: "How do I keep the gym note at the top on iPhone?", a: [
    "Touch and hold the note in the list, then tap Pin Note. It stays at the top of your notes list.",
  ] },
  { q: "Will the lift show the weight from the previous session?", a: [
    "Only if you typed it there. Notes keeps the \"last\" weight on the line, but it doesn't remember each session or change that weight for you.",
  ] },
  { q: "Can the split note also hold a record of every session?", a: [
    "Yes. Add a dated line under the day for each session, though the note grows as you go. A separate note each week keeps the split short.",
  ] },
  { q: "Can ChatGPT or Claude log my gym sessions?", a: [
    "Yes, in Pinto Notes' free workout log. Tell your AI what you lifted and it logs the session, and says if it was a best.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="iphone-notes-gym-template"
      cover={false}
      intro={<>Your gym split as a checklist note, with last time&apos;s weight beside each lift. Open it on your iPhone between sets.</>}
      answer={<>
        <Keep title="Gym split for iPhone Notes" text={TEMPLATE} fold={10}
          note={<PasteSteps />} />
        {/* Experiment B46: the download card on the first screen, under the template, as on every template post (B39). */}
        <PostCta slug="iphone-notes-gym-template" position="answer" title="Guessing what you lifted last time?">
          <p>In Pinto Notes&apos; free workout log, Start fills in last time&apos;s sets for the next workout. Change a number or two and log it.</p>
        </PostCta>
        <SideBySide slug="iphone-notes-gym-template"
          apple={{ src: "/blog/side-by-side/gym-template-apple-notes", width: 945, height: 863, line: "Keeps the weights you type. Keeping \"last\" right and knowing which day is next is up to you.",
            alt: "The gym split in Apple Notes on macOS 27: Push, Pull and Legs as checklists with last time's weight on each lift, and Deadlift and Rows ticked under Pull." }}
          pinto={{ title: "The same gym split in Pinto Notes", line: "Pull is next, with last time beside each lift. Start fills in those sets for you.",
            alt: "The same split and weights in the Pinto Notes workout log on Friday 27 November: 2 of 3 sessions this week, Pull next with Deadlift last 125 kg × 3, Rows last 60 kg × 8 and Pull-ups last 6 reps, and a Start Pull button. On a Mac, recent sessions and the latest bests too.",
            phone: { src: "/blog/side-by-side/gym-template-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/gym-template-pinto-mac", width: 3000, height: 1328 },
            template: "workout-log" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Change the lifts and weights to yours. Keep a word in every line: an empty checklist item doesn&apos;t survive the paste.</li>
        <li>On a Mac, make a new note and paste with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the day headings, then tap the Checklist button and type the lifts under each one. Each Return adds another one.</li>
        <li>Pin the note, so it&apos;s at the top of Notes when you get to the gym.
          <MenuPaths rows={[
            { on: "iPhone", steps: ["Touch and hold the note", "Pin Note"] },
            { on: "Mac", steps: ["File", "Pin Note"] },
          ]} /></li>
        <li>Tick each lift when you&apos;re done. When the weight goes up, change &quot;last&quot; on that line there and then. Untick the day&apos;s lifts before you do that day again.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-workout-log-template">a weekly workout log with your bests</a>, <a href="/blog/apple-notes-habit-tracker">a habit tracker</a> and <a href="/blog/apple-notes-75-hard-template">a 75 Hard checklist</a>.</p>
    </PostPage>
  );
}
