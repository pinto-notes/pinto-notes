import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-wishlist-template", { title: "Apple Notes wishlist template, with a waiting period" });

// Written 21 November 2026 for "apple notes wishlist template". Research: topic-research-2026-11-23.md, row 2.
// Google autocomplete rechecked today with client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple%20notes%20wishlist%20template
// returned "apple notes wishlist template", "apple notes to do list", "checklist on apple notes", "apple notes list".
// Seeds "apple notes wishlist" and "apple notes template w" also returned the exact head query today.
// Apple's pages read today, including the native controls and menu names used below:
// https://support.apple.com/guide/notes/create-and-edit-notes-not9474646a9/mac (new note, Edit > Paste).
// https://support.apple.com/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button, click a circle).
// https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac (Format > Table, convert selected paragraphs,
// two rows and columns in an empty table, Tab in the last cell adds a row).
// https://support.apple.com/guide/iphone/iph1ac0b3a2/ios (new note, Format > Heading, Checklist, Add Table).
// https://support.apple.com/en-eg/102296 (start an iPhone checklist at the cursor, Return adds an item).
// Tab-separated table wording follows apple-notes-cornell-notes-template and apple-notes-tables, verified on macOS 27.
// Plain paste and native controls are deliberate. No Markdown table conversion or Markdown paste menu is claimed.
// Pinto: BRIEF.md's facts verify Notes-style editing on Mac/iPhone and Apple Notes import without changing the source.
// Pane/Editor/SlashCommands.swift, opened today, lists heading, checklist, table and link commands.
// supabase/functions/mcp/files_tools.ts, opened today, defines fetch and edit for reading and changing note text.
// Approval wording: connect-chatgpt-to-your-notes' verified header, one Allow grants read and edit.
// No shipped wishlist template, price monitoring, stock alert or retailer integration is claimed. No pictures used.

const TEMPLATE = `My wishlist

Review next: 28 November 2026
Rule: Wait at least seven days before deciding. Check the price again before buying.

Desk lamp with an adjustable arm
Link: https://example.com/desk-lamp
Price seen: EUR 65, including delivery
Seen on: 21 November 2026
Reason: The ceiling light leaves my desk in shadow after sunset.
Wait until: 28 November 2026
Decision: Waiting. Measure the space beside the monitor first.

Manual coffee grinder
Link: https://example.com/coffee-grinder
Price seen: EUR 95, including delivery
Seen on: 20 November 2026
Reason: Try freshly ground coffee on weekend mornings.
Wait until: 27 November 2026
Decision: Waiting. Borrow a grinder for one weekend before deciding.

Laptop stand
Link: https://example.com/laptop-stand
Price seen: EUR 39, including delivery
Seen on: 12 November 2026
Reason: Raise the screen for video calls.
Wait until: 19 November 2026
Decision: Skip, 21 November. The books under the laptop already do this.

Before deciding
Measure the desk space for the lamp.
Borrow a coffee grinder for the weekend.
`;

const TABLE = `Item\tWait until / decision
Desk lamp\t28 Nov 2026 / Waiting, measure desk space
Coffee grinder\t27 Nov 2026 / Waiting, borrow one first
Laptop stand\t19 Nov 2026 / Skip, books already work
`;

