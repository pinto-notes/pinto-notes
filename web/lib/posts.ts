/// Every blog post, in the order the index lists them. This is the one list: the index, the
/// sitemap, /llms.txt, "More posts" and "All posts" all read it. `draft` posts are noindex and
/// stay out of every list until they're approved.

export type Category = "Guides" | "Apple Notes" | "Comparisons" | "Building Pinto Notes";

/// A real capture of the app, in public/blog. `window` says whether the capture already has the
/// Mac window around it (true), or is a sheet or form that the page frames in a window (false).
/// `phone`: an iPhone screen, shown as the screen alone with its own rounded corners.
export type Shot = { src: string; alt: string; width: number; height: number; window: boolean; title?: string; phone?: boolean };

export type Post = {
  slug: string;
  title: string;
  /// The meta description, for search results (under about 160 characters).
  description: string;
  /// The card text on the index: two or three lines.
  excerpt: string;
  category: Category;
  /// When it was published, and the day it was last checked against the app (ISO dates).
  date: string;
  updated: string;
  /// The capture right after the intro, on the post's ground.
  image: Shot;
  /// The card's picture: its own ground and one focal capture, so no two posts look alike.
  thumb: Thumb;
  draft: boolean;
};

/// The ground a cover (and the post's first picture) sits on: the site's palette, the help page's
/// leaf brown, the app's dark look, or the home page's dunes.
export type Ground = "paper" | "soft" | "tint" | "amber" | "leaf" | "dark" | "dunes" | "ink" | "peach" | "cream" | "sand" | "clay" | "mist" | "honey" | "sage" | "heather" | "blush" | "wheat" | "fog" | "dusk" | "pearl" | "linen" | "night" | "rose" | "mint" | "sky" | "lemon" | "coral" | "lagoon" | "denim" | "slate" | "olive" | "plum" | "teal" | "berry" | "rust" | "apricot" | "ice" | "lilac" | "pistachio" | "fern" | "butter" | "harbor" | "orchid" | "cherry";

/// A card's picture: one real capture of the element the post is about, on the post's ground. The
/// capture is cropped at 2x (3x from iPhone) to about the card's width, so it shows at full size.
export type Thumb = { ground: Ground; src: string; width: number; height: number; alt: string; art?: boolean };

const thumb = (ground: Ground, name: string, width: number, height: number, alt: string): Thumb => ({ ground, src: `/blog/${name}.webp`, width, height, alt });

/// A card cover that fills the whole picture: the topic's own launch picture, or a light drawing of
/// the apps it's about (public/blog/covers). Never the app's UI.
const cover = (ground: Ground, name: string, width: number, height: number, alt: string): Thumb => ({ ground, src: `/blog/covers/${name}.webp`, width, height, alt, art: true });

export const AUTHOR = { name: "Emil Wagman", avatar: "/emil-wagman.jpg" };

