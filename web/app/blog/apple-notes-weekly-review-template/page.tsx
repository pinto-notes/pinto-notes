import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-weekly-review-template", { title: "Weekly review template for Apple Notes: five questions" });

// Written 21 November 2026 for "weekly review template" (Google autocomplete 20 Nov: weekly review template, with pdf,
// notion, gtd, obsidian, free and reddit; "apple notes weekly review" itself gave nothing; topic-research-2026-11-20.md
// row 15). The result page: Notion, GTD and Obsidian pages, no Apple Notes version. Apple Notes facts, all from earlier
// posts tried on macOS 27: Edit, Paste as Markdown turns #, ## and "- [ ]" lines into a title, headings and checklists,
// a plain Command-V keeps the symbols, and an empty item doesn't survive (apple-notes-templates, which also has a short
// weekly review to copy); "Automatically sort checked items" (apple-notes-meal-planner-template); pin a note and search
// reads every word (apple-notes-recipe-template); typing #word makes a tag (apple-notes-tags-smart-folders). Pinto side:
// web/content/templates/weekly-review.json (a Weekly review note with five questions and a Reviews section, newest week
// first; the AI asks the questions one at a time, then adds a "Week of" heading with Monday's date, the answers as short
// bullets in your own words and the top three as a checklist, and ticks them when you say; the asks "What did I say I'd
// focus on last week?" and "What keeps coming up in my reviews?"). The picture is
// BlogSnapshots.weeklyReviewForTemplatePost: the template's own example, drawn offscreen by the Mac app's NoteDetailView.

const TEMPLATE = `# Weekly review

Twenty minutes on Sunday. Newest week first.

## Questions
1. What went well this week?
2. What didn't, and why?
3. What did I learn?
4. What am I grateful for?
5. What are my top three for next week?

## Week of 2 November
- Went well: handed in the report a day early; trained four times.
- Didn't: no deep work on Thursday, too many meetings.
- Learned: a 30-minute agenda beats a 60-minute meeting.
- Grateful for: dinner with my sister.
- [ ] Block Thursday mornings for deep work
- [ ] Send the Q4 plan to Jonas
- [ ] Book the dentist
`;

