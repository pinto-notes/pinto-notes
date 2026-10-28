import { NoteMoment } from "@/lib/NoteMoment";
import { SHOTS } from "@/lib/posts";
import { Figure } from "@/lib/blog";
import { AIConnect } from "@/lib/AIConnect";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Capture, Keep, PostFigure, Steps } from "@/lib/PostParts";
import { CLAUDE_DIRECTORY_URL, MCP_URL } from "@/lib/facts";

export const dynamic = "force-static";
export const metadata = postMetadata("claude-memory-vs-notes", { title: "Claude memory vs notes: what each one keeps" });

const FAQ = [
  { q: "Can ChatGPT or other apps read Claude's memory?", a: [
    "No. It lives in your Claude account. Claude can export it as text, and import what ChatGPT or another assistant remembers, but that's a one-time copy, not a shared memory. A note in an app with an MCP server is read by Claude, ChatGPT, Claude Code and Codex alike, and stays the same for all of them.",
  ] },
  { q: "Should I turn Claude's memory off if I keep notes?", a: [
    "Not necessarily. Memory is good for how you like Claude to work with you. Notes are for anything you want to read again word for word, tick off or keep. They work well together.",
  ] },
];

const MEMORY_LINE = `Remember this: when I ask you to note, save or add something, put it in Pinto Notes. Look for an existing note first and add to it, and only start a new note when nothing fits.`;

const MOVE_PROMPT = `Write out your memories of me verbatim, exactly as they appear in your memory. Then create a note in Pinto Notes called "About me (for Claude)" with them, under the headings Work, Preferences and Projects. Don't add anything that isn't in your memory, and tell me what you left out.`;

