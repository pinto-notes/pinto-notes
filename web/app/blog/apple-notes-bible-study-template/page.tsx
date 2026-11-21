import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-bible-study-template", {
  title: "Apple Notes Bible study template, with a filled example",
});

// Written 21 November 2026 for "apple notes bible study template", topic-research-2026-11-24.md row 1, A1/B1/C1.
// Read BRIEF.md, BRIEF-compare.md and BRIEF-wave9.md. Autocomplete rechecked directly at 16:12 UTC today:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple%20notes%20bible%20study%20template
// returned []. With q=apple%20notes%20bible%20study it returned "apple notes bible study" plus four generic suggestions.
// With q=bible%20study%20template it returned "bible study template", "bible study templates free", format variants
// and study-method questions. Related and generic evidence, not exact-template demand or search volume.
// Apple support pages read today through indexed full-page search results after direct opens returned 429:
// https://support.apple.com/guide/notes/format-notes-apd1955d3b21/mac (Format, Heading; iCloud or Mac notes).
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button).
// https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac (Table button or Format, Table; paragraph
// conversion; empty table has two columns and rows; Tab in the last cell adds a row).
// Tab-separated column conversion also follows apple-notes-cornell-notes-template's verified model.
// https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios (New Note; Format, Heading; Add Table).
// https://support.apple.com/en-la/102296 (Checklist button, Return, circle to tick; iCloud or device notes).
// https://support.apple.com/en-euro/guide/notes/not9474646a9/mac (Edit, Paste; File, Duplicate Note).
// Scripture read today: https://ebible.org/engwebu/JAS01.htm (World English Bible Updated, excerpt/observations);
// https://ebible.org/eng-web/LUK06.htm and https://ebible.org/engwebu/PRO15.htm (cross references).
// Personal application and prayer are fictional editorial examples. Pinto sources opened in wave9:
// Pane/Editor/SlashCommands.swift (headings/checklists/tables); supabase/functions/mcp/files_tools.ts
// (search/fetch/edit). BRIEF.md supplies Apple Notes feel on Mac/iPhone, connected ChatGPT/Claude read/edit,
// and Mac import leaving Apple Notes unchanged. README.md confirms platforms, AI access and editor.
// connect-chatgpt-to-your-notes verifies Allow grants reading and editing. No shipped template or tested AI result.
// No screenshots used. All four body blog links and the proposed inbound source are live in lib/posts.ts.

const TEMPLATE = `Bible study: James 1:19-25, 21 November 2026

Passage
James 1:19-25
Translation: World English Bible Updated
Excerpt, James 1:22: "But be doers of the word, and not only hearers, deluding your own selves."

Observations
Verse 19 puts listening before speaking and warns about anger.
Verses 23-24 compare a forgetful hearer with someone who looks in a mirror and then forgets what they saw.

Questions
How does the mirror example connect hearing with action?
What does "continues" refer to in verse 25?

Cross references
Reference\tConnection to examine
Luke 6:46-49\tCompare hearing and doing with James 1:22.
Proverbs 15:1\tCompare speech and anger with James 1:19.

Application
At dinner tonight, let Sam finish speaking before answering.
Tomorrow, record one moment when I listened or interrupted.

Prayer
God, help me listen with patience and put what I learn into practice. Amen.
`;

const PROMPT = `Read my Pinto Notes study note "Bible study: James 1:19-25, 21 November 2026".
Search my other Bible study notes for earlier questions about listening, speaking or hearing and doing.
In the chat, quote any matching questions exactly and give the source note's title and date.
If you find no matching question, say so. Do not invent earlier notes or answers.
Leave my notes unchanged while I review the matches.
After I choose a question, add only that question and its source under Questions in the James note.
Keep the Bible excerpt, observations, application and prayer unchanged.
If you suggest an interpretation, label it "Suggested interpretation to check" in the chat. Keep it separate from the quoted passage.`;

