import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-lesson-plan-template", { title: "Apple Notes lesson plan template for one teaching session" });

// Written 21 November 2026 for "apple notes lesson plan template", topic-research-2026-11-24.md row 8, A8 and B8.
// Google autocomplete rechecked today with client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=lesson+plan+template
// returned "lesson plan template", "lesson plan template google docs", "lesson plan template free", "lesson plan template for preschool",
// "lesson plan template free download", "lesson plan template pdf", "lesson plan template word", "lesson plan template word free download",
// "lesson plan template free download pdf", "lesson plan template high school". The exact Apple Notes head at
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple+notes+lesson+plan+template
// returned []. This is generic lesson-plan evidence, not exact Apple Notes demand or search volume.
// Apple support read today via web search; guide-page opens returned HTTP 429, while 102296 opened fully:
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button, click a circle).
// https://support.apple.com/en-ie/guide/notes/apd1955d3b21/mac (select heading text, Format button, Heading; iCloud or Mac notes).
// https://support.apple.com/en-ca/guide/notes/apd0a136b9cc/4.13/mac/26 (Format, Table; two rows and columns; convert selected
// paragraphs with Table button; Tab in last cell adds row). https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios
// (New Note; select text, Format button, Heading; Add Table button). https://support.apple.com/en-us/102296 (Checklist button,
// Return for next item, tap circle; iCloud or device notes). Tab conversion also follows apple-notes-cornell-notes-template.
// Pinto sources opened in this worktree: Pane/Editor/SlashCommands.swift (headings, checklists, tables);
// supabase/functions/mcp/files_tools.ts (fetch, create and edit, requiring a read before editing).
// BRIEF.md supplies the Apple Notes-like Mac/iPhone app, connected ChatGPT/Claude read/edit access, version history,
// and Apple Notes import on Mac leaving Apple Notes unchanged. README.md confirms platforms and approved AI access.
// New paste-in layout, not a shipped Pinto template. Fictional lesson and observations; AI workflow suggested,
// not exercised. No claim of curriculum alignment, automatic assessment or subject-matter correctness from AI.
// Pictures: none. Body blog links checked against lib/posts.ts; all have draft: false.
// Registration description: Copy an Apple Notes lesson plan template with an objective, materials checklist,
// timed activities and an exit question. Includes a filled tutoring example.

const TEMPLATE = `Comparing fractions, 20 November 2026
40-minute maths tutoring session. Example learner: age 10.

Objective
Compare two fractions with different denominators and explain the answer using equal-sized wholes.

Prior knowledge check
Ask: Which is larger, 1/4 or 3/4? Draw both using equal-sized rectangles.
If quarters are unclear, use the session to practise equal parts first.

Materials
Paper fraction strips cut from equal-sized sheets
Pencil and squared paper
Four comparison questions, with answers checked before the lesson

Timed steps
Minutes\tActivity
0 to 5\tCheck prior knowledge with quarters and ask the learner to explain.
5 to 12\tCompare 1/2 and 2/3 with fraction strips. Keep the wholes the same size.
12 to 20\tModel the same comparison on paper using sixths, then solve one together.
20 to 30\tLearner compares 1/3 with 1/2, 2/5 with 3/5, 3/5 with 2/3, and 3/4 with 5/6. Ask for a drawing or equivalent fractions.
30 to 36\tDiscuss one answer. If stuck, return to strips and try fewer questions.
36 to 40\tAsk the exit question without help and record the explanation.

Worked example
Which is larger, 1/2 or 2/3?
1/2 = 3/6 and 2/3 = 4/6, so 2/3 is larger.
The sixths must refer to the same-sized whole.
Practice answer key, larger fraction in each pair: 1/2, 3/5, 2/3, 5/6.

Check for understanding
Exit question: Which is larger, 2/3 or 3/4? Explain without the strips.
Teacher answer: 2/3 = 8/12 and 3/4 = 9/12, so 3/4 is larger.
Listen for an explanation about equal-sized parts, rather than the larger denominator.

After the lesson
20 November: compared halves and thirds using strips without help.
On paper, chose 3/4 in the exit question but could not explain why.
Next session: start with drawing both fractions as twelfths before new comparisons.
`;

const PROMPT = `Read my Pinto Notes lesson plan "Comparing fractions, 20 November 2026".
Use its After the lesson observations to draft a separate 40-minute plan for 27 November.
Keep the original lesson and observations unchanged.
Start with drawing 2/3 and 3/4 as twelfths of equal-sized rectangles.
Include an objective, materials, timed steps, a worked example and an exit question with a teacher answer.
Keep the total at 40 minutes. Do not invent learner results or claim curriculum alignment.
Show me the draft in chat first. Ask about missing information before saving a new note.`;

