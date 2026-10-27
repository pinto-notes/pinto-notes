import { Figure } from "@/lib/blog";
import { AIConnect } from "@/lib/AIConnect";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-api", { title: "Apple Notes API and MCP: what works, since Apple says no" });

// Rewritten by hand on 14 October 2026 to the blog bar (amber-site/BLOG-BAR.md) and Emil's recipe. What ranks
// for "apple notes api": Apple's developer forum (thread 813810, January 2026, where Quinn of Apple DTS answers
// "No."), an older forum thread, and MCP server listings. None of them say plainly what each route can and can't
// do for an ordinary person, or what to do if what you wanted was ChatGPT or Claude on your phone. This post does.
// The forum picture is a capture of the public thread, 14 Oct. Script Editor, Terminal and Shortcuts pictures: macOS 27
// throwaway VM, On My Mac, 14 Oct (captures/mac/api/CAPTURES.md lists all 24 Notes actions; no edit action;
// Script Editor ran without a prompt, osascript in Terminal asked). The Claude prompt is Pinto's existing capture.
// Facts: AppleScript on macOS only (Apple DTS); Shortcuts on iOS can't drive Notes from another app (Apple DTS);
// Notes' own Shortcuts actions run on the device; community MCP servers and Claude's Apple Notes extension drive
// the Notes app on a Mac with AppleScript; Pinto Notes' MCP server: supabase/functions/mcp (search, fetch, edit,
// create, write ...; OAuth with approval in the app; access tokens for Claude Code and Codex).

const FAQ = [
  { q: "Does Apple Notes have an API?", a: [
    "No. An Apple engineer answered exactly that on Apple's developer forum in January 2026: \"No.\" There's no web or cloud API, and nothing outside your devices can read your notes in iCloud. On a Mac you can script the Notes app with AppleScript, and Notes' own Shortcuts actions run on your iPhone or Mac.",
  ] },
  { q: "Can I read Apple Notes from Python?", a: [
    "On a Mac, yes: Python runs an AppleScript through the osascript command, and Notes answers with each note's title, dates and body as HTML. macOS asks once whether your terminal may control Notes.",
  ] },
  { q: "Can ChatGPT or Claude read my Apple Notes?", a: [
    "Only Claude on a Mac, through its Apple Notes extension or a community MCP server, and only while that Mac is on. ChatGPT, and Claude on the web or your iPhone, can't reach Apple Notes at all.",
  ] },
  { q: "Will Apple add a Notes API?", a: [
    "Apple hasn't said. Its engineer's advice in January 2026 was to file an enhancement request for one, like the APIs Calendar and Contacts already have.",
  ] },
];

const APPLESCRIPT = `tell application "Notes"
	set titles to name of every note
	set firstBody to body of note 1
	make new note at folder "Notes" with properties {name:"Groceries", body:"<h1>Groceries</h1><div>Milk</div>"}
end tell`;

