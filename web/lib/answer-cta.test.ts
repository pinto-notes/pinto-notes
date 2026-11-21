import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Experiment B1 (13 November 2026, blog-growth/EXPERIMENTS.md): readers read about 75% of a post and leave, and
// the download sat only at the end. On the posts where Pinto Notes is the answer, the download card now sits in
// the short answer. The Apple Notes help posts stay as they were, so they can be compared.
const B1 = [
  "apple-notes-api", "apple-notes-templates", "connect-chatgpt-to-your-notes", "connect-notes-to-grok", "apple-notes-tables",
  "move-apple-notes-to-obsidian-notion-keep", "export-apple-notes-to-markdown", "notes-in-claude-code-and-codex", "obsidian-mcp",
  "move-from-apple-notes",
];
// Posts written or changed after B1 started carry the same card, outside the experiment.
const LATER = ["apple-notes-version-history", "apple-notes-budget-template", "ai-memory-with-notes", "apple-notes-habit-tracker", "apple-notes-trip-planner-template", "apple-notes-meal-planner-template", "apple-notes-backlinks", "apple-notes-workout-log-template", "apple-notes-recipe-template", "apple-notes-grocery-list-template", "apple-notes-meeting-notes-template", "apple-notes-cornell-notes-template", "apple-notes-flashcards", "apple-notes-reading-list", "apple-notes-book-notes-template", "apple-notes-job-search-tracker", "apple-notes-weekly-review-template", "apple-notes-decision-log-template", "apple-notes-1-on-1-template", "apple-notes-daily-standup-template", "apple-notes-bug-triage-template", "apple-notes-journal-template", "apple-notes-mood-tracker", "apple-notes-home-maintenance-checklist", "apple-notes-content-calendar", "apple-notes-gift-ideas", "apple-notes-organize", "apple-notes-checklist-sort", "apple-notes-for-school", "apple-notes-planner-template", "apple-notes-vs-obsidian", "apple-notes-vs-notion", "evernote-to-apple-notes", "google-keep-to-apple-notes", "apple-notes-alternatives", "where-are-apple-notes-stored", "apple-notes-ai", "apple-notes-tips", "best-note-taking-app-for-iphone", "apple-notes-vs-google-keep", "apple-notes-vs-onenote", "apple-notes-export-pdf", "apple-notes-lock-folder", "apple-notes-storage-limit", "apple-notes-to-do-list", "apple-notes-expense-tracker", "apple-notes-vs-bear", "apple-notes-vs-evernote", "apple-notes-on-windows", "apple-notes-scan-document", "apple-notes-record-and-transcribe", "apple-notes-widget", "apple-notes-font", "apple-notes-annotate-pdf", "best-notes-apps-with-mcp", "evernote-alternative", "apple-notes-second-brain", "notes-app-for-developers", "notes-app-for-writers", "apple-notes-code-block"];
// The Apple Notes help posts were B1's comparison until 21 Nov (B20): with the goal of 100 downloads a week, the card goes where the readers are.
const HELP = ["apple-notes-not-syncing", "forgot-apple-notes-password", "move-apple-notes-to-icloud", "recover-deleted-apple-notes", "apple-notes-disappeared", "apple-notes-search-not-working", "apple-notes-unable-to-start-collaboration", "apple-notes-not-working", "apple-notes-keeps-jumping-to-top", "apple-notes-stuck-on-folders"];

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
    for (const slug of LATER) {
      const answer = /<Answer[\s\S]*?<\/Answer>/.exec(source(slug))?.[0] ?? "";
      expect(answer, slug).toContain(`<PostCta slug="${slug}" position="answer"`);
    }
  });

  it("is in the answer of the Apple Notes help posts too, since B1 ended there (B20)", () => {
    for (const slug of HELP) {
      const answer = /<Answer[\s\S]*?<\/Answer>/.exec(source(slug))?.[0] ?? "";
      expect(answer, slug).toContain(`<PostCta slug="${slug}" position="answer"`);
    }
  });
});
