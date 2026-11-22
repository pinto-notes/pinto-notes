import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-job-search-tracker", { title: "Job search tracker template for Apple Notes" });

// Written 21 November 2026 for "apple notes job search tracker"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0). TABLE: plain paste, the five lines from
// Company to Northlight made a table with the Table button (four columns, five rows). REST: clicked under the table, then
// Edit, Paste as Markdown: headings, the prep as a numbered list, This week as a checklist, People as a dashed list.
// "Send the portfolio link to Tideway" ticked (sorting on, so it dropped below the other).
// Pinto Notes: the job hunt app (content/templates/job-hunt.app, an app since 22 November 2026) with the same four
// applications on its board (Finch Bikes to apply to by 18 Nov, Marlow Studio's follow-up on 16 Nov, Tideway's first
// interview on 12 Nov with the same three questions and answers and the question to ask, Northlight closed, Karin as the
// Tideway contact), seen on Wednesday 11 November. Drawn by scripts/blog-side-by-side-apps.ts (job-hunt) with the render
// service's code.

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
    "Pinto Notes has a free job hunt template, a small app in a note with a board from Saved to Offer. Paste a job ad into ChatGPT or Claude and it adds the card, then moves it along and adds the next date as you tell it what happened.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-job-search-tracker"
      cover={false}
      intro={<>One note: a table of your applications, with your prep and follow-ups under it.</>}
      answer={<>
        <Keep title="Job applications table for Apple Notes" text={TABLE} fold={10}
          note="After pasting, select the five lines from Company to Northlight and press the Table button." />
        <Keep title="Prep and follow-ups for Apple Notes" text={REST} fold={10}
          note="On a Mac, click under the table and paste it with Edit, Paste as Markdown." />
        <SideBySide slug="apple-notes-job-search-tracker"
          apple={{ src: "/blog/side-by-side/job-search-tracker-apple-notes", width: 1584, height: 1000, line: "Holds the table. You type every job and keep each row up to date.",
            alt: "The job search template in Apple Notes on macOS 27: a table of four applications, interview prep for Tideway, This week with one follow-up ticked, and a note about Karin." }}
          pinto={{ title: "The same job hunt in Pinto Notes", line: "A board from Saved to Offer that shows what's due. Paste a job ad into your AI and it adds the card.",
            alt: "The same four applications on the Pinto Notes job hunt app's board: Finch Bikes saved, Marlow Studio applied with a follow-up on 16 November, Tideway at interview tomorrow, Northlight closed.",
            phone: { src: "/blog/side-by-side/job-hunt-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/job-hunt-pinto-mac", width: 1526, height: 1280 },
            href: "/templates/job-hunt", button: "Get the job hunt template" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Paste the table template into a new note, select the five lines from Company to Northlight and press the Table button: <MenuPath steps={["Format", "Table"]} keys="⌥⌘T" /></li>
        <li>Click under the table and paste the second template with <MenuPath steps={["Edit", "Paste as Markdown"]} /> On iPhone, type the headings, select the follow-ups and tap the checklist button.</li>
        <li>Add a job with Tab in the last cell. Use the same stage words every time: Saved, Applied, Interview, Offer, Rejected.</li>
        <li>Change the row the day something happens, and put a date in every next step.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-meeting-notes-template">notes for each interview</a>, <a href="/blog/apple-notes-tables">what tables in Notes can and can&apos;t do</a> and <a href="/blog/apple-notes-templates">five more templates</a>.</p>
    </PostPage>
  );
}
