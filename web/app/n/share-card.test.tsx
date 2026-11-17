import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// A shared note's link unfurls with a picture (Slack, iMessage, X): the page names its own share
// card in og:image and twitter:image, since Next.js drops the site's default when a page sets
// openGraph. The card is drawn per request and goes when the note stops being shared.
const note = { title: "Sharing", body: "Sharing\n\nWorks", updated_at: "2026-11-12T10:00:00Z", include_subnotes: true, is_sub: false, root_title: "Sharing", subnotes: [] };
let shared: typeof note | null = note;
vi.mock("@/lib/shared", async (orig) => ({ ...(await orig<typeof import("@/lib/shared")>()), sharedNote: async () => shared, sharedFiles: async () => ({}) }));

const SLUG = "abcdefghijklmnopqrstuvwx";
beforeEach(() => { shared = note; });

describe("a shared note's share card", () => {
  it("is the page's og:image and twitter:image, for notes and sub-notes", async () => {
    const { generateMetadata } = await import("./[slug]/page");
    const m = await generateMetadata({ params: Promise.resolve({ slug: SLUG }) });
    expect((m.openGraph as { images: { url: string }[] }).images[0].url).toBe(`/og/n/${SLUG}`);
    expect((m.twitter as { card: string; images: { url: string }[] }).images[0].url).toBe(`/og/n/${SLUG}`);
    expect((m.twitter as { card: string }).card).toBe("summary_large_image");
    const sub = await import("./[slug]/[sub]/page");
    const s = await sub.generateMetadata({ params: Promise.resolve({ slug: SLUG, sub: "11111111-1111-1111-1111-111111111111" }) });
    expect((s.openGraph as { images: { url: string }[] }).images[0].url).toBe(`/og/n/${SLUG}/11111111-1111-1111-1111-111111111111`);
  });

  it("draws a PNG, never cached", async () => {
    const { GET } = await import("../og/n/[slug]/route");
    const res = await GET(new Request("http://x"), { params: Promise.resolve({ slug: SLUG }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("is gone once the note isn't shared", async () => {
    shared = null;
    const { GET } = await import("../og/n/[slug]/route");
    expect((await GET(new Request("http://x"), { params: Promise.resolve({ slug: SLUG }) })).status).toBe(404);
  });
});

describe("the shared note page", () => {
  it("doesn't pitch the app, and lines its bar up with the note", async () => {
    const { NotePage } = await import("@/lib/NotePage");
    const html = renderToStaticMarkup(NotePage({ slug: SLUG, note, files: {} }));
    expect(html).not.toContain("Shared from Pinto Notes");
    expect(html).not.toContain("Get Pinto Notes");
    expect(html).toMatch(/class="[^"]*barRow[^"]*noteBar/);
  });
});
