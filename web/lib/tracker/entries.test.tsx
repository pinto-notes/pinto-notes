// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { readingMinutes } from "../blog";
import { published } from "../posts";
import { ENTRIES } from "./entries";
import { FeatureTracker } from "./FeatureTracker";

// The AI feature tracker (/blog/new-ai-features): every row is dated, sourced and linked to a real post.
describe("the AI feature tracker", () => {
  it("dates every row by day or month, and links each to an official https page", () => {
    for (const e of ENTRIES) {
      expect(e.date, e.feature).toMatch(/^20\d\d-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/);
      expect(e.source, e.feature).toMatch(/^https:\/\//);
      for (const t of [e.feature, e.what, e.who ?? ""]) expect(t, e.feature).not.toContain("—");
    }
  });

  it("has each launch once, and points how-tos only at published posts", () => {
    const keys = ENTRIES.map((e) => `${e.assistant}: ${e.feature}`);
    expect(new Set(keys).size).toBe(keys.length);
    const slugs = new Set(published().map((p) => p.slug));
    for (const e of ENTRIES) if (e.guide) expect(slugs.has(e.guide), e.guide).toBe(true);
  });

  it("puts every row in the page's HTML, newest month first", () => {
    const html = renderToStaticMarkup(<FeatureTracker entries={ENTRIES} />);
    const d = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    expect(d.querySelectorAll("li").length).toBe(ENTRIES.length);
    const months = [...d.querySelectorAll("h2")].map((h) => h.id);
    expect(months[0]).toBe("october-2026");
    expect(months.at(-1)).toBe("april-2026");
  });

  it("counts its rows in the reading time, so it doesn't say 1 min read", () => {
    expect(readingMinutes("new-ai-features")).toBeGreaterThanOrEqual(4);
  });
});
