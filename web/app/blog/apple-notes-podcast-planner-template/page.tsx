import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-podcast-planner-template", {
  title: "Apple Notes podcast planner template, ready to copy",
});

// Written 21 November 2026 for "apple notes podcast planner template", row 7 in
// blog-growth/topic-research-2026-11-24.md. Research A7/B9 distinguishes generic demand from an empty exact head.
// Google autocomplete rechecked today at 16:12 UTC, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=podcast%20planner%20template
// returned podcast planner template free pdf; podcast planner template; podcast planner template free;
// podcast planning template; podcast planning template google docs; podcast planning template excel;
// podcast planning template free; podcast planning template for students; podcast planning template pdf;
// podcast planning template excel free. These are suggestions, not search-volume figures.
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple%20notes%20podcast%20planner%20template
// returned []. No exact Apple Notes template demand is claimed.
// Apple support pages read today by direct HTTPS after the web reader could not open them:
// https://support.apple.com/en-us/guide/notes/apd1955d3b21/mac (Format button, Heading; account limits).
// https://support.apple.com/en-us/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button; tick circles).
// https://support.apple.com/en-us/guide/notes/apd0a136b9cc/mac (Format, Table; two rows/two columns;
// selected paragraphs convert to a table; Tab in the last cell adds a row).
// https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios (New Note, Format button, Heading, Add Table).
// https://support.apple.com/en-us/102296 (Checklist button, Return for another item; iCloud/device notes).
// Tab-separated conversion also follows the verified apple-notes-cornell-notes-template model.
// Plain paste is used here. No automatic Markdown-table conversion or podcast recording claim.
// Research's competing layouts read today: https://castos.com/tools/podcast-episode-planner/;
// https://www.hellohilite.com/create/scripts/podcast-planning-template;
// https://www.noteowl.ai/templates/podcast-show-notes. No competitor feature claims in the post.
// Pinto sources opened under wave9, relative to the repo root: Pane/Editor/SlashCommands.swift
// (headings, checklists, tables); supabase/functions/mcp/files_tools.ts, search/fetch/create/edit
// (retrieve supplied background and edit the plan; editing requires a prior read); README.md
// (Mac/iPhone, ChatGPT/Claude read/edit after approval). BRIEF.md supplies Apple Notes look and behavior,
// and Mac Apple Notes import leaving Apple Notes unchanged. The live connect-chatgpt-to-your-notes
// verified header confirms one Allow grants reading and editing. No podcast template file exists for this post.
// All episode details are fictional editorial examples. The prompt is a proposed workflow, not an AI test.
// No screenshots used. Body links and proposed inbound source checked for draft: false in lib/posts.ts.

const TEMPLATE = `The repair bench 12: Your first repair cafe visit

Stage: Prep
Next action: Bea to send Mina the questions and confirm permission to record and publish.
Recording: 24 November 2026, 10:00 London time
Target length: 18 minutes

Listener promise
Help a first-time visitor decide what to bring and what to expect at a repair cafe.

Guest and background
Mina Patel, volunteer coordinator at the fictional Mill Street repair cafe.
Name pronunciation: confirm before recording.
Permission to record and publish: awaiting confirmation.
Briefing from Mina, 20 November: visitors book a slot and bring one item.
Public booking link: request from Mina and check before publishing.

Opening line
You have a torn jacket and a repair cafe booking. What happens when you walk in?

Outline, approximate minutes
1 minute: Opening and guest introduction.
4 minutes: Booking a slot and choosing what to bring.
6 minutes: Follow one torn jacket through a visit, with a story from Mina.
5 minutes: What happens if the volunteers cannot finish a repair?
2 minutes: Recap and one thing to do before a first visit.

Guest questions
What should a visitor tell you when they book?
What happens between arriving with a torn jacket and sitting with a volunteer?
Can you describe a visit where the item could not be repaired that day?
What should someone check with their local cafe before coming?

Before recording
Confirm Mina's name, role and permission to record and publish.
Send the outline and check for topics Mina wants to avoid.
Make a short audio test in the recording app and listen back.

Show notes draft, revise after editing
Working title: Your first repair cafe visit, with Mina Patel.
Description: A conversation about booking a visit and bringing an item for repair.
Guest credit: Mina Patel, volunteer coordinator, Mill Street repair cafe.
Links to add: the cafe's checked booking page and visitor guidance.
Chapter times: add from the final edited audio, if used.

Publish checklist
Listen to the full edited audio in the audio app.
Check guest credit, permissions and any quoted words.
Revise the description and check every public link.
Upload the final audio and show notes in the podcast host.
Check the live episode and record its public link here.
`;

const PIPELINE = `The repair bench, episode pipeline

Episode\tStage and next action
11: Mending a backpack\tEditing. Alex to remove the repeated introduction.
12: Your first repair cafe visit\tPrep. Bea to send Mina the questions and confirm permission.
13: Caring for borrowed tools\tIdea. Rowan to find a guest who runs a tool library.
`;

const PROMPT = `Read my Pinto Notes episode note "The repair bench 12: Your first repair cafe visit".
Using only its Guest and background section, suggest two follow-up questions for a first-time visitor.
Show them in the chat first. Ask me about anything missing; do not invent guest stories or booking rules.
After I approve the wording, add the questions under Guest questions in that note.
Keep the outline timings and the permission status unchanged. Leave the publish checklist unchecked.`;