const FAQ = [
  { q: "Does Apple Notes have a weekly review template?", a: [
    "No. Apple Notes has no templates. One note with your questions at the top and a heading for each week below works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "What questions go in a weekly review?", a: [
    "Five is enough: what went well, what didn't and why, what you learned, what you're grateful for, and your top three for next week. The last one is the part you'll use on Monday.",
  ] },
  { q: "One note per week, or one note for every week?", a: [
    "One note for every week, newest at the top. Last week's top three is right under this week's, and search finds a word across all of them.",
  ] },
  { q: "Is there a weekly review that asks me the questions?", a: [
    "Pinto Notes has a free weekly review template. Tell ChatGPT or Claude it's time for your review and it asks the five questions one at a time, then writes the week up in your note.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-weekly-review-template"
      intro={<>
        A weekly review is twenty minutes on Sunday that saves a vague Monday. It only works if the questions are the same every week, so
        they belong in a note you keep. Here&apos;s a weekly review template for Apple Notes, how to make it a habit, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#sunday", label: "On Sunday" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A review that asks you" },
        ]}>
          <p>
            Apple Notes has no weekly review template, but one note does the job: five questions at the top, then a heading for each week
            with your answers as short lines and next week&apos;s top three as a checklist. Add the newest week at the top, so last
            week&apos;s plan is right under it.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-weekly-review-template" position="answer" template="weekly-review" title="Want the questions asked for you?">
            <p>Pinto Notes works like Apple Notes and has a free weekly review template. ChatGPT or Claude asks you the five questions, then writes the week up in your note.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-review-note" width={1520} height={989} maxWidth={600}
        alt="A Weekly review note in Pinto Notes on a Mac: five numbered questions, then a Week of 2 November review with what went well, what didn't, what was learned and a thank-you, and a top three checklist with Book the dentist ticked."
        caption="A weekly review in Pinto Notes, the way the template writes it up. The same layout works in Apple Notes, with a heading for each week. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: five questions, one note</h2>
      <p>
        The questions sit at the top so you never have to remember them. Each week gets a heading with Monday&apos;s date, a line per
        answer, and the top three as a checklist you tick during the week. Keep a word in every line, because an empty checklist item
        doesn&apos;t survive the paste.
      </p>
      <Keep title="Weekly review for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <ul>
        <li>
          <strong>Paste it once.</strong> On a Mac with macOS 27, make a note and choose Edit, Paste as Markdown. The # line becomes the
          title, each ## line a heading and the top three a checklist. A plain Command-V keeps the symbols as text. On iPhone, type it
          in, select the top three and tap the checklist button.
        </li>
        <li>
          <strong>Keep the example week as a guide.</strong> Leave it for your first Sunday, then replace it with your own.
        </li>
        <li>
          <strong>Pin it.</strong> Pin the note to the top of its folder, so it&apos;s there when you open Notes on Sunday.
        </li>
      </ul>

      <h2 id="sunday">On Sunday</h2>
      <ul>
        <li>
          <strong>Start with last week&apos;s top three.</strong> Tick what got done before you write anything new. What&apos;s still open
          either moves into next week&apos;s three or gets dropped on purpose.
        </li>
        <li>
          <strong>Add the new week at the top.</strong> Copy last week&apos;s block, paste it under the questions and change the date
          and the lines. A few words per answer is fine, as long as you&apos;d understand them in a month.
        </li>
        <li>
          <strong>Pick three, not ten.</strong> Three things you&apos;d be glad to have done by Friday. With Automatically sort checked
          items on, ticked ones move to the bottom of the list.
        </li>
        <li>
          <strong>Look back once a month.</strong> Search reads every word, so searching &ldquo;meetings&rdquo; shows how often they were
          the problem. A tag like #review in the note keeps it one tap away in the sidebar.
        </li>
      </ul>
      <p>
        A shorter weekly review, with the same idea, is one of the notes in <a href="/blog/apple-notes-templates">Apple Notes
        templates</a>. To track what you do every day between reviews, the <a href="/blog/apple-notes-habit-tracker">Apple Notes habit
        tracker</a> fits next to it, and the <a href="/blog/apple-notes-journal-template">journal template</a> is for the days themselves.
      </p>

      <h2 id="limits">Where a weekly review in Notes stops</h2>
      <ul>
        <li><strong>The questions don&apos;t ask themselves.</strong> On a tired Sunday, a list of questions is easy to skip.</li>
        <li><strong>Carrying over is by hand.</strong> Last week&apos;s unticked items stay where they are until you copy them up.</li>
        <li><strong>Patterns mean reading back.</strong> Search finds a word. It can&apos;t tell you what keeps coming up across two months of reviews.</li>
      </ul>
      <p>
        If the habit already sticks, the note is all you need. If it slips on busy weeks, the asking is the part that&apos;s missing.
      </p>

      <h2 id="pinto-notes">A weekly review that asks you</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/weekly-review">weekly review</a> template is one note with the five questions and a
        Reviews section, newest week first.
      </p>
      <p>
        Tell your AI it&apos;s time for your weekly review. It asks the five questions one at a time, then adds
        the week to the top of Reviews: a Week of heading with Monday&apos;s date, your answers as short lines in your own words, and your
        top three as a checklist. Tell it one is done and it ticks it. Ask &ldquo;what did I say I&apos;d focus on last week?&rdquo; or
        &ldquo;what keeps coming up in my reviews?&rdquo; and it reads back through the note to answer. You can still write and tick
        everything yourself, and every earlier version of the note is kept. This part works once ChatGPT or Claude is
        connected; <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The notes you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
