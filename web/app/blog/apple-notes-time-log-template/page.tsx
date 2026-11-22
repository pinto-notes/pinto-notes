import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-time-log-template", { title: "Apple Notes time log template, with a weekly total" });

// Written 21 November 2026 for "apple notes time log template"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0). Plain paste; the two lines under Weekly
// check made a checklist with the Checklist button; the eleven lines from Date to the last session made a table with the
// Table button (six columns, eleven rows). Both checks ticked. The hand totals add up: 130+95+60+75+90 = 450 and
// 330+75+45 = 450. Neither a Notes table nor a Pinto table sums a column (apple-notes-tables).
// Pinto Notes has no time log template. The Pinto side is the same log as a Pinto note, with the table's columns typed
// (Project a choice, Minutes a number) as the template notes do, drawn by the Mac app offscreen
// (PaneTests/HIG/BlogSnapshots.swift, appleNotesSideBySide). Its button goes to the template library.

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

const FAQ = [
  { q: "What fields should an Apple Notes time log include?", a: [
    "Record the date, start, finish, project, task and minutes for each session. Keep a daily subtotal and a weekly total below the table. Say which work you are logging, so a partial record doesn't look like a full workweek.",
  ] },
  { q: "Will the minutes column in this Notes time log total itself?", a: [
    "No. The minutes and totals in this layout are text you enter and check yourself. Neither the Apple Notes table nor the same layout in Pinto Notes sums the column.",
  ] },
  { q: "How do I record an interruption without counting it twice?", a: [
    "End the first task's row when the interruption starts. Give the interruption its own row, then start a new row when you go back to the task.",
  ] },
  { q: "What should I put in a time log when I forgot a task?", a: [
    "Mark the time as unknown and leave it out of the project totals. If you work it out later from something you trust, label the entry as estimated.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-time-log-template"
      cover={false}
      intro={<>A table of finished sessions, with daily and weekly totals you add up yourself.</>}
      answer={<>
        <Keep title="Time log for Apple Notes" text={TEMPLATE} fold={10}
          note="After pasting, select the eleven lines from Date to the last session and press the Table button. Replace the example sessions and totals with yours." />
        <SideBySide slug="apple-notes-time-log-template"
          apple={{ src: "/blog/side-by-side/time-log-template-apple-notes", width: 1894, height: 1685, line: "Holds the log. You add up the minutes and check the totals by hand.",
            alt: "The time log template in Apple Notes on macOS 27: a table of ten sessions from 16 to 20 November, the daily and project totals, the unknown time and two ticked checks." }}
          pinto={{ frame: false, title: "The same log in Pinto Notes", line: "The same log as a note your AI can open. Tell it about a session and it adds the row and works out the new totals.",
            alt: "The same ten sessions in Pinto Notes as a table, with the totals under it.",
            phone: { src: "/blog/side-by-side/time-log-pinto-phone", width: 780, height: 1600 },
            desk: { src: "/blog/side-by-side/time-log-pinto-mac", width: 1520, height: 1208 },
            href: "/templates", button: "See the free templates" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Make a new note and paste the template as it is.</li>
        <li>Select the eleven lines from Date to the last session and press the Table button: <MenuPath steps={["Format", "Table"]} /> Then select the two lines under Weekly check and press the Checklist button.</li>
        <li>Add a row each time you finish a session or switch to something else. Tab in the last cell adds a row.</li>
        <li>Add up each day, then the days. Here both the days and the projects come to 450 minutes. Tick the checks once they agree.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-tables">what tables in Notes can and can&apos;t do</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
