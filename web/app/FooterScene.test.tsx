// @vitest-environment happy-dom
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import FooterScene from "./FooterScene";

const pub = (src: string) => join(process.cwd(), "public", src);
const srcs = (html: string) => [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);

describe("the footer town", () => {
  it("draws every picture it asks for, at dusk and at night", () => {
    for (const night of [false, true]) {
      const list = srcs(renderToStaticMarkup(<FooterScene night={night} />));
      expect(list.length).toBeGreaterThanOrEqual(6);
      for (const s of list) expect(existsSync(pub(s)), s).toBe(true);
    }
  });

  it("is decoration only: hidden from screen readers, and the lights come from the picture's own pixels", () => {
    const html = renderToStaticMarkup(<FooterScene night={false} />);
    expect(html).toMatch(/^<div[^>]*aria-hidden="true"/);
    // No glows placed by hand over windows (they sat off their windows and covered things).
    expect(html).not.toMatch(/fs-glow|fs-dimmer/);
    expect(html).toContain("a-dusk-windows.webp");
  });

  it("stands at the foot of every page, with the links on its ground and a short credit", () => {
    const chrome = readFileSync(join(process.cwd(), "app", "SiteChrome.tsx"), "utf8");
    expect(chrome.indexOf("<FooterScene")).toBeGreaterThan(-1);
    expect(chrome.indexOf("<FooterScene")).toBeLessThan(chrome.indexOf('className="site-ground"'));
    expect(chrome).not.toMatch(/Formerly/);
    expect(chrome).not.toMatch(/Works with ChatGPT and Claude\. Not affiliated/);
    const css = readFileSync(join(process.cwd(), "app", "site.css"), "utf8");
    // Past the end of the page the browser shows the ground, never cream.
    expect(css).toMatch(/html\.fs-at-ground \{ background: var\(--ground\); \}/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.fs-layer/);
  });
});
