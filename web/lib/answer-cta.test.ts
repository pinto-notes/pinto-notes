import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Experiment B1 (13 November 2026, blog-growth/EXPERIMENTS.md): readers read about 75% of a post and leave, and
// the download sat only at the end. On the posts where Pinto Notes is the answer, the download card now sits in
// the short answer. The Apple Notes help posts stay as they were, so they can be compared.
const B1 = [
  "connect-chatgpt-to-your-notes", "connect-notes-to-grok", "apple-notes-tables",
  "export-apple-notes-to-markdown", "notes-in-claude-code-and-codex", "obsidian-mcp",
];
// Posts written or changed after B1 started carry the same card, outside the experiment.
const LATER = ["ai-memory-with-notes", "best-notes-apps-with-mcp", "connect-notes-to-cursor", "chatgpt-prompt-library-in-notes", "connect-notes-to-gemini-cli", "chatgpt-performance-review-from-notes", "chatgpt-brain-dump-to-action-list"];
// The Apple Notes help posts (B20) were removed on 21 Nov 2026: 0 downloads in 28 days (blog-growth STRATEGIES.md).
// B27 (21 Nov 2026): posts that had no download at all get one in the answer.
const B27 = ["budget-tracker-with-chatgpt-or-claude", "encrypted-notes-app-for-ai"];

// Pattern E (22 Nov 2026, Emil approved): the Apple Notes template posts open on the template, then the same template in Apple
// Notes and in Pinto Notes side by side (lib/SideBySide.tsx), whose button goes to the Pinto template. The early download card
// went, with the long text and the cover.
const E = [
  "apple-notes-budget-template", "apple-notes-expense-tracker", "apple-notes-habit-tracker", "apple-notes-job-search-tracker",
  "apple-notes-meal-planner-template", "apple-notes-mood-tracker", "apple-notes-reading-list", "apple-notes-templates",
  "apple-notes-time-log-template", "apple-notes-trip-planner-template", "apple-notes-workout-log-template",
  // 22 Nov 2026: the six template posts restored at their old addresses, and the flashcards post.
  "apple-notes-recipe-template", "apple-notes-grocery-list-template", "apple-notes-meeting-notes-template",
  "apple-notes-journal-template", "apple-notes-planner-template", "apple-notes-cornell-notes-template", "apple-notes-flashcards",
];

const source = (slug: string) => readFileSync(join(process.cwd(), "app", "blog", slug, "page.tsx"), "utf8");

describe("the download in a post's short answer", () => {
  it("is in the answer of every post where Pinto Notes is the answer, named for that post", () => {
    for (const slug of B1) {
      const src = source(slug);
      expect(src, slug).toContain(`<PostCta slug="${slug}" position="answer"`);
      const answer = /<Answer[\s\S]*?<\/Answer>/.exec(src)?.[0];
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

describe("the Apple Notes template posts (pattern E)", () => {
  it("show the template, then the same template in Apple Notes and in Pinto Notes, with no download card above them", () => {
    for (const slug of E) {
      const src = source(slug);
      expect(src, slug).toContain("cover={false}");
      expect(src, slug).not.toContain("<PostCta");
      const answer = /answer=\{<>[\s\S]*?<\/>\}/.exec(src)?.[0] ?? "";
      expect(answer, slug).toMatch(/<(Keep|TemplatePicker)\b/);
      expect(answer, slug).toContain(`<SideBySide slug="${slug}"`);
      // The template comes first, the side-by-side straight under it.
      expect(answer.search(/<(Keep|TemplatePicker)\b/), slug).toBeLessThan(answer.indexOf("<SideBySide"));
      expect(answer, slug).toMatch(/href: "\/templates(\/[a-z-]+)?"/);
    }
  });

  it("ask the reader to type = on the sum lines, which carry none, because a pasted = gets no answer in Notes", () => {
    for (const slug of ["apple-notes-budget-template", "apple-notes-expense-tracker"]) {
      const template = /const TEMPLATE = `([\s\S]*?)`;/.exec(source(slug))?.[1] ?? "";
      expect(template, slug).not.toMatch(/=\s*$/m);
      expect(source(slug), slug).toMatch(/type = at the end of the last/i);
    }
  });
});
