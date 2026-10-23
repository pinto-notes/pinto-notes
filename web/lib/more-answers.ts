import { published, type Post } from "./posts";

/// The blog's "More answers": every post that isn't featured, grouped by what a visitor came for, each
/// asked the way a person would ask it. Every published post is in a shelf (lib/seo.test.ts checks).

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
      { slug: "new-ai-features", ask: "What's new in ChatGPT, Claude and Gemini?" },
      { slug: "gpt-6-astra-use-cases", ask: "GPT-6 Astra: what's it good for?" },
      { slug: "what-are-chatgpt-dots", ask: "What are ChatGPT dots?" },
      { slug: "meta-muse-connectors", ask: "Which Meta Muse connectors to add?" },
      { slug: "connect-notes-to-grok", ask: "Connect your notes to Grok" },
    ],
  },
];

/// The shelves with the posts of `list` (in shelf order), leaving out empty shelves.
export function shelves(list: Post[] = published()): (Shelf & { posts: (Post & { ask: string })[] })[] {
  const m = new Map(list.map((p) => [p.slug, p]));
  return SHELVES.map((s) => ({
    ...s,
    posts: s.items.flatMap((i) => (m.has(i.slug) ? [{ ...m.get(i.slug)!, ask: i.ask }] : [])),
  })).filter((s) => s.posts.length > 0);
}
