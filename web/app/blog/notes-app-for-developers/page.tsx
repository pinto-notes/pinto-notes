import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("notes-app-for-developers", { title: "Notes app for developers: 6 options compared" });

// Written 21 November 2026 for "notes app for developers", topic-research-2026-11-20.md row 16.
// Google autocomplete read live today, client=firefox, hl=en, gl=us, at
// https://suggestqueries.google.com/complete/search for all four brief queries. Relevant suggestions:
// notes app for developers, best notes app for developers, notes app for programmers, notes app for
// programming, best notes app for programmers, notes app for coding, notes app for coders,
// how to take notes for programming, notes app for engineers, best notes app for engineers,
// best notes app for software engineers, best notes app for engineering students.
// Official pages read live 21 November 2026, no prices or hands-on claims:
// Obsidian: https://obsidian.md/help/data-storage (local Markdown vault, external edits, Git),
// https://obsidian.md/help/syntax (fenced code, language labels), https://obsidian.md/help/links
// (note links), https://obsidian.md/help/plugins/search (content and path search),
// https://obsidian.md/help/cli (official CLI; app must run, first command launches it).
// Notion: https://www.notion.com/help/code-blocks (/code, language formatting, Copy),
// https://www.notion.com/help/create-links-and-backlinks (page links, backlinks),
// https://www.notion.com/help/search (workspace content versus database properties),
// https://www.notion.com/help/export-your-content (Markdown and CSV export),
// https://developers.notion.com/guides/mcp/overview (official MCP searches, creates, edits, databases).
// Joplin: https://joplinapp.org/help/apps/markdown/ (Markdown, code fences, note links),
// https://joplinapp.org/help/apps/terminal/ (open source, terminal app, export --format md),
// https://joplinapp.org/help/apps/search/ (filters, slash-prefixed basic search and its speed caveat),
// https://joplinapp.org/help/apps/ai_mcp/ (official local MCP, Web Clipper required, tools off by default),
// https://joplinapp.org/help/faq/ (SQLite database), https://joplinapp.org/help/apps/import_export/ (export).
// Bear: https://bear.app/faq/show-syntax-highlighting-for-your-code-snippets-in-notes/ (code blocks),
// https://bear.app/faq/how-to-link-notes-together/ (wiki links, headings),
// https://bear.app/faq/command-line-interface/ (official bearcli and local MCP, Mac only),
// https://bear.app/faq/where-are-bears-notes-located/ (SQLite), https://bear.app/faq/export-your-notes/ (.md).
// Apple: https://support.apple.com/guide/notes/apd46c25187e/mac (Monostyled, Shift-Command-M),
// https://support.apple.com/guide/notes/apde615d29c2/mac (Edit, Add Link),
// https://support.apple.com/guide/notes/not201900c07/mac (Markdown export and Copy as Markdown).
// Apple pages fetched directly after the web reader returned 429. Search, pinning and checklists:
// BRIEF.md's verified facts, also used in apple-notes-vs-obsidian and best-notes-app-for-mac.
// Pinto: Code Block in / menu from ../Pane/Editor/SlashCommands.swift, name and available commands.
// Markdown file paths, hosted MCP, search/read/edit, Undo and versions: app/blog/mcp-server/page.tsx.
// Claude Code, Codex and Gemini CLI: that post's AGENT_INSTALLS, verified in lib/agent-installs.ts.
// Apple Notes feel, iPhone/Mac, free templates, connected ChatGPT/Claude, import unchanged: BRIEF.md.
// Apple-only limit: BRIEF-compare.md. Template actions: content/templates/bug-triage.json,
// daily-standup.json and decision-log.json, including their claudeCode prompts.
// Reused picture: /blog/launch/daily-standup-note, inspected against daily-standup.json's example.

