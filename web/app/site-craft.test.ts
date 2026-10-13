import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The site-wide states from docs/DESIGN.md: chips and buttons are fills, never strokes; every link in
// the header has a hover and a press; the header frosts once the page scrolls under it.
const css = (f: string) => readFileSync(resolve(__dirname, f), "utf8");
const rule = (src: string, selector: string) => {
  const at = src.indexOf(`${selector} {`);
  return at < 0 ? "" : src.slice(at, src.indexOf("}", at));
};

describe("the site's controls", () => {
  it("draws chips with no outline at rest, and a soft pill on hover", () => {
    for (const [file, chip] of [["templates/templates.module.css", ".chip"], ["blog/blog.module.css", ".filters a"]]) {
      const src = css(file);
      expect(rule(src, chip), file).not.toMatch(/box-shadow|border:\s*1px/);
      expect(src, file).toContain(`${chip}::before { content: ""`);
      expect(src, file).toMatch(new RegExp(`${chip.replace(/[.]/g, "\\.")}(:not\\([^)]*\\))?:hover::before \\{ opacity: 1; \\}`));
    }
  });

  it("gives the header's links a hover fill and a press", () => {
    const site = css("site.css");
    expect(site).toMatch(/\.site-nav a:not\(\.site-cta\):hover \{ background: color-mix/);
    expect(site).toMatch(/\.site-nav a:active \{ transform: scale\(0\.97\); \}/);
  });

  it("keeps the header in view and frosts it once the page scrolls", () => {
    const site = css("site.css");
    const header = rule(site, ".site-header");
    expect(header).toMatch(/position: sticky; top: 0/);
    expect(rule(site, ".site-header[data-scrolled]")).toMatch(/backdrop-filter: saturate\(180%\) blur\(2[4-9]px|30px/);
    // The frost is the header's own: an isolated header, or the blur on a layer inside it, blurs nothing.
    expect(header).not.toMatch(/isolation|filter|opacity/);
    expect(site).not.toMatch(/\.site-header::before/);
    expect(css("SiteChrome.tsx")).toContain('toggleAttribute("data-scrolled"');
  });

  it("draws the cookie banner's buttons as fills", () => {
    expect(rule(css("site.css"), ".consent-button")).toMatch(/border: 0/);
  });

  // The site audit of 13 October 2026, "fix once, lift many pages".
  it("marks the current page in the header one way on every width: ink, no underline, no ring", () => {
    const site = css("site.css");
    expect(site).not.toMatch(/aria-current="page"\]::after/);
    expect(site).not.toMatch(/site-cta\[aria-current="page"\] \{ box-shadow/);
  });

  it("steps the header's Download aside on a page whose hero is the download, so one primary is in view", () => {
    expect(css("site.css")).toContain("html:has([data-hero-download]) .site-nav a.site-cta { display: none; }");
    expect(css("download/page.tsx")).toContain("data-hero-download");
  });

  it("gives the download page's button a hover, and help's cards a fill on hover instead of a ring", () => {
    expect(css("download/download.module.css")).toMatch(/\.button:hover \{ background: color-mix/);
    const faq = css("help/faq.module.css");
    expect(faq).not.toMatch(/\.contact a:hover \{ box-shadow/);
  });

  it("draws Sign in with Google and the connect page's second buttons as fills, and disabled as warm grey", () => {
    const connect = css("connect/connect.module.css");
    expect(rule(connect, ".google")).not.toMatch(/inset 0 0 0 1px/);
    expect(connect).not.toMatch(/\.secondary \{[^}]*inset 0 0 0 1\.5px/);
    expect(connect).not.toMatch(/\.primary:disabled, \.secondary:disabled \{ cursor: default; opacity/);
  });

  it("puts the blog's and the templates' chips in one sideways-scrolling row on phones", () => {
    expect(css("blog/blog.module.css")).toMatch(/@media \(max-width: 600px\) \{\s*\.filters \{\s*flex-wrap: nowrap; overflow-x: auto/);
    expect(css("templates/templates.module.css")).toMatch(/\.filterRow \{\s*flex-wrap: nowrap; overflow-x: auto/);
  });

  it("plays the download page's install as one story, and drops the lines under it", () => {
    const page = css("download/page.tsx");
    expect(page).toContain("<StoryPlayer");
    expect(page).not.toMatch(/Updates install themselves|Syncs with your iPhone/);
    expect(page).toContain("/art/download.webp");
  });
});
