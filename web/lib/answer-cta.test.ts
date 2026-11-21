import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Experiment B1 (13 November 2026, blog-growth/EXPERIMENTS.md): readers read about 75% of a post and leave, and
// the download sat only at the end. On the posts where Pinto Notes is the answer, the download card now sits in
// the short answer. The Apple Notes help posts stay as they were, so they can be compared.
const B1 = [
  "apple-notes-templates", "connect-chatgpt-to-your-notes", "connect-notes-to-grok", "apple-notes-tables",
  "move-apple-notes-to-obsidian-notion-keep", "export-apple-notes-to-markdown", "notes-in-claude-code-and-codex", "obsidian-mcp",
  "move-from-apple-notes",
];
// Posts written or changed after B1 started carry the same card, outside the experiment.
const LATER = ["apple-notes-version-history", "apple-notes-budget-template", "ai-memory-with-notes", "apple-notes-habit-tracker", "apple-notes-trip-planner-template", "apple-notes-meal-planner-template", "apple-notes-backlinks", "apple-notes-workout-log-template", "apple-notes-flashcards", "apple-notes-reading-list", "apple-notes-job-search-tracker", "apple-notes-mood-tracker", "apple-notes-vs-obsidian", "apple-notes-vs-notion", "evernote-to-apple-notes", "google-keep-to-apple-notes", "apple-notes-alternatives", "apple-notes-ai", "best-note-taking-app-for-iphone", "apple-notes-vs-google-keep", "apple-notes-vs-onenote", "apple-notes-expense-tracker", "apple-notes-vs-bear", "apple-notes-vs-evernote", "best-notes-apps-with-mcp", "evernote-alternative", "evernote-price-increase", "apple-notes-second-brain", "notes-app-for-developers", "notes-app-for-writers", "apple-notes-code-block", "bear-notes-alternative-free", "connect-notes-to-cursor", "obsidian-alternative-for-mac", "simplenote-alternative-for-iphone-and-mac", "chatgpt-prompt-library-in-notes", "connect-notes-to-gemini-cli", "notion-alternative-for-personal-notes-on-mac", "onenote-alternative-for-mac", "google-keep-alternative-for-iphone-and-mac", "upnote-alternative-for-iphone-and-mac", "chatgpt-performance-review-from-notes", "chatgpt-brain-dump-to-action-list", "craft-alternative-for-personal-notes", "joplin-alternative-for-mac", "mem-ai-alternative-for-mac-and-iphone", "reflect-notes-alternative-for-mac-and-iphone", "apple-notes-time-log-template"];
// The Apple Notes help posts (B20) were removed on 21 Nov 2026: 0 downloads in 28 days (blog-growth STRATEGIES.md).
// B27 (21 Nov 2026): posts that had no download at all get one in the answer.
const B27 = ["siri-ai-apple-notes", "budget-tracker-with-chatgpt-or-claude", "encrypted-notes-app-for-ai"];

const source = (slug: string) => readFileSync(join(process.cwd(), "app", "blog", slug, "page.tsx"), "utf8");

describe("the download in a post's short answer", () => {
  it("is in the answer of every post where Pinto Notes is the answer, named for that post", () => {
    for (const slug of B1) {
      const src = source(slug);
      expect(src, slug).toContain(`<PostCta slug="${slug}" position="answer"`);
      const answer = /<Answer[\s\S]*?<\/Answer>/.exec(src)?.[0];
      // move-from-apple-notes has no answer box; its card follows "Before you start".
      if (answer) expect(answer, slug).toContain("<PostCta");
    }
  });

  it("is in the answer of the posts written since, and of the memory study", () => {
    for (const slug of [...LATER, ...B27]) {
      const answer = /<Answer[\s\S]*?<\/Answer>/.exec(source(slug))?.[0] ?? "";
      expect(answer, slug).toContain(`<PostCta slug="${slug}" position="answer"`);
    }
  });
});
