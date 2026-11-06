import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_STORE_LIVE } from "@/lib/site";

const files = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) && !/\.test\./.test(n) ? [p] : [];
});

describe("the iPhone app is on the App Store", () => {
  it("is switched on", () => expect(APP_STORE_LIVE).toBe(true));

  // It was the disabled "Coming to iPhone" pill: muted text and a faint line read as not clickable.
  it("makes the hero's iPhone button look pressable", () => {
    const rule = readFileSync("app/_home/hero.module.css", "utf8").match(/\.iphone \{[^}]*\}/)?.[0] ?? "";
    expect(rule).toContain("color: #2a1a0c");
    expect(rule).toContain("background: #f3e4d0");
    expect(rule).not.toContain("transparent");
    expect(rule).not.toContain("inset"); // a soft fill, no outline
  });

  // A line behind APP_STORE_LIVE is fine: it no longer shows. These forms were always hard-coded.
  it("leaves no post saying it's coming", () => {
    const stale = /\(iPhone coming soon\)|\(the iPhone app is coming soon\)|iPhone soon\)|Mac, iPhone coming soon|only on the Mac for now/;
    const found = [...files("app"), ...files("lib")].filter((f) => stale.test(readFileSync(f, "utf8")));
    expect(found).toEqual([]);
  });
});
