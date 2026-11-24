// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveBudget } from "./LiveBudget";
import { SITE_EVENT } from "./open-in-app";
import { clickEvents, type SiteEvent } from "./posthog";

vi.mock("next/navigation", () => ({ usePathname: () => "/blog/apple-notes-budget-template", useRouter: () => ({ push: () => {} }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const SLUG = "apple-notes-budget-template";
const WEB = process.cwd();

let host: HTMLDivElement;
let sent: SiteEvent[];
const listen = (e: Event) => sent.push((e as CustomEvent<SiteEvent>).detail);
beforeEach(() => {
  sent = [];
  window.addEventListener(SITE_EVENT, listen);
  host = document.createElement("div");
  document.body.append(host);
  act(() => createRoot(host).render(<LiveBudget slug={SLUG} />));
});
afterEach(() => { window.removeEventListener(SITE_EVENT, listen); document.body.innerHTML = ""; vi.restoreAllMocks(); });

const field = (label: string) => host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
const type = (label: string, value: string) => act(() => {
  const el = field(label);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
const click = (label: string) => act(() => { host.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click(); });
const left = () => host.querySelector("[data-testid=live-left]")!.textContent;
const line = () => host.querySelector("[data-testid=live-line]")!.textContent;

describe("the live budget in the budget post", () => {
  it("opens on the Apple Notes template's own numbers, already in the page's HTML", () => {
    expect(left()).toBe("750");
    expect(line()).toBe("2,450 planned of 3,200 income");
    const html = renderToStaticMarkup(<LiveBudget slug={SLUG} />);
    expect(html).toContain(">750<");
    expect(html).toContain('value="1200"');
  });

  it("shows what's left as the reader changes an amount or their income", () => {
    type("Rent a month", "1350");
    expect(left()).toBe("600");
    expect(line()).toBe("2,600 planned of 3,200 income");
    type("Income a month", "3,500");
    expect(left()).toBe("900");
  });

  it("counts a category the reader adds and drops one they remove", () => {
    click("Remove Fun");
    expect(left()).toBe("900");
    type("New category", "Gym");
    type("New category a month", "40");
    act(() => { host.querySelector<HTMLButtonElement>('button[aria-label="Add category"]')!.click(); });
    expect(field("Gym a month").value).toBe("40");
    expect(left()).toBe("860");
  });

  it("says when the plan is over the income, and shows the currency the reader types", () => {
    type("Income a month", "2000");
    expect(host.textContent).toContain("Over your income");
    expect(left()).toBe("450");
    expect(host.querySelector("[data-testid=live-left]")!.hasAttribute("data-over")).toBe(true);
    type("Currency", "$");
    expect(left()).toBe("$450");
    type("Income a month", "");
    expect(line()).toBe("Put in your income to see what's left.");
  });

  it("sends blog_live_template_edited once, on the first change, naming only the page and the template", () => {
    expect(sent).toEqual([]);
    type("Food a month", "500");
    type("Food a month", "520");
    click("Remove Phone");
    expect(sent).toEqual([{ event: "blog_live_template_edited", properties: { path: "/", slug: SLUG, template: "budget-log" }, leaves: false }]);
  });

  it("keeps what the reader types in the page: no request, no cookie, nothing stored", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const cookie = document.cookie;
    type("Income a month", "4100");
    type("Rent a month", "1500");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.cookie).toBe(cookie);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("counts every Keep it link as the post's call to action at position live", () => {
    const links = [...host.querySelectorAll("a")];
    expect(links.map((a) => a.dataset.ctaAction).sort()).toEqual(["app_store", "download_mac", "send_link"]);
    for (const a of links) {
      expect(a.dataset.cta).toBe(SLUG);
      expect(a.dataset.ctaPosition).toBe("live");
    }
    const mac = links.find((a) => a.dataset.ctaAction === "download_mac")!;
    expect(mac.textContent).toBe("Keep it in Pinto Notes");
    const events = clickEvents(mac, new URL(`https://pintonotes.com/blog/${SLUG}`));
    expect(events.map((e) => [e.event, e.properties.position ?? ""])).toEqual([["blog_cta_clicked", "live"], ["download_mac_clicked", ""]]);
  });

  it("says plainly that the numbers stay on the page", () => {
    expect(host.textContent).toContain("Your numbers stay on this page and aren't sent anywhere, so in the app you type them in once.");
  });
});

describe("the port of the template app", () => {
  // lib/live-budget.ts copies the app's money and number word for word; this keeps them the same.
  const app = (file: string) => readFileSync(path.join(WEB, "content/templates/budget-log.app/src", file), "utf8");
  const ours = readFileSync(path.join(WEB, "lib/live-budget.ts"), "utf8");
  const at = (src: string, start: string) => { const i = src.indexOf(start); expect(i, start).toBeGreaterThanOrEqual(0); return i; };
  const lineOf = (src: string, start: string) => { const i = at(src, start); return src.slice(i, src.indexOf("\n", i)).replace(/^export /, ""); };
  const blockOf = (src: string, start: string) => { const i = at(src, start); return src.slice(i, src.indexOf("\n}\n", i) + 2).replace(/^export /, ""); };

  it("formats money and reads amounts exactly as the app does", () => {
    expect(lineOf(ours, "const num = ")).toBe(lineOf(app("lib/budget.ts"), "const num = "));
    expect(blockOf(ours, "export const money = ")).toBe(blockOf(app("lib/budget.ts"), "export const money = "));
    expect(lineOf(ours, "export const number = ")).toBe(lineOf(app("screens/setup.tsx"), "const number = "));
  });
});
