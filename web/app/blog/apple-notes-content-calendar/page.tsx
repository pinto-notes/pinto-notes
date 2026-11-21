import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-content-calendar", { title: "Apple Notes content calendar template, with ideas" });

// Written 21 November 2026 for "apple notes content calendar" (topic-research-2026-11-20.md row 30). Autocomplete gave
// no variants that day: "content calendar template notes" returned noise, so this is a cheap copy of the working
// template post shape, with no demand evidence of its own. Apple Notes facts, all from earlier posts tried on macOS 27:
// Edit, Paste as Markdown turns #, ## and "- [ ]" lines into a title, headings and checklists, a plain Command-V keeps
// the symbols, and an empty item doesn't survive (apple-notes-templates); tab-separated lines selected, then the Table
// button, make a table, Format, Table (Option-Command-T) makes a 2x2 table, Tab in the last cell adds a row, column
// widths can't be dragged, and tables don't add up or sort (apple-notes-tables, wording copied from
// apple-notes-cornell-notes-template); File, Duplicate Note (apple-notes-meal-planner-template); typing #word makes a
// tag and a Smart Folder can filter by Tags (apple-notes-tags-smart-folders); Edit, Add Link, Command-K (apple-notes-ios-27);
// search reads every word and pinning a note (apple-notes-recipe-template); sharing a note needs an Apple Account for
// each person (apple-notes-meal-planner-template). Pinto side: web/content/templates/content-calendar.json (a Calendar
// table with Publish on, Title, Channel as a choice of Blog, Newsletter, LinkedIn, Instagram or YouTube, and Status as
// a choice of Idea, Drafting, Scheduled or Published; an Ideas list; a Voice list. The AI adds ideas under Ideas, plans
// the next two weeks as rows with Status Drafting, writes drafts in the Voice tone and sets Published when a post goes
// out; the asks "Plan the next two weeks: two LinkedIn posts and one newsletter." and "What's scheduled for this
// week?"). The picture is BlogSnapshots.contentCalendarForTemplatePost: the template's own example, drawn offscreen by
// the Mac app's NoteDetailView.

const SKELETON = `# Content calendar

## Calendar
Paste the table here.

## Ideas
- Three tools I use every day
- A day in support, in numbers
- What we stopped doing this year

## Voice
- Short sentences. One idea per post.
- Show the work: a screenshot or a number beats an adjective.
- End with a question, not a sales pitch.
`;

// Tabs between the columns: select these lines in Notes and press the Table button.
const TABLE = `Publish on\tTitle\tChannel\tStatus
2026-11-03\tFive questions for every new customer\tBlog\tPublished
2026-11-10\tWhat 100 customer calls taught us\tLinkedIn\tScheduled
2026-11-12\tNewsletter: three customer stories\tNewsletter\tDrafting
2026-11-17\tOur onboarding, before and after\tLinkedIn\tDrafting
2026-11-19\tBehind the scenes: the support desk\tInstagram\tIdea
`;