export default function Page() {
  return (
    <PostPage
      slug="claude-memory-vs-notes"
      intro={<>
        Claude remembers you now. Your notes remember the plan. Here&apos;s what each one keeps, where memory stops, and how to
        use both.
      </>}
      answer={
        <Answer jump={[
          { href: "#side-by-side", label: "Side by side" },
          { href: "#missing", label: "Where memory stops" },
          { href: "#use-both", label: "Use both" },
          { href: "#connect", label: "Connect Claude" },
        ]}>
          <p>
            Claude&apos;s memory is Claude&apos;s own summary of you, in topics it writes and you can edit under Settings, Memory. A note is your
            own text, word for word, on your phone and computer. Use memory for how Claude should work with you, and notes for anything you
            want to read again, tick off or keep. With a notes app Claude can reach, it can write to both.
          </p>
        </Answer>
      }
      hero={<Capture priority src="/blog/amber-notes-claude-edit-lisbon" width={1500} height={748} maxWidth={750}
        phone={{ src: "/blog/amber-notes-claude-edit-lisbon-note", width: 865, height: 555 }}
        alt="A Lisbon trip note in Pinto Notes on a Mac. In the Plan checklist, the line Claude just added, Late checkout requested, confirm by 10 May, is tinted, and a bar at the bottom says Claude changed 1 line, with Undo."
        caption="Pinto Notes on a Mac, just after Claude added a line to a trip plan. The new line is tinted, with Undo." />}
      faq={FAQ}
    >
      <h2 id="what-it-is">What Claude&apos;s memory is</h2>
      <PostFigure src="/blog/news/anthropic-claude-memory-settings" width={1600} height={1498} maxWidth={600}
        alt="Claude's Memory settings: switches for Search and reference chats and Generate memory from chats, an Import memory from other AI providers row, then memory topics such as Marathon Training, Sourdough Baking and Japan Trip, each with the date it was updated."
        caption="Settings, Memory in Claude: the switches, the import, and the topics Claude wrote. Image: Anthropic." />
      <p>
        According to Anthropic&apos;s <a href="https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context" rel="noopener">help
        page on memory</a>, Claude saves what it learns about you as a set of separate topics while you chat, and you can ask it to remember
        something on purpose. A few details matter:
      </p>
      <ul>
        <li><strong>Where it lives.</strong> Settings, Memory, where &ldquo;Generate memory from chats&rdquo; turns it on or off. You can open each topic, edit it or delete it there.</li>
        <li><strong>Who has it.</strong> On by default on Free, Pro and Max, on the web, in Claude Desktop and in the iPhone app. On Team and Enterprise, an owner decides.</li>
        <li><strong>Projects.</strong> Each project has its own memory, separate from your other chats.</li>
        <li><strong>What it leaves out.</strong> Incognito chats, and by default sensitive topics such as financial account numbers.</li>
        <li><strong>Moving it.</strong> Claude can <a href="https://support.claude.com/en/articles/12123587-importing-and-exporting-your-memory-from-claude" rel="noopener">import
          what another assistant remembers</a>, pasted in as text, and export its own. Anthropic calls this experimental.</li>
      </ul>

      <h2 id="side-by-side">Side by side</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Claude&apos;s memory</th><th scope="col">Notes Claude can read and write</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Who writes it</th><td>Claude, plus what you ask it to remember</td><td>You, and Claude when you ask it to</td></tr>
            <tr><th scope="row">Exact wording</th><td>Short topics in Claude&apos;s words</td><td>The whole text, as written</td></tr>
            <tr><th scope="row">Where you read it</th><td>Claude&apos;s settings</td><td>Your notes app, on your Mac (iPhone soon)</td></tr>
            <tr><th scope="row">Lists you tick off</th><td>No</td><td>Yes, as checklists</td></tr>
            <tr><th scope="row">Other AI apps</th><td>Claude only</td><td>Any app that connects to the notes app, such as ChatGPT or Claude Code</td></tr>
            <tr><th scope="row">A change you didn&apos;t want</th><td>Edit or delete the topic</td><td>In Pinto Notes: Undo, and earlier versions kept</td></tr>
          </tbody>
        </table>
      </div>
      <NoteMoment
        ai="Claude" glyph="claude"
        me="Add what we need for Friday's tacos to my Groceries note."
        reply="Added four things to Groceries in Pinto Notes. You already had the tortillas."
        title="Groceries"
        lines={[
          { text: "Tortillas", done: true },
          { text: "Limes", by: true },
          { text: "Coriander", by: true },
          { text: "Black beans", by: true },
          { text: "Sour cream", by: true },
        ]}
        caption="A note Claude wrote to, in your own notes app: the new lines are marked, and you can undo them."
      />
      <p>
        So memory suits things like your job, the tone you like and the tools you use: context you&apos;d otherwise repeat. Notes suit trip
        plans, shopping lists, meeting notes and drafts: things you&apos;ll read again yourself, often on your phone. If you also use ChatGPT,
        the same holds for its memory, and the notes are the one place both can read.
      </p>

      <h2 id="missing">Where memory stops</h2>
      <p>
        Say you plan a trip to Lisbon with Claude. Afterwards its memory might hold &ldquo;planning a Lisbon trip in May&rdquo;. It
        won&apos;t hold the plan: the hotel, the late checkout you still need to confirm, the list of restaurants your friend sent. Ask on
        your phone a week later and you&apos;re scrolling through an old chat to find them.
      </p>
      <PostFigure src="/blog/chatgpt/chatgpt-checks-off-lisbon" width={700} height={300} maxWidth={350}
        alt="ChatGPT answering a request to check off Tram 28 early in the Lisbon note: it checked off the line in Pinto Notes and lists the checklist, 3 of 4 done."
        caption="ChatGPT working in the same Lisbon note Claude added to above." />
      <p>
        And memory belongs to one assistant. Tell ChatGPT the dates, and Claude doesn&apos;t know. Import fixes that once, by copy and paste;
        the next change goes missing again. What you actually want is the plan itself, in one place every AI you use can read and add to,
        and that you can open yourself without asking anyone.
      </p>

      <h2 id="use-both">Use both</h2>
      <p>
        Put the habit in memory and the content in notes. Once Claude can reach your notes, send it this once, and it keeps the rule in its
        memory:
      </p>
      <Keep title="A line for Claude's memory" text={MEMORY_LINE} />
      <PostFigure src="/blog/drawn/claude-memcard" width={1200} height={750} maxWidth={560}
        alt="A Claude memory card with an arrow into a note called About me (for Claude), with Work, Preferences and Projects."
        caption="Copy what Claude remembers into a note you can read and fix." />
      <p>
        You can also move what Claude remembers into a note you can read and edit. The first sentence is the one Anthropic suggests for
        copying your memory out; the rest saves it as a note.
      </p>
      <Keep title="Copy Claude's memory into a note" text={MOVE_PROMPT}
        note="Claude reads the result back from the note in later chats, and you can fix anything it got wrong in the note itself." />

      <h2 id="connect">Connect Claude to your notes</h2>
      <Figure shot={SHOTS.consent} caption="Pinto Notes shows this sheet for any AI. Here it names ChatGPT; for Claude it names Claude." />
      <p>
        Claude reaches a notes app through a connector, which is an MCP server. Pinto Notes is in Claude&apos;s connector directory:
      </p>
      <Steps>
        <li>Open <a href={CLAUDE_DIRECTORY_URL} rel="noopener">the Pinto Notes listing</a> on claude.ai or in the Claude desktop app, and choose Connect to Claude.</li>
        <li>Sign in to Pinto Notes on the page that opens.</li>
        <li>Pinto Notes on your Mac asks whether to allow Claude. Pick Read and Edit or Read Only, and choose Allow.</li>
      </Steps>
      <p>
        Once it&apos;s added, the Claude iPhone app can use it too. On Team and Enterprise an owner may need to allow it first. If your Claude
        app doesn&apos;t show the listing, add <code>{MCP_URL}</code> as a custom connector, under Customize, Connectors; that
        works on every plan. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT and Claude</a> has the details, and{" "}
        <a href="/blog/claude-and-apple-notes">Claude and Apple Notes</a> covers your options if your notes are still in Apple Notes.
      </p>

      <h2 id="amber-notes">Why I built Pinto Notes this way</h2>
      <AIConnect ais={["claude", "chatgpt", "claude-code", "codex"]} caption="One set of notes that Claude, ChatGPT, Claude Code and Codex all read and add to." />
      <p>
        I make Pinto Notes, a notes app for Mac (iPhone coming soon) that Claude, ChatGPT, Claude Code and Codex can use. When Claude adds to a note
        it changes only those lines, the change shows up tinted with Undo, and the version before is kept in the note&apos;s history, with
        Claude named as the one who made it. Your notes are encrypted on your devices, and an AI reads them only after you approve it;
        locked notes stay out of reach even then.
      </p>
      <p>
        It isn&apos;t a replacement for Claude&apos;s memory, and it doesn&apos;t read it. It&apos;s the place for the things you want to keep in
        your own words. <a href="/blog/move-from-apple-notes">Moving from Apple Notes</a> is one import on your Mac, and{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecting Claude</a> has the first things to ask once it&apos;s connected.
      </p>
    </PostPage>
  );
}
