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
const LATER = ["apple-notes-version-history", "apple-notes-budget-template", "ai-memory-with-notes"];
const CONTROL = ["apple-notes-not-syncing", "forgot-apple-notes-password", "move-apple-notes-to-icloud", "recover-deleted-apple-notes"];

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

  it("stays off the Apple Notes help posts, which are the comparison", () => {
    for (const slug of CONTROL) expect(source(slug), slug).not.toContain('position="answer"');
  });
});
