import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  // 25 Nov 2026: the checklist and wishlist posts (B41).
  "apple-notes-checklist-template", "apple-notes-wishlist-template",
  // 26 Nov 2026: the 75 Hard and Christmas list posts (B43).
  "apple-notes-75-hard-template", "iphone-notes-christmas-list",
];

// Experiment B40 (24 Nov 2026): on the budget post the Pinto budget template runs live under the intro (lib/LiveBudget.tsx),
// with its own Keep it, in place of B39's card, so the reader has one first-screen action. Experiment B44 (26 Nov 2026): the
// meal planner post does the same with the Pinto meal plan template (lib/LiveMealPlan.tsx).
// Experiment B45 (27 Nov 2026): the expense tracker post does the same with the template's expense log (lib/LiveExpenses.tsx).
const LIVE: Record<string, string> = {
  "apple-notes-budget-template": "LiveBudget", "apple-notes-meal-planner-template": "LiveMealPlan", "apple-notes-expense-tracker": "LiveExpenses",
};
const CARD = E.filter((slug) => !(slug in LIVE));
// Experiment B42 (25 Nov 2026): on the templates post the side-by-side moved into the picker and follows the pick, each
// template with its own Pinto twin (lib/apple-notes-templates.ts, lib/PintoTwin.tsx), so there's no separate side-by-side.
const TWINS = ["apple-notes-templates"];

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
    for (const slug of CARD) {
      const src = source(slug);
      expect(src, slug).toContain("cover={false}");
      const answer = /answer=\{<>[\s\S]*?<\/>\}/.exec(src)?.[0] ?? "";
      expect(answer, slug).toMatch(/<(Keep|TemplatePicker)\b/);
      if (!TWINS.includes(slug)) expect(answer, slug).toContain(`<SideBySide slug="${slug}"`);
      expect(src.match(/<PostCta /g), slug).toHaveLength(1);
      expect(answer, slug).toMatch(new RegExp(`<PostCta slug="${slug}" position="answer" title="[^"]+[?.]"`));
      // The template comes first, the card straight under it, then the side-by-side.
      const template = answer.search(/<(Keep|TemplatePicker)\b/);
      expect(template, slug).toBeLessThan(answer.indexOf("<PostCta"));
      if (!TWINS.includes(slug)) expect(answer.indexOf("<PostCta"), slug).toBeLessThan(answer.indexOf("<SideBySide"));
      // No "Have Pinto Notes already? Open this template" line: Use template fails without the app.
      expect(answer, slug).not.toMatch(/<PostCta[^>]*template=/);
    }
  });

  it("show each template's Pinto twin in the picker on the templates post, and no separate side-by-side (B42)", () => {
    for (const slug of TWINS) {
      const answer = /answer=\{<>[\s\S]*?<\/>\}/.exec(source(slug))?.[0] ?? "";
      expect(answer, slug).toContain(`<TemplatePicker templates={APPLE_NOTES_TEMPLATES} legend="Pick a template" post="${slug}"`);
      expect(answer, slug).not.toContain("<SideBySide");
    }
  });

  it("open the budget, meal planner and expense tracker posts on their live template and its Keep it, with no card, then the template and the side-by-side (B40, B44, B45)", () => {
    for (const [slug, live] of Object.entries(LIVE)) {
      const src = source(slug);
      const answer = /answer=\{<>[\s\S]*?<\/>\}/.exec(src)?.[0] ?? "";
      expect(src, slug).not.toContain("<PostCta");
      expect(answer.trimStart().replace(/^answer=\{<>\s*/, ""), slug).toMatch(new RegExp(`^<${live} slug="${slug}" />`));
      expect(answer.indexOf(`<${live}`), slug).toBeLessThan(answer.indexOf("<Keep"));
      expect(answer.indexOf("<Keep"), slug).toBeLessThan(answer.indexOf(`<SideBySide slug="${slug}"`));
    }
  });

  it("each card has its own headline, and none names an AI (that look is for the AI posts)", () => {
    const titles = CARD.map((slug) => /<PostCta [^>]*title="([^"]+)"/.exec(source(slug))?.[1] ?? "");
    expect(new Set(titles).size).toBe(CARD.length);
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

  // B39 follow-up: every download from these posts came before a scroll, so on a phone the card's button must be on the
  // first screen at 375 x 667. The card goes first under the intro there, as words and a button (measured in headless
  // Chrome: bottom edge 567 to 617 px; research/template-posts-first-screen-2026-11-24).
  it("put the card first on a phone, as words and a button, on every post without a cover", () => {
    const post = readFileSync(join(process.cwd(), "lib", "post.module.css"), "utf8");
    const phone = /@media \(max-width: 600px\) \{[^@]*\.col\[data-cover="none"\] > \.top \{ display: flex; flex-direction: column; \}[^@]*\}/.exec(post)?.[0] ?? "";
    expect(phone).toMatch(/\.top > \* \{ order: 2; \}/);
    expect(phone).toMatch(/\.top > \.intro \{ order: 0;/);
    expect(phone).toMatch(/\.top > :global\(\.post-answer-cta\) \{ order: 1;/);
    const parts = readFileSync(join(process.cwd(), "lib", "post-parts.module.css"), "utf8");
    expect(parts).toMatch(/@media \(max-width: 600px\) \{ :global\(article\[data-cover="none"\]\) \.ctaCompact \.ctaThumb \{ display: none; \} \}/);
    expect(readFileSync(join(process.cwd(), "lib", "PostCta.tsx"), "utf8")).toContain("${s.ctaCompact} post-answer-cta");
    // Only the template posts have no cover, so no other post's answer is reordered.
    const blog = join(process.cwd(), "app", "blog");
    const coverless = readdirSync(blog).filter((d) => existsSync(join(blog, d, "page.tsx")) && source(d).includes("cover={false}"));
    expect(coverless.sort()).toEqual([...E].sort());
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
