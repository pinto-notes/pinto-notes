import { published, type Post } from "./posts";

/// The blog's answers (/blog/answers): every post that isn't on the front of the blog, grouped by
/// what a visitor came for, each asked the way a person would ask it. Every published post is in a shelf (lib/seo.test.ts checks).

export type Shelf = { title: string; line: string; items: { slug: string; ask: string }[] };

export const SHELVES: Shelf[] = [
  {
    title: "Apple Notes, answered",
    line: "Tested on a Mac running macOS 27, with every step pictured.",
    items: [
      { slug: "forgot-apple-notes-password", ask: "Forgot your Notes password?" },
      { slug: "recover-deleted-apple-notes", ask: "Deleted a note by mistake?" },
      { slug: "apple-notes-version-history", ask: "Can I get an old version of a note back?" },
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
      { slug: "move-from-apple-notes", ask: "How do I move my Apple Notes to Pinto Notes?" },
    ],
  },
  {
    title: "Your AI and your notes",
    line: "So ChatGPT and Claude know what you know, without pasting it in every time.",
    items: [
      { slug: "connect-chatgpt-to-your-notes", ask: "How do I connect ChatGPT to my notes?" },
      { slug: "notes-in-claude-code-and-codex", ask: "Can Claude Code and Codex use my notes?" },
      { slug: "budget-tracker-with-chatgpt-or-claude", ask: "Can my AI keep a budget for me?" },
      { slug: "encrypted-notes-app-for-ai", ask: "Can an encrypted notes app work with AI?" },
      { slug: "chatgpt-and-apple-notes", ask: "Can ChatGPT use Apple Notes?" },
      { slug: "claude-and-apple-notes", ask: "Can Claude use Apple Notes?" },
      { slug: "obsidian-mcp", ask: "Can Claude use my Obsidian vault?" },
      { slug: "connect-notes-to-grok", ask: "Connect your notes to Grok" },
      { slug: "mcp-server", ask: "What can an AI do through the MCP server?" },
    ],
  },
  {
    title: "Notes apps, compared",
    line: "Read on each maker's own pages, with the prices of the day.",
    items: [
      { slug: "best-ai-notes-app", ask: "What's the best AI notes app?" },
      { slug: "best-notes-app-for-mac", ask: "What's the best notes app for Mac?" },
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
