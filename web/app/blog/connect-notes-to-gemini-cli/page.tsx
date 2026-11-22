import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("connect-notes-to-gemini-cli", { title: "Connect notes to Gemini CLI with MCP" });

// Written 21 November 2026 for "gemini cli notes mcp", research row 8 in topic-research-2026-11-22.md.
// Google autocomplete read live 21 November 2026, client=firefox, hl=en, gl=us, using
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=gemini%20cli%20notes%20mcp
// Exact seeds "gemini cli notes mcp", "gemini cli mcp notes" and "notes app for gemini cli" returned [].
// "gemini cli notes" returned itself, gemini cli release notes, gemini cli patch notes, gemini cli update notes,
// gemini cli change notes, google gemini cli release notes, gemini message today, gemini.com customer service,
// gemini customer support. "connect notes to gemini" returned connect apple notes to gemini, how to connect
// gemini to notes, connect gemini to keep notes, how to communicate with a gemini, connect with a gemini coin.
// Related consumer-app suggestions do not establish CLI demand. No search-volume claim.
// Google sources read live today:
// https://geminicli.com/docs/tools/mcp-server/ (HTTP add command, user scope, OAuth browser sign-in,
// /mcp auth, /mcp status and tools, gemini mcp list, confirmation prompts).
// https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html (official guide from the research row).
// https://geminicli.com/docs/extensions/ (installing an extension from a GitHub URL).
// Pinto verification: ../README.md, Connect an AI in a minute (Gemini extension command, hosted HTTP address,
// OAuth and approval), What it does and Features in detail (iPhone/Mac sync, visible edits, Undo and history).
// BRIEF.md Pinto facts (Apple Notes feel, free Mac download, Apple Notes import leaves source unchanged).
// ../supabase/functions/mcp/files_tools.ts, FILE_TOOLS (search, fetch, create, edit, history and restore).
// Models read: notes-in-claude-code-and-codex and best-notes-apps-with-mcp. The former verifies the CLI-style
// connection pattern; Gemini's command syntax is checked against Google's current docs, not inferred from it.
// This is a documentation-based walkthrough. No live Gemini CLI connection or account was tested.
// The Contact form fix note and prompts below are new examples, not a gallery template. No picture used.

const ADD = `gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}`;
const EXTENSION = "gemini extensions install https://github.com/pinto-notes/pinto-notes";
const BRIEF = `Contact form fix

Show a clear confirmation after a message is sent.
Keep the email address in the form after a failed send.

Session results
`;
const READ = `Find my Pinto Notes note called "Contact form fix" and read it.
Tell me its requirements before changing any code.
If more than one note matches, show me the paths and ask which one to use.`;
const SAVE = `Read "Contact form fix" in Pinto Notes again.
Under "Session results", append today's date, what we changed and the checks we actually ran.
Say plainly which checks we did not run. Keep the requirements and earlier entries unchanged.
Show me the note path when you finish.`;

