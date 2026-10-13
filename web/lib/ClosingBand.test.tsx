// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BAND_FINE, ClosingBand } from "./ClosingBand";

vi.mock("next/navigation", () => ({ usePathname: () => "/help", useRouter: () => ({ push: () => {} }) }));

const doc = (el: React.ReactElement) => new DOMParser().parseFromString(`<!doctype html><body>${renderToStaticMarkup(el)}</body>`, "text/html");

describe("the closing band", () => {
  it("has one title, the Mac download, and one line of fine print", () => {
    const d = doc(<ClosingBand title="Same notes, new name." />);
    expect(d.querySelectorAll("h2").length).toBe(1);
    expect(d.querySelector('a[href="/download/mac"]')?.textContent).toBe("Download for Mac");
    const fine = [...d.querySelectorAll("p")].filter((p) => p.textContent === BAND_FINE);
    expect(fine.length).toBe(1);
  });

  it("never says no ads in its fine print, and never draws the iPhone app as a button that does nothing", () => {
    expect(BAND_FINE).not.toMatch(/no ads/i);
    const html = renderToStaticMarkup(<ClosingBand title="x" />);
    expect(html).not.toMatch(/<span[^>]*>iPhone · coming soon<\/span>/);
  });

  it("takes a page's own primary in place of the download", () => {
    const d = doc(<ClosingBand title="Still stuck?" primary={{ href: "mailto:hello@pintonotes.com", label: "Email me" }} fine={null} />);
    expect(d.querySelector('a[href="/download/mac"]')).toBeNull();
    expect(d.querySelector('a[href^="mailto:"]')?.textContent).toBe("Email me");
  });

  it("is on every page the audit listed", () => {
    const pages = ["download/page.tsx", "help/page.tsx", "changelog/page.tsx", "privacy-security/page.tsx", "amber-notes/page.tsx", "templates/page.tsx"];
    for (const p of pages) expect(readFileSync(join(process.cwd(), "app", p), "utf8"), p).toContain("<ClosingBand");
    expect(readFileSync(join(process.cwd(), "lib/Landing.tsx"), "utf8")).toContain("<ClosingBand");
  });
});