export const SHOTS = {
  connectChatGPT: { src: "/blog/amber-notes-connect-chatgpt-steps.webp", alt: "Connect ChatGPT in Pinto Notes on a Mac, in three steps: add Pinto Notes in ChatGPT with the Copy Address and Open ChatGPT button, choose Open Pinto Notes on this Mac and Allow, then ask ChatGPT about your notes.", width: 1120, height: 610, window: false, title: "Connect ChatGPT" },
  connectClaude: { src: "/blog/amber-notes-connect-claude-steps.webp", alt: "Connect Claude in Pinto Notes on a Mac, in three steps: add it with the Open in Claude's Directory button, where it is listed as Amber Notes, choose Open Pinto Notes on this Mac and Allow, then ask Claude about your notes.", width: 1120, height: 590, window: false, title: "Connect Claude" },
  consent: { src: "/blog/amber-notes-allow-chatgpt-access.webp", alt: "Pinto Notes asking \"Allow ChatGPT to use your notes?\" with a choice of Read and Edit or Read Only, and Allow and Don't Allow buttons.", width: 840, height: 700, window: false, title: "Pinto Notes" },
  connectList: { src: "/blog/amber-notes-connect-an-ai.webp", alt: "Settings in Pinto Notes on a Mac: Connect an AI lists ChatGPT, Claude, Claude Code and Codex, with what's connected below.", width: 1040, height: 720, window: false, title: "Settings" },
  consentE2ee: { src: "/blog/amber-notes-allow-chatgpt-encrypted-notes.webp", alt: "Pinto Notes on a Mac asking \"Allow ChatGPT to use your notes?\": access goes to chatgpt.com, a choice of Read and Edit or Read Only, and a line saying that while it's connected it can read everything except locked notes.", width: 840, height: 712, window: false, title: "Pinto Notes" },
  notesPassword: { src: "/blog/amber-notes-locked-notes-password.webp", alt: "Pinto Notes on a Mac: Create a password for your locked notes, with Password, Verify and Hint fields, and the warning that if you forget this password, your locked notes can't be recovered, not even by us.", width: 880, height: 600, window: false, title: "Locked Notes" },
  coworkAllow: { src: "/blog/claude-wants-access-to-control-notes-macos.webp", alt: "The macOS prompt that appears when Claude first uses the Apple Notes extension: \u201cClaude\u201d wants access to control \u201cNotes\u201d. Allowing control will provide access to documents and data in \u201cNotes\u201d, and to perform actions within that app. Buttons: Don\u2019t Allow and Allow.", width: 520, height: 532, window: true },
  notesDefaultAccount: { src: "/blog/notes-default-account.webp", alt: "The General settings of Apple Notes on a Mac running macOS 26: Sort notes by Date Edited, New notes start with Title, and Default account set to iCloud, which Siri uses when creating notes.", width: 1093, height: 298, window: true },
  notesTableMenu: { src: "/blog/notes-format-table-menu.webp", alt: "The Format menu of Apple Notes on a Mac running macOS 26, at Table (Option-Command-T), with Convert to Text and Reverse Table Direction below it.", width: 700, height: 436, window: true },
  notesSmartFolderFilters: { src: "/blog/notes-smart-folder-filters.webp", alt: "The first pop-up menu of a Smart Folder rule in Apple Notes on a Mac running macOS 26, with Tags checked above Date Created, Date Edited, Shared, Mentions, Checklists, Attachments, Folders, Quick Notes, Pinned Notes and Locked Notes.", width: 560, height: 800, window: true },
  notesExportMenu: { src: "/blog/notes-export-menu.webp", alt: "The File menu of Apple Notes on a Mac running macOS 26, open at Export as, with PDF and Markdown in the submenu and Markdown selected.", width: 700, height: 453, window: true },
  importSheet: { src: "/blog/amber-notes-import-from-apple-notes.webp", alt: "The Import from Apple Notes sheet in Pinto Notes on a Mac: notes picked, Keep Apple Notes folders and Also bring over pinned notes ticked, and an Import 1,284 Notes button.", width: 1980, height: 1800, window: true },
  aiEdit: { src: "/blog/amber-notes-chatgpt-edit-undo.webp", alt: "A Groceries note in Pinto Notes on a Mac. The five lines ChatGPT just added are tinted, and a bar at the bottom says ChatGPT changed 5 lines, with Undo.", width: 1260, height: 1520, window: false, title: "Groceries" },
  history: { src: "/blog/amber-notes-version-history-chatgpt.webp", alt: "Version history for a Groceries note in Pinto Notes on a Mac: versions by you on iPhone and Mac, ChatGPT and Claude Code, with the lines that differ tinted and a Restore This Version button.", width: 1800, height: 1200, window: false, title: "Groceries" },
  welcome: { src: "/blog/amber-notes-markdown-welcome-note.webp", alt: "The Welcome to Pinto Notes note on a Mac: markdown that styles itself as you type, a checklist, bullets, inline code and a table.", width: 1250, height: 950, window: false, title: "Welcome to Pinto Notes" },
  historyBurst: { src: "/blog/amber-notes-version-history-restore.webp", alt: "Version history for a Groceries note on a Mac: versions by you on iPhone and Mac, ChatGPT and Claude Code, with the lines that differ tinted and a Restore This Version button.", width: 1800, height: 1200, window: false, title: "Groceries" },
  iphoneList: { src: "/blog/amber-notes-iphone-notes-edited-by-ai.webp", alt: "Pinto Notes on iPhone: the note list, with Groceries marked Edited by ChatGPT, Standup notes Edited by Claude Code and Lisbon Edited by Claude.", width: 1206, height: 2622, window: false, phone: true },
  tracker: { src: "/blog/amber-notes-evening-tracker-table.webp", alt: "An Evening tracker note in Pinto Notes on a Mac: a table with a row per day and columns for work hours, energy, mood and yes-or-no habits.", width: 1250, height: 900, window: false, title: "Evening tracker" },
  lisbon: { src: "/blog/amber-notes-lisbon-trip-note.webp", alt: "A Lisbon trip note in Pinto Notes on a Mac: a plan checklist, a list of places, a linked Hotel booking sub-note, and a table of where to eat.", width: 1250, height: 1420, window: false, title: "Lisbon" },
  iphoneFiles: { src: "/blog/amber-notes-iphone-files-in-a-note.webp", alt: "Pinto Notes on iPhone in dark mode: a Trip documents note holding a PDF, a CSV file, a photo and a link.", width: 1206, height: 2622, window: false, phone: true },
  iphoneGroceries: { src: "/blog/amber-notes-iphone-chatgpt-edited-checklist.webp", alt: "A Groceries checklist in Pinto Notes on iPhone. The five items ChatGPT just added are tinted, and a bar says ChatGPT changed 5 lines, with Undo.", width: 1206, height: 2622, window: false, phone: true },
  habitApp: { src: "/blog/pinto-notes-habit-tracker-app-mac.webp", alt: "The habit tracker app in a Pinto Notes note on a Mac: this week's ring at 62 percent, 2 of 6 habits done today, a grid of every habit's week, and the habits with their ticks and streaks, including Gym at 1 of 3 this week.", width: 1720, height: 1520, window: false, title: "Habit tracker" },
  budgetApp: { src: "/blog/pinto-notes-budget-log-app-mac.webp", alt: "The budget app in a Pinto Notes note on a Mac: 8,205 kr left in October with about 410 kr a day after bills, a chart of the last six months, this month's bills, and each category against its budget with what rolled over.", width: 1720, height: 1520, window: false, title: "Budget and expenses" },
  tripApp: { src: "/blog/pinto-notes-trip-plan-app-mac.webp", alt: "The trip plan app in a Pinto Notes note on a Mac: Lisbon, 9 days to go, 3 of 5 bookings paid, 5 of 14 items packed, and the first day as a timeline with the flight and the hotel in it.", width: 1720, height: 1520, window: false, title: "Trip plan" },
  flashcardsApp: { src: "/blog/pinto-notes-study-flashcards-app-mac.webp", alt: "The flashcards app in a Pinto Notes note on a Mac: 8 cards due today, topic pills, a Study now button, an 11-day streak with a calendar, what's coming up this week and how many cards are in each box.", width: 1720, height: 1520, window: false, title: "Study notes and flashcards" },
  standup: { src: "/blog/amber-notes-claude-code-standup-note.webp", alt: "Standup notes in Pinto Notes on a Mac. The line Claude Code just added is tinted, and a bar at the bottom says Claude Code changed 1 line, with Undo.", width: 1250, height: 1420, window: false, title: "Standup notes" },
} satisfies Record<string, Shot>;

