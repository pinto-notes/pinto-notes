import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import sitemap from "../sitemap";
import { quietHeader, themeFor, themeScript } from "@/lib/theme";
import { metadata } from "./layout";

// The home page studies (/lab/*) are for the team: kept out of search, the sitemap and the site's links.
const STUDIES = ["/lab/home-a", "/lab/home-b", "/lab/home-c", "/lab/home-e"];
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
    expect(themeIn("/lab/home-a", false)).toBe("cream");
    expect(themeIn("/lab/home-a", true)).toBe("leaf");
    expect(themeFor("/lab/home-a")).toBe("cream"); // no matchMedia on the server: cream
    expect(themeFor("/labrador")).toBe("cream");
  });

  it("keep study E, the home page candidate, cream in a dark system too, like the home page", () => {
    expect(themeIn("/lab/home-e", false)).toBe("cream");
    expect(themeIn("/lab/home-e", true)).toBe("cream");
    expect(themeIn("/", true)).toBe("cream");
    const g = globalThis as { matchMedia?: unknown };
    const before = g.matchMedia;
    g.matchMedia = () => ({ matches: true });
    try {
      expect(themeFor("/lab/home-e")).toBe("cream");
      expect(themeFor("/lab/home-a")).toBe("leaf");
    } finally {
      g.matchMedia = before;
    }
  });

  it("study E's header drops the version and the stars, and only study E's", () => {
    expect(quietHeader("/lab/home-e")).toBe(true);
    for (const p of ["/", "/lab/home-a", "/lab/home-e/x", "/templates"]) expect(quietHeader(p), p).toBe(false);
    const chrome = readFileSync(join(APP, "SiteChrome.tsx"), "utf8");
    expect(chrome).toMatch(/const lean = quietHeader\(path\);/);
    expect(chrome).toMatch(/\{version && !lean && <span className="site-badge">/);
    expect(chrome).toMatch(/\{!lean && <GitHubLink stars=\{stars\} \/>\}/);
  });
});

/** The theme the pre-paint script picks for a path, with the system in light or dark mode. */
function themeIn(pathname: string, dark: boolean) {
  const document = { documentElement: { dataset: {} as Record<string, string> } };
  const matchMedia = () => ({ matches: dark });
  new Function("location", "document", "matchMedia", themeScript)({ pathname }, document, matchMedia);
  return document.documentElement.dataset.theme;
}

describe("study E", () => {
  it("has no em or en dashes in its words", () => {
    for (const f of ["home-e/page.tsx", "copy.ts"]) {
      const src = readFileSync(join(APP, "lab", f), "utf8");
      const e = f === "copy.ts" ? src.slice(src.indexOf("export const E")) : src;
      expect(e, f).not.toMatch(/[–—]/);
    }
  });
});
