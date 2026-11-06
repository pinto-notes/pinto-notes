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

  // A line behind APP_STORE_LIVE is fine: it no longer shows. These forms were always hard-coded.
  it("leaves no post saying it's coming", () => {
    const stale = /\(iPhone coming soon\)|\(the iPhone app is coming soon\)|iPhone soon\)|Mac, iPhone coming soon|only on the Mac for now/;
    const found = [...files("app"), ...files("lib")].filter((f) => stale.test(readFileSync(f, "utf8")));
    expect(found).toEqual([]);
  });
});
