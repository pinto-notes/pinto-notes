import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-employee-onboarding-template", { title: "Apple Notes employee onboarding template for month one" });

// Written 21 November 2026 for "apple notes employee onboarding template", topic-research-2026-11-24.md row 10.
// Google autocomplete rechecked today, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple+notes+employee+onboarding+template
// returned []. The generic seed returned employee onboarding template; employee onboarding template excel free;
// employee onboarding template free; employee onboarding template excel free download; employee onboarding template word;
// employee onboarding template excel; employee onboarding template sharepoint; employee onboarding template notion;
// staff onboarding template; employee orientation template. Generic endpoint:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=employee+onboarding+template
// Generic job evidence only, not exact Apple Notes demand or search-volume data.
// Apple support read today through full search results after direct web opens returned HTTP 429:
// https://support.apple.com/en-ie/guide/notes/apd1955d3b21/mac (select heading text, Format button, Heading).
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac (selected paragraphs, Checklist button; click to tick).
// https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac (selected paragraphs, Table button;
// Format, Table makes two rows and columns; Tab in the last cell adds a row).
// https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios (New Note; Format, Heading; Add Table).
// https://support.apple.com/en-ie/102296 (Checklist button, Return for the next item, tap a circle to tick;
// iCloud or device notes for the latest features). Tab-separated conversion also follows the verified
// apple-notes-cornell-notes-template model. No Markdown paste or automatic table conversion on iPhone claimed.
// Pinto sources opened in wave9: README.md (Mac/iPhone, approved ChatGPT/Claude read/edit, earlier versions);
// Pane/Editor/SlashCommands.swift (headings, checklists, tables); supabase/functions/mcp/files_tools.ts (fetch/edit).
// BRIEF.md supplies Apple Notes look/behavior and Mac import leaving Apple Notes unchanged. The verified header in
// web/app/blog/connect-chatgpt-to-your-notes/page.tsx confirms Allow grants reading and editing. Paths use this repo root.
// Fictional editorial layout, not a shipped Pinto template. No screenshots. AI prompt is suggested, not exercised.

const TEMPLATE = `First month at Alder Tools

Name: Maya Chen, customer support specialist
Start: 23 November 2026. Month-one check-in: 18 December.
Manager: Amina Patel. Buddy: Leo Martin.

What success looks like
By the check-in, handle routine delivery questions with Leo reviewing replies.
Explain when to escalate a refund. Confirm these expectations with Amina.

People
Person\tAsk them about
Amina Patel, manager\tPriorities and feedback. Weekly check-in on Friday.
Leo Martin, buddy\tReply drafts and delivery questions. Sit together Tuesday.
Noor Evans, IT\tAccess requests through the IT help portal.

Systems and reference pages
Team handbook: company intranet, Support / Start here.
Delivery guide: company intranet, Support / Delivery questions.
Help desk: IT request 4821 submitted 23 November. Access pending.
Team calendar: opens successfully, checked 23 November.

Questions and answers
Open, for Amina: which refunds need a manager's approval? Ask 27 November.
Answered 23 November, Leo: where are reply examples? Support / Example replies.

Week 1, 23 to 27 November
Confirm the first-month expectations with Amina
Test help desk access when request 4821 is resolved
Read the delivery guide and shadow Leo on two questions

Week 2, 30 November to 4 December
Draft three delivery replies for Leo to review
Ask Amina to explain the refund escalation rules

Week 3, 7 to 11 December
Handle five routine delivery questions with Leo reviewing replies
Record one confusing step in the delivery guide

Week 4, 14 to 18 December
Gather two reviewed replies for the month-one check-in
Review progress with Amina and agree the next learning goal

Learning log
23 November: found the example replies with Leo. Help desk access still pending.

Month-one check-in notes
18 December: bring the reviewed replies and any unanswered questions.
After the meeting: record feedback and the next learning goal here.
`;

const PROMPT = `Read my Pinto Notes note "First month at Alder Tools".
Add this confirmed answer under Questions and answers:
27 November 2026, Amina: all refund requests go to the shift lead for approval.
Replace the open question about refund approval with that dated answer.
Keep the other questions, access status and weekly checklists unchanged.
Then list any unanswered questions in the chat, with the person I planned to ask.
Use only the note and the answer above. Do not invent company policy or mark training complete.
Ask me before editing if you cannot find the right note or question.`;

