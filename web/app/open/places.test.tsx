import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { APP_LINK } from "./OpenApp";
import ConnectAI from "./connect-ai/page";
import Import from "./import/page";
import History from "./history/page";

describe("the places the onboarding emails open", () => {
  it.each([
    ["connect-ai", ConnectAI, "Connect an AI", "/blog/connect-chatgpt-to-your-notes"],
    ["import", Import, "Import from Apple Notes", "/blog/move-from-apple-notes"],
    ["history", History, "Version History", null],
  ] as const)("/open/%s tries the app, then says how by hand, with Open in Pinto Notes and the download", (place, Page, step, guide) => {
    const html = renderToStaticMarkup(<Page />);
    expect(html).toContain(`href="pintonotes://${place}"`);
    expect(html).toContain("Open in Pinto Notes");
    expect(html).toContain('href="/download/mac"');
    expect(html).toContain(step);
    if (guide) expect(html).toContain(`href="${guide}"`);
  });

  it("only tries the app's own links", () => {
    for (const ok of ["pintonotes://connect-ai", "pintonotes://import", "pintonotes://history", "pintonotes://template/trip-plan"]) expect(APP_LINK.test(ok)).toBe(true);
    for (const bad of ["pintonotes://connect-ai/x", "https://ambernotes.app/open/history", "javascript:alert(1)", "pintonotes://settings"]) expect(APP_LINK.test(bad)).toBe(false);
  });
});
