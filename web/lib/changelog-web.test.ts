import { describe, expect, it } from "vitest";
import { changelog } from "./changelog";
import { CHANGELOG_WEB, PATCHES, webRelease } from "./changelog-web";

describe("the changelog page's words", () => {
  it("gives each release at most three highlights of eight words or fewer, and one short line per change", () => {
    for (const [v, r] of Object.entries(CHANGELOG_WEB)) {
      expect(r.highlights.length, v).toBeLessThanOrEqual(3);
      for (const h of r.highlights) expect(h.split(/\s+/).length, h).toBeLessThanOrEqual(8);
      for (const i of r.items) expect(i.text.split(/\s+/).length, i.text).toBeLessThanOrEqual(12);
    }
  });

  it("has a line for every change the apps' changelog lists", () => {
    for (const r of changelog()) if (CHANGELOG_WEB[r.version]) expect(CHANGELOG_WEB[r.version].items.length, r.version).toBe(r.items.length);
  });

  it("lists each patch once, under its own minor, and never one newer than the public release", () => {
    expect(new Set(PATCHES.map((p) => p.version)).size).toBe(PATCHES.length);
    const r12 = { version: "1.2", date: "2026-10-08", title: "x", items: ["x"] };
    expect(webRelease(r12, "1.2.26").patches.map((p) => p.version)).not.toContain("1.2.27");
    expect(webRelease(r12, "1.2.26").patches.map((p) => p.version)).toContain("1.2.26");
    expect(webRelease(r12, "1.2.26").patches.every((p) => p.version.startsWith("1.2."))).toBe(true);
  });
});
