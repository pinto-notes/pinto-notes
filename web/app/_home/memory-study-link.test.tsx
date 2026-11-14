// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { posts } from "@/lib/posts";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: () => {} }) }));
import { Home } from "./Home";

// Emil, 2026-11-12: link the memory study from the home page.
describe("the home page and the memory study", () => {
  it("links the study under the stories, with the numbers the post reports", () => {
    const doc = new DOMParser().parseFromString(renderToStaticMarkup(<Home />), "text/html");
    const link = doc.querySelector('section[aria-labelledby="moments"] a[href="/blog/ai-memory-with-notes"]')!;
    expect(link.textContent).toBe("Read the study");
    expect(link.parentElement!.textContent).toContain("18% right without them, 82.5% with Pinto");
    const post = posts.find((p) => p.slug === "ai-memory-with-notes")!;
    expect(post.draft).toBe(false);
    expect(post.description).toContain("18% right");
    expect(post.description).toContain("82.5%");
  });
});
