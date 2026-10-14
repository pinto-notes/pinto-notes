import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("meta-muse-connectors", { title: "Meta Muse connectors: what they are, and which to add" });

// Checked on 13 October 2026 against Meta's own pages: Introducing Muse (about.fb.com, 8 September, updated 30
// September: US rollout on iOS, Android, muse.ai and WhatsApp; free for most needs; checks before sending email or
// buying; read-only or send for email; change access or disconnect any time; "forget"), the Muse Connector Platform
// (muse.ai/platform: describe, submit for review, appear in the directory), its Connector guidelines
// (muse.ai/platform/docs: Settings > Connectors; Ask on first use with Allow once, Always allow or Deny; sensitive
// writes asked every time; Read Only offered where possible; OAuth or API key), the platform terms (effective 18
// September; connection interfaces include MCP servers), and Muse Code's docs (dev.meta.ai/docs/muse-code/extending
// and /configuration: mcp_servers in ~/.config/muse/settings.json, streamable_http, muse mcp login, /migrate). Meta's
// pages give no full connector list and no way for a user to paste their own MCP address into Muse, and the text says
// so. Pinto Notes is not in the Muse directory and hasn't been tested with Muse or Muse Code.
// Muse Wonder checked 14 October against Meta's post (research.meta.ai/blog/muse-wonder, 12 October): Model API and
// Muse Code now, Muse Wonder Full for Muse Code subscribers, "will soon power experiences in Muse", subscribers first.

const FAQ = [
  { q: "What are connectors in Meta Muse?", a: [
    "Connections between Muse, Meta's personal AI agent, and another service such as your email or a checkout. Each one is built by the service's developer, reviewed by Meta, and listed in Muse's directory. You turn them on one at a time in Settings, then Connectors, and approve what Muse does with them.",
  ] },
  { q: "Can I add my own MCP server to Meta Muse?", a: [
    "Not that Meta documents. Its pages describe connectors that developers submit and Meta reviews, and say nothing about pasting a server address yourself. Muse Code, Meta's separate coding agent for the terminal, does take your own MCP servers in its settings file.",
  ] },
  { q: "Is Meta Muse available outside the US?", a: [
    "Meta's announcement says Muse is rolling out in the US, on iOS, Android, the web at muse.ai and in WhatsApp. It doesn't give dates for other countries.",
  ] },
  { q: "Does connecting an account let Muse do anything with it?", a: [
    "No. Meta's guidelines say connecting an account doesn't authorize every action. Muse asks the first time it uses a tool, and asks every time for sensitive actions like a purchase. You can also disconnect a service at any time.",
  ] },
];

const FIRST = `Look through my email from the last two weeks and list everything I've agreed to do, with the date I promised it. Don't reply to anyone. Show me the list first, and ask before you add any of it to my calendar.`;

const MUSE_CODE = `{
  "schema_version": 1,
  "mcp_servers": {
    "notes": { "transport": "streamable_http", "url": "${MCP_URL}", "mode": "optional" }
  }
}`;

