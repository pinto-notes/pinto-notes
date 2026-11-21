import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-project-brief-template", {
  title: "Apple Notes project brief template, with scope and checks",
});

// Written 21 November 2026 for "apple notes project brief template". Research:
// blog-growth/topic-research-2026-11-22.md, row 4. Its result-page notes identify a real
// Apple Notes Project Hub and Markdown briefs. This post supplies a filled agreement about
// scope and completion, distinct from the live weekly planner and decision-log posts, read today.
// Google autocomplete checked today, client=firefox, hl=en, gl=us, at
// https://suggestqueries.google.com/complete/search with q set to each seed:
// "apple notes project brief template" returned "apple notes project template", "project brief summary";
// "apple notes project template" returned that seed, "apple notes project management template",
// "how to make a template in apple notes", "how to take notes on apple notes";
// "apple notes project management template" returned that seed and "how to make a template in apple notes";
// "project brief template" returned that seed plus word, word free download, prince2, canva,
// google docs, excel, free, ppt and ppt free download variants. No exact-head suggestion.
// Apple support pages read today, including direct HTML reads where the web reader returned 429:
// https://support.apple.com/en-az/guide/notes/not9474646a9/mac (New Note, File > Duplicate Note);
// https://support.apple.com/guide/notes/apd1955d3b21/mac (Format button, Heading);
// https://support.apple.com/en-lamr/guide/notes/apd93c815aa0/mac (paragraphs to checklist);
// https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac (text to table, Tab adds row);
// https://support.apple.com/guide/iphone/iph1ac0b3a2/ios (headings, Checklist, Add Table);
// https://support.apple.com/en-us/102296 (start a checklist in an existing note, Return adds item).
// Tab-separated table conversion follows apple-notes-cornell-notes-template's verified wording.
// No Markdown-paste or table-conversion claim on iPhone. No pictures used.
// Pinto sources opened today: Pane/Editor/SlashCommands.swift (headings, checklists, tables,
// note links); Pane/Model/NoteHistory.swift, NoteHistory.restore (restore preserves replaced text);
// supabase/functions/mcp/files_tools.ts, fetch/edit (connected AI reads and edits notes).
// BRIEF.md's Pinto facts verify iPhone/Mac, Apple Notes-like editing and the unchanged-source Mac import.
// No project-brief gallery template exists. The layout below is supplied by this article only.

const TEMPLATE = `Moss Cafe pickup page, project brief

Owner: Sara Lind
Approver: Amir Khan, cafe manager
Target: 4 December 2026
Status: Draft, waiting for Amir's review

Outcome
Customers can find the pickup menu and place an order from the cafe website on their phones.
For the first week, Amir records how many calls ask where to order. Review the count on 11 December.

In scope
One pickup page with the current menu, prices and collection hours.
A link to the existing ordering service.
A Pickup link in the website navigation.

Out of scope
Delivery, a new payment system and changes to the ordering service.
Photography and a redesign of the rest of the website.

Acceptance criteria
Amir has checked every menu item and price against the counter menu.
The page states collection hours and where to collect an order.
The Pickup link opens the page on Sara's iPhone and Mac.
A test order through the page's order link reaches the cafe's existing order screen.

Open questions
Question\tOwner and answer needed
Who updates the menu after launch?\tAmir, by 25 November
What should the page show when pickup is closed?\tSara proposes wording, Amir approves by 26 November

Approval
Amir to confirm the scope and acceptance criteria by 27 November.
After approval, record any scope change here with its date and effect on the target.
`;

