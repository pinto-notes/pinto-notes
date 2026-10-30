import { describe, expect, it } from "vitest";
import { appPagesOnlyEnv, appPagesOnlyRewrites, PINTO_PAGES } from "./app-pages-only";

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

  it("points the app's links at the site's own address, with no setting of their own", () => {
    expect(appPagesOnlyEnv({})).toEqual({});
    expect(appPagesOnlyEnv({ VERCEL_PROJECT_PRODUCTION_URL: "pintonotes.com" })).toEqual({});
    expect(appPagesOnlyEnv({ APP_PAGES_ONLY: "1", VERCEL_PROJECT_PRODUCTION_URL: "kim-notes.vercel.app" }))
      .toEqual({ NEXT_PUBLIC_APP_LINK_ORIGIN: "https://kim-notes.vercel.app" });
    expect(appPagesOnlyEnv({ APP_PAGES_ONLY: "1", SITE_URL: "https://notes.kim.dev/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" }))
      .toEqual({ NEXT_PUBLIC_APP_LINK_ORIGIN: "https://notes.kim.dev" });
    expect(appPagesOnlyEnv({ APP_PAGES_ONLY: "1", NEXT_PUBLIC_APP_LINK_ORIGIN: "https://a.example", VERCEL_PROJECT_PRODUCTION_URL: "b" })).toEqual({});
  });
});
