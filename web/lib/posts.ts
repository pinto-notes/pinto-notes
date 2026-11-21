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
export type Ground = "paper" | "soft" | "tint" | "amber" | "leaf" | "dark" | "dunes" | "ink" | "peach" | "cream" | "sand" | "clay" | "mist" | "honey" | "sage" | "heather" | "blush" | "wheat" | "fog" | "dusk" | "pearl" | "linen" | "night" | "rose" | "mint" | "sky" | "lemon" | "coral" | "lagoon" | "denim" | "slate" | "olive" | "plum" | "teal" | "berry" | "rust" | "apricot" | "ice" | "lilac" | "pistachio" | "fern" | "butter" | "harbor" | "orchid" | "cherry" | "frost" | "wisteria" | "melon" | "cobalt" | "moss" | "stone" | "salmon" | "spruce" | "khaki" | "straw" | "lavender" | "sandstone" | "flamingo" | "pine" | "meadow" | "peony" | "ocean" | "bluebell" | "seafoam" | "marigold" | "periwinkle" | "terracotta" | "amethyst" | "silver" | "jade" | "sunflower" | "aqua" | "glacier" | "iris" | "tangerine" | "cornflower" | "butterscotch" | "mulberry" | "poppy" | "granite" | "cyan" | "grass" | "spearmint" | "rosewood" | "laurel" | "azure" | "almond" | "thistle" | "papaya" | "canary" | "seaglass" | "hyacinth" | "avocado" | "rosehip" | "pewter" | "custard" | "eucalyptus" | "persimmon" | "mauve" | "ochre" | "slateblue" | "aubergine" | "icewater" | "bisque" | "juniper" | "sorbet" | "loganberry" | "lichen" | "tealwood" | "oatmeal" | "bluestone" | "blossom" | "forest" | "hydrangea" | "glade" | "summitblue" | "peachfuzz" | "ashgrey" | "tealrock" | "lilacmist" | "mintleaf" | "coralreef" | "butterlight" | "sandbar" | "duskblue" | "memdusk" | "reflectmint" | "wheatfield" | "rosequartz" | "sagecool" | "aquapale" | "butterchalk" | "lavenderlight" | "tealblue" | "mutedcoral" | "renewalclay";

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
    title: "Free expense tracker that ChatGPT and Claude can update",
    description: "ChatGPT and Claude now read US bank accounts. To log spending by telling them, anywhere, use a free tracker both can update. The app does the sums.",
    excerpt: "Four ways to track expenses with ChatGPT or Claude in 2026, compared, and a free tracker both of them add to, where the app, not the AI, does the maths.",
    category: "Guides",
    date: "2026-10-13",
    updated: "2026-11-21",
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
    slug: "apple-notes-vs-obsidian",
    title: "Apple Notes vs Obsidian: what each does better",
    description: "Apple Notes is built in and syncs for free. Obsidian keeps plain Markdown files with backlinks and plugins. What each does better, and how to switch.",
    excerpt: "Apple Notes is already on your iPhone and Mac. Obsidian gives you Markdown files, backlinks and plugins. Where each wins, what it costs, and how to move between them.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/obsidian-mac-groceries.webp", alt: "Obsidian on a Mac: a vault's folders in the sidebar and a Groceries note open in a tab, with ticked items struck through.", width: 1600, height: 1000, window: false, title: "Groceries" },
    thumb: cover("amethyst", "vs-obsidian", 1600, 1000, "A paper note card, a small web of linked violet dots and a level mustard paper scale"),
    draft: false,
  },
  {
    slug: "apple-notes-vs-notion",
    title: "Notion vs Apple Notes: which one to use, and when",
    description: "Apple Notes is free and built in; Notion adds databases, team wikis and Windows. How they compare on price, tables, reminders and AI, and which to pick.",
    excerpt: "Notion vs Apple Notes on price, devices, databases, reminders and AI, from each maker's own pages, and which one fits how you take notes.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/notion-mac-team-weekly.webp", alt: "A Notion page on a Mac called Team weekly, with team properties, an agenda with a chart, and action items.", width: 1600, height: 1000, window: false, title: "Team weekly" },
    thumb: cover("silver", "vs-notion", 1600, 1000, "A single paper note card and a grid of six paper blocks, with a two-way orange arrow between"),
    draft: false,
  },
  {
    slug: "evernote-to-apple-notes",
    title: "Evernote to Apple Notes: how to move your notes",
    description: "Export each Evernote notebook as an .enex file, then use File, Import to Notes on a Mac. What comes across, what doesn't, and a second route.",
    excerpt: "Apple Notes imports Evernote's .enex files on a Mac, tags included. How to export each notebook, import it, and check what came across.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-file-menu.webp", alt: "The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep.", width: 820, height: 800, window: false, title: "File menu" },
    thumb: cover("jade", "evernote-to-notes", 1600, 1000, "A stack of green paper notebooks and an orange arrow curving to a note card"),
    draft: false,
  },
  {
    slug: "google-keep-to-apple-notes",
    title: "Google Keep to Apple Notes: how to move your notes",
    description: "Apple Notes can't import Google Keep. Copy and paste a few notes, or download them with Google Takeout and import the .html files on a Mac.",
    excerpt: "Apple Notes has no Google Keep import and no sync. Copy a few notes by hand, or download them all with Google Takeout and import them on a Mac.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-google-keep-guide.webp", alt: "Pinto Notes' Google Keep import guide on a Mac: Bring your Google Keep notes, then step 1, Ask Google for your notes.", width: 1600, height: 1000, window: false, title: "Bring your Google Keep notes" },
    thumb: cover("sunflower", "keep-to-notes", 1600, 1000, "Four small paper sticky cards and an orange arrow leading to a note card"),
    draft: false,
  },
  {
    slug: "apple-notes-alternatives",
    title: "Apple Notes alternatives for Windows, Android and Mac",
    description: "Six Apple Notes alternatives compared: what runs on Windows and Android, what's free, what's open source, and who each app suits.",
    excerpt: "Obsidian, Google Keep, Notion, Evernote, Bear and Pinto Notes: what each runs on, what it costs to start and who it suits, plus Joplin if you want open source.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/pinto-notes-mac-chatgpt-edit-framed.webp", alt: "Pinto Notes on a Mac: a Lisbon trip note with a line ChatGPT just added, tinted, and a bar with Undo.", width: 1720, height: 1178, window: false, title: "Lisbon" },
    thumb: cover("aqua", "alternatives", 1600, 1000, "Five different paper note cards in a row, the middle one raised and outlined in orange"),
    draft: false,
  },
  {
    slug: "apple-notes-ai",
    title: "Apple Notes AI: what Apple Intelligence does in Notes",
    description: "What Apple Intelligence does in Apple Notes: Writing Tools, transcripts, summaries and Siri AI search, the devices it needs, and what it can't do.",
    excerpt: "Writing Tools, audio transcripts and summaries, and Siri AI search: what Apple Intelligence does in Apple Notes, what it needs, and where ChatGPT and Claude fit in.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/apple-notes-recording-summary-mac.webp", alt: "Apple Notes on a Mac: a lecture note with an audio recording and a Notes from Recording section written from it.", width: 1630, height: 1780, window: false, title: "Neuroscience 122" },
    thumb: cover("iris", "notes-ai", 1600, 1000, "A paper note card beside an orange chat bubble, with three paper sparkles above"),
    draft: false,
  },
  {
    slug: "best-note-taking-app-for-iphone",
    title: "Best note-taking app for iPhone in 2026: 7 apps compared",
    description: "Apple Notes, Pinto Notes, Bear, Obsidian, Notion, Google Keep and Evernote on iPhone: what each one costs and which work with AI.",
    excerpt: "Seven notes apps for iPhone compared on their makers' own pages: price, sync, and which ones let ChatGPT or Claude use your notes.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/iphone-chatgpt-changed-groceries.webp", alt: "A Groceries list in Pinto Notes on iPhone, with five lines ChatGPT added tinted and an Undo bar.", width: 660, height: 1434, window: false, title: "Groceries" },
    thumb: cover("cornflower", "iphone-apps", 1600, 1000, "A paper phone showing six app tiles, one orange tile raised, beside a star and a note card"),
    draft: false,
  },
  {
    slug: "apple-notes-vs-google-keep",
    title: "Apple Notes vs Google Keep: what each does better",
    description: "Apple Notes or Google Keep, compared from Apple's and Google's own help pages: devices, folders and labels, sharing, reminders, deleted notes and moving.",
    excerpt: "Apple Notes has folders, tables, locked notes and 30 days to undo a delete. Google Keep runs on Android, iPhone and the web, with reminders in Google Calendar.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/apple-notes-mac-groceries.webp", alt: "Apple Notes on a Mac with a Groceries checklist, three items ticked, and folders in the sidebar.", width: 1600, height: 1000, window: false, title: "Groceries" },
    thumb: cover("butterscotch", "vs-keep", 1600, 1000, "Three paper sticky cards and a note card with a level paper scale between them"),
    draft: false,
  },
  {
    slug: "apple-notes-vs-onenote",
    title: "Apple Notes vs OneNote: which to use on iPhone and Mac",
    description: "Apple Notes vs OneNote on iPhone and Mac: pages, handwriting, locking, version history, AI and moving notes, from Apple and Microsoft pages.",
    excerpt: "Apple Notes is simpler on iPhone and Mac; OneNote has free-form pages, Windows and Android, and page history. What each does well, and how to move between them.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/apple-notes-mac-groceries.webp", alt: "Apple Notes on a Mac: folders in the sidebar and a Groceries note with three checklist items ticked.", width: 1600, height: 1000, window: false, title: "Groceries" },
    thumb: cover("mulberry", "vs-onenote", 1600, 1000, "A purple paper ring binder with section tabs and a note card, with a two-way orange arrow"),
    draft: false,
  },
  {
    slug: "apple-notes-expense-tracker",
    title: "Apple Notes expense tracker: a log that adds itself up",
    description: "A free expense tracker for Apple Notes: a table of what you spent, and category totals that Math Results adds up on iPhone and Mac.",
    excerpt: "A paste-in expense log for Apple Notes: one row per purchase, category totals that add themselves up, and where the note stops working.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/apple/iphone-math-notes-named-totals.webp", alt: "Apple's Sequoia Group Expenses note on iPhone: each cost named on its own line, the names added up to $475.", width: 1306, height: 1828, window: false, title: "Sequoia Group Expenses" },
    thumb: cover("spearmint", "expenses", 1600, 1000, "Two gold paper coins and a paper receipt beside a ledger note card with an orange total line"),
    draft: false,
  },
  {
    slug: "apple-notes-vs-bear",
    title: "Apple Notes vs Bear: choosing where to write",
    description: "Apple Notes has folders, Smart Folders and free iCloud sync. Bear has Markdown, nested tags and backlinks, with sync on Pro. Which suits you, and how to move.",
    excerpt: "Both run on iPhone and Mac. Apple Notes is built in with folders and shared notes; Bear writes in Markdown with nested tags and backlinks. Where each wins, and how to switch.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/bear-2-mac-and-iphone.webp", alt: "Bear 2 on a Mac and an iPhone: a sidebar of nested tags, a list of notes and a note about the North Pole with a highlight, a footnote and a table.", width: 1270, height: 760, window: false, title: "Bear" },
    thumb: cover("rosewood", "vs-bear", 1600, 1000, "Two paper note cards side by side and a small red paper badge with a paw print"),
    draft: false,
  },
  {
    slug: "apple-notes-vs-evernote",
    title: "Evernote vs Apple Notes: which should you use?",
    description: "Apple Notes is free and built in. Evernote adds the Web Clipper, reminders and Windows and Android apps, with a 50-note Free plan. Which suits you.",
    excerpt: "Apple Notes covers everyday notes on Apple devices for free. Evernote earns its place with the Web Clipper, task reminders and apps beyond Apple. What each does better.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/news/evernote-ai-assistant-mac.webp", alt: "Evernote's Mac app with a Website Launch note and the AI Assistant panel, which has just moved a note to the Website notebook, with an Undo button.", width: 1720, height: 785, window: false, title: "Evernote" },
    thumb: cover("laurel", "vs-evernote", 1600, 1000, "Two paper note cards side by side on sage green, one with a small picture square"),
    draft: false,
  },
  {
    slug: "best-notes-apps-with-mcp",
    title: "Best notes app with MCP: 6 apps compared",
    description: "Which notes apps connect to ChatGPT, Claude and other AI over MCP: Pinto Notes, Notion, Bear, Obsidian, Notesnook and Apple Notes, from each maker's own docs.",
    excerpt: "Six notes apps and how each connects to an AI over MCP: hosted, local, community-made or not at all. What each maker documents, and who each one suits.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.aiEdit,
    thumb: cover("hyacinth", "mcp-apps", 1600, 1000, "Three paper note cards joined by orange cables to one dark round hub with a star"),
    draft: false,
  },
  {
    slug: "evernote-alternative",
    title: "Evernote alternative for Mac and iPhone: 6 options",
    description: "Six Evernote alternatives for Mac and iPhone, and which ones import your .enex export: Apple Notes, Pinto Notes, Obsidian, Joplin, Bear and Notion.",
    excerpt: "Leaving Evernote on Apple devices? Six alternatives, who each suits, and how each one takes your notes: from an .enex file or from your Evernote account.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-file-menu.webp", alt: "The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep.", width: 820, height: 800, window: false, title: "File menu" },
    thumb: cover("avocado", "evernote-alt", 1600, 1000, "Paper note cards walking out of an open cardboard box toward a tidy stack"),
    draft: false,
  },
  {
    slug: "evernote-price-increase",
    title: "Evernote price increase: what to do at renewal",
    description: "Evernote moves Personal and Professional to Advanced at $249.99 a year. When Starter at $99 is enough, how to cancel without losing notes, and where to go.",
    excerpt: "Evernote's new plans start at your next renewal. Check whether Starter fits, switch or cancel in time, and export your notebooks if you leave.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-file-menu.webp", alt: "The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep.", width: 820, height: 800, window: false, title: "File menu" },
    thumb: cover("renewalclay", "evernote-price", 1600, 1000, "Note cards with a heavy price tag, and a path forking to a box and a folder"),
    draft: false,
  },
  {
    slug: "apple-notes-second-brain",
    title: "Apple Notes second brain: a simple system to copy",
    description: "Use Apple Notes as a second brain: four folders, a pinned Home note with links, tags and Smart Folders, and a weekly review of your Inbox.",
    excerpt: "A second brain in the notes app you already have: four folders, a Home note that links your projects, tags that gather notes across folders, and one weekly habit.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/macos27/notes27-smart-folder-open-todos.webp", alt: "A note in Apple Notes on macOS 27 with a heading, a checklist, a tag, a small table and a link to another note.", width: 2000, height: 900, window: false, title: "Plan for Saturday" },
    thumb: cover("rosehip", "second-brain", 1600, 1000, "Five paper note cards joined by thin lines into a small network"),
    draft: false,
  },
  {
    slug: "notes-app-for-developers",
    title: "Notes app for developers: 6 options compared",
    description: "Six notes apps for developers: Obsidian, Notion, Joplin, Bear, Apple Notes and Pinto Notes. Code blocks, Markdown, plain files and coding agents compared.",
    excerpt: "What a developer needs from notes: code blocks, Markdown, files you own and an agent that can read them. Six apps compared on each.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.standup,
    thumb: cover("pewter", "developers", 1600, 1000, "A paper note card with a dark code panel and orange angle bracket shapes"),
    draft: false,
  },
  {
    slug: "notes-app-for-writers",
    title: "Notes app for writers: six options for your drafts",
    description: "Six notes apps for writers: Apple Notes, Pinto Notes, Bear, Obsidian, Ulysses and Scrivener. Drafting, word count, versions and export compared.",
    excerpt: "Where to keep ideas and drafts: four notes apps and two writing apps, compared on distraction-free writing, word count, earlier versions and export.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.history,
    thumb: cover("custard", "writers", 1600, 1000, "A long paper draft page with a fountain pen and two small note cards"),
    draft: false,
  },
  {
    slug: "apple-notes-code-block",
    title: "Apple Notes code block: Monostyled and shortcuts",
    description: "Apple Notes has no code block, but Monostyled (Shift-Command-M on a Mac) sets code apart. How to use it on iPhone and Mac, Block Quote, and where it stops.",
    excerpt: "Notes has no true code block. Monostyled text, its Mac shortcut, Block Quote, and what Apple doesn't do for code, such as syntax highlighting.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.welcome,
    thumb: cover("eucalyptus", "code-block", 1600, 1000, "A paper note card with a dark code panel between lines of text"),
    draft: false,
  },
  {
    slug: "bear-notes-alternative-free",
    title: "Bear Notes alternative: free options for Mac and iPhone",
    description: "Free alternatives to Bear on Mac and iPhone, when to keep Bear, and and how to export your Bear notes as Markdown and bring them into Pinto Notes.",
    excerpt: "Free options for Bear users on Mac and iPhone, the reasons to stay with Bear, and how to export your notes and check them after the move.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-file-menu.webp", alt: "The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep.", width: 820, height: 800, window: false, title: "File menu" },
    thumb: cover("ochre", "bear-alt", 1600, 1000, "Two paper note cards on either side of an open paper gate"),
    draft: false,
  },
  {
    slug: "connect-notes-to-cursor",
    title: "Connect notes to Cursor with Pinto Notes MCP",
    description: "Add Pinto Notes to Cursor with one install link or a short mcp.json entry, sign in, choose Allow, and let Cursor read and edit your notes.",
    excerpt: "One install link adds your notes to Cursor. Then try a project brief from a note, and what to check if the connection fails.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.aiEdit,
    thumb: cover("slateblue", "cursor", 1600, 1000, "A dark paper code window joined by an orange cable to a paper note card"),
    draft: false,
  },
  {
    slug: "obsidian-alternative-for-mac",
    title: "Obsidian alternative for Mac: choosing where to move",
    description: "An Obsidian alternative for Mac: what Pinto Notes imports from a vault, when to keep Obsidian, and how to check the import before you switch.",
    excerpt: "Where to go from Obsidian on a Mac, what a vault import keeps, and the cases where Obsidian is still the better tool.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-file-menu.webp", alt: "The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep.", width: 820, height: 800, window: false, title: "File menu" },
    thumb: cover("aubergine", "obsidian-alt", 1600, 1000, "Three paper note cards linked above a paper laptop showing a note"),
    draft: false,
  },
  {
    slug: "simplenote-alternative-for-iphone-and-mac",
    title: "Simplenote alternative for iPhone and Mac",
    description: "A Simplenote alternative for iPhone and Mac: export your notes from Simplenote, import them into Pinto Notes, and check that nothing went missing.",
    excerpt: "Should you leave Simplenote? How to export your notes, bring them into Pinto Notes, and check the move, with the reasons to stay too.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-file-menu.webp", alt: "The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep.", width: 820, height: 800, window: false, title: "File menu" },
    thumb: cover("icewater", "simplenote-alt", 1600, 1000, "A plain paper note card next to a paper checklist card"),
    draft: false,
  },
  {
    slug: "chatgpt-prompt-library-in-notes",
    title: "ChatGPT prompt library in notes: a copyable layout",
    description: "Keep a ChatGPT prompt library in your notes: one task per note, instructions apart from the input, a checked example, and a layout to copy.",
    excerpt: "A prompt library you keep as notes: a layout to copy, how to organize it, how to test a change, and how ChatGPT can find a prompt once connected.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.aiEdit,
    thumb: cover("bisque", "prompt-library", 1600, 1000, "A paper card file box with an orange speech bubble on the front card"),
    draft: false,
  },
  {
    slug: "connect-notes-to-gemini-cli",
    title: "Connect notes to Gemini CLI with MCP",
    description: "Connect your notes to Gemini CLI with one gemini mcp add command and /mcp auth, then read a note from your phone and save results back.",
    excerpt: "One command connects Gemini CLI to your notes. Read a note you wrote on your phone, save the result back, and check the connection.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.aiEdit,
    thumb: cover("juniper", "gemini-cli", 1600, 1000, "A dark paper terminal with a chip, dotted line to a paper checklist"),
    draft: false,
  },
  {
    slug: "notion-alternative-for-personal-notes-on-mac",
    title: "Notion alternative for personal notes on Mac",
    description: "A Notion alternative for personal notes on Mac: what to move, Apple Notes or Pinto Notes, how to export from Notion, and a small test first.",
    excerpt: "For a personal notebook on a Mac: what to move, whether Apple Notes or Pinto Notes fits, how to export from Notion, and a small set to try first.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.welcome,
    thumb: cover("sorbet", "notion-alt", 1600, 1000, "A stack of grey paper blocks next to a single paper note card"),
    draft: false,
  },
  {
    slug: "onenote-alternative-for-mac",
    title: "OneNote alternative for Mac: starting with typed notes",
    description: "A OneNote alternative for Mac: what to move, how to save your OneNote originals, how to bring typed notes across, and what Pinto Notes can't import.",
    excerpt: "Leaving OneNote on a Mac: decide what to move, keep the originals, bring typed notes across, and know what doesn't come with them.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-file-menu.webp", alt: "The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep.", width: 820, height: 800, window: false, title: "File menu" },
    thumb: cover("loganberry", "onenote-alt", 1600, 1000, "A paper notebook with coloured tabs beside a paper laptop showing a list"),
    draft: false,
  },
  {
    slug: "google-keep-alternative-for-iphone-and-mac",
    title: "Google Keep alternative for iPhone and Mac",
    description: "Compare Pinto Notes with staying in Google Keep on iPhone and Mac. See what its Takeout import keeps, what it leaves out, and what to check.",
    excerpt: "Pinto imports your Keep notes on a Mac, including labels and checklist states. Check what comes across, what stays behind, and when keeping Google Keep makes sense.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: { src: "/blog/launch/import-google-keep-guide.webp", alt: "Pinto Notes' Google Keep import guide on a Mac: Bring your Google Keep notes, then step 1, Ask Google for your notes.", width: 1600, height: 1000, window: false, title: "Bring your Google Keep notes" },
    thumb: cover("lilacmist", "keep-alternative", 1600, 1000, "Yellow paper sticky notes and a light bulb with an arrow leading to a note card"),
    draft: false,
  },
  {
    slug: "upnote-alternative-for-iphone-and-mac",
    title: "UpNote alternative for iPhone and Mac: Pinto Notes",
    description: "Looking for an UpNote alternative on iPhone and Mac? Try a small Markdown import into Pinto Notes, check what transfers, and connect your AI.",
    excerpt: "Try an UpNote Markdown export in Pinto Notes before moving your library. Check links and attachments, and see when keeping UpNote makes more sense.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.welcome,
    thumb: cover("mintleaf", "upnote-alternative", 1600, 1000, "A notebook with an elastic band and an arrow leading to a note card beside a zip pouch"),
    draft: false,
  },
  {
    slug: "chatgpt-performance-review-from-notes",
    title: "ChatGPT performance review from notes: a checked draft",
    description: "Use ChatGPT to turn dated work notes into an accomplishment table with sources, then a self-review draft you check and edit before submitting.",
    excerpt: "Start with dated work notes and a prompt that asks for evidence. Check an accomplishment table with source links before turning it into your own self-review.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.standup,
    thumb: cover("coralreef", "performance-review", 1600, 1000, "A note card with a rising paper bar chart beside a paper trophy and a calendar page"),
    draft: false,
  },
  {
    slug: "chatgpt-brain-dump-to-action-list",
    title: "ChatGPT brain dump to action list: a prompt",
    description: "Turn a ChatGPT brain dump into actions you choose. Copy a prompt, keep the raw note untouched, and save questions and parked ideas beside it.",
    excerpt: "Keep the messy note as you wrote it. Use this ChatGPT prompt to propose next steps, check each one, and save the actions you choose beneath the original.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.aiEdit,
    thumb: cover("butterlight", "brain-dump", 1600, 1000, "Loose paper scraps flowing into a neat checklist card with three ticks"),
    draft: false,
  },
  {
    slug: "craft-alternative-for-personal-notes",
    title: "Craft Notes alternative for personal notes on Mac",
    description: "Pinto Notes as a Craft alternative for personal notes on Mac and iPhone: when to keep Craft, and how to test a small Markdown move first.",
    excerpt: "For text notes you write on Mac and iPhone, try a few Craft documents in an Apple Notes-style editor. Keep Craft if Collections or shared documents are central.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.welcome,
    thumb: cover("sandbar", "craft-alternative", 1600, 1000, "A stack of paper blocks and cards beside one plain note card with a small paper leaf"),
    draft: false,
  },
  {
    slug: "joplin-alternative-for-mac",
    title: "Joplin Notes alternative for Mac and iPhone",
    description: "Pinto Notes as a Joplin alternative on Mac and iPhone: how they compare, when to stay with Joplin, and how to move a notebook as Markdown.",
    excerpt: "If your notes live on a Mac and iPhone, try a small Joplin notebook in Pinto Notes as Markdown. Stay with Joplin if you need Windows, Linux or Android.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.welcome,
    thumb: cover("duskblue", "joplin-alternative", 1600, 1000, "A folder of paper sheets with an arrow leading to a note card beside a small paper laptop"),
    draft: false,
  },
  {
    slug: "mem-ai-alternative-for-mac-and-iphone",
    title: "Mem is shutting down: 8 alternatives that keep your AI",
    description: "Mem closes on 15 January 2027. Compare imports, prices and AI access in Notion, Obsidian, Apple Notes, Evernote, Google Docs, OneNote, Bear and Pinto.",
    excerpt: "Save the Mem export first, then choose where AI can still search, read and change the notes. Compare eight destinations, including their iPhone limits.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.welcome,
    thumb: cover("memdusk", "mem-alternative", 1600, 1000, "A paper shop front with its shutter down and an arrow carrying note cards to one new note card"),
    draft: false,
  },
  {
    slug: "reflect-notes-alternative-for-mac-and-iphone",
    title: "Reflect Notes alternative for Mac and iPhone",
    description: "Considering a Reflect Notes alternative? Compare Reflect Open with Pinto Notes, then test a Markdown import on your Mac before moving your library.",
    excerpt: "Reflect Open gives you another way to keep using Reflect. See when Pinto Notes suits a Mac and iPhone workflow, and how to check a small Markdown import first.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.welcome,
    thumb: cover("reflectmint", "reflect-alternative", 1600, 1000, "A round paper mirror and a calendar page with an arrow leading to a note card"),
    draft: false,
  },
  {
    slug: "apple-notes-time-log-template",
    title: "Apple Notes time log template, with a weekly total",
    description: "Copy a filled Apple Notes time log template for tasks and minutes. Set up the table on Mac or iPhone, handle interruptions and check a weekly total.",
    excerpt: "Record actual work in a dated Notes table, with interruptions and unknown time kept separate. A filled week shows how to check 450 minutes by day and project.",
    category: "Apple Notes",
    date: "2026-11-21",
    updated: "2026-11-21",
    image: SHOTS.welcome,
    thumb: cover("rosequartz", "time-log", 1600, 1000, "A paper stopwatch beside a note card with a grid of rows"),
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
