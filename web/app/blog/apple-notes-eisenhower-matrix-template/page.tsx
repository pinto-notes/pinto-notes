import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-eisenhower-matrix-template", {
  title: "Apple Notes Eisenhower matrix template: four checklists",
});

// Written 21 November 2026 for "eisenhower matrix template apple notes". Research:
// blog-growth/topic-research-2026-11-23.md, row 4. Its result-page notes describe generic PDFs,
// eink.fyi and Eisenhower Notes; this post supplies a filled Apple Notes layout instead.
// Google autocomplete rechecked 21 November 2026, en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple%20notes%20eisenhower%20matrix%20template
// Returned "eisenhower matrix template apple notes", "history of the eisenhower matrix",
// "eisenhower matrix example", "what is the eisenhower matrix". Research also recorded the
// shorter variant "apple notes eisenhower matrix". Suggestions are not search-volume evidence.
// Apple Support read today: https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac
// (select paragraphs, Checklist button, mark complete); https://support.apple.com/en-jo/guide/notes/apd1955d3b21/mac
// (select heading text, Format button, Heading; iCloud or local notes for paragraph styles);
// https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios (New Note, Format, Heading, Checklist);
// https://support.apple.com/en-us/102296 (Checklist button, Return adds an item, tap circle to complete);
// https://support.apple.com/en-qa/guide/notes/not9474646a9/mac (File, Duplicate Note).
// Native formatting steps below use plain text, with no Markdown paste or table conversion claim.
// Pinto sources opened today: Pane/Editor/SlashCommands.swift (headings and checklists),
// supabase/functions/mcp/files_tools.ts, fetch/edit/write definitions (read and edit a note), and
// BRIEF.md's Pinto facts (Apple Notes-like app for iPhone and Mac, connected ChatGPT or Claude,
// every earlier version kept, Mac Apple Notes import leaves Apple Notes unchanged).
// No shipped matrix template, quadrant board, calendar integration or task delegation is claimed.
// Pictures: none. All four internal destinations are registered with draft: false in lib/posts.ts.

const TEMPLATE = `Cafe booking launch, week of 23 November

Outcome: launch the new booking page on 27 November.
Review: 24 November, 09:00.

Do: urgent and important
Fix the mobile booking form before today's test bookings. The submit button does not work.
Send the test link to the cafe owner by 17:00 on 23 November. Feedback is due tomorrow.

Schedule: important, not urgent
Test confirmation emails on 25 November at 10:00, before launch.
Write the handover guide on 26 November at 14:00, so the owner can update opening hours.

Delegate or reduce: urgent, not important to the outcome
Ask Jonas to resize the banner image by 24 November. Confirm he can take it.
Reply to the optional launch-call invitation by 16:00 today. Ask for a written update instead.

Drop: neither urgent nor important
Skip browsing new website themes. The current design is approved.
Leave the internal folder icons as they are. They do not affect the booking page.
`;

const PROMPT = `Read my note "Cafe booking launch, week of 23 November". Suggest changes to its four Eisenhower lists in this chat first. Judge importance against the stated outcome and urgency against the deadlines and consequences written in the note. Explain each proposed move. Ask me about missing information instead of inventing deadlines or assuming someone can take a task. Do not edit the note until I approve the proposed changes.`;

