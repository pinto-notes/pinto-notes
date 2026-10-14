// @vitest-environment happy-dom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Post from "../app/blog/connect-chatgpt-to-your-notes/page";
import Short from "../app/blog/apple-notes-tables/page";
import { CATEGORY_COVERS, categories } from "./posts";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("next/navigation", () => ({ usePathname: () => "/blog/x", useRouter: () => ({ push: () => {} }) }));

const doc = (el: React.ReactElement) => new DOMParser().parseFromString(`<!doctype html><body>${renderToStaticMarkup(el)}</body>`, "text/html");

// The blog post template after the site audit of 13 October 2026: a cover at the top, share under the
// byline, three posts to read next instead of every title, and the dark band at the end.
describe("a blog post", () => {
  const d = doc(<Post />);

  it("opens with its category's cover under the title and byline, and shares from the byline", () => {
    const cover = d.querySelector('img[src^="/art/blog-"]');
    expect(cover).not.toBeNull();
    expect(d.querySelectorAll('[aria-label="Share this post"] a').length).toBe(3);
    expect(d.body.textContent).not.toContain("Share this post");
  });

  it("ends with three posts to read next and the dark band, not a list of every post", () => {
    expect(d.body.textContent).not.toContain("All posts");
    expect(d.querySelectorAll('#more-posts ~ ul > li, [aria-labelledby="more-posts"] li').length).toBe(3);
    expect(d.querySelector("[data-closing-band] h2")?.textContent).toBe("Let your AI write in your notes.");
  });

  it("drops the short answer's orange label, and the jump links on a short post", () => {
    expect(d.body.textContent).not.toMatch(/The short answer/);
    const short = doc(<Short />);
    expect(short.querySelector("[data-short]")).not.toBeNull();
  });

  it("has a cover for every category, on disk", () => {
    for (const c of categories()) expect(existsSync(join(process.cwd(), "public", CATEGORY_COVERS[c].src)), c).toBe(true);
  });

  it("keeps the intro and the short answer together, before the rest of the text, so they stay on the first screen", () => {
    const top = d.querySelector("[data-short], article > div:nth-of-type(2)");
    expect(top?.textContent).toContain("ChatGPT can't edit Apple Notes");
    const css = readFileSync(join(process.cwd(), "lib/post.module.css"), "utf8");
    // Wide screens: the cover beside the title block. Phones: the cover after the short answer.
    expect(css).toMatch(/\.col > \.coverRow \{ grid-column: 2; grid-row: 1;/);
    expect(css).toMatch(/\.col > \.coverRow \{ order: 1; \}/);
  });
});

describe("the image-led post format's parts", () => {
  it("draws a crop as a framed figure that may break out wide, a cutout without a frame, and menu paths as quiet chips", async () => {
    const { PostFigure, FigurePair, MenuPath } = await import("./PostParts");
    const crop = doc(<PostFigure src="/x" width={1400} height={800} alt="a" caption="c" />);
    expect(crop.querySelector("figure")?.getAttribute("data-kind")).toBe("crop");
    expect(crop.querySelector("figure")?.className).toMatch(/wide/);
    const cut = doc(<PostFigure src="/x" width={500} height={300} alt="a" caption="c" kind="cutout" />);
    expect(cut.querySelector("figure")?.className).not.toMatch(/wide/);
    expect(doc(<FigurePair items={[{ src: "/a", width: 10, height: 10, alt: "a" }, { src: "/b", width: 10, height: 10, alt: "b" }]} caption="c" />).querySelectorAll("img").length).toBe(2);
    expect(doc(<MenuPath steps={["Notes", "View", "Show Tables"]} />).querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("Notes, then View, then Show Tables");
    const css = readFileSync(join(process.cwd(), "lib/post-parts.module.css"), "utf8");
    expect(css).not.toMatch(/\.step > span \{[^}]*box-shadow/);
    expect(css).not.toMatch(/\.path kbd \{[^}]*monospace/);
  });
});
