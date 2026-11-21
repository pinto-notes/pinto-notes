import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-job-search-tracker", { title: "Job search tracker template for Apple Notes" });

// Written 21 November 2026 for "job search tracker template" and "job application tracker template" (Google
// autocomplete 20 Nov: job search tracker template, job application tracker template, with google sheets, notion and
// free download among the 8 variants; "apple notes job search tracker" itself gave nothing; topic-research-2026-11-20.md
// row 9). The result page: Sheets and Notion templates from big publishers, no notes-app version. The reader here wants
// a tracker in the notes app they already open, not a spreadsheet. Apple Notes facts, all from earlier posts tried on
// macOS 27: Format, Table (Option-Command-T) makes a table of two rows and two columns; type rows with a tab between
// columns, select them and press the Table button; Tab in the last cell adds a row; column widths can't be dragged;
// tables don't add up or sort (apple-notes-tables, apple-notes-cornell-notes-template). Paste as Markdown is NOT used
// for the table: only headings, lists and checklists were verified for it (apple-notes-templates). "Automatically sort
// checked items" (apple-notes-meal-planner-template); Edit, Add Link, Command-K (apple-notes-recipe-template); pin a
// note and search reads every word (apple-notes-recipe-template). Pinto side: web/content/templates/job-hunt.json (an
// Applications table with Company, Role, Stage as a choice of Saved, Applied, Interview, Offer, Rejected or Withdrawn,
// and Next step; Interview prep, This week and People I've talked to; the AI adds a row from a pasted job ad or link,
// updates the stage, writes five likely questions with talking points before an interview, and lists the week's
// follow-ups as a checklist; the asks "I have a first interview with Tideway on Thursday. Help me prep." and "What
// should I follow up on this week?"). The picture is BlogSnapshots.jobHuntForTemplatePost: the template's own example,
// drawn offscreen by the Mac app's NoteDetailView.

// Tabs between the columns: select those lines in Notes and press the Table button.
const TABLE = `Job hunt

Company\tRole\tStage\tNext step
Tideway\tSenior designer\tInterview\tFirst interview, 12 Nov
Marlow Studio\tDesign lead\tApplied\tFollow up, 16 Nov
Finch Bikes\tProduct designer\tSaved\tApply by 18 Nov
Northlight\tUX designer\tRejected\tAsked for feedback
`;

const REST = `## Interview prep
Tideway, first interview 12 Nov
1. A project you're proud of? The onboarding redesign.
2. How do you work with engineers? Weekly reviews, ship small.
3. Why Tideway? I like untangling logistics.

To ask them: how do design and support share what they hear?

## This week
- [ ] Send the portfolio link to Tideway
- [ ] Add the onboarding project to the CV

## People I've talked to
- Karin, design manager at Tideway: cares more about plain prototypes than polish.
`;

