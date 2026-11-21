import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-bug-triage-template", { title: "Bug triage template for Apple Notes, with severity" });

// Written 21 November 2026 for "bug triage template" (Google autocomplete 20 Nov: bug triage template, defect triage
// template, bug triage example; topic-research-2026-11-20.md row 32). The result page is Atlassian and QA vendor pages;
// none gives a note to paste. Not an Apple Notes search, so the post serves small teams and solo developers who keep
// bugs in notes. Apple Notes facts, all from earlier posts tried on macOS 27: Format, Table (Option-Command-T); type rows
// with a tab between columns, select them and press the Table button, and every tab becomes a column; Tab in the last
// cell adds a row; column widths can't be dragged; tables don't add up or sort (apple-notes-tables, wording copied from
// apple-notes-cornell-notes-template). Paste as Markdown is NOT used for the table: only headings, lists and checklists
// were verified for it (apple-notes-templates). "Automatically sort checked items" in the Notes settings, and sharing
// needs an Apple Account for each person (apple-notes-grocery-list-template); search reads every word (apple-notes-recipe-template). Pinto side:
// web/content/templates/bug-triage.json (a Bugs table with Severity a choice of P0 to P3 and Status a choice of New,
// Confirmed, In progress, Fixed and Won't fix, a Details section and the Severity rules; the AI files a pasted report as
// a row by those rules, keeps rows worst first and adds the steps to reproduce; the claudeCode prompt reads a GitHub
// issue with gh issue view and looks through the codebase for the likely cause and the files involved; the asks "What's
// P1 and still open?" and "We fixed the saved-card checkout, mark it."). The picture is
// BlogSnapshots.bugTriageForTemplatePost: the template's own example, drawn offscreen by the Mac app's NoteDetailView.

// Tabs between the columns: select those lines in Notes and press the Table button.
const TABLE = `Bug triage

Bug\tSeverity\tArea\tStatus\tReported\tLink
Saved cards fail at checkout\tP1\tCheckout\tIn progress\t2026-11-04\t#412
Search misses å, ä and ö\tP2\tSearch\tFixed\t2026-11-02\t#407
Order email arrives twice\tP2\tEmail\tNew\t2026-11-06\t#418
Footer logo is blurry on phones\tP3\tDesign\tConfirmed\t2026-11-05\tnone
`;

const RULES = `## Severity
- P0: data loss, a security hole, or everyone is blocked. Drop everything.
- P1: a main flow is broken for many people. This week.
- P2: broken, but there's a workaround. Schedule it.
- P3: polish. When there's time.

## Details
Saved cards fail at checkout
1. Sign in to an account with a saved card.
2. Add anything to the basket and go to checkout.
3. Choose the saved card and select Pay.
Expected: the order is placed.
What happened: "Payment failed", and no order.
`;

const LIST = `# Bugs by severity

## P1
- [ ] Saved cards fail at checkout (Checkout, #412)

## P2
- [ ] Order email arrives twice (Email, #418)
- [x] Search misses å, ä and ö (Search, #407)

## P3
- [ ] Footer logo is blurry on phones (Design)
`;

