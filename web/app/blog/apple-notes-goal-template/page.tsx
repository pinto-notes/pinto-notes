import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-goal-template", { title: "Apple Notes goal template, with milestones and evidence" });

// Written 21 November 2026 for "apple notes goal template", topic-research-2026-11-23.md row 1 and A1.
// Google autocomplete rechecked today with client=firefox, hl=en-US, gl=us at:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple%20notes%20goal%20template
// returned "apple notes goal template" and "ways to use apple notes". The plural seed returned
// "apple notes goals template" and "apple notes meal plan template". "apple notes template g" independently
// returned "apple notes goal template", alongside gym, grid and grocery variants. These are suggestions, not volume.
// Apple support pages read today through web search, whose full-page fetches returned HTTP 429:
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button; click to tick).
// https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac (Format, Table; two rows and columns;
// convert selected paragraphs to a table; Tab in the last cell adds a row).
// https://support.apple.com/en-jo/guide/notes/apd1955d3b21/mac (Format button, Heading).
// https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios (New Note; Format, Heading; Add Table button).
// https://support.apple.com/en-is/102296 (Checklist button, Return for the next item, tap a circle to tick;
// use iCloud or device notes for these features). Tab-separated conversion follows the verified
// apple-notes-cornell-notes-template model too. No Markdown paste or automatic table calculation claim.
// Pinto sources opened in wave8: Pane/Editor/SlashCommands.swift (headings, checklists, tables);
// supabase/functions/mcp/files_tools.ts (fetch and edit tools, read before editing). BRIEF.md supplies the
// Apple Notes-like Mac/iPhone app, connected ChatGPT/Claude, version history and Mac import leaving Apple Notes
// unchanged. This is a new paste-in layout, not a shipped Pinto template. No screenshots used. The AI prompt
// below is a suggested workflow, not an exercised result or an automatic goal measurement or reminder feature.

const TEMPLATE = `Finish The last ferry

Outcome
Finish a short story draft with an ending by 18 December 2026.

Baseline
14 November: 1,800 words. Opening scene drafted; ending undecided.

Target
About 6,000 words, with every scene written and no missing sections.
A complete draft includes every scene and an ending.

Evidence
Date\tWhat changed and where to check
14 November\t1,800 words. Draft file: The last ferry, 14 Nov.
21 November\t2,700 words. Station scene added; ending outlined. Draft file: The last ferry, 21 Nov.

Milestones
29 November: reach 3,000 words and finish the middle scene
13 December: reach about 6,000 words and write the ending
18 December: read the whole draft and fill any missing sections

Next action
Write the conversation at the station before the train leaves.

Next review
29 November 2026. Compare the latest draft with the baseline.
Check whether the middle scene is finished, then choose the next action.
`;

const PROMPT = `Read my Pinto Notes goal note "Finish The last ferry".
Add this evidence under 28 November 2026: the draft has 3,200 words and the middle scene is finished. The source is my draft file "The last ferry, 28 Nov".
Mark the 29 November milestone complete based on that evidence.
Keep the original baseline, outcome and target unchanged. Keep the earlier evidence too.
Set the next review to 6 December 2026.
Suggest one next action here in the chat. Ask me if anything is unclear; do not invent progress or source links.`;

