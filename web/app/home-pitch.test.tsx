import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: () => {} }) }));
import Home from "./page";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

// The home page (2026-10-16): the notebook you and your AI share.
describe("the home page", () => {
  const html = renderToStaticMarkup(<Home />);
  const page = text(html);

  it("leads with the shared notebook, and names every AI that connects", () => {
    expect(page).toContain("The notebook you and your AI share.");
    for (const ai of ["ChatGPT", "Claude", "Claude Code", "Codex", "Incredible"]) expect(page, ai).toContain(ai);
  });

  it("has one h1, and its structured data", () => {
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("application/ld+json");
  });

  it("offers the Mac download, says the iPhone app is coming, and never says iPad", () => {
    expect(page).toContain("Download for Mac");
    expect(page).toContain("Coming to iPhone");
    expect(page).not.toMatch(/iPad/);
  });

  it("says what the week film shows in words too, for screen readers", () => {
    expect(page).toContain("A week in one note");
    expect(page).toContain("you tick off the long run yourself");
  });

  it("shows templates and links to all of them", () => {
    expect(html).toContain('href="/templates"');
  });

  it("says sharing is coming, not here", () => {
    expect(page).toMatch(/Share with people\s*Coming soon/);
  });

  it("has no em or en dashes", () => {
    expect(page).not.toMatch(/[–—]/);
  });
});
