// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const consent = vi.hoisted(() => ({ stored: null as string | null, dnt: false }));
vi.mock("./posthog-client", () => ({ readConsent: () => consent.stored, browserOptedOut: () => consent.dnt, recordChoice: vi.fn() }));

import ConsentBanner, { ASK_AFTER_MS, ASK_AFTER_PX } from "./ConsentBanner";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLElement;
beforeEach(() => {
  vi.useFakeTimers();
  consent.stored = null; consent.dnt = false;
  window.scrollTo(0, 0);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });

const banner = () => host.querySelector(".consent");
const scrollTo = (y: number) => { Object.defineProperty(window, "scrollY", { value: y, configurable: true }); window.dispatchEvent(new Event("scroll")); };

describe("the cookie banner", () => {
  it("never covers the first screen on arrival: it asks once the visitor scrolls past it", () => {
    scrollTo(0);
    act(() => root.render(<ConsentBanner apiKey="k" host="h" />));
    expect(banner()).toBeNull();
    act(() => scrollTo(ASK_AFTER_PX - 10));
    expect(banner()).toBeNull();
    act(() => scrollTo(ASK_AFTER_PX + 10));
    expect(banner()).not.toBeNull();
  });

  it("asks after a while when the visitor doesn't scroll", () => {
    scrollTo(0);
    act(() => root.render(<ConsentBanner apiKey="k" host="h" />));
    act(() => { vi.advanceTimersByTime(ASK_AFTER_MS - 100); });
    expect(banner()).toBeNull();
    act(() => { vi.advanceTimersByTime(200); });
    expect(banner()).not.toBeNull();
  });

  it("doesn't ask a visitor who has already answered", () => {
    consent.stored = "1";
    act(() => root.render(<ConsentBanner apiKey="k" host="h" />));
    act(() => { scrollTo(2000); vi.advanceTimersByTime(ASK_AFTER_MS * 2); });
    expect(banner()).toBeNull();
  });
});
