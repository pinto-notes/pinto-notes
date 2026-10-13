// @vitest-environment happy-dom
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import AppSwap, { SWAP_DELAY_MS } from "./AppSwap";
import Card from "./Card";
import { templates } from "@/lib/templates";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); document.body.innerHTML = ""; });

let seen: (hit: boolean) => void = () => {};
const stage = (reduce: boolean) => {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce") && reduce }));
  vi.stubGlobal("IntersectionObserver", class { constructor(cb: (e: { isIntersecting: boolean }[]) => void) { seen = (hit) => cb([{ isIntersecting: hit }]); } observe() {} disconnect() {} });
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<AppSwap slug="habit-tracker" title="Habit tracker"><span>table</span></AppSwap>));
  return () => host.querySelector("[data-app]") !== null;
};

describe("an app template's card", () => {
  it("shows the table, then the app about 600 ms after it's half in view (and its picture is decoded), once", async () => {
    HTMLImageElement.prototype.decode = () => Promise.resolve();
    vi.useFakeTimers();
    const app = stage(false);
    expect(app()).toBe(false);
    act(() => seen(true));
    act(() => { vi.advanceTimersByTime(SWAP_DELAY_MS - 50); });
    expect(app()).toBe(false);
    await act(async () => { vi.advanceTimersByTime(100); await Promise.resolve(); await Promise.resolve(); });
    expect(app()).toBe(true);
  });

  it("shows the app straight away with Reduce Motion", () => {
    expect(stage(true)()).toBe(true);
  });

  it("is used for the four app templates only, with iPhone pictures in light and dark", () => {
    for (const t of templates()) {
      const html = renderToStaticMarkup(<Card t={t} />);
      expect(html.includes("/templates/apps/phone/"), t.slug).toBe(!!t.app);
      if (t.app) for (const m of ["light", "dark"]) expect(existsSync(resolve(__dirname, `../../public/templates/apps/phone/${t.slug}-${m}.webp`)), `${t.slug} ${m}`).toBe(true);
    }
    expect(templates().filter((t) => t.app).map((t) => t.slug).sort()).toEqual(["budget-log", "habit-tracker", "study-flashcards", "trip-plan"]);
  });

  it("keeps the app's height from the start, so the swap moves nothing", () => {
    const css = readFileSync(resolve(__dirname, "templates.module.css"), "utf8");
    expect(css).toMatch(/\.swap \{[^}]*min-height: 196px/);
    expect(css).toMatch(/\.swapTable, \.appScreen \{ grid-area: 1 \/ 1/);
  });
});

describe("every template card's note slice", () => {
  it("has lines to show, the app templates included", () => {
    for (const t of templates()) expect(renderToStaticMarkup(<Card t={t} />), t.slug).toMatch(/class="[^"]*slice(Line|Table|H)/);
  });
});
