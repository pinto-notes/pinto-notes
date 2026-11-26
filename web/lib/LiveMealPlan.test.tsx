// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveMealPlan } from "./LiveMealPlan";
import { DISHES, START_WEEK, groceryList, noteText, plannedMonday } from "./live-meal-plan";
import { SITE_EVENT } from "./open-in-app";
import { clickEvents, type SiteEvent } from "./posthog";

vi.mock("next/navigation", () => ({ usePathname: () => "/blog/apple-notes-meal-planner-template", useRouter: () => ({ push: () => {} }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const SLUG = "apple-notes-meal-planner-template";
const WEB = process.cwd();

let host: HTMLDivElement;
let sent: SiteEvent[];
let clipboard: string[];
const listen = (e: Event) => sent.push((e as CustomEvent<SiteEvent>).detail);
beforeEach(() => {
  sent = [];
  clipboard = [];
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (t: string) => { clipboard.push(t); } } });
  window.addEventListener(SITE_EVENT, listen);
  host = document.createElement("div");
  document.body.append(host);
  act(() => createRoot(host).render(<LiveMealPlan slug={SLUG} />));
});
afterEach(() => {
  window.removeEventListener(SITE_EVENT, listen);
  document.body.innerHTML = "";
  delete document.documentElement.dataset.platform;
  vi.restoreAllMocks();
});

const dish = (name: string) => host.querySelector<HTMLButtonElement>(`button[data-dish="${name}"]`)!;
// The name a screen reader reads: the label and, once it's on the week, its day (the short day on screen is hidden from it).
const named = (name: string) => [...dish(name).childNodes].filter((n) => (n as Element).getAttribute?.("aria-hidden") !== "true").map((n) => n.textContent).join("");
const tap = (name: string) => act(() => { dish(name).click(); });
const text = (id: string) => host.querySelector(`[data-testid=${id}]`)?.textContent ?? "";
const list = () => text("live-list");
const copyButton = () => [...host.querySelectorAll("button")].find((b) => b.dataset.ctaAction === "copy")!;
const copy = async () => { await act(async () => { copyButton().click(); }); };

describe("the live meal plan in the meal planner post", () => {
  it("opens on the Apple Notes template's first four dinners and their list, already in the page's HTML", () => {
    expect(text("live-planned")).toBe("4 of 7");
    expect(text("live-count")).toBe("9 to buy");
    expect(list()).toContain("Lemons");
    expect(list()).toContain("Tortillas");
    expect(text("live-left-out")).toBe("Left off, already in the cupboard: Rice, Pasta, Onions");
    expect(named("Lemon chicken")).toBe("Lemon chicken, Monday");
    const html = renderToStaticMarkup(<LiveMealPlan slug={SLUG} />);
    expect(html).toContain(">9 to buy<");
    expect(html).toContain("Coconut milk");
  });

  it("builds the list as dinners are tapped: one line for a thing two dinners share, the cupboard left off", () => {
    tap("Pizza");
    expect(text("live-planned")).toBe("5 of 7");
    expect(named("Pizza")).toBe("Pizza, Friday");
    expect(text("live-count")).toBe("11 to buy");
    expect(list()).toContain("Basil · 2 dinners");
    expect(list().match(/Basil/g)).toHaveLength(1);
    tap("Spaghetti");
    expect(list()).toContain("Ground beef");
    expect(text("live-left-out")).toBe("Left off, already in the cupboard: Rice, Pasta, Onions");
  });

  it("takes a dinner off when it's tapped again, and its day goes to the next dinner tapped", () => {
    tap("Tomato pasta");
    expect(text("live-planned")).toBe("3 of 7");
    expect(list()).not.toContain("Basil");
    tap("Omelet");
    expect(named("Omelet")).toBe("Omelet, Tuesday");
  });

  it("says when the week is full, and says what to start from when it's empty", () => {
    for (const d of ["Pizza", "Roast chicken", "Omelet"]) tap(d);
    expect(text("live-planned")).toBe("7 of 7");
    tap("Stir fry");
    expect(dish("Stir fry").getAttribute("aria-pressed")).toBe("false");
    expect(host.textContent).toContain("Your seven days are full. Remove a dinner to add another.");
    for (const d of ["Lemon chicken", "Tomato pasta", "Fish tacos", "Chickpea curry", "Pizza", "Roast chicken", "Omelet"]) tap(d);
    expect(list()).toBe("Pick a dinner to start your grocery list.");
    expect(copyButton().disabled).toBe(true);
  });

  it("copies the week for Apple Notes as plain lines on an iPhone, and says to tap the checklist button", async () => {
    document.documentElement.dataset.platform = "ios";
    await copy();
    expect(clipboard).toHaveLength(1);
    expect(clipboard[0]).not.toMatch(/^#|- \[ \]|^- /m);
    expect(clipboard[0]).toMatch(/^Dinners, week of \d{1,2} [A-Z][a-z]+\n\nDinners\nMonday: lemon chicken with rice\n/);
    expect(clipboard[0]).toContain("\n\nFruit and veg\nLemons\nCherry tomatoes\n");
    expect(clipboard[0]).toContain("\n\nAlways in the cupboard\nRice, Pasta, Onions\n");
    expect(text("live-after")).toBe("Paste in Notes, select the grocery lines, then tap the checklist button.");
  });

  it("copies Markdown elsewhere, for Edit, Paste as Markdown on a Mac", async () => {
    document.documentElement.dataset.platform = "mac";
    await copy();
    expect(clipboard[0]).toMatch(/^# Dinners, week of /);
    expect(clipboard[0]).toContain("## Dinners\n- Monday: lemon chicken with rice\n- Tuesday: pasta with tomato and basil\n");
    expect(clipboard[0]).toContain("## Meat and fish\n- [ ] Chicken thighs\n- [ ] White fish\n");
    expect(text("live-after")).toBe("In Notes, choose Edit, then Paste as Markdown.");
  });

  it("sends blog_live_template_edited once, on the first tap, naming only the page and the template", () => {
    expect(sent).toEqual([]);
    tap("Pizza");
    tap("Fish tacos");
    expect(sent).toEqual([{ event: "blog_live_template_edited", properties: { path: "/", slug: SLUG, template: "meal-plan" }, leaves: false }]);
  });

  it("keeps the reader's picks in the page: no request, no cookie, nothing stored", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const cookie = document.cookie;
    tap("Pizza");
    tap("Fish tacos");
    await copy();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.cookie).toBe(cookie);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("counts Keep it and the copy as the post's call to action at position live", () => {
    const links = [...host.querySelectorAll("a")];
    expect(links.map((a) => a.dataset.ctaAction).sort()).toEqual(["app_store", "download_mac", "send_link"]);
    for (const el of [...links, copyButton()]) {
      expect(el.dataset.cta).toBe(SLUG);
      expect(el.dataset.ctaPosition).toBe("live");
    }
    const here = new URL(`https://pintonotes.com/blog/${SLUG}`);
    const ios = links.find((a) => a.dataset.ctaAction === "app_store")!;
    expect(ios.textContent).toBe("Keep it in Pinto Notes");
    expect(clickEvents(ios, here).map((e) => [e.event, e.properties.position ?? ""])).toEqual([["blog_cta_clicked", "live"], ["outbound_app_store_clicked", ""]]);
    expect(clickEvents(copyButton(), here).map((e) => [e.event, e.properties.action ?? ""])).toEqual([["blog_cta_clicked", "copy"], ["blog_copy_clicked", ""]]);
  });

  it("puts Keep it straight under the dinners, on a phone's first screen, and the copy for Apple Notes after the list", () => {
    const order = [host.querySelector("[data-dish]"), host.querySelector("[data-cta-action=app_store]"), host.querySelector("[data-testid=live-list]"), copyButton()];
    for (let n = 1; n < order.length; n++) expect(order[n - 1]!.compareDocumentPosition(order[n]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the copy plain: no dashes, no first person, no iPad, no AI named", () => {
    expect(host.textContent).not.toMatch(/[–—]|\bI\b|iPad|Incredible|ChatGPT|Claude/);
    const src = readFileSync(path.join(WEB, "lib/LiveMealPlan.tsx"), "utf8");
    expect(src).not.toMatch(/[–—]/);
  });
});

describe("the port of the template app", () => {
  const app = readFileSync(path.join(WEB, "content/templates/meal-plan.app/src/lib/meals.ts"), "utf8");
  const ours = readFileSync(path.join(WEB, "lib/live-meal-plan.ts"), "utf8");
  const blockOf = (src: string, start: string) => { const i = src.indexOf(start); expect(i, start).toBeGreaterThanOrEqual(0); return src.slice(i, src.indexOf("\n}\n", i) + 2); };

  it("names things exactly as the app does, and uses its aisles and cupboard", () => {
    expect(blockOf(ours, "export function itemKey(")).toBe(blockOf(app, "export function itemKey("));
    const data = JSON.parse(readFileSync(path.join(WEB, "content/templates/meal-plan.app/data.json"), "utf8")).values;
    expect(ours).toContain(`export const AISLES = ${JSON.stringify(data.aisles).replace(/,/g, ", ")};`);
    expect(ours).toContain(`export const CUPBOARD = ${JSON.stringify(data.cupboard).replace(/,/g, ", ")};`);
  });

  it("starts from the Apple Notes template's dinners, and every ingredient goes in one of the app's aisles", () => {
    const post = readFileSync(path.join(WEB, "app/blog/apple-notes-meal-planner-template/page.tsx"), "utf8");
    for (const id of START_WEEK.filter(Boolean)) {
      const d = DISHES.find((x) => x.id === id)!;
      expect(post.toLowerCase()).toContain(d.dish.toLowerCase());
    }
    const all = groceryList(DISHES.slice(0, 7).map((d) => d.id));
    expect(all.aisles.every((a) => a.name !== "Other")).toBe(true);
  });

  it("plans this week on a weekday and the coming week at the weekend, as the app opens", () => {
    expect(plannedMonday(new Date(2026, 10, 26)).getDate()).toBe(23); // Thursday
    expect(plannedMonday(new Date(2026, 10, 29)).getDate()).toBe(30); // Sunday
    expect(noteText(START_WEEK, new Date(2026, 10, 30), "plain").split("\n")[0]).toBe("Dinners, week of 30 November");
  });
});
