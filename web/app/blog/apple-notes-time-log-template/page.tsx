import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-time-log-template", { title: "Apple Notes time log template, with a weekly total" });

// Written 21 November 2026 for "apple notes time log template", topic-research-2026-11-24.md row 3, A3/B2/C2.
// Google autocomplete rechecked directly today at 16:12 UTC, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple+notes+time+log+template
// returned []. q=apple+notes+time+tracking returned "apple notes time tracking", plus unrelated suggestions.
// q=time+log+template returned "time log template", "time log template google sheets", "time log template free",
// "time log template excel", "time log template google docs", "time log template 15 minute intervals",
// "time log template pdf", "time log template word", "time log template printable", "time log template free pdf".
// Related product and generic evidence, not volume.
// Apple support read today, directly over HTTPS after web open returned 429 for the guide pages:
// https://support.apple.com/en-us/guide/notes/apd0a136b9cc/mac (select paragraphs, Table button or Format, Table;
// empty table has two rows and columns; Tab in the last cell adds a row). Tab conversion follows the Cornell model.
// https://support.apple.com/en-us/guide/notes/apd93c815aa0/mac (selected paragraphs, Checklist button).
// https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios (New Note, Add Table, Format, Heading).
// https://support.apple.com/en-us/102296 (Checklist button, Return, tap circle; iCloud or device notes).
// The phone alternative keeps the same fields within a two-column table; no unverified column-menu path used.
// Pinto sources opened in wave9: Pane/Editor/SlashCommands.swift:5-8, 18-29 (headings, checklists, tables);
// supabase/functions/mcp/files_tools.ts:76-110 (fetch/create/edit, read before editing).
// apple-notes-tables/page.tsx's verified header confirms no table sums in Notes or Pinto's table editor.
// BRIEF.md supplies Apple Notes look/behavior on Mac/iPhone, connected ChatGPT/Claude read/edit access,
// and Mac Apple Notes import leaving the originals unchanged. README.md:15-25, 62-72 confirms these capabilities.
// This is a new paste-in layout, not a shipped Pinto template. No timer, activity capture or formula claimed.
// Totals checked from the fictional sessions: 130 + 95 + 60 + 75 + 90 = 450 minutes. Unknown time is excluded.
// No screenshots. Native paste and AI workflow not exercised; the prompt is a suggested request to check.
// All four body blog links and the suggested inbound post are registered with draft: false in lib/posts.ts.

const TEMPLATE = `Time log, 16 to 20 November 2026

Scope: Website, newsletter and related admin sessions only. Not a full workweek.

Sessions
Date\tStart\tFinish\tProject\tTask\tMinutes
16 Nov\t09:00\t10:10\tWebsite\tDraft home page\t70
16 Nov\t10:10\t10:25\tAdmin\tDelivery call\t15
16 Nov\t10:25\t11:10\tWebsite\tRevise home page\t45
17 Nov\t09:00\t09:40\tWebsite\tCheck mobile layout\t40
17 Nov\t14:00\t14:55\tWebsite\tApply client feedback\t55
18 Nov\t10:00\t11:00\tWebsite\tPrepare review\t60
19 Nov\t09:15\t10:00\tNewsletter\tWrite November update\t45
19 Nov\t10:10\t10:40\tAdmin\tClear project email\t30
20 Nov\t09:00\t10:00\tWebsite\tPublish approved changes\t60
20 Nov\t10:15\t10:45\tNewsletter\tEdit subject lines\t30

Daily totals, added by hand
16 Nov: 130 minutes
17 Nov: 95 minutes
18 Nov: 60 minutes
19 Nov: 75 minutes
20 Nov: 90 minutes
Weekly total: 450 minutes, 7 hours 30 minutes

Project totals, added by hand
Website: 330 minutes
Newsletter: 75 minutes
Admin: 45 minutes

Interruptions and unknown time
16 Nov: delivery call split the website session. Its 15 minutes are already in Admin.
19 Nov, 10:40 to 11:00: activity not recorded. 20 minutes unknown, excluded from totals.

Weekly check
Check every duration against its start and finish
Check that daily totals and project totals both equal the weekly total
`;

const PROMPT = `Read my Pinto Notes note "Time log, 16 to 20 November 2026".
Add a session on 20 November, 14:00 to 14:35, for Website: check the published links, 35 minutes.
Keep all existing sessions and the unknown-time entry unchanged. Do not count the delivery call twice.
Propose revised daily, project and weekly totals here in the chat. Leave the note's totals unchanged until I check them.
Ask me about any missing or overlapping times. Do not invent sessions or fill unexplained gaps.`;

