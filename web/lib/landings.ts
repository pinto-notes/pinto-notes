import { SHOTS, type Ground, type Shot } from "./posts";

/// The landing pages: one audience or search each, at /for/<slug> (an AI app you already use) or
/// /alternatives/<slug> (an app you might leave). Each is for search and for ads, so every page says
/// one thing in its headline and keeps to what the app does today. lib/Landing.tsx draws them;
/// the sitemap, /llms.txt and the footer list them. Copy rules: docs/Product/blog-guide.md.
///
/// Research behind the choice (13 October 2026, seodata.dev US estimates from Google Ads data):
/// "obsidian alternative(s)" about 1,600 a month each, "notion alternative(s)" 1,000 to 1,900,
/// "claude memory" 320, "apple notes alternative" 110; ChatGPT and coding-agent memory are pains
/// people write about often, with vendor help pages ranking. Second brain, accountability and
/// AI-built trackers had little demand of their own, so they are things to do on these pages.

export type Kind = "for" | "alternatives";

type Thing = {
  title: string;
  text: string;
  /// The exchange: which app, on what kind of screen, what you ask and what it says.
  app: string;
  glyph: "openai" | "claude";
  kind: "phone" | "desk" | "term";
  ask: string;
  reply: string;
  /// What it did in Pinto Notes: the note, and the change.
  note: string;
  did: string;
  /// The tool a terminal shows it calling.
  tool?: string;
};

type QA = { q: string; a: string[] };

export type Landing = {
  kind: Kind;
  slug: string;
  /// The <title>, at most 60 characters, and the meta description, 70 to 160.
  title: string;
  description: string;
  shareTitle?: string;
  /// The breadcrumb's name for the page.
  crumb: string;
  eyebrow: string;
  h1: string;
  /// Words in the headline drawn with the marker.
  mark?: string;
  lede: string;
  shot: { shot: Shot; ground: Ground; caption?: string };
  things: { title: string; lede: string; items: Thing[] };
  compare?: { title: string; intro?: string; columns: string[]; rows: string[][]; checked: string; note?: string };
  story?: { title: string; paras: string[] };
  faq: QA[];
  read: { href: string; label: string }[];
  closing: { title: string; text: string };
};

/// The day the pages' facts were last checked against the app and the other products' own pages.
export const LANDINGS_CHECKED = "2026-10-13";
const CHECKED = LANDINGS_CHECKED;

/// A capture of Claude's edit in a Lisbon note (the one the Claude memory post shows).
const CLAUDE_LISBON: Shot = { src: "/blog/amber-notes-claude-edit-lisbon.webp", alt: "A Lisbon trip note in Pinto Notes on a Mac, with the line Claude just added tinted and a bar saying Claude changed 1 line, with Undo.", width: 1500, height: 748, window: false, title: "Lisbon" };