const FAQ = [
  { q: "Does Apple Notes have a content calendar template?", a: [
    "No. Apple Notes has no templates. One note with a table of posts (date, title, channel, status) and a list of ideas under it works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "Can Apple Notes sort a table by date?", a: [
    "No. Tables in Apple Notes don't sort. Write dates as 2026-11-03 so they read in order, and add each new post in its place by hand.",
  ] },
  { q: "Can my team edit the same content calendar in Apple Notes?", a: [
    "Yes, if you share the note. Each person needs an Apple Account, and everyone edits the same note.",
  ] },
  { q: "Is there a notes app that plans content for me?", a: [
    "Pinto Notes looks and works like Apple Notes and has a free content calendar template. Tell ChatGPT or Claude an idea and it saves it, or ask it to plan the next two weeks and it adds the posts to the calendar.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-content-calendar"
      intro={<>
        Posting every week is easier when the plan and the ideas live in one place you already open. Apple Notes can be that place with
        one note and a table. Here&apos;s a content calendar template for Apple Notes to paste in, how to keep it up week to week, and
        where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#weekly", label: "Week to week" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A calendar that plans with you" },
        ]}>
          <p>
            Apple Notes has no content calendar, but one note does the job: a table with the publish date, the title, the channel and
            the status, then a list of ideas and a few lines on how you write. Pin it, and add each idea the moment you have it.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-content-calendar" position="answer" template="content-calendar" title="Want the next two weeks planned for you?">
            <p>Pinto Notes works like Apple Notes and has a free content calendar. Tell ChatGPT or Claude an idea and it saves it, or ask it to plan two weeks of posts from your ideas.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/content-calendar-note" width={1520} height={1265} maxWidth={600}
        alt="A Content calendar note in Pinto Notes on a Mac: a Calendar table of five posts from 3 to 19 November with title, channel and status, an Ideas list of three and three Voice lines."
        caption="A content calendar in Pinto Notes, where Channel and Status are choices. In Apple Notes the same table holds them as typed words." />}
      faq={FAQ}
    >
      <h2 id="template">The template: a calendar, ideas and a voice</h2>
      <p>
        The calendar is a table, one row per post. The ideas are a plain list, so a half-formed thought costs one line. The voice is three
        rules you read before you write, so every post sounds like the last one. The note comes in two parts: the headings and lists
        first, then the table.
      </p>
      <Keep title="Content calendar for Apple Notes" text={SKELETON}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title and each ## line into a heading. A plain Command-V
        keeps the symbols as text. On iPhone, type it in. Then replace the line under Calendar with the table.
      </p>
      <Keep title="Calendar table" text={TABLE}
        note="Each line has a tab between the columns. Paste it, then turn those lines into a table." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the table lines under Calendar, select the six lines from Publish on to the
          last post, and press the Table button. Every tab becomes a column.
        </li>
        <li>
          <strong>Or start empty.</strong> Choose Format, Table for two rows and two columns, and Tab in the last cell adds the next row.
        </li>
        <li>
          <strong>Keep titles short.</strong> Notes sets the column widths itself and you can&apos;t drag them, so a long title squeezes
          the other columns. A working title of a few words is enough.
        </li>
        <li>
          <strong>Write dates the same way every time.</strong> 2026-11-03 reads in order down the column and is easy to search for.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers everything a table in Notes can and can&apos;t do.
      </p>

      <h2 id="weekly">Week to week</h2>
      <ul>
        <li>
          <strong>Pin it.</strong> A pinned note sits at the top of its folder, so an idea on the train goes straight into the list.
        </li>
        <li>
          <strong>Plan once a week.</strong> Move two or three ideas into the table with a date and Drafting, and delete them from
          the list.
        </li>
        <li>
          <strong>Draft in their own notes.</strong> Write each post in a separate note and link it from the calendar note with Edit, Add
          Link (Command-K), so the calendar stays short.
        </li>
        <li>
          <strong>Tag the drafts.</strong> Type #draft in each draft note, and a Smart Folder with a Tags rule gathers them in one place.
          Read <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> if one doesn&apos;t show up.
        </li>
        <li>
          <strong>Start a new note each quarter.</strong> Choose File, Duplicate Note, then clear out the published rows, and the ideas
          and voice come with you.
        </li>
      </ul>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link"], keys: "⌘K" },
        { on: "Mac", steps: ["File", "Duplicate Note"] },
      ]} />
      <p>
        If you plan posts in a team meeting, the <a href="/blog/apple-notes-meeting-notes-template">meeting notes template</a> keeps the
        decisions and who writes what. More notes to paste in are in <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a content calendar in Notes stops</h2>
      <ul>
        <li><strong>No sorting.</strong> Tables in Notes don&apos;t sort, so a post moved to another week means moving its row by hand.</li>
        <li><strong>Status is just a word.</strong> Nothing stops a typo, and you can&apos;t show only what&apos;s scheduled.</li>
        <li><strong>The planning is yours.</strong> Turning a list of ideas into two weeks of posts across channels is the slow part, every week.</li>
        <li><strong>The voice is a reminder.</strong> The three rules sit in the note, and keeping each draft to them is up to you.</li>
      </ul>
      <p>
        For one channel and a post a week, one note is all you need. With several channels, keeping the table current becomes the work.
      </p>

      <h2 id="pinto-notes">A content calendar that plans with you</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/content-calendar">content calendar</a> template is one note with a Calendar table, an
        Ideas list and your Voice. In the table, Channel is a choice of Blog, Newsletter, LinkedIn, Instagram or YouTube, and Status is
        Idea, Drafting, Scheduled or Published.
      </p>
      <p>
        Tell your AI an idea and it adds it under Ideas. Ask &ldquo;plan the next two weeks: two LinkedIn posts and one newsletter&rdquo;
        and it picks ideas from the list and adds a row for each post, with a date, a working title, the channel and Drafting. It writes
        drafts in the tone under Voice, and when you say a post went out, it sets it to Published. &ldquo;What&apos;s scheduled for this
        week?&rdquo; gets a straight answer from the table. This part works once ChatGPT or Claude is connected, and{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute. You can still edit every row yourself, and
        every earlier version of the note is kept.
      </p>
      <p>
        The plans you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
