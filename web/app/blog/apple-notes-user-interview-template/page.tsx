import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";
export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-user-interview-template", { title: "Apple Notes user interview template, with quotes" });
// Written 21 November 2026 for "apple notes user interview template", research row 5 in
// topic-research-2026-11-24.md. Autocomplete rechecked at 16:12 UTC today, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=user+interview+template
// returned user interview template; user interview template ux; customer interview template;
// user interview questions; user interview guide; user interview questions ux; user interview example;
// user interview questions and answers; user interview guide template; user interview report template.
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple+notes+user+interview+template
// returned []. Generic job evidence only, no exact Apple Notes template demand or search-volume claim.
// Apple support pages read today through indexed web results; direct opens returned HTTP 429:
// https://support.apple.com/en-is/guide/notes/apd1955d3b21/mac (Format button, Heading; account restrictions).
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button; tick circles).
// https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac (Format, Table; convert selected paragraphs;
// two rows and columns; Tab in the last cell adds a row). Tab-separated conversion also follows the Cornell model.
// https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios (New Note; Format, Heading; Checklist; Add Table).
// https://support.apple.com/en-gb/102296 (iPhone checklist, Return for the next item; iCloud or device notes).
// Pinto sources opened in wave9: README.md:15-25, 62 (Mac/iPhone, Apple Notes feel, approval and AI read/edit);
// Pane/Editor/SlashCommands.swift:5-8 (headings, checklists, tables);
// supabase/functions/mcp/files_tools.ts:76-117 (fetch with line numbers, create a separate note, edit).
// BRIEF.md supplies Apple Notes-like behavior, free Mac download/iPhone app and Mac Apple Notes import
// leaving Apple Notes unchanged. All body blog links and the inbound suggestion are draft: false in lib/posts.ts.
// This is a new paste-in layout, not a shipped Pinto template. The session is fictional. The AI prompt is
// a suggested workflow, not a tested synthesis result. No screenshots, recording or transcription claims.
const TEMPLATE = `User interview, P07, booking changes

Date: 21 November 2026, 09:00
Interviewer: Mira. Note-taker: Theo.
Participant: P07, returning workshop customer. Fictional example.

Goal
Find out whether a returning customer can move a workshop booking without contacting support.

Consent
09:00: P07 agreed to written notes and anonymous quotes for the internal product review.
No audio or video recording. Confirm permission separately before any AI use.

Questions and answer notes
Q1. Tell me about the last time you changed a workshop booking.
Answer notes: Emailed the studio, waited two days, then received a new ticket.

Q2. Your Saturday pottery class clashes with work. Show me how you would move it to Sunday.
Answer notes: Opened Classes, then Account. Looked for a booking link, then opened Help. Stopped without changing the booking.

Q3. What did you expect to find when you opened Account?
Answer notes: A list of tickets with a change-date option beside each booking.

Evidence log
ID and time\tWhat was observed or said
E1, 09:06\tQ1, quote: "I emailed because I couldn't find a way to change it."
E2, 09:13\tQ2, observation: Opened Classes, Account, then Help. Did not complete the date change.
E3, 09:15\tQ3, quote: "I expect this next to my ticket."

Interpretation, to check
P07 may expect booking changes beside a ticket in Account. Based on E2 and E3.
This session does not establish whether other customers expect the same route.

Follow-up questions
Would P07 notice a My bookings link in Account? Test with a new task later.
Was the change-date option available for this booking? Check the test setup.

Follow-ups
Theo: check the test booking's change rules by 23 November
Mira: add a My bookings task to the next session guide by 24 November
`;
const PROMPT = `Read my Pinto Notes note "User interview, P07, booking changes".
Create a separate note titled "Findings draft, P07, booking changes". Leave the source note unchanged.
Use only that interview. Separate reported experience, observed actions, exact quotes and possible interpretations.
For each finding, cite participant P07, the evidence ID and the source line numbers returned when you read the note.
Preserve quoted words exactly. Do not turn answer notes into quotes.
List unanswered questions and proposed follow-ups separately. Do not invent answers or generalize to other participants.
If a finding has no source evidence, leave it out. Label the new note as a draft for me to check.`;
const FAQ = [
  { q: "What should an Apple Notes user interview template include?", a: [
    "Include the research goal, participant ID, consent record, questions with answer notes, an evidence log and follow-ups. Keep exact quotes and observed actions separate from your interpretation. Use one note per participant session.",
  ] },
  { q: "How do I label quotes in an Apple Notes interview worksheet?", a: [
    "Give each quote an evidence ID and a time, and copy the participant's words exactly. Put paraphrases under Answer notes. If you did not capture the wording exactly, keep it as a paraphrase without quotation marks.",
  ] },
  { q: "Does this interview template need an audio recording?", a: [
    "No. The filled example uses written notes. Record what the participant agreed to before starting. A consent line records that agreement; copying the example does not obtain consent for your own session or for sharing it with an AI.",
  ] },
];
export default function Page() {
  return (
    <PostPage
      slug="apple-notes-user-interview-template"
      intro={<>
        Copy this Apple Notes user interview template into one note per session. It keeps each answer beside a separate record of
        exact quotes, observed actions and follow-up questions.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the worksheet" },
          { href: "#set-up", label: "Set it up" },
          { href: "#during", label: "During the interview" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Draft findings with AI" },
        ]}>
          <p>
            Use a goal and consent line at the top, questions with space for answers, then an evidence log and follow-ups.
            The filled example below follows one customer trying to change a pottery-class booking. Replace the example details before your session.
          </p>
          <div id="template">
            <Keep title="User interview worksheet for Apple Notes" text={TEMPLATE}
              note="Copy the plain text into a new note. The setup below turns the evidence log into a table and follow-ups into a checklist." />
          </div>
          <PostCta slug="apple-notes-user-interview-template" position="answer" title="Want help drafting findings from your notes?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read an interview note and create a separate findings draft for you to check.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Set it up on Mac or iPhone</h2>
      <p>
        Use an iCloud note or one stored on your device. Some Notes features aren&apos;t available with other account providers.
        Keep the question and answer sections as ordinary text, so you have room to type during the conversation.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "Mac", steps: ["Format", "Table"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>
        On a Mac, paste the worksheet into a new note. Click in a section label, such as Goal, then click the Format button and choose
        Heading. Select the two task lines under Follow-ups and click the Checklist button. Click a circle when its task is done.
        These controls follow Apple&apos;s <a href="https://support.apple.com/en-is/guide/notes/apd1955d3b21/mac">formatting guide</a> and{" "}
        <a href="https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac">checklist guide</a>.
      </p>
      <p>
        Select the four lines from ID and time through E3, then click the Table button. The tabs separate the two columns.
        Or choose Format, Table to start with two rows and two columns, then enter the log yourself. Press Tab in the last cell to add
        a row. Apple documents both routes in its <a href="https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac">table guide</a>.
        Our <a href="/blog/apple-notes-tables">Apple Notes tables guide</a> covers more table controls.
      </p>
      <p>
        On iPhone, tap New Note and paste the worksheet. Select a section label, tap Format, then Heading.
        For the log, tap where it belongs, tap Add Table and enter the same two columns. Remove the plain log after checking the table.
        For follow-ups, tap Checklist, type a task and tap Return for the next one. Apple&apos;s{" "}
        <a href="https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios">iPhone formatting guide</a> and{" "}
        <a href="https://support.apple.com/en-gb/102296">checklist instructions</a> describe these buttons.
      </p>
      <h2 id="during">Take notes against each question</h2>
      <p>
        Before the session, replace the goal with the question you need to answer. Clear the example answers, evidence and interpretation.
        Keep the question labels, and give the participant an ID. Replace the consent line with what they actually agree to, including
        how you plan to use the notes and quotes. Ask before you begin taking notes.
      </p>
      <p>
        During the interview, write short answer notes under the question you asked. Capture an exact phrase in the evidence log only
        when you have its wording. If you miss a sentence, record its meaning as answer notes without quotation marks.
        Add times yourself; the times in this worksheet are typed text.
      </p>
      <p>
        When the participant tries a task, record what you can see. In E2, P07 opened Classes, Account and Help, then stopped.
        &ldquo;P07 was confused&rdquo; would be an interpretation. Keep that judgment in the interpretation section, with the evidence
        that led you to it. Ask what they expected after the task rather than suggesting where to click.
      </p>
      <h2>Review the session before writing findings</h2>
      <p>
        Read the answer notes and evidence together while the conversation is still recent. Leave missing details marked as unknown.
        The example&apos;s interpretation points to E2 and E3. It suggests a placement to test, but does not show that a My bookings
        link would solve the problem. The booking&apos;s change rules still need checking.
      </p>
      <p>
        Give each follow-up an owner and a date, then tick it only when it is done. Before the next interview, copy a cleared worksheet
        into a new note and change the participant ID. The <a href="/blog/apple-notes-templates">Apple Notes templates guide</a> has more
        layouts to reuse. Keep the completed interview as the source for any later findings.
      </p>
      <h2 id="limits">Where it stops</h2>
      <p>
        This worksheet holds the evidence you type. It does not capture missing quotes, check consent or decide whether an interpretation
        is supported. One person&apos;s session gives you evidence about that session. Compare other interviews before describing a
        repeated pattern, and retain the participant IDs behind it.
      </p>
      <h2 id="pinto-notes">Draft findings in a separate Pinto note</h2>
      <p>
        You can keep this layout in Pinto Notes, a notes app for Mac and iPhone with headings, checklists and tables.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and choose Allow, it can read and edit your
        notes. Use the fictional example to try the prompt below. For a real session, first confirm that the participant agreement and
        your organization&apos;s policy permit sharing those notes with your AI.
      </p>
      <Keep title="Ask for an interview findings draft" text={PROMPT}
        note="Save the fictional worksheet in Pinto Notes first. For your own interview, replace both note titles and the participant ID." />
      <p>
        Check every claim against its cited source lines. P07&apos;s earlier email is reported experience from Q1. The sequence of taps
        is an observation in E2. The ticket placement is an expectation quoted in E3. Keep those distinctions, verify every quote, and
        remove claims that the source does not support. The AI can misquote or infer too much, so review the draft before using it.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
