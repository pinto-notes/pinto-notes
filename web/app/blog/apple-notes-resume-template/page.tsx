import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-resume-template", { title: "Apple Notes resume template: a master record to copy" });

// Written 21 November 2026 for "apple notes resume template", research row 12 in
// blog-growth/topic-research-2026-11-23.md. Google autocomplete rechecked today, en-US, US:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple%20notes%20resume%20template
// returned only "apple notes resume template". Read https://docs.alto.so/templates/resume today:
// Alto already offers a copyable template. This post adds a filled master record with dated evidence,
// then a separate finished document.
// Apple Support pages read today: https://support.apple.com/en-us/guide/notes/apd1955d3b21/mac
// (Format button, Heading); https://support.apple.com/en-us/guide/notes/apd93c815aa0/mac
// (selected paragraphs to checklist, Format > More > Uncheck All, account availability);
// https://support.apple.com/en-us/guide/notes/apd0a136b9cc/mac (Format > Table, text conversion,
// two rows and columns, Tab in the last cell adds a row);
// https://support.apple.com/en-us/guide/notes/not9474646a9/mac (File > Duplicate Note);
// https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios (Format, Heading, Add Table);
// https://support.apple.com/en-us/102296 (Checklist button, Return for the next item).
// Tab-separated table wording follows apple-notes-cornell-notes-template's verified example.
// Plain paste is used for the master record; no Markdown paste or finished-page fidelity claim.
// Pinto: BRIEF.md facts cover the Apple Notes-like app on Mac and iPhone, connection, earlier
// versions, and Mac import leaving Apple Notes unchanged. Opened Pane/Editor/SlashCommands.swift
// (headings, lists, tables, links) and supabase/functions/mcp/files_tools.ts (fetch, create, edit,
// history) today. Tailoring is a suggested AI request, with human checks, not a resume feature.
// No ready-made Pinto resume template is claimed. No screenshot used.
// Description: Copy an Apple Notes resume template with job dates, accomplishments and evidence links. Keep the master note, then finish your resume in a document editor.

const TEMPLATE = `Maya Chen, master resume record
Updated: 21 November 2026

Contact
Boston, MA
maya.chen@example.com | 617-555-0142
Portfolio: https://example.com/maya

Summary
Support operations coordinator with customer service experience since 2020.
Maintains team reporting and writes onboarding guides for support agents.

Experience
Riverbend Supply | Support operations coordinator
Boston, MA | January 2023 to present

12 November 2026: Built a triage checklist used by six agents. The team's median first reply time fell from 14 hours in September to 9 hours in October.
Evidence: September and October queue report, saved 2 November 2026.
My contribution: wrote the checklist and ran the weekly review. The team handled the tickets.

28 June 2026: Wrote a new-hire guide and trained four support agents during June.
Evidence: onboarding guide and June training attendance record.
Guide sample: https://example.com/maya/onboarding

Harbor Homewares | Customer service associate
Boston, MA | September 2020 to December 2022

31 March 2022: Resolved 35 to 45 customer tickets per week during March.
Evidence: March ticket report. This is an individual count, not the team's total.

Skills
Excel reporting, support ticket triage, new-hire training, guide writing

Education
BA in communications | Northeastern University | May 2020

Facts to check before use
Confirm the exact job titles against employment records
Recheck the reply-time figures and comparison months
Replace the example contact details and portfolio links
Remove internal evidence links from the resume sent to employers
`;

const EVIDENCE = `Accomplishment date\tEvidence to keep
12 November 2026\tSeptember and October queue report, saved 2 November
28 June 2026\tOnboarding guide and June training attendance record
31 March 2022\tMarch individual ticket report
`;

