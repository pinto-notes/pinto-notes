import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Path, Steps } from "@/lib/PostParts";
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

const FAQ = [
  { q: "Which ChatGPT plans can add Pinto Notes?", a: [
    "Adding your own app in ChatGPT needs Developer mode, which OpenAI's developer docs list for Plus, Pro, Business, Enterprise and Edu, on the web. The free plan can't add one. Check what your plan allows before you rely on edits: OpenAI's pages differ on whether such apps can write on every plan. OpenAI also says Developer mode can depend on account and workspace policy, so in a Business or Enterprise workspace an admin may have to allow it.",
  ] },
  { q: "Does it work in the ChatGPT app on my phone?", a: [
    "You add Pinto Notes once, in ChatGPT on the web. OpenAI's developer docs only describe the web, and I haven't been able to recheck the phone apps in a Plus account since the September changes, so treat phone access as unverified for now.",
  ] },
  { q: "Why don't I see Create MCP App in ChatGPT?", a: [
    "Developer mode is probably off. Turn it on in Settings, Security and login (chatgpt.com/settings/security), then go back to Plugins and choose + again. Without it, the menu only offers Create plugin and Upload plugin. That fix comes from a ChatGPT Pro user on OpenAI's community forum on 28 September 2026, not from OpenAI's docs.",
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
      intro={<>I wanted ChatGPT&apos;s changes to land in my notes, not in a chat I&apos;d have to copy from. Here&apos;s the setup, and how you stay in control.</>}
      answer={
        <Answer jump={[
          { href: "#which", label: "Which AI, and what you need" },
          { href: "#chatgpt", label: "ChatGPT step by step" },
          { href: "#create-mcp-app-missing", label: "Create MCP App missing" },
          { href: "#claude", label: "Claude" },
          { href: "#control", label: "You stay in control" },
        ]}>
          <p>
            ChatGPT can&apos;t edit Apple Notes. It can edit Pinto Notes, the notes app for iPhone and Mac that I make. With ChatGPT
            Plus or higher, on the web: turn on Developer mode, add Pinto Notes in Plugins with Create MCP App, then type the
            two-digit number on your iPhone or Mac and choose Allow. For Claude, connect from its directory listing.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="which">Which AI, and what you need</h2>
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
            <tr><th scope="row"><a href="#chatgpt">ChatGPT</a></th><td>On the web, in Plugins, with Developer mode on</td><td>Plus, Pro, Business, Enterprise or Edu</td></tr>
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
      <p>Do this in ChatGPT on the web, at chatgpt.com. That&apos;s where OpenAI documents custom apps; I haven&apos;t confirmed them in the phone apps.</p>
      <Steps>
        <li>
          <strong>Open Connect an AI in Pinto Notes</strong>
          <Path steps={["Pinto Notes", "Settings", "Connect an AI"]} /> If your notes are in Apple Notes, <a href="/blog/move-from-apple-notes">import them first</a>.
        </li>
        <li>
          <strong>Choose ChatGPT, then Copy Address and Open ChatGPT</strong>
          Pinto Notes copies its address and opens ChatGPT&apos;s Plugins page. The steps stay on screen while you work.
        </li>
        <li>
          <strong>Turn on Developer mode in ChatGPT</strong>
          <Path steps={["Settings", "Security and login", "Developer mode"]} /> You only do this once.
        </li>
        <li>
          <strong>In Plugins, choose +</strong>
          On accounts that show a menu, choose Create MCP App. Name it Pinto Notes, paste the address as the connection, choose OAuth, then Create.
        </li>
        <li>
          <strong>Sign in on the page that opens</strong>
          ChatGPT asks Pinto Notes for permission, and a page on pintonotes.com opens. Sign in there (or choose Open Pinto Notes if
          it&apos;s on this computer). Then open Pinto Notes on your iPhone or Mac, and the page shows a two-digit number.
        </li>
        <li>
          <strong>Type the number in Pinto Notes and choose Allow</strong>
          Pinto Notes asks &ldquo;Allow ChatGPT to use your notes?&rdquo; Type the number from the page, pick Read and edit or Read
          only, and choose Allow. The page takes you back to ChatGPT. If the app asks without a number showing in your browser, or
          you didn&apos;t start this, choose Don&apos;t Allow.
        </li>
        <li>
          <strong>Try it</strong>
          Start a new chat, add Pinto Notes from the tools menu, and ask &ldquo;Search my Pinto Notes and tell me what I wrote most recently.&rdquo;
        </li>
      </Steps>
      <Figure shot={SHOTS.consent} caption="Nothing is shared until you choose Allow, and you pick Read and edit or Read only." />
      <p>
        No iPhone or Mac nearby? On the page, choose Use your recovery key. Enter your recovery key (Pinto Notes shows it in Settings,
        Privacy &amp; Security), pick Read and edit or Read only, and choose Allow. The key is used on that page only and never sent
        to us, but approving on your device is safer, so use it when you can.
      </p>
      <p>OpenAI renamed some of these pages in 2026. If you see Connectors or Apps instead of Plugins, it&apos;s the same place.</p>

      <h3 id="create-mcp-app-missing">If Create MCP App isn&apos;t there</h3>
      <p>
        If choosing + in Plugins only offers Create plugin and Upload plugin, Developer mode is off. Open
        chatgpt.com/settings/security, turn on Developer mode, go back to Plugins and choose + again. This comes from a{" "}
        <a href="https://community.openai.com/t/create-mcp-app-missing-from-plugins-menu-on-personal-chatgpt-accounts/1401436" rel="noopener">thread
        on OpenAI&apos;s community forum</a> on 28 September 2026, where a Pro user confirmed it for a teammate&apos;s account; OpenAI&apos;s
        docs only say to choose the plus button. In a Business or Enterprise workspace, Developer mode can also be switched off by the
        workspace&apos;s policy, so ask your admin if the toggle isn&apos;t there.
      </p>
      <p>
        Menu labels differ between accounts while OpenAI rolls changes out. I couldn&apos;t check these steps in a Plus account after
        the September changes; they follow OpenAI&apos;s <a href="https://developers.openai.com/api/docs/guides/developer-mode" rel="noopener">Developer
        mode guide</a> and <a href="https://developers.openai.com/plugins/deploy/connect-chatgpt" rel="noopener">Connect and test your
        plugin</a>. If yours look different, the <a href="/help#connect">help page</a> is the quickest way to tell me.
      </p>

      <h3 id="devday-2026">What changed at DevDay 2026</h3>
      <p>
        At DevDay on 29 September, OpenAI <a href="https://techcrunch.com/2026/09/29/openai-expands-chatgpts-plugins-with-app-like-interfaces-and-automations/" rel="noopener">announced</a> bigger
        plugins: a home in the sidebar, panels next to the chat, a Plugin Creator tool, a new way to submit to the plugin directory,
        per-plugin permission approval, and support for MCP Events, a proposed addition to MCP that lets a plugin start an automation
        when something happens in the connected app. OpenAI gave no dates for each plan. None of it changes the steps above: Pinto
        Notes connects as an MCP app you add yourself, and doesn&apos;t use the new panels or MCP Events yet.
      </p>

      <h2 id="claude">Connect Claude</h2>
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
        On a Windows PC, you sign in on the page that opens and approve on your iPhone or Mac, or use your recovery key. On an older version of Incredible, where Pinto Notes isn&apos;t in Apps, choose Add it here at the bottom of Apps (or Add
        another MCP server), paste <code>{MCP_URL}</code>, choose Continue, then Sign in. After you choose Allow, choose Add server.
      </p>

      <h2 id="other">Other MCP apps</h2>
      <p>
        Any other app that supports MCP connects the same way: add <code>{MCP_URL}</code>, sign in when it asks, then choose Allow.
        The <a href="/blog/mcp-server">Pinto Notes MCP server page</a> has the address, the sign-in and every tool.
      </p>

      <h2 id="control">You stay in control</h2>
      <Figure shot={SHOTS.aiEdit} caption="When ChatGPT changes a note, the new lines are tinted and you can undo the change." />
      <ul>
        <li>Nothing is shared until you choose Allow: in Pinto Notes on your iPhone or Mac, after typing the number your browser shows, or on pintonotes.com with your recovery key.</li>
        <li>You choose Read only, or Read and edit, for each assistant.</li>
        <li>When an assistant changes a note, Pinto Notes shows what changed, with Undo, and keeps the previous version in the note&apos;s history (File, Show Version History).</li>
        <li>Connect an AI lists everything that&apos;s connected. Choose Disconnect, and it loses access right away.</li>
      </ul>
      <p>
        OpenAI calls Developer mode elevated risk: the model can make mistakes on write actions, and a malicious server could try to
        take your data. That&apos;s why Pinto Notes asks you to allow each app, lets you pick Read only, and keeps every earlier version.
      </p>

      <h2 id="ask">Things to ask once it&apos;s connected</h2>
      <Keep title="Five first things to ask" text={PROMPTS}
        note={<>For a to-do list you tick on your phone, see <a href="/for/chatgpt">how to use ChatGPT as a to-do list</a>.</>}>
        <ul>
          {PROMPTS.split("\n").map((p) => <li key={p}>&ldquo;{p}&rdquo;</li>)}
        </ul>
      </Keep>
      <p>
        Or start from a <a href="/templates">template</a>: a ready note, some with their own app, that ChatGPT or Claude can fill in, like
        the <a href="/templates/habit-tracker">habit tracker</a> or <a href="/templates/meeting-notes">meeting notes</a>.{" "}
        <a href="/for/chatgpt">Pinto Notes for ChatGPT</a> has three more ideas, from a running plan to a note that becomes a tracker.
      </p>
      <PostCta slug="connect-chatgpt-to-your-notes" position="how-amber-helps" title="Get Pinto Notes on your Mac">
        <p>Free, with the MCP server built in. Connect ChatGPT or Claude from Settings, and every change they make can be undone.</p>
      </PostCta>
    </PostPage>
  );
}
