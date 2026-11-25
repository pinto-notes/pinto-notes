import { published, type Post } from "./posts";

/// The blog's answers (/blog/answers): every post that isn't on the front of the blog, grouped by
/// what a visitor came for, each asked the way a person would ask it. Every published post is in a shelf (lib/seo.test.ts checks).

export type Shelf = { title: string; line: string; items: { slug: string; ask: string }[] };

export const SHELVES: Shelf[] = [
  {
    title: "Apple Notes, answered",
    line: "Tested on a Mac running macOS 27, with every step pictured.",
    items: [
      { slug: "apple-notes-tables", ask: "Can a table in Notes add up a column?" },
      { slug: "apple-notes-time-log-template", ask: "Can Notes track where my time went?" },
      { slug: "apple-notes-expense-tracker", ask: "Can Notes keep track of my spending?" },
      { slug: "apple-notes-templates", ask: "Can Notes do templates?" },
      { slug: "apple-notes-budget-template", ask: "Is there a budget template for Notes?" },
      { slug: "apple-notes-habit-tracker", ask: "Can Notes track my habits?" },
      { slug: "apple-notes-trip-planner-template", ask: "Can Notes plan a trip?" },
      { slug: "apple-notes-meal-planner-template", ask: "Can Notes plan the week's dinners?" },
      { slug: "apple-notes-workout-log-template", ask: "Can Notes keep a workout log?" },
      { slug: "apple-notes-flashcards", ask: "Can Notes make flashcards?" },
      { slug: "apple-notes-reading-list", ask: "Can Notes keep my reading list?" },
      { slug: "apple-notes-job-search-tracker", ask: "Can Notes track my job applications?" },
      { slug: "apple-notes-mood-tracker", ask: "Can Notes track my mood?" },
      { slug: "apple-notes-recipe-template", ask: "Can Notes hold my recipes?" },
      { slug: "apple-notes-grocery-list-template", ask: "Can Notes sort a grocery list?" },
      { slug: "apple-notes-meeting-notes-template", ask: "Can Notes track meeting actions?" },
      { slug: "apple-notes-journal-template", ask: "Can Notes keep my journal?" },
      { slug: "apple-notes-planner-template", ask: "Can I plan my week in Notes?" },
      { slug: "apple-notes-to-do-list-template", ask: "Can Notes sort my to-do list?" },
      { slug: "apple-notes-packing-list-template", ask: "Can Notes keep a packing list?" },
      { slug: "apple-notes-daily-planner-template", ask: "Can I plan my day in Notes?" },
      { slug: "apple-notes-for-school", ask: "Is Apple Notes good for school?" },
      { slug: "apple-notes-checklist-template", ask: "Can Notes reset a daily checklist?" },
      { slug: "apple-notes-wishlist-template", ask: "Can Notes keep a family wishlist?" },
      { slug: "apple-notes-cornell-notes-template", ask: "Can I do Cornell notes in Notes?" },
      { slug: "export-apple-notes-to-markdown", ask: "How do I get my notes out as Markdown?" },
    ],
  },
  {
    title: "Your AI and your notes",
    line: "So ChatGPT and Claude know what you know, without pasting it in every time.",
    items: [
      { slug: "connect-chatgpt-to-your-notes", ask: "How do I connect ChatGPT to my notes?" },
      { slug: "best-notes-apps-with-mcp", ask: "Which notes apps work with MCP?" },
      { slug: "chatgpt-brain-dump-to-action-list", ask: "Can ChatGPT sort my brain dump?" },
      { slug: "chatgpt-performance-review-from-notes", ask: "Can ChatGPT draft my self-review?" },
      { slug: "connect-notes-to-gemini-cli", ask: "Can Gemini CLI use my notes?" },
      { slug: "chatgpt-prompt-library-in-notes", ask: "Where should I keep my ChatGPT prompts?" },
      { slug: "connect-notes-to-cursor", ask: "Can Cursor read my notes?" },
      { slug: "notes-in-claude-code-and-codex", ask: "Can Claude Code and Codex use my notes?" },
      { slug: "budget-tracker-with-chatgpt-or-claude", ask: "Can my AI keep a budget for me?" },
      { slug: "encrypted-notes-app-for-ai", ask: "Can an encrypted notes app work with AI?" },
      { slug: "chatgpt-and-apple-notes", ask: "Can ChatGPT use Apple Notes?" },
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