export const landings: Landing[] = [
  {
    kind: "for",
    slug: "chatgpt",
    title: "Give ChatGPT access to your notes | Pinto Notes",
    shareTitle: "Give ChatGPT access to your notes",
    description: "Pinto Notes is a free notes app for Mac and iPhone that ChatGPT can search, read and edit, with your approval and an Undo on every change.",
    crumb: "For ChatGPT",
    eyebrow: "Pinto Notes for ChatGPT",
    h1: "Give ChatGPT access to your notes",
    mark: "your notes",
    lede: "Pinto Notes works like Apple Notes. Connect ChatGPT once, and it can read and edit your notes, while you see every line it changed.",
    shot: { shot: SHOTS.aiEdit, ground: "honey", caption: "Lines ChatGPT added stay tinted until you've seen them, with Undo at the bottom." },
    things: {
      title: "Three things to ask ChatGPT",
      lede: "Each one ends up in a real note on your Mac, which you can edit by hand or undo.",
      items: [
        {
          title: "Add to a list from any chat",
          text: "You're halfway through a recipe conversation and remember the milk. ChatGPT finds your Groceries note and adds the lines there.",
          app: "ChatGPT", glyph: "openai", kind: "phone",
          ask: "Add oat milk, lemons and bread to my groceries",
          reply: "Added 3 items to your Groceries checklist.",
          note: "Groceries", did: "3 items added",
        },
        {
          title: "Keep a plan, and get asked about it",
          text: "Write the plan once as a checklist. A week later ChatGPT reads what you ticked before it answers, and moves what you missed.",
          app: "ChatGPT", glyph: "openai", kind: "desk",
          ask: "How am I doing on my half marathon plan this week?",
          reply: "You ticked 3 of 4 runs. Sunday's long run is still open, so I moved it to Saturday in the note.",
          note: "Half marathon plan", did: "1 line changed",
        },
        {
          title: "Turn a table into a small app",
          text: "Ask ChatGPT to make a note an app. It builds a tracker inside the note, and the numbers stay in your notes.",
          app: "ChatGPT", glyph: "openai", kind: "desk",
          ask: "Make my Habits note an app with a streak for each habit",
          reply: "Habits now opens as a tracker: today at the top, a streak per habit and a chart of the last weeks.",
          note: "Habits", did: "Now an app",
        },
      ],
    },
    story: {
      title: "How the connection works",
      paras: [
        "Pinto Notes has an MCP server built in, which is the standard way ChatGPT talks to other apps. You add Pinto Notes in ChatGPT on the web, under Plugins, with Developer mode on. OpenAI's docs list that for Plus, Pro, Business, Enterprise and Edu; the free plan can't add your own app yet. Pinto Notes is also coming to ChatGPT's app directory.",
        "When ChatGPT asks for your notes, Pinto Notes asks you first, on your Mac or iPhone. You choose read only, or read and edit. Settings shows when ChatGPT last used your notes, and Disconnect stops it straight away.",
        "Every change ChatGPT makes keeps the version before it. If it rewrote a note you liked better before, open the note's history and restore it.",
      ],
    },
    faq: [
      { q: "Does ChatGPT see all my notes once it's connected?", a: [
        "It can read any note it asks for, except notes you lock with a password. It doesn't load your whole library up front: it searches or lists, then opens the notes it needs, the same way you would.",
      ] },
      { q: "Can I use it from the ChatGPT app on my phone?", a: [
        "You add Pinto Notes on chatgpt.com, which is where OpenAI documents adding your own app. OpenAI's pages don't yet say clearly whether every plan's phone app can use it afterwards, so check on your account before you rely on it.",
      ] },
      { q: "Is this better than ChatGPT's own memory?", a: [
        "They do different jobs. Memory holds short facts about you in ChatGPT's words. A note holds the full text you wrote, checklists you tick, and things you want to read yourself later, and Claude can read the same note.",
      ] },
    ],
    read: [
      { href: "/blog/connect-chatgpt-to-your-notes", label: "How to connect ChatGPT to your notes, step by step" },
      { href: "/blog/chatgpt-memory-vs-notes", label: "ChatGPT memory vs a notes app ChatGPT can read" },
      { href: "/blog/chatgpt-to-do-list-on-iphone", label: "Use ChatGPT as a to-do list that syncs to your iPhone" },
      { href: "/templates", label: "Note templates with a prompt for ChatGPT" },
    ],
    closing: {
      title: "Stop pasting notes into ChatGPT.",
      text: "Pinto Notes is free and open source. Import your Apple Notes on the Mac, connect ChatGPT, and ask it about something you wrote last year.",
    },
  },

  {
    kind: "for",
    slug: "claude",
    title: "Claude memory you can read and edit | Pinto Notes",
    shareTitle: "Claude memory you can read and edit",
    description: "Give Claude a memory you can open: notes it reads and updates in Pinto Notes, a free notes app for Mac and iPhone, with every change kept.",
    crumb: "For Claude",
    eyebrow: "Pinto Notes for Claude",
    h1: "Claude memory you can read and edit",
    mark: "read and edit",
    lede: "Claude's own memory is a set of short topics in its settings, written by Claude. Pinto Notes gives it your notes instead: full text, in folders, that you read and fix like any other note.",
    shot: { shot: CLAUDE_LISBON, ground: "sand", caption: "Claude added one line to a trip note. It shows tinted, with Undo." },
    things: {
      title: "Three things to ask Claude",
      lede: "Connect once on claude.ai, and Claude can use your notes in the desktop app and on your phone too.",
      items: [
        {
          title: "Remember a decision, with the reason",
          text: "Claude writes it in the note where it belongs, in your words, so you find it later without asking Claude.",
          app: "Claude", glyph: "claude", kind: "desk",
          ask: "Remember that we chose the matte blue tiles for the bathroom, and why",
          reply: "Added to Bathroom: matte blue tiles, chosen because they hide water marks and cost less than the green ones.",
          note: "Bathroom", did: "2 lines added",
        },
        {
          title: "Ask about a plan from your phone",
          text: "The plan you made with Claude on your computer is a note. On your phone, Claude reads it before it answers.",
          app: "Claude", glyph: "claude", kind: "phone",
          ask: "What's left on my Lisbon list?",
          reply: "Two things: book the train to Sintra and buy a plug adapter. Everything else is ticked.",
          note: "Lisbon", did: "read, nothing changed",
        },
        {
          title: "Do a weekly review that stays written down",
          text: "Claude reads the week's notes and writes the review as a new note. Next Friday it starts from that one.",
          app: "Claude", glyph: "claude", kind: "desk",
          ask: "Do my weekly review from this week's notes",
          reply: "Wrote Week 41: three things done, two that slipped (moved to next week) and one question for you.",
          note: "Week 41 review", did: "New note",
        },
      ],
    },
    story: {
      title: "Why notes work as Claude's memory",
      paras: [
        "Claude's built-in memory is useful for context about you: your job, the tone you like. It lives in Claude's settings, in Claude's words, and only Claude reads it.",
        "A note holds the whole thing, such as a trip plan with a table of restaurants, or the reasons behind a decision. You read it on your Mac, you correct a wrong line yourself, and ChatGPT or Claude Code can read the same note.",
        "Pinto Notes is listed in Claude's connector directory. Choose Connect to Claude, sign in, then approve it on your Mac or iPhone. It works on every Claude plan; the free plan includes one custom connector.",
      ],
    },
    faq: [
      { q: "Does Claude's own memory still work if I connect my notes?", a: [
        "Yes. Connecting Pinto Notes doesn't change Claude's memory setting. Claude keeps its short memory of you, and reads your notes when a question needs them.",
      ] },
      { q: "Can I stop Claude from changing my notes?", a: [
        "Yes. When you approve Claude, choose read only. You can switch later by disconnecting Claude in Settings and connecting it again.",
      ] },
      { q: "Will Claude use my notes in Claude Code too?", a: [
        "If you use the same Claude account, Claude Code may already list Pinto Notes as a connector. Otherwise one command adds it, with a token of its own.",
      ] },
    ],
    read: [
      { href: "/blog/claude-memory-vs-notes", label: "Claude memory vs notes Claude can read and write" },
      { href: "/blog/weekly-review-with-chatgpt-or-claude", label: "A weekly review with ChatGPT or Claude" },
      { href: "/blog/claude-and-apple-notes", label: "Can Claude read your Apple Notes?" },
      { href: "/blog/mcp-server", label: "Every tool the Pinto Notes MCP server gives Claude" },
    ],
    closing: {
      title: "Give Claude something to remember with.",
      text: "Pinto Notes is free, with no ads and no tracking in the app. Connect Claude from its directory and start with one note.",
    },
  },

  {
    kind: "for",
    slug: "claude-code",
    title: "Claude Code and Codex memory in your notes | Pinto Notes",
    shareTitle: "Memory for Claude Code and Codex that you can read",
    description: "Claude Code and Codex forget between sessions. Pinto Notes gives both the same notes to read and write, through MCP, and you read them on your Mac.",
    crumb: "For Claude Code and Codex",
    eyebrow: "Pinto Notes for Claude Code and Codex",
    h1: "Memory for Claude Code and Codex that you can read",
    mark: "you can read",
    lede: "Both agents start each session without what you decided last week. Connect them to Pinto Notes, and they keep decisions, standups and handoffs in notes you read in a normal notes app.",
    shot: { shot: SHOTS.standup, ground: "ink", caption: "Claude Code added a line to Standup notes. The bar at the bottom names it." },
    things: {
      title: "Three things to hand your agents",
      lede: "Give each agent its own token, and the note's history shows which one wrote what.",
      items: [
        {
          title: "Write the standup from the commits",
          text: "Claude Code reads the git log and writes three lines a person can read, in the note you open every morning.",
          app: "Claude Code", glyph: "claude", kind: "term",
          ask: "Write today's standup into my notes from yesterday's commits",
          reply: "Added 6 lines under Tuesday.",
          note: "Standup notes", did: "6 lines", tool: "edit",
        },
        {
          title: "Keep one decision log for both",
          text: "Codex reads the same Decisions note Claude Code wrote to this morning, so you don't explain the cache keys twice.",
          app: "Codex", glyph: "openai", kind: "term",
          ask: "Before you start, read Decisions in my notes",
          reply: "Read 14 decisions. Cache keys include the locale; I'll keep that.",
          note: "Decisions", did: "read", tool: "fetch",
        },
        {
          title: "Hand work from one agent to the next",
          text: "At the end of a session, Claude Code writes what's done and what's next. Codex picks it up from the note.",
          app: "Claude Code", glyph: "claude", kind: "term",
          ask: "Write a handoff note for Codex: what's done, what's next, what's open",
          reply: "Wrote Handoff: billing refactor.",
          note: "Handoff: billing refactor", did: "New note", tool: "create",
        },
      ],
    },
    compare: {
      title: "Where agent memory can live",
      intro: "CLAUDE.md and AGENTS.md are the right place for a repository's rules. A note fits what spans repositories and agents.",
      columns: ["CLAUDE.md or AGENTS.md", "The agent's own memory", "A note in Pinto Notes"],
      rows: [
        ["Which agent reads it", "Claude Code reads CLAUDE.md, Codex reads AGENTS.md", "Only the agent that wrote it", "Any agent connected over MCP"],
        ["Where it lives", "In one repository", "On that computer", "Synced between your devices"],
        ["Who writes it", "You, or the agent when you ask", "The agent", "You, and the agents when you ask"],
        ["Read it in a notes app", "No", "No", "Yes"],
        ["Earlier versions", "If you commit it", "No", "Every version, named by who changed it"],
      ],
      checked: CHECKED,
      note: "Claude Code's auto memory and Codex's memories are both newer features and change often; check each tool's docs for the current details.",
    },
    story: {
      title: "Set it up in two commands",
      paras: [
        "Codex: run codex mcp add amber_notes --url https://mcp.pintonotes.com and sign in in your browser. Claude Code: in Pinto Notes, open Settings, Connect an AI, Claude Code, and choose Add to Claude Code, or install the plugin and sign in from /mcp.",
        "Give each agent its own access token and its name goes on every edit. Make a token read only for an agent that should only look things up.",
      ],
    },
    faq: [
      { q: "Is this a replacement for CLAUDE.md?", a: [
        "No. Keep the repository's rules in CLAUDE.md or AGENTS.md, next to the code. Use notes for what changes week to week and for what more than one agent, or you, needs to read.",
      ] },
      { q: "Do the notes go into every prompt?", a: [
        "No. The agent calls search or fetch when it needs a note, so nothing fills the context window until it asks. A line in CLAUDE.md such as \"read Decisions in my notes before you start\" makes it ask every time.",
      ] },
      { q: "Can I use it with Cursor or Gemini CLI too?", a: [
        "Any tool that supports remote MCP servers can connect to the same address and sign in. The MCP server page has the one-line installs.",
      ] },
    ],
    read: [
      { href: "/blog/shared-memory-for-coding-agents", label: "One memory for Claude Code, Codex and your other agents" },
      { href: "/blog/notes-in-claude-code-and-codex", label: "Use your notes from Claude Code and Codex: every setup" },
      { href: "/blog/work-log-with-claude-code", label: "Keep a work log with Claude Code" },
      { href: "/blog/mcp-server", label: "The Pinto Notes MCP server and its tools" },
    ],
    closing: {
      title: "Let the next session start where this one stopped.",
      text: "Pinto Notes is free and open source under the MIT license. Download it, connect one agent, and ask it to write today's standup.",
    },
  },

  {
    kind: "alternatives",
    slug: "apple-notes",
    title: "Apple Notes alternative that works with AI | Pinto Notes",
    shareTitle: "The Apple Notes alternative your AI can use",
    description: "Pinto Notes works like Apple Notes, imports all of it in one go, and lets ChatGPT and Claude read and edit your notes. Free, for Mac and iPhone.",
    crumb: "Apple Notes alternative",
    eyebrow: "An alternative to Apple Notes",
    h1: "The Apple Notes alternative your AI can use",
    mark: "your AI",
    lede: "It has the folders, checklists and tables you know from Apple Notes. The difference is that ChatGPT, Claude and Claude Code can find and edit your notes from any device.",
    shot: { shot: SHOTS.importSheet, ground: "soft", caption: "Import from Apple Notes on a Mac: everything, or only the notes you pick." },
    things: {
      title: "What changes when your AI can read your notes",
      lede: "Bring every note over first. Apple Notes stays as it was, so you can go back any time.",
      items: [
        {
          title: "Find something you wrote years ago",
          text: "Ask the way you'd ask a person. ChatGPT searches every note and answers with the line it found.",
          app: "ChatGPT", glyph: "openai", kind: "phone",
          ask: "When did I last get the car serviced? It's somewhere in my notes",
          reply: "On 13 March 2025, according to your Car note. They said the brake pads had about a year left.",
          note: "Car", did: "read, nothing changed",
        },
        {
          title: "Tidy up notes you never had time for",
          text: "Three half-finished packing lists become one checklist. The old notes stay where they were until you delete them.",
          app: "Claude", glyph: "claude", kind: "desk",
          ask: "Merge my three packing lists into one checklist, without duplicates",
          reply: "Made Packing list with 41 items. Your three old lists are unchanged.",
          note: "Packing list", did: "New note",
        },
        {
          title: "Keep a log without opening the app",
          text: "Say it in a chat, and a row lands in a real table you can sort on your Mac.",
          app: "ChatGPT", glyph: "openai", kind: "phone",
          ask: "Log today's ride: 42 km, felt strong",
          reply: "Added a row to Training log: today, 42 km, felt strong.",
          note: "Training log", did: "1 row added",
        },
      ],
    },
    compare: {
      title: "Pinto Notes and Apple Notes",
      columns: ["Apple Notes", "Pinto Notes"],
      rows: [
        ["Price", "Free with your Apple account", "Free"],
        ["Devices", "Every Apple device, and iCloud.com", "Mac today; iPhone coming soon to the App Store"],
        ["ChatGPT and Claude can search and edit", "Only on a Mac, through Claude Desktop's extension or community servers", "Yes, from any device, with your approval"],
        ["Version history", "No", "Every version, including AI edits"],
        ["Stored as", "Apple's own format", "Markdown, formatted on screen"],
        ["Drawing, handwriting, scanning", "Yes", "No"],
        ["Shared notes others can edit", "Yes", "No; a read-only web page instead"],
      ],
      checked: CHECKED,
      note: "Apple Notes wins the last two rows, and they stay in.",
    },
    faq: [
      { q: "Do I lose anything when I import from Apple Notes?", a: [
        "Folders, tables and pictures come along. Checklists and pins come too once you give Pinto Notes Full Disk Access on the Mac. Nothing in Apple Notes changes or gets deleted.",
      ] },
      { q: "Can I keep using Apple Notes alongside it?", a: [
        "Yes. The import is a copy, so you can import a few notes, try it for a week, and keep writing in Apple Notes meanwhile.",
      ] },
      { q: "Does it have Apple Notes' locked notes?", a: [
        "Yes. A note can be locked with a separate password, and a connected AI can't open a locked note.",
      ] },
    ],
    read: [
      { href: "/blog/pinto-notes-vs-apple-notes", label: "Pinto Notes vs Apple Notes, row by row" },
      { href: "/blog/move-from-apple-notes", label: "How to move from Apple Notes to Pinto Notes" },
      { href: "/blog/claude-and-apple-notes", label: "Can Claude read your Apple Notes?" },
      { href: "/blog/apple-notes-mcp", label: "Apple Notes MCP servers compared" },
    ],
    closing: {
      title: "Keep how Apple Notes feels, and let your AI in.",
      text: "Pinto Notes is free, with no ads and no tracking in the app. Import your notes on the Mac in one go and keep Apple Notes as it is.",
    },
  },

  {
    kind: "alternatives",
    slug: "notion",
    title: "Notion alternative for everyday notes | Pinto Notes",
    shareTitle: "A Notion alternative for everyday notes",
    description: "Pinto Notes is a fast notes app that feels like Apple Notes, with real tables, and ChatGPT and Claude can edit it. A free Notion alternative for Mac and iPhone.",
    crumb: "Notion alternative",
    eyebrow: "An alternative to Notion",
    h1: "A Notion alternative for everyday notes",
    mark: "everyday notes",
    lede: "Notion is great for team wikis and databases. For the note you jot down while standing in a queue, Pinto Notes works like Apple Notes, offline too, and ChatGPT or Claude can keep its tables up to date.",
    shot: { shot: SHOTS.lisbon, ground: "sage", caption: "A trip note with a checklist, a linked sub-note and a table of where to eat." },
    things: {
      title: "What you'd use Notion for, done in a note",
      lede: "A note can hold tables, checklists and links to other notes, with no database to set up first.",
      items: [
        {
          title: "Track something in a table",
          text: "A table in a note sorts and adds up like a small database. ChatGPT adds the row while you're still at the viewing.",
          app: "ChatGPT", glyph: "openai", kind: "phone",
          ask: "Add the Södermalm flat to my apartment hunt: 2 rooms, viewing Sunday",
          reply: "Added a row to Apartment hunt. That's 6 flats, 2 with viewings this week.",
          note: "Apartment hunt", did: "1 row added",
        },
        {
          title: "Let your AI keep a project current",
          text: "Tell Claude what you finished. It ticks the items, and checklists move done items to the bottom by themselves.",
          app: "Claude", glyph: "claude", kind: "desk",
          ask: "In Launch plan, tick the press kit and the pricing page",
          reply: "Ticked 2 items in Launch plan. 5 are left, the first is the FAQ.",
          note: "Launch plan", did: "2 items ticked",
        },
        {
          title: "Get a custom view without building one",
          text: "Ask for an app instead of a template. Claude builds it inside the note, from the table you already have.",
          app: "Claude", glyph: "claude", kind: "desk",
          ask: "Make my Reading list note an app I can sort by rating",
          reply: "Reading list now opens as cards you can sort and filter. Your table is still the data.",
          note: "Reading list", did: "Now an app",
        },
      ],
    },
    compare: {
      title: "Pinto Notes and Notion",
      columns: ["Notion", "Pinto Notes"],
      rows: [
        ["Best at", "Team wikis and linked databases", "Quick personal notes, lists and tables"],
        ["Devices", "Web, Mac, Windows, iPhone, Android", "Mac today; iPhone coming soon to the App Store"],
        ["Offline", "Pages you download for offline", "Every note, always"],
        ["Price", "Free plan; paid plans per member", "Free"],
        ["Built-in AI", "Notion AI, fully on Business and Enterprise", "None built in; you connect ChatGPT, Claude or another AI"],
        ["ChatGPT and Claude can edit", "Through Notion's MCP server", "Through Pinto Notes' MCP server, with Undo"],
        ["Teams and shared editing", "Yes", "No"],
      ],
      checked: CHECKED,
      note: "If your notes are mostly team docs, Notion is the better fit.",
    },
    faq: [
      { q: "Can I bring my Notion pages over?", a: [
        "Yes. Export your workspace from Notion as Markdown, then in Pinto Notes choose Import Notes and pick Markdown or text files. Folders, checklists and attachments come along.",
      ] },
      { q: "Does Pinto Notes have databases?", a: [
        "It has tables inside notes, which cover lists of things with a few columns: a reading list, a budget, a log. There are no linked databases, relations or board views.",
      ] },
      { q: "Is it for teams?", a: [
        "No. Pinto Notes is for one person's notes. You can share a note as a read-only web page, but there's no shared workspace.",
      ] },
    ],
    read: [
      { href: "/blog/apple-notes-vs-notion", label: "Apple Notes vs Notion for everyday notes" },
      { href: "/blog/notes-apps-with-mcp", label: "Notes apps with an MCP server, compared" },
      { href: "/blog/apple-notes-tables", label: "Tables in Apple Notes, and where they stop" },
      { href: "/templates", label: "Templates for trackers, plans and logs" },
    ],
    closing: {
      title: "Write it down before the thought is gone.",
      text: "Pinto Notes is free and open source. Keep Notion for the team wiki, and keep your own notes somewhere that opens straight to the page.",
    },
  },

  {
    kind: "alternatives",
    slug: "obsidian",
    title: "Obsidian alternative with free sync and AI | Pinto Notes",
    shareTitle: "An Obsidian alternative with sync and AI built in",
    description: "Pinto Notes keeps your notes as markdown with wiki links, syncs for free, and lets ChatGPT and Claude edit them with no plugin. An Obsidian alternative for Mac.",
    crumb: "Obsidian alternative",
    eyebrow: "An alternative to Obsidian",
    h1: "An Obsidian alternative with sync and AI built in",
    mark: "sync and AI",
    lede: "Your notes stay markdown and your [[wiki links]] keep working. There's no sync plan to pick and no AI plugin to run on your computer, because ChatGPT, Claude and Codex connect straight to your notes.",
    shot: { shot: SHOTS.welcome, ground: "mist", caption: "Markdown that formats itself as you type: a checklist, bullets, code and a table." },
    things: {
      title: "What your AI can do with a vault it can reach",
      lede: "Import your vault on the Mac. Wiki links stay as you wrote them and open the note they name.",
      items: [
        {
          title: "Follow your links for you",
          text: "Claude reads the [[links]] in your notes the way you would, and finds what points where.",
          app: "Claude", glyph: "claude", kind: "desk",
          ask: "Which of my notes link to Kitchen remodel?",
          reply: "Four: Budget 2026, Contractors, Tiles and Week 38 review.",
          note: "Kitchen remodel", did: "read, nothing changed",
        },
        {
          title: "Add structure to a note",
          text: "ChatGPT writes markdown, so a table it adds is a real table you can edit and sort.",
          app: "ChatGPT", glyph: "openai", kind: "desk",
          ask: "Add a table of the three contractor quotes to Kitchen remodel",
          reply: "Added a table with the three quotes, cheapest first.",
          note: "Kitchen remodel", did: "Table added",
        },
        {
          title: "Write from the terminal, read it anywhere",
          text: "Codex adds to your notes from any computer, without a vault on that machine.",
          app: "Codex", glyph: "openai", kind: "term",
          ask: "Append today's research links to Agents in my Reading folder",
          reply: "Added 5 links under 13 October.",
          note: "Agents", did: "5 lines added", tool: "edit",
        },
      ],
    },
    compare: {
      title: "Pinto Notes and Obsidian",
      columns: ["Obsidian", "Pinto Notes"],
      rows: [
        ["Where notes live", "Markdown files in a folder on your computer", "Synced to the cloud and kept on each device, as markdown"],
        ["Sync", "Obsidian Sync, $4 a month billed yearly or $5 monthly; or your own (iCloud Drive, Git)", "Built in, free"],
        ["Devices", "Mac, Windows, Linux, iPhone, Android", "Mac today; iPhone coming soon to the App Store"],
        ["AI apps can search and edit", "Through community plugins, on your computer", "Yes, from any device, with your approval"],
        ["Plugins and themes", "Thousands, from the community", "None"],
        ["Graph view and canvas", "Yes", "No"],
        ["Open source", "No (many plugins are)", "Yes (MIT)"],
      ],
      checked: CHECKED,
      note: "Obsidian's Sync price is from obsidian.md/pricing.",
    },
    faq: [
      { q: "Will my Obsidian links still work after I import?", a: [
        "Yes. Pinto Notes keeps [[Title]], [[Folder/Title]], [[Title|shown text]] and [[Title#Heading]] exactly as written and opens the note they name. If you go back to Obsidian, the text is unchanged.",
      ] },
      { q: "Do I still own my notes as files?", a: [
        "Yes. Your notes are stored as markdown, and Export Your Notes, in Settings, saves every note as a markdown file in its folder, with its files, whenever you like.",
      ] },
      { q: "Can I keep Obsidian open on the same notes?", a: [
        "Not live. Pinto Notes imports a copy of the vault, so pick one place to write. You could move the notes you use every day and leave the archive in Obsidian.",
      ] },
    ],
    read: [
      { href: "/blog/apple-notes-vs-obsidian", label: "Apple Notes vs Obsidian" },
      { href: "/blog/obsidian-mcp", label: "Obsidian MCP servers compared" },
      { href: "/blog/export-apple-notes-to-markdown", label: "How to export Apple Notes to Markdown" },
      { href: "/blog/best-notes-app-for-ai-agents", label: "The best notes app for AI agents" },
    ],
    closing: {
      title: "Keep your markdown, and skip the sync setup.",
      text: "Pinto Notes is free and open source under the MIT license. Import your vault on the Mac and connect the AI you already use.",
    },
  },
];

export const landingPath = (x: Pick<Landing, "kind" | "slug">) => `/${x.kind}/${x.slug}`;

export function landing(kind: Kind, slug: string): Landing | undefined {
  return landings.find((x) => x.kind === kind && x.slug === slug);
}
