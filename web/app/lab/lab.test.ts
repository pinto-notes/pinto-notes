import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import sitemap from "../sitemap";
import { themeFor, themeScript } from "@/lib/theme";
import { metadata } from "./layout";

// The home page in progress (/lab/home) is for the team: kept out of search, the sitemap and the site's links.
const STUDIES = ["/lab/home"];
/** Cream in light and dark, like the home page. */
const HOME_CANDIDATES = ["/lab/home"];
const APP = fileURLToPath(new URL("..", import.meta.url));

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === "lab" ? [] : sources(p);
    return /\.(tsx?|md|json)$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });
}

describe("the /lab design studies", () => {
  it("say noindex, nofollow in their metadata", () => {
    expect(metadata.robots).toMatchObject({ index: false, follow: false, googleBot: { index: false, follow: false } });
  });

  it("get the noindex header", async () => {
    const rules = await nextConfig.headers!();
    for (const path of STUDIES) {
      const hit = rules.find((r) => new RegExp(`^${r.source}$`).test(path) && r.headers.some((h) => h.key === "X-Robots-Tag"));
      expect(hit?.headers.find((h) => h.key === "X-Robots-Tag")?.value, path).toBe("noindex, nofollow");
    }
  });

  it("each page sets no robots of its own that would undo the layout's", () => {
    for (const path of STUDIES) {
      const src = readFileSync(join(APP, `${path.slice(1)}/page.tsx`), "utf8");
      expect(src, path).not.toMatch(/robots|pageMetadata|index:\s*true/);
    }
  });

  it("are not in the sitemap", () => {
    expect(sitemap().some((e) => new URL(e.url).pathname.startsWith("/lab"))).toBe(false);
  });

  it("are linked from nowhere else on the site", () => {
    for (const file of sources(APP)) expect(readFileSync(file, "utf8"), file).not.toMatch(/["'`]\/lab\//);
  });

  it("follow the system theme the same way before paint and after", () => {
    expect(themeIn("/lab/other", false)).toBe("cream");
    expect(themeIn("/lab/other", true)).toBe("leaf");
    expect(themeFor("/lab/other")).toBe("cream"); // no matchMedia on the server: cream
    expect(themeFor("/labrador")).toBe("cream");
  });

  it("keep the home page in progress cream in a dark system too, like the home page", () => {
    for (const p of HOME_CANDIDATES) {
      expect(themeIn(p, false), p).toBe("cream");
      expect(themeIn(p, true), p).toBe("cream");
    }
    expect(themeIn("/", true)).toBe("cream");
    expect(themeIn("/lab/other", true)).toBe("leaf"); // only the home page: another study follows the system
    const g = globalThis as { matchMedia?: unknown };
    const before = g.matchMedia;
    g.matchMedia = () => ({ matches: true });
    try {
      for (const p of HOME_CANDIDATES) expect(themeFor(p), p).toBe("cream");
      expect(themeFor("/lab/other")).toBe("leaf");
    } finally {
      g.matchMedia = before;
    }
  });

  it("every page has the same header: no version badge, GitHub as an icon, the stars in the footer", () => {
    const chrome = readFileSync(join(APP, "SiteChrome.tsx"), "utf8");
    expect(chrome).not.toMatch(/site-badge/);
    expect(chrome).toMatch(/<a className="site-gh" href=\{GITHUB\}[^>]*><GitHubGlyph \/><\/a>/);
    expect(chrome).toMatch(/<div className="site-social">\s*<GitHubLink stars=\{stars\} \/>/);
  });
});

/** The theme the pre-paint script picks for a path, with the system in light or dark mode. */
function themeIn(pathname: string, dark: boolean) {
  const document = { documentElement: { dataset: {} as Record<string, string> } };
  const matchMedia = () => ({ matches: dark });
  new Function("location", "document", "matchMedia", themeScript)({ pathname }, document, matchMedia);
  return document.documentElement.dataset.theme;
}

describe("the home page in progress", () => {
  it("has no em or en dashes in its words", () => {
    for (const f of readdirSync(join(APP, "_home")).filter((f) => /\.tsx?$/.test(f) && !/\.test\./.test(f))) {
      expect(readFileSync(join(APP, "_home", f), "utf8"), f).not.toMatch(/[–—]/);
    }
  });
});
