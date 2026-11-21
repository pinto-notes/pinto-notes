import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("chatgpt-prompt-library-in-notes", { title: "ChatGPT prompt library in notes: a copyable layout" });

// Written 21 November 2026 for "chatgpt prompt library", research row 7 in topic-research-2026-11-22.md.
// Google autocomplete read live 21 Nov 2026 at 13:18 UTC, client=firefox, hl=en, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=chatgpt+prompt+library
// returned chatgpt prompt library, chatgpt prompt library free, chatgpt prompt library pdf,
// chatgpt prompt library github, chatgpt prompt library chrome extension, chatgpt prompt library extension,
// chatgpt prompt library reddit, chatgpt image prompt library morphic, chatgpt image prompt library,
// best chatgpt prompt library. The seed "chatgpt prompt organizer" returned that exact phrase and
// chatgpt graphic organizer, chatgpt prompt planner, organizers examples, bar organizer ideas, prompting examples.
// "chatgpt prompt library free" returned itself and unrelated library suggestions.
// "prompt library notes" and "chatgpt prompt library in notes" returned no suggestions.
// Maker pages read live 21 Nov 2026:
// https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt
// (specific instructions, context, review the response and refine the prompt).
// https://support.apple.com/guide/notes/add-and-remove-folders-apd558a85438/mac
// (File, New Folder); https://support.apple.com/guide/notes/sort-and-pin-notes-apdb54e469b6/mac
// (File, Pin Note; upgraded iCloud notes or notes stored on Mac). Apple pages read directly after web tool 429s.
// Other Apple facts from BRIEF.md: search reads note text; File, Duplicate Note; Edit, Paste as Markdown on
// macOS 27. Earlier verification: apple-notes-organize, apple-notes-templates and apple-notes-recipe-template.
// Live models read today: https://pintonotes.com/blog/notes-in-claude-code-and-codex and
// https://pintonotes.com/blog/best-notes-apps-with-mcp, plus their local page.tsx files.
// Pinto facts: BRIEF.md (Apple Notes feel, iPhone/Mac, import leaves Apple Notes unchanged);
// connect-chatgpt-to-your-notes/page.tsx verified header and setup (one Allow grants reading and editing);
// ../supabase/functions/mcp/files_tools.ts, FILE_TOOLS search/fetch/create/edit/write (retrieve and revise notes);
// ../Pane/Model/NoteHistory.swift, NoteHistory restoring section (earlier versions and Undo).
// The layout and examples below are new editorial examples, not a shipped Pinto template or a live AI test.
// No screenshot used. No automatic field replacement, browser insertion or scheduled execution claimed.

const TEMPLATE = `# Prompt: Weekly project update

Status: To test
Last tested: YYYY-MM-DD
Tested with: App and model used

## When to use
Turn rough project notes into an update for a colleague.

## Reusable prompt
Write a weekly project update for [AUDIENCE] using only [NOTES].
Use two headings: Progress and Next steps.
Keep the whole update under 150 words. Use short sentences.
Keep names and dates exactly as supplied. Do not invent deadlines.
If a missing detail prevents a useful update, ask before drafting.

## Example input
Audience: Design team
Notes: Homepage draft finished. Review booked for Tuesday.

## Example result to compare against
Progress: The homepage draft is finished.
Next steps: Review the draft on Tuesday.

## Test notes
Check that the result keeps Tuesday and adds no deadline.
Replace this example with a result you have checked.
`;

const RETRIEVE = `Search my Pinto Notes for "Prompt: Weekly project update" and read that note.
Show me its Reusable prompt section before using it.
Ask me for the audience and this week's notes. Leave the saved prompt unchanged.`;