export const posts: Post[] = [
  {
    slug: "chatgpt-chat-memory-full",
    title: "ChatGPT \"Chat memory full\": what it means and what to do",
    description: "Why ChatGPT says Chat memory full after a few messages, why deleting memories doesn't fix it, what to do instead, and how it differs from Memory full.",
    excerpt: "Since October, some ChatGPT chats stop with Chat memory full. It isn't your saved memories. What it is, what works, and how to keep your plans safe.",
    category: "Guides",
    date: "2026-10-26",
    updated: "2026-10-26",
    image: { src: "/blog/chat-memory-full/personalization-memory.webp", alt: "ChatGPT's Personalization settings: ChatGPT memory with Enable memory on and Memory summary with a Manage button.", width: 1200, height: 456, window: false },
    thumb: cover("honey", "chatgpt-chat-memory-full", 1600, 1000, "A paper chat window overfilled with speech bubbles, beside the OpenAI logo"),
    draft: false,
  },
  {
    slug: "codex-usage-reset",
    title: "\"Your usage does not need a reset right now\": Codex resets explained",
    description: "Why Codex refuses a banked reset above 80% left, how to use one in ChatGPT's Usage settings, what it restores per plan, and free versus paid resets.",
    excerpt: "Codex won't spend a saved reset until a limit drops below 80%. What that means, how to use one, and what to do when it's about to expire.",
    category: "Guides",
    date: "2026-10-25",
    updated: "2026-10-25",
    image: { src: "/blog/codex-reset/usage-limit-resets.webp", alt: "ChatGPT's Usage settings listing two Full resets available, with their expiry dates and Use reset buttons.", width: 1200, height: 402, window: false },
    thumb: cover("peach", "codex-usage-reset", 1600, 1000, "A paper usage meter nearly empty, with a refresh arrow beside it and the OpenAI logo"),
    draft: false,
  },
  {
    slug: "gemini-notebooks",
    title: "Gemini Notebooks: how to use them, now from any Gemini chat",
    description: "How to make a Gemini notebook, add sources and old chats, and use @Gemini Notebook from any chat (new on 23 October). Free limits, EEA and Mac notes.",
    excerpt: "Gemini's notebooks keep a project's files and chats together, and now any chat can fill them. How to set one up and what to ask.",
    category: "Guides",
    date: "2026-10-24",
    updated: "2026-10-24",
    image: { src: "/blog/gemini-notebooks/new-notebook.webp", alt: "The Gemini app on the web with Notebooks in the side menu and a new notebook being named Grad school application.", width: 1600, height: 800, window: false },
    thumb: cover("fog", "gemini-notebooks", 1600, 1000, "The Gemini Notebook logo, Google's arch mark beside the words Gemini Notebook"),
    draft: false,
  },
  {
    slug: "what-time-ai-companies-launch",
    title: "What time do AI companies launch? We timed 206 launches",
    description: "We counted six months of AI launches. 64% broke between 11 am and 5 pm US Eastern, Tuesday is the biggest day, and most days nothing ships.",
    excerpt: "Six months of AI launch news, counted by hour and weekday. Most land at lunchtime in New York, and Tuesday wins.",
    category: "Guides",
    date: "2026-10-23",
    updated: "2026-10-23",
    image: { src: "/blog/launch-times/ai-launches-hours.webp", alt: "A bar chart of 200 AI launches by the hour their first report appeared: 64% between 11 am and 5 pm US Eastern, with a peak at 1 pm.", width: 1600, height: 1000, window: false },
    thumb: cover("denim", "ai-launch-times", 1600, 1000, "A paper clock with the afternoon shaded amber, and three paper rockets taking off"),
    draft: false,
  },
  {
    slug: "new-ai-features",
    title: "Every new ChatGPT, Claude and Gemini feature in 2026, with dates",
    description: "Every new feature in ChatGPT, Claude and Gemini since April 2026, plus Grok, Meta AI, Perplexity and Copilot: the date, who gets it and the official page.",
    excerpt: "A running list of what the AI assistants shipped, newest first: the date, what it does, who gets it and the official link.",
    category: "Guides",
    date: "2026-10-22",
    updated: "2026-10-24",
    image: { src: "/blog/duet/duet-brief.webp", alt: "Two phone screens from Claude Duet: a lock screen notification with the morning summary, and the morning brief listing what needs attention today.", width: 1984, height: 1848, window: false },
    thumb: cover("sand", "ai-feature-tracker", 1600, 1000, "A paper wall calendar with the ChatGPT, Claude and Gemini marks pinned on three days"),
    draft: false,
  },
  {
    slug: "how-to-use-claude-duet",
    title: "How to use Claude Duet: what it does and how to get it",
    description: "Claude Duet is Anthropic's proactive agent for Pro and Max in the US. How to join the waitlist, connect your apps, what to ask first, and what it won't do.",
    excerpt: "Claude's new agent briefs you every morning and works while you're away. Who gets it, how to join, and what to hand it first.",
    category: "Guides",
    date: "2026-10-21",
    updated: "2026-10-21",
    image: SHOTS.connectClaude,
    thumb: cover("linen", "claude-duet", 1600, 1000, "The Claude Duet app icon beside the words Claude Duet, from Anthropic"),
    draft: false,
  },
  {
    slug: "lock-chats-in-chatgpt",
    title: "How to lock chats in ChatGPT with a PIN or Face ID",
    description: "Lock a ChatGPT chat from its ••• menu, open it with a PIN or Face ID, and know what it doesn't do: a forgotten PIN deletes every locked chat.",
    excerpt: "ChatGPT can now hide a chat behind a PIN. How to lock one, where it goes, and the reset that deletes them all.",
    category: "Guides",
    date: "2026-10-20",
    updated: "2026-10-20",
    image: SHOTS.notesPassword,
    thumb: cover("sage", "chatgpt-locked-chats", 1600, 1000, "A chat bubble with a green padlock, beside the ChatGPT logo"),
    draft: false,
  },
  {
    slug: "siri-ai-apple-notes",
    title: "Siri AI and Apple Notes: what it can do, and what it can't",
    description: "Siri AI finds, rewrites and makes notes. What it can do in Apple Notes, what Apple doesn't say, and the one thing it can't: let ChatGPT or Claude in.",
    excerpt: "Siri AI can find your notes and tidy the one you have open. What else it does, where you get it, and what Apple hasn't said yet.",
    category: "Apple Notes",
    date: "2026-10-14",
    updated: "2026-10-26",
    image: SHOTS.notesDefaultAccount,
    thumb: cover("cherry", "apple-siri-orb", 1600, 1000, "The Siri AI orb, a glass sphere with a band of light across it, on black. From Apple's Siri AI page"),
    draft: false,
  },
  {
    slug: "habit-tracker-with-chatgpt-or-claude",
    title: "A habit tracker ChatGPT and Claude can update for you",
    description: "Habit apps have their own AI coaches, but none let ChatGPT or Claude log your day. A free tracker that does, plus the prompt for one built in chat.",
    excerpt: "Every habit tracker dies from the ticking. The two ways to let the AI you already talk to fill it in, and the one that keeps working past week three.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-14",
    image: SHOTS.habitApp,
    thumb: cover("fern", "habit-tracker", 1600, 1000, "A week of habit circles, five of them ticked"),
    draft: false,
  },
  {
    slug: "budget-tracker-with-chatgpt-or-claude",
    title: "A budget ChatGPT and Claude can keep for you",
    description: "Most budget apps keep their AI to themselves. A free budget ChatGPT and Claude can add your spending to, where the app, not the AI, does the sums.",
    excerpt: "Budgets fail at writing things down. Tell the AI you already chat with what you spent, and let a real app, not the AI, do the maths.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-14",
    image: SHOTS.budgetApp,
    thumb: cover("butter", "budget", 1600, 1000, "Three growing stacks of gold coins"),
    draft: false,
  },
  {
    slug: "plan-a-trip-with-chatgpt-or-claude",
    title: "How to plan a trip with ChatGPT or Claude, and keep the itinerary",
    description: "Plan a trip with ChatGPT or Claude: a prompt for a day-by-day itinerary, then keep it, with bookings and packing, in a trip planner you can edit.",
    excerpt: "Getting an itinerary out of ChatGPT is easy. Keeping it, with the bookings and the packing list, is the part this post is about.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-14",
    image: SHOTS.tripApp,
    thumb: cover("harbor", "trip", 1600, 1000, "An orange suitcase and a plane on a dotted flight path"),
    draft: false,
  },
  {
    slug: "flashcards-with-chatgpt-or-claude",
    title: "How to make flashcards with ChatGPT or Claude",
    description: "Make flashcards from your notes with ChatGPT or Claude: a prompt for good cards, ChatGPT's own flashcards, and a study app that brings back what you miss.",
    excerpt: "Your AI can turn a chapter into cards in a minute. The prompt that keeps them short, and where to study them so the hard ones come back.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-14",
    image: SHOTS.flashcardsApp,
    thumb: cover("orchid", "flashcards", 1600, 1000, "A small stack of flashcards with a question mark on the top card"),
    draft: false,
  },
  {
    slug: "connect-notes-to-grok",
    title: "How to connect your notes to Grok with a custom MCP connector",
    description: "Add any MCP server to Grok as a custom connector on grok.com or with grok mcp add in Grok Build, so Grok can read and edit your notes.",
    excerpt: "Grok takes any MCP server as a custom connector. The steps on grok.com and in Grok Build, and what xAI's docs leave out.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-13",
    image: SHOTS.historyBurst,
    thumb: cover("pistachio", "xai-grok-bot", 1600, 840, "The Grok Bot face on an orange background, from xAI"),
    draft: false,
  },
  {
    slug: "meta-muse-connectors",
    title: "Meta Muse connectors: what they are, and which to add",
    description: "What Meta Muse connectors are, how to add and approve one, which to start with, and how Muse Code takes your own MCP servers.",
    excerpt: "Muse connects to other apps through connectors Meta reviews. How to add one, what the approvals mean, and where MCP fits.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-14",
    image: SHOTS.consent,
    thumb: cover("lilac", "meta-muse-apps", 1600, 900, "The Muse character beside a grid of app icons, from Meta"),
    draft: false,
  },
  {
    slug: "what-are-chatgpt-dots",
    title: "What are ChatGPT dots? What to give yours, and who can get one",
    description: "ChatGPT dots are always-on agents that keep working between conversations. Who can get one, how to set it up, and six jobs to give yours.",
    excerpt: "A dot follows up on its own, with its own computer, for weeks. Who gets one, how to set it up, and what to hand it first.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-13",
    image: SHOTS.history,
    thumb: cover("ice", "openai-dots", 1600, 900, "The word dots above four plush dot characters, from OpenAI"),
    draft: false,
  },
  {
    slug: "gpt-6-astra-use-cases",
    title: "GPT-6 Astra use cases: what it can do for you, and how to try it",
    description: "What GPT-6 Astra is, how to start computer use in the ChatGPT desktop app, eight everyday use cases, and where it still gets things wrong.",
    excerpt: "OpenAI's top model can click and type in apps on your Mac. How to switch it on, eight jobs to give it, and where it still needs you.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-13",
    image: SHOTS.iphoneGroceries,
    thumb: cover("apricot", "openai-gpt-6-astra", 1600, 900, "A spiral of stars shaped like a 6, OpenAI's picture for GPT-6 Astra"),
    draft: false,
  },
  {
    slug: "move-apple-notes-to-obsidian-notion-keep",
    title: "How to move Apple Notes to Obsidian, Notion or Google Keep",
    description: "Move your Apple Notes to Obsidian with its importer, to Notion through a Markdown export, or to Google Keep by hand, and what each one keeps.",
    excerpt: "Obsidian imports Apple Notes directly, Notion needs a Markdown detour, and Google Keep can't import at all. The steps for each.",
    category: "Apple Notes",
    date: "2026-10-12",
    updated: "2026-10-14",
    image: SHOTS.notesExportMenu,
    thumb: cover("rust", "move-apple-notes", 1600, 1000, "A notes app icon with arrows to Obsidian, Notion and Google Keep"),
    draft: false,
  },
  {
    slug: "journal-with-chatgpt-or-claude",
    title: "A daily journal with ChatGPT or Claude: prompts to copy",
    description: "A prompt that makes ChatGPT or Claude ask four journal questions and write the entry in your words, four more for other days, and where to keep them.",
    excerpt: "The AI asks four short questions and writes down what you say. One prompt for any AI, four more for the days it doesn't fit, and a way to keep every day in one note.",
    category: "Guides",
    date: "2026-10-11",
    updated: "2026-10-11",
    image: SHOTS.tracker,
    thumb: cover("berry", "journal", 1600, 1000, "An open journal with a pencil and a sun"),
    draft: false,
  },
  {
    slug: "apple-notes-templates",
    title: "Apple Notes templates: make your own, plus five to copy",
    description: "Apple Notes has no templates, but a folder of notes works. How to set it up on iPhone and Mac, plus five templates that paste in as checklists.",
    excerpt: "No templates button, but a folder of notes does the job. How to set it up, and five templates that paste in with real headings and checklists.",
    category: "Apple Notes",
    date: "2026-10-08",
    updated: "2026-10-14",
    image: { src: "/blog/macos27/notes-templates-window.webp", alt: "Apple Notes on macOS 27 with a Templates folder of five notes, and a Packing list open with three checklists.", width: 1538, height: 984, window: true },
    thumb: cover("olive", "templates", 1600, 1000, "A stack of notes with a COPY stamp"),
    draft: false,
  },
  {
    slug: "claude-memory-vs-notes",
    title: "Claude + Memory vs Claude + Notes",
    description: "What Claude's memory keeps and where to edit it, when you want notes Claude can read and write instead, and two prompts to use both.",
    excerpt: "Memory is Claude's own summary of you. Notes are your words, on your phone and computer. What each is for, and how to use both.",
    category: "Comparisons",
    date: "2026-10-07",
    updated: "2026-10-14",
    image: { src: "/blog/amber-notes-claude-edit-lisbon.webp", alt: "A Lisbon trip note in Pinto Notes on a Mac, with the line Claude just added tinted and a bar saying Claude changed 1 line, with Undo.", width: 1500, height: 748, window: false, title: "Lisbon" },
    thumb: cover("slate", "anthropic-claude-memory", 1600, 840, "A scribble in a paper thought bubble on peach, Anthropic's picture for Claude memory"),
    draft: false,
  },
  {
    slug: "apple-notes-not-syncing",
    title: "Apple Notes not syncing between iPhone and Mac? 6 checks",
    description: "Find which device is at fault in a minute, then six checks in order, including the iOS 27 message that looks like a sync failure but isn't one.",
    excerpt: "A note from your iPhone isn't on your Mac. Three questions find the cause, then six checks in order, plus shared notes that won't update.",
    category: "Apple Notes",
    date: "2026-10-05",
    updated: "2026-10-14",
    image: SHOTS.notesDefaultAccount,
    thumb: cover("lagoon", "not-syncing", 1600, 1000, "Two notes icons with a cloud between them showing an exclamation mark"),
    draft: false,
  },
  {
    slug: "apple-notes-tables",
    title: "Apple Notes tables: sums, sorting and the trick for totals",
    description: "Apple Notes can't sum a table column, but there's a trick that gets you a total anyway. Plus rows, sorting and widths, tested on macOS 27.",
    excerpt: "I planned a move in an Apple Notes table and hit the wall at the total. Every table action with screenshots, the trick that adds it up anyway, and where Notes runs out.",
    category: "Apple Notes",
    date: "2026-10-04",
    updated: "2026-10-14",
    image: SHOTS.notesTableMenu,
    thumb: cover("lemon", "tables", 1600, 1000, "A notes icon beside a small table with a total of 505"),
    draft: false,
  },
  {
    slug: "apple-notes-tags-smart-folders",
    title: "Apple Notes tags and Smart Folders: how they work, and why they stop working",
    description: "How tags and Smart Folders work in Apple Notes on iPhone and Mac, and the fixes when a tag won't form, a note can't be tagged or a Smart Folder is empty.",
    excerpt: "A tag is a word after #, and a Smart Folder is a saved filter. Why a tag won't form, why a note refuses tags, and what a Smart Folder can't do.",
    category: "Apple Notes",
    date: "2026-10-04",
    updated: "2026-10-04",
    image: SHOTS.notesSmartFolderFilters,
    thumb: cover("coral", "tags", 1600, 1000, "A notes icon beside the tags #recipes, #travel and #work"),
    draft: false,
  },
  {
    slug: "move-apple-notes-to-icloud",
    title: "Move Apple Notes to iCloud from On My iPhone or Gmail",
    description: "Notes under On My iPhone or Gmail never reach your Mac. How to move them into iCloud on iPhone or Mac, and what to check first for locked notes.",
    excerpt: "Notes in On My iPhone or Gmail stay put until you move them. The taps on iPhone, the drag on a Mac, what can get lost on the way, and a checklist for afterwards.",
    category: "Apple Notes",
    date: "2026-10-02",
    updated: "2026-10-14",
    image: SHOTS.notesDefaultAccount,
    thumb: cover("sky", "move-to-icloud", 1600, 1000, "A notes icon with an arrow to iCloud"),
    draft: false,
  },
  {
    slug: "back-up-apple-notes",
    title: "How to back up Apple Notes",
    description: "iCloud syncs Apple Notes but keeps no old copies. How to back up every note to files on your Mac, and what iPhone backups and Time Machine cover.",
    excerpt: "iCloud keeps your notes in sync, which isn't the same as a copy you can go back to. What actually backs up Apple Notes, and a routine to follow.",
    category: "Apple Notes",
    date: "2026-10-02",
    updated: "2026-10-14",
    image: SHOTS.notesExportMenu,
    thumb: cover("mint", "back-up", 1600, 1000, "A notes icon with an arrow to a Notes folder"),
    draft: false,
  },
  {
    slug: "recover-deleted-apple-notes",
    title: "Recover deleted Apple Notes: within 30 days, and after",
    description: "Within 30 days it's in Recently Deleted on any device or iCloud.com. After that, the few cases that still work, and which recovery apps to avoid.",
    excerpt: "Within 30 days it's almost always in Recently Deleted. After that, what still works, what doesn't, and what recovery apps won't tell you.",
    category: "Apple Notes",
    date: "2026-10-01",
    updated: "2026-10-14",
    image: SHOTS.history,
    thumb: cover("night", "recover-deleted", 1600, 1000, "A note lifting back out of a bin, with an arrow"),
    draft: false,
  },
  {
    slug: "forgot-apple-notes-password",
    title: "Forgot your Apple Notes password? 5 things to try first",
    description: "A reset won't unlock your old locked notes, which most guides skip. Five things that can still get you in on iPhone and Mac, then how to reset safely.",
    excerpt: "Try these first, then reset. Resetting lets you lock new notes, but it never opens the old ones. Nobody can, and here's why.",
    category: "Apple Notes",
    date: "2026-10-01",
    updated: "2026-10-14",
    image: SHOTS.notesPassword,
    thumb: cover("pearl", "forgot-password", 1600, 1000, "A notes icon with an orange padlock"),
    draft: false,
  },
  {
    slug: "encrypted-notes-app-for-ai",
    title: "An encrypted notes app that ChatGPT and Claude can use",
    description: "Pinto Notes encrypts every note on your iPhone or Mac and still lets ChatGPT and Claude read and edit them. How it works, its limits, and how others compare.",
    excerpt: "Every note is encrypted on your devices, and ChatGPT and Claude can still use them once you approve. How, what stays readable, and how Apple Notes, Standard Notes, Notesnook, Obsidian and Notion compare.",
    category: "Building Pinto Notes",
    date: "2026-10-01",
    updated: "2026-10-01",
    image: SHOTS.consentE2ee,
    thumb: cover("dusk", "encrypted", 1600, 1000, "A note with a padlock, between the ChatGPT and Claude marks"),
    draft: false,
  },
  {
    slug: "apple-notes-ios-27",
    title: "What's new in Apple Notes in iOS 27, and how to use it",
    description: "New in Apple Notes in iOS 27 and macOS 27: divider lines, links to sections, Paste and Copy as Markdown, and Export To. Each one with a screenshot.",
    excerpt: "Divider lines, links that jump to a heading, and Markdown that pastes in formatted. Each new feature with a screenshot and the menu to find it.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: { src: "/blog/macos27/notes27-garden-note.webp", alt: "A Spring garden plan note in Apple Notes on macOS 27, with a link to the Seeds to order section at the top and divider lines between its sections.", width: 1400, height: 993, window: false },
    thumb: cover("wheat", "apple-os-27", 1600, 840, "The glassy 27 icon among a Mac, an iPhone, a watch and Vision Pro, from Apple"),
    draft: false,
  },
  {
    slug: "export-apple-notes-to-markdown",
    title: "How to export Apple Notes to Markdown",
    description: "Export a note from Apple Notes as a Markdown file on Mac and iPhone, what to check in the file, and how to export every note at once.",
    excerpt: "Apple Notes exports Markdown on its own now, one note at a time. The steps on Mac and iPhone, what to check, and what to use for all of them.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: SHOTS.welcome,
    thumb: cover("blush", "export-markdown", 1600, 1000, "A notes icon with an arrow to the Markdown mark"),
    draft: false,
  },
  {
    slug: "connect-chatgpt-to-your-notes",
    title: "How to connect ChatGPT to your notes",
    description: "What ChatGPT can do with Apple Notes, Notion and Google Drive today, where each stops, and how to let it write to your notes from any chat.",
    excerpt: "Where ChatGPT can reach your notes today (Apple Notes, Notion, Drive), where it stops, and the setup that lets its changes land in your notes.",
    category: "Guides",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: SHOTS.connectChatGPT,
    thumb: cover("paper", "openai-apps-in-chatgpt", 1600, 900, "A stacked-layers app icon on a soft blue gradient, OpenAI's picture for apps in ChatGPT"),
    draft: false,
  },
  {
    slug: "claude-and-apple-notes",
    title: "Can Claude read your Apple Notes?",
    description: "What works today on a Mac, what doesn't work on iPhone or the web, and the options side by side.",
    excerpt: "On a Mac, yes. On iPhone and in the browser, no. Why it depends on where you use Claude, and what each option can and can't do.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: SHOTS.connectClaude,
    thumb: cover("leaf", "claude-apple-notes", 1600, 1000, "The Claude logo linked to a notes icon"),
    draft: false,
  },
  {
    slug: "notes-apps-with-mcp",
    title: "Notes apps with an MCP server, compared",
    description: "Which notes apps ChatGPT and Claude can read and edit through MCP, whether that works away from your Mac, and what to check before you pick one.",
    excerpt: "Notion, Evernote, Bear, Obsidian, Apple Notes and more: which ones your AI can reach from your phone, and what happens when it gets an edit wrong.",
    category: "Comparisons",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: SHOTS.aiEdit,
    thumb: cover("dunes", "notes-apps-mcp", 1600, 1000, "The MCP mark connected to Notion, Obsidian, Evernote and ChatGPT"),
    draft: false,
  },
  {
    slug: "obsidian-mcp",
    title: "Obsidian MCP servers compared (2026)",
    description: "There's no official Obsidian MCP server. The community plugins and servers compared, how to set one up in Claude, and the limits they share.",
    excerpt: "Plugins that serve your vault from inside Obsidian, and servers that work on the files. Seven compared, the setup in Claude, and what none of them can do.",
    category: "Comparisons",
    date: "2026-09-30",
    updated: "2026-09-30",
    image: SHOTS.lisbon,
    thumb: cover("heather", "obsidian-banner", 1600, 917, "The purple Obsidian crystal logo with Sharpen your thinking, from Obsidian"),
    draft: false,
  },
  {
    slug: "move-from-apple-notes",
    title: "How to move from Apple Notes to Pinto Notes",
    description: "Import all your Apple Notes on your Mac, with folders, checklists and tables. Apple Notes stays untouched.",
    excerpt: "Bring every note over in one go on your Mac, folders and pins included. Nothing in Apple Notes changes, so you can take your time.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: SHOTS.importSheet,
    thumb: cover("soft", "move-from-apple-notes", 1600, 1000, "A notes icon with an arrow to the Pinto Notes icon"),
    draft: false,
  },
  {
    slug: "notes-in-claude-code-and-codex",
    title: "Your notes in Claude Code and Codex, in one command",
    description: "Give Claude Code and Codex your notes with one command, so they write the standup and remember decisions you can read on your phone.",
    excerpt: "Claude Code starts every session from zero. One command gives it, and Codex, the same notes you read on your phone.",
    category: "Guides",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: SHOTS.connectList,
    thumb: cover("dark", "claude-code-codex", 1600, 1000, "A terminal with the Claude and OpenAI marks, with an arrow to a note"),
    draft: false,
  },
  {
    slug: "mcp-server",
    title: "The Pinto Notes MCP server",
    description: "The server address, how sign-in and approval work, and every tool an AI app can call.",
    excerpt: "For developers and curious people: the address, how an AI app signs in and gets approved, and every tool it can call.",
    category: "Guides",
    date: "2026-09-30",
    updated: "2026-10-02",
    image: SHOTS.consent,
    thumb: cover("amber", "anthropic-mcp", 1600, 840, "White paper shapes joined to one hub on orange, Anthropic's picture for the Model Context Protocol"),
    draft: false,
  },
  {
    slug: "apple-notes-api",
    title: "Apple Notes API: Apple says no. Here's what works instead",
    description: "Apple Notes has no API. What works instead: AppleScript, Shortcuts and every Apple Notes MCP server for Claude and Codex, compared, plus their limits.",
    excerpt: "Apple's own answer, in one word, and every way around it that works today: AppleScript, Shortcuts and Claude on a Mac. Plus the one thing none of them can do.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: SHOTS.connectList,
    thumb: cover("ink", "api", 1600, 1000, "A notes icon beside a code tile with curly brackets"),
    draft: false,
  },
  {
    slug: "best-notes-app-for-ai-agents",
    title: "The best notes app for AI agents",
    description: "What an AI agent needs from a notes app: remote MCP, precise writes, undo and history, approval, and apps you read on. How the options compare.",
    excerpt: "Remote MCP, precise writes, undo, approval and a phone app to read the results: the criteria that matter, and how the options compare.",
    category: "Comparisons",
    date: "2026-09-30",
    updated: "2026-10-14",
    image: SHOTS.tracker,
    thumb: cover("cream", "best-for-agents", 1600, 1000, "ChatGPT, Claude, Gemini and Copilot marks all leading into one note"),
    draft: false,
  },
  {
    slug: "chatgpt-and-apple-notes",
    title: "How to use ChatGPT with Apple Notes",
    description: "The three ways ChatGPT can work with Apple Notes today, what each can and can't do, and when a different notes app makes sense.",
    excerpt: "ChatGPT can help with the note in front of you, but it can't search your notes or save to them. The three ways it works today.",
    category: "Guides",
    date: "2026-09-30",
    updated: "2026-10-01",
    image: SHOTS.aiEdit,
    thumb: cover("paper", "chatgpt-apple-notes", 1600, 1000, "The ChatGPT logo linked to a notes icon"),
    draft: true,
  },
];

