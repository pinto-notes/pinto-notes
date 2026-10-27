import { Figure } from "@/lib/blog";
import { AIConnect } from "@/lib/AIConnect";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import { CLAUDE_DIRECTORY_URL, MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("claude-and-apple-notes", {
  title: "Can Claude read your Apple Notes? What works in 2026",
});

const FAQ = [
  { q: "Can Claude read my Apple Notes?", a: [
    "Yes, on a Mac. The Claude desktop app can read, create and update Apple Notes through Anthropic's Read and Write Apple Notes extension, and community MCP servers let Claude Desktop and Claude Code do the same. It all runs on the Mac where your notes are, so it doesn't work from Claude on iPhone or on the web.",
  ] },
  { q: "Can Claude on my iPhone see my Apple Notes?", a: [
    "Not directly, and iOS 27 doesn't change that. Apple Notes has no public API and no way for an outside service to reach your notes in iCloud. The workaround is to run an Apple Notes MCP server on your Mac and expose it to the internet through a tunnel, which only works while that Mac is on and needs care to keep private. Siri in iOS 27 can hand requests to ChatGPT, but Claude isn't offered there. The simpler way is to move your notes to an app that has its own MCP server.",
  ] },
  { q: "Why is the Apple Notes connector not working in Claude?", a: [
    "Most often because it's being used outside the Claude desktop app on a Mac: it doesn't work on claude.ai or in Claude on iPhone. On the Mac, check that Claude may control Notes in System Settings, Privacy & Security, Automation, then quit and reopen Claude. It also can't read locked notes, and it only sees notes while that Mac is awake.",
  ] },
  { q: "Does Apple make a way for Claude to use Apple Notes?", a: [
    "No. Apple offers no API or MCP server for Notes. Anthropic's Read and Write Apple Notes extension and the community MCP servers on GitHub all drive the Notes app on your Mac through AppleScript.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="claude-and-apple-notes"
      intro={<>
        Short answer: on a Mac, yes. On your iPhone and in the browser, no. Anthropic even makes its own Apple Notes extension, and it
        works well inside its limits. Here&apos;s why it depends on where you use Claude, what each option can do, and the gap none of them
        close.
      </>}
      hero={<PostFigure priority src="/blog/claude/anthropic-apple-notes-connector" width={1568} height={634} maxWidth={700}
        alt="Claude's marketplace page for the Read and Write Apple Notes connector: read, write, and manage notes in Apple Notes. Made by Anthropic, added August 2025, with an Add to Claude button."
        caption="Anthropic's own Apple Notes extension, in Claude's directory. It runs in the Claude app on a Mac." />}
      faq={FAQ}
    >
      <h2>Why it depends on where you use Claude</h2>
      <PostFigure src="/blog/apple/apple-dts-notes-api-answer" width={1176} height={720} maxWidth={560}
        alt="An Apple Developer Forums thread where an Apple engineer answers No to whether there is an API for Apple Notes."
        caption="Apple's own answer on its developer forums. Image: Apple." />
      <p>
        Apple Notes has no public API. Your notes live in iCloud, and Apple doesn&apos;t let outside services read them there. The only
        way in is the Notes app itself, on a Mac, through AppleScript. So anything that connects Claude to Apple Notes has to run on a
        Mac that has your notes on it, and it only works while that Mac is on.
      </p>
      <p>
        Claude on the web and Claude on iPhone run in Anthropic&apos;s cloud. They can only reach apps that offer a server on the
        internet, and Apple Notes doesn&apos;t have one. You can make one: run an Apple Notes MCP server on your Mac and expose it through a
        tunnel, then add it as a custom connector. It only works while that Mac is awake, and anything you put on the internet that way
        needs its own protection.
      </p>

      <h2>Your options</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Where it works</th><th scope="col">What Claude can do</th><th scope="col">Setup</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Copy and paste</th><td>Anywhere</td><td>Read what you paste; you copy the answer back</td><td>None</td></tr>
            <tr><th scope="row">Anthropic&apos;s Read and Write Apple Notes extension</th><td>Claude desktop app on your Mac</td><td>Read, create and update notes; checklists turn into plain bullets when it updates a note</td><td>Install it from the connectors directory in Claude for Mac</td></tr>
            <tr><th scope="row">Community Apple Notes MCP server</th><td>Claude Desktop or Claude Code on your Mac</td><td>Search, read, create and edit, depending on the server</td><td>Install it and edit Claude&apos;s config; allow Automation in macOS</td></tr>
            <tr><th scope="row">A notes app with its own MCP server, like Pinto Notes</th><td>Claude on the web, desktop, iPhone and Claude Code</td><td>Search, read, create and edit, with your approval and Undo</td><td>Import your notes once, then add a custom connector</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Option 1: the Claude desktop app on a Mac</h2>
      <p>
        Claude&apos;s connectors directory includes desktop extensions, which work with apps on your computer. Anthropic publishes one
        for Notes, Read and Write Apple Notes, with tools to read a note, add a note and update a note&apos;s content. It&apos;s the
        simplest route if you only use Claude on your Mac.
      </p>
      <p>
        One limit to know before you let it edit: Apple Notes checklists aren&apos;t part of what AppleScript can read or write, so when the
        extension updates a note, its checkboxes become plain bullets and their ticks are lost. That was
        reported <a href="https://github.com/anthropics/claude-ai-mcp/issues/29" rel="noopener">on Anthropic&apos;s tracker</a> in
        January 2026 and closed as not planned.
      </p>

      <h3 id="not-working">If the Apple Notes connector isn&apos;t working</h3>
      <Figure shot={SHOTS.coworkAllow} caption="The macOS prompt the extension needs. Choose Allow." />
      <ul>
        <li>It only works in the Claude desktop app on a Mac. On claude.ai or in Claude on iPhone, the tools won&apos;t appear.</li>
        <li>macOS has to let Claude control Notes. In System Settings, Privacy &amp; Security, Automation, check that Claude is allowed to control Notes.</li>
        <li>After installing it or changing that permission, quit Claude completely and open it again.</li>
        <li>It reads what the Notes app on that Mac has. If a note is missing, check that it has synced to the Mac, and that it isn&apos;t locked.</li>
      </ul>

      <h2>Option 2: a community MCP server</h2>
      <p>
        Developers have built MCP servers that drive the Notes app with AppleScript. The most actively maintained one in September
        2026 is <a href="https://github.com/sweetrb/apple-notes-mcp" rel="noopener">sweetrb/apple-notes-mcp</a>, which can search,
        create and update notes. Follow its README to add it to Claude Desktop or Claude Code. Expect a macOS prompt asking whether
        Claude may control Notes. <a href="/blog/apple-notes-api">Apple Notes has no API</a> explains
        why every route like this one runs through a Mac.
      </p>
      <PostFigure src="/blog/macos27/notes27-api-script-editor-names" width={1400} height={592} maxWidth={640}
        alt="Script Editor on a Mac getting the name of every note from Notes, with a list of note titles as the result."
        caption="AppleScript, the only way into Notes, and what every community server uses." />
      <p>Things to know:</p>
      <ul>
        <li>It only works on the Mac it&apos;s installed on, while that Mac is awake.</li>
        <li>AppleScript reads and writes a note as HTML, so depending on the server, an edit can lose formatting such as checklists.</li>
        <li>Apple Notes keeps no version history, so a change Claude makes can&apos;t be rolled back from the Notes app.</li>
        <li>Locked notes can&apos;t be read.</li>
      </ul>

      <h2>What changed in iOS 27</h2>
      <p>
        iOS 27 and macOS 27 came out on 14 September with a new Siri, but nothing that gives Claude a way into Apple Notes:
      </p>
      <PostFigure src="/blog/apple/apple-siri-ai-app-chat" width={1306} height={1829} maxWidth={320}
        alt="Siri AI on an iPhone, in the new Siri app: a typed conversation about a park in Mexico City."
        caption="The new Siri in iOS 27 reads your notes; Claude still can't. Image: Apple." />
      <ul>
        <li>Siri AI can search your notes itself. It can also pass a request to ChatGPT through the ChatGPT extension. Claude isn&apos;t offered
          as an extension; MacRumors found code for other providers and <a href="https://www.macrumors.com/2026/09/14/siri-can-be-swapped-out-for-chatgpt-claude/" rel="noopener">reported</a> that
          Claude isn&apos;t available yet.</li>
        <li>Apple hasn&apos;t shipped MCP support in iOS 27 or macOS 27. Code for it was spotted in a macOS 26.1 beta, and that&apos;s all.</li>
        <li>Claude on iPhone can use connectors you add on claude.ai, but only ones with a server on the internet, which Apple Notes still lacks.</li>
      </ul>
      <p>
        The rest of what&apos;s new, from divider lines to Markdown copy and paste, is in <a href="/blog/apple-notes-ios-27">Apple Notes in iOS 27
        and macOS 27</a>.
      </p>

      <h2>What none of these fix</h2>
      <PostFigure src="/blog/drawn/claude-asleep" width={1200} height={750} maxWidth={560}
        alt="A drawn closed laptop with a moon, a notes icon, and a phone with the Claude logo, with the line to the phone crossed out."
        caption="Close the lid, and Claude loses your notes." />
      <p>
        Every option above lives on one Mac. Close the lid and Claude loses your notes. Open Claude on your phone on the way to work and
        they aren&apos;t there at all. And Claude is only one of the AIs you use: what you planned with ChatGPT yesterday is still stuck in
        ChatGPT.
      </p>
      <p>
        The real wish behind &ldquo;Claude and Apple Notes&rdquo; is simpler: one notebook that Claude can read and write wherever you open
        it, that your other AIs share, and that still feels like Apple Notes.
      </p>

      <h2>Option 3: move your notes to an app Claude can reach</h2>
      <AIConnect ais={["claude", "claude-code"]} caption="Claude and Claude Code in one notebook, from the web, the desktop app and your phone." />
      <p>
        Pinto Notes is a free, open-source notes app for Mac (iPhone coming soon) that works like Apple Notes and has an MCP server built in. You
        import your Apple Notes once, on your Mac, then open <a href={CLAUDE_DIRECTORY_URL} rel="noopener">Pinto Notes in Claude&apos;s connector directory</a> and
        choose Connect to Claude. After that Claude can search,
        read and edit your notes from claude.ai, the desktop app, the iPhone app and Claude Code.
      </p>
      <Figure shot={SHOTS.consent} caption="Whichever AI asks, Pinto Notes shows this sheet. Here it names ChatGPT; for Claude it names Claude." />
      <ul>
        <li>You approve Claude in Pinto Notes on your Mac, typing the number your browser shows, and choose Read Only, or Read and Edit.</li>
        <li>Checklists stay checklists: Pinto Notes stores notes as Markdown, and Claude ticks an item without rewriting the note.</li>
        <li>When Claude changes a note, Pinto Notes shows what changed, with Undo, and keeps the previous version.</li>
        <li>Pinto Notes is listed in Claude&apos;s connector directory, so there&apos;s no address to paste. If your Claude app doesn&apos;t show the listing, add <code>{MCP_URL}</code> as a custom connector instead; that works on every plan, and the free plan includes one.</li>
      </ul>
      <p>
        Connect ChatGPT too and they share it: tell ChatGPT on Monday, and Claude knows on Wednesday. The catch: your notes move to Pinto
        Notes, so you&apos;d write there instead of in Apple Notes. The import leaves Apple Notes
        untouched, so you can try it and go back. <a href="/blog/move-from-apple-notes">How to move from Apple Notes</a>, then{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connect Claude</a>. For Claude Code, see{" "}
        <a href="/blog/notes-in-claude-code-and-codex">using your notes from Claude Code and Codex</a>.
      </p>

      <h2>Which one to pick</h2>
      <PostFigure src="/blog/drawn/claude-three" width={1200} height={750} maxWidth={560}
        alt="The Claude logo with three paths: to a laptop, to a terminal, and to a phone with a note."
        caption="Three ways to give Claude your notes." />
      <ul>
        <li>You use Claude only on your Mac and your notes have few checklists: the desktop extension.</li>
        <li>You&apos;re comfortable with a config file and want Claude to write to Apple Notes on your Mac: a community MCP server.</li>
        <li>You want Claude to use your notes from your phone or the web, with a way to undo its changes: a notes app with its own MCP server. <a href="/blog/notes-apps-with-mcp">Notes apps with an MCP server, compared</a> lists them.</li>
      </ul>
    </PostPage>
  );
}
