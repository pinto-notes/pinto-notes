import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

// The email click redirect asks the website's telemetry gate (lib/telemetry-gate.ts) before it
// tells the lifecycle function about a click; the reader is sent on either way.
describe("/go", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const go = (headers: Record<string, string> = {}) =>
    GET(new Request("https://pintonotes.com/go?s=1&t=tok&to=https%3A%2F%2Fpintonotes.com%2Fhelp", { headers }));

  it("counts the click for a visitor who didn't say no", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const res = await go();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(302);
  });

  it("counts nothing for a visitor who rejected, or sends Global Privacy Control or Do Not Track", async () => {
    vi.stubEnv("SUPABASE_URL", "https://project.supabase.co");
    const fetch = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    for (const headers of [{ cookie: "pinto_no_analytics=1" }, { "sec-gpc": "1" }, { dnt: "1" }] as Record<string, string>[]) {
      const res = await go(headers);
      expect(res.status).toBe(302);
    }
    expect(fetch).not.toHaveBeenCalled();
  });
});
