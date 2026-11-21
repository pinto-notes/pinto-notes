import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-home-maintenance-checklist", { title: "Home maintenance checklist template for Apple Notes" });

// Written 21 November 2026 for "home maintenance checklist template" (Google autocomplete 20 Nov: home maintenance
// checklist template, home maintenance log, home maintenance log app, home maintenance schedule template;
// topic-research-2026-11-20.md row 25). The result page: printable PDFs and spreadsheet pages, nothing for a notes app.
// Apple Notes facts, all from earlier posts tried on macOS 27: Edit, Paste as Markdown turns #, ## and "- [ ]" lines into
// a title, headings and checklists, a plain Command-V keeps the symbols, and an empty item doesn't survive
// (apple-notes-templates); type rows with a tab between columns, select them and press the Table button; Format, Table
// (Option-Command-T); Tab in the last cell adds a row; column widths can't be dragged; tables don't add up or sort
// (apple-notes-tables, apple-notes-cornell-notes-template); "Automatically sort checked items" and Format, More, Uncheck
// All (apple-notes-meal-planner-template); a Smart Folder rule for Checklists: Unchecked (apple-notes-tags-smart-folders);
// search reads every word (apple-notes-recipe-template); pin a note (apple-notes-workout-log-template); sharing needs an
// Apple Account for each person (apple-notes-meal-planner-template). Paste as Markdown is NOT used for the table. Pinto
// side: web/content/templates/home-maintenance.json (a Jobs table with Task, Every as a choice of Month, 3 months,
// 6 months or Year, Last done and Next due; This month as a checklist; Who to call; Appliances with model numbers and
// warranty dates; the AI adds jobs with dates with the year, lists what's due this month when asked, and updates Last
// done and Next due and ticks the job when you say it's done; the asks "What's due this month?" and "The boiler was
// serviced today."). The picture is BlogSnapshots.homeMaintenanceForTemplatePost: the template's own example, drawn
// offscreen by the Mac app's NoteDetailView.

const NOTE = `# Home maintenance

The jobs that keep the home working, how often they're due, and when they were last done.

## Jobs
Paste the jobs table under this line.

## This month
- [ ] Test the smoke alarms (due 14 Nov)
- [ ] Service the boiler (due 20 Nov)
- [ ] Clear the gutters (due 24 Nov)

## Who to call
- Plumber: Nordin & Son, 08-465 004 27
- Electrician: Volt Fix, 08-465 004 63

## Appliances
- Dishwasher: Bosch Series 4, warranty until 2028
- Boiler: Vaillant ecoTEC, fitted in 2021
`;

// Tabs between the columns: select those lines in Notes and press the Table button.
const JOBS = `Task\tEvery\tLast done\tNext due
Descale the kettle\tMonth\t1 Nov 2026\t1 Dec 2026
Clean the dishwasher filter\tMonth\t5 Nov 2026\t5 Dec 2026
Test the smoke alarms\t3 months\t14 Aug 2026\t14 Nov 2026
Service the boiler\tYear\t20 Nov 2025\t20 Nov 2026
Clear the gutters\t6 months\t24 May 2026\t24 Nov 2026
`;

