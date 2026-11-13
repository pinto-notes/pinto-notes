import { describe, expect, it } from "vitest";
import config from "../next.config";
import { sourceLinkRedirects } from "./source-links";

describe("source links", () => {
  it("send each short address to the home page with its utm tags", () => {
    const redirects = sourceLinkRedirects();
    expect(redirects).toContainEqual({ source: "/ig", destination: "/?utm_source=instagram&utm_medium=bio", permanent: false });
    expect(redirects).toContainEqual({ source: "/tt", destination: "/?utm_source=tiktok&utm_medium=bio", permanent: false });
    for (const r of redirects) expect(r.destination).toMatch(/^\/\?utm_source=[a-z]+&utm_medium=[a-z]+$/);
  });

  it("are in the site's redirects", async () => {
    const all = await config.redirects!();
    for (const r of sourceLinkRedirects()) expect(all).toContainEqual(r);
  });
});