const FAQ = [
  { q: "What should a lesson plan in Apple Notes include?", a: [
    "Keep the objective, a prior knowledge check, materials, timed activities, a worked example and an exit question in one note. Add observations after teaching so the next plan starts from what you saw.",
  ] },
  { q: "Can I turn my lesson materials into tick boxes in Apple Notes?", a: [
    "On a Mac, select the materials lines and click the Checklist button. On iPhone, tap the Checklist button where the list belongs, enter each material and tap Return for the next item. Tick each circle as you prepare it.",
  ] },
  { q: "How can I reuse this Notes lesson plan for another class?", a: [
    "Copy the layout into a new note and change the date, objective and examples. Clear the previous observations from the new copy, but keep the original note as your record of that lesson.",
  ] },
  { q: "Will the timed steps in this lesson template start a timer?", a: [
    "No. The minute ranges are text in a table. Use a separate clock or timer, and adjust the activities yourself if the opening check shows that the learner needs more practice.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-lesson-plan-template"
      intro={<>
        Copy this Apple Notes lesson plan template for one teaching session. It puts the objective above a materials checklist and
        timed steps, with an exit question and space for notes after the lesson.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#teach", label: "Use it during a lesson" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Draft the next lesson" },
        ]}>
          <p>
            Use one note per lesson, with a clear objective and an activity for each part of the time available.
            This filled example plans a 40-minute fractions session for a tutor, then records what needs more practice.
            Copy it below and replace the topic and examples with your own.
          </p>
          <div id="template">
            <Keep title="Lesson plan for Apple Notes" text={TEMPLATE}
              note="Paste into a new note. The setup below turns Materials into a checklist and Timed steps into a two-column table." />
          </div>
          <PostCta slug="apple-notes-lesson-plan-template" position="answer" title="Draft the next lesson from your observations">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your lesson notes and help draft the next plan for you to check.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Set it up in Apple Notes</h2>
      <p>
        Use a note in iCloud or stored on your device. Apple says many Notes features won&apos;t work with other email providers.
        The template is plain text, so you can read it before you format it.
      </p>
      <MenuPaths rows={[
        { on: "Mac, headings", steps: ["Select text", "Format button", "Heading"] },
        { on: "Mac, table", steps: ["Format", "Table"] },
        { on: "iPhone, headings", steps: ["Select text", "Format button", "Heading"] },
      ]} />
      <p>
        On a Mac, paste into a new note. Select each section label, such as Objective, click the Format button and choose Heading.
        Select the three lines under Materials and click the Checklist button. Click each circle when that material is ready.
      </p>
      <p>
        For the schedule, select the seven lines from Minutes through the 36 to 40 entry, and press the Table button.
        Every tab becomes a column, so you get Minutes and Activity side by side. Or choose Format, Table for two rows and two
        columns, then type the schedule into the cells. Tab in the last cell adds a row.{" "}
        <a href="/blog/apple-notes-tables"> Tables in Apple Notes</a> explains the controls.
      </p>
      <p>
        On iPhone, tap New Note and paste the text. Select a section label, tap the Format button, then Heading.
        For Materials, tap the Checklist button on a new line and enter each item, with Return between items. Remove the plain
        materials lines afterward. For Timed steps, tap Add Table where the schedule belongs, enter the minutes and activities in
        separate columns, then remove the plain schedule lines.
      </p>
      <p>
        These controls come from Apple&apos;s <a href="https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac" rel="noopener">Mac lists guide</a> and{" "}
        <a href="https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios" rel="noopener"> iPhone formatting guide</a>.
        For other layouts you can reuse, see <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="teach">Use the plan during the lesson</h2>
      <p>Replace the objective with something the learner can demonstrate. Here, they need to explain the comparison as well as
        choose the larger fraction. Check your worked example and practice answers before teaching.</p>
      <p>
        Use the opening five minutes to decide whether the plan fits. If the learner cannot draw quarters as equal parts, spend
        longer there and reduce the comparison questions. The minute ranges guide your choices; you can change them during the lesson.
      </p>
      <p>
        Keep the teacher answer below the exit question so you can check an explanation. Ask the question without giving that answer
        first. If you share your screen with the learner, keep the teacher answer out of view.
      </p>
      <p>
        Afterward, record what the learner did and how much help they needed. &ldquo;Chose 3/4 but could not explain why&rdquo; gives
        you a starting point for next time. Keep those observations in the original lesson note and copy the layout into a new note
        for the next session. For a learner&apos;s own class notes, the <a href="/blog/apple-notes-cornell-notes-template">Cornell notes template</a> has a separate question-and-answer layout.
      </p>

      <h2 id="limits">Where a lesson plan in Notes stops</h2>
      <p>
        This note holds the plan and the observations you enter. Its table does not run the lesson or measure understanding.
        You still choose the activities, check the subject content and decide what to change after hearing the learner&apos;s answer.
      </p>
      <p>If your school requires a particular lesson-plan form, use that form for submission. This example is a tutor&apos;s working note.</p>

      <h2 id="pinto-notes">Draft the next lesson with ChatGPT or Claude</h2>
      <p>
        You can use the same layout in Pinto Notes, with headings, checklists and tables. Once you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes"> connect ChatGPT or Claude</a> and choose Allow, your AI can read and edit your notes.
        Ask it to use your observations to propose a new plan.
      </p>
      <Keep title="Ask your AI for the next lesson plan" text={PROMPT}
        note="Replace the note title, date and starting activity with your own. This prompt uses the filled example above." />
      <p>
        Check the draft before saving it. Add up the activity times and work through every fraction example and answer yourself.
        Confirm that it starts with the explanation the learner struggled with. Remove any invented observations, and only then ask
        your AI to save it as a new note. Pinto keeps earlier versions of notes if you need to return to one after an edit.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