const FAQ = [
  { q: "How do I make a wishlist in Apple Notes?", a: [
    "Paste the layout on this page into a new note. Give each possible purchase a product link, the price and date you saw it, a reason, a wait-until date and a decision. Keep any checks you need to do in a checklist below.",
  ] },
  { q: "Should I use a table or checklist for a wishlist?", a: [
    "Use a table for a short overview of items and decisions. Keep longer reasons and product links in the item entries. A checklist works for actions such as measuring a shelf or trying a borrowed item before buying.",
  ] },
  { q: "What should I write in a wishlist before buying?", a: [
    "Write what the item would help you do, what you already use instead, the price including delivery and when you will reconsider. At that review, record Buy, Wait or Skip with a short reason. The date is a chance to decide, not a deadline to spend.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-wishlist-template"
      intro={<>Copy this Apple Notes wishlist template to keep possible purchases with their links, dated prices and reasons. A wait-until date gives you a day to reconsider each item before buying it.</>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#review", label: "Review the list" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Review with an AI" },
        ]}>
          <p>
            Keep one note with an entry for each item you might buy for yourself. Record the link, price seen and date, reason,
            wait-until date and decision, then use a checklist for anything to check before you spend.
          </p>
          <PostCta slug="apple-notes-wishlist-template" position="answer" title="Want help reviewing your wishlist?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected and approved, ChatGPT or Claude can read your wishlist and edit the review notes you ask for.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="template">The template: purchases worth reconsidering</h2>
      <p>
        This example includes two items still waiting and one already skipped. The prices are invented examples in euros, and the
        example.com links are placeholders. Replace them with the exact product pages and prices you found, including delivery.
      </p>
      <Keep title="Wishlist for Apple Notes" text={TEMPLATE}
        note="Paste as plain text. The setup below turns the final two lines into a native checklist." />
      <p>
        Write the reason before adding another product. &ldquo;The desk is too dark after sunset&rdquo; gives you something to check.
        &ldquo;Looks nice&rdquo; can be a reason too. It helps to know which one you mean.
      </p>
      <p>
        Keep this list for your own possible purchases. For things you might buy for someone else, use the separate{" "}
        <a href="/blog/apple-notes-gift-ideas">Apple Notes gift ideas list</a>.
      </p>

      <h2 id="set-up">Set it up on Mac or iPhone</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Paste"] },
        { on: "Mac", steps: ["Select the final two lines", "Checklist button"] },
        { on: "iPhone", steps: ["New Note", "Enter text"] },
      ]} />
      <p>
        On a Mac, create a new note and choose Edit, Paste. Select the two action lines under Before deciding and click the Checklist
        button. Click a circle when you finish that check. The item entries stay as ordinary text, so ticking an action never means
        you have bought the item.
      </p>
      <p>
        On iPhone, tap New Note and enter the layout. Select each item name, tap the Format button, then Heading. Under Before deciding,
        place the cursor on an empty line and tap the Checklist button. Enter the first action, then press Return to add the next.
        Apple&apos;s <a href="https://support.apple.com/guide/iphone/iph1ac0b3a2/ios" rel="noopener">iPhone Notes guide</a> describes the controls.
      </p>
      <h3>An optional table for the next review</h3>
      <p>
        Keep the full entries above. If the list gets longer, this small table gives you a shorter view of the dates and decisions.
      </p>
      <Keep title="Wishlist review table" text={TABLE}
        note="Each line has a tab between the item and its review details. This is a separate block to paste below the entries." />
      <p>
        On a Mac, paste these four lines, select them and press the Table button. Every tab becomes a column, so you get the item
        and its review details side by side. Or choose Format, Table for two rows and two columns, then fill in the cells.
        Press Tab in the last cell to add a row. On iPhone, tap Add Table and enter the same two columns.
        Apple&apos;s <a href="https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac" rel="noopener">Mac table guide</a> covers the controls.
      </p>
      <p>
        The <a href="/blog/apple-notes-tables">Apple Notes tables guide</a> has more examples. Update the overview when you change an
        entry, or leave it out if keeping two copies of a decision feels like extra work.
      </p>

      <h2 id="review">Decide when the waiting period is over</h2>
      <p>
        Choose a waiting period that suits the purchase. Seven days is an example, not a rule you have to keep. A replacement for a
        broken essential may need a quicker decision; an expensive hobby purchase may deserve longer.
      </p>
      <p>
        On the review date, read the original reason and check the current product page. For the lamp, measure the desk space first.
        For the grinder, try the borrowed one. Then write Buy, Wait or Skip, with the date and a reason. If you wait, set a new date.
      </p>
      <p>
        Keep skipped entries for reference. The laptop stand entry records why you passed, so finding the same stand next month
        doesn&apos;t mean starting the decision again. If you buy an item, add the amount actually paid and the purchase date.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        The price and date are a record of what you saw. Revisit the retailer before buying. This layout doesn&apos;t monitor prices
        or stock, and typing a wait-until date into it doesn&apos;t set a reminder. Set one separately if you need a notification.
      </p>
      <p>
        You maintain the decisions yourself. For a short wishlist, that may be all you need. There is no need to add a second app
        just to keep a few product links and reasons.
      </p>

      <h2 id="pinto-notes">Review the same layout with ChatGPT or Claude</h2>
      <p>
        You can keep this layout in Pinto Notes too, with headings, links and a checklist. It looks and works like Apple Notes on
        iPhone and Mac. <a href="/blog/connect-chatgpt-to-your-notes">Connect ChatGPT or Claude</a> and approve access before asking it
        to work in the note. One Allow lets that AI read and edit your notes.
      </p>
      <p>
        Try asking: &ldquo;Read My wishlist. Add a Review today section with items whose wait-until date has passed. Use only the prices
        and reasons already recorded. Leave my decisions unchanged and list any checks still open.&rdquo; Read the result and check
        the dates against the original entries. Check current prices yourself, then decide what to buy.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