const FAQ = [
  { q: "What should an Apple Notes Bible study template include?", a: [
    "Record the passage reference and translation, then separate observations, questions, cross references, application and prayer. Put any Bible excerpt in its own labeled section so you can distinguish it from your own words.",
  ] },
  { q: "Can I keep Bible cross references in an Apple Notes table?", a: [
    "Yes. Use two columns, one for the reference and one for the connection you want to examine. On Mac, choose Format, Table. On iPhone, tap Add Table. Read each referenced passage in context before adding a conclusion.",
  ] },
  { q: "Should a Bible study checklist track reading or application?", a: [
    "Use it for concrete actions you want to remember, such as rereading a passage or following up on a question. A tick records that you did the action. It does not measure your understanding or faith.",
  ] },
  { q: "Can I reuse this Bible study layout for another passage?", a: [
    "Yes. On Mac, select the note and choose File, Duplicate Note. Change the passage and date, then replace the excerpt and your study notes. Keep the previous study as its own record.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-bible-study-template"
      intro={<>
        Copy this Apple Notes Bible study template into one note per passage. It has space for observations, questions,
        cross references, application and prayer, with a filled example from James 1:19-25.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#study", label: "Use it for a passage" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Find earlier questions" },
        ]}>
          <p>
            Use one note per study, with the passage reference and translation above your own notes.
            The filled layout below works as plain text; turn the cross references into a table and the application lines
            into a checklist using Apple Notes&apos; own controls.
          </p>
          <div id="template">
            <Keep title="Bible study template for Apple Notes" text={TEMPLATE}
              note="Copy into a new note, then replace the example with your passage and your own responses. Formatting steps follow below." />
          </div>
          <PostCta slug="apple-notes-bible-study-template" position="answer" title="Want to find questions from earlier studies?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can search your study notes and read earlier questions when you ask.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Set it up in Apple Notes</h2>
      <p>
        Use a note in iCloud or stored on your device. Apple says some Notes features aren&apos;t available with other email providers.
        This layout uses plain text, so you can read it before adding headings or a table.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "Mac", steps: ["Format", "Table"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>
        On Mac, paste into a new note with Edit, Paste. Click in each section label, such as Observations, click the Format button
        and choose Heading. Select the two lines under Application and click the Checklist button.
      </p>
      <p>
        Select the three lines under Cross references, from Reference through Proverbs 15:1, and press the Table button.
        Each line has a tab between its columns. Or choose Format, Table for an empty two-column table and enter the references
        and connections yourself. Tab in the last cell adds a row. See <a href="/blog/apple-notes-tables">tables in Apple Notes</a>
        {" "}for more table options.
      </p>
      <p>
        On iPhone, tap New Note and paste the layout. Select each section label, tap the Format button, then Heading.
        For Application, tap where the checklist should start, tap the Checklist button and enter each action, pressing Return
        for the next item. Remove the original plain application lines once you have the checklist.
      </p>
      <p>
        For the cross references on iPhone, tap where the table belongs, tap Add Table and enter the reference and connection
        in separate columns. Remove the plain reference lines after copying them into the table. These controls are documented
        in Apple&apos;s <a href="https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios">iPhone Notes guide</a>.
      </p>

      <h2 id="study">Use the layout for your next passage</h2>
      <p>
        Start by replacing the passage reference and naming your translation. Add a short excerpt from the Bible you are reading,
        with its verse number. The example quotes <a href="https://ebible.org/engwebu/JAS01.htm">James 1:22 in the World English Bible Updated</a>.
        Keep copied wording labeled as an excerpt, and write your observations underneath.
      </p>
      <p>
        Read the whole passage before adding observations. Note something you can point to in the text, such as a repeated word
        or the mirror comparison in this example. Put unresolved questions under Questions. If you add an interpretation,
        label it as your reading and record which verse led you there.
      </p>
      <p>
        In the cross-reference table, write why you want to compare each passage. Read the surrounding verses too.
        If you consult a commentary, record its title and page or link beside the idea you took from it.
        That lets you return to the source when you revisit a question.
      </p>
      <p>
        Choose an application you can describe in your own words. The dinner example is one reader&apos;s response.
        Replace it with yours and write your own prayer. Tap or click the checklist circle after doing an action,
        then add a dated sentence about what happened or what you still want to consider.
      </p>
      <p>
        On Mac, select the note and choose File, Duplicate Note for the next study. Change the title and date, and clear the old
        responses before writing new ones. On iPhone, copy this layout into a new note again.
        The <a href="/blog/apple-notes-templates">Apple Notes templates guide</a> has other layouts you can reuse this way.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        This is a study record you fill in yourself. It does not look up verses or verify a quotation against your translation.
        A reference in a table still needs to be read in your Bible. Keep questions open when you need more context.
      </p>
      <h2 id="pinto-notes">Find earlier study questions with ChatGPT or Claude</h2>
      <p>
        You can use this layout in Pinto Notes, a notes app for Mac and iPhone with headings, checklists and tables.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and choose Allow,
        that AI can read and edit your notes. Ask it to find questions you have already written about the passage or topic.
      </p>
      <Keep title="Ask your AI to find earlier questions" text={PROMPT}
        note="Use after connecting Pinto Notes. Replace the note title and topic. This suggested request needs earlier study notes to find matches." />
      <p>
        Check each match against its source note, including the date and exact wording. If there are no earlier questions,
        there may be nothing to add. After you choose a question, check that the edit preserves the Bible excerpt and your
        personal responses. Read any suggested interpretation against the passage yourself before keeping it.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
