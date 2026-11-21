import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Emil, 21 Nov 2026: "we just don't have an author on the blog posts at all, I'm not really writing them anyway".
describe("blog posts show no author", () => {
  for (const f of ["PostPage.tsx", "i18n/LocalPostPage.tsx", "blog.tsx", "BlogIndex.tsx"]) {
    it(`${f} names no author and shows no avatar`, () => {
      const src = readFileSync(join(__dirname, f), "utf8");
      expect(src).not.toMatch(/AUTHOR\.name|<Avatar|rel="author"|Written by/);
    });
  }
});
