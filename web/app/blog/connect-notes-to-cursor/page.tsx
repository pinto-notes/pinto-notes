import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostCta } from "@/lib/PostCta";
import { Answer, Keep } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("connect-notes-to-cursor", { title: "Connect notes to Cursor with Pinto Notes MCP" });

// Written 21 November 2026 for "cursor notes mcp", research row 2 in topic-research-2026-11-22.md.
// Google autocomplete read live today using client=firefox, hl=en, gl=us at
// https://suggestqueries.google.com/complete/search with q=cursor%20notes%20mcp: no suggestions.
// q=cursor%20notes returned cursor notes, cursor release notes, cursor patch notes, cursor update notes,
// cursor change notes, cursor ai notes, cursor project notes, cursor release notes beta, cursor add notes,
// cursor release notes github. Rechecked cursor ai notes, cursor project notes and cursor add notes:
// each returned its own wording, plus release-note or unrelated cursor results. No demand numbers inferred.
// Maker pages read live 21 November 2026: https://cursor.com/docs/mcp, also read at
// https://prod.cursor.com/docs/mcp. Remote HTTP and OAuth support; url in mcpServers; project and global
// configuration paths; Customize to enable servers; tool approval by default; Output, MCP Logs.
// https://cursor.com/docs/reference/deeplinks was also read; it describes Cursor's link scheme.
// Pinto claims: BRIEF.md for Apple Notes feel, iPhone and Mac, Apple Notes import leaving the source
// unchanged, and earlier versions. Pane/Views/ConnectWebGuide.swift, App.link, confirms the Cursor
// install link below: name plus base64 JSON containing url. Its guide says to choose Allow.
// supabase/functions/mcp/files_tools.ts confirms search, fetch, create, edit and the requirement to read
// before editing. best-notes-apps-with-mcp/page.tsx's verified header confirms hosted MCP_URL and approval.
// Models read: notes-in-claude-code-and-codex and best-notes-apps-with-mcp. All linked posts are published.
// Example brief and prompts are proposed workflows, not a recorded Cursor session. No connection tested.
// Pictures: none. No existing capture demonstrates this Cursor setup.

const CONFIG = JSON.stringify({ mcpServers: { "pinto-notes": { url: MCP_URL } } }, null, 2);
const CURSOR_INSTALL = "cursor://anysphere.cursor-deeplink/mcp/install?" + new URLSearchParams({
  name: "pinto-notes",
  config: Buffer.from(JSON.stringify({ url: MCP_URL })).toString("base64"),
}).toString();

const BRIEF = `Website search brief

Goal: Let visitors search published help articles.
First version: Search article titles and show matching links.
Keep: The existing help page layout.
Leave out: Search inside attachments.
Open question: Should results appear while typing or after pressing Search?

Decisions
No implementation decision yet.

Next step
Check how the help articles are loaded.`;

const READ_PROMPT = `Search my Pinto Notes for "Website search brief" and read the whole note. Tell me the goal, what is outside the first version, and which question is still open. Do not change the note or the code.`;
const UPDATE_PROMPT = `Read "Website search brief" in Pinto Notes again. Under Decisions, replace "No implementation decision yet." with "Show results after pressing Search." Replace the text under Next step with "Add a search field and button using the existing help page layout." Keep the other text. Show me the changes you made.`;