export const post = (slug: string): Post => {
  const p = posts.find((x) => x.slug === slug);
  if (!p) throw new Error(`No post ${slug}`);
  return p;
};

export const published = () => posts.filter((p) => !p.draft);

/// Categories that have at least one published post, in a fixed order.
export const categories = (): Category[] =>
  (["Guides", "Apple Notes", "Comparisons", "Building Pinto Notes"] as Category[]).filter((c) => published().some((p) => p.category === c));

/// Each category's paper-craft cover (public/art, 1672 x 941): the top of every post in it that has no
/// banner of its own, and its cards and chip on the blog's lists, until posts get covers of their own.
export type Cover = { src: string; alt: string; width: number; height: number };
export const CATEGORY_COVERS: Record<Category, Cover> = {
  "Guides": { src: "/art/blog-guides.webp", alt: "A paper-cut chat bubble passing a folded note into an open notebook on a blue desk.", width: 1672, height: 941 },
  "Comparisons": { src: "/art/blog-comparisons.webp", alt: "Two paper notebooks, one green and one brown, weighed on a paper balance scale in green hills.", width: 1672, height: 941 },
  "Apple Notes": { src: "/art/blog-applenotes.webp", alt: "A yellow paper notepad with a leaf bookmark beside a cup of tea.", width: 1672, height: 941 },
  "Building Pinto Notes": { src: "/art/blog-building.webp", alt: "A paper-cut workbench with scissors, glue and a paper leaf being put together.", width: 1672, height: 941 },
};