const FAQ = [
  { q: "What should an Apple Notes resume template contain?", a: [
    "Keep contact details, a short summary, job titles with dates, skills and education. Under each job, add dated accomplishments and the evidence for them. The filled template on this page is a master record to draw from when writing a resume.",
  ] },
  { q: "Should I send my master resume note to an employer?", a: [
    "Keep the master note for yourself. Copy the relevant details into a document editor, remove internal evidence and fact-checking notes, and check the finished file before sending it in the employer's requested format.",
  ] },
  { q: "How do I record a resume accomplishment without a metric?", a: [
    "Write what you did, when you did it and what you can verify. For example, name the guide you wrote and who used it. Leave out an improvement percentage if you have no source for it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-resume-template"
      intro={<>
        Use Apple Notes for a master record of your jobs and dated accomplishments. Copy the relevant details into a document editor
        for the final resume. The filled template below keeps the evidence beside each claim.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#tailor", label: "Write a resume from it" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Draft with your AI" },
        ]}>
          <p>
            An Apple Notes resume template works as a master record: contact details, jobs with dates, and accomplishments with evidence.
            Paste the example below into a note, replace it with your history, then use a document editor for the final resume.
          </p>
          <PostCta slug="apple-notes-resume-template" position="answer" title="Want help choosing the relevant accomplishments?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your master record and save a separate draft for you to check.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="template">The template: keep the full work history</h2>
      <p>
        Maya and the details below are fictional. Replace every example, including the links. Keep older jobs and useful accomplishments
        in this master even when they do not fit the resume you are writing today.
      </p>
      <Keep title="Master resume record for Apple Notes" text={TEMPLATE}
        note="Copy into a new note with an ordinary paste. The headings and review lines start as plain text." />

      <h2 id="set-up">Add headings and a fact-checking checklist</h2>
      <p>
        Use an iCloud note for these steps. Apple says some Notes features are unavailable in accounts from other providers.
        Leave the accomplishment dates in the text so they stay with the claim when you copy it.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>
        Select a section label, such as Experience, and use the Format button to choose Heading. On a Mac, select the four lines under
        Facts to check before use and click the Checklist button. On iPhone, tap the Checklist button where you want the list and enter
        each review item, tapping Return between items. Tick a line only after you have checked it.
      </p>
      <p>
        On a Mac, Format, More, Uncheck All resets that checklist for another review. For a reusable blank note alongside this filled
        master, see <a href="/blog/apple-notes-templates">Apple Notes templates</a>. Once you start the new job, the <a href="/blog/apple-notes-employee-onboarding-template">onboarding template</a> keeps your first month in one note.
      </p>

      <h2 id="evidence">Keep evidence you can find again</h2>
      <p>
        Add an accomplishment when the work finishes. Record your part in a team result and the period each number covers.
        Keep a source note title or a link beside it. Save only work information you are allowed to keep in your personal notes.
      </p>
      <Keep title="Optional evidence index" text={EVIDENCE}
        note="Each line has a tab between the date and the evidence. Paste it below the master record, then make those lines a table." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"] }]} />
      <p>
        On a Mac, paste the index, select the four lines from Accomplishment date to the last entry, and press the Table button.
        Every tab becomes a column. Or choose Format, Table for two rows and two columns, then type the entries. Tab in the last cell
        adds a row. On iPhone, tap Add Table and enter the dates and evidence in the cells.{" "}
        <a href="/blog/apple-notes-tables"> Tables in Apple Notes</a> covers the table controls.
      </p>

      <h2 id="tailor">Choose details for one resume</h2>
      <p>
        On a Mac, select the master note and choose File, Duplicate Note. Name the copy for the role and date. Keep the master intact
        while you shorten this copy. For a support operations role, Maya might lead with the triage checklist and reporting work.
        For a training role, the new-hire guide deserves more space.
      </p>
      <p>
        Check each selected bullet against its evidence. The reply-time result belongs to the team; Maya can describe her checklist
        without claiming she caused the whole change. Remove internal reports and the review checklist from the application copy.
        Track applications separately with the <a href="/blog/apple-notes-job-search-tracker">job search tracker</a>.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        This layout is a work record, with more detail than an employer needs. The final resume belongs in a document editor, where you
        can check page breaks, spacing and the finished file. Follow the employer&apos;s requested file format and open that file before
        sending it. This template makes no promise about applicant tracking system scores or a one-page PDF.
      </p>

      <h2 id="pinto-notes">Ask your AI for a separate draft in Pinto Notes</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. After you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes"> connect ChatGPT or Claude</a>, your AI can read and edit your notes.
        Ask it to read your master record and the job description, then save a new note with the relevant accomplishments.
        Tell it to leave the master unchanged and flag missing facts instead of inventing numbers or skills.
      </p>
      <p>
        Check the draft against your sources, especially dates and whether a result was yours or the team&apos;s. Pinto keeps every
        earlier version of a note. You still finish the resume in a document editor. Your Apple Notes come over in{" "}
        <a href="/blog/move-from-apple-notes"> one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
