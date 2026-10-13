// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

// The real Vercel component, mounted in a document: its loader <script> goes into the page on /,
// and never on the private pages.
const nav = vi.hoisted(() => ({ path: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => nav.path, useParams: () => ({}), useSearchParams: () => new URLSearchParams() }));

import SiteAnalytics from "./SiteAnalytics";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const loaders = () => [...document.querySelectorAll("script")].filter((s) => /script\.js/.test(s.getAttribute("src") ?? "") || s.dataset.sdkn?.includes("analytics"));

async function mount(path: string) {
  nav.path = path;
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => root.render(<SiteAnalytics />));
  return () => act(() => root.unmount());
}

afterEach(() => { document.head.innerHTML = ""; document.body.innerHTML = ""; });

describe("Vercel's loader script", () => {
  it("is added on /", async () => {
    const done = await mount("/");
    expect(loaders().length).toBeGreaterThan(0);
    await done();
  });

  it.each(["/n/abc123", "/n/abc123/sub", "/connect", "/open/connect", "/open/template/standup", "/open/copy/abc123", "/report/abc123"])("is never added on %s", async (path) => {
    const done = await mount(path);
    expect(loaders()).toHaveLength(0);
    await done();
  });
});

describe("the internal mark", () => {
  afterEach(() => { localStorage.clear(); history.replaceState(null, "", "/"); });

  it("is kept by ?internal=1 and cleared by ?internal=0", async () => {
    history.replaceState(null, "", "/blog?internal=1");
    let done = await mount("/blog");
    expect(localStorage.getItem("pinto_internal")).toBe("1");
    await done();
    history.replaceState(null, "", "/?internal=0");
    done = await mount("/");
    expect(localStorage.getItem("pinto_internal")).toBeNull();
    await done();
  });

  it("is never set from a page PostHog doesn't run on", async () => {
    history.replaceState(null, "", "/n/abc123?internal=1");
    const done = await mount("/n/abc123");
    expect(localStorage.getItem("pinto_internal")).toBeNull();
    await done();
  });

  it("isn't set by an ordinary visit", async () => {
    const done = await mount("/");
    expect(localStorage.length).toBe(0);
    await done();
  });
});
