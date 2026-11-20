import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-workout-log-template", { title: "Apple Notes workout log template, with your bests" });

// Written 19 November 2026 for "apple notes workout log" (Google autocomplete 19 Nov: apple notes workout template,
// apple notes workout tracker, apple notes workout log template, apple notes gym tracker, apple notes gym template,
// iphone notes workout template, iphone notes workout plan, apple notes fitness tracker). The result page that day:
// template spam on borrowed domains, App Store listings for gym apps, a Hulry Shortcuts how-to and a closed Apple
// Community thread. Why now: the template posts convert (budget template 2 App Store of 8 entrants, trip planner 1 of 1,
// week to 19 Nov). Apple Notes facts, all from earlier posts that were tried in Notes on macOS 27: Edit, Paste as
// Markdown turns #, ## and "- [ ]" lines into a title, headings and checklists, and an empty item doesn't survive
// (apple-notes-templates); File, Duplicate Note and Format, More, Uncheck All (apple-notes-meal-planner-template, from
// Apple's "Add lists in Notes on Mac"); Format, Table, no sort and no sum in a table (apple-notes-tables). Pinto side:
// web/content/templates/workout-log.json (a Sessions table with typed columns Date, Workout as Push/Pull/Legs/Run/Other,
// Exercise, Result and Effort 1 to 10; a Personal bests list your AI keeps; the asks "Am I getting stronger on bench?"
// and "What did I do last Wednesday?"). The Pinto picture is BlogSnapshots.workoutLogForTemplatePost: the template's
// own filled-in example as a note, drawn offscreen by the Mac app's NoteDetailView.

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
    "A checklist is quicker in the gym: tick each set and change the weight if it was different. A table, from Format, Table, lines up dates and weights, but Notes can't sort it or add it up, so it helps less than it looks.",
  ] },
  { q: "How do I track personal bests in Apple Notes?", a: [
    "Keep a Personal bests list at the bottom of the note and change a line when you beat it, with the date. Notes won't spot a new best for you, so check the list after each session.",
  ] },
  { q: "Is there a workout log that keeps my bests for me?", a: [
    "Pinto Notes has a free workout log template: a row per session and a list of personal bests. Tell ChatGPT or Claude what you did after training and it logs the session and updates your bests.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-workout-log-template"
      intro={<>
        A gym app wants an account, a plan and a subscription before your first squat. A note just wants the sets. Here&apos;s a workout
        log template for Apple Notes to paste in, how to use it in the gym, and where it stops being enough.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#gym", label: "In the gym" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A log that keeps your bests" },
        ]}>
          <p>
            Apple Notes has no workout log, but one note per week does the job. Put your program at the top, a heading for each training
            day with the sets as a checklist, and your personal bests at the bottom. Copy the template below, and duplicate it each week.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-workout-log-template" position="answer" title="Want your bests kept for you?">
            <p>Pinto Notes works like Apple Notes and has a free workout log template. Tell ChatGPT or Claude what you did after training and it logs the session and updates your personal bests.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/workout-log-note" width={1520} height={1020} maxWidth={640}
        alt="A Workout log note in Pinto Notes on a Mac: a Sessions table with a row per session, from a Pull day with Deadlift 115 kg x 3 to Deadlift 120 kg x 3, and a Personal bests list below it."
        caption="The same log in Pinto Notes: a row per session, and your bests kept up to date. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note per week</h2>
      <p>
        A push, pull and legs week as an example. Change the program and the exercises to yours, then the weights. Keep a word in every
        line, because an empty checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="Workout log for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, make a new note and choose Edit, Paste as Markdown. The # line becomes the title, each ## line a heading,
        and the sets become checklists. A plain Command-V keeps the symbols as text. On iPhone, type the lines, select the sets and tap
        the checklist button. Put the note in a Health folder and pin it, so it&apos;s the first thing you see when you open Notes at the
        gym.
      </p>

      <h2 id="gym">In the gym</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "Duplicate Note"] },
        { on: "Mac", steps: ["Format", "More", "Uncheck All"] },
      ]} />
      <ul>
        <li>
          <strong>Tick each set as you finish it.</strong> If the weight or the reps were different, change the line there and then:
          &ldquo;Squat 3 x 5 at 102.5 kg&rdquo;. That edited line is your log.
        </li>
        <li>
          <strong>Write how it felt.</strong> A word after the line, like &ldquo;easy&rdquo; or &ldquo;last rep slow&rdquo;, tells next week&apos;s
          you whether to add weight.
        </li>
        <li>
          <strong>Next week from this one.</strong> On Sunday, choose File, Duplicate Note, change the date and the weights, and click in
          each day and choose Format, More, Uncheck All.
        </li>
        <li>
          <strong>A new best goes at the bottom.</strong> When a set beats a line in Personal bests, change that line and its date.
        </li>
      </ul>
      <p>
        If you&apos;d rather see the weeks in a grid, Format, Table makes one; <a href="/blog/apple-notes-tables">tables in Apple Notes</a>{" "}
        shows how, and what they can&apos;t do. For a log of habits rather than sets, there&apos;s an{" "}
        <a href="/blog/apple-notes-habit-tracker">Apple Notes habit tracker</a>, and more notes to paste in like this one in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a workout log in Notes stops</h2>
      <ul>
        <li><strong>Every week is its own note.</strong> To see how your bench press went this month, you open four notes and read them side by side.</li>
        <li><strong>Bests are by hand.</strong> Notes doesn&apos;t notice that 120 kg beat 115 kg. You check the list and change it yourself, or you don&apos;t.</li>
        <li><strong>Tables don&apos;t count.</strong> A table in Notes can&apos;t sort by exercise or add up a week&apos;s volume.</li>
        <li><strong>No answers.</strong> &ldquo;What did I do last Wednesday?&rdquo; means scrolling.</li>
      </ul>
      <p>
        For one week, a note is the fastest log there is. Across months, the useful part, seeing that you&apos;re getting stronger, is left to you.
      </p>

      <h2 id="pinto-notes">A workout log that keeps your bests</h2>
      <p>
        That&apos;s why I made Pinto Notes. It looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your
        notes from the chat you already use. The free <a href="/templates/workout-log">workout log</a> template is one note for all
        your training: a table with a row per session, with a date, the workout, the exercise, the result and how hard it felt from
        1 to 10, and your personal bests below it.
      </p>
      <p>
        After training, tell your AI what you did: &ldquo;deadlift, 120 for three, felt like a nine&rdquo;. It adds the row and, when
        it&apos;s a new best, changes that line too. Then ask &ldquo;am I getting stronger on bench?&rdquo; or &ldquo;what did I do last
        Wednesday?&rdquo; and it answers from the whole log. You can still add and edit every row yourself, and every earlier version of
        the note is kept. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed.
      </p>
    </PostPage>
  );
}
