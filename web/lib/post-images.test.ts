import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// PostFigure, Capture and FigurePair take a picture's address without an extension and serve
// `${src}.avif` with `${src}.webp` as the fallback. A browser that supports AVIF never falls back,
// so a missing .avif shows a broken image even when the .webp is there (best-notes-app-for-mac,
// 7 November 2026). Every extensionless picture in a page needs both files.
const pages = (dir: URL): URL[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? pages(new URL(`${d.name}/`, dir)) : d.name === "page.tsx" ? [new URL(d.name, dir)] : []);

describe("post pictures", () => {
  it("has an .avif and a .webp for every picture a page names without an extension", () => {
    const missing: string[] = [];
    for (const page of pages(new URL("../app/", import.meta.url))) {
      const src = readFileSync(page, "utf8");
      for (const [, path] of src.matchAll(/\bsrc(?:=|: )"(\/[^"]+)"/g)) {
        if (/\.[a-z0-9]+$/i.test(path)) continue;
        for (const ext of ["avif", "webp"])
          if (!existsSync(new URL(`../public${path}.${ext}`, import.meta.url))) missing.push(`${page.pathname.split("/app/")[1]}: ${path}.${ext}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
