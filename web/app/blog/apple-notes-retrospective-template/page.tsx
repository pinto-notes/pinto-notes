import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-retrospective-template", { title: "Apple Notes retrospective template, with owners" });

// Written 21 November 2026 for "apple notes retrospective template", topic-research-2026-11-24.md row 9.
// Google autocomplete rechecked today at 16:12 UTC, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple+notes+retrospective+template
// returned []. The generic seed at the same endpoint, q=retrospective+template, returned:
// retrospective template; retrospective template agile; retrospective template miro; retrospective template excel;
// retrospective template ideas; retrospective template excel free download; retrospective template confluence;
// retrospective template ppt; retrospective template word; retrospective template figma. Generic job evidence only.
// Apple support read today, including search text when full-page fetches returned HTTP 429:
// https://support.apple.com/en-jo/guide/notes/apd1955d3b21/mac (Format button, Heading; iCloud or local notes).
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button, click circles).
// https://support.apple.com/en-ae/guide/notes/apd0a136b9cc/mac (Format, Table; convert paragraphs; two rows/columns; Tab adds a row).
// Tab-separated conversion follows the verified apple-notes-cornell-notes-template model.
// https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios (New Note; Format button, Heading; Add Table).
// https://support.apple.com/en-gb/102296 (Checklist button, Return for next item, tap circle; account requirements).
// Pinto sources opened in wave9: README.md:15-24, 62-73 (Mac/iPhone, Apple Notes feel, approved AI read/edit);
// Pane/Editor/SlashCommands.swift:5-32 (headings, checklists, tables); supabase/functions/mcp/files_tools.ts:46-113 (fetch/create/edit).
// BRIEF.md and move-apple-notes-to-obsidian-notion-keep's import header: Mac import leaves Apple Notes unchanged;
// confirmed in Pane/Views/AppleNotesImport.swift:177. connect-chatgpt-to-your-notes header: one Allow grants read and edit.
// New editorial layout, not a shipped Pinto template. Fictional example; AI workflow not exercised. No pictures.

const TEMPLATE = `November help-page update retrospective

Project dates: 9 to 20 November 2026
Review date: 23 November 2026
People: Sara, writer; Jonas, designer

Expected and observed results
Plan\tResult and source
Publish 8 revised help pages by 20 November\t8 pages live on 20 November. Source: Help-page launch checklist.
One review per page\t3 of 8 pages needed a second review. Source: Help-page review log.

What went well
Sara tested each set of instructions before sending the draft to Jonas.
The launch checklist named a person to check every published page.

What didn't go well
Two screenshots still showed the old navigation at the first review.
The account-settings page changed scope after Sara had written it.

Causes still uncertain
We think agreeing outlines earlier might reduce second reviews.
The review log does not say why each page needed another review.

What to repeat
Test the instructions before review and keep a named launch checker.

Next experiment
Agree page outlines before drafting the December update.
Owner: Jonas
Baseline: 3 of 8 pages needed a second review in November.
Check: no more than 1 of 6 December pages needs a second review.
Review date: 7 December 2026

Actions
Jonas: agree all six outlines with Sara by 25 November 2026.
Sara: record second-review counts and reasons by 4 December 2026.

Review result
Pending. On 7 December, compare the review log with the check above.
`;

const PROMPT = `Read my Pinto Notes note "November help-page update retrospective".
Suggest one alternative experiment based on What didn't go well.
Separate the observations from possible causes. Do not claim the note proves a cause.
Show the proposed change and a way to check its result here in the chat.
Ask me for an owner and review date if I choose it. Do not invent either.
After I choose the experiment and supply those details, replace Next experiment and Actions in the note.
Keep the original results, observations and baseline unchanged.`;

