import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-sop-template", { title: "Apple Notes SOP template for repeatable work" });

// Written 21 November 2026 for "apple notes sop template" and "standard operating procedure template".
// Research: topic-research-2026-11-22.md, row 15. Strong SOP vendors and useful templates already answer the broad
// query, so this post gives one small-team procedure to paste into Notes, not a general operations handbook.
// Google autocomplete rechecked today, client=firefox, hl=en, gl=us at
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=apple%20notes%20sop%20template
// "apple notes sop template" and "sop template notes" returned []. "standard operating procedure template" returned
// the head plus "word pdf", "word", "word free", "free", "google docs", "examples", "pdf", "word pdf free",
// and "free download" variants. No exact Apple Notes demand is inferred from the broader suggestions.
// Apple support pages read today, including direct page fetches:
// https://support.apple.com/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button; Format, More, Uncheck All).
// https://support.apple.com/guide/notes/apd0a136b9cc/mac (Table button or Format, Table converts selected text;
// two-column empty table; Tab in its last cell adds a row).
// https://support.apple.com/guide/notes/not9474646a9/mac (File, Duplicate Note; a shared note's copy is not shared).
// https://support.apple.com/guide/iphone/iph1ac0b3a2/ios (New Note; Format, Heading; Checklist and Add Table buttons).
// Tab-separated conversion wording follows apple-notes-cornell-notes-template, verified on macOS 27 there.
// Plain text is deliberate: format the checks and exceptions separately, with no Markdown-to-table promise.
// Pinto facts: BRIEF.md (Apple Notes-like iPhone/Mac app, connected ChatGPT/Claude read and edit, Mac import leaves
// Apple Notes unchanged); README.md:15 confirms platforms and AI access. Pane/Editor/SlashCommands.swift:7 confirms
// numbered lists, checklists and tables. Pane/Model/NoteHistory.swift:338 onward confirms restoring an earlier
// version preserves the replaced text. No retention duration or unlimited history claim. No SOP template file.
// Pictures: none. All internal links checked against lib/posts.ts; each has draft: false.

const TEMPLATE = `SOP: send the weekly client report

Trigger: Friday at 14:00, after the week's work is recorded.
Owner: Maya, account lead. Backup: Leo.
Outcome: North Street Studio receives an accurate report by 16:00.
Inputs: This week's work log and the current client contact list.
Version: 1.2, updated 20 November 2026.
Review date: 18 December 2026. Maya owns the review.

Steps
1. Open the North Street Studio work log. Use Monday through Friday of this week.
2. Copy completed work into a new report. List unfinished work under Next week.
3. Add hours for each completed job. Compare the total with the work log.
4. Export the report as a PDF named NorthStreet-week-ending-2026-11-20.pdf. Change the date each week.
5. Open the exported PDF. Read every page and confirm the client name and week.
6. Complete the checks below. Email the PDF to the reporting contact on the current client list.
7. Record the sent time and sender in a dated run note. Note any exception there.

Exceptions
If\tDo this
Hours do not match the work log\tStop. Ask the person who logged them to correct the source, then export again.
Maya is away\tLeo runs the procedure and records his name in the run note.
The report cannot be sent by 16:00\tContact the client before 16:00 with a revised delivery time. Record it in the run note.

Checks before sending
Client name and reporting week match the work log.
Hours match the source, with no unfinished work counted as complete.
The exported PDF opens and contains every page.
Recipient matches the current client contact list.

Run record
20 November 2026, 15:42. Maya sent the report. No exceptions.

Change log
20 November 2026, v1.2. Added the PDF-open check after an empty export.
`;

