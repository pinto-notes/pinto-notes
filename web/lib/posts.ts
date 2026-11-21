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
  /// A launch of something new in the app: labelled "Announcement" on its card and above its title
  /// (Emil, 7 November 2026: "right now it's honestly not that clear" that these are news).
  announcement?: true;
  /// On the front of the blog without being a launch: original work about Pinto, such as the memory
  /// study (Emil, 12 November 2026: "do that then", when asked whether to front it).
  front?: true;
};

/// The ground a cover (and the post's first picture) sits on: the site's palette, the help page's
/// leaf brown, the app's dark look, or the home page's dunes.
export type Ground = "paper" | "soft" | "tint" | "amber" | "leaf" | "dark" | "dunes" | "ink" | "peach" | "cream" | "sand" | "clay" | "mist" | "honey" | "sage" | "heather" | "blush" | "wheat" | "fog" | "dusk" | "pearl" | "linen" | "night" | "rose" | "mint" | "sky" | "lemon" | "coral" | "lagoon" | "denim" | "slate" | "olive" | "plum" | "teal" | "berry" | "rust" | "apricot" | "ice" | "lilac" | "pistachio" | "fern" | "butter" | "harbor" | "orchid" | "cherry" | "frost" | "wisteria" | "melon" | "cobalt" | "moss" | "stone" | "salmon" | "spruce" | "khaki" | "straw" | "lavender" | "sandstone" | "flamingo" | "pine" | "meadow" | "peony" | "ocean" | "bluebell";

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
  consent: { src: "/blog/amber-notes-allow-chatgpt-access.webp", alt: "Pinto Notes asking \"Allow ChatGPT to use your notes?\": the notes ChatGPT opens go to OpenAI, locked notes stay private, a number to compare, and Allow and Don't Allow buttons.", width: 880, height: 986, window: false, title: "Pinto Notes" },
  connectList: { src: "/blog/amber-notes-connect-an-ai.webp", alt: "Settings in Pinto Notes on a Mac: Connect an AI lists ChatGPT, Claude, Claude Code and Codex, with what's connected below.", width: 1040, height: 720, window: false, title: "Settings" },
  consentE2ee: { src: "/blog/amber-notes-allow-chatgpt-encrypted-notes.webp", alt: "Pinto Notes on a Mac asking \"Allow ChatGPT to use your notes?\": the notes ChatGPT opens, with their text and files, go to OpenAI, and locked notes stay private.", width: 880, height: 986, window: false, title: "Pinto Notes" },
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
    slug: "share-a-note-and-edit-it-together",
    title: "Share a note and edit it together",
    description: "Pinto Notes 1.4 lets you share a note with a link and write in it together on iPhone and Mac, with everyone's cursor showing. Encrypted, and out now.",
    excerpt: "Send a link, and the people you share with write in the note with you. You see their changes as they type, and the note stays encrypted.",
    category: "Building Pinto Notes",
    date: "2026-11-17",
    updated: "2026-11-18",
    image: { src: "/blog/launch/share-mac-carets.webp", alt: "A Team offsite note in Pinto Notes with Sara's cursor and name flag in the agenda, and someone else selecting a line in the Bring checklist.", width: 1280, height: 560, window: false },
    thumb: cover("berry", "share-together", 1040, 624, "Two cut-paper hands writing in one checklist together"),
    draft: false,
    announcement: true,
  },
  {
    slug: "slash-menu",
    title: "Type / to format your notes, like in Notion",
    description: "Pinto Notes 1.3 for Mac adds a / menu like Notion's: headings, checklists, callouts, tables, dividers, dates and links to other notes, all from the keyboard.",
    excerpt: "Type / anywhere in a note, pick what you want and press Return. Callouts, tables, dates and links to your other notes, without reaching for the mouse.",
    category: "Building Pinto Notes",
    date: "2026-11-11",
    updated: "2026-11-11",
    image: { src: "/blog/launch/slash-menu-open.webp", alt: "A Kitchen redo note in Pinto Notes on a Mac with the / menu open, and /warn narrowing it to Warning Callout.", width: 1600, height: 1000, window: false },
    thumb: cover("fog", "app-slash-menu", 1600, 1000, "A Kitchen redo note in Pinto Notes on a Mac with the / menu open under the caret"),
    draft: false,
    announcement: true,
  },
  {
    slug: "pinto-notes-for-iphone",
    title: "Introducing Pinto Notes for iPhone",
    description: "Pinto Notes for iPhone is out now on the App Store, free. Your Mac notes on your phone, and what your AI's changes look like there.",
    excerpt: "Out now on the App Store, and free. The same notes as on your Mac, on your phone. Ask ChatGPT to add something, and it's in the note a second later, with Undo next to it.",
    category: "Building Pinto Notes",
    date: "2026-11-06",
    updated: "2026-11-07",
    image: { src: "/blog/launch/iphone-chatgpt-changed-groceries.webp", alt: "A Groceries list in Pinto Notes on iPhone with five lines ChatGPT added tinted amber, and ChatGPT changed 5 lines, Undo.", width: 660, height: 1434, window: false, phone: true },
    thumb: cover("ice", "app-pinto-notes-for-iphone", 1600, 1000, "Pinto Notes on an iPhone: a Sleep and memory note with a photo of a sketchbook"),
    draft: false,
    announcement: true,
  },
  {
    slug: "pinto-notes-in-chatgpt",
    title: "Pinto Notes is now in ChatGPT",
    description: "Pinto Notes is a plugin in ChatGPT: connect it once, and ChatGPT can find, write and edit your notes from any chat, with Undo on every change.",
    excerpt: "Connect it once, and ChatGPT can find, write and edit your notes from any chat. The change is in your notes on Mac and iPhone a second later, with Undo.",
    category: "Building Pinto Notes",
    date: "2026-10-28",
    updated: "2026-11-08",
    image: SHOTS.aiEdit,
    thumb: cover("denim", "app-pinto-notes-in-chatgpt", 1600, 1000, "The Pinto Notes plugin page in ChatGPT, with three example requests"),
    draft: false,
    announcement: true,
  },
  {
    slug: "import-your-notes",
    title: "Pinto Notes now imports from Apple Notes, Obsidian and more",
    description: "Pinto Notes on the Mac imports from Apple Notes, Obsidian, Evernote, Google Keep, Bear and Markdown, and shows you what to click in each app.",
    excerpt: "Apple Notes, Obsidian, Evernote, Google Keep, Bear or a folder of Markdown. The app walks you through each one, and your old app stays as it is.",
    category: "Building Pinto Notes",
    date: "2026-10-13",
    updated: "2026-11-07",
    image: { src: "/blog/launch/import-google-keep-guide.webp", alt: "Pinto Notes' Google Keep import guide on a Mac: Bring your Google Keep notes, then step 1, Ask Google for your notes.", width: 1600, height: 1000, window: false },
    thumb: cover("mist", "app-import-your-notes", 1600, 1000, "Apple Notes, Obsidian, Evernote, Google Keep, Bear and Markdown icons, linked to Pinto Notes"),
    draft: false,
    announcement: true,
  },
  {
    slug: "ai-memory-with-notes",
    title: "Does your AI remember better with notes? I tested it",
    description: "1,540 questions about months of past chats, asked in a new chat. Claude with no memory: 18% right. With Pinto Notes connected: 82.5%. Method, limits and code.",
    excerpt: "In a new chat, Claude got 18% of questions about past chats right. With its notes in Pinto, 82.5%. The test, the limits, and the code to run it yourself.",
    category: "Building Pinto Notes",
    date: "2026-11-12",
    updated: "2026-11-12",
    image: { src: "/blog/memory-study/locomo-types.webp", alt: "Grouped bar chart by question type. One fact: no memory 24, saved facts 66, one notebook 72, Pinto 89. Several facts: 13, 58, 67, 66. When: 3, 48, 80, 87. Inference: 29, 54, 52, 65.", width: 1848, height: 820, window: false },
    thumb: cover("dusk", "memory-study", 1600, 1000, "Bar chart: no memory 18%, saved facts 60%, one notebook 72%, Pinto 82.5%"),
    draft: false,
    front: true,
  },
  {
    slug: "best-ai-notes-app",
    title: "Best AI notes app in 2026: 7 apps compared",
    description: "Pinto Notes, Notion, Mem, Evernote, Apple Notes, Reflect and Obsidian, compared on what the AI does, what it costs, and whether ChatGPT can use your notes.",
    excerpt: "Seven notes apps compared on their AI: what it does, what it costs, and whether the ChatGPT or Claude you already use can read and edit your notes.",
    category: "Comparisons",
    date: "2026-11-07",
    updated: "2026-11-07",
    image: SHOTS.aiEdit,
    thumb: cover("lilac", "best-ai-notes-app", 1600, 1000, "The icons of Pinto Notes, Notion, Mem, Evernote, Apple Notes, Reflect and Obsidian as paper tiles"),
    draft: false,
  },
  {
    slug: "best-notes-app-for-mac",
    title: "Best notes app for Mac in 2026: 6 apps compared",
    description: "The best notes apps for Mac in 2026: Pinto Notes, Apple Notes, Bear, Obsidian, Notion and Craft. Prices, iPhone apps, AI and where your notes live.",
    excerpt: "Pinto Notes, Apple Notes, Bear, Obsidian, Notion and Craft, compared on price, iPhone apps, where your notes live and whether ChatGPT and Claude can use them.",
    category: "Comparisons",
    date: "2026-11-07",
    updated: "2026-11-07",
    image: SHOTS.aiEdit,
    thumb: cover("sage", "best-notes-app-for-mac", 1600, 1000, "The icons of Pinto Notes, Apple Notes, Bear, Obsidian, Notion and Craft as paper tiles in a row"),
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
    slug: "budget-tracker-with-chatgpt-or-claude",
    title: "A budget your AI can keep for you",
    description: "Most budget apps keep their AI to themselves. A free budget ChatGPT or Claude can add your spending to, where the app, not the AI, does the sums.",
    excerpt: "Budgets fail at writing things down. Tell the AI you already chat with what you spent, and let a real app, not the AI, do the maths.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-10-14",
    image: SHOTS.budgetApp,
    thumb: cover("apricot", "app-budget-tracker-with-chatgpt-or-claude", 1600, 1000, "The budget app in a Pinto Notes note on a Mac, on a painted orchard"),
    draft: false,
  },
  {
    slug: "connect-notes-to-grok",
    title: "How to connect your notes to Grok with a custom MCP connector",
    description: "Add any MCP server to Grok as a custom connector on grok.com or with grok mcp add in Grok Build, so Grok can read and edit your notes.",
    excerpt: "Grok takes any MCP server as a custom connector. The steps on grok.com and in Grok Build, and what xAI's docs leave out.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-11-06",
    image: SHOTS.historyBurst,
    thumb: cover("pistachio", "xai-grok-bot", 1600, 840, "The Grok Bot face on an orange background, from xAI"),
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
    slug: "apple-notes-planner-template",
    title: "Apple Notes planner template: plan your week in one note",
    description: "Apple Notes has no planner, but one note with a heading per day works. A weekly and a daily planner to paste in, and a free one your AI fills in.",
    excerpt: "A weekly planner for Apple Notes, ready to paste in: your top three, a checklist for each day and a Later list. A daily version too, and how to run a week with it.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/weekly-planner-note.webp", alt: "A Weekly planner note in Pinto Notes on a Mac: the top three, then each day's to-dos as a checklist, Monday to Sunday.", width: 1520, height: 2058, window: false, title: "Weekly planner" },
    thumb: cover("bluebell", "planner", 1600, 1000, "A paper alarm clock and a pencil beside a planner card with seven rows, four of them ticked"),
    draft: false,
  },
  {
    slug: "apple-notes-meeting-notes-template",
    title: "Apple Notes meeting notes template, with action items",
    description: "Apple Notes has no meeting notes template, but one note per meeting works. A template to paste in, open action items in one place, and one that writes it up.",
    excerpt: "A meeting notes template for Apple Notes, ready to paste in: agenda, notes, decisions and action items with an owner each, plus a Smart Folder of every item still open.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/meeting-notes-note.webp", alt: "A Meeting notes note in Pinto Notes on a Mac: action items with an owner and a date, then each meeting's summary.", width: 1520, height: 1110, window: false, title: "Meeting notes" },
    thumb: cover("cream", "meeting", 1600, 1000, "A paper coffee cup and two speech bubbles beside a note card with one action ticked"),
    draft: false,
  },
  {
    slug: "apple-notes-organize",
    title: "How to organize Apple Notes: a system that lasts",
    description: "How to organize Apple Notes on iPhone and Mac: folders and subfolders, sorting, pins, tags, a folder structure to copy and a weekly tidy.",
    excerpt: "Folders for areas, tags for topics, the right sort for each folder, a few pins and a ten-minute weekly tidy. A folder structure to copy included.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/apple/iphone-notes-ios27-folders-list.webp", alt: "Folders and tags on a Folders list in Notes on iPhone: Quick Notes, Shared, iCloud folders and a Tags section.", width: 640, height: 1320, window: false, title: "Folders" },
    thumb: cover("meadow", "organize", 1600, 1000, "Three paper file folders with note cards peeking out, a pushpin and two squared note cards"),
    draft: false,
  },
  {
    slug: "apple-notes-checklist-sort",
    title: "Apple Notes checklist: move checked items to the bottom",
    description: "Where Sort Checked Items lives on iPhone and Mac, how to turn it on or off, move items by hand, uncheck a whole list and the checklist shortcuts.",
    excerpt: "One setting moves ticked items to the bottom of an Apple Notes checklist. Where it is on iPhone and on Mac, how to turn it off, and how to move and reset items by hand.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/apple-notes-mac-groceries.webp", alt: "A Groceries checklist in Apple Notes on a Mac, with Sourdough, Eggs and Spinach ticked at the bottom.", width: 1600, height: 1000, window: false, title: "Groceries" },
    thumb: cover("peony", "checklist", 1600, 1000, "A paper checklist card with its two ticked items at the bottom, a curved arrow and a pencil"),
    draft: false,
  },
  {
    slug: "apple-notes-for-school",
    title: "Apple Notes for school: a setup for every class",
    description: "Is Apple Notes good for school? An honest answer, then a setup for every class: folders, lecture notes, scans, recordings, Cornell notes and flashcards.",
    excerpt: "Is Apple Notes good for school? Yes for taking notes, less for revision. A setup for every class: folders, lecture notes, scans, recordings, sums and study groups.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.flashcardsApp,
    thumb: cover("ocean", "school", 1600, 1000, "A paper backpack, a two-column note card and two books with an apple on top"),
    draft: false,
  },
  {
    slug: "apple-notes-flashcards",
    title: "Apple Notes flashcards: a template to study with",
    description: "Make flashcards in Apple Notes with a two-column table you cover to study, a list for the cards you miss, and where Notes stops.",
    excerpt: "Apple Notes has no flashcards, but a two-column table you cover works. A template to paste in, how to study the cards you miss, and where it stops.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/study-flashcards-note.webp", alt: "A Study notes and flashcards note in Pinto Notes on a Mac, with notes on cell respiration under a Notes heading.", width: 1520, height: 571, window: false, title: "Study notes and flashcards" },
    thumb: cover("frost", "flashcards", 1600, 1000, "A fanned stack of paper index cards, one turned over with a tick, beside a pencil and an alarm clock"),
    draft: false,
  },
  {
    slug: "apple-notes-reading-list",
    title: "Apple Notes reading list template, with ratings",
    description: "A reading list template for Apple Notes: a table of books with status, rating and why, a simpler checklist version, and where Notes stops.",
    excerpt: "One note with a table of books: title, author, status, a rating out of 5 and why you wanted it. A template for Apple Notes, a checklist version, and its limits.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/reading-list-note.webp", alt: "A Reading list note in Pinto Notes on a Mac: a table of five books with status, rating and why, and notes on two.", width: 1520, height: 1153, window: false, title: "Reading list" },
    thumb: cover("wisteria", "reading-list", 1600, 1000, "Three paper books standing upright beside a list card with two starred rows and a book lying flat"),
    draft: false,
  },
  {
    slug: "apple-notes-book-notes-template",
    title: "Apple Notes book notes template, with the big idea",
    description: "A book notes template for Apple Notes: quotes with page numbers, your thoughts, the big idea and what you'll do differently, one note per book.",
    excerpt: "One note per book: the lines worth keeping, your thoughts, the big idea and what you'll do differently. A template to paste into Apple Notes, and an index.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/book-notes-note.webp", alt: "A Book notes note in Pinto Notes on a Mac: Four Thousand Weeks with a quote, thoughts, the big idea and a checklist.", width: 1520, height: 1255, window: false, title: "Book notes" },
    thumb: cover("melon", "book-notes", 1600, 1000, "An open paper book beside a note card with one highlighted line, a green pencil and a bookmark"),
    draft: false,
  },
  {
    slug: "apple-notes-job-search-tracker",
    title: "Job search tracker template for Apple Notes",
    description: "A job application tracker to paste into Apple Notes: one table of company, role, stage and next step, with interview prep and follow-ups.",
    excerpt: "A job search tracker for Apple Notes: a table of every application and its next step, interview prep and follow-ups, plus where Notes stops.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/job-hunt-note.webp", alt: "A Job hunt note in Pinto Notes: a table of four applications with stage and next step, interview prep and a follow-up checklist.", width: 1520, height: 1514, window: false, title: "Job hunt" },
    thumb: cover("cobalt", "job-hunt", 1600, 1000, "A paper briefcase and an envelope beside a note card of four rows, each with a coloured dot"),
    draft: false,
  },
  {
    slug: "apple-notes-weekly-review-template",
    title: "Weekly review template for Apple Notes: five questions",
    description: "A weekly review template to paste into Apple Notes: five questions for Sunday, a heading per week and next week's top three as a checklist.",
    excerpt: "Five questions for Sunday in one Apple Notes note, newest week first, with next week's top three as a checklist. Plus how to keep the habit.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/weekly-review-note.webp", alt: "A Weekly review note in Pinto Notes: five questions, then the week of 2 November with short answers and a top three checklist.", width: 1520, height: 989, window: false, title: "Weekly review" },
    thumb: cover("moss", "weekly-review", 1600, 1000, "A paper calendar page and a coffee mug beside a note card with three checkboxes, one ticked"),
    draft: false,
  },
  {
    slug: "apple-notes-decision-log-template",
    title: "Decision log template for Apple Notes, with the why",
    description: "A decision log template to paste into Apple Notes: open questions, then each decision with its context, options, choice, why and when to revisit.",
    excerpt: "A decision log in one Apple Notes note: open questions, then each decision with the options you didn't pick and why, so settled questions stay settled.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/decision-log-note.webp", alt: "A Decision log note in Pinto Notes: two open questions and two decisions, each with context, choice, reason and when to revisit.", width: 1520, height: 1055, window: false, title: "Decision log" },
    thumb: cover("stone", "decision", 1600, 1000, "A paper signpost pointing two ways and a balance scale beside a note card"),
    draft: false,
  },
  {
    slug: "apple-notes-1-on-1-template",
    title: "1 on 1 meeting notes template for Apple Notes",
    description: "A 1 on 1 meeting notes template to paste into Apple Notes: the next agenda, follow-ups as a checklist, and every past 1:1 in one note per person.",
    excerpt: "One running 1:1 note per person for Apple Notes: what to bring up next time, who promised what, and every past 1:1 newest first, ready to paste.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/one-on-one-notes-note.webp", alt: "A 1:1 note with three topics under Next time, four follow-ups with one ticked, and the 5 November 1:1.", width: 1520, height: 1062, window: false, title: "1:1 notes" },
    thumb: cover("salmon", "one-on-one", 1600, 1000, "Two paper chairs facing each other on either side of a note card with one item ticked"),
    draft: false,
  },
  {
    slug: "apple-notes-daily-standup-template",
    title: "Daily standup notes template for Apple Notes",
    description: "A daily standup notes template for Apple Notes: blockers on top, a heading a day with yesterday and today, and a version for team scrum minutes.",
    excerpt: "A standup note for Apple Notes: blockers on top, one heading a day, Today as a checklist. Or let Claude Code draft yesterday from your commits.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/daily-standup-note.webp", alt: "Standup notes with a staging API key blocker, then Friday and Thursday with Yesterday and Today bullets.", width: 1520, height: 1207, window: false, title: "Standup notes" },
    thumb: cover("spruce", "standup", 1600, 1000, "A paper laptop and a rising paper sun beside a note card with two groups of lines"),
    draft: false,
  },
  {
    slug: "apple-notes-bug-triage-template",
    title: "Bug triage template for Apple Notes, with severity",
    description: "A bug triage template for Apple Notes: a table with severity P0 to P3, area and status, the steps to reproduce, and a checklist version that sorts.",
    excerpt: "One Apple Notes table for every bug, with a severity from P0 to P3 and the steps to reproduce, plus a checklist version for when the table can't sort.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/bug-triage-note.webp", alt: "A bug triage note: a table of four bugs, P1 to P3, with status and issue numbers, steps and severity rules.", width: 1520, height: 1363, window: false, title: "Bug triage" },
    thumb: cover("khaki", "bug-triage", 1600, 1000, "A paper ladybird and a magnifying glass beside a table card with red, orange and yellow dots"),
    draft: false,
  },
  {
    slug: "apple-notes-journal-template",
    title: "Apple Notes journal template, one entry a day",
    description: "A daily journal template for Apple Notes: four questions, one entry a day with the newest first, and how to find old entries with search and tags.",
    excerpt: "A journal template for Apple Notes with four short questions and one entry a day, newest first, plus spare questions and how to find old days again.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/daily-journal-note.webp", alt: "A Daily journal note in Pinto Notes on a Mac: four questions, then two days of entries, newest first.", width: 1520, height: 1093, window: false, title: "Daily journal" },
    thumb: cover("straw", "journal", 1600, 1000, "A paper notebook with an elastic band, a note card, a teacup and a fountain pen"),
    draft: false,
  },
  {
    slug: "apple-notes-mood-tracker",
    title: "Apple Notes mood tracker, with energy and sleep",
    description: "A mood tracker for Apple Notes: a table with a row each evening for mood and energy from 1 to 5, hours of sleep and a note, to paste in.",
    excerpt: "A mood and energy tracker for Apple Notes: one table row each evening with mood, energy, sleep and a line about the day, and how to read it after a few weeks.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/mood-energy-log-note.webp", alt: "A Mood and energy log note in Pinto Notes on a Mac: five evenings of mood, energy and sleep, and three patterns.", width: 1520, height: 1057, window: false, title: "Mood and energy log" },
    thumb: cover("lavender", "mood", 1600, 1000, "A row of paper discs from grey to orange and a crescent moon beside a card with a small bar chart"),
    draft: false,
  },
  {
    slug: "apple-notes-home-maintenance-checklist",
    title: "Home maintenance checklist template for Apple Notes",
    description: "A home maintenance checklist for Apple Notes: a table of jobs with how often and when last done, a checklist for this month and who to call.",
    excerpt: "A home maintenance template for Apple Notes: a table of every job that repeats with its last and next dates, a checklist for this month and who to call.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/home-maintenance-note.webp", alt: "A Home maintenance note in Pinto Notes on a Mac: a table of five jobs with their dates, a This month checklist and contacts.", width: 1520, height: 1557, window: false, title: "Home maintenance" },
    thumb: cover("sandstone", "home", 1600, 1000, "A paper house with a blue door and a wrench beside a checklist card with two jobs ticked"),
    draft: false,
  },
  {
    slug: "apple-notes-content-calendar",
    title: "Apple Notes content calendar template, with ideas",
    description: "A content calendar for Apple Notes to paste in: a table of posts by date, channel and status, a list of ideas, and where Notes stops.",
    excerpt: "Paste a content calendar into Apple Notes: one table of posts by date, channel and status, with your ideas and voice under it.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/content-calendar-note.webp", alt: "A Content calendar note in Pinto Notes: a table of five November posts with channel and status, ideas and voice.", width: 1520, height: 1265, window: false, title: "Content calendar" },
    thumb: cover("flamingo", "content-calendar", 1600, 1000, "A paper megaphone and a pencil beside a calendar card with three coloured days"),
    draft: false,
  },
  {
    slug: "apple-notes-gift-ideas",
    title: "Apple Notes gift ideas list, by person",
    description: "A gift ideas list for Apple Notes to paste in: ideas by person with budgets and status, sizes and likes, and a Christmas checklist.",
    excerpt: "Keep gift ideas in Apple Notes the moment you hear them: a table by person with a budget and status, plus everyone's sizes and likes.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/gift-ideas-note.webp", alt: "A Gift ideas note in Pinto Notes: a table of five gifts by person with occasion, budget and status, and sizes and likes.", width: 1520, height: 1057, window: false, title: "Gift ideas" },
    thumb: cover("pine", "gift-ideas", 1600, 1000, "A red paper gift box with a gold bow and a smaller box beside a list card with one item ticked"),
    draft: false,
  },
  {
    slug: "apple-notes-cornell-notes-template",
    title: "Cornell notes in Apple Notes: a template that works",
    description: "Apple Notes has no Cornell layout, but a two-column table works. A template to paste in, how to revise with it, and a free one that quizzes you.",
    excerpt: "Cornell notes in Apple Notes with a two-column table: questions on the left, your notes on the right, a summary below. How to set it up, revise with it, and where it stops.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/cornell-notes-note.webp", alt: "A Cornell notes note in Pinto Notes on a Mac: a Cue and Notes table, a summary and cues to revisit.", width: 1520, height: 1010, window: false, title: "Cornell notes" },
    thumb: cover("amber", "cornell", 1600, 1000, "Two paper books and a pencil beside a note card with a narrow cue column and a wide notes column"),
    draft: false,
  },
  {
    slug: "apple-notes-recipe-template",
    title: "Apple Notes recipe template, with a recipe box",
    description: "Apple Notes has no recipe template, but one note per recipe and an index note work. A template to paste in, and a free recipe box that tidies recipes up.",
    excerpt: "A recipe template for Apple Notes, ready to paste in: servings and time, the ingredients as a checklist and numbered steps, plus an index note to find every recipe again.",
    category: "Apple Notes",
    date: "2026-11-20",
    updated: "2026-11-20",
    image: { src: "/blog/launch/recipe-note.webp", alt: "A Lentil soup with lemon note in Pinto Notes on a Mac: the ingredients as a checklist and three numbered steps.", width: 1520, height: 776, window: false, title: "Lentil soup with lemon" },
    thumb: cover("rose", "recipe", 1600, 1000, "A paper soup bowl with a lemon slice and a wooden spoon beside a recipe card with two items ticked"),
    draft: false,
  },
  {
    slug: "apple-notes-grocery-list-template",
    title: "Apple Notes grocery list template, sorted by aisle",
    description: "Apple Notes can't sort a grocery list by aisle, but headings can. A template to paste in, how to share it, and a free list that files each item for you.",
    excerpt: "A grocery list for Apple Notes, ready to paste in: a heading per aisle with the items as checklists. How to share it, when Reminders is better, and a list that sorts itself.",
    category: "Apple Notes",
    date: "2026-11-20",
    updated: "2026-11-20",
    image: { src: "/blog/launch/grocery-list-note.webp", alt: "A Grocery list note in Pinto Notes on a Mac: a checklist under a heading for each aisle.", width: 1520, height: 1444, window: false, title: "Grocery list" },
    thumb: cover("slate", "grocery", 1600, 1000, "A paper shopping basket with an apple beside a checklist card, a carrot and an egg"),
    draft: false,
  },
  {
    slug: "apple-notes-workout-log-template",
    title: "Apple Notes workout log template, with your bests",
    description: "Apple Notes has no workout log, but one note a week can hold your sets and personal bests. A template to paste in, and a free log that keeps your bests.",
    excerpt: "A workout log for Apple Notes, ready to paste in: your program, a checklist of sets per training day and your personal bests. How to use it in the gym, and where it stops.",
    category: "Apple Notes",
    date: "2026-11-19",
    updated: "2026-11-19",
    image: { src: "/blog/launch/workout-log-note.webp", alt: "A Workout log note in Pinto Notes on a Mac: a Sessions table with a row per session and a Personal bests list below it.", width: 1520, height: 1020, window: false, title: "Workout log" },
    thumb: cover("dunes", "workout-log", 1600, 1000, "A paper dumbbell and a small orange stopwatch beside a checklist card with two sets ticked"),
    draft: false,
  },
  {
    slug: "apple-notes-meal-planner-template",
    title: "Apple Notes meal planner template, with the grocery list",
    description: "Apple Notes has no meal planner, but one note can hold the week's dinners and the grocery list. A template to paste in, and a free plan that writes the list.",
    excerpt: "A meal planner for Apple Notes, ready to paste in: a week of dinners and the groceries by aisle. How to set it up for the shop, where it stops, and a plan that writes the list.",
    category: "Apple Notes",
    date: "2026-11-17",
    updated: "2026-11-17",
    image: SHOTS.aiEdit,
    thumb: cover("clay", "meal-planner", 1600, 1000, "A paper cooking pot with a wooden spoon beside a checklist card, two carrots and a lemon"),
    draft: false,
  },
  {
    slug: "apple-notes-trip-planner-template",
    title: "Apple Notes trip planner template, bookings to packing",
    description: "Apple Notes has no trip planner, but one note can hold the bookings, the days and the packing list. A template to paste in, and a free trip plan that counts.",
    excerpt: "A trip planner for Apple Notes, ready to paste in: bookings you tick when paid, a heading per day and a packing list. Where it stops, and a trip plan note with a countdown.",
    category: "Apple Notes",
    date: "2026-11-15",
    updated: "2026-11-15",
    image: SHOTS.tripApp,
    thumb: cover("peach", "trip-planner", 1600, 1000, "A paper suitcase with a luggage tag beside a checklist card and a small paper plane"),
    draft: false,
  },
  {
    slug: "apple-notes-habit-tracker",
    title: "Apple Notes habit tracker template, and where it stops",
    description: "Apple Notes has no habit tracker, but a weekly checklist does the daily part. A template to paste in, how to keep it going, and a free tracker with streaks.",
    excerpt: "A weekly habit tracker for Apple Notes, ready to paste in. How to reset it each week, where it runs out, and a habit tracker note that keeps your streaks.",
    category: "Apple Notes",
    date: "2026-11-14",
    updated: "2026-11-14",
    image: SHOTS.habitApp,
    thumb: cover("sand", "habit-tracker", 1600, 1000, "A paper card with a week of ticked squares beside a small paper flame"),
    draft: false,
  },
  {
    slug: "apple-notes-budget-template",
    title: "Apple Notes budget template that adds itself up",
    description: "Apple Notes has no budget template, but a note can still do the sums. A monthly budget to paste in, where it stops, and a free budget note that keeps itself.",
    excerpt: "A budget in Apple Notes that totals itself with Math Results, ready to paste in. Where it runs out, and a budget note that tracks spending for you.",
    category: "Apple Notes",
    date: "2026-11-13",
    updated: "2026-11-13",
    image: SHOTS.budgetApp,
    thumb: cover("honey", "budget-template", 1600, 1000, "A paper page with lines and a bar chart beside a small stack of coins"),
    draft: false,
  },
  {
    slug: "apple-notes-backlinks",
    title: "Does Apple Notes have backlinks? No. What to do instead",
    description: "Apple Notes links notes one way: nothing shows which notes link to a note. How to find them anyway, and a notes app that lists every backlink.",
    excerpt: "Apple Notes can link one note to another, but never shows what links back. How to find those notes anyway, and an app that lists them.",
    category: "Apple Notes",
    date: "2026-11-18",
    updated: "2026-11-18",
    image: { src: "/blog/launch/backlinks-linked-from.webp", alt: "The note's menu in Pinto Notes with Linked From open, listing Weekend plans and Packing.", width: 960, height: 236, window: false },
    thumb: cover("linen", "backlinks", 1600, 1000, "Three paper note cards joined by ribbons with arrows pointing both ways"),
    draft: false,
  },
  {
    slug: "apple-notes-version-history",
    title: "Does Apple Notes have version history? No. What to do",
    description: "Apple Notes keeps no earlier versions of a note. What Undo, shared notes and backups can still get back, and notes apps that keep every version.",
    excerpt: "Changed a note and lost the part you needed? Apple Notes has no version history. What can still bring it back, and what to use instead.",
    category: "Apple Notes",
    date: "2026-11-13",
    updated: "2026-11-13",
    image: SHOTS.history,
    thumb: cover("orchid", "version-history", 1600, 1000, "Three stacked note pages and a clock with an arrow turning back"),
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
    updated: "2026-11-20",
    image: SHOTS.notesPassword,
    thumb: cover("pearl", "forgot-password", 1600, 1000, "A notes icon with an orange padlock"),
    draft: false,
  },
  {
    slug: "encrypted-notes-app-for-ai",
    title: "An encrypted notes app your AI can use",
    description: "Pinto Notes encrypts every note on your Mac and still lets ChatGPT and Claude read and edit them. How it works, its limits, and how others compare.",
    excerpt: "Every note is encrypted on your devices, and ChatGPT and Claude can still use them once you approve. How, what stays readable, and how Apple Notes, Standard Notes, Notesnook, Obsidian and Notion compare.",
    category: "Building Pinto Notes",
    date: "2026-10-01",
    updated: "2026-10-01",
    image: SHOTS.consentE2ee,
    thumb: cover("fern", "app-encrypted-notes-app-for-ai", 1600, 1000, "A locked note in Pinto Notes on a Mac, asking for the notes password, on painted hills"),
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
    updated: "2026-10-28",
    image: SHOTS.connectChatGPT,
    thumb: cover("harbor", "app-connect-chatgpt-to-your-notes", 1600, 1000, "A Groceries note in Pinto Notes on a Mac with five lines ChatGPT added, on a painted sea"),
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
    thumb: cover("teal", "app-move-from-apple-notes", 1600, 1000, "Pinto Notes on a Mac with folders, a note list and a Lisbon trip note, on painted hills"),
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
    thumb: cover("plum", "app-notes-in-claude-code-and-codex", 1600, 1000, "Standup notes in Pinto Notes on a Mac with a line Claude Code added, on a painted dusk"),
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
    thumb: cover("butter", "app-mcp-server", 1600, 1000, "Connect an AI in Pinto Notes on a Mac, with ChatGPT and Claude Code connected, on a painted orchard"),
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

/// The front of the blog: announcements only (Emil, 7 November 2026: "the Pinto Notes blog immediately
/// became only for announcements"). Every other post answers a search; those live on /blog/answers,
/// in the sitemap and in the posts that link to them, but not on /blog.
export const FEATURED = posts.filter((p) => (p.announcement || p.front) && !p.draft).map((p) => p.slug);
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
