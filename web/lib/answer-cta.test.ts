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
  // 23 Nov 2026: the to-do list and packing list posts.
  "apple-notes-to-do-list-template", "apple-notes-packing-list-template",
  // 24 Nov 2026: the daily planner post, and the school post (a picker of four templates, as on apple-notes-templates).
  "apple-notes-daily-planner-template", "apple-notes-for-school",
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
  // Experiment B39 (24 Nov 2026): the download card is back on the first screen, under the template. Before 22 Nov it got
  // 6 downloads from 25 single-template visitors; pattern E without it, 0 from 16 (blog-growth EXPERIMENTS.md).
  it("show the template, the download card, then the same template in Apple Notes and in Pinto Notes", () => {
    for (const slug of E) {
      const src = source(slug);
      expect(src, slug).toContain("cover={false}");
      const answer = /answer=\{<>[\s\S]*?<\/>\}/.exec(src)?.[0] ?? "";
      expect(answer, slug).toMatch(/<(Keep|TemplatePicker)\b/);
      expect(answer, slug).toContain(`<SideBySide slug="${slug}"`);
      expect(src.match(/<PostCta /g), slug).toHaveLength(1);
      expect(answer, slug).toMatch(new RegExp(`<PostCta slug="${slug}" position="answer" title="[^"]+[?.]"`));
      // The template comes first, the card straight under it, then the side-by-side.
      const template = answer.search(/<(Keep|TemplatePicker)\b/);
      expect(template, slug).toBeLessThan(answer.indexOf("<PostCta"));
      expect(answer.indexOf("<PostCta"), slug).toBeLessThan(answer.indexOf("<SideBySide"));
      // No "Have Pinto Notes already? Open this template" line: Use template fails without the app.
      expect(answer, slug).not.toMatch(/<PostCta[^>]*template=/);
    }
  });

  it("each card has its own headline, and none names an AI (that look is for the AI posts)", () => {
    const titles = E.map((slug) => /<PostCta [^>]*title="([^"]+)"/.exec(source(slug))?.[1] ?? "");
    expect(new Set(titles).size).toBe(E.length);
    for (const t of titles) expect(t).not.toMatch(/\b(ChatGPT|Claude|AI)\b/);
  });

  it("send the side-by-side's button to the download, naming the template, never the template page", () => {
    for (const slug of E) {
      const src = source(slug);
      expect(src, slug).not.toMatch(/href: "\/templates/);
      expect(src, slug).not.toMatch(/button: "/);
    }
  });

  it("give the paste steps for the device in hand wherever the template is Markdown", () => {
    for (const slug of E) {
      const src = source(slug);
      expect(src, slug).not.toContain('note="On a Mac, paste it into a new note with Edit, Paste as Markdown."');
      expect(src, slug).not.toMatch(/Apple says Markdown formats itself/);
      if (/Paste as Markdown/.test(/answer=\{<>[\s\S]*?<\/>\}/.exec(src)?.[0] ?? "")) expect(src, slug).toContain("<PasteSteps");
    }
  });

  it("keep the copy plain: no dashes, no first person, no iPad", () => {
    for (const slug of E) {
      const card = /<PostCta [\s\S]*?<\/PostCta>/.exec(source(slug))?.[0] ?? "";
      expect(card, slug).not.toMatch(/[\u2013\u2014]|\bI\b|iPad|Incredible/);
      expect(card.replace(/title="[^"]*"/, ""), slug).not.toMatch(/ChatGPT|Claude/);
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