const FAQ = [
  { q: "Does Apple Notes include a project brief template?", a: [
    "No built-in project brief is supplied. Copy the filled layout on this page into a note, replace the example, and use Notes' heading, checklist and table controls to format it.",
  ] },
  { q: "What acceptance criteria belong in a project brief?", a: [
    "Write observable checks that the approver can carry out. Name what must work and how to check it. For a pickup page, a test order reaching the cafe is clearer than saying the page must be easy to use.",
  ] },
  { q: "How is a project brief different from a project plan?", a: [
    "The brief agrees the outcome, boundaries, owner and conditions for completion. A project plan breaks that agreed work into tasks and dates. Keep the brief short enough to review before work starts.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-project-brief-template"
      intro={<>
        Copy this Apple Notes project brief template to agree what a project will deliver and how you&apos;ll check it.
        It includes an owner, scope, acceptance criteria and open questions, filled in for a cafe&apos;s pickup page.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the brief" },
          { href: "#set-up", label: "Set it up in Notes" },
          { href: "#agree", label: "Agree the scope" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Review it with your AI" },
        ]}>
          <p>
            Use one Apple Notes note per project, with the outcome and owner at the top, scope boundaries below,
            then a checklist of acceptance criteria. Copy the filled brief below and replace the cafe example with your project.
          </p>
          <PostCta slug="apple-notes-project-brief-template" position="answer" title="Want help checking the brief?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your brief and edit it when you ask.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="template">The template: agree what done means</h2>
      <p>
        This example keeps the existing ordering service. That boundary matters because adding payments would change the job.
        Replace the names and dates, then rewrite each acceptance criterion so someone can test it.
      </p>
      <Keep title="Project brief for Apple Notes" text={TEMPLATE}
        note="Copy as plain text. Use the steps below to add headings, a checklist and the open-questions table." />

      <h2 id="set-up">Set it up in Apple Notes</h2>
      <p>
        On a Mac, click New Note and paste the layout. Select each section label, click the Format button and choose Heading.
        Use iCloud notes or notes stored on your Mac for these formatting options.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Select acceptance paragraphs", "Checklist button"] },
        { on: "Mac", steps: ["Select question rows", "Format", "Table"] },
        { on: "iPhone", steps: ["Select section label", "Format button", "Heading"] },
      ]} />
      <p>
        Select the four paragraphs under Acceptance criteria and click the Checklist button. Each paragraph becomes one item.
        Keep them unticked until the approver has checked the result. An assigned task is not evidence that a criterion has passed.
      </p>
      <p>
        Each question row has a tab between the question and its owner. On Mac, select the three lines from Question to the last
        question, and press the Table button. Every tab becomes a column. Or choose Format, Table for two rows and two columns,
        type the entries, and press Tab in the last cell to add a row. The <a href="/blog/apple-notes-tables">Apple Notes table guide</a> has more examples.
      </p>
      <p>
        On iPhone, paste the text and select each section label, then tap the Format button and Heading. To build the acceptance
        checklist, replace its plain paragraphs: put the cursor below the heading, tap the Checklist button and enter each criterion,
        pressing Return for the next item. For the questions, replace the tabbed lines with a table using the Add Table button,
        then enter each question and owner in separate cells.
      </p>
      <p>
        For the next project on Mac, select the note and choose File, Duplicate Note. Replace the example and clear the old approval.
        A copy of a previous brief still needs a fresh scope review.
      </p>

      <h2 id="agree">Review the brief before work starts</h2>
      <p>
        Start with the outcome. In the cafe example, the deliverable is a pickup page, and the intended result is that customers can
        order from their phones. The first week&apos;s call count gives Amir something to review after launch. It is separate from the
        checks that determine whether the page is ready.
      </p>
      <p>
        Ask the approver to read the exclusions as carefully as the included work. If delivery becomes a requirement, change the scope
        and revisit the date before adding tasks. Leave the brief marked Draft until the named approver confirms it.
      </p>
      <p>
        Give each unresolved question an owner and an answer date. Once answered, update the relevant part of the brief.
        Keep the reasoning in a separate <a href="/blog/apple-notes-decision-log-template">decision log</a> if you&apos;ll need to explain
        the choice later. The brief should show the current agreement without pages of discussion.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        The dates and names here are text you maintain. An answer date in the table is a reminder to check with that person;
        this layout does not send them a notification or collect their approval. Write the confirmation date yourself.
      </p>
      <p>
        A tick records your check. It does not run the test order or verify the menu. When the scope changes, review every affected
        criterion and clear any tick that no longer applies. Keep daily tasks in your plan rather than expanding this note into a schedule.
      </p>

      <h2 id="pinto-notes">Review the brief with ChatGPT or Claude</h2>
      <p>
        Copy this layout into a Pinto Notes note and edit it yourself, with headings, checklists and tables.
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. After you <a href="/blog/connect-chatgpt-to-your-notes">connect
        ChatGPT or Claude</a>, the AI can read and edit that note.
      </p>
      <p>
        Try asking: &ldquo;Read the Moss Cafe pickup brief. Which acceptance criteria are too vague to test?
        Suggest clearer wording and list any unanswered scope questions.&rdquo; Review the suggestions, then ask it to apply the ones
        you agree with. The approver still decides the scope and checks the result.
      </p>
      <p>
        Pinto keeps earlier versions of a note and can restore one, so you can return to an earlier draft after an edit.
        Restoring also keeps the text it replaces. Copy the layout from this article to start your note.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