export const categoryAnchor = (c: Category) => c.toLowerCase().replace(/\s+/g, "-");

/// The category's own page, which lists its posts (paged like the index).
export const categoryPath = (c: Category) => `/blog/category/${categoryAnchor(c)}`;

export const categoryFromAnchor = (anchor: string): Category | undefined => categories().find((c) => categoryAnchor(c) === anchor);

/// The posts the blog presents as cards: what's new in AI, and what Pinto Notes does. Help with other
/// apps (an Apple Notes password, a table) is for search and goes under "More answers". The
/// newest leads as the wide card; the rest go two to a row. Every other post is listed under "More
/// answers" (lib/more-answers.ts), so it stays one click from the index for readers and crawlers.
export const FEATURED = [
  "chatgpt-chat-memory-full",
  "codex-usage-reset",
  "gemini-notebooks",
  "what-time-ai-companies-launch",
  "how-to-use-claude-duet",
  "lock-chats-in-chatgpt",
  "siri-ai-apple-notes",
  "habit-tracker-with-chatgpt-or-claude",
  "budget-tracker-with-chatgpt-or-claude",
  "plan-a-trip-with-chatgpt-or-claude",
  "connect-notes-to-grok",
  "meta-muse-connectors",
  "what-are-chatgpt-dots",
  "gpt-6-astra-use-cases",
  "claude-memory-vs-notes",
  "flashcards-with-chatgpt-or-claude",
];
export const isFeatured = (p: Post) => FEATURED.includes(p.slug);

