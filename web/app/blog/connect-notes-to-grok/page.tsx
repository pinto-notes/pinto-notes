import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("connect-notes-to-grok", { title: "How to connect your notes to Grok (custom MCP connectors)" });

// Checked on 13 October 2026 against xAI's own pages: Grok Connectors (x.ai/news/grok-connectors, 6 May: Web, iOS and
// Android; + then Connectors then + Add connector on the web, Settings then Connectors on mobile; Bring Your Own MCP),
// docs.x.ai/grok/connectors (available to all Grok users; Business and Enterprise need an admin; New Connector then
// Custom; public internet only), /grok/connectors/custom-mcp-tunneling (localhost rejected; SSE and Streamable HTTP),
// /grok/connector-management (console.x.ai, Grok Business then Connectors, + Add Connector then Other), Grok Build's
// MCP servers page (/build/features/mcp-servers: grok mcp add --transport http, OAuth handled automatically, list,
// doctor, --scope project, ~/.claude.json and .mcp.json read as compatibility sources) and Grok Bot's Use the computer
// and apps (connectors are plugins from Connect apps). Some third-party guides say custom connectors need a paid plan;
// xAI's docs say all users, and the text says to check. Pinto Notes hasn't been tested with Grok, and the text says so.

const FAQ = [
  { q: "Does Grok support MCP?", a: [
    "Yes. Since 6 May 2026, Grok can connect to any MCP server you give it, which xAI calls Bring Your Own MCP. On grok.com you add one at grok.com/connectors as a Custom connector. Grok Build, xAI's coding agent for the terminal, adds them with grok mcp add.",
  ] },
  { q: "Do I need a paid Grok plan for custom connectors?", a: [
    "xAI's connectors page says connectors are available to all Grok users. Some third-party guides say custom MCP connectors need a paid plan. If you don't see Custom under New Connector, your plan is the first thing to check. On Grok Business and Enterprise, an admin has to add the server first.",
  ] },
  { q: "Can Grok connect to an MCP server on my own computer?", a: [
    "Not directly. Grok's servers can't reach localhost or private addresses and reject those URLs. xAI's docs suggest a tunnel such as ngrok or Cloudflare Tunnel to give a local server a public address. Grok Build is different: it runs on your computer, so it can start a local server itself.",
  ] },
];

const BUILD = `grok mcp add --transport http pinto-notes ${MCP_URL}
grok mcp doctor pinto-notes`;

const ASK = `Search my notes for the Lisbon trip. List what's still unticked on the plan, and add "Check the tram 28 timetable" to it. Tell me which note you changed.`;

