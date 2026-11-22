import { describe, expect, it } from "vitest";
import { showsPintoHero } from "./PostPage";

// Emil, 21 Nov 2026: a Pinto screenshot under an Apple Notes or Obsidian answer is too much Pinto in the first screen.
describe("the default Pinto picture under a post's answer", () => {
  it("shows on posts about Pinto Notes", () => {
    expect(showsPintoHero("slash-menu", "Building Pinto Notes")).toBe(true);
    expect(showsPintoHero("connect-chatgpt-to-your-notes", "Guides")).toBe(true);
    expect(showsPintoHero("connect-notes-to-gemini-cli", "Apple Notes")).toBe(true);
  });
  it("doesn't on Apple Notes help or comparisons", () => {
    expect(showsPintoHero("apple-notes-not-working", "Apple Notes")).toBe(false);
    expect(showsPintoHero("obsidian-mcp", "Comparisons")).toBe(false);
  });
});