const FAQ = [
  { q: "What is bug triage?", a: [
    "Deciding, for each new bug report, how bad it is and when it gets fixed. Most teams give each bug a severity from P0 to P3, an area and a status, and go through the new ones on a regular day.",
  ] },
  { q: "What should a bug triage template include?", a: [
    "A short title, the severity, the area, the status, the date it was reported and a link to the report. Then, for each bug you can reproduce, the steps, what was expected and what happened.",
  ] },
  { q: "Can I track bugs in Apple Notes?", a: [
    "For a small project, yes: a table with a row per bug, or a checklist under a heading per severity. Tables in Notes don't sort or filter, so with more than a couple of dozen bugs an issue tracker works better.",
  ] },
  { q: "Is there a bug triage template that files reports for me?", a: [
    "Pinto Notes has a free bug triage template. Paste a report or a GitHub issue into ChatGPT, Claude or Claude Code and it adds a row by your severity rules, with the steps to reproduce.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-bug-triage-template"
      intro={<>
        Not every team needs an issue tracker. A solo developer or a team of three can keep every bug in one note, if each one gets a
        severity and the worst are on top. Here&apos;s a bug triage template for Apple Notes, a checklist version that sorts better, and
        where a note stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#by-severity", label: "A checklist version" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Bugs that file themselves" },
        ]}>
          <p>
            Apple Notes has no bug triage template, but one note does the job: a table with a row per bug (title, severity, area, status,
            date, link), the severity rules under it, and the steps to reproduce for each bug below. Give every bug a severity from P0
            to P3 when it comes in, and fix from the top.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-bug-triage-template" position="answer" template="bug-triage" title="Want bug reports filed for you?">
            <p>Pinto Notes works like Apple Notes and has a free bug triage template. Paste a report into ChatGPT or Claude and it adds a row by your severity rules, with the steps to reproduce.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/bug-triage-note" width={1520} height={1363} maxWidth={600}
        alt="A Bug triage note in Pinto Notes on a Mac: a table of four bugs with severity P1 to P3, area, status, date and issue number, the saved-card checkout bug's steps to reproduce, and the severity rules."
        caption="A bug triage note in Pinto Notes, with Severity and Status as choices. In Apple Notes the table, the details and the rules carry over as plain text." />}
      faq={FAQ}
    >
      <h2 id="template">The template: a table and the rules</h2>
      <p>
        The table is the list you look at every morning. Severity says when a bug gets fixed, and the rules keep that honest: P1 means
        a main flow is broken for many people, and a loud customer doesn&apos;t change that. Keep the titles short, since six columns share the width.
      </p>
      <Keep title="Bug triage table for Apple Notes" text={TABLE}
        note="Each table line has a tab between the columns. Paste it, then turn those lines into a table." />
      <Keep title="Severity rules and details" text={RULES}
        note="Paste it under the table with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Edit", "Paste as Markdown"] },
      ]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the table template into a new note, select the five lines from Bug to the
          last bug, and press the Table button. Every tab becomes a column, so you get the six columns side by side.
        </li>
        <li>
          <strong>Or start empty.</strong> Choose Format, Table for two rows and two columns, and Tab in the last cell adds the next row.
        </li>
        <li>
          <strong>Add the rules and details.</strong> Click under the table and choose Edit, Paste as Markdown. The ## lines become
          headings.
        </li>
        <li>
          <strong>Change a status by typing over it.</strong> In progress to Fixed is one cell. Leave fixed bugs in for a week, so people
          can see what changed.
        </li>
      </ul>
      <p>
        Notes sets the column widths itself and you can&apos;t drag them, so a long title squeezes the rest.{" "}
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers everything a table in Notes can and can&apos;t do. To hear the problem from the people who hit it, use the <a href="/blog/apple-notes-user-interview-template">user interview template</a>. If others
        report bugs too, share the note and let them make changes; each person needs an Apple Account.
      </p>

      <h2 id="by-severity">A checklist version that sorts itself</h2>
      <p>
        Tables in Notes don&apos;t sort, so a new P1 lands at the bottom. If that bothers you, give each severity a heading and each bug a
        checklist line under it. The worst bugs are always on top, and ticking a line marks it fixed.
      </p>
      <Keep title="Bugs by severity for Apple Notes" text={LIST}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <p>
        Turn on Automatically sort checked items in the Notes settings, and fixed bugs drop to the bottom of their heading. Search reads
        every word in every note, so searching &ldquo;checkout&rdquo; finds the bug and its details. More notes to paste in are in{" "}
        <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where bug triage in Notes stops</h2>
      <ul>
        <li><strong>No sorting or filtering.</strong> &ldquo;Every open P1&rdquo; means reading the whole table.</li>
        <li><strong>Every report is retyped.</strong> Bugs arrive in email, chat and GitHub, and each one is a title, a severity and steps you write by hand.</li>
        <li><strong>Severity is a judgment call each time.</strong> The rules are in the note, but you still read them against every report.</li>
        <li><strong>No link to the code.</strong> Finding which files a bug lives in is still a separate job.</li>
      </ul>
      <p>
        For a side project or a small app, one note is enough. With a team filing dozens of bugs a week, use an issue tracker.
      </p>

      <h2 id="pinto-notes">Bugs that file themselves</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/bug-triage">bug triage</a> template is one note with a Bugs table, a Details section and
        the severity rules. In the table, Severity is a choice of P0 to P3 and Status a choice of New, Confirmed, In progress, Fixed and
        Won&apos;t fix.
      </p>
      <p>
        Paste a bug report into your AI. It follows the rules under Severity and adds a row with a short title, the severity, the area,
        Status New, today&apos;s date and the link, and keeps the rows worst first. If the report says how to reproduce it, the steps, what
        was expected and what happened go under Details. In Claude Code, the template has its own instructions: paste a GitHub issue and
        it reads it with gh issue view, files the row, then looks through your codebase for the likely cause and adds the files involved
        to the details. <a href="/blog/notes-in-claude-code-and-codex">Notes in Claude Code and Codex</a> has the one command to add it.
      </p>
      <p>
        Ask &ldquo;what&apos;s P1 and still open?&rdquo;, or say &ldquo;we fixed the saved-card checkout, mark it&rdquo; and it sets the
        status. You can still edit every row yourself, and every earlier version of the note is kept. The AI part works once ChatGPT or
        Claude is connected; <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute. The notes you already
        keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed.
      </p>
    </PostPage>
  );
}
