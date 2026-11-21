import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-expense-tracker", { title: "Apple Notes expense tracker: a log that adds itself up" });

// Written 21 November 2026 for "apple notes expense tracker" (Google autocomplete read 21 Nov, en-US: apple notes expense
// tracker, apple notes expense tracking template, iphone notes expenses, apple notes track expenses). A running log of what was
// spent, where apple-notes-budget-template is a plan for the month; this post links it and doesn't repeat it.
// Apple Notes facts: the table steps use apple-notes-cornell-notes-template's wording (tab-separated lines, select them, the
// Table button; Format, Table, Option-Command-T; Tab in the last cell adds a row), all tried on macOS 27 in apple-notes-tables,
// which also found that Math Results is greyed out inside a table and that named lines under the table get their answer.
// File, Duplicate Note: apple-notes-meal-planner-template. Pin and Search: BRIEF list. Read today on support.apple.com:
// "Solve math in Notes on Mac" (support.apple.com/guide/notes/solve-math-apda85974595/mac): Format, Math Results, with Insert
// Results, Suggest Results (the default; press Return to insert) and Off; variables in the Latin alphabet, defined above the
// sum that uses them; works in upgraded iCloud notes and notes stored on the Mac. "Solve math with Math Notes" on iPhone
// (support.apple.com/guide/iphone/solve-math-with-math-notes-iph46efa613a/ios): a variable is a letter or word followed by an
// equals sign, then "a value or expression", so Groceries = 412 + 238 names the sum. "Enter formulas and equations" on iPhone
// (support.apple.com/guide/iphone/enter-formulas-and-equations-iphb9c2b948f/ios): Notes solves expressions inline when you
// type an equals sign. The hero is Apple's own Sequoia Group Expenses example, the same picture as apple-notes-budget-template.
// Pinto side: content/templates/budget-log.json (prompt: the AI adds { id, date, what, category, amount } to values.expenses;
// asks; month summaries land in the note) and budget-log.app (README and docs/README.md: Month, Expenses by day with edit and
// delete with Undo, Budget per category, monthly bills, roll-over, last six months; the sums are in src/lib/budget.ts, not
// the AI; known gaps: no income, no export yet). No bank connection: budget-tracker-with-chatgpt-or-claude's checked notes.
// The Pinto picture is SHOTS.budgetApp, as in the budget post.

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

