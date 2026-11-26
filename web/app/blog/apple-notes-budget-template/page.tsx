import { PostPage, postMetadata } from "@/lib/PostPage";
import { LiveBudget } from "@/lib/LiveBudget";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-budget-template", { title: "Apple Notes budget template that adds itself up" });

// Written 13 November 2026 for "apple notes budget template"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx):
// the template, then the same budget in Apple Notes and in Pinto Notes, then the steps and the questions.
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0, a plain paste). Named lines are recognised
// straight after a paste, but a line ending in "=" gets no answer until the "=" is typed again; typed, Notes suggests 2,450
// and 750 and Return keeps each, and changing Food updates both. So the template's sum lines end without "=" and the reader
// types it. Math Results is greyed out inside a table (apple-notes-tables, macOS 27).
// Pinto Notes: content/templates/budget-log.app rendered with scripts/page-render from the same six categories and amounts,
// with October and November spending to the 21st (public/blog/side-by-side/budget-pinto-*; data in the side-by-side report).
// 24 November 2026, live budget pilot (lib/LiveBudget.tsx; blog-growth/research/template-posts-diagnosis-2026-11-24.md):
// Google's AI summary already prints a copy-paste budget for this search, searchers ask for totals that add up, and
// every download from this post came in the first seconds, from the first screen. So the first thing under the intro
// is the Pinto template itself, live, with the Apple Notes text's own numbers; the text and its Copy button follow.

const TEMPLATE = `Budget, November

Income = 3200

Rent = 1200
Food = 450
Transport = 120
Phone = 30
Fun = 150
Saving = 500

Rent + Food + Transport + Phone + Fun + Saving
Income - Rent - Food - Transport - Phone - Fun - Saving
`;

const FAQ = [
  { q: "Does Apple Notes have a budget template?", a: [
    "No. Apple Notes has no templates. A note can still add itself up: name each amount on its own line, like Rent = 1200, then add the names and end the line with an equals sign.",
  ] },
  { q: "Can Apple Notes do math?", a: [
    "Yes, with Math Results. Type a sum ending in an equals sign and Notes offers the answer. Named amounts can be used in later sums, and changing one updates every answer below it.",
  ] },
  { q: "Why doesn't my budget table in Apple Notes add up?", a: [
    "Math Results doesn't work inside a table. Put the named amounts and the sums as plain lines under it.",
  ] },
  { q: "Is there a free budget app that works like a note?", a: [
    "Pinto Notes has a free Budget and expenses template: what's left this month, each category against its budget, monthly bills and the last six months. ChatGPT or Claude can add what you spent to it.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-budget-template"
      cover={false}
      intro={<>Type your income and amounts to see what&apos;s left. The Apple Notes version to copy is right under it.</>}
      answer={<>
        <LiveBudget slug="apple-notes-budget-template" />
        <Keep title="Monthly budget for Apple Notes" text={TEMPLATE} fold={10}
          note="After pasting, type = at the end of the last two lines. Notes offers the total. Press Return to keep it." />
        {/* No B39 download card here: the live budget above is this post's one first-screen action (B40). */}
        <SideBySide slug="apple-notes-budget-template"
          apple={{ src: "/blog/side-by-side/budget-template-apple-notes", width: 906, height: 577, line: "Adds up the plan. You type every change.",
            alt: "The budget template pasted into Apple Notes on macOS 27: Income 3200, six named amounts, and the two sums answered 2,450 and 750." }}
          pinto={{ title: "The same budget in Pinto Notes", line: "Tracks the month as you spend. Tell your AI what you spent and it adds it.",
            alt: "The same budget in the Pinto Notes Budget and expenses template on 21 November: 336 left this month, 2,114 spent of 2,450, and each category against its budget.",
            phone: { src: "/blog/side-by-side/budget-pinto-phone", width: 780, height: 1688 },
            desk: { src: "/blog/side-by-side/budget-pinto-mac", width: 1526, height: 1280 },
            template: "budget-log" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Make a new note and paste the template.</li>
        <li>Change the amounts and the names to yours. Any name works if it&apos;s spelled the same each time.</li>
        <li>Type = at the end of the last two lines and press Return to keep each total. On a Mac, Math Results must be on: <MenuPath steps={["Format", "Math Results"]} /></li>
        <li>Change an amount later and both totals follow. Keep one note per month.</li>
      </Steps>
      <p>More for Apple Notes: <a href="/blog/apple-notes-expense-tracker">an expense log that adds itself up</a>, <a href="/blog/apple-notes-tables">what tables in Notes can and can&apos;t do</a>, <a href="/blog/budget-tracker-with-chatgpt-or-claude">a budget your AI keeps for you</a>, <a href="/blog/apple-notes-wishlist-template">a Christmas wishlist with prices</a> and <a href="/blog/iphone-notes-christmas-list">a Christmas list with a budget per person</a>.</p>
    </PostPage>
  );
}