/// Posts per page on the index and on each category page.
export const PER_PAGE = 12;

/// Published posts, newest first (by date; the list order breaks ties).
export function newestFirst(list: Post[] = published()): Post[] {
  return list.map((p, i) => [p, i] as const).sort((a, b) => b[0].date.localeCompare(a[0].date) || a[1] - b[1]).map(([p]) => p);
}

/// Since 16 October 2026 every list is one page: the featured cards, then "More answers" with the
/// rest, so FIRST_PAGE holds any list. Old /page/<n> addresses redirect to the list.
export const FIRST_PAGE = 1000;

/// A last page of this many posts or fewer joins the page before it, so no page holds a stray card or two.
export const FOLD = 2;

/// Where each page of a list starts, and the end: page 1 holds FIRST_PAGE, the rest PER_PAGE, and a
/// small remainder (FOLD or fewer) stays on the page before it.
function bounds(length: number): number[] {
  const b = [0];
  let at = Math.min(FIRST_PAGE, length);
  while (at < length) { b.push(at); at = Math.min(at + PER_PAGE, length); }
  if (b.length > 1 && length - b[b.length - 1] <= FOLD) b.pop();
  return [...b, length];
}

export const pageCount = (list: Post[]) => Math.max(1, bounds(list.length).length - 1);

