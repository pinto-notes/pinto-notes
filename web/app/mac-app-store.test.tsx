// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

let pathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname, useRouter: () => ({ push: () => {} }) }));
import DownloadLink, { DirectDownloadLink, MacAppStoreBadge } from "./DownloadLink";
import { Download } from "./_home/Download";
import { Hero } from "./_home/Hero";
import { MAC_APP_STORE_URL } from "@/lib/site";

const doc = (el: React.ReactElement) => new DOMParser().parseFromString(`<!doctype html><body>${renderToStaticMarkup(el)}</body>`, "text/html");
const pub = (p: string) => resolve(__dirname, "..", "public", p);

// 2026-11-12: the Mac App Store is the main way to get Pinto Notes on the Mac; the download stays a link away.
describe("the Mac App Store first", () => {
  it("goes to the app's Mac page on the App Store, in a new tab", () => {
    expect(MAC_APP_STORE_URL).toBe("https://apps.apple.com/app/id6817253103?platform=mac");
    const a = doc(<DownloadLink>Get it on the Mac App Store</DownloadLink>).querySelector("a")!;
    expect(a.getAttribute("href")).toBe(MAC_APP_STORE_URL);
    expect(a.getAttribute("target")).toBe("_blank");
    expect(a.getAttribute("rel")).toBe("noopener noreferrer");
    expect(a.hasAttribute("download")).toBe(false);
  });

  it("uses Apple's own badge, unchanged and at least 40 px tall", () => {
    const img = doc(<MacAppStoreBadge />).querySelector("a img")!;
    expect(img.getAttribute("src")).toBe("/badges/mac-app-store-black.svg");
    expect(img.getAttribute("alt")).toBe("Download on the Mac App Store");
    expect(Number(img.getAttribute("height"))).toBeGreaterThanOrEqual(40);
    // Its own proportions (Apple's artwork is 156.1 by 40).
    expect(Number(img.getAttribute("width")) / Number(img.getAttribute("height"))).toBeCloseTo(156.1 / 40, 1);
    for (const colour of ["black", "white"]) {
      const svg = readFileSync(pub(`badges/mac-app-store-${colour}.svg`), "utf8");
      expect(svg).toContain('viewBox="0 0 156.10054 40"');
      expect(svg).not.toMatch(/<script|on\w+=/i);
    }
  });

  it("puts one small link to the direct download under the badge", () => {
    pathname = "/";
    const d = doc(<Download />);
    const links = [...d.querySelectorAll(".pi-apple a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([MAC_APP_STORE_URL, "/download"]);
    expect(links[1].textContent).toBe("or download it directly");
  });

  it("starts the download itself from the download page", () => {
    pathname = "/download";
    const a = doc(<DirectDownloadLink />).querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/download/mac");
    expect(a.getAttribute("download")).toBe("Pinto-Notes.dmg");
    pathname = "/";
    expect(doc(<DirectDownloadLink />).querySelector("a")!.getAttribute("href")).toBe("/download");
  });

  it("leads the home hero with the badge, beside the iPhone button", () => {
    pathname = "/";
    const html = renderToStaticMarkup(<Hero />);
    expect(html).toContain('alt="Download on the Mac App Store"');
    expect(html).toContain("or download it directly");
    expect(html).not.toContain('href="/download/mac"');
    // The badge keeps a quarter of its height clear beside the next button (50 px tall: 12.5 px).
    const css = readFileSync(resolve(__dirname, "_home", "hero.module.css"), "utf8");
    const gap = Number(/\.ctas \{[^}]*gap: (\d+)px/.exec(css)?.[1]);
    expect(gap).toBeGreaterThanOrEqual(50 / 4);
  });

  it("tells the Mac download the store version is live (public/mac-app-store.json, read at launch)", () => {
    expect(JSON.parse(readFileSync(pub("mac-app-store.json"), "utf8"))).toEqual({ live: true });
  });

  it("never sends a Mac button to the file any more, outside blog posts", () => {
    const files = ["SiteChrome.tsx", "MobileMenu.tsx", "PlatformNote.tsx", "_home/Download.tsx", "_home/Hero.tsx", "download/page.tsx", "s/[id]/NoteLink.tsx", "open/PlaceCard.tsx"];
    for (const f of files) {
      const src = readFileSync(resolve(__dirname, f), "utf8");
      expect(src, f).not.toMatch(/href=("\/download\/mac"|\{MAC_DOWNLOAD_PATH\})/);
      expect(src, f).not.toMatch(/>\s*Download for Mac\s*<\/DownloadLink>/);
    }
  });
});