const FAQ = [
  { q: "Does Apple Notes have a home maintenance template?", a: [
    "No. Apple Notes has no templates. One note with a table of jobs, a checklist for this month and the numbers you call works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "What should a home maintenance checklist include?", a: [
    "Every job that repeats, how often it's due and when you last did it. Start with the ones that cost money when forgotten: the smoke alarms, the boiler or furnace service, the gutters and the filters.",
  ] },
  { q: "Can Apple Notes remind me when a job is due?", a: [
    "The note won't tell you on its own. You open it and read the Next due column. A checklist for this month, made at the start of each month, keeps the due jobs in one short list.",
  ] },
  { q: "Is there a home maintenance app that tracks what's due?", a: [
    "Pinto Notes has a free home maintenance template. Tell ChatGPT or Claude when a job is done and it updates the dates, and ask what's due this month and it makes the checklist.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-home-maintenance-checklist"
      intro={<>
        Nobody forgets the smoke alarm on purpose. It slips because the last test was so long ago that nobody remembers it. Here&apos;s a
        home maintenance checklist for Apple Notes to paste in, a way to run it each month, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#each-month", label: "Each month" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A list that knows what's due" },
        ]}>
          <p>
            Apple Notes has no home maintenance template, but one note does the job: a table of every job that repeats, with how often and
            when you last did it, then a checklist of what&apos;s due this month, the people you call and your appliances&apos; model numbers.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-home-maintenance-checklist" position="answer" template="home-maintenance" title="Want the dates kept for you?">
            <p>Pinto Notes works like Apple Notes and has a free home maintenance template. Tell ChatGPT or Claude a job is done and it updates the dates, or ask what&apos;s due this month.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/home-maintenance-note" width={1520} height={1557} maxWidth={600}
        alt="A Home maintenance note in Pinto Notes on a Mac: a Jobs table of five tasks from Descale the kettle to Clear the gutters with how often and the last and next dates, a This month checklist with two of five ticked, Who to call and Appliances."
        caption="A home maintenance note in Pinto Notes, where Every is a pick list. In Apple Notes the same columns work as a plain table, with the checklist and lists below it. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: jobs, this month, who to call</h2>
      <p>
        The table is the record: every job that repeats, how often, when it was last done and when it&apos;s next due. The checklist is
        what you work from this month. Who to call and Appliances are what you search for when something breaks. The example jobs are a
        start; add yours and delete what doesn&apos;t apply.
      </p>
      <Keep title="Home maintenance note for Apple Notes" text={NOTE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <Keep title="Jobs table for Apple Notes" text={JOBS}
        note="Each line has a tab between the columns. Paste it under Jobs, then turn those lines into a table." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Paste as Markdown"] },
        { on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" },
      ]} />
      <ul>
        <li>
          <strong>Paste the note.</strong> On a Mac with macOS 27, make a new note and choose Edit, Paste as Markdown. The # line becomes
          the title, the ## lines headings and the jobs for this month a checklist. A plain Command-V keeps the symbols as text.
        </li>
        <li>
          <strong>Then the table.</strong> Replace the line under Jobs with the jobs table, select its six lines from Task to the last job,
          and press the Table button. Every tab becomes a column.
        </li>
        <li>
          <strong>Add a job.</strong> Tab in the last cell adds a row. Write the dates with the year, so a job done once a year still makes
          sense next November.
        </li>
        <li>
          <strong>Keep task names short.</strong> Notes sets the column widths itself and you can&apos;t drag them, so a long task squeezes the
          dates.
        </li>
      </ul>
      <p>
        Pin the note to the top of its folder. On iPhone, type the headings in once, select the jobs for this month and tap the checklist
        button. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers everything a table in Notes can and can&apos;t do.
      </p>

      <h2 id="each-month">Each month</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "More", "Uncheck All"] }]} />
      <ul>
        <li>
          <strong>Make this month&apos;s list.</strong> On the first of the month, read down Next due and write a checklist line for each job
          that falls this month, with its date.
        </li>
        <li>
          <strong>Tick it, then update the row.</strong> When a job is done, tick it and change Last done and Next due in the table. The tick
          is for this month. The row is what next year reads.
        </li>
        <li>
          <strong>Let ticked jobs sink.</strong> With &ldquo;Automatically sort checked items&rdquo; on, done jobs move to the bottom and what&apos;s
          left stays on top.
        </li>
        <li>
          <strong>Reuse the list.</strong> If the same monthly jobs come round every time, keep them and choose Format, More, Uncheck All to
          start again.
        </li>
      </ul>
      <p>
        A Smart Folder with the rule Checklists: Unchecked shows every note that still has open items, so a job left over from last month
        stays in view. <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> shows how to set one up. When a pipe
        leaks, search reads every word in every note, so &ldquo;plumber&rdquo; or &ldquo;Bosch&rdquo; finds the number or the model at once. To
        run the house with someone else, sharing the note needs an Apple Account for each person. More notes to paste in like this one are in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a maintenance list in Notes stops</h2>
      <ul>
        <li><strong>Next due is your sum.</strong> Notes doesn&apos;t work out that a job every 3 months done on 14 August is due on 14 November. You write the date.</li>
        <li><strong>The table doesn&apos;t sort.</strong> It can&apos;t put the next job at the top, so you read every row to find what&apos;s due.</li>
        <li><strong>The monthly list is copied by hand.</strong> If you skip the first of the month, nothing makes the list for you.</li>
        <li><strong>The dates drift.</strong> A job you ticked but didn&apos;t update in the table looks overdue next year.</li>
      </ul>
      <p>
        For a flat with five jobs, a note is plenty. For a house with thirty, keeping the dates right is the work, and it&apos;s left to you.
      </p>

      <p>
        For an everyday list of things to do, see the <a href="/blog/apple-notes-to-do-list">Apple Notes to-do list</a> post, with a template to paste in.
      </p>

      <h2 id="pinto-notes">A list that knows what&apos;s due</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/home-maintenance">home maintenance</a> template is the same note: a Jobs table where
        Every is a choice of Month, 3 months, 6 months or Year, a This month checklist, Who to call and Appliances.
      </p>
      <p>
        Tell your AI about a job you want to keep track of and when you last did it, and it adds the row with both dates, year included.
        Ask &ldquo;what&apos;s due this month?&rdquo; and it writes the checklist under This month. Say &ldquo;the boiler was serviced
        today&rdquo; and it changes Last done and Next due and ticks the job. Mention a model number or a warranty date and it goes under
        Appliances. You can still add and edit every row yourself, and every earlier version of the note is kept. This works once ChatGPT
        or Claude is connected; <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The lists you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