const FAQ = [
  { q: "Can I write a standard operating procedure in Apple Notes?", a: [
    "Yes. Keep one procedure per note, with a trigger, owner, numbered steps, exceptions, final checks and a review date. The filled SOP on this page is free to copy and adapt.",
  ] },
  { q: "Should SOP steps be a checklist or a numbered list?", a: [
    "Use numbers when the order matters. Use a separate checklist for the checks before completion. Keep the master procedure unticked and record each run in its own dated note.",
  ] },
  { q: "How often should I review an SOP in my notes?", a: [
    "Choose a date that fits the work and name the person responsible. Review sooner if an exception exposes a missing step or an input changes. The date in this template is a written field, so arrange the reminder separately.",
  ] },
  { q: "Can Pinto Notes restore an earlier SOP revision?", a: [
    "Yes. Pinto Notes has note version history and can restore an earlier version. Restoring keeps the text it replaces too. Keep a written change log for the reason behind each revision.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-sop-template"
      intro={<>
        Copy this Apple Notes SOP template for a repeatable job. It gives one person or a small team the trigger, owner, steps,
        exceptions and checks, with a review date to keep the instructions current.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the SOP" },
          { href: "#set-up", label: "Set it up" },
          { href: "#use", label: "Run and review it" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Keep earlier revisions" },
        ]}>
          <p>
            An Apple Notes SOP can be one note per procedure, with numbered steps and a separate checklist for final checks.
            Paste the filled client-report example below, replace the names and timings, then test it on one real run.
            Keep the master instructions separate from the dated record of each run.
          </p>
          <PostCta slug="apple-notes-sop-template" position="answer" title="Keep earlier SOP revisions">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac and keeps earlier note versions you can restore. Once connected, ChatGPT or Claude can read and edit your procedure.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="template">The template: send a weekly client report</h2>
      <p>
        This example is for an account lead who sends the same kind of report every Friday. Change the client, source documents
        and deadline to fit your work. For a solo business, put your own name in Owner and remove the backup line if nobody covers you.
      </p>
      <Keep title="SOP for Apple Notes" text={TEMPLATE}
        note="Paste into a new note. Turn the four Checks lines into a checklist, and the four tab-separated Exceptions lines into a table." />
      <p>
        Give each step an action and a visible result. &ldquo;Check the report&rdquo; leaves too much to guess.
        &ldquo;Open the exported PDF&rdquo; tells the next person which file to inspect. Keep the stop conditions beside the steps.
      </p>

      <h2 id="set-up">Set it up in Apple Notes</h2>
      <MenuPaths rows={[
        { on: "Mac, exceptions", steps: ["Format", "Table"] },
        { on: "iPhone, headings", steps: ["Format button", "Heading"] },
      ]} />
      <ol>
        <li>
          Paste the layout into a new note. On iPhone, tap the New Note button first. The first line becomes the title.
          For each section title on iPhone, select its text, tap the Format button, then Heading.
        </li>
        <li>
          On a Mac, select the four paragraphs under Checks before sending, then click the Checklist button.
          Each paragraph becomes a checklist item. On iPhone, tap the Checklist button and enter those four checks as items.
          Leave the numbered Steps as instructions in order.
        </li>
        <li>
          On a Mac, select the four lines from If to the last exception, and press the Table button. Every tab becomes a column,
          so you get the condition and the response side by side. You can also choose Format, Table for the selected text.
        </li>
        <li>
          On iPhone, tap the Add Table button and enter the exception pairs in two columns. On a Mac, Tab in the last cell adds
          another row. The <a href="/blog/apple-notes-tables">Apple Notes tables guide</a> covers the table controls. Before time off, a <a href="/blog/apple-notes-work-handover-template">work handover note</a> gives each open task a cover owner.
        </li>
      </ol>
      <p>
        Use an iCloud note or one stored on your Mac for the Mac checklist. Apple notes that some features are unavailable with
        other account providers. More reusable layouts are in the <a href="/blog/apple-notes-templates">Apple Notes templates guide</a>.
      </p>

      <h2 id="use">Run it once, then revise what was unclear</h2>
      <p>
        Try the instructions with the actual work log and exported report. If someone else will cover the job, ask them to follow
        the note without coaching. Write down where they pause. Add the missing filename or decision before the next run.
      </p>
      <p>
        Keep the master note as the procedure. For a record of each Friday, select it on a Mac and choose File, Duplicate Note.
        Give the copy a title such as &ldquo;Client report run, 27 November 2026&rdquo; and clear the example run record.
        Click in the checks and choose Format, More, Uncheck All before starting. A copy of a shared note is not shared.
      </p>
      <p>
        Record who completed the run and any exception. If the exception will happen again, update the master with a response.
        Increase its version number and write why it changed. At the review date, the named owner should run through the procedure
        against the current source documents, even if nobody has reported a problem.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        A tick means someone marked a check complete. It does not prove the attachment was correct or that the client received it.
        Keep the sent message or other evidence your work needs. A typed review date also needs a separate reminder.
      </p>
      <p>
        Dated copies need care. Tell the team which note is the current master so last month&apos;s run does not become next
        month&apos;s instructions. If your work needs formal approvals or a controlled audit record, this paste-in layout alone
        does not provide them.
      </p>

      <h2 id="pinto-notes">Revise the SOP with earlier versions to return to</h2>
      <p>
        You can use this layout in Pinto Notes, a notes app that looks and works like Apple Notes on iPhone and Mac.
        Its <a href="/blog/apple-notes-version-history">version history</a> lets you restore an earlier note version.
        Restoring also keeps the text it replaces, so you can return to it. The written change log still explains why you changed a step.
      </p>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit your notes.
        Try asking it to read this SOP and draft a new exception for a late work log, keeping the existing deadline.
        Ask it to list assumptions before editing, then check the wording against how the job actually works.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