export default function Page() {
  return (
    <PostPage
      slug="connect-notes-to-grok"
      intro={<>Grok has had connectors since May, and one of them is a blank: paste the address of any MCP server and Grok can use its tools. That&apos;s how you give Grok your notes, if your notes app has a server. Below are the steps on grok.com and in Grok Build, with the gaps in xAI&apos;s docs marked.</>}
      caption="Version history for a Groceries note in Pinto Notes on a Mac, with the two lines that differ tinted. Whatever an AI changes through a connector, you can check it here."
      answer={
        <Answer jump={[
          { href: "#connectors", label: "Grok connectors" },
          { href: "#web", label: "On grok.com" },
          { href: "#build", label: "In Grok Build" },
          { href: "#bot", label: "Grok Bot" },
          { href: "#notes", label: "Your notes" },
          { href: "#limits", label: "Gaps" },
        ]}>
          <p>
            Go to grok.com/connectors, choose New Connector, then Custom, and paste your notes app&apos;s MCP server address. Sign in
            when asked. Grok finds the server&apos;s tools and can use them in any chat. The server has to be on the public internet. In
            Grok Build, the terminal agent, the same thing is one command: <code>grok mcp add --transport http</code> with a name and the address.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="connectors">What Grok connectors are</h2>
      <p>
        xAI <a href="https://x.ai/news/grok-connectors" rel="noopener">announced connectors</a> on 6 May 2026 for Grok on the web, iOS
        and Android. A connector lets Grok search and work with another service inside a conversation, so you can ask about your
        email or a shared folder without copying anything in.
      </p>
      <p>
        xAI&apos;s <a href="https://docs.x.ai/grok/connectors" rel="noopener">connectors guide</a> describes three kinds. Built-in ones are
        made by xAI: Gmail and Google Calendar, Google Drive, OneDrive, Outlook, Microsoft Teams, SharePoint and Salesforce. A
        catalog adds ready-made connectors for other services, which you sign in to and use. The third kind is a custom MCP
        connector, for anything else. MCP is the open standard that ChatGPT and Claude also use to reach outside tools, so a
        service that already works with them can usually work with Grok too.
      </p>
      <p>
        The guide says connectors are available to all Grok users. Several third-party guides say custom MCP connectors need a paid
        plan. I couldn&apos;t confirm either from xAI, so if Custom is missing, check your plan first.
      </p>

      <h2 id="web">How to add a custom MCP connector on grok.com</h2>
      <Steps>
        <li>
          <strong>Open grok.com/connectors</strong>
          On a computer, signed in. xAI&apos;s docs describe the custom option on the web; on the phone apps, connectors live in
          Settings, then Connectors.
        </li>
        <li>
          <strong>Choose New Connector, then Custom</strong>
          Paste the server&apos;s address. It must start with https and be reachable from the internet. Grok rejects localhost and
          private addresses such as 192.168.x.x.
        </li>
        <li>
          <strong>Sign in when Grok asks</strong>
          If the server uses OAuth, a sign-in page opens. Grok then looks up the server&apos;s tools by itself.
        </li>
        <li>
          <strong>Ask for something the server can do</strong>
          Grok uses a connector&apos;s tools when your question relates to that service. Name it in your first request so you can
          tell it worked.
        </li>
      </Steps>
      <p>
        On Grok Business or Enterprise the first step is different. An admin adds the server for the team
        in <a href="https://docs.x.ai/grok/connector-management" rel="noopener">console.x.ai</a>, under Grok Business, then Connectors:
        Add Connector, choose Other, and enter the address. After that, each person connects their own account on grok.com/connectors.
      </p>
      <p>
        If your server runs on your own computer, xAI&apos;s <a href="https://docs.x.ai/grok/connectors/custom-mcp-tunneling" rel="noopener">tunneling
        page</a> shows how to give it a public address with ngrok or Cloudflare Tunnel. Free tunnel addresses tend to change when
        you restart, and then you have to remove the connector and add it again. A hosted server avoids all of that.
      </p>

      <h2 id="build">How to add an MCP server in Grok Build</h2>
      <p>
        Grok Build is xAI&apos;s coding agent for the terminal. It runs on your computer, so local servers work as well as remote
        ones. Its <a href="https://docs.x.ai/build/features/mcp-servers" rel="noopener">MCP servers page</a> gives one command for a remote
        server, and says OAuth is handled automatically: a browser opens the first time Grok Build uses it.
      </p>
      <Keep title="Add a remote MCP server to Grok Build" code text={BUILD}
        note="These are xAI's documented commands for any remote server, with the Pinto Notes address filled in. I haven't tested Pinto Notes with Grok Build yet." />
      <p>
        The server is added for your user, in <code>~/.grok/config.toml</code>. Add <code>--scope project</code> to keep it in the current
        project&apos;s <code>.grok/config.toml</code> instead. <code>grok mcp list</code> shows what&apos;s set up, and <code>/mcps</code> inside
        a session opens the same list.
      </p>
      <p>
        One detail saves time if you already use Claude Code. xAI says Grok Build also reads <code>~/.claude.json</code>,{" "}
        <code>.cursor/mcp.json</code> and a project&apos;s <code>.mcp.json</code>, so servers you added there may already be loaded.
        Run <code>grok inspect</code> to see every server and where it came from before you add a duplicate.
      </p>

      <h2 id="bot">What about Grok Bot?</h2>
      <p>
        Grok Bot is xAI&apos;s always-on agent, with its own cloud computer. Its <a href="https://docs.x.ai/grok-bot/computer-and-apps" rel="noopener">docs</a> say
        connectors are added as plugins from Connect apps in the sidebar, and they&apos;re shared by every Bot on your account. They
        don&apos;t mention pasting your own MCP server address there, so I&apos;d use grok.com or Grok Build for a custom server
        until xAI says otherwise.
      </p>

      <h2 id="notes">Giving Grok your notes</h2>
      <p>
        Grok&apos;s own strength is reading what&apos;s happening on X and the web right now. Connected to your notes, it can write
        that down somewhere you keep. You could ask it each morning for what people are saying about a product you follow and have it
        add five lines to a research note, or check a running list of questions against today&apos;s news. Without a connector, you
        copy each answer out of the chat by hand.
      </p>
      <p>
        A notes app needs its own MCP server for any of this, and plenty of them don&apos;t have one. <a href="/blog/notes-apps-with-mcp">Notes
        apps with an MCP server</a> compares the ones that do.
      </p>
      <p>
        Pinto Notes is one. It&apos;s the notes app for iPhone and Mac that I make, with a hosted server at <code>{MCP_URL}</code> that
        signs in with OAuth. ChatGPT, Claude, Claude Code and Codex use it today. I haven&apos;t tested Pinto Notes with Grok yet,
        so treat this as what the steps should look like, going by xAI&apos;s docs and how the server works with other apps:
      </p>
      <ol>
        <li>Add <code>{MCP_URL}</code> as a Custom connector on grok.com, or with the Grok Build command above.</li>
        <li>A page on pintonotes.com opens. Sign in, and it shows a two-digit number.</li>
        <li>Pinto Notes on your iPhone or Mac asks whether to allow the app. Type the number, choose Read Only or Read and Edit, then Allow.</li>
      </ol>
      <p>
        Pinto Notes names ChatGPT and Claude on that sheet. Any other app, Grok included, gets a warning that Pinto Notes
        doesn&apos;t recognize it, so allow it only if you just started connecting it yourself. After that, every change Grok makes is
        tinted in the note with an Undo, and the version before it is kept. If you try it before I do, I&apos;d like to hear how it
        went. <a href="/blog/mcp-server">The Pinto Notes MCP server</a> lists every tool, and <a href="/blog/connect-notes-to-gemini">connect
        your notes to Gemini</a> covers the same setup for Google&apos;s apps.
      </p>
      <Keep title="A first request once it's connected" text={ASK}
        note="Asking which note it changed makes the edit easy to find and check." />

      <h2 id="limits">What xAI&apos;s docs leave out</h2>
      <p>
        xAI&apos;s connector pages don&apos;t say how Grok handles data from a custom server, whether it asks before each write, or how to
        remove a connector, apart from the tunneling page&apos;s advice to remove and re-add one when its address changes. A custom
        server is also outside xAI&apos;s control. Connect only ones you trust, and start with read-only access where the server offers it.
      </p>
      <p>
        Grok uses a connector when it decides your question needs it, so a vague request may get an answer from the web instead of
        your notes. I&apos;d put &ldquo;in my notes&rdquo; in the request until you know how it behaves.
      </p>

      <PostCta slug="connect-notes-to-grok" position="how-amber-helps" title="Notes every AI you use can work in">
        <p>Pinto Notes is a notes app for iPhone and Mac with a hosted MCP server, and every change an AI makes is kept.</p>
      </PostCta>
    </PostPage>
  );
}