const FAQ = [
  { q: "What should programmers look for in a notes app?", a: [
    "Check code formatting, Markdown export, search and links between notes. If a coding agent needs the notes, choose how it will reach them: local files, a command line tool, or an MCP connection.",
  ] },
  { q: "Which notes app lets a coding agent read local files?", a: [
    "Obsidian stores its vault as ordinary Markdown files on disk. A coding agent with access to that folder can read them directly. Obsidian also has an official CLI, which uses the running app.",
  ] },
  { q: "Can I use Apple Notes for programming notes?", a: [
    "Yes, for explanations, checklists and short snippets. On Mac, Shift-Command-M applies Monostyled formatting. You can link related notes and export a note as Markdown, though an export is a separate copy.",
  ] },
  { q: "Can Gemini CLI work with Pinto Notes?", a: [
    "Yes. Pinto Notes lists Gemini CLI alongside Claude Code and Codex in its MCP setup guide. Once connected and approved, the agent can search, read and edit your notes.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="notes-app-for-developers"
      intro={<>Choose Obsidian if you want local Markdown files you can keep in Git. Choose Pinto Notes if you want Apple Notes&apos; feel on iPhone and Mac with notes your coding agent can read and edit.</>}
      answer={
        <Answer jump={[
          { href: "#compare", label: "Compare the apps" },
          { href: "#check", label: "What to check" },
          { href: "#obsidian", label: "Local files" },
          { href: "#pinto-notes", label: "Pinto Notes" },
          { href: "#templates", label: "Developer templates" },
        ]}>
          <p>
            Obsidian suits a personal library of files; Notion suits shared project docs; Joplin offers Markdown notebooks and a terminal app.
            Bear suits linked notes with code snippets, while Apple Notes covers quick capture on Apple devices.
            Pinto Notes connects Claude Code, Codex and Gemini CLI to your notes through a hosted MCP server.
          </p>
          <PostCta slug="notes-app-for-developers" position="answer" title="Keep project notes your coding agent can use">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Add a Code Block from the / menu, then connect your coding agent to read and edit your Markdown notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600}
        alt="Standup notes in Pinto Notes on a Mac, with a staging API key blocker and Friday and Thursday entries under Yesterday and Today."
        caption="The Standup notes template in Pinto Notes on a Mac, filled with example work. A connected coding agent can draft yesterday's section from commits." />}
      faq={FAQ}
    >
      <h2 id="compare">Six notes apps for developers</h2>
      <div className="tableWrap">
        <table>
          <thead><tr><th scope="col">App</th><th scope="col">Code and Markdown</th><th scope="col">How a tool reaches your notes</th></tr></thead>
          <tbody>
            <tr><th scope="row">Obsidian</th><td>Fenced code blocks; local Markdown files</td><td>Read the vault folder directly, or use its official CLI</td></tr>
            <tr><th scope="row">Notion</th><td>Code blocks with language formatting; Markdown export</td><td>Official MCP searches and edits workspace pages</td></tr>
            <tr><th scope="row">Joplin</th><td>Markdown editor with code blocks</td><td>Terminal app, or official local MCP through Web Clipper</td></tr>
            <tr><th scope="row">Bear</th><td>Markdown with code blocks; .md export</td><td>Official bearcli and local MCP on a Mac</td></tr>
            <tr><th scope="row">Apple Notes</th><td>Monostyled text; Markdown export on Mac</td><td>Export or copy Markdown to give to a tool</td></tr>
            <tr><th scope="row">Pinto Notes</th><td>Code Block in the / menu; notes as Markdown files</td><td>Hosted MCP for Claude Code, Codex and Gemini CLI</td></tr>
          </tbody>
        </table>
      </div>
      <p>Features checked against the makers&apos; docs on 21 November 2026. These are documented connection routes, not a hands-on test of every app.</p>

      <h2 id="check">What to check before moving your notes</h2>
      <ul>
        <li>Paste a real snippet and copy it back into your editor. Check indentation and punctuation.</li>
        <li>Decide whether you need a folder of plain files for Git, or whether Markdown export is enough.</li>
        <li>Search for a function name and part of an error message. Test punctuation as well as words.</li>
        <li>Link a decision note to the bug report that led to it. Check how you get back.</li>
        <li>Ask your agent to read one note and change one line. Check the result and how you would undo it.</li>
      </ul>

      <h2 id="obsidian">Obsidian for a local Markdown library</h2>
      <p>
        Obsidian&apos;s vault is an ordinary folder on disk. Its notes are plain Markdown files, so you can keep them in Git or let a
        coding agent read the folder. Code fences take a language label, and note links connect a snippet to its explanation.
        Search can narrow results by file or path.
      </p>
      <p>
        Its <a href="https://obsidian.md/help/cli" rel="noopener">official CLI</a> can search and read notes, create them and append text.
        It needs the Obsidian app running; the first command launches it if needed. Direct file access is useful when you want your
        terminal tools to work on the same files you edit in the notes app.
      </p>

      <h2 id="notion">Notion for shared project docs</h2>
      <p>
        Notion fits project notes that belong with a team&apos;s tasks and databases. Type <code>/code</code> to add a code block,
        choose its language and use Copy to take the snippet back to your editor. Page mentions create backlinks.
        Use workspace search for text inside pages; database search covers titles and property values.
      </p>
      <p>
        <a href="https://developers.notion.com/guides/mcp/overview" rel="noopener">Notion&apos;s official MCP</a> lets an assistant search,
        create and edit pages and manage databases. For files, export pages as Markdown and databases as CSV.
        That gives you a copy to use elsewhere; ongoing edits happen in the workspace.
      </p>

      <h2 id="joplin">Joplin for Markdown notebooks and terminal work</h2>
      <p>
        Joplin is open source and has a terminal app as well as a Markdown editor. It supports fenced code blocks and links between
        notes. Search has notebook and tag filters. Prefix a search with <code>/</code> to include punctuation through basic search;
        Joplin warns that this can be slower.
      </p>
      <p>
        Joplin also documents an <a href="https://joplinapp.org/help/apps/ai_mcp/" rel="noopener">official local MCP server</a>.
        It needs Web Clipper running, and you enable the server and individual tools. Notes live in Joplin&apos;s database,
        with Markdown export available. Use its terminal app or MCP when you want to work on the current notes.
      </p>

      <h2 id="bear">Bear for linked explanations and code snippets</h2>
      <p>
        Bear combines Markdown with code blocks that color code by language. Type <code>[[</code> to link another note, or link to
        a heading within it. That suits a snippet library where each example needs an explanation and links to related notes.
      </p>
      <p>
        Bear&apos;s <a href="https://bear.app/faq/command-line-interface/" rel="noopener">official CLI and MCP server</a> can search,
        read and edit notes locally on a Mac. Bear stores notes in a SQLite database and can export .md files.
        Its automation tools are Mac only, so check where your coding agent will run before choosing this route.
      </p>

      <h2 id="apple-notes">Apple Notes for quick project notes</h2>
      <p>
        Apple Notes works for an investigation log, a checklist or a short snippet beside an explanation. Search finds words in notes,
        and pinning keeps the current project visible. On Mac, Shift-Command-M applies Monostyled formatting.
        Choose Edit, Add Link to connect related notes.
      </p>
      <p>
        Apple&apos;s <a href="https://support.apple.com/guide/notes/not201900c07/mac" rel="noopener">export guide</a> documents File,
        Export To, Markdown for a selected note, and Edit, Copy as Markdown for selected content. Give that copy to your coding agent
        when you need context. Changes to the copy need to be brought back into Notes by you.
      </p>

      <h2 id="pinto-notes">Pinto Notes for notes your coding agent can edit</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. Type <code>/</code> at the start of a line and choose
        <strong> Code Block</strong> for a snippet. Notes are Markdown files, with paths such as <code>Work/Decision log.md</code>.
        Agents reach those files through the hosted MCP server, where they can search, read and edit them.
      </p>
      <p>
        The <a href="/blog/mcp-server">MCP guide</a> lists Claude Code, Codex and Gemini CLI with their connection steps.
        The <a href="/blog/notes-in-claude-code-and-codex">Claude Code and Codex guide</a> walks through setup and a first question.
        AI edits show what changed with Undo, and every earlier version stays in history. Pinto is Apple only,
        with no Windows, Android or web app. Check that device limit before moving your notes.
      </p>

      <h2 id="templates">Start with a developer template</h2>
      <p>These free Pinto templates give the agent a note layout and instructions for keeping it up to date.</p>
      <ul>
        <li><a href="/templates/bug-triage">Bug triage</a> files a report by severity and adds reproduction steps when supplied. Its Claude Code instructions also ask it to inspect the codebase for a likely cause.</li>
        <li><a href="/templates/daily-standup">Daily standup</a> keeps a section per working day. Its coding agent instructions draft yesterday from your commits, then ask what comes next and what is blocked.</li>
        <li><a href="/templates/decision-log">Decision log</a> records context, options and the reason for a choice. Its coding agent instructions name affected files and check past decisions before proposing a change.</li>
      </ul>
      <p>
        The AI part works once your agent is connected. For ChatGPT or Claude, follow <a href="/blog/connect-chatgpt-to-your-notes">the connection guide</a>.
        You can <a href="/blog/move-from-apple-notes">import Apple Notes on your Mac</a> in one go. Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
