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
});