/// Page `n` (from 1) of a list.
export const pageOf = (list: Post[], n: number) => {
  const b = bounds(list.length);
  return n < 1 || n >= b.length ? [] : list.slice(b[n - 1], b[n]);
};

/// Where page `n` of a list lives: the list's own address for page 1, then <base>/page/<n>.
export const pagePath = (base: string, n: number) => (n === 1 ? base : `${base}/page/${n}`);

/// The highest page number the blog has ever had, generously: pages past a list's last page, up to
/// here, redirect to its last page (next.config.ts), so an address that was live and indexed before
/// a list shrank (posts removed, or a short last page folded) never turns into a 404.
export const MAX_PAGE_EVER = 12;

/// One permanent redirect for every page number past each list's last page: to that last page, or
/// to the list itself when it has one page.
export function pastLastPageRedirects(): { source: string; destination: string; permanent: true }[] {
  const all = newestFirst();
  const lists = [{ base: "/blog", posts: all }, ...categories().map((c) => ({ base: categoryPath(c), posts: all.filter((p) => p.category === c) }))];
  return lists.flatMap(({ base, posts }) => {
    const last = pageCount(posts);
    return Array.from({ length: Math.max(0, MAX_PAGE_EVER - last) }, (_, i) => ({ source: `${base}/page/${last + 1 + i}`, destination: pagePath(base, last), permanent: true as const }));
  });
}

/// Two other published posts to read next: the same category first, then the rest, in list order.
export function morePosts(slug: string, n = 2): Post[] {
  const me = post(slug);
  const others = published().filter((p) => p.slug !== slug);
  return [...others.filter((p) => p.category === me.category), ...others.filter((p) => p.category !== me.category)].slice(0, n);
}
