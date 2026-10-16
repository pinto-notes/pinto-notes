import { AIConnect } from "@/lib/AIConnect";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("notes-in-claude-code-and-codex", { title: "Notes in Claude Code and Codex: one command each" });

// Rewritten by hand on 14 October 2026 to the blog bar and Emil's recipe. Commands match what the Mac app
// itself runs (Pane/Views/ConnectChoices.swift on dev: server name pinto-notes, claude mcp add --scope user
// --transport http, codex mcp add --url, then sign in). The old plugin (plugins/amber-notes) still uses the
// old name and address, so it's left out until it's renamed. Claude Code's own memory: CLAUDE.md and auto
// memory are files on that computer (code.claude.com docs); Codex reads AGENTS.md.

const FAQ = [
  { q: "Can Claude Code read and write my notes?", a: [
    "Yes, through an MCP server. Add Pinto Notes with one command, sign in, and Claude Code can search, read, create and edit your notes, or only read them if you choose Read only when you allow it.",
  ] },
  { q: "How do I add a notes MCP server to Codex?", a: [
    `Run codex mcp add pinto-notes --url ${MCP_URL}. Codex opens your browser to sign in, and you allow it in Pinto Notes on your iPhone or Mac. Codex in Terminal, in your editor and in the ChatGPT app share the same setup.`,
  ] },
  { q: "Isn't CLAUDE.md enough?", a: [
    "For how a project works, yes. CLAUDE.md and Claude Code's auto memory are files on that computer, for that project. They're the wrong place for your standups, decisions and to-dos, which you want to read on your phone and share with Codex and ChatGPT too.",
  ] },
  { q: "Can I use an access token instead of signing in?", a: [
    "Yes, for a machine with no browser. In Pinto Notes, open Settings, Connect an AI, and under An app that asks for a token choose Make an Access Token. It's shown once; keep it like a password, and disconnect it in Settings if it leaks.",
  ] },
];

const CLAUDE_CMD = `claude mcp add --scope user --transport http pinto-notes ${MCP_URL}`;
const CODEX_CMD = `codex mcp add pinto-notes --url ${MCP_URL}`;
const TEST_PROMPT = "Search my Pinto Notes and tell me what I wrote most recently.";

export default function Page() {
  return (
    <PostPage
      slug="notes-in-claude-code-and-codex"
      intro={<>
        I use Claude Code every day, and every morning it starts from zero. What we decided yesterday, the bug I parked, the standup I
        still have to write: gone, unless I paste it back in. So I gave it my notes, the same ones I read on my phone. Here&apos;s how, in
        Claude Code and Codex, and what it&apos;s like once it works.
      </>}
      answer={
        <Answer jump={[
          { href: "#claude-code", label: "Claude Code" },
          { href: "#codex", label: "Codex" },
          { href: "#missing", label: "Why not CLAUDE.md" },
          { href: "#use", label: "What to ask" },
        ]}>
          <p>
            Add a notes app with an MCP server, and sign in once. For Pinto Notes that&apos;s one command in Claude Code
            (<code>claude mcp add</code>) or in Codex (<code>codex mcp add</code>), then you allow it in the app. After that the agent can
            search your notes, write the standup into them and keep a work log you can read anywhere.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/pinto/claude-code-standup-note" width={1250} height={540} maxWidth={625}
        alt="Standup notes in Pinto Notes on a Mac. The line Claude Code just added, Today: review the importer PR, then pair on table editing, is tinted, and a bar says Claude Code changed 1 line, with Undo."
        caption="My standup note, just after Claude Code added today's line. The new line is tinted, with Undo." />}
      faq={FAQ}
    >
      <h2 id="claude-code">Claude Code</h2>
      <p>
        If you&apos;ve connected Pinto Notes to Claude on claude.ai with the same account, Claude Code may already have it as a connector:
        type <code>/mcp</code> and look. If not, run this in Terminal:
      </p>
      <Keep title="Add Pinto Notes to Claude Code" text={CLAUDE_CMD} code
        note="Then run /mcp in Claude Code, pick pinto-notes and sign in. Pinto Notes asks on your iPhone or Mac whether to allow it." />
      <p>
        <code>--scope user</code> makes it available in every project, not just the one you&apos;re in. On the Mac, Pinto Notes can do this
        for you: Settings, Connect an AI, Claude Code.
      </p>

      <h2 id="codex">Codex</h2>
      <Keep title="Add Pinto Notes to Codex" text={CODEX_CMD} code
        note="Codex opens your browser to sign in straight away. To sign in again later: codex mcp login pinto-notes." />
      <p>
        Codex in Terminal, in your editor and in the ChatGPT app share this setup, so one command covers all three.
      </p>

      <h2 id="check">Check that it works</h2>
      <p>Start a new session and ask:</p>
      <Keep title="First question" text={TEST_PROMPT} />
      <p>
        The agent should call <code>search</code> or <code>list</code> and answer with a real note. In Claude Code, <code>/mcp</code> shows
        whether pinto-notes is connected.
      </p>

      <h2 id="missing">Why not just CLAUDE.md?</h2>
      <p>
        Claude Code already has memory of a kind: CLAUDE.md, which you write, and auto memory, which it writes for itself. Codex reads
        AGENTS.md. They&apos;re good at what they&apos;re for, which is how a project works: the build command, the test rules, the odd
        corner of the codebase.
      </p>
      <p>
        But they&apos;re files in a repository on one computer. Your standup isn&apos;t a project setting. Neither is the decision you made
        with Claude Code on Tuesday, which you want Codex to know on Thursday and want to read yourself on the train. Put that in
        CLAUDE.md and it&apos;s stuck in one repo, on one Mac, in a file you&apos;ll never open on your phone.
      </p>

      <h2 id="use">What to ask once it&apos;s connected</h2>
      <ul>
        <li>&ldquo;Write today&apos;s standup into my Standup note, from the commits since yesterday.&rdquo;</li>
        <li>&ldquo;Add what we just decided about the cache to my Project notes, with the reason.&rdquo;</li>
        <li>&ldquo;Read my release checklist note and go through it with me.&rdquo;</li>
        <li>&ldquo;Log today&apos;s hours in my Timesheet table.&rdquo;</li>
      </ul>
      <p>
        The <a href="/templates/daily-standup">standup</a>, <a href="/templates/bug-triage">bug triage</a> and{" "}
        <a href="/templates/decision-log">decision log</a> templates are made for this.
      </p>

      <h2 id="pinto-notes">One notebook for every agent you use</h2>
      <AIConnect ais={["claude-code", "codex", "claude", "chatgpt"]} caption="Claude Code, Codex, Claude and ChatGPT, all reading and writing the same notes." />
      <p>
        That&apos;s why I built Pinto Notes. It&apos;s a notes app for iPhone and Mac, as quick as Apple Notes, with the server built in.
        Claude Code writes the standup, you read it on your phone, and ChatGPT can pick it up from there. Every change shows up tinted
        with Undo, and the version before is kept, with the agent named, so a bad edit is one click from gone. A read-only connection
        can&apos;t change anything. If your notes are still in Apple Notes, they <a href="/blog/move-from-apple-notes">come over in one import</a>.
      </p>
      <p>
        The <a href="/blog/mcp-server">MCP server page</a> lists every tool the agent can call, and{" "}
        <a href="/for/claude-code">memory for Claude Code and Codex</a> has more ways to use it. Using Gemini CLI? The{" "}
        <a href="/blog/mcp-server#install">install steps</a> have its command.
      </p>
    </PostPage>
  );
}
