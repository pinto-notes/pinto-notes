import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import grounds from "./covers/grounds.json";
import { published } from "@/lib/posts";

// Every post's share card (app/og/blog) draws its cover on the cover's own colour. A cover added
// without its JPEG copy or its colour would get a cream card: run node scripts/og-grounds.mjs.
describe("blog share cards", () => {
  it("have a JPEG copy and a sampled colour for every published post's cover", () => {
    for (const p of published()) {
      const name = p.thumb.src.replace(/^\/blog\/(covers\/)?/, "").replace(/\.webp$/, "");
      expect(existsSync(`lib/og/covers/covers/${name}.jpg`), `${p.slug}: lib/og/covers/covers/${name}.jpg`).toBe(true);
      expect((grounds as Record<string, unknown>)[name], `${p.slug}: ${name} in grounds.json (node scripts/og-grounds.mjs)`).toBeDefined();
    }
  });
});