const FAQ = [
  { q: "What should an Apple Notes podcast planner include?", a: [
    "Keep the episode's stage and next action above the listener promise, guest details and timed outline. Add guest questions, recording checks, a show notes draft and a publish checklist. Use a separate short table to track other episodes.",
  ] },
  { q: "Should my podcast outline include every word I plan to say?", a: [
    "For this interview layout, write the opening line and the questions, then give each segment a time allowance. Leave room for follow-up questions. A scripted episode may need a separate full script.",
  ] },
  { q: "Can I use the planned segment times as podcast chapter times?", a: [
    "Use the final edited audio to set chapter times. The minutes in this outline are planning estimates. Answers, pauses and cuts will change where each topic starts.",
  ] },
  { q: "Does ticking the publish checklist upload my podcast?", a: [
    "No. These are checklist items you complete yourself. Upload the audio and show notes through your podcast host, then check the public episode before marking the final item complete.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-podcast-planner-template"
      intro={<>Copy this Apple Notes podcast planner template into one note per episode. It keeps the guest questions and timed outline beside the show notes draft and publish checklist.</>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the episode plan" },
          { href: "#set-up", label: "Set it up" },
          { href: "#pipeline", label: "Track the pipeline" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Prepare with your AI" },
        ]}>
          <p>
            Use one note for each episode, with its current stage and next action at the top.
            This filled example plans an 18-minute interview; replace the fictional show and guest with your own details.
          </p>
          <div id="template">
            <Keep title="Podcast episode planner for Apple Notes" text={TEMPLATE}
              note="Paste into a new note. Turn the section labels into headings and the recording and publish checks into native checklists using the steps below." />
          </div>
          <PostCta slug="apple-notes-podcast-planner-template" position="answer" title="Want help preparing guest questions?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your episode plan and help draft questions from the background you supply.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Set up the episode note on Mac or iPhone</h2>
      <p>
        Use an iCloud note or a note stored on your device. Apple says some Notes features aren&apos;t available with other email providers.
        The template is plain text, so you can read it before formatting it.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>
        On a Mac, paste into a new note. Select a section label such as Guest questions, click the Format button and choose Heading.
        Select the three lines under Before recording and click the Checklist button. Do the same for the five lines under Publish checklist.
        Click a circle when you finish that task.
      </p>
      <p>
        On iPhone, tap New Note and paste the text. Select a section label, tap the Format button and choose Heading.
        For each checklist, place the cursor below its heading and tap the Checklist button. Enter each task and tap Return for the next.
        Remove the original plain task lines after you&apos;ve made the checklist.
      </p>

      <h2 id="pipeline">Keep a small episode pipeline</h2>
      <p>
        Keep one other note with the episodes currently in progress. Give each an explicit stage and a next action with an owner.
        Move an episode through Idea, Prep, Recorded, Editing and Published by changing its text when the work is done.
      </p>
      <Keep title="Episode pipeline for Apple Notes" text={PIPELINE}
        note="Each row has a tab between the episode and its stage. Keep the detailed outline in the episode's own note." />
      <p>
        On a Mac, select the four lines from Episode through episode 13 and click the Table button to convert them into a table.
        Or choose Format, Table for an empty table with two rows and two columns, then enter the rows yourself.
        Press Tab in the last cell to add another row. <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> explains the controls.
      </p>
      <p>
        On iPhone, tap where the table should go, tap Add Table and enter the episode and stage in separate columns.
        Remove the plain rows once they&apos;re in the table. Keep a clean copy of the episode layout for the next interview;
        the <a href="/blog/apple-notes-templates">Apple Notes templates guide</a> covers reusing a base note.
      </p>

      <h2>Use the outline during recording, then revise the show notes</h2>
      <p>
        Before recording, confirm the guest&apos;s name and permission. Read the listener promise against each question.
        For this episode, a story about arriving with a torn jacket helps the listener picture a visit.
        A long account of how the cafe started may need its own episode.
      </p>
      <p>
        The segment allowances total 18 minutes. Treat them as a guide while you record, and leave space for an answer worth following.
        Afterwards, note any cuts for the editor in the episode note. Revise the show notes against the final audio, removing topics you cut
        and adding the links you actually mentioned. Set chapter times from that final version.
      </p>

      <h2 id="limits">Where this planner stops</h2>
      <p>
        You update the pipeline yourself. A stage label records your progress; it doesn&apos;t check whether an audio file is ready.
        The publish checklist is a record of work you do in your audio tools and podcast host. Pasting this layout doesn&apos;t connect those tools.
      </p>
      <p>
        Keep the recording and edited audio in your usual production workflow. Put their filenames or locations in the episode note
        so the editor can find the right version. After publishing, add the public episode link and change the pipeline stage to Published.
      </p>

      <h2 id="pinto-notes">Prepare guest questions with ChatGPT or Claude</h2>
      <p>
        You can use this layout as a normal note in Pinto Notes, with headings, checklists and tables.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and choose Allow, it can read and edit your notes.
        Ask it to read the guest background and propose follow-up questions before adding them to the plan.
      </p>
      <Keep title="Ask your AI to prepare follow-up questions" text={PROMPT}
        note="Save the filled episode plan in Pinto Notes first. Replace its background with information you have checked before using this prompt." />
      <p>
        Check each suggestion against the guest briefing. Booking a slot and bringing one item are supplied facts in this fictional example;
        a booking fee or a promise to repair anything would be invented. After the edit, check the questions in the note and confirm that
        permission is still awaiting confirmation and the publish checklist remains unchecked.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
