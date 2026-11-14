import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-habit-tracker", { title: "Apple Notes habit tracker template, and where it stops" });

// Written 14 November 2026 for "apple notes habit tracker" (autocomplete: ...template, iphone notes habit tracker):
// blog-growth/topic-research-2026-11-13.md. The result page is template spam, a ClickUp roundup and App Store
// listings; nothing shows a working tracker in Notes. Apple Notes facts, all from what earlier posts tested on
// macOS 27 or Apple's Mac guide "Add lists in Notes on Mac" (support.apple.com/guide/notes/apd93c815aa0/mac, read
// 14 Nov): Edit, Paste as Markdown turns "- [ ]" lines into a checklist and drops empty items (apple-notes-templates);
// File, Duplicate Note (apple-notes-version-history); Format, More, Check All or Uncheck All, and Command-click on
// an item checks or unchecks them all; "Automatically sort checked items" in Notes settings; Smart Folder rule
// Checklists, Unchecked (apple-notes-tags-smart-folders). iPhone steps kept to the checklist button, which the
// templates post already states. Pinto side: web/content/templates/habit-tracker.app README and habit-tracker.json.

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
    "No. Apple Notes has no habit tracker and no templates. A note with a heading for each day and a checklist of your habits under it works as one: you tick the habits as you do them and start a fresh copy each week.",
  ] },
  { q: "How do I reset a checklist in Apple Notes?", a: [
    "On a Mac, click in the checklist and choose Format, More, Uncheck All. Resetting loses what you ticked, so for a habit tracker, duplicate the note first and reset the copy.",
  ] },
  { q: "Can Apple Notes count my streak?", a: [
    "No. Notes doesn't count ticks across notes or days, so a streak is something you count yourself, scrolling back through the weeks.",
  ] },
  { q: "Is there a free habit tracker that works like a note?", a: [
    "Pinto Notes has a free habit tracker template: a note that is a small app, with this week's ring, a tick per habit, streaks and a month view. ChatGPT or Claude can log what you did to it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-habit-tracker"
      intro={<>
        You want to track a few habits in the app you already open every day, not sign up for another one. Apple Notes can do a simple
        version. Here&apos;s a weekly template to paste in, how to keep it going, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#every-week", label: "Every week" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A tracker that counts" },
        ]}>
          <p>
            Apple Notes has no habit tracker, but a checklist does the daily part. Make one note per week with a heading for each day
            and your habits as a checklist under it, tick them as you go, and duplicate the note on Monday. Copy the template below.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-habit-tracker" position="answer" title="Want your streaks counted for you?">
            <p>Pinto Notes works like Apple Notes and has a free habit tracker template: tick a habit in one tap and see this week&apos;s ring, your streaks and the month. ChatGPT or Claude can log the day for you.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/template-copies" width={1200} height={750} maxWidth={560}
        alt="Three drawn checklist cards fanned out, with tally marks beside them."
        caption="A habit tracker in Notes is a checklist you copy every week." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one week of habits</h2>
      <p>
        Three habits, seven days, and a place to say how the week went. Swap in your own habits before you paste; keep every line
        with a word in it, because an empty checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="Weekly habit tracker for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <PostFigure src="/blog/macos27/notes27-paste-as-markdown" width={1328} height={400} maxWidth={640}
        alt="The same Markdown pasted twice in Apple Notes on macOS 27: with Command-V the symbols stay as text, and with Edit, Paste as Markdown it becomes a heading, a list and bold text."
        caption="Plain paste on the left, Paste as Markdown on the right. The same goes for checklist lines." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, make a new note and choose Edit, Paste as Markdown. The # line becomes the title, each day becomes a
        heading and the <code>- [ ]</code> lines become a checklist you can tick. A plain Command-V keeps the symbols as text. On
        iPhone, type the habits as lines, select them and tap the checklist button.
      </p>
      <p>
        Two settings help. Turn on Automatically sort checked items in the Notes settings, and what you&apos;ve done drops to the
        bottom of each day. And a Smart Folder with the rule Checklists, Unchecked shows every note with something left to tick;{" "}
        <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> shows how to make one.
      </p>

      <h2 id="every-week">Every week</h2>
      <p>
        On Monday, select last week&apos;s note and choose File, Duplicate Note, then change the date in the title and untick
        everything: click in each day&apos;s checklist and choose Format, More, Uncheck All. Keep the old notes in a Habits folder. That folder is your history.
      </p>
      <p>
        If you keep other routines this way too, <a href="/blog/apple-notes-templates">Apple Notes templates</a> has a weekly review
        and a Today list to paste in the same way.
      </p>

      <h2 id="limits">Where a habit tracker in Notes stops</h2>
      <ul>
        <li><strong>No streaks.</strong> Notes doesn&apos;t count ticks, so how many days in a row you&apos;ve walked is something you count by scrolling back through old weeks.</li>
        <li><strong>No week at a glance.</strong> Each day is its own checklist. Seeing which habit you keep missing means reading the whole note.</li>
        <li><strong>Every habit, every day.</strong> A habit you want three times a week, or eight glasses of water, doesn&apos;t fit a single tick.</li>
        <li><strong>A copy every Monday.</strong> Miss the duplicate and the week&apos;s ticks land in last week&apos;s note.</li>
      </ul>
      <p>
        For three habits and a little discipline, the note works. Past that, you&apos;re doing the tracking that an app could do.
      </p>

      <h2 id="pinto-notes">A habit tracker that counts for you</h2>
      <Figure shot={SHOTS.habitApp} caption="The habit tracker template in Pinto Notes on a Mac, with example data: this week's ring, today's habits with their streaks, and Gym at 1 of 3 this week." />
      <p>
        That&apos;s why I made Pinto Notes. It looks and works like Apple Notes on iPhone and Mac, and a note can also be a small app.
        The free <a href="/templates/habit-tracker">habit tracker</a> template is one. You pick your habits once, tick them in one tap,
        and it shows this week&apos;s ring, each habit&apos;s streak and best run, and a month you can fill in after the fact. A habit
        can be every day, some weekdays, a few times a week, or a count like glasses of water.
      </p>
      <p>
        You can also tell ChatGPT or Claude what you did, in the chat you already use, and it ticks the day in the note. Ask it which
        habit you missed most this month and it reads the tracker to answer.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed.
      </p>
    </PostPage>
  );
}