const FAQ = [
  { q: "What belongs in an Apple Notes goal template?", a: [
    "Use one outcome, a dated baseline, a target with a deadline, evidence of progress, milestones and a next review date. Add a next action so you know what to do when you reopen the note.",
  ] },
  { q: "Should I keep all my goals in one Apple Notes note?", a: [
    "Give each multiweek outcome its own note when it needs several evidence entries or milestones. That keeps a changed target and its reason beside the original baseline.",
  ] },
  { q: "Does writing a review date in my goal note create an alert?", a: [
    "No. The date in this template is text. Set a reminder separately if you need a notification, and update the next review date after each review.",
  ] },
  { q: "How is a goal note different from a habit tracker?", a: [
    "A goal note records an outcome and proof of progress toward it. A habit tracker records repeated actions. Writing every morning is a habit; finishing a complete story draft by 18 December is a goal.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-goal-template"
      intro={<>
        Copy this Apple Notes goal template into one note per outcome. It keeps your starting point and target beside dated evidence,
        milestones and the next review date.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#review", label: "Review progress" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Update it with your AI" },
        ]}>
          <p>
            Use one note for a goal that takes several weeks, with a baseline, a measurable target and evidence you can check.
            This filled example tracks a short story through to a complete draft, with milestones as checklists and evidence as a table.
          </p>
          <div id="template">
            <Keep title="Goal template for Apple Notes" text={TEMPLATE}
              note="Copy into a new note. The setup below turns the milestone lines into a checklist and the tab-separated evidence into a table." />
          </div>
          <PostCta slug="apple-notes-goal-template" position="answer" title="Want help updating your goal note?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your goal note and add the evidence you give it.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Set it up in Apple Notes</h2>
      <p>
        Use a note in iCloud or stored on your device. Apple says some Notes features aren&apos;t available with other email providers.
        The copy above is plain text, so it stays readable before you apply any formatting.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "Mac", steps: ["Format", "Table"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>
        On a Mac, paste into a new note. Click in each section label, such as Baseline or Evidence, click the Format button and choose
        Heading. Select the three lines under Milestones and click the Checklist button. Each line becomes an item you can tick.
      </p>
      <p>
        For the evidence table, select the three lines from Date through the 21 November entry and press the Table button.
        The tabs separate the date from the evidence. Or choose Format, Table for two rows and two columns, then enter the headings
        and evidence yourself. Tab in the last cell adds a row. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> has more detail.
      </p>
      <p>
        On iPhone, tap New Note and paste the text. Select each section label, tap the Format button, then Heading. For milestones,
        replace the plain lines with a list made using the Checklist button. Type each milestone and tap Return for the next one.
        To make the evidence table, tap where it belongs, tap Add Table and enter the dates and evidence in separate columns.
        Remove the plain evidence lines once they&apos;re in the table.
      </p>

      <h2>Replace the example with one outcome</h2>
      <p>
        Start with what will be different when you finish. &ldquo;Write more&rdquo; leaves the finish unclear. &ldquo;Complete a story
        draft by 18 December&rdquo; gives you something to check. The word count helps track progress, but the draft still needs an ending.
      </p>
      <p>
        Record the baseline before you start changing things. Put a date beside it and name the source, such as a draft file.
        Replace the example filenames with your own file links or names. Keep that baseline when progress improves, so each review uses
        the same starting point.
      </p>
      <p>
        Choose milestones that leave something you can inspect. Finishing a scene counts here. A writing session belongs in your
        schedule. If the deadline or target changes, add a dated sentence explaining why and keep the original target in the note.
      </p>

      <h2 id="review">Review the evidence, then choose one action</h2>
      <p>
        On 29 November, open the draft and check its word count and middle scene. Add a dated evidence row with the draft&apos;s link or
        filename. Tick the milestone only if both parts are done. If the count is 3,200 but the scene is unfinished, leave it open and
        write that down.
      </p>
      <p>
        Update Next action with the smallest useful piece of work, then set Next review to a date you can keep. Keep earlier evidence
        rows so a slow week doesn&apos;t erase the progress before it. At the deadline, check the full target, including the ending and
        missing sections, before calling the goal complete.
      </p>
      <p>
        A <a href="/blog/apple-notes-weekly-review-template">weekly review</a> can help you choose which goal needs attention next week.
        Keep the goal&apos;s baseline and evidence in this note, while the weekly review covers the rest of your week.
      </p>

      <h2 id="limits">Where a goal template in Notes stops</h2>
      <p>
        This layout records the evidence you enter. It doesn&apos;t inspect the draft, measure progress or send a notification on the
        review date. Compare each milestone with its source before you tick it.
      </p>
      <p>
        For one outcome, updating a few rows yourself may be enough. If gathering the evidence takes longer than the review, keep a
        source link in each entry and shorten what you record. A dated result is more useful here than a long account of the week.
      </p>

      <h2 id="pinto-notes">Update the same goal note with ChatGPT or Claude</h2>
      <p>
        You can use this layout in Pinto Notes, a notes app for Mac and iPhone with headings, checklists and tables.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and allow access, your AI can read and edit
        the note. Give it the result you checked and ask it to add a dated evidence entry.
      </p>
      <Keep title="Ask your AI to update the goal note" text={PROMPT}
        note="This example assumes you checked the draft yourself. Replace the result, source and dates before using it." />
      <p>
        Check the edited note against what you supplied. In this example, the new row should say 3,200 words and a finished middle scene,
        and only the 29 November milestone should be ticked. The baseline and earlier evidence should still be there. Check the next
        review date too. Pinto keeps earlier versions of the note if you need to return to one.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