export default function Page() {
  return (
    <PostPage
      slug="meta-muse-connectors"
      intro={<>Meta launched Muse on 8 September and opened it to outside developers ten days later. Since then, most of the questions I see are about connectors: what they are, how to add one, and whether Muse can reach the apps you already use. This guide sticks to what Meta&apos;s own pages say, and points out where they say nothing.</>}
      caption="The approval sheet in Pinto Notes on a Mac. Muse asks in a similar way before a connector uses a tool: once, always, or not at all."
      answer={
        <Answer jump={[
          { href: "#what", label: "What a connector is" },
          { href: "#add", label: "Add one" },
          { href: "#which", label: "Which to add" },
          { href: "#own", label: "Your own server" },
          { href: "#muse-code", label: "Muse Code" },
          { href: "#limits", label: "Gaps" },
        ]}>
          <p>
            A Muse connector links Muse to another service, like your email or a way to pay. Developers build them and Meta reviews
            each one before it appears in the directory. You add them in Settings, then Connectors, and Muse asks before it uses
            each tool. Meta doesn&apos;t document a way to add your own MCP server to Muse. Muse Code, its terminal agent, does take them.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="what">What a Muse connector is</h2>
      <p>
        Muse is Meta&apos;s personal agent. Meta&apos;s <a href="https://about.fb.com/news/2026/09/introducing-muse-personal-ai-agent/" rel="noopener">announcement</a> says
        it runs on its own cloud computer with a browser, keeps working after you leave the app, and checks with you before
        sensitive actions such as sending an email or buying something. It&apos;s rolling out in the US on iOS, Android, the web
        and inside WhatsApp, and it&apos;s free for most needs, with paid plans for heavier use.
      </p>
      <p>
        Without connectors, Muse works through its browser the way you would. A connector gives it a direct line to a service
        instead: the developer supplies the tools, and Muse decides when to use them. On 18 September Meta opened
        the <a href="https://muse.ai/platform" rel="noopener">Muse Connector Platform</a>, where a company describes its product, submits a
        connector for review, and after approval appears in the directory. Meta&apos;s <a href="https://muse.ai/platform/terms" rel="noopener">platform terms</a>,
        in force from that day, count MCP servers among the ways a connector can plug in. MCP is the open standard ChatGPT and
        Claude use for the same job.
      </p>

      <h2 id="add">How to add a connector in Muse</h2>
      <p>
        Meta&apos;s <a href="https://muse.ai/platform/docs" rel="noopener">connector guidelines</a>, written for developers, also describe
        what you see as a user. Approved connectors show up in Settings under Connectors, and Muse can suggest one when a task
        needs it.
      </p>
      <Steps>
        <li>
          <strong>Open Settings, then Connectors</strong>
          Pick the service. You&apos;ll usually sign in to it, and Muse gets only the access you grant there.
        </li>
        <li>
          <strong>Choose Read Only if it&apos;s offered</strong>
          Meta asks developers to offer a read-only option where they can. For email, the announcement says you choose between
          letting Muse only read your mail or also send on your behalf.
        </li>
        <li>
          <strong>Answer the first approval</strong>
          The first time Muse uses a tool that reads or makes a small change, it asks, and you pick Allow once, Always allow or Deny.
          Sensitive actions, such as a purchase, ask every time and offer only Allow once or Deny.
        </li>
        <li>
          <strong>Change your mind later</strong>
          Meta says you can change a connector&apos;s access or disconnect it at any time, and that a change in what Muse is about
          to do needs a new approval.
        </li>
      </Steps>
      <p>
        I&apos;d leave Always allow off for anything that writes until you&apos;ve watched Muse use it a few times. It&apos;s the one
        choice on that prompt that stops it asking.
      </p>

      <h2 id="which">Which connectors to add first</h2>
      <p>
        Meta hasn&apos;t published a full list that I can find, and the lists on other sites disagree with each other, so check
        Settings, then Connectors, for what your account offers. The announcement itself names a few. Link, by Stripe, handles
        checkout, giving Muse a one-time card number so your real card stays hidden. Email can be read-only or read and send.
        1Password support is mentioned so Muse can use logins you already have, and Shop Pay is listed as coming soon.
      </p>
      <p>
        I&apos;d pick connectors by a task that keeps coming back, and give each one only the access that task needs. Read-only
        email is a good first one: Muse can find what you&apos;ve promised people and what&apos;s waiting on you, and it can&apos;t send
        anything. Add a calendar when you want it to check your free time before it suggests a plan, and leave checkout for later,
        once you&apos;ve seen how it chooses.
      </p>
      <Keep title="A first task for Muse with email connected" text={FIRST}
        note="Read-only email is enough for this. Check the list against your inbox before you let it touch the calendar." />

      <h2 id="own">Can you add your own MCP server to Muse?</h2>
      <p>
        Not as far as Meta&apos;s pages say. ChatGPT, Claude and Grok each have a place to paste the address of any MCP server.
        Muse&apos;s connectors go through Meta&apos;s review first: a risk assessment, a review of each tool and whether it writes, then
        testing by hand. Meta says meeting the guidelines doesn&apos;t guarantee approval and doesn&apos;t publish how long review
        takes. Until a service is approved, there&apos;s no documented way to reach it from Muse.
      </p>
      <p>
        For notes, that means Muse can only work with your notes app if the app has had a connector approved. Pinto Notes, the notes app for iPhone and Mac that I make, isn&apos;t in the Muse directory. I&apos;m preparing
        a submission, and I haven&apos;t tested Pinto Notes with Muse. ChatGPT, Claude, Claude Code and Codex can read and edit it
        today over MCP, once you approve them in the app. <a href="/blog/notes-apps-with-mcp">Notes apps with an MCP server</a> compares the
        apps you can connect now.
      </p>

      <h2 id="muse-code">Muse Code can use your own MCP servers</h2>
      <p>
        Muse Code is a separate product: Meta&apos;s coding agent for the terminal on macOS and Windows. Its
        <a href="https://dev.meta.ai/docs/muse-code/extending" rel="noopener"> extending guide</a> covers MCP. You list servers
        in <code>~/.config/muse/settings.json</code> under <code>mcp_servers</code>, and the file must also contain{" "}
        <code>&quot;schema_version&quot;: 1</code> or every command fails at startup. A remote server uses
        the <code>streamable_http</code> transport. If it signs in with OAuth, as Pinto Notes does, you run{" "}
        <code>muse mcp login</code> with the server&apos;s name and Muse Code keeps the tokens. Run <code>/mcp</code> in a session to see what
        connected.
      </p>
      <p>
        On 12 October Meta <a href="https://research.meta.ai/blog/muse-wonder" rel="noopener">released Muse Wonder</a>, which it
        calls its most capable model. You can use it in Muse Code and through Meta&apos;s Model API now, and Muse Code subscribers
        also get Muse Wonder Full. Meta says Muse Wonder will soon power Muse itself, starting with subscribers.
      </p>
      <Keep title="An MCP server in Muse Code's settings" code text={MUSE_CODE}
        note={<>Then run <code>muse mcp login notes</code>. These are Meta&apos;s documented steps for any remote server. I haven&apos;t tested Pinto Notes with Muse Code yet.</>} />
      <p>
        By default a server is required, and one that fails to start stops the whole run. With{" "}
        <code>&quot;mode&quot;: &quot;optional&quot;</code>, Muse Code skips it with a warning instead. And Meta notes that MCP tools aren&apos;t sandboxed, so add
        only servers you trust.
      </p>
      <p>
        If you&apos;re moving from Claude Code or Codex, Muse Code has a bundled <code>/migrate</code> skill. Meta says it imports your
        Claude Code or Codex memory notes and MCP servers, and <code>muse skills import --from claude</code> brings skills across.
        Muse Code keeps project memory in <code>.agents/memory/</code> in the repo, with a <code>MEMORY.md</code> index. That&apos;s
        three agents with three memories of the same project, which is why I keep the plan in a note all of them can
        read. <a href="/for/claude-code">Shared memory for coding agents</a> covers how, and
        the <a href="/for/claude-code">Claude Code page</a> shows Pinto Notes doing it.
      </p>

      <h2 id="limits">What Meta doesn&apos;t say yet</h2>
      <p>
        Meta says Muse remembers what matters to you and can act on something you mentioned once. You can tell it to forget
        specific things, but the announcement doesn&apos;t describe a page where you read or edit everything it remembers. If a plan
        matters, keep the plan itself somewhere you can open without asking Muse. <a href="/blog/claude-memory-vs-notes">ChatGPT memory
        or your notes</a> makes the same case for ChatGPT.
      </p>
      <p>
        The connector directory is new and changes week to week, so a connector named in an article (this one included) may not be
        in your account yet. Some financial tools aren&apos;t being approved at all for now: Meta&apos;s guidelines say tools that move
        money or place trades aren&apos;t currently accepted.
      </p>

    </PostPage>
  );
}
