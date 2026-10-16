import { published, type Post } from "./posts";

/// Lab only (16 October 2026): three calmer blog indexes for Emil to compare. The posts grouped by
/// what a visitor came for, with each one asked the way a normal person would ask it.

export type Shelf = { title: string; line: string; items: { slug: string; ask: string }[] };

export const SHELVES: Shelf[] = [
  {
    title: "Apple Notes, answered",
    line: "Tested on a Mac running macOS 27, with every step pictured.",
    items: [
      { slug: "forgot-apple-notes-password", ask: "Forgot your Notes password?" },
      { slug: "recover-deleted-apple-notes", ask: "Deleted a note by mistake?" },
      { slug: "apple-notes-not-syncing", ask: "Notes not syncing between iPhone and Mac?" },
      { slug: "apple-notes-ios-27", ask: "What's new in Notes on iOS 27?" },
      { slug: "apple-notes-tables", ask: "Can a table in Notes add up a column?" },
      { slug: "apple-notes-tags-smart-folders", ask: "How do tags and smart folders work?" },
      { slug: "apple-notes-templates", ask: "Can Notes do templates?" },
      { slug: "back-up-apple-notes", ask: "How do I back up my notes?" },
      { slug: "export-apple-notes-to-markdown", ask: "How do I get my notes out as Markdown?" },
      { slug: "move-apple-notes-to-icloud", ask: "Notes stuck in On My Mac?" },
      { slug: "move-apple-notes-to-obsidian-notion-keep", ask: "Moving to Obsidian, Notion or Keep?" },
      { slug: "siri-ai-apple-notes", ask: "What can Siri AI do with my notes?" },
      { slug: "apple-notes-api", ask: "Is there an Apple Notes API?" },
    ],
  },
  {
    title: "Your AI and your notes",
    line: "So ChatGPT and Claude know what you know, without pasting it in every time.",
    items: [
      { slug: "connect-chatgpt-to-your-notes", ask: "Can ChatGPT read my notes?" },
      { slug: "chatgpt-and-apple-notes", ask: "Can ChatGPT use Apple Notes?" },
      { slug: "claude-and-apple-notes", ask: "Can Claude use Apple Notes?" },
      { slug: "claude-memory-vs-notes", ask: "Isn't Claude's memory enough?" },
      { slug: "notes-in-claude-code-and-codex", ask: "Notes for Claude Code and Codex?" },
      { slug: "notes-apps-with-mcp", ask: "Which notes apps work with AI?" },
      { slug: "best-notes-app-for-ai-agents", ask: "What's the best notes app for AI agents?" },
      { slug: "obsidian-mcp", ask: "Can Claude use my Obsidian vault?" },
      { slug: "mcp-server", ask: "What's an MCP server, in plain words?" },
      { slug: "encrypted-notes-app-for-ai", ask: "Can an AI use encrypted notes?" },
      { slug: "move-from-apple-notes", ask: "How do I bring my Apple Notes along?" },
    ],
  },
  {
    title: "Make something with your AI",
    line: "Prompts to copy, and what it looks like when it works.",
    items: [
      { slug: "habit-tracker-with-chatgpt-or-claude", ask: "A habit tracker" },
      { slug: "budget-tracker-with-chatgpt-or-claude", ask: "A budget that adds itself up" },
      { slug: "plan-a-trip-with-chatgpt-or-claude", ask: "A trip plan" },
      { slug: "flashcards-with-chatgpt-or-claude", ask: "Flashcards from your notes" },
      { slug: "journal-with-chatgpt-or-claude", ask: "A daily journal" },
    ],
  },
  {
    title: "New in AI",
    line: "What just came out, and whether it's worth your time.",
    items: [
      { slug: "gpt-6-astra-use-cases", ask: "GPT-6 Astra: what's it good for?" },
      { slug: "what-are-chatgpt-dots", ask: "What are ChatGPT dots?" },
      { slug: "meta-muse-connectors", ask: "Which Meta Muse connectors to add?" },
      { slug: "connect-notes-to-grok", ask: "Connect your notes to Grok" },
    ],
  },
];

const live = () => new Map(published().map((p) => [p.slug, p]));

/// The shelves with their posts, leaving out any post that isn't published.
export function shelves(): (Shelf & { posts: (Post & { ask: string })[] })[] {
  const m = live();
  return SHELVES.map((s) => ({
    ...s,
    posts: s.items.flatMap((i) => (m.has(i.slug) ? [{ ...m.get(i.slug)!, ask: i.ask }] : [])),
  }));
}

/// Real pictures of the topic itself (each post's own first picture), for the few posts shown big.
export const TOPIC_PICTURES: Record<string, { src: string; width: number; height: number; alt: string }> = {
  "apple-notes-ios-27": { src: "/blog/macos27/notes27-garden-note", width: 1400, height: 993, alt: "A Spring garden plan note in Apple Notes on macOS 27, with section links and divider lines." },
  "forgot-apple-notes-password": { src: "/blog/macos27/notes-locked-window", width: 1520, height: 984, alt: "A locked note in Apple Notes on a Mac, asking for its password." },
  "recover-deleted-apple-notes": { src: "/blog/macos27/notes-recently-deleted-window", width: 1520, height: 1003, alt: "The Recently Deleted folder in Apple Notes on a Mac." },
  "apple-notes-tables": { src: "/blog/macos27/notes27-table-reading-list", width: 1400, height: 554, alt: "A reading list table in Apple Notes on macOS 27." },
  "claude-memory-vs-notes": { src: "/blog/amber-notes-claude-edit-lisbon", width: 1500, height: 748, alt: "A Lisbon trip note in Pinto Notes with the line Claude just added, and Undo." },
  "habit-tracker-with-chatgpt-or-claude": { src: "/blog/pinto/habit-tracker-main-mac-light", width: 1280, height: 900, alt: "A habit tracker in a Pinto Notes note: this week's ring and today's habits." },
  "budget-tracker-with-chatgpt-or-claude": { src: "/blog/pinto/budget-log-main-mac-light", width: 1280, height: 900, alt: "A budget in a Pinto Notes note: what's left this month and a six-month chart." },
  "plan-a-trip-with-chatgpt-or-claude": { src: "/blog/pinto/trip-plan-main-mac-light", width: 1280, height: 900, alt: "A Lisbon trip plan in a Pinto Notes note: days to go, bookings and packing." },
  "connect-chatgpt-to-your-notes": { src: "/blog/amber-notes-allow-chatgpt-access", width: 840, height: 700, alt: "Pinto Notes asking whether ChatGPT may use your notes." },
};
