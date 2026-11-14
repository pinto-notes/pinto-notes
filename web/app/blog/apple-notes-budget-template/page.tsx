import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-budget-template", { title: "Apple Notes budget template that adds itself up" });

// Written 13 November 2026 for "apple notes budget template" (autocomplete: free, budget tracker, monthly budget, iphone notes
// budget template): blog-growth/topic-research-2026-11-13.md. The result page is spam template pages and Numbers templates;
// nothing shows a working budget in Notes. The Notes part uses only what apple-notes-tables tested on macOS 27: numbers named
// on their own lines, then the names added up with "=", which Math Results answers (Format, Math Results); not inside a table,
// where Math Results is greyed out. Apple's own iPhone example of the same pattern is the picture. Pinto Notes' side: the
// Budget and expenses template (web/content/templates/budget-log.app, README: monthly budget per category, what's left with a
// bar, roll-over, bills every month, the last six months, Add expense; the person's AI can log spending into data.json).

const TEMPLATE = `Budget, November

Income = 3200

Rent = 1200
Food = 450
Transport = 120
Phone = 30
Fun = 150
Saving = 500

Rent + Food + Transport + Phone + Fun + Saving =
Income - Rent - Food - Transport - Phone - Fun - Saving =
`;

const FAQ = [
  { q: "Does Apple Notes have a budget template?", a: [
    "No. Apple Notes has no templates at all. You can make a budget note that adds itself up, though: give each amount a name on its own line, then add the names with an equals sign, and Math Results fills in the total.",
  ] },
  { q: "Can Apple Notes do math?", a: [
    "Yes, with Math Results. Type a sum ending in an equals sign and Notes offers the answer. Named amounts, like Rent = 1200, can be used in later sums, and changing one updates every answer below it.",
  ] },
  { q: "Why doesn't my budget table in Apple Notes add up?", a: [
    "Math Results doesn't work inside a table. Keep the table for reading if you like, and put the named amounts and the sums as plain lines under it.",
  ] },
  { q: "Is there a free budget app that works like a note?", a: [
    "Pinto Notes has a free Budget and expenses template: a note that is a small app, with what's left this month, each category against its budget, monthly bills and the last six months. ChatGPT or Claude can add what you spent to it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-budget-template"
      intro={<>
        You want a budget where you already write everything down, not another app with a login. Apple Notes can do more of it than
        you&apos;d think. Here&apos;s a template you can paste in that adds itself up, where it stops, and what to use when you outgrow it.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#how", label: "How it adds up" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A budget that keeps itself" },
        ]}>
          <p>
            Apple Notes has no templates, but a budget note can still do the sums. Put each amount on its own line with a name, like Rent =
            1200, then add the names up with an equals sign at the end, and Math Results fills in the total and what&apos;s left. Copy the
            template below into a new note.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-budget-template" position="answer" title="Want a budget that keeps itself?">
            <p>Pinto Notes works like Apple Notes and has a free Budget and expenses template: what&apos;s left this month, each category against its budget, and bills that repeat. Tell ChatGPT or Claude what you spent and it adds it.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-math-notes-named-totals" width={1306} height={1828} maxWidth={360}
        alt="A note called Sequoia Group Expenses on iPhone: each cost named on its own line, the names added up to $475, and $475 divided by 5 to $95 each."
        caption="Apple's own example of the trick a budget note runs on: name each amount, then add up the names. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="template">The template: a monthly budget that adds itself up</h2>
      <p>
        Make a new note and paste this in. Change the amounts and the names to yours; any name works as long as it&apos;s spelled the
        same way each time.
      </p>
      <Keep title="Monthly budget for Apple Notes" text={TEMPLATE}
        note="Notes offers each answer after the equals sign. Press Return to keep it." />
      <p>
        The first sum is what you&apos;ve planned to spend. The second is what&apos;s left once everything, saving included, is taken
        out of your income. If the second answer is below zero, the plan doesn&apos;t fit.
      </p>
      <p>
        Keep one note per month. On a Mac, File, Duplicate Note copies last month&apos;s, so you only change the title and the amounts
        that moved. If you keep other templates too, <a href="/blog/apple-notes-templates">Apple Notes templates</a> shows how to set up
        a Templates folder.
      </p>

      <h2 id="how">How it adds up</h2>
      <PostFigure src="/blog/macos27/notes27-table-sum-named-lines-v2" width={1168} height={860} maxWidth={584}
        alt="A Moving budget table in Apple Notes on macOS 27. The Total cell reads 85+240+180= with no answer. Under the table, Boxes = 85, Van = 240 and Cleaning = 180 are named, and Boxes + Van + Cleaning = shows 505 as Notes' suggestion."
        caption="On macOS 27: in a table, the sum just sits there. As named lines under it, Notes answers: 505." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Math Results"] }]} />
      <p>
        Notes calls this Math Results. A line like Rent = 1200 gives the number a name, and any later line ending in an equals sign
        gets its answer. Change Food from 450 to 500 and both totals follow, which is most of what a budget spreadsheet does for
        you. If no answer appears on a Mac, check that Format, Math Results is turned on.
      </p>
      <p>
        One catch: it doesn&apos;t work inside a table. Math Results switches off while you&apos;re in one, so a Total cell stays as
        text. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> goes through what tables can and can&apos;t do.
      </p>

      <h2 id="limits">Where an Apple Notes budget stops</h2>
      <ul>
        <li><strong>Spending is by hand.</strong> To track what you actually spent, you add a line for each purchase and a name to the sum. After a few weeks the sum line gets long.</li>
        <li><strong>No months side by side.</strong> Each month is its own note, so seeing how this month compares with the last six means opening six notes.</li>
        <li><strong>No bills that repeat.</strong> Rent and subscriptions have to be typed into every month&apos;s note.</li>
        <li><strong>No categories against a limit.</strong> You can see what&apos;s left in total, not that eating out is over and transport is under.</li>
      </ul>
      <p>
        For a plan you set once a month, the note is enough. If you want to log spending as it happens, that&apos;s where a note runs
        out.
      </p>

      <h2 id="pinto-notes">A budget note that keeps itself</h2>
      <Figure shot={SHOTS.budgetApp} caption="The Budget and expenses template in Pinto Notes on a Mac, with example data: what's left this month, the last six months, bills and each category against its budget." />
      <p>
        That&apos;s why I made Pinto Notes. It looks and works like Apple Notes on iPhone and Mac, and a note can also be a small app.
        The free <a href="/templates/budget-log">Budget and expenses</a> template is one: you set a monthly budget per category once,
        and it shows what&apos;s left this month with a bar, each category against its budget with what rolled over, your monthly
        bills and the last six months. Add an expense with one tap, and it does the sums.
      </p>
      <p>
        You can also tell ChatGPT or Claude what you spent, in the chat you already use, and it adds the expense to the note. The app
        does the maths, not the AI. <a href="/blog/budget-tracker-with-chatgpt-or-claude">A budget your AI can keep for you</a> shows
        how that works.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t
        changed.
      </p>
    </PostPage>
  );
}
