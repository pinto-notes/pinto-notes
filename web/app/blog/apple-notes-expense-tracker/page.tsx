import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-expense-tracker", { title: "Apple Notes expense tracker: a log that adds itself up" });

// Written 21 November 2026 for "apple notes expense tracker"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0). Plain paste, the seven lines from Date to
// 8 Nov made a table with the Table button; the category lines, Groceries = 412 + 238 included, are recognised. The total line
// got no answer after the paste until its "=" was typed again; then Notes suggested 1,179 and Return kept it. So the template's
// total line ends without "=" and the reader types it. Math Results is greyed out inside a table (apple-notes-tables).
// Pinto Notes: content/templates/budget-log.app rendered with scripts/page-render from the same six expenses (and a budget for
// each category), on 9 November, Expenses tab (public/blog/side-by-side/expense-pinto-*).

// Tabs between the columns: select those lines in Notes and press the Table button.
const TEMPLATE = `Expenses, November

Date\tWhat\tCategory\tAmount
1 Nov\tWeekly shop\tGroceries\t412
2 Nov\tBus card\tTransport\t85
3 Nov\tPizza with friends\tDining\t230
5 Nov\tLight bulbs\tHousehold\t64
6 Nov\tWeekly shop\tGroceries\t238
8 Nov\tCinema\tFun\t150

Groceries = 412 + 238
Transport = 85
Dining = 230
Household = 64
Fun = 150

Groceries + Transport + Dining + Household + Fun
`;

const FAQ = [
  { q: "Can I track expenses in Apple Notes?", a: [
    "Yes. Keep a table of what you spent, one row per purchase, and under it one line per category, like Groceries = 412 + 238. A last line that adds up the category names and ends in an equals sign gets the total from Math Results.",
  ] },
  { q: "Is there an expense tracking template for Apple Notes?", a: [
    "Apple Notes has no templates of its own. Paste the one on this page into a new note, turn the tab-separated lines into a table, and duplicate the note each month on a Mac with File, Duplicate Note.",
  ] },
  { q: "Why doesn't Math Results work in my expense table?", a: [
    "Math Results is greyed out while you're in a table, so a sum typed in a cell stays as text. Put the category lines and the total under the table, and Notes answers them there.",
  ] },
  { q: "Can ChatGPT or Claude log my expenses into a note?", a: [
    "Not into Apple Notes. In Pinto Notes, once your AI is connected, you say what you spent and it adds the expense to the Budget and expenses template, which does the sums itself.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-expense-tracker"
      cover={false}
      intro={<>Log what you spend in a table. The lines under it add up the month.</>}
      answer={<>
        <Keep title="Expense tracker for Apple Notes" text={TEMPLATE} fold={10}
          note="After pasting, select the seven lines from Date to 8 Nov and press the Table button. Then type = at the end of the last line. Notes offers the total. Press Return to keep it." />
        {/* Experiment B39: the download card back on the first screen, under the template. */}
        <PostCta slug="apple-notes-expense-tracker" position="answer" title="Want expenses that add themselves up?">
          <p>In Pinto Notes&apos; free budget template you type each amount once, and the month and every category add up on their own.</p>
        </PostCta>
        <SideBySide slug="apple-notes-expense-tracker"
          apple={{ src: "/blog/side-by-side/expense-tracker-apple-notes", width: 1584, height: 858, line: "Adds up the month. Each amount is typed twice, in the table and on its category line.",
            alt: "The expense template in Apple Notes on macOS 27: a table of six purchases, a line per category, and the total 1,179." }}
          pinto={{ title: "The same expenses in Pinto Notes", line: "Each amount is typed once. Tell your AI what you spent and it logs it.",
            alt: "The same six expenses in the Pinto Notes Budget and expenses template, listed by day under November's total of 1,179.",
            phone: { src: "/blog/side-by-side/expense-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/expense-pinto-mac", width: 1526, height: 1280 },
            template: "budget-log" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Make a new note and paste the template.</li>
        <li>Select the seven lines from Date to 8 Nov and press the Table button: <MenuPath steps={["Format", "Table"]} keys="⌥⌘T" /></li>
        <li>Type = at the end of the last line and press Return to keep the total. On a Mac, Math Results must be on: <MenuPath steps={["Format", "Math Results"]} /></li>
        <li>When you pay for something, press Tab in the last cell for a new row, and put + and the amount on the end of its category line. A category name is one word, written above the line that adds it up.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-budget-template">a monthly budget that adds itself up</a>, <a href="/blog/apple-notes-tables">what tables in Notes can and can&apos;t do</a> and <a href="/blog/budget-tracker-with-chatgpt-or-claude">a budget your AI keeps for you</a>.</p>
    </PostPage>
  );
}
