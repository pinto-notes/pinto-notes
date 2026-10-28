import { NoteMoment } from "@/lib/NoteMoment";
import { Figure } from "@/lib/blog";
import { AIConnect } from "@/lib/AIConnect";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Path, PostFigure, Steps } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import { CLAUDE_DIRECTORY_URL, MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("connect-chatgpt-to-your-notes");

// Rewritten answer first on 12 October 2026: the same facts as the 2 October version, no new claims about
// ChatGPT or Claude. ChatGPT's side follows OpenAI's Developer mode guide and Connect and test your plugin
// (developers.openai.com), the OpenAI community thread of 28 September 2026 and TechCrunch's DevDay report
// of 29 September; it was not rechecked in a Plus account. Pinto Notes' side checked on main on 12 October:
// Settings, AI is titled Connect an AI (SettingsView.swift, ConnectAI.swift); the guide's button is "Copy
// Address and Open <AI>" (ConnectGuide.swift); the ask is "Allow ChatGPT to use your notes?" with Read and
// edit or Read only and Don't Allow (ConnectAI.swift, ConnectAsks.swift, NoteDetailView.swift); Add to
// Claude Code (ConnectAI.swift); Disconnect (ConnectAI.swift); Show Version History (RootView.swift); the
// connect page's "No device with Pinto Notes? Use your recovery key" (web/app/connect/ConnectScreens.tsx).
// 28 October 2026: the Pinto Notes plugin was published in ChatGPT's plugin directory; the ChatGPT steps now use it
// (its page read first-hand that day). Developer mode stays only as the route for other custom apps.

const FAQ = [
  { q: "Which ChatGPT plans can add Pinto Notes?", a: [
    "Pinto Notes has been in ChatGPT's plugin directory since 28 October 2026, so you add it like any other plugin, without Developer mode. OpenAI decides which plans, countries and workspaces get directory plugins, and in a Business or Enterprise workspace an admin may have to allow it. If you can't find Plugins in ChatGPT, that's the place to check.",
  ] },
  { q: "Does it work in the ChatGPT app on my phone?", a: [
    "Connect Pinto Notes once, in ChatGPT on the web. I haven't checked the ChatGPT phone apps with it myself yet, so treat phone access as unverified for now.",
  ] },
  { q: "Why don't I see Create MCP App in ChatGPT?", a: [
    "You don't need it for Pinto Notes any more: it's in the plugin directory. For other custom apps, Developer mode is probably off. Turn it on in Settings, Security and login (chatgpt.com/settings/security), then go back to Plugins and choose + again. Without it, the menu only offers Create plugin and Upload plugin. That fix comes from a ChatGPT Pro user on OpenAI's community forum on 28 September 2026, not from OpenAI's docs.",
  ] },
  { q: "Can ChatGPT delete my notes?", a: [
    "Only if you chose Read and edit. A deleted note goes to Recently Deleted for 30 days, and every change keeps the previous version in the note's history, so you can undo it.",
  ] },
];

const PROMPTS = [
  "Search my Pinto Notes and tell me what I wrote most recently.",
  "Plan 4 days in Lisbon for us and save it to my notes.",
  "What did I write about the kitchen measurements?",
  "Turn my meeting notes into a checklist of next steps.",
  "Add today's standup to my work notes.",
].join("\n");

export default function Page() {
  return (
    <PostPage
      slug="connect-chatgpt-to-your-notes"
      intro={<>
        I talk to ChatGPT all day, and for a long time none of it reached my notes. I&apos;d plan a trip in a chat, then copy the
        good parts into Apple Notes by hand, and the next chat knew nothing about it. Here&apos;s what ChatGPT can do with the notes
        apps you probably use, where each one stops, and the setup I use now so its changes land in my notes.
      </>}
      answer={
        <Answer jump={[
          { href: "#today", label: "What ChatGPT can do today" },
          { href: "#missing", label: "What's missing" },
          { href: "#which", label: "Which AI, and what you need" },
          { href: "#chatgpt", label: "ChatGPT step by step" },
          { href: "#create-mcp-app-missing", label: "Create MCP App missing" },
          { href: "#claude", label: "Claude" },
          { href: "#control", label: "You stay in control" },
        ]}>
          <p>
            It depends on where your notes live. Apple Notes: ChatGPT can only see the one note you have open on a Mac, and can&apos;t
            save to it. Notion and Google Drive: ChatGPT&apos;s connectors can search them, with editing depending on your plan. To
            have ChatGPT search, write and edit your notes from any chat, they need an app that connects to it, like Pinto Notes:
            open the Pinto Notes plugin in ChatGPT, connect it, then choose Allow on your Mac.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="today">What ChatGPT can do with your notes today</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Where your notes are</th><th scope="col">What ChatGPT can do</th><th scope="col">Where it stops</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Apple Notes</th><td>On a Mac, look at the note you have open. With Apple Intelligence, rewrite text you select in a note.</td><td>Can&apos;t search your notes, save a change, or reach them from your phone or the web</td></tr>
            <tr><th scope="row">Notion</th><td>Search and read pages through ChatGPT&apos;s Notion connector</td><td>What it can change depends on your plan and workspace</td></tr>
            <tr><th scope="row">Google Docs and Drive</th><td>Search and read files through the Google Drive connector</td><td>Editing depends on your plan and how your admin set it up</td></tr>
            <tr><th scope="row">Pinto Notes</th><td>Search, read, write and edit your notes from any chat, with your OK</td><td>Needs Pinto Notes on a Mac, connected once</td></tr>
          </tbody>
        </table>
      </div>
      <PostFigure src="/blog/apple/apple-dts-notes-api-answer" width={1176} height={720} maxWidth={560}
        alt="An Apple Developer Forums thread where an Apple engineer answers No to whether there is an API for Apple Notes."
        caption="Apple's own answer on its developer forums. Image: Apple." />
      <p>
        Apple Notes is the one most people have, and it&apos;s the most closed: Apple has no API for it, so nothing outside your Mac can
        get in. <a href="/blog/apple-notes-api">Apple confirmed it this year</a>.
      </p>

      <h2 id="missing">What&apos;s missing</h2>
      <p>
        Even where ChatGPT can read your notes, it mostly reads. The plan you made together stays in the chat. Next week you open a new
        chat and explain it all again, and if you switch to Claude, it starts from zero.
      </p>
      <p>
        What you actually want is one notebook that ChatGPT can read and write, that you can open like any note (on the Mac today, iPhone soon), and that Claude sees too. Pinto Notes is built for that, and it works with ChatGPT and Claude.
      </p>
      <AIConnect caption="The goal: ChatGPT and Claude working in the same notes." />

      <h2 id="which">Which AI, and what you need</h2>
      <PostFigure src="/blog/news/openai-chatgpt-mcp-request-diagram" width={1000} height={480} maxWidth={560}
        alt="OpenAI's diagram: a question in ChatGPT goes through an MCP server to a ticketing system and comes back as an answer."
        caption="How MCP works, in OpenAI's own example. Image: OpenAI." />
      <p>
        MCP (Model Context Protocol) is an open standard that lets an assistant find, read and change things in another app. Once
        Pinto Notes is connected, the assistant can search your notes, read them, write new ones and edit the ones you have. Every
        assistant needs Pinto Notes on your Mac, signed in. It&apos;s free: <a href="/download">download it here</a>.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Assistant</th><th scope="col">Where you add it</th><th scope="col">Plan</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row"><a href="#chatgpt">ChatGPT</a></th><td>Its plugin directory: Pinto Notes</td><td>Plans with plugins</td></tr>
            <tr><th scope="row"><a href="#claude">Claude</a></th><td>Its connector directory, or a custom connector</td><td>Every plan</td></tr>
            <tr><th scope="row"><a href="#claude-code">Claude Code and Codex</a></th><td>A command or a few lines of config, with an access token</td><td>Any</td></tr>
            <tr><th scope="row"><a href="#incredible">Incredible</a></th><td>Apps, then Connect</td><td>Any</td></tr>
            <tr><th scope="row"><a href="#other">Other MCP apps</a></th><td>The server address, then sign in</td><td>Depends on the app</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Apple Notes can&apos;t be connected this way. On a Mac, ChatGPT can look at a note you have open, but it can&apos;t search your
        notes or save changes to them. <a href="/blog/claude-and-apple-notes">Why AI apps can&apos;t reach Apple Notes</a> explains it.
      </p>

      <h2 id="chatgpt">Connect ChatGPT</h2>
      <p>Pinto Notes is in ChatGPT&apos;s plugin directory, so this takes a couple of minutes and no developer settings. I did it in ChatGPT on the web at chatgpt.com.</p>
      <PostFigure src="/blog/news/chatgpt-pinto-notes-plugin" width={1482} height={736} maxWidth={640}
        alt="The Pinto Notes plugin page in ChatGPT, with Manage and Try in chat buttons above three example requests about to-do lists and a Lisbon trip note."
        caption="The Pinto Notes plugin in ChatGPT, with examples to try. Screenshot: ChatGPT." />
      <Steps>
        <li>
          <strong>Open the Pinto Notes plugin in ChatGPT</strong>
          Use <a href="https://chatgpt.com/plugins/plugin_asdk_app_6ace2593e6008191bdbc937f56ece80f" rel="noopener">this link</a>,
          or open Plugins in ChatGPT&apos;s sidebar and search for Pinto Notes.
        </li>
        <li>
          <strong>Connect it</strong>
          ChatGPT asks Pinto Notes for permission, and a page on pintonotes.com opens. Sign in there (or choose Open Pinto Notes if
          it&apos;s on this computer). Then open Pinto Notes on your Mac, and the page shows a two-digit number.
        </li>
        <li>
          <strong>Type the number in Pinto Notes and choose Allow</strong>
          Pinto Notes asks &ldquo;Allow ChatGPT to use your notes?&rdquo; Type the number from the page, pick Read and edit or Read
          only, and choose Allow. The page takes you back to ChatGPT. If the app asks without a number showing in your browser, or
          you didn&apos;t start this, choose Don&apos;t Allow.
        </li>
        <li>
          <strong>Try it</strong>
          Choose Try in chat, or start a new chat, add Pinto Notes from the tools menu, and ask &ldquo;Search my Pinto Notes and tell me what I wrote most recently.&rdquo;
        </li>
      </Steps>
      <Figure shot={SHOTS.consent} caption="Nothing is shared until you choose Allow, and you pick Read and edit or Read only." />
      <p>
        No Mac nearby? On the page, choose Use your recovery key. Enter your recovery key (Pinto Notes shows it in Settings,
        Privacy &amp; Security), pick Read and edit or Read only, and choose Allow. The key is used on that page only and never sent
        to us, but approving on your device is safer, so use it when you can.
      </p>
      <p>OpenAI renamed some of these pages in 2026. If you see Connectors or Apps instead of Plugins, it&apos;s the same place.</p>

      <h3 id="create-mcp-app-missing">If Create MCP App isn&apos;t there</h3>
      <p>
        You don&apos;t need this for Pinto Notes, which is in the directory. It&apos;s for adding other custom apps: if choosing + in
        Plugins only offers Create plugin and Upload plugin, Developer mode is off. Open
        chatgpt.com/settings/security, turn on Developer mode, go back to Plugins and choose + again. This comes from a{" "}
        <a href="https://community.openai.com/t/create-mcp-app-missing-from-plugins-menu-on-personal-chatgpt-accounts/1401436" rel="noopener">thread
        on OpenAI&apos;s community forum</a> on 28 September 2026, where a Pro user confirmed it for a teammate&apos;s account; OpenAI&apos;s
        docs only say to choose the plus button. In a Business or Enterprise workspace, Developer mode can also be switched off by the
        workspace&apos;s policy, so ask your admin if the toggle isn&apos;t there.
      </p>
      <p>
        Menu labels differ between accounts while OpenAI rolls changes out. I couldn&apos;t check the Developer mode steps in a Plus account
        after the September changes; they follow OpenAI&apos;s <a href="https://developers.openai.com/api/docs/guides/developer-mode" rel="noopener">Developer
        mode guide</a> and <a href="https://developers.openai.com/plugins/deploy/connect-chatgpt" rel="noopener">Connect and test your
        plugin</a>. If yours look different, the <a href="/help#connect">help page</a> is the quickest way to tell me.
      </p>

      <h3 id="devday-2026">What changed at DevDay 2026</h3>
      <PostFigure src="/blog/news/openai-devday-plugin-sidebar" width={1600} height={900} maxWidth={640}
        alt="A ChatGPT window with Canva opened from the sidebar as a plugin panel, asking What will you design today? above template cards for a sales presentation and Instagram posts."
        caption="A plugin opened as a panel beside the chat, one of the DevDay changes. Image: OpenAI." />
      <p>
        At DevDay on 29 September, OpenAI <a href="https://techcrunch.com/2026/09/29/openai-expands-chatgpts-plugins-with-app-like-interfaces-and-automations/" rel="noopener">announced</a> bigger
        plugins: a home in the sidebar, panels next to the chat, a Plugin Creator tool, a new way to submit to the plugin directory,
        per-plugin permission approval, and support for MCP Events, a proposed addition to MCP that lets a plugin start an automation
        when something happens in the connected app. OpenAI gave no dates for each plan. None of it changes the steps above: Pinto
        Notes connects as an MCP app you add yourself, and doesn&apos;t use the new panels or MCP Events yet.
      </p>

      <h2 id="claude">Connect Claude</h2>
      <PostFigure src="/blog/news/anthropic-claude-connectors-directory" width={1600} height={900} maxWidth={700}
        alt="The Connectors directory in the Claude app, listing apps such as Asana, Canva, Gmail, Google Calendar, Google Drive, Linear and Notion."
        caption="Claude's connector directory, where Pinto Notes is listed. Image: Anthropic." />
      <p>
        Pinto Notes is in Claude&apos;s connector directory. Open <a href={CLAUDE_DIRECTORY_URL} rel="noopener">its
        listing</a> on claude.ai or in the Claude desktop app, choose Connect to Claude, sign in, then Allow in Pinto Notes. In Connect
        an AI, Claude gives you the same link. Once it&apos;s added, Claude&apos;s phone apps can use it too. On Team and Enterprise an Owner
        may need to allow it for the organization first.
      </p>
      <p>
        If your Claude app doesn&apos;t show the listing, add <code>{MCP_URL}</code> as a custom connector instead, under Customize,
        Connectors. That works on every Claude plan, and the free plan includes one custom connector.
      </p>

      <h2 id="claude-code">Claude Code and Codex</h2>
      <PostFigure src="/blog/pinto/claude-code-standup-note" width={1250} height={540} maxWidth={620}
        alt="Standup notes in Pinto Notes on a Mac, with the line Claude Code just added tinted and a bar saying Claude Code changed 1 line, with Undo."
        caption="A standup note just after Claude Code added today's line." />
      <p>
        These use an access token instead of a sign-in. On a Mac, choose Claude Code in Connect an AI, then Add to Claude Code, or
        copy the command it shows. For Codex, Pinto Notes gives you a few lines to paste into <code>~/.codex/config.toml</code>.{" "}
        <a href="/blog/notes-in-claude-code-and-codex">Using your notes from Claude Code and Codex</a> has the details.
      </p>

      <h2 id="incredible">Incredible</h2>
      <p>
        <a href="https://incredible.one" rel="noopener">Incredible</a>, the AI assistant my company makes, is a desktop app, and Pinto
        Notes is one of its apps.
      </p>
      <Steps>
        <li><strong>Open Apps in Incredible and search for notes</strong>Choose Connect, and your browser opens Pinto Notes.</li>
        <li>
          <strong>Allow it in Pinto Notes</strong>
          Pinto Notes asks to allow an app on this computer that calls itself &ldquo;incredible&rdquo;. A sign-in that returns to your
          own computer can&apos;t prove which app is asking, so only allow it if you just chose Connect. Pick Read only if Incredible
          should only look things up.
        </li>
        <li><strong>Back in Incredible, choose Let&apos;s go</strong></li>
      </Steps>
      <p>
        On a Windows PC, you sign in on the page that opens and approve on your Mac, or use your recovery key. On an older version of Incredible, where Pinto Notes isn&apos;t in Apps, choose Add it here at the bottom of Apps (or Add
        another MCP server), paste <code>{MCP_URL}</code>, choose Continue, then Sign in. After you choose Allow, choose Add server.
      </p>

      <h2 id="other">Other MCP apps</h2>
      <PostFigure src="/blog/news/mcp-docs-architecture-diagram" width={1920} height={750} maxWidth={760}
        alt="The MCP architecture diagram: AI apps on the left connect through MCP to data, development tools and productivity tools on the right."
        caption="Any app that speaks MCP can connect the same way. Image: Model Context Protocol." />
      <p>
        Any other app that supports MCP connects the same way: add <code>{MCP_URL}</code>, sign in when it asks, then choose Allow.
        The <a href="/blog/mcp-server">Pinto Notes MCP server page</a> has the address, the sign-in and every tool.
      </p>

      <h2 id="control">You stay in control</h2>
      <NoteMoment
        me="Add what I still need to pack for Lisbon to my Packing note."
        reply="Added three things to Packing in Pinto Notes: adapter, sunscreen and the museum tickets."
        title="Packing"
        lines={[
          { text: "Passport", done: true },
          { text: "Rain jacket", done: true },
          { text: "Plug adapter (type F)", by: true },
          { text: "Sunscreen", by: true },
          { text: "Print museum tickets", by: true },
        ]}
        caption="When ChatGPT changes a note, the new lines are tinted and you can undo the change."
      />
      <ul>
        <li>Nothing is shared until you choose Allow: in Pinto Notes on your Mac, after typing the number your browser shows, or on pintonotes.com with your recovery key.</li>
        <li>You choose Read only, or Read and edit, for each assistant.</li>
        <li>When an assistant changes a note, Pinto Notes shows what changed, with Undo, and keeps the previous version in the note&apos;s history (File, Show Version History).</li>
        <li>Connect an AI lists everything that&apos;s connected. Choose Disconnect, and it loses access right away.</li>
      </ul>
      <p>
        ChatGPT says apps can come with elevated risk, and OpenAI&apos;s Developer mode guide spells it out: the model can make mistakes
        on write actions, and a malicious server could try to take your data. That&apos;s why Pinto Notes asks you to allow each app, lets you pick Read only, and keeps every earlier version.
      </p>

      <h2 id="ask">Things to ask once it&apos;s connected</h2>
      <PostFigure src="/blog/pinto/habit-tracker-main-mac-light" width={1280} height={900} maxWidth={600}
        alt="The habit tracker template in Pinto Notes on a Mac: Today, 2 of 6 done, streaks for each habit, and a dot grid for the week."
        caption="The habit tracker template, which ChatGPT or Claude can fill in. Example data." />
      <Keep title="Five first things to ask" text={PROMPTS}
        note={<>For a to-do list you tick on your phone, ask ChatGPT to keep it as a checklist in one note.</>}>
        <ul>
          {PROMPTS.split("\n").map((p) => <li key={p}>&ldquo;{p}&rdquo;</li>)}
        </ul>
      </Keep>
      <p>
        Or start from a <a href="/templates">template</a>: a ready note, some with their own app, that ChatGPT or Claude can fill in, like
        the <a href="/templates/habit-tracker">habit tracker</a> or <a href="/templates/meeting-notes">meeting notes</a>.
      </p>
      <p>
        The part I like most comes later. Connect Claude too, and both work in the same notebook: tell ChatGPT about your trip on
        Monday, and on Wednesday Claude already knows where you wrote it down. You stop explaining yourself to every chat.
      </p>
    </PostPage>
  );
}