const FAQ = [
  { q: "How do I build a ChatGPT prompt library in Apple Notes?", a: [
    "Make a Prompts folder and keep one reusable prompt per note. Include its purpose, the text to copy and an example result you have checked. Search for the task name when you need it again.",
  ] },
  { q: "What should I save alongside a reusable ChatGPT prompt?", a: [
    "Save an example input and a useful result, plus the date and model you tested. Record what you changed when a result missed the mark. Keep the reusable instructions separate from each run's input.",
  ] },
  { q: "Can ChatGPT retrieve a prompt saved in Pinto Notes?", a: [
    "Yes, once you connect Pinto Notes and choose Allow. ChatGPT can search for the prompt note and read it. Ask it to show the saved instructions, then supply the input for this run. Allow grants reading and editing access.",
  ] },
  { q: "Does this prompt library fill in variables automatically?", a: [
    "The layout uses bracketed words as reminders. Replace them yourself before pasting into ChatGPT, or ask connected ChatGPT to read the note and collect the missing inputs. The layout is a normal note you create yourself.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="chatgpt-prompt-library-in-notes"
      intro={<>Keep each reusable ChatGPT prompt in its own note, with a clear task name and an example result. Apple Notes works for copying prompts by hand; connected Pinto Notes lets ChatGPT search for and read the prompt you ask for.</>}
      answer={
        <Answer jump={[
          { href: "#layout", label: "Copy the layout" },
          { href: "#organize", label: "Organize prompts" },
          { href: "#test", label: "Test a change" },
          { href: "#pinto-notes", label: "Retrieve in ChatGPT" },
        ]}>
          <p>
            To build a ChatGPT prompt library in notes, make a Prompts folder and save one task per note.
            Keep the reusable instructions separate from the input for each run, and save a checked example beneath them.
            When you need the prompt, copy its instructions into ChatGPT and supply fresh input.
          </p>
          <PostCta slug="chatgpt-prompt-library-in-notes" position="answer" title="Ask ChatGPT to find your saved prompt">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT can search for a prompt note and read its instructions when you ask.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="layout">A prompt note to copy</h2>
      <p>
        This layout keeps the instructions above the example, so you can copy just the part you need.
        The weekly update is a starting example. Change the task and keep the same sections for your next prompt.
      </p>
      <Keep title="Prompt library note" text={TEMPLATE}
        note="In Apple Notes on a Mac with macOS 27, choose Edit, Paste as Markdown for the title and headings. Plain paste keeps the Markdown symbols as text." />
      <p>
        Replace <code>[AUDIENCE]</code> and <code>[NOTES]</code> in the text you send to ChatGPT.
        Keep those placeholders in the library copy. They remind you which details change each time.
        Paste only the Reusable prompt section, with your replacements, when you want to run it.
      </p>

      <h2 id="organize">Find prompts by the job they do</h2>
      <p>
        In Apple Notes on a Mac, choose File, New Folder and name it Prompts.
        Name each note after its task, such as &ldquo;Prompt: Weekly project update&rdquo; or &ldquo;Prompt: Explain a code change&rdquo;.
        Search can find words in the note, so include the terms you expect to remember.
      </p>
      <p>
        Pin a frequently used prompt with File, Pin Note. Apple supports pinning in upgraded iCloud notes and notes stored on your Mac.
        Keep one note per task so its test results stay with the right instructions.
        The <a href="/blog/apple-notes-templates">Apple Notes templates guide</a> explains copying a base note for reuse. One prompt worth keeping: the <a href="/blog/chatgpt-performance-review-from-notes">performance review prompt</a> that builds an evidence table from your work notes.
      </p>
      <p>
        On a Mac, choose File, Duplicate Note to make a new prompt from your base layout.
        Rename it and remove the previous task&apos;s examples before testing.
        Use plain status labels such as To test and Tried, so an untested idea is easy to spot.
      </p>

      <h2 id="test">Save a test that explains why you kept it</h2>
      <p>
        <a href="https://help.openai.com/en/articles/10032626-prompt-engineering-best-practices-for-chatgpt" rel="noopener">OpenAI&apos;s prompting guide</a> recommends
        specific instructions and enough context, then reviewing the response and refining the prompt.
        Your library note gives you a place to record that work.
      </p>
      <ol>
        <li>Run the reusable prompt with one short example input.</li>
        <li>Check the result against your input. For the weekly update, check that Tuesday stays Tuesday and no deadline appears.</li>
        <li>If it fails, change one instruction and try the same input again.</li>
        <li>Save the useful result, the change you made and the date and model you tested.</li>
      </ol>
      <p>
        Try a second input before marking the prompt Tried. A weekly update with no review date tests whether it invents one.
        Keep the example small enough to check by hand. A saved result is a comparison for later runs, not a guarantee of the next answer.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        In the Apple Notes workflow above, you find the note and copy the instructions yourself.
        The bracketed words are plain text. Fill them in for each run, and check the answer before using it.
        Saving a prompt does not schedule a run or insert it into your browser.
      </p>

      <h2 id="pinto-notes">Retrieve a saved prompt with ChatGPT</h2>
      <p>
        Use the same layout as a normal note in Pinto Notes, an Apple Notes-style app for iPhone and Mac.
        Follow <a href="/blog/connect-chatgpt-to-your-notes">the ChatGPT connection guide</a> and choose Allow in Pinto Notes.
        That permission lets ChatGPT read and edit your notes.
      </p>
      <Keep title="Ask for a saved prompt" text={RETRIEVE}
        note="Connect Pinto Notes first. This request asks ChatGPT to retrieve the instructions and ask for fresh input." />
      <p>
        Check that ChatGPT found the right note before supplying this week&apos;s details.
        After you approve an improved prompt, ask it to save the revised instructions and the checked example in that note.
        Pinto Notes keeps earlier versions, so you can return to an older prompt if the change is less useful.
      </p>
      <p>
        This is a prompt library you maintain as notes. You decide when to retrieve a prompt and which revision to keep.
        If your library is already in Apple Notes, <a href="/blog/move-from-apple-notes">bring it over in one import on your Mac</a>.
        Apple Notes stays unchanged.
      </p>
    </PostPage>
  );
}
