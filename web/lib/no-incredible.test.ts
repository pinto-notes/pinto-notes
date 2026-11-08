import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Emil, 2026-11-08: the site never mentions Incredible. The one exception is the name the
// sign-in page shows for an app that connects and calls itself "incredible" (lib/connect.ts).
const ROOT = resolve(__dirname, "..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return n === "node_modules" ? [] : files(p);
    return /\.(tsx?|json|md|mdx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });

describe("the site", () => {
  it("doesn't mention Incredible on any page, in structured data or in llms.txt", () => {
    const hits = ["app", "lib", "content"].flatMap((d) => files(join(ROOT, d)))
      .filter((p) => !p.endsWith("lib/connect.ts"))
      .filter((p) => /incredible/i.test(readFileSync(p, "utf8")));
    expect(hits).toEqual([]);
  });
});
