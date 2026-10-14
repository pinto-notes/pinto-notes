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
export type Thumb = { ground: Ground; src: string; width: number; height: number; alt: string };

const thumb = (ground: Ground, name: string, width: number, height: number, alt: string): Thumb => ({ ground, src: `/blog/${name}.webp`, width, height, alt });

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
    slug: "siri-ai-apple-notes",
    title: "Siri AI and Apple Notes: what it can do with your notes",
    description: "What Siri AI can do with Apple Notes: find, make, proofread and summarize notes, which devices have it, Apple TV and HomeView, and where ChatGPT fits.",
    excerpt: "Siri AI can find your notes and tidy the one you have open. What else it does, where you get it, and what Apple hasn't said yet.",
    category: "Apple Notes",
    date: "2026-10-14",
    updated: "2026-10-14",
    image: SHOTS.notesDefaultAccount,
    thumb: thumb("cherry", "thumb-notes-list-templates", 766, 760, "Apple Notes on a Mac with a Templates folder of five notes in the list"),
    draft: false,
  },
  {
    slug: "habit-tracker-with-chatgpt-or-claude",
    title: "How to make a habit tracker with ChatGPT or Claude (that you can still edit yourself)",
    description: "Make a habit tracker with ChatGPT or Claude: the prompt for one built in chat, a free template with its own app, and where each one stops working.",
    excerpt: "Ask your AI to build one in chat, or start from a habit tracker app it can update. The steps for both, and what each can't do.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-13",
    image: SHOTS.habitApp,
    thumb: thumb("fern", "thumb-app-habit-tracker", 1180, 748, "A habit tracker app in Pinto Notes on a Mac: 2 of 6 habits done today, with streaks and the week"),
    draft: false,
  },
  {
    slug: "budget-tracker-with-chatgpt-or-claude",
    title: "How to make a budget tracker with ChatGPT or Claude",
    description: "Make a budget and expense tracker with ChatGPT or Claude: the prompt, a free template with its own app, and what an AI gets wrong about your money.",
    excerpt: "A budget your AI can add expenses to and you can still edit by hand. The template route, the build-your-own route, and their limits.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-13",
    image: SHOTS.budgetApp,
    thumb: thumb("butter", "thumb-app-budget-log", 1180, 748, "A budget app in Pinto Notes on a Mac: 8,205 kr left this month, and the last six months"),
    draft: false,
  },
  {
    slug: "plan-a-trip-with-chatgpt-or-claude",
    title: "How to plan a trip with ChatGPT or Claude, and keep the itinerary",
    description: "Plan a trip with ChatGPT or Claude: a prompt for a day-by-day itinerary, then keep it, with bookings and packing, in a trip planner you can edit.",
    excerpt: "Getting an itinerary out of ChatGPT is easy. Keeping it, with the bookings and the packing list, is the part this post is about.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-13",
    image: SHOTS.tripApp,
    thumb: thumb("harbor", "thumb-app-trip-plan", 1180, 748, "A trip plan app in Pinto Notes on a Mac: Lisbon, 9 days to go, and the first day as a timeline"),
    draft: false,
  },
  {
    slug: "flashcards-with-chatgpt-or-claude",
    title: "How to make flashcards with ChatGPT or Claude",
    description: "Make flashcards from your notes with ChatGPT or Claude: a prompt for good cards, ChatGPT's own flashcards, and a study app that brings back what you miss.",
    excerpt: "Your AI can turn a chapter into cards in a minute. The prompt that keeps them short, and where to study them so the hard ones come back.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-13",
    image: SHOTS.flashcardsApp,
    thumb: thumb("orchid", "thumb-app-study-flashcards", 1180, 748, "A flashcards app in Pinto Notes on a Mac: 8 cards due today and what's coming up"),
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
    thumb: thumb("pistachio", "thumb-lisbon-window", 1180, 748, "Pinto Notes on a Mac: a Lisbon note with the line Claude added tinted, and Undo"),
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
    thumb: thumb("lilac", "thumb-consent-icons", 780, 524, "Pinto Notes asking to allow an AI to use your notes, with Read and Edit or Read Only"),
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
    thumb: thumb("ice", "thumb-history-chatgpt", 820, 560, "Version history for a Groceries note, with a version by ChatGPT selected"),
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
    thumb: thumb("apricot", "thumb-iphone-chatgpt-undo", 1146, 800, "A checklist on iPhone with the bar ChatGPT changed 5 lines, and Undo"),
    draft: false,
  },
  {
    slug: "move-apple-notes-to-obsidian-notion-keep",
    title: "How to move Apple Notes to Obsidian, Notion or Google Keep",
    description: "Move your Apple Notes to Obsidian with its importer, to Notion through a Markdown export, or to Google Keep by hand, and what each one keeps.",
    excerpt: "Obsidian imports Apple Notes directly, Notion needs a Markdown detour, and Google Keep can't import at all. The steps for each.",
    category: "Apple Notes",
    date: "2026-10-12",
    updated: "2026-10-12",
    image: SHOTS.notesExportMenu,
    thumb: thumb("rust", "thumb-notes-export-to", 800, 528, "The Apple Notes File menu on macOS 27, open at Export To, with Markdown"),
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
    thumb: thumb("berry", "thumb-tracker-evening", 827, 546, "An Evening tracker note in Pinto Notes: one row a day, with work hours, energy and mood"),
    draft: false,
  },
  {
    slug: "apple-notes-templates",
    title: "Apple Notes templates: make your own, plus five to copy",
    description: "Apple Notes has no templates, but a folder of notes works. How to set it up on iPhone and Mac, plus five templates that paste in as checklists.",
    excerpt: "No templates button, but a folder of notes does the job. How to set it up, and five templates that paste in with real headings and checklists.",
    category: "Apple Notes",
    date: "2026-10-08",
    updated: "2026-10-08",
    image: { src: "/blog/macos27/notes-templates-window.webp", alt: "Apple Notes on macOS 27 with a Templates folder of five notes, and a Packing list open with three checklists.", width: 1538, height: 984, window: true },
    thumb: thumb("olive", "thumb-notes-templates", 660, 730, "A Packing list note in Apple Notes with Documents, Clothes and Bag checklists"),
    draft: false,
  },
  {
    slug: "claude-memory-vs-notes",
    title: "Claude memory vs notes Claude can read and write",
    description: "What Claude's memory keeps and where to edit it, when you want notes Claude can read and write instead, and two prompts to use both.",
    excerpt: "Memory is Claude's own summary of you. Notes are your words, on your phone and computer. What each is for, and how to use both.",
    category: "Comparisons",
    date: "2026-10-07",
    updated: "2026-10-07",
    image: { src: "/blog/amber-notes-claude-edit-lisbon.webp", alt: "A Lisbon trip note in Pinto Notes on a Mac, with the line Claude just added tinted and a bar saying Claude changed 1 line, with Undo.", width: 1500, height: 748, window: false, title: "Lisbon" },
    thumb: thumb("slate", "thumb-lisbon-claude", 900, 555, "A Lisbon plan checklist with the line Claude added tinted, and Claude changed 1 line, Undo"),
    draft: false,
  },
  {
    slug: "apple-notes-not-syncing",
    title: "Apple Notes not syncing between iPhone and Mac: how to fix it",
    description: "Why Apple Notes stops syncing between iPhone and Mac, and the fixes in order: iCloud settings, Apple Account, note account, storage, iOS 27 updates.",
    excerpt: "A note from your iPhone isn't on your Mac. Three questions find the cause, then six checks in order, plus shared notes that won't update.",
    category: "Apple Notes",
    date: "2026-10-05",
    updated: "2026-10-09",
    image: SHOTS.notesDefaultAccount,
    thumb: thumb("lagoon", "thumb-notes-sync-default-account", 800, 528, "Apple Notes settings on a Mac with Default account set to iCloud"),
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
    thumb: thumb("lemon", "thumb-notes-format-table-menu", 800, 528, "The Apple Notes Format menu on a Mac, open at Table"),
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
    thumb: thumb("coral", "thumb-notes-smart-folder-filters", 800, 528, "The rule menu of an Apple Notes Smart Folder on a Mac, with Tags checked"),
    draft: false,
  },
  {
    slug: "move-apple-notes-to-icloud",
    title: "How to move Apple Notes from On My iPhone or Gmail to iCloud",
    description: "Move notes from On My iPhone or Gmail into iCloud on iPhone or Mac, and what to check first for locked notes and Gmail notes.",
    excerpt: "Notes in On My iPhone or Gmail stay put until you move them. The taps on iPhone, the drag on a Mac, what can get lost on the way, and a checklist for afterwards.",
    category: "Apple Notes",
    date: "2026-10-02",
    updated: "2026-10-10",
    image: SHOTS.notesDefaultAccount,
    thumb: thumb("sky", "thumb-notes-default-account", 800, 528, "Apple Notes settings on a Mac with Default account set to iCloud"),
    draft: false,
  },
  {
    slug: "back-up-apple-notes",
    title: "How to back up Apple Notes",
    description: "iCloud syncs Apple Notes but keeps no old copies. How to back up every note to files on your Mac, and what iPhone backups and Time Machine cover.",
    excerpt: "iCloud keeps your notes in sync, which isn't the same as a copy you can go back to. What actually backs up Apple Notes, and a routine to follow.",
    category: "Apple Notes",
    date: "2026-10-02",
    updated: "2026-10-02",
    image: SHOTS.notesExportMenu,
    thumb: thumb("mint", "thumb-notes-export-menu", 800, 528, "The Apple Notes File menu open at Export as, with Markdown selected"),
    draft: false,
  },
  {
    slug: "recover-deleted-apple-notes",
    title: "How to recover deleted Apple Notes, including after 30 days",
    description: "Get back deleted Apple Notes from Recently Deleted on iPhone, Mac and iCloud.com, what works after 30 days, and why Gmail notes and locked notes are different.",
    excerpt: "Within 30 days it's almost always in Recently Deleted. After that, what still works, what doesn't, and what recovery apps won't tell you.",
    category: "Apple Notes",
    date: "2026-10-01",
    updated: "2026-10-07",
    image: SHOTS.history,
    thumb: thumb("night", "thumb-restore-dark", 846, 558, "An earlier version of a Groceries note in Pinto Notes, in dark mode"),
    draft: false,
  },
  {
    slug: "forgot-apple-notes-password",
    title: "Forgot your Apple Notes password? What works, and what doesn't",
    description: "What to try before you reset a forgotten Apple Notes password, how to reset it on iPhone and Mac, and why Apple and unlock tools can't open old locked notes.",
    excerpt: "Try these first, then reset. Resetting lets you lock new notes, but it never opens the old ones. Nobody can, and here's why.",
    category: "Apple Notes",
    date: "2026-10-01",
    updated: "2026-10-01",
    image: SHOTS.notesPassword,
    thumb: thumb("pearl", "thumb-notes-password", 896, 591, "Pinto Notes asking you to create a password for locked notes"),
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
    thumb: thumb("dusk", "thumb-consent-e2ee", 826, 545, "Pinto Notes asking to let ChatGPT use your notes"),
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
    thumb: thumb("wheat", "thumb-notes27-garden", 800, 500, "An Apple Notes note on macOS 27 with a section link and a divider line"),
    draft: false,
  },
  {
    slug: "export-apple-notes-to-markdown",
    title: "How to export Apple Notes to Markdown",
    description: "Export a note from Apple Notes as a Markdown file on Mac and iPhone, what to check in the file, and how to export every note at once.",
    excerpt: "Apple Notes exports Markdown on its own now, one note at a time. The steps on Mac and iPhone, what to check, and what to use for all of them.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-09-30",
    image: SHOTS.welcome,
    thumb: thumb("blush", "thumb-markdown-title", 714, 471, "The Welcome to Pinto Notes note, written in Markdown"),
    draft: false,
  },
  {
    slug: "connect-chatgpt-to-your-notes",
    title: "How to connect ChatGPT to your notes",
    description: "Let ChatGPT or Claude read and update your notes on iPhone and Mac. What you need, the steps, and how you stay in control.",
    excerpt: "Ask ChatGPT to add to a list or tidy a note, and the change lands in your notes. The steps for ChatGPT and Claude, and how you stay in control.",
    category: "Guides",
    date: "2026-09-30",
    updated: "2026-10-12",
    image: SHOTS.connectChatGPT,
    thumb: thumb("paper", "thumb-connect-chatgpt", 704, 572, "The steps to connect ChatGPT in Pinto Notes"),
    draft: false,
  },
  {
    slug: "claude-and-apple-notes",
    title: "Can Claude read your Apple Notes?",
    description: "What works today on a Mac, what doesn't work on iPhone or the web, and the options side by side.",
    excerpt: "On a Mac, yes. On iPhone and in the browser, no. Why it depends on where you use Claude, and what each option can and can't do.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-10-02",
    image: SHOTS.connectClaude,
    thumb: thumb("leaf", "thumb-connect-claude", 704, 451, "The steps to connect Claude in Pinto Notes"),
    draft: false,
  },
  {
    slug: "notes-apps-with-mcp",
    title: "Notes apps with an MCP server, compared",
    description: "Which notes apps ChatGPT and Claude can read and edit through MCP, whether that works away from your Mac, and what to check before you pick one.",
    excerpt: "Notion, Evernote, Bear, Obsidian, Apple Notes and more: which ones your AI can reach from your phone, and what happens when it gets an edit wrong.",
    category: "Comparisons",
    date: "2026-09-30",
    updated: "2026-10-01",
    image: SHOTS.aiEdit,
    thumb: thumb("dunes", "thumb-ai-rows", 733, 533, "A grocery checklist with the five lines an AI added tinted"),
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
    thumb: thumb("heather", "thumb-lisbon-link", 744, 491, "A Lisbon note linking to a Hotel booking sub-note"),
    draft: false,
  },
  {
    slug: "move-from-apple-notes",
    title: "How to move from Apple Notes to Pinto Notes",
    description: "Import all your Apple Notes on your Mac, with folders, checklists and tables. Apple Notes stays untouched.",
    excerpt: "Bring every note over in one go on your Mac, folders and pins included. Nothing in Apple Notes changes, so you can take your time.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-10-12",
    image: SHOTS.importSheet,
    thumb: thumb("soft", "thumb-import", 750, 523, "Notes picked for import from Apple Notes into Pinto Notes"),
    draft: false,
  },
  {
    slug: "notes-in-claude-code-and-codex",
    title: "Use your notes from Claude Code and Codex",
    description: "Add Pinto Notes to Claude Code or Codex in one step, and let your coding agent read and write your notes.",
    excerpt: "Let your coding agent write the standup or keep a work log, in the same notes you read on your phone. One command for Claude Code, a few lines for Codex.",
    category: "Guides",
    date: "2026-09-30",
    updated: "2026-10-01",
    image: SHOTS.connectList,
    thumb: thumb("dark", "thumb-connect-list", 704, 566, "Connect an AI in Pinto Notes: ChatGPT, Claude, Claude Code and Codex"),
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
    thumb: thumb("amber", "thumb-consent", 854, 528, "Pinto Notes asking to let ChatGPT use your notes, with Allow and Don't Allow"),
    draft: false,
  },
  {
    slug: "apple-notes-api",
    title: "Apple Notes API: what exists and what to use instead",
    description: "Apple Notes has no public API. What you can use on a Mac and iPhone (AppleScript, Shortcuts, export), what each can do, and when to use a notes app with an API.",
    excerpt: "Apple Notes has no public API. What you can do with AppleScript and Shortcuts, what you can't, and what to use when you need more.",
    category: "Apple Notes",
    date: "2026-09-30",
    updated: "2026-10-01",
    image: SHOTS.connectList,
    thumb: thumb("ink", "thumb-markdown", 804, 531, "Markdown checklists, bullets and inline code in a note"),
    draft: false,
  },
  {
    slug: "best-notes-app-for-ai-agents",
    title: "The best notes app for AI agents",
    description: "What an AI agent needs from a notes app: remote MCP, precise writes, undo and history, approval, and apps you read on. How the options compare.",
    excerpt: "Remote MCP, precise writes, undo, approval and a phone app to read the results: the criteria that matter, and how the options compare.",
    category: "Comparisons",
    date: "2026-09-30",
    updated: "2026-10-02",
    image: SHOTS.tracker,
    thumb: thumb("cream", "thumb-tracker", 708, 749, "An evening tracker table with a row per day"),
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
    thumb: thumb("paper", "thumb-ai-rows", 733, 533, "A grocery checklist with the five lines an AI added tinted"),
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

/// Posts per page on the index and on each category page.
export const PER_PAGE = 12;

/// Published posts, newest first (by date; the list order breaks ties).
export function newestFirst(list: Post[] = published()): Post[] {
  return list.map((p, i) => [p, i] as const).sort((a, b) => b[0].date.localeCompare(a[0].date) || a[1] - b[1]).map(([p]) => p);
}

/// Page 1 leads with its newest post as one wide card, then a full grid: one more post than the
/// other pages, so its grid of three across ends on a full row.
export const FIRST_PAGE = PER_PAGE + 1;

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
