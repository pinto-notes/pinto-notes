import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import config, { BLOG_SOURCES } from "../next.config";

// lib/blog.tsx reads each post's page.tsx and the data files posts import (readingMinutes). On Vercel a server render
// only sees files in the function bundle, so every blog route must include them: on 25 Oct 2026 the tracker's
// entries.ts was missing and every page with a tracker card returned 500 to Google.
const root = path.join(__dirname, "..");
const posts = readdirSync(path.join(root, "app/blog"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && readdirSync(path.join(root, "app/blog", d.name)).includes("page.tsx"))
  .map((d) => `./app/blog/${d.name}/page.tsx`);
const dataFiles = [...new Set(posts.flatMap((p) =>
  [...readFileSync(path.join(root, p), "utf8").matchAll(/from "@\/lib\/([\w/]+\/entries)"/g)].map(([, f]) => `./lib/${f}.ts`)))];

describe("blog files in the server bundle", () => {
  it("finds the tracker's data file among what posts import", () => {
    expect(dataFiles).toContain("./lib/tracker/entries.ts");
  });

  it("includes every post source and data file for the index and every route under /blog", () => {
    const includes = config.outputFileTracingIncludes ?? {};
    for (const route of ["/blog", "/blog/**"]) {
      const globs = includes[route] ?? [];
      for (const file of [...posts, ...dataFiles]) expect(globs.some((g) => path.matchesGlob(file, g)), `${route}: ${file}`).toBe(true);
    }
    expect(BLOG_SOURCES.length).toBeGreaterThan(0);
  });
});