const PYTHON = `import subprocess

script = 'tell application "Notes" to get name of every note'
out = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
print(out.stdout)`;

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-api"
      intro={<>
        If you searched this, you probably wanted something else to get at your notes: a script, an app, or most likely ChatGPT or
        Claude. I went looking for the official answer and found it, straight from Apple. Here it is, every way around it that works
        today, and the one thing none of them can do.
      </>}
      answer={
        <Answer jump={[
          { href: "#apple", label: "Apple's answer" },
          { href: "#applescript", label: "AppleScript" },
          { href: "#shortcuts", label: "Shortcuts" },
          { href: "#claude-mac", label: "Apple Notes MCP" },
          { href: "#missing", label: "What none of them do" },
        ]}>
          <p>
            No. Apple has no Notes API, and an Apple engineer said so in January 2026. What works runs through the Notes app on your own
            device: AppleScript on a Mac, Notes&apos; Shortcuts actions on iPhone and Mac, and Claude&apos;s Apple Notes extension on a
            Mac. Nothing in the cloud, so ChatGPT and Claude on your phone can&apos;t reach your notes.
          </p>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/apple-dts-notes-api-answer" width={1176} height={720} maxWidth={588}
        alt="Apple's developer forum, January 2026. Asked whether there is an API for Apple Notes, an Apple DTS Engineer answers No. Asked whether it's possible through AppleScript on a Mac, the answer is Correct. The asker then says the app should also run on iOS."
        caption="Apple's developer forum, January 2026. The accepted answer, from Apple's Developer Technical Support." />}
      faq={FAQ}
    >
      <h2 id="apple">Apple&apos;s answer: no</h2>
      <p>
        The thread is short. Someone asks whether Apple Notes has an API. Quinn, from Apple&apos;s Developer Technical Support, answers
        with one word: &ldquo;No.&rdquo; AppleScript on a Mac? &ldquo;Correct.&rdquo; And on iPhone? Shortcuts can&apos;t fill the gap,
        because a shortcut can call your app but can&apos;t drive Notes for you. His advice is to <a href="https://developer.apple.com/forums/thread/813810" rel="noopener">file
        an enhancement request</a>, like the ones that gave Calendar and Contacts their APIs.
      </p>
      <p>So everything that follows goes through the Notes app itself, on a device that&apos;s switched on.</p>

      <h2 id="applescript">AppleScript, on a Mac</h2>
      <PostFigure src="/blog/macos27/notes27-api-script-editor-names" width={1400} height={592} maxWidth={700}
        alt="Script Editor on macOS 27 running: tell application Notes to get name of every note. The Result pane lists Reading list, Daily log, Book club picks, Packing list for Lisbon and Weekly groceries."
        caption="One line of AppleScript in Script Editor, and Notes lists every note it has. Tested on macOS 27." />
      <p>
        This is the closest thing to an API. The Notes app answers AppleScript: list every note, read one (its body comes back as HTML,
        or as plain text if you ask for its <code>plaintext</code>), or make a new one. Script Editor is in Applications, Utilities.
      </p>
      <Keep title="Read and write notes with AppleScript" text={APPLESCRIPT} code
        note="Run it in Script Editor, or with osascript in Terminal. Locked notes stay closed." />
      <p>Python has no Notes library; it runs the same script through <code>osascript</code>:</p>
      <Keep title="The same from Python" text={PYTHON} code />
      <PostFigure src="/blog/macos27/notes27-api-terminal-control-prompt" width={1752} height={800} maxWidth={700}
        alt="Terminal on macOS 27 running osascript with the Notes script. A dialog says: Terminal wants access to control Notes. Allowing control will provide access to documents and data in Notes, and to perform actions within that app. Don't Allow or Allow."
        caption="Run from Terminal, macOS asks once whether Terminal may control Notes." />
      <p>
        Run from Terminal or Python, macOS asks once whether that app may control Notes, and the answer covers everything in it. In my
        test, Script Editor didn&apos;t ask at all.
      </p>

      <h2 id="shortcuts">Shortcuts, on iPhone and Mac</h2>
      <PostFigure src="/blog/apple/mac-shortcuts-notes-action" width={1960} height={1306} maxWidth={700}
        alt="Apple's press image for macOS Tahoe 26: a shortcut called Check Notes that transcribes a lecture recording, asks an Apple Intelligence model what the note is missing, and adds the answer to a note open beside it in Notes."
        caption="Apple's own example: a shortcut that adds to a note. The middle step is Apple Intelligence, not ChatGPT or Claude. Image: Apple." />
      <PostFigure src="/blog/macos27/notes27-api-shortcut-append" width={2048} height={980} maxWidth={700}
        alt="A shortcut called Log a run in Shortcuts on macOS 27 with one action: Append Tue: ran 6 km to Daily log. The action list on the right is filtered to Notes actions."
        caption="A one-action shortcut: append a line to the Daily log note." />
      <PostFigure src="/blog/macos27/notes27-api-note-after-append" width={2000} height={640} maxWidth={700}
        alt="The Daily log note in Apple Notes after the shortcut ran: Mon: ran 5 km, then the new line Tue: ran 6 km at the end."
        caption="After it ran: the new line lands at the end of the note." />
      <p>
        Notes gives Shortcuts 24 actions on macOS 27: create, find, open, pin, move and delete notes, append to one, add a checklist item,
        tag them, and manage folders. That&apos;s enough for a button on your Home Screen that adds a line to your work log, like the one
        above. There&apos;s no action to edit a note, though: Append to Note only adds at the end. And Shortcuts can&apos;t let another
        app read your notes, which is the part of the API people usually want.
      </p>

      <h2 id="claude-mac">Apple Notes MCP servers, compared</h2>
      <Figure shot={SHOTS.coworkAllow} caption="The prompt macOS shows the first time Claude uses its Apple Notes extension." />
      <p>
        An MCP server is how Claude, Claude Code or Codex gets tools for another app. Apple doesn&apos;t make one for Notes, so every Apple
        Notes MCP server is a small program on your Mac that drives the Notes app with AppleScript, or reads its database directly. These
        are the ones worth knowing, checked on their own pages on 17 October 2026:
      </p>
      <div className="tableWrap">
        <table>
          <thead><tr><th scope="col">Server</th><th scope="col">What the AI can do</th><th scope="col">Works with</th><th scope="col">Good to know</th></tr></thead>
          <tbody>
            <tr><th scope="row">Claude&apos;s Apple Notes extension</th><td>Search, read and edit notes</td><td>Claude desktop app</td><td>From Anthropic; one click in Claude&apos;s extensions, no setup</td></tr>
            <tr><th scope="row"><a href="https://github.com/sweetrb/apple-notes-mcp" rel="noopener">apple-notes-mcp</a> (sweetrb)</th><td>Read, search, create, edit and move notes; folders, tags, checklists, tables, export</td><td>Claude Code, Claude Desktop, Codex</td><td>The most complete and actively updated; installs with one <code>npx</code> command; needs Node.js</td></tr>
            <tr><th scope="row"><a href="https://github.com/sirmews/apple-notes-mcp" rel="noopener">apple-notes-mcp</a> (sirmews)</th><td>Read and search only</td><td>Claude Desktop</td><td>Reads the Notes database; skips locked notes; can&apos;t create or edit</td></tr>
            <tr><th scope="row"><a href="https://github.com/RafalWilinski/mcp-apple-notes" rel="noopener">mcp-apple-notes</a></th><td>Search by meaning, not just words</td><td>Claude Desktop</td><td>Builds a local search index; not updated since December 2024</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        For Claude Code or Codex, the sweetrb server is the one I&apos;d use: <code>claude mcp add apple-notes -s user -- npx -y apple-notes-mcp</code>,
        then allow the Automation prompt the first time it opens Notes. In the Claude app, the built-in extension is simpler.{" "}
        <a href="/blog/claude-and-apple-notes">Claude and Apple Notes</a> walks through it.
      </p>
      <p>
        They share the same limits: they run on your Mac, only while it&apos;s awake, and macOS asks for Automation (and sometimes Full Disk
        Access) first. None of them reach your notes from Claude on your iPhone, from the web, or from ChatGPT.
      </p>

      <h2 id="missing">What none of them can do</h2>
      <PostFigure src="/blog/drawn/mac-asleep" width={1200} height={750} maxWidth={560}
        alt="A drawn closed laptop with a moon on it, and an iPhone showing the ChatGPT logo, joined by a broken dotted line."
        caption="When the Mac sleeps, every route into Apple Notes stops." />
      <p>
        Every route above needs your Mac on and the Notes app open behind it. None of them reach your notes from anywhere else. Ask
        ChatGPT on your phone to add milk to your groceries note and it can&apos;t. Tell Claude in the browser about your trip on Monday,
        and on Wednesday it has no idea where you wrote it down.
      </p>
      <p>
        That&apos;s the real problem behind &ldquo;Apple Notes API&rdquo;: the AIs you talk to all day can&apos;t see the notes you keep,
        so you keep pasting things in and explaining yourself again.
      </p>

      <h2 id="pinto-notes">Notes your AIs can actually use</h2>
      <AIConnect ais={["claude", "claude-code", "codex"]} caption="One notebook that Claude, Claude Code and Codex all read and write today." />
      <p>
        That&apos;s why I made Pinto Notes. It looks and feels like Apple Notes, brings your notes over in <a href="/blog/move-from-apple-notes">one
        import</a>, and has the API Apple Notes doesn&apos;t: a server that Claude, Claude Code and Codex connect to today (ChatGPT is coming soon), with your OK in the app, read only or read and edit. Then they share one notebook. Tell Claude on Monday, and Codex can read it on Wednesday. For developers, the <a href="/blog/mcp-server">MCP server page</a> has the address, the tools and access tokens for
        scripts.
        {APP_STORE_LIVE
          ? <> It&apos;s free on Mac and iPhone.</>
          : <> It&apos;s free on the Mac today, with the iPhone app coming soon.</>}
      </p>
    </PostPage>
  );
}
