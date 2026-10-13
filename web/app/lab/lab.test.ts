import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import sitemap from "../sitemap";
import { themeFor, themeScript } from "@/lib/theme";
import { metadata } from "./layout";

// The home page studies (/lab/*) are for the team: kept out of search, the sitemap and the site's links.
const STUDIES = ["/lab/home-a", "/lab/home-b", "/lab/home-c", "/lab/home-d"];
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
    const run = (dark: boolean) => {
      const document = { documentElement: { dataset: {} as Record<string, string> } };
      const matchMedia = () => ({ matches: dark });
      new Function("location", "document", "matchMedia", themeScript)({ pathname: "/lab/home-a" }, document, matchMedia);
      return document.documentElement.dataset.theme;
    };
    expect(run(false)).toBe("cream");
    expect(run(true)).toBe("leaf");
    expect(themeFor("/lab/home-a")).toBe("cream"); // no matchMedia on the server: cream
    expect(themeFor("/labrador")).toBe("cream");
  });

  it("keep the home page study cream, as the home page is, in light and dark", () => {
    const run = (dark: boolean) => {
      const document = { documentElement: { dataset: {} as Record<string, string> } };
      new Function("location", "document", "matchMedia", themeScript)({ pathname: "/lab/home-d" }, document, () => ({ matches: dark }));
      return document.documentElement.dataset.theme;
    };
    expect(run(false)).toBe("cream");
    expect(run(true)).toBe("cream");
    expect(themeFor("/lab/home-d")).toBe("cream");
  });
});