const FAQ = [
  { q: "What should a new hire put in an Apple Notes onboarding note?", a: [
    "Record your role expectations, people to ask, system access status, reference pages and open questions. Add a checklist for each of the first four weeks and dated answers as you learn. The filled layout on this page is a starting point.",
  ] },
  { q: "How do I track pending system access in my onboarding note?", a: [
    "Write the system name, request number, request date and the person or team handling it. Keep the status pending until you have tested access. Store passwords in your employer's approved password manager, never in this note.",
  ] },
  { q: "Can this onboarding checklist replace my employer's onboarding system?", a: [
    "No. This is your personal reference for the first month. Follow your employer's process for documents, required training and access requests. A tick in this note does not submit anything to those systems.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-employee-onboarding-template"
      intro={<>
        Copy this Apple Notes employee onboarding template into a new note. Keep the people to ask and your open questions beside a
        week-by-week checklist for your first month.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#first-month", label: "Use it each week" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Add confirmed answers with AI" },
        ]}>
          <p>
            Use one note as your own first-month record, with role expectations, people, systems and questions you still need answered.
            This filled example follows a new support hire, with a small people table and a checklist for each week.
          </p>
          <div id="template">
            <Keep title="Employee onboarding template for Apple Notes" text={TEMPLATE}
              note="Fictional example. Replace the names and dates. The steps below turn the people lines into a table and each week's tasks into a checklist." />
          </div>
          <PostCta slug="apple-notes-employee-onboarding-template" position="answer" title="Add confirmed answers with ChatGPT or Claude">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your onboarding note and edit it with the answers you supply.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Set it up in Apple Notes</h2>
      <p>
        Use iCloud notes or notes saved on your device. Apple says many features are unavailable with other email providers.
        Paste the layout as plain text first. Keep the system locations as names until you replace them with your team&apos;s real links.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "Mac", steps: ["Format", "Table"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>
        On Mac, select a section label, click the Format button and choose Heading. Select only the task lines beneath Week 1 and
        click the Checklist button. Repeat for the other weeks. Click a circle when you finish a task.
      </p>
      <p>
        For the people table, select the four lines from Person through Noor Evans and press the Table button. The tabs separate
        the two columns. Or choose Format, Table for an empty two-column table and enter the names and responsibilities yourself.
        Tab in the last cell adds a row. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> explains the controls.
      </p>
      <p>
        On iPhone, tap New Note and paste the text. Select a section label, tap Format, then Heading. For each week, replace the plain
        task lines with a list made using the Checklist button. Type a task and tap Return for the next item. Tap its circle to tick it.
        For People, tap Add Table and enter the names and responsibilities in separate columns, then remove the plain people lines.
      </p>

      <h2 id="first-month">Keep the record useful through the first month</h2>
      <p>
        Replace the example&apos;s goals with expectations you have agreed with your manager. Maya&apos;s goal is to write replies with
        review. Leave an expectation marked unconfirmed until you have discussed it.
      </p>
      <p>
        At the end of each day, add answers beside the questions they resolve. Include the date and who answered.
        Keep unanswered questions visible, with a person to ask and a day to follow up. If an access request says resolved,
        try opening the system before changing your own status.
      </p>
      <p>
        Each Friday, check the week&apos;s list and move unfinished work to a realistic date. Add a short learning-log entry about
        something you can now do. Keep completed tasks ticked so the record shows what you have already learned.
        For longer conversations with your manager, the <a href="/blog/apple-notes-1-on-1-template">1 on 1 template</a> gives those
        meetings their own running note.
      </p>
      <p>
        Before the month-one check-in, choose examples that match the agreed expectations. Maya brings two reviewed replies and the
        questions still open. Afterward, add the feedback and the next learning goal.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        This note records the information you enter. It does not grant system access or submit training records.
        Keep official tasks in your employer&apos;s onboarding process. Store work notes only where your employer permits them,
        and keep passwords and employee documents in their approved systems.
      </p>
      <p>
        The weekly dates help you plan, but the layout itself sends no reminders. You still need to ask the questions and confirm
        each answer. Keep a request number beside pending access so you can follow up without repeating the whole history.
      </p>

      <h2 id="pinto-notes">Add a confirmed answer with ChatGPT or Claude</h2>
      <p>
        You can use the same layout in Pinto Notes on Mac and iPhone, with headings, checklists and tables.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and choose Allow, that connection grants
        reading and editing access. Supply an answer you have confirmed, then ask your AI to put it beside the right question.
      </p>
      <Keep title="Ask your AI to update the onboarding note" text={PROMPT}
        note="Example answer only. Replace it with your own confirmed information before using the prompt." />
      <p>
        Open the edited note and check the date, person and wording against what you supplied. In this example, refund requests go to
        the shift lead. Help desk access should still say pending, and no weekly task should have been ticked. Check any list of open
        questions against the note too. Pinto keeps earlier versions if you need to return to one.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