Groceries + Transport + Dining + Household + Fun =
`;

const FAQ = [
  { q: "Can I track expenses in Apple Notes?", a: [
    "Yes. Keep a table of what you spent, one row per purchase, and under it one line per category, like Groceries = 412 + 238. A last line that adds up the category names and ends in an equals sign gets the total from Math Results.",
  ] },
  { q: "Is there an expense tracking template for Apple Notes?", a: [
    "Apple Notes has no templates of its own. Paste the template on this page into a new note, turn the tab-separated lines into a table, and duplicate the note each month on a Mac with File, Duplicate Note.",
  ] },
  { q: "Why doesn't Math Results work in my expense table?", a: [
    "Math Results is greyed out while you're in a table, so a sum typed in a cell stays as text. Put the category lines and the total under the table, and Notes answers them there.",
  ] },
  { q: "Can ChatGPT or Claude log my expenses into a note?", a: [
    "Not into Apple Notes. In Pinto Notes, once ChatGPT or Claude is connected, you say what you spent and it adds the expense to the Budget and expenses template, which does the sums itself.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-expense-tracker"
      intro={<>
        A spending log works like this: you write it down when you pay, and the month adds up at the
        end. Apple Notes can hold that log and do the totals. Here&apos;s a template to paste in, how to keep it going, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#day-to-day", label: "Day to day" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "An expense log your AI fills in" },
        ]}>
          <p>
            Apple Notes has no expense tracker, but one note can be one. Log each purchase as a row in a table (date, what, category,
            amount), then under the table write one line per category, like Groceries = 412 + 238, and add the categories up with an
            equals sign. Math Results fills in the total on iPhone and Mac.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-expense-tracker" position="answer" template="budget-log" title="Want the sums done for you?">
            <p>Pinto Notes works like Apple Notes and has a free Budget and expenses template. Add what you spent with one tap, or tell ChatGPT or Claude and it logs it, and the note shows what&apos;s left in each category.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="A note called Sequoia Group Expenses on iPhone: each cost named on its own line, the names added up to $475, and $475 divided by 5 to $95 each."
        caption="Apple's own expenses note: each cost has a name, and the names add up to a total. The template below runs on the same trick. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="template">The template: a log with totals under it</h2>
      <p>
        The note has two parts. The table is the log: one row for each thing you buy, so you can see later what the money went on. The
        lines under it do the sums, because Notes can&apos;t add up a table. Each category gets a name and the amounts that belong to it,
        and the last line adds the names together.
      </p>
      <Keep title="Expense tracker for Apple Notes" text={TEMPLATE}
        note="Each table line has a tab between the columns. Paste it, then turn those lines into a table. Notes offers the total after the last equals sign; press Return to keep it." />
      <p>
        Change the categories to yours. A category name is one word in the Latin alphabet (Dining, not Eating out), and Notes needs it
        written above the line that uses it, which is why the categories come before the total.
      </p>

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" },
        { on: "Mac", steps: ["Format", "Math Results"] },
      ]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the template into a new note, select the seven lines from Date to the last
          expense, and press the Table button. Every tab becomes a column, so you get Date, What, Category and Amount side by side.
        </li>
        <li>
          <strong>Check Math Results.</strong> On a Mac, Format, Math Results has three settings: Suggest Results (the default, where
          Return keeps the answer), Insert Results and Off. If the total doesn&apos;t appear, it&apos;s set to Off.
        </li>
        <li>
          <strong>Use an iCloud note.</strong> Apple says math works in upgraded iCloud notes and in notes stored on your Mac.
        </li>
        <li>
          <strong>One note per month.</strong> On a Mac, File, Duplicate Note copies last month&apos;s note. Delete the rows, reset each
          category line, and change the title.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> goes through what a table can and can&apos;t do, with pictures of
        the sum that stays as text inside one.
      </p>

      <h2 id="day-to-day">Day to day</h2>
      <ul>
        <li><strong>Log it when you pay.</strong> Tab in the last cell adds a row. Write the date, what it was, the category and the amount.</li>
        <li><strong>Add the amount to its category.</strong> Put + 96 on the end of the Groceries line, and the total at the bottom follows. On iPhone, Notes answers sums as you type the equals sign too.</li>
        <li><strong>Pin the note.</strong> Pinned to the top of its folder, this month&apos;s log is the first thing you see when you open Notes.</li>
        <li><strong>Find a purchase later.</strong> Search reads every word in every note, so &ldquo;cinema&rdquo; finds the month you went.</li>
      </ul>
      <p>
        A log tells you what you spent. To set a limit for each category first and see what&apos;s left, use the{" "}
        <a href="/blog/apple-notes-budget-template">Apple Notes budget template</a> alongside it: the plan in one note, the log in this one. For things you&apos;re thinking of buying, keep a separate wishlist with a waiting date until you decide.
      </p>

      <h2 id="limits">Where an Apple Notes expense log stops</h2>
      <ul>
        <li><strong>Every amount is typed twice.</strong> Once in the table and once on its category line. Forget the second and the total is wrong, with nothing to tell you.</li>
        <li><strong>The table doesn&apos;t sort or add up.</strong> You can&apos;t sort by amount or category, and a total inside the table stays as text.</li>
        <li><strong>Months stay apart.</strong> Comparing November with October means opening two notes and reading both.</li>
        <li><strong>Bills that repeat are typed by hand</strong> into every month&apos;s note.</li>
      </ul>
      <p>
        For a few dozen purchases a month, the note holds up. Past that, the category lines get long and checking them against the table
        takes longer than the logging.
      </p>

      <h2 id="pinto-notes">An expense log your AI fills in</h2>
      <Figure shot={SHOTS.budgetApp} caption="The Budget and expenses template in Pinto Notes on a Mac, with example data: what's left this month, the last six months, bills and each category against its budget." />
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and a note can also be a small app. The free{" "}
        <a href="/templates/budget-log">Budget and expenses</a> template is one. You set a monthly budget per category once, then add
        each expense with one tap, starting with the amount. Every expense of the month is listed by day, and you can edit or delete one,
        with Undo. Monthly bills are added on their day, and the note shows what&apos;s left this month, each category against its budget
        and the last six months. The app does the sums, so each amount is typed once.
      </p>
      <p>
        Once ChatGPT or Claude is connected, you can also say &ldquo;412 on groceries and 85 on the bus card&rdquo; in the chat you
        already use, and it logs both with the date, what, category and amount. Ask &ldquo;How am I doing against the budget this
        month?&rdquo; or &ldquo;What did we spend on eating out last month?&rdquo;, and a month&apos;s summary lands in the note itself.
        It doesn&apos;t connect to your bank. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute, and{" "}
        <a href="/blog/budget-tracker-with-chatgpt-or-claude">a budget your AI can keep for you</a> shows the whole flow.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed.
      </p>
    </PostPage>
  );
}