const FAQ = [
  { q: "How do I connect Pinto Notes to Cursor?", a: [
    "Open the Add Pinto Notes to Cursor link on your Mac, confirm the server, then follow sign-in and choose Allow when Pinto Notes asks. The connection lets Cursor read and edit your notes.",
  ] },
  { q: "Where does Cursor store a notes MCP configuration?", a: [
    "Cursor documents .cursor/mcp.json inside a project and ~/.cursor/mcp.json for a setup available across projects. Add the pinto-notes entry to the existing mcpServers object if you already have other servers.",
  ] },
  { q: "Can Cursor update a project brief written on my iPhone?", a: [
    "Yes. Keep the brief in Pinto Notes, connect Cursor to the same account, and ask it to read the note before changing it. Open the note in Pinto Notes afterward to review the result.",
  ] },
  { q: "Does adding Pinto Notes to Cursor connect Apple Notes too?", a: [
    "No. This connection accesses your Pinto Notes account. To bring existing Apple Notes into it, import them on your Mac. The import leaves Apple Notes unchanged.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="connect-notes-to-cursor"
      intro={<>Connect Pinto Notes to Cursor through MCP, sign in, and choose Allow. Cursor can then read a project brief you wrote on your iPhone and update it while you work on your Mac.</>}
      answer={
        <Answer jump={[
          { href: "#connect", label: "Connect Cursor" },
          { href: "#manual", label: "Manual setup" },
          { href: "#project-brief", label: "Try a project brief" },
          { href: "#troubleshooting", label: "If it fails" },
        ]}>
          <p>
            On your Mac, use the install link below to add Pinto Notes to Cursor, then complete sign-in and choose Allow.
            That approval gives Cursor access to read and edit your notes. Start by asking it to read one named note.
          </p>
          <PostCta slug="connect-notes-to-cursor" position="answer" title="Bring your project brief into Cursor">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Keep your brief there, then ask Cursor to read it and record a decision after you make it.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="connect">Connect Cursor on your Mac</h2>
      <p>
        You need Cursor installed on your Mac and a Pinto Notes account. This guide connects Cursor to that account.
        Pinto Notes is for iPhone and Mac. It has no Windows, Android or web notes app.
      </p>
      <ol>
        <li><a href={CURSOR_INSTALL}>Add Pinto Notes to Cursor</a>. The link fills in the server address.</li>
        <li>Confirm the server in Cursor and follow the sign-in prompts.</li>
        <li>Choose Allow when Pinto Notes asks. This permits reading and editing.</li>
      </ol>
      <p>
        The link uses the same configuration as Pinto Notes&apos; own Cursor install link.
        Cursor&apos;s <a href="https://cursor.com/docs/mcp">official MCP guide</a> documents remote servers and browser sign-in.
        We checked the documentation and install-link code for this guide. We haven&apos;t tested this connection in Cursor.
      </p>

      <h2 id="manual">Add the server manually</h2>
      <p>
        Cursor supports <code>.cursor/mcp.json</code> for one project or <code>~/.cursor/mcp.json</code> across projects.
        Add this configuration. If the file already has servers, merge the <code>pinto-notes</code> entry into its
        existing <code>mcpServers</code> object.
      </p>
      <Keep title="Pinto Notes MCP configuration" text={CONFIG} code />
      <p>
        Enable the server in Cursor&apos;s Customize area, then complete sign-in and Allow.
        The <a href="/blog/mcp-server">Pinto Notes MCP server guide</a> explains the tools and how access works.
      </p>

      <h2 id="project-brief">Read a brief you wrote on your phone</h2>
      <p>
        Make a note in Pinto Notes on your iPhone before you open the code. Write what the change should do and what
        should wait. Here is a small example you can copy, then adjust for your project.
      </p>
      <Keep title="A project brief to try" text={BRIEF} />
      <p>In Cursor on your Mac, ask it to find that note:</p>
      <Keep title="Check that Cursor can read the brief" text={READ_PROMPT} />
      <p>
        Check the tool result as well as the answer. It should show the real brief and identify the question about when
        results appear. A general answer about website search does not confirm that Cursor read your note.
      </p>

      <h2 id="update">Save a decision back to the brief</h2>
      <p>
        Once you decide how the search should work, ask Cursor to update the note. Give it the decision in your prompt
        so it does not have to guess. For this example, the decision is to wait until the visitor presses Search.
      </p>
      <Keep title="Record the decision and next step" text={UPDATE_PROMPT} />
      <p>
        Pinto Notes&apos; edit tool requires the agent to read a note before changing it.
        Open the brief in Pinto Notes afterward and check the decision. Earlier versions are kept if you need the old text.
        Keep the prompt specific when you want one section changed.
      </p>

      <h2 id="troubleshooting">If Cursor cannot find your notes</h2>
      <p>
        Check that sign-in finished for the Pinto Notes account containing the brief.
        In Cursor, make sure the server is enabled under Customize. For connection errors, open the Output panel and
        select MCP Logs. Cursor&apos;s tool calls ask for approval by default.
      </p>
      <p>
        Try the reading prompt again before asking for an edit. If several notes have similar names, give Cursor the
        exact title and ask it to show the note it found. Do not use a guessed summary as your project requirements.
      </p>

      <h2 id="pinto-notes">Keep decisions with the original brief</h2>
      <p>
        Use the same note for the request you captured on your phone and the decisions you make while coding.
        Ask Cursor to update it when something changes. This example needs an explicit request to write back.
      </p>
      <p>
        If you also use other coding agents, the <a href="/blog/notes-in-claude-code-and-codex">Claude Code and Codex setup guide</a>{" "}
        connects them to your Pinto Notes too. If your briefs are in Apple Notes, you can{" "}
        <a href="/blog/import-your-notes">import them on your Mac</a>. Apple Notes stays unchanged.
      </p>
    </PostPage>
  );
}
