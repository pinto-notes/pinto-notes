import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PostCta } from "./PostCta";

vi.mock("next/navigation", () => ({ usePathname: () => "/blog/apple-notes-tables", useRouter: () => ({ push: () => {} }) }));

const html = (position: string, title: string) =>
  renderToStaticMarkup(<PostCta slug="apple-notes-api" position={position} title={title}><p>Why.</p></PostCta>);

// Emil, 21 Nov 2026: the big picture card under the answer was "like half the screen on first open".
describe("the card under the short answer", () => {
  it("is a compact row with a small picture, for both looks", () => {
    for (const title of ["Want ChatGPT and Claude in your notes?", "Want tables that add up?"]) {
      const h = html("answer", title);
      expect(h).toMatch(/class="[^"]*ctaCompact/);
      expect(h).not.toMatch(/ctaScene|ctaConnect|ai-connect/);
    }
  });

  it("keeps the big picture further down the post", () => {
    expect(html("end", "Want ChatGPT and Claude in your notes?")).toMatch(/ctaConnect/);
    expect(html("end", "Want tables that add up?")).toMatch(/ctaScene/);
  });
});