const FAQ = [
  { q: "What fields should an Apple Notes time log include?", a: [
    "Record the date, start, finish, project, task and minutes for each session. Keep a daily subtotal and a weekly total below the table. State which work you are logging so a partial record does not look like a full workweek.",
  ] },
  { q: "Will the minutes column in this Notes time log total itself?", a: [
    "No. The minutes and totals in this layout are text you enter and check yourself. Neither the Apple Notes table nor the same layout in Pinto Notes sums the column automatically.",
  ] },
  { q: "How do I record an interruption without counting it twice?", a: [
    "End the first task's row when the interruption starts. Record the interruption in its own row, then start a new row when you return to the task. Do not also count the uninterrupted span as work on the original task.",
  ] },
  { q: "What should I put in a time log when I forgot a task?", a: [
    "Mark the interval as unknown and leave it out of project totals. If you later reconstruct it from a source you trust, label the entry as estimated. Do not turn a gap into a precise task without evidence.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-time-log-template"
      intro={<>
        Copy this Apple Notes time log template to record completed work in a dated table.
        Enter each session&apos;s minutes yourself, then add the daily totals for a weekly total you can check.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Make the table" },
          { href: "#log", label: "Log actual time" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Add a session with AI" },
        ]}>
          <p>
            Use one row per finished session, with its date, start, finish, project, task and minutes.
            This filled example totals 450 minutes across five days, with an interruption counted once and unknown time kept separate.
          </p>
          <div id="template">
            <Keep title="Time log for Apple Notes" text={TEMPLATE}
              note="Copy this fictional example, then replace its sessions and totals with yours. The setup below turns the tab-separated rows into a table." />
          </div>
          <PostCta slug="apple-notes-time-log-template" position="answer" title="Want to add sessions through your AI?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your log and add the sessions you supply.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Make the table and review checklist</h2>
      <p>
        Use a note in iCloud or stored on your device for these Notes features. Paste the layout as plain text first.
        Its section labels and totals stay outside the table.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Select session lines", "Format", "Table"] },
        { on: "iPhone", steps: ["New Note", "Add Table"] },
      ]} />
      <p>
        On a Mac, select the eleven lines from Date through the final session and press the Table button, or choose Format, Table.
        Every tab becomes a column. Press Tab in the last cell to add another row later.
        Apple&apos;s <a href="https://support.apple.com/en-us/guide/notes/apd0a136b9cc/mac">Mac table guide</a> covers these controls.
        See <a href="/blog/apple-notes-tables">tables in Apple Notes</a> for the limits of a Notes table.
      </p>
      <p>
        On iPhone, tap New Note and paste the text. For a narrower table, tap Add Table and use Session and Minutes as the two headings.
        In Session, combine the date, times, project and task, such as &ldquo;16 Nov, 09:00 to 10:10, Website, draft home page&rdquo;.
        Put 70 in Minutes. Transfer the other entries in the same way, then remove the original plain session lines.
        Apple documents Add Table in its <a href="https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios">iPhone Notes guide</a>.
      </p>
      <p>
        On Mac, select the two lines under Weekly check and click the Checklist button.
        On iPhone, put the cursor under that label, tap Checklist and type each check, tapping Return between them.
        Remove the original plain check lines. Tap or click a circle after completing its check.
      </p>

      <h2 id="log">Log what happened, including interruptions</h2>
      <p>
        Replace the sample with your own week and state what you are tracking. This example covers selected project sessions.
        A blank afternoon says nothing about other work. Keep planned tasks in a separate note so they don&apos;t enter the totals.
      </p>
      <p>
        Add a row when you finish a task or switch to something else. Use consistent project names so Website stays one category.
        The 09:00 to 10:10 session is 70 minutes. The delivery call gets its own 15-minute Admin row, followed by a new website row.
        Counting 09:00 to 11:10 as Website as well would count the call twice.
      </p>
      <p>
        Keep uncertain time visible. The Thursday gap is 20 minutes with no recorded activity, so it stays outside the project totals.
        If you recover a missing session later, note whether its times are exact or estimated before adding it.
      </p>

      <h2>Check the weekly total by hand</h2>
      <p>
        Add each day&apos;s minutes, then add those subtotals. Here, 130 + 95 + 60 + 75 + 90 equals 450 minutes, or 7 hours 30 minutes.
        The project check agrees: 330 for Website, 75 for Newsletter and 45 for Admin also equals 450.
        The unknown 20 minutes are excluded from both calculations.
      </p>
      <p>
        Tick the review items after checking the rows and both sets of totals. When a session changes, check the affected totals again.
        Keep the completed week as a record. For other reusable layouts, see <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="limits">Where a time log in Notes stops</h2>
      <p>
        This layout has no running timer or automatic activity capture. Its minutes and totals are values you write yourself.
        Neither Notes nor this layout in Pinto sums a column. If you need automatic duration calculations across many sessions,
        a spreadsheet with duration formulas may suit the job better.
      </p>
      <p>
        A total only describes the sessions you recorded. It cannot explain unknown time or establish which minutes are billable.
        Keep any billing decisions separate from this record of what happened.
      </p>

      <h2 id="pinto-notes">Ask ChatGPT or Claude to add a session</h2>
      <p>
        You can keep this layout as a normal note in Pinto Notes, with tables and a review checklist.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and choose Allow, it can read and edit your notes.
        Supply the actual session details and ask it to append a row. The log still depends on what you record.
      </p>
      <Keep title="A request for your connected AI" text={PROMPT}
        note="Use this with the filled example above, or replace the title and session details with your own." />
      <p>
        Open the edited note and check that it added one 35-minute session without changing the older rows.
        For this example, Friday should become 125 minutes, Website 365, and the weekly total 485 minutes, or 8 hours 5 minutes.
        Check those figures yourself before asking the AI to replace the saved totals. Keep the unknown time excluded.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
