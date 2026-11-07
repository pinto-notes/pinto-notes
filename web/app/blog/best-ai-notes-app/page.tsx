import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("best-ai-notes-app", {
  title: "Best AI notes app in 2026: 7 apps compared",
});

type Row = { app: string; price: string; ai: string; reach: string; where: string };

// Every price and feature was read on the maker's own pages or its US App Store listing on 7 November 2026
// (the Sources list at the end). Recheck them monthly and bump `updated` in lib/posts.ts.
const ROWS: Row[] = [
  { app: "Pinto Notes", price: "Free", ai: "None; it works with ChatGPT and Claude", reach: "Yes, read and edit, with Undo", where: "Mac, iPhone" },
  { app: "Notion", price: "Free; Notion AI on Business, $20 a member a month billed yearly", ai: "Notion AI and agents (a trial on Free and Plus)", reach: "Yes, official MCP server, every plan", where: "Mac, iPhone, Windows, Android, web" },
  { app: "Mem", price: "Free (25 messages a month); Plus $9, Pro $29 a month", ai: "Mem chat and Mem Agent", reach: "Yes, official MCP server", where: "Mac, iPhone, Windows, web" },
  { app: "Evernote", price: "Free (50 notes, 1 device); Starter $99 a year (1,000 notes)", ai: "AI Assistant, AI Edit, transcription", reach: "Yes on paid plans, MCP server in beta", where: "Mac, iPhone, Windows, Android, web" },
  { app: "Apple Notes", price: "Comes with your Mac and iPhone", ai: "Writing Tools, recording summaries, Siri AI (beta)", reach: "Claude, on your Mac only", where: "Mac, iPhone (iCloud.com in a browser)" },
  { app: "Reflect", price: "Free on Mac; $99 a year on iPhone", ai: "Uses your own OpenAI, Anthropic or Google key", reach: "No connector; a command-line tool on your Mac", where: "Mac, iPhone" },
  { app: "Obsidian", price: "Free; Sync from $4 a month billed yearly", ai: "None built in; community plugins", reach: "Agents on your computer, through the official CLI or plugins", where: "Mac, iPhone, Windows, Android, Linux" },
];

