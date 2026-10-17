import { Figure } from "@/lib/blog";
import { APP_STORE_LIVE, DEVICES } from "@/lib/site";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { SHOTS } from "@/lib/posts";
import { Answer, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("best-notes-app-for-ai-agents", {
  title: "The best notes app for AI agents (2026) · Pinto Notes",
});

type Row = { app: string; remote: string; writes: string; undo: string; approval: string; read: string };

// Checked against each app's own documentation on 30 September 2026; Evernote (help.evernote.com article
// 51596325640339: paid plans, reads and creates notes) and Bear (bear.app/faq/command-line-interface: CLI, Claude
// Connector and MCP server, built on bearcli on the Mac) re-checked 14 October 2026.
const ROWS: Row[] = [
  { app: "Pinto Notes", remote: "Yes, built in", writes: "Line edits, appends, checklist ticks, table rows", undo: "Undo, and every version kept", approval: "OAuth plus Allow in the app; read only or read and edit", read: DEVICES },
  { app: "Notion", remote: "Yes, official", writes: "Pages, databases, blocks, comments", undo: "Page history (length depends on plan)", approval: "OAuth, with your workspace permissions", read: "Web, desktop, phone" },
  { app: "Evernote", remote: "Yes, official, on paid plans", writes: "Reads and creates notes; no edits", undo: "Note history", approval: "OAuth", read: "Web, desktop, phone" },
  { app: "Obsidian", remote: "No; community plugins on your computer", writes: "Depends on the plugin", undo: "File recovery snapshots on that computer", approval: "Depends on the plugin", read: "Desktop, phone" },
  { app: "Bear", remote: "No; official MCP server and Claude connector, running on your Mac", writes: "Yes, on that Mac", undo: "No note history", approval: "You set it up on the Mac", read: "Mac, iPhone" },
  { app: "Apple Notes", remote: "No; Anthropic's Claude Desktop extension and community servers, on your Mac", writes: "Read, add and update notes, on that Mac", undo: "No note history", approval: "macOS Automation permission", read: "Every Apple device" },
];

const FAQ = [
  { q: "What is the best notes app for AI agents?", a: [
    "One the agent can reach wherever it runs, that lets it make small, precise changes, and that keeps every version so you can undo a bad edit. In October 2026, Pinto Notes and Notion meet all three. Evernote's server reads and creates notes but can't edit them, and Bear's runs on your Mac.",
  ] },
  { q: "Why does a remote MCP server matter?", a: [
    "Agents in ChatGPT, Claude and Incredible run in the cloud. They can only reach a server on the internet, not an app on your Mac. A remote server also works from Claude Code and Codex on any computer.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="best-notes-app-for-ai-agents"
      intro={<>An AI agent that keeps notes for you needs more than a chat window: it has to reach your notes from wherever it runs, write to them carefully, and let you undo what it got wrong. Here are the criteria I&apos;d use and how the options compare. I make one of them, so I&apos;ve kept the criteria concrete enough to check yourself.</>}
      answer={
        <Answer jump={[
          { href: "#needs", label: "What an agent needs" },
          { href: "#compare", label: "The comparison" },
          { href: "#pinto-notes", label: "Where Pinto Notes fits" },
        ]}>
          <p>
            Pick an app your agent can reach from the cloud, that lets it change one line instead of rewriting a note, and that keeps every
            version. In October 2026 that&apos;s Pinto Notes (iPhone and Mac) and Notion (everywhere, built for teams). Evernote&apos;s server
            can&apos;t edit notes, and Bear&apos;s, Obsidian&apos;s and Apple Notes&apos; only run on your own computer.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="needs">What an agent needs</h2>
      <PostFigure src="/blog/news/mcp-docs-architecture-diagram" width={1920} height={750} maxWidth={760}
        alt="The Model Context Protocol's diagram: AI apps such as Claude Desktop and Claude Code on the left, data sources and tools such as databases, Git and Slack on the right, joined through MCP in the middle."
        caption="MCP sits between AI apps and the things they use; a notes app is one more box on the right. Image: Model Context Protocol." />
      <ol>
        <li><strong>A remote MCP server.</strong> ChatGPT, Claude and Incredible run their agents in the cloud, so the notes app needs a server on the internet, not only on your Mac. The same server then works from Claude Code and Codex.</li>
        <li><strong>Precise writes.</strong> Changing one line, appending to a log or ticking a checklist item, instead of rewriting the whole note. Less can go wrong, and you can see what changed.</li>
        <li><strong>Undo and history.</strong> Agents make mistakes. You want to see what changed and put the earlier version back.</li>
        <li><strong>Approval you control.</strong> Sign-in with OAuth, a read-only option, and a way to disconnect one agent without touching the others.</li>
        <li><strong>Somewhere to read the results.</strong> The point of an agent writing notes is reading them later, usually on your phone.</li>
      </ol>

      <h2 id="compare">How the options compare</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">App</th><th scope="col">Remote MCP</th><th scope="col">What the agent can write</th><th scope="col">Undo and history</th><th scope="col">Approval</th><th scope="col">Where you read</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.app}><th scope="row">{r.app}</th><td>{r.remote}</td><td>{r.writes}</td><td>{r.undo}</td><td>{r.approval}</td><td>{r.read}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <PostFigure src="/blog/news/notion-mcp-cursor-travel-plans" width={1350} height={672} maxWidth={700}
        alt="An agent calling Notion's MCP tools to search for a page and add blocks, next to the Notion page it wrote, a Tokyo two-day itinerary."
        caption="An agent writing a Notion page through Notion MCP. Image: Notion." />
      <p>
        More detail on each, with links to their own pages, is in <a href="/blog/notes-apps-with-mcp">notes apps with an MCP server, compared</a>.
      </p>

      <h2 id="pinto-notes">Where Pinto Notes fits</h2>
      <p>
        I built Pinto Notes for exactly this: a notes app that works like Apple Notes, with an MCP server made for agents. The tools are few
        and work like a coding agent&apos;s: notes are markdown files with paths, <code>fetch</code> reads one, and <code>edit</code> replaces
        text that must match once, in a note the agent has read. Ticking an item or adding a row to a tracker is one small edit, and the
        answer says if it broke something, like a value outside its column&apos;s range. Every change keeps the previous version, which the
        agent can list with <code>history</code> and you can restore in the app.
      </p>
      <Figure shot={SHOTS.historyBurst} caption="Every version, with who made it: you, ChatGPT or Claude Code." />
      <p>
        Where it falls short: it&apos;s for iPhone and Mac only, with no web, Windows or Android app{APP_STORE_LIVE ? "" : ", and the iPhone app is still on its way to the App Store"}. If your team already
        lives in Notion, Notion&apos;s server is the better fit.
      </p>

      <h2>Try it with your agent</h2>
      <PostFigure src="/blog/amber-notes-connect-an-ai" width={1040} height={720} maxWidth={520}
        alt="Connect an AI in Pinto Notes' settings on a Mac: ChatGPT, Claude, Claude Code and Codex, with what's connected below."
        caption="Settings, Connect an AI, with a guided setup for each." />
      <ul>
        <li>ChatGPT or Claude: <a href="/blog/connect-chatgpt-to-your-notes">connect it in a few minutes</a>.</li>
        <li>Claude Code or Codex: <a href="/blog/notes-in-claude-code-and-codex">one command each</a>.</li>
        <li>Anything else that speaks MCP, including Incredible: <a href="/blog/mcp-server">the server address and every tool</a>.</li>
      </ul>
    </PostPage>
  );
}
