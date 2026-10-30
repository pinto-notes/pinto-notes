import { describe, expect, it } from "vitest";
import { appPagesOnlyRewrites, PINTO_PAGES } from "./app-pages-only";

describe("APP_PAGES_ONLY", () => {
  it("leaves the site as it is unless it's 1", () => {
    expect(appPagesOnlyRewrites(undefined)).toEqual([]);
    expect(appPagesOnlyRewrites("0")).toEqual([]);
  });

  it("hides Pinto Notes' own pages and keeps every page the app and its backend use", () => {
    const hidden = appPagesOnlyRewrites("1").map((r) => r.source);
    expect(hidden).toEqual(PINTO_PAGES);
    for (const page of ["/", "/blog/:path*", "/changelog", "/download/:path*"]) expect(hidden).toContain(page);
    const used = ["/connect", "/open", "/reset-password", "/s", "/n", "/report", "/templates", "/api", "/privacy"];
    for (const page of used) expect(hidden.some((h) => h === page || h.startsWith(page + "/"))).toBe(false);
  });
});