const FAQ = [
  { q: "How do I make an Eisenhower matrix in Apple Notes?", a: [
    "Use one note with four headings: Do, Schedule, Delegate or reduce, and Drop. Put a checklist under each. The filled layout on this page copies as plain text; use Notes' Heading style and Checklist button to format it.",
  ] },
  { q: "Should an Apple Notes Eisenhower matrix use a table?", a: [
    "This template uses four separate checklists. Each task has room for a deadline and a reason, and you can mark it complete. It keeps the urgency and importance decisions without needing a four-box page.",
  ] },
  { q: "How do I sort a task that is urgent but not important?", a: [
    "Check what happens if it waits and how it supports your current outcome. If it needs a prompt response but contributes little, ask someone suitable to take it, reduce the work, or decline it. A deadline alone does not make a task important.",
  ] },
  { q: "What belongs in the Schedule list of this matrix?", a: [
    "Work that supports your outcome but does not need action immediately. Add a date when you intend to do it. A date typed in this template is a planning note; make any calendar booking separately.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-eisenhower-matrix-template"
      intro={<>
        Make an Eisenhower matrix in Apple Notes with four headed checklists: Do, Schedule, Delegate or reduce, and Drop.
        Copy the filled example below, then sort your own tasks by urgency and importance.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#sort", label: "Sort your tasks" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Review it with AI" },
        ]}>
          <p>
            An Apple Notes Eisenhower matrix can be four checklists in one note, with a heading for each urgency and importance pair.
            Write the outcome above them, then give each task a reason for its place. The example below shows a cafe booking-page launch.
          </p>
          <PostCta slug="apple-notes-eisenhower-matrix-template" position="answer" title="Want help checking the priorities?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your task note and suggest which items to move, with reasons you can check.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="template">The template: four lists with reasons</h2>
      <p>
        This example has one outcome: get a cafe&apos;s booking page ready for 27 November. The broken form blocks testing today.
        The handover guide matters for launch, but can wait until Thursday. The optional call needs an answer today without needing an hour of work.
      </p>
      <Keep title="Eisenhower matrix for Apple Notes" text={TEMPLATE}
        note="Copies as plain text. Turn each section label into a heading and its task lines into a checklist using the steps below." />

      <h2 id="set-up">Set it up on Mac or iPhone</h2>
      <p>
        Use a note in iCloud or stored on the device. Apple says some formatting features are unavailable in accounts from other providers.
        The layout uses separate lists rather than a table, so each task can include a sentence about why it belongs there.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>On a Mac:</p>
      <ol>
        <li>Create a new note and paste the layout above. Replace the outcome and the example tasks with yours.</li>
        <li>Select the line beginning &ldquo;Do&rdquo;, use the Format button and choose Heading. Repeat for the other three section labels.</li>
        <li>Select only the task paragraphs below Do and click the Checklist button. Repeat for each section, leaving the headings outside the lists.</li>
      </ol>
      <p>On iPhone, build the layout with Notes&apos; own controls:</p>
      <ol>
        <li>Tap New Note and enter the title, outcome and review date.</li>
        <li>Enter a section label, select it, tap the Format button and choose Heading.</li>
        <li>Below the heading, tap the Checklist button and enter your tasks. Return adds the next item. Repeat for each of the four sections.</li>
      </ol>
      <p>
        Click or tap a task&apos;s empty circle when it is complete. For a dropped task, tick it once you have decided to leave it out.
      </p>
      <p>
        On a Mac, File, Duplicate Note copies a note when you want a separate matrix for another project.
        <a href="/blog/apple-notes-templates"> Apple Notes templates</a> explains how to keep reusable layouts together.
      </p>

      <h2 id="sort">Decide what is urgent and what is important</h2>
      <p>
        Start with importance. Ask whether the task helps the outcome you wrote at the top, or prevents a consequence you need to avoid.
        Then ask about urgency: what deadline or dependency makes it necessary to act now? Write down the answer, especially if the deadline is only a preference.
      </p>
      <ul>
        <li>Do contains work that matters and cannot wait. In the example, the broken submit button prevents today&apos;s test bookings.</li>
        <li>Schedule contains work that matters and has time available. Give the handover guide a work session before launch, then book that time separately.</li>
        <li>Delegate or reduce contains time-sensitive work that needs less of your attention. Ask Jonas before treating the banner image as his responsibility.</li>
        <li>Drop contains work you have chosen to leave out. Keeping the theme-browsing line records that decision, so it does not return as an unexplained unfinished task.</li>
      </ul>
      <p>
        If you work alone, the third list can mean doing a smaller version, postponing it by agreement, or declining it.
        Moving a line there does not transfer responsibility to someone else.
      </p>
      <p>
        At the next review, read the open items again. A deadline may have changed, or an important task may now need action today.
        The <a href="/blog/apple-notes-weekly-review-template">weekly review template</a> can help you reconsider the outcome before sorting another week&apos;s tasks.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        These headings record your decisions. You still decide where each item belongs and move it when the reason changes.
        Writing a date under Schedule does not reserve time in your calendar. Writing Jonas&apos;s name does not send him a request.
      </p>
      <p>
        If four short lists are enough, keep using them in Apple Notes. AI help is useful when you want another check of the reasons,
        but it still needs your outcome and the real deadlines.
      </p>

      <h2 id="pinto-notes">Review the same note with ChatGPT or Claude</h2>
      <p>
        Pinto Notes has headings and checklists for this layout. It looks and works like Apple Notes on iPhone and Mac.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, your AI can read and edit your notes.
        Use the layout above as your own note, then ask for a review before any changes.
      </p>
      <Keep title="Ask for a priority review" text={PROMPT}
        note="Change the note title to yours. Check each proposed move against your actual commitments." />
      <p>
        For example, question a suggestion to move the broken form into Schedule: testing depends on it today.
        If the AI gives the handover guide an invented deadline, correct it. After you approve the changes, ask it to update the note.
        Every earlier version of a note is kept in Pinto Notes.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
