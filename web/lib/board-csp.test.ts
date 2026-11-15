// The whiteboard's content security policies, and that the site sends them where they belong.
import { describe, expect, it } from "vitest";
import { boardCanvasCSP, boardPageCSP } from "./board-csp";

const rules = (csp: string) => Object.fromEntries(csp.split("; ").map((r) => { const [k, ...v] = r.split(" "); return [k, v]; }));

describe("a shared whiteboard's security headers", () => {
  it("the board's page talks to its Supabase project over https and wss, and nowhere else", () => {
    const r = rules(boardPageCSP("https://abc.supabase.co", "https://pintousercontent.com", false));
    expect(r["connect-src"]).toEqual(["'self'", "https://abc.supabase.co", "wss://abc.supabase.co"]);
    expect(r["script-src"]).toEqual(["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"]);
    expect(r["frame-src"]).toEqual(["'self'", "https://pintousercontent.com"]);
    expect(r["frame-ancestors"]).toEqual(["'none'"]);
    expect(r["object-src"]).toEqual(["'none'"]);
  });

  it("on the local stack, plain ws; with no project, nothing extra", () => {
    expect(rules(boardPageCSP("http://127.0.0.1:56421", "x", true))["connect-src"]).toEqual(["'self'", "http://127.0.0.1:56421", "ws://127.0.0.1:56421"]);
    expect(rules(boardPageCSP("", "x", false))["connect-src"]).toEqual(["'self'"]);
  });

  it("the canvas loads only its own files, talks only to this site, and only this site frames it", () => {
    const r = rules(boardCanvasCSP());
    expect(r["script-src"]).toEqual(["'self'"]);
    expect(r["connect-src"]).toEqual(["'self'"]);
    expect(r["frame-ancestors"]).toEqual(["'self'"]);
    expect(r["font-src"]).toEqual(["'self'", "data:", "amber-lib:"]);
    expect(boardCanvasCSP()).not.toMatch(/unsafe-eval|https:/);
  });

  it("the site sends them: the page's on /s/<id>, the canvas's (framed by this site only) on its page", async () => {
    process.env.SUPABASE_URL = "https://abc.supabase.co";
    const config = (await import("../next.config")).default;
    const all = await config.headers!();
    // Next applies every matching rule in order; a later one wins for the same header.
    const final = (path: string) => {
      const out: Record<string, string> = {};
      for (const rule of all) if (new RegExp(`^${rule.source.replace(/:id/g, "[^/]+")}$`).test(path)) for (const h of rule.headers) out[h.key] = h.value;
      return out;
    };
    const page = final("/s/7f0c0e9e-0000-4000-8000-000000000000");
    expect(page["Content-Security-Policy"]).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    const canvas = final("/board/canvas.html");
    expect(canvas["Content-Security-Policy"]).toBe(boardCanvasCSP());
    expect(canvas["X-Frame-Options"]).toBe("SAMEORIGIN");
  });
});