const FAQ = [
  { q: "What should an Apple Notes retrospective template include?", a: [
    "Name the finished project and dates, compare the expected and observed results, then record what went well and what didn't. Finish with an experiment, actions with owners, and a review date. Keep possible causes separate from observations.",
  ] },
  { q: "Can I use a retrospective template for a solo project?", a: [
    "Yes. Put your own name on the actions and review one finished piece of work. For example, compare a newsletter launch with its original plan and choose one change to test on the next issue.",
  ] },
  { q: "How many actions should a small-team retrospective produce?", a: [
    "Start with one change you can test on the next project. Give each action needed for that change an owner and date. Record other suggestions separately if you have not agreed to do them.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-retrospective-template"
      intro={<>
        Copy this Apple Notes retrospective template for one finished project or sprint. Record what went well, what didn&apos;t,
        and the actions each person will take before the next review.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#review", label: "Run the review" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Use it with your AI" },
        ]}>
          <p>
            Use a results table for the plan and what happened, plain sections for observations, and a checklist for agreed actions.
            This filled example ends with one change to test on the next project, with an owner and a date to check the result.
          </p>
          <div id="template">
            <Keep title="Retrospective template for Apple Notes" text={TEMPLATE}
              note="Copy into a new note. The steps below turn the results into a table and the two action lines into a checklist." />
          </div>
          <PostCta slug="apple-notes-retrospective-template" position="answer" title="Want help drafting the next experiment?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your retrospective and save the changes you agree on.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Set it up in Apple Notes</h2>
      <p>
        Use a note in iCloud or saved on your device. Apple says some Notes features aren&apos;t available with other email providers.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "Mac", steps: ["Format", "Table"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>
        On a Mac, paste into a new note. Select each section label, click the Format button and choose Heading.
        Select the three lines from Plan through One review per page and press the Table button. Each tab becomes a column.
        Or choose Format, Table for two rows and two columns and enter the results yourself. Tab in the last cell adds a row.
        See <a href="/blog/apple-notes-tables">tables in Apple Notes</a> for more detail.
      </p>
      <p>
        Select the two lines under Actions and click the Checklist button. Click a circle when the action is complete.
      </p>
      <p>
        On iPhone, tap New Note and paste. Select a section label, tap the Format button, then Heading.
        Tap where the results belong, tap Add Table, and enter the plan and result in separate columns. Remove the plain results
        after copying them. For Actions, replace the two plain lines with a list made using the Checklist button.
        Type the first action and tap Return for the second. Tap a circle to mark it complete.
      </p>
      <h2 id="review">Run the review around one finished project</h2>
      <p>
        Before discussing causes, compare the result with the original plan. In this example, all eight pages went live on time,
        but three needed another review. Both facts belong in the record. Replace the source names with the notes or documents
        where you checked those results. The <a href="/blog/apple-notes-templates">Apple Notes templates guide</a> covers reusing a base note.
      </p>
      <p>
        For a small team, give everyone a few minutes to write observations before discussing them. Name a specific event,
        such as the two outdated screenshots, rather than describing someone as careless. If you worked alone, use the same
        sections and put your own name on the actions.
      </p>
      <p>
        Keep uncertain causes under their own heading. The late scope change might explain extra review work, but this record
        does not establish that. Sara&apos;s next action adds reasons to the review log so the next discussion has more evidence.
        Use <a href="/blog/apple-notes-meeting-notes-template">meeting notes</a> for the ongoing project discussions.
      </p>

      <h2>Choose one change and check it next time</h2>
      <p>
        The experiment here is agreeing outlines before drafting. Jonas owns that change, while Sara records whether pages need
        another review. Ask each owner to agree before adding their name and date.
      </p>
      <p>
        On 7 December, fill in Review result from the log. Record the count and what happened, even if the change did not help.
        If fewer pages need another review, that is evidence to discuss; a different batch of pages does not prove why it improved.
        Decide whether to keep the change or try something else on the next project.
      </p>

      <h2 id="limits">Where a retrospective in Notes stops</h2>
      <p>
        The owner names and review dates in this layout are text. They do not assign work or create notifications.
        Put the review in your calendar separately if you need an alert, and check the action list when you meet again.
      </p>
      <p>
        This written record does not provide anonymous voting or establish the cause of a delay. Leave unresolved explanations visible.
      </p>

      <h2 id="pinto-notes">Draft an experiment with ChatGPT or Claude</h2>
      <p>
        You can use this layout in Pinto Notes, a notes app for Mac and iPhone with headings, checklists and tables.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes"> Connect ChatGPT or Claude</a> and choose Allow in Pinto Notes.
        That grants reading and editing access. Then ask your AI to read the retrospective and propose a change to test.
      </p>
      <Keep title="Ask your AI for another experiment" text={PROMPT}
        note="Use your own note title. This is a suggested prompt; check the proposal against the observations before choosing it." />
      <p>
        Check that the suggestion addresses something recorded in the note and treats possible causes as uncertain.
        After saving your chosen change, reopen the note and check its owner and review date. The original results and baseline
        should still be there. Your AI can help write the experiment; you still need to run it and check what happens.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