const FAQ = [
  { q: "What is the best AI notes app?", a: [
    "If you already use ChatGPT or Claude, Pinto Notes lets that AI read and edit your notes, for free. If you want the AI inside the app, Notion fits a shared team workspace and Mem fits one person who wants tasks tracked and reminders.",
  ] },
  { q: "Can ChatGPT take notes?", a: [
    "Yes, in a chat, and ChatGPT's memory keeps short facts about you. On ChatGPT Pro, Pages in Space are editable documents you can come back to. To keep notes in a notebook you already use, connect it: Pinto Notes, Notion, Mem and Evernote's paid plans all work with ChatGPT.",
  ] },
  { q: "Is there a free AI notes app?", a: [
    "Apple Notes has AI for free on newer iPhones and Macs. Pinto Notes is free and works with ChatGPT and Claude, within your AI app's own plan. Mem and Evernote have free plans with small limits, and Granola is free for meetings with 30 days of history.",
  ] },
  { q: "Does Apple have an AI note-taking app?", a: [
    "Apple Notes is it. With Apple Intelligence it rewrites and proofreads, transcribes and summarizes recordings, and in iOS 27 and macOS 27, Siri AI (beta) can find and create notes.",
  ] },
  { q: "Can ChatGPT or Claude use Apple Notes?", a: [
    "Claude can on a Mac, through Anthropic's Apple Notes connector. From your phone or the web, neither can open Apple Notes.",
  ] },
  { q: "Do I have to pay for AI twice?", a: [
    "It depends on the kind of app. Notion and Mem charge for their own AI, which you'd pay for alongside any ChatGPT or Claude plan you keep. Pinto Notes and Notion's MCP server let the ChatGPT or Claude you already have work in your notes. Reflect and many Obsidian plugins use an API key, which the AI company bills separately from a ChatGPT or Claude subscription.",
  ] },
  { q: "Which AI notes app is best for meetings?", a: [
    "Granola if you want notes without a bot in the call, Otter if you want the bot to join and transcribe. Mem, Notion Business and Evernote record meetings too.",
  ] },
  { q: "Which AI notes app is best for students?", a: [
    "For lectures and readings, Gemini Notebook answers questions from your sources, and Apple Notes turns a recorded lecture into a summary. For keeping notes across classes, any app here works; with Pinto Notes, ChatGPT or Claude can turn your notes into practice questions.",
  ] },
  { q: "Is it safe to let an AI read my notes?", a: [
    "Check two things: who can read your notes, and what happens when the AI changes them. Most apps here, Pinto Notes included, can open your notes on their servers; Pinto Notes encrypts them but keeps a sealed copy of your key, so it isn't end-to-end encrypted. A connected AI can read and edit what you share, and the AI company's own data rules apply.",
    "Pinto Notes shows every AI change with Undo and keeps every version; Mem and Evernote keep history or let you review edits too. Reflect and Obsidian keep notes on your disk.",
  ] },
  { q: "What's the best AI notes app for Mac?", a: [
    "Pinto Notes if you want ChatGPT or Claude in your notes, Apple Notes for free writing help, Mem for an AI that tracks your tasks, and Obsidian or Reflect for local files and your choice of model.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="best-ai-notes-app"
      intro={<>Some notes apps come with an AI inside, on its own plan. Others let the AI you already use, like ChatGPT or Claude, work in your notes. Which kind you want decides most of this list. I make Pinto Notes, so I&apos;m not neutral, and it&apos;s first here.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#pinto-notes", label: "The seven apps" },
          { href: "#meetings", label: "Meeting notes" },
          { href: "#which-one", label: "Which one to pick" },
        ]}>
          <p>
            If you use ChatGPT or Claude every day, pick <strong>Pinto Notes</strong>: it&apos;s free, it works like Apple Notes, and your AI
            can read and edit your notes from your phone, the web or your Mac, with Undo on every change. For a shared team workspace, pick{" "}
            <strong>Notion</strong>. For an app that tracks your tasks and reminds you, pick <strong>Mem</strong>. If you came for meeting
            recordings, that&apos;s a different kind of app: see <a href="#meetings">meeting notes</a>.
          </p>
          <PostCta slug="best-ai-notes-app" position="answer" title="Pinto Notes is free on Mac and iPhone.">
            <p>Your notes, with ChatGPT and Claude able to use them, and every change undoable.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="at-a-glance">At a glance</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">App</th><th scope="col">Price</th><th scope="col">AI inside the app</th><th scope="col">Can ChatGPT or Claude use your notes</th><th scope="col">Platforms</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.app}><th scope="row">{r.app}</th><td>{r.price}</td><td>{r.ai}</td><td>{r.reach}</td><td>{r.where}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>Prices are the maker&apos;s own page or the US App Store, read on 7 November 2026.</p>

      <h2>How I picked</h2>
      <p>
        Everything here is a notes app first: a place where you write and keep things. I compared three things: what the AI does, what it
        costs, and whether the AI you already use can reach your notes. I read each maker&apos;s own pages on the day I wrote this.
      </p>
      <p>
        The Pinto Notes and Obsidian screenshots are mine; the other pictures come from the companies that make the apps. Apps that only
        record meetings are <a href="#meetings">further down</a>.
      </p>

      <h2 id="pinto-notes">1. Pinto Notes: best if you already use ChatGPT or Claude</h2>
      <PostFigure src="/blog/news/pinto-notes-chatgpt-edit-framed" width={1720} height={1802} maxWidth={720}
        alt="A Lisbon trip note in Pinto Notes on a Mac. The line ChatGPT just added, Late checkout requested, confirm by 10 May, is tinted, and a bar at the bottom says ChatGPT changed 1 line, with Undo."
        caption="ChatGPT added a line to a trip note. Pinto Notes tints it and offers Undo. Screenshot: Pinto Notes." />
      <p>
        Pinto Notes has no AI of its own, on purpose. It&apos;s a notes app that works like Apple Notes, with folders, checklists and tables,
        and it lets ChatGPT, Claude, Claude Code and Codex search, read and edit your notes. You connect each one once.
      </p>
      <p>
        So you can tell ChatGPT on your phone &ldquo;add the late checkout to my Lisbon note&rdquo;, and the note on your Mac changes. The new
        line shows up tinted, with Undo, and the version before it stays in the note&apos;s history. Other apps let you review their own
        AI&apos;s edits; Pinto Notes does it for the AI apps you connect from outside.
      </p>
      <p>
        Pinto Notes is free and open source, and charges nothing for the connection. Your AI app&apos;s plan still applies: on Claude&apos;s
        free plan, for example, you can add one custom connector. It <a href="/blog/move-from-apple-notes">imports your Apple Notes</a> on the
        Mac. Notes are stored as Markdown and encrypted on your device before they sync, but Pinto Notes keeps a sealed copy of your key so
        you can sign in on a new device, so it isn&apos;t end-to-end encryption.
      </p>
      <p>
        <strong>Where it falls short:</strong> no AI inside the app, so without ChatGPT or Claude it&apos;s a plain notes app. It&apos;s Mac and
        iPhone only, and newer than everything else here.
      </p>
      <p><strong>Best for:</strong> people who already ask ChatGPT or Claude to plan things and are tired of pasting notes back and forth.</p>

      <h2>2. Notion: best for a team workspace</h2>
      <PostFigure src="/blog/news/notion-ai-search-answer" width={1720} height={1076}
        alt="Notion AI search answering top customer requests this quarter, with results from Notion, Slack and GitHub and a written answer listing the requests."
        caption="Notion AI answering a question from across a workspace, with its sources. Image: Notion." />
      <p>
        Notion is a workspace more than a notes app: pages, databases and wikis, shared with your team. Notion AI answers questions across the
        workspace with citations, writes and edits (you accept or discard what it suggests), records meetings, and runs agents that do
        multi-step work across Notion and connected apps.
      </p>
      <p>
        Notion AI comes with Business ($20 a member a month billed yearly, $24 monthly) and Enterprise. Free and Plus get a limited trial.
        Separately, Notion&apos;s official MCP server works on every plan, so ChatGPT and Claude can search and edit your pages without Notion AI.
      </p>
      <p>
        <strong>Where it falls short:</strong> heavy for quick personal notes, the built-in AI needs a Business plan, and AI features don&apos;t
        work offline.
      </p>
      <p><strong>Best for:</strong> teams that keep their work in Notion.</p>

      <h2>3. Mem: best for tracking tasks and reminders</h2>
      <PostFigure src="/blog/news/mem-chat-answer-mac" width={1720} height={1275}
        alt="Mem on a desktop: a Daily Sync meeting note on the left and the Chat panel on the right, answering what's my KTN with the number found in a note."
        caption="Mem's chat finds an answer in your notes, next to the note you're working on. Image: Mem." />
      <p>
        Mem is built around its AI. You write or talk, and Mem Agent builds a picture of your tasks and projects and reminds you at the right
        time, using your calendar. From the chat, Mem can create and edit notes, and every edit stays in version history. On a Mac or Windows
        PC it also records meetings without a bot joining the call.
      </p>
      <p>
        The free plan gives you 25 messages to Mem and 25 new notes a month. Plus ($9 a month) doubles that to 50, and Pro ($29) to 100, with
        larger Pro plans above it. Mem has an official MCP server for Claude, ChatGPT, Claude Code and Codex, and exports your notes as Markdown.
      </p>
      <p><strong>Where it falls short:</strong> monthly caps on messages and new notes on every plan, and no Android app.</p>
      <p><strong>Best for:</strong> people who want automatic task tracking and reminders from their notes.</p>

      <h2>4. Evernote: best if your notes are already there</h2>
      <PostFigure src="/blog/news/evernote-ai-assistant-mac" width={1720} height={785}
        alt="Evernote's Mac app with a Website Launch note and the AI Assistant panel, which has just moved a note to the Website notebook, with an Undo button."
        caption="Evernote's AI Assistant moving a note to another notebook, on a Mac. Image: Evernote, from the Mac App Store." />
      <p>
        Evernote has added a lot of AI: an AI Assistant, built with OpenAI, that searches and organizes your notes from a chat; search by
        meaning; transcription of recordings; and AI Edit, where you review the changes before you keep them. Evernote&apos;s plan page lists
        these on every plan, Free included, with limits it doesn&apos;t spell out.
      </p>
      <p>
        Free stops at 50 notes, one notebook and one device. Starter is $14.99 a month or $99 a year for up to 1,000 notes and three devices;
        bigger archives need Advanced, $24.99 a month or $249.99 a year. Paid plans also get Evernote&apos;s MCP server, in beta, which works
        with Claude, ChatGPT, Cursor and Codex.
      </p>
      <p>
        <strong>Where it falls short:</strong> a long-time archive likely needs Advanced, and Evernote doesn&apos;t say how far the AI limits go.
      </p>
      <p><strong>Best for:</strong> people with years of notes in Evernote who want AI on top of them.</p>

      <h2>5. Apple Notes: best free AI on iPhone and Mac</h2>
      <PostFigure src="/blog/news/apple-notes-recording-summary-mac" width={1630} height={1780} maxWidth={600}
        alt="Apple Notes on a Mac: a lecture note with an audio recording and a Notes from Recording section that Apple Intelligence wrote from it, with headings and bullet points."
        caption="Apple Notes on a Mac turns a recorded lecture into notes. Image: Apple." />
      <p>
        If your iPhone or Mac runs Apple Intelligence (iPhone 15 Pro or later, or a Mac with Apple silicon; Apple keeps the full list), Apple
        Notes already has AI. Writing Tools rewrite and proofread, recordings turn into a transcript and a summary, and Math Notes solves sums
        as you type. In iOS 27 and macOS 27, Siri AI (beta) can find a note or look inside one, and create new ones. Writing Tools can also
        hand a request to ChatGPT through Apple&apos;s ChatGPT extension.
      </p>
      <p>
        It&apos;s free and already on your devices. On a Mac, Claude can read and write your notes through Anthropic&apos;s Apple Notes connector.
      </p>
      <p>
        <strong>Where it falls short:</strong> no ChatGPT or Claude chat on your phone or the web can open your notes; Claude&apos;s connector
        works only on a Mac. Siri AI is in beta, in six languages to start, and not yet on iPhone in the EU.
      </p>
      <p><strong>Best for:</strong> people who want AI help with no new app and no new bill.</p>
      <p>
        More in <a href="/blog/siri-ai-apple-notes">Siri AI and Apple Notes</a> and{" "}
        <a href="/blog/claude-and-apple-notes">can Claude read your Apple Notes?</a>
      </p>

      <h2>6. Reflect: best for local notes with your own AI key</h2>
      <PostFigure src="/blog/news/reflect-open-mac" width={1720} height={1058}
        alt="Reflect Open on a Mac: a sidebar with daily notes, tasks and pinned notes, a column of daily notes with links, and a calendar with similar notes on the right."
        caption="Reflect Open on a Mac, with daily notes and a calendar. Image: Reflect." />
      <p>
        Reflect has a new app. Reflect Open, the one on reflect.app now, keeps your notes as plain Markdown files on your disk, with no
        account and no Reflect server. The AI is optional and uses your own OpenAI, Anthropic or Google API key, billed by that company: press
        ⌘J to ask your notes a question and get an answer that points to the notes it came from. Notes you mark private stay out of it.
      </p>
      <p>
        It&apos;s free on the Mac. On iPhone and iPad it&apos;s $9.99 a month or $99 a year. The older hosted app, now Reflect Classic, still
        runs for people who have it.
      </p>
      <p>
        <strong>Where it falls short:</strong> an API key is a separate bill from a ChatGPT or Claude subscription, no AI chat can reach your
        notes (there&apos;s only a command-line tool for agents on your Mac), and the iPhone app is new.
      </p>
      <p><strong>Best for:</strong> people who want local Markdown files and their choice of AI company.</p>

      <h2>7. Obsidian: best if you want to build it yourself</h2>
      <PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000}
        alt="Obsidian on a Mac: a vault's folders in the sidebar and a Groceries note open in a tab, with ticked items struck through."
        caption="A Groceries note in Obsidian on a Mac, as a Markdown file in a folder. Screenshot: Pinto Notes." />
      <p>
        Obsidian has no AI in the editor. It keeps plain Markdown files on your disk, and its community plugins add AI: Copilot (over 3
        million downloads) chats with your vault and runs agents that read and write notes, and Smart Connections finds related notes with a
        model that runs on your computer. Depending on the plugin, you can use an assistant you already pay for, an API key, the plugin&apos;s
        own paid models, or a local model. Obsidian&apos;s official command-line tool also lets agents on your computer, like Claude Code, read
        and write your vault.
      </p>
      <p>Obsidian is free. Sync between devices is $4 a month billed yearly.</p>
      <p>
        <strong>Where it falls short:</strong> it all takes setup, it&apos;s community plugins rather than Obsidian&apos;s own, and nothing
        reaches your vault from a phone chat.
      </p>
      <p>
        <strong>Best for:</strong> people who enjoy building their own system. More in{" "}
        <a href="/blog/obsidian-mcp">Obsidian MCP servers compared</a>.
      </p>

      <h2>Also considered</h2>
      <ul>
        <li>
          <strong>Craft</strong> has AI built in, with a small free allowance, and an official connection ChatGPT can use to search and update
          your documents. It&apos;s in our <a href="/blog/best-notes-app-for-mac">best notes app for Mac</a> list; here it lost out on the free
          AI limits.
        </li>
        <li>
          <strong>OneNote</strong> has Microsoft&apos;s Copilot on Microsoft 365 plans that include it. It&apos;s the pick if you already pay for
          Microsoft 365 and use Windows.
        </li>
      </ul>

      <h2 id="meetings">If you meant meeting notes</h2>
      <p>A lot of &ldquo;AI note taker&rdquo; apps record your calls and write the notes for you. That&apos;s a different job from keeping notes:</p>
      <ul>
        <li>
          <strong>Granola</strong> listens on your Mac, PC or phone without a bot joining the call, and turns your rough notes into clean ones.
          Basic is free with 30 days of meetings; Business is $14 a person a month. Both connect to ChatGPT and Claude.
        </li>
        <li>
          <strong>Otter</strong> joins or records meetings and transcribes them. Basic is free for 300 minutes a month, up to 30 minutes per
          recording, and also has an MCP server.
        </li>
      </ul>
      <p>
        Mem, Notion (on Business) and Evernote record meetings too. And if you study from PDFs and articles, Google&apos;s Gemini Notebook
        (called NotebookLM until July) answers questions from your sources. It&apos;s a research tool, not a notes app.
      </p>

      <h2 id="which-one">Which one should you pick?</h2>
      <ul>
        <li>You use ChatGPT or Claude daily: <strong>Pinto Notes</strong>, free.</li>
        <li>You work in a team: <strong>Notion</strong>, with Business for the AI.</li>
        <li>You want the app to track tasks and remind you: <strong>Mem</strong>.</li>
        <li>Your notes are already in Evernote: <strong>Evernote</strong>, on a paid plan.</li>
        <li>You want no new app: <strong>Apple Notes</strong>.</li>
        <li>You want local files and your own AI: <strong>Reflect</strong> or <strong>Obsidian</strong>.</li>
      </ul>
      <p>
        Want ChatGPT in the notes you keep? <a href="/blog/connect-chatgpt-to-your-notes">How to connect ChatGPT to your notes</a> walks
        through it.
      </p>
      <p className="label">Sources</p>
      <p>
        Read on 7 November 2026 on each maker&apos;s own pages: <a href="https://www.notion.com/pricing">Notion pricing</a>,{" "}
        <a href="https://www.notion.com/help/notion-ai-faqs">Notion AI</a>, <a href="https://www.notion.com/help/notion-mcp">Notion MCP</a>,{" "}
        <a href="https://evernote.com/compare-plans">Evernote plans</a>, <a href="https://evernote.com/features/ai-features">Evernote AI</a>,{" "}
        <a href="https://dev.evernote.com/mcp">Evernote MCP</a>, <a href="https://get.mem.ai/pricing">Mem pricing</a>,{" "}
        <a href="https://docs.mem.ai/mcp">Mem MCP</a>, <a href="https://reflect.app">Reflect</a> and{" "}
        <a href="https://github.com/team-reflect/reflect-open">Reflect Open</a>, <a href="https://obsidian.md/pricing">Obsidian pricing</a>,{" "}
        <a href="https://obsidian.md/help/cli">Obsidian CLI</a>, <a href="https://community.obsidian.md/plugins/copilot">Copilot for Obsidian</a>,{" "}
        <a href="https://support.apple.com/en-us/121115">Apple Intelligence</a>, <a href="https://support.apple.com/en-us/118442">Apple Notes recordings</a>,{" "}
        <a href="https://www.granola.ai/pricing">Granola pricing</a>, <a href="https://otter.ai/pricing">Otter pricing</a>,{" "}
        <a href="https://chatgpt.com/pricing">ChatGPT pricing</a> and{" "}
        <a href="https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp">Claude custom connectors</a>.
      </p>
      <PostCta slug="best-ai-notes-app" position="end" title="Try Pinto Notes. It's free.">
        <p>Connect ChatGPT or Claude, and see every change it makes, with Undo.</p>
      </PostCta>
    </PostPage>
  );
}