const FAQ = [
  { q: "What command connects Pinto Notes to Gemini CLI?", a: [
    `Run gemini mcp add --scope user --transport http pinto-notes ${MCP_URL}. Start Gemini CLI, use /mcp auth pinto-notes to sign in, and approve the connection in Pinto Notes on your Mac.`,
  ] },
  { q: "How can I check whether Gemini CLI found my notes tools?", a: [
    "Type /mcp inside Gemini CLI to inspect the server and its tools. Then ask it to find a note by its exact title and read it. Check the answer against that note in Pinto Notes.",
  ] },
  { q: "Can Gemini CLI append its result to a note from my iPhone?", a: [
    "Once connected and approved, it can search, read and edit your Pinto Notes. Ask it to read the named note first, then append the result under a heading. The note syncs between your iPhone and Mac.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="connect-notes-to-gemini-cli"
      intro={<>
        Connect Gemini CLI to Pinto Notes over MCP, sign in and approve it on your Mac.
        Then it can read a brief you wrote on your iPhone and add the session&apos;s result to the same note.
      </>}
      answer={
        <Answer jump={[
          { href: "#connect", label: "Connect" },
          { href: "#read", label: "Read a phone note" },
          { href: "#save", label: "Save the result" },
          { href: "#check", label: "Check the connection" },
        ]}>
          <p>
            Run <code>gemini mcp add --scope user --transport http pinto-notes {MCP_URL}</code>,
            then sign in with <code>/mcp auth pinto-notes</code> inside Gemini CLI.
            Choose Allow in Pinto Notes on your Mac to give the connection access to read and edit your notes.
          </p>
          <PostCta slug="connect-notes-to-gemini-cli" position="answer" title="Give Gemini CLI your project notes">
            <p>Pinto Notes is a free download for Mac. Keep a brief on your iPhone, let Gemini CLI read it, then save the result in that note.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="connect">Connect Gemini CLI on your Mac</h2>
      <p>
        These steps are for Gemini CLI in Terminal on a Mac. Install Pinto Notes and sign in first.
        Use an installed Gemini CLI for the commands below.
      </p>
      <Keep title="Add the notes server" text={ADD} code
        note="Run this in Terminal. User scope makes the connection available across your projects." />
      <p>
        Start Gemini CLI with <code>gemini</code>, then enter this inside its session:
      </p>
      <Keep title="Sign in to Pinto Notes" text="/mcp auth pinto-notes" code
        note="Complete the browser sign-in, then approve the connection when Pinto Notes asks on your Mac." />
      <p>
        Google documents the HTTP command and sign-in in its{" "}
        <a href="https://geminicli.com/docs/tools/mcp-server/" rel="noopener">Gemini CLI MCP guide</a>.
        This walkthrough follows the documentation. We haven&apos;t tested a live Gemini CLI connection for this article.
      </p>
      <p>
        Prefer the extension route? Pinto&apos;s README gives this command instead:
      </p>
      <Keep title="Alternative: install the Pinto extension" text={EXTENSION} code
        note="Choose this route or the direct server command above. The prompts below are for either connection." />
      <p>
        Google explains <a href="https://geminicli.com/docs/extensions/" rel="noopener">installing extensions from GitHub</a>.
        With that route, use <code>/mcp</code> to find the supplied server name, then <code>/mcp auth</code> to sign in.
      </p>

      <h2 id="read">Read a brief you saved on your iPhone</h2>
      <p>
        Make a note in Pinto Notes on your iPhone called &ldquo;Contact form fix&rdquo;.
        For a first try, use this small example or substitute your own project brief:
      </p>
      <Keep title="An example brief to keep in Pinto Notes" text={BRIEF} />
      <p>
        Back on your Mac, ask Gemini CLI to find that note. Naming the note makes it easier to check that it found the right one.
      </p>
      <Keep title="Read the brief before working" text={READ} />
      <p>
        Look for a Pinto <code>search</code> call followed by <code>fetch</code> to read the note.
        Compare its answer with the two requirements you wrote. A reply that merely repeats your prompt hasn&apos;t shown that it read the note.
      </p>

      <h2 id="save">Append the result to the same note</h2>
      <p>
        When you finish a coding session, ask Gemini CLI to save what actually happened.
        Keep the original requirements above the session results so the next session can read both.
      </p>
      <Keep title="Save the session result" text={SAVE} />
      <p>
        Pinto&apos;s <code>edit</code> tool changes matching text in a note it has read.
        Ask for an addition under a heading, and check the note in Pinto Notes afterward.
        The previous version stays in history, and AI changes have Undo.
      </p>
      <p>
        On your iPhone, open the same note and read the new entry. If a check failed or was skipped, keep that in the entry.
        The next session needs that detail as much as the description of the change.
      </p>

      <h2 id="check">If the connection needs attention</h2>
      <p>
        Type <code>/mcp</code> in Gemini CLI to inspect its servers and tools, or run <code>gemini mcp list</code> in Terminal.
        If sign-in is needed, use <code>/mcp auth pinto-notes</code> for the direct connection above.
        For the extension, use the name shown in its server list.
      </p>
      <p>
        Complete Pinto&apos;s approval before asking for a note. Allow covers reading and editing.
        If the connection works but a title matches several notes, ask for their paths and pick the right one before an edit.
      </p>
      <p>
        The <a href="/blog/mcp-server">Pinto Notes MCP server guide</a> lists the note tools.
        For another coding agent, the <a href="/blog/notes-in-claude-code-and-codex">Claude Code and Codex guide</a> gives their commands.
      </p>

      <h2 id="pinto-notes">Keep the brief and its result together</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac.
        You can write the brief yourself, let an approved AI edit it, and return to an earlier version when you need to.
      </p>
      <p>
        If your notes are in Apple Notes, <a href="/blog/import-your-notes">bring them over in one import on your Mac</a>.
        Apple Notes stays unchanged.
      </p>
    </PostPage>
  );
}