const FAQ = [
  { q: "Can I track job applications in Apple Notes?", a: [
    "Yes, with a table. Make one row per job with the company, the role, the stage and the next step, and keep the follow-ups as a checklist under it. Apple Notes has no templates, so paste the one on this page into a new note.",
  ] },
  { q: "Can Apple Notes sort my applications by stage?", a: [
    "No. Tables in Notes don't sort or add up. Keep the stage words the same every time (Saved, Applied, Interview, Offer, Rejected) so the column is quick to read.",
  ] },
  { q: "Is a spreadsheet better for a job search?", a: [
    "A spreadsheet sorts and filters, which helps past a few dozen applications. A note keeps the table next to your interview prep and the people you've talked to, on your phone between interviews.",
  ] },
  { q: "Is there a job tracker that fills itself in?", a: [
    "Pinto Notes has a free job hunt template. Paste a job ad into ChatGPT or Claude and it adds the row, then keeps the stage and next step up to date as you tell it what happened.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-job-search-tracker"
      intro={<>
        Most job search trackers are spreadsheets, and a spreadsheet is one more thing to open. If you already live in Apple Notes, one
        note can hold every application and what happens next. Here&apos;s a job search tracker template for Apple Notes, how to keep it
        current, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#week", label: "Week to week" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A tracker that updates itself" },
        ]}>
          <p>
            Apple Notes has no job tracker template, but one note with a table does the job: a row per application with the company, the
            role, the stage and the next step. Under the table, keep your interview prep, a checklist of this week&apos;s follow-ups and
            the people you&apos;ve talked to.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-job-search-tracker" position="answer" template="job-hunt" title="Want the tracker kept up for you?">
            <p>Pinto Notes works like Apple Notes and has a free job hunt template. Paste a job ad into ChatGPT or Claude and it adds the row, then helps you prep for the interview.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/job-hunt-note" width={1520} height={1514} maxWidth={600}
        alt="A Job hunt note in Pinto Notes on a Mac: an Applications table of four jobs with Tideway at Interview, interview prep with three questions and talking points, a This week checklist with one item ticked, and a note about Karin at Tideway."
        caption="A job search tracker in Pinto Notes, with Stage as a choice column. In Apple Notes the same table works, with the stage typed as a word. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note, one row per job</h2>
      <p>
        The table answers the question you ask most often: where does each application stand, and what do I do next. Put a date in every
        next step, because &ldquo;follow up&rdquo; with no day tends to stay undone. Everything that doesn&apos;t fit in a row goes under
        the table.
      </p>
      <Keep title="Job applications table for Apple Notes" text={TABLE}
        note="Each table line has a tab between the columns. Paste it, then turn those lines into a table." />
      <Keep title="Prep and follow-ups for Apple Notes" text={REST}
        note="On a Mac, paste it under the table with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Edit", "Paste as Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the table template into a new note, select the five lines from Company to
          Northlight, and press the Table button. Every tab becomes a column, so you get Company, Role, Stage and Next step side by side.
        </li>
        <li>
          <strong>Add the rest.</strong> Click under the table and choose Edit, Paste as Markdown with the second template. On macOS 27
          each ## line becomes a heading and the follow-ups a checklist. A plain Command-V keeps the symbols as text. On iPhone, type the
          headings, select the follow-ups and tap the checklist button.
        </li>
        <li>
          <strong>Add a job.</strong> Click in the last cell and press Tab for a new row. Notes sets the column widths itself and you
          can&apos;t drag them, so keep each cell to a few words.
        </li>
        <li>
          <strong>Pin it.</strong> Pin the note to the top of its folder, so it&apos;s the first thing you see when a recruiter calls.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers everything a table in Notes can and can&apos;t do.
      </p>

      <h2 id="week">Week to week</h2>
      <ul>
        <li>
          <strong>Use the same stage words.</strong> Saved, Applied, Interview, Offer, Rejected, Withdrawn. The table won&apos;t sort, so
          the same few words are what make the column quick to scan.
        </li>
        <li>
          <strong>Change the row the day something happens.</strong> A reply, a rejection, an interview date: update Stage and Next step
          before you close the email.
        </li>
        <li>
          <strong>Plan follow-ups on Sunday.</strong> Read down the Next step column and copy what&apos;s due into This week. With
          Automatically sort checked items on, ticked ones move to the bottom.
        </li>
        <li>
          <strong>Give long prep its own note.</strong> When one company&apos;s prep grows past a few questions, move it to its own note
          and link to it from Interview prep with Edit, Add Link (Command-K).
        </li>
        <li>
          <strong>Write down who you met.</strong> A line about each person, and what they cared about, is what you&apos;ll want before the
          second interview. Search reads every word, so a name finds it.
        </li>
      </ul>
      <p>
        For notes from the interviews themselves, the <a href="/blog/apple-notes-meeting-notes-template">meeting notes template</a> works
        as it is. More notes to paste in are in <a href="/blog/apple-notes-templates">Apple Notes templates</a>. Keep your job history and dated accomplishments in a <a href="/blog/apple-notes-resume-template">resume master note</a>, and pick from it for each application.
      </p>

      <h2 id="limits">Where a job tracker in Notes stops</h2>
      <ul>
        <li><strong>Every job is typed by hand.</strong> The company, the role and the link to the ad come out of the listing one cell at a time.</li>
        <li><strong>No sorting or filtering.</strong> With thirty rows, finding the ones at Interview means reading down the column.</li>
        <li><strong>Dates are only text.</strong> &ldquo;Follow up, 16 Nov&rdquo; sits in a cell. Noticing it&apos;s the 16th is on you.</li>
        <li><strong>Prep starts from a blank page.</strong> The likely questions for each role, and your answers, are yours to write.</li>
      </ul>
      <p>
        For a handful of applications, the note is all you need. When it&apos;s twenty at once, keeping the table current is a job of its own.
      </p>

      <h2 id="pinto-notes">A job tracker that updates itself</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/job-hunt">job hunt</a> template is one note with an Applications table, where Stage is a
        choice of Saved, Applied, Interview, Offer, Rejected or Withdrawn, and sections for interview prep, this week&apos;s follow-ups and
        the people you&apos;ve talked to.
      </p>
      <p>
        Paste a job ad or a link into your AI and it adds a row: the company, the role linked to the ad, Stage at Saved, and the next
        step. Tell it you applied or heard back and it changes that row. Say &ldquo;I have a first interview with Tideway on Thursday, help
        me prep&rdquo; and it writes five likely questions with your talking points under the company&apos;s name. Ask &ldquo;what should I
        follow up on this week?&rdquo; and it lists them as a checklist. You can still edit every row yourself, and every earlier version of
        the note is kept. This part works once ChatGPT or Claude is connected; <a href="/blog/connect-chatgpt-to-your-notes">connecting
        ChatGPT</a> takes a minute.
      </p>
      <p>
        The notes you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
