// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import path from "node:path";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LiveExpenses } from "./LiveExpenses";
import { CATEGORIES, START, amountOf, iso, noteText } from "./live-expenses";
import { SITE_EVENT } from "./open-in-app";
import { clickEvents, type SiteEvent } from "./posthog";

vi.mock("next/navigation", () => ({ usePathname: () => "/blog/apple-notes-expense-tracker", useRouter: () => ({ push: () => {} }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const SLUG = "apple-notes-expense-tracker";
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
  act(() => createRoot(host).render(<LiveExpenses slug={SLUG} />));
});
afterEach(() => {
  window.removeEventListener(SITE_EVENT, listen);
  document.body.innerHTML = "";
  delete document.documentElement.dataset.platform;
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const text = (id: string) => host.querySelector(`[data-testid=${id}]`)?.textContent ?? "";
const input = (label: string) => host.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)!;
// React listens for input events; setting the value through the prototype's setter is what a keystroke does.
const type = (label: string, value: string) => act(() => {
  const el = input(label);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
});
const pick = (c: string) => act(() => { [...host.querySelectorAll<HTMLButtonElement>("[role=radio]")].find((b) => b.textContent === c)!.click(); });
const addButton = () => [...host.querySelectorAll<HTMLButtonElement>("button[type=submit]")].find((b) => b.textContent === "Add")!;
const add = () => act(() => { addButton().click(); });
const drop = (what: string) => act(() => { host.querySelector<HTMLButtonElement>(`button[aria-label="Delete ${what}"]`)!.click(); });
const byCategory = () => [...host.querySelectorAll("[data-testid=live-by] > div")].map((r) => [...r.children].map((c) => c.textContent).join(" "));
const copyButton = () => [...host.querySelectorAll("button")].find((b) => b.dataset.ctaAction === "copy")!;
const copy = async () => { await act(async () => { copyButton().click(); }); };

describe("the live expense log in the expense tracker post", () => {
  it("opens on the Apple Notes template's six expenses and their totals, already in the page's HTML", () => {
    expect(text("live-spent")).toBe("1,179 spent");
    expect(byCategory()).toEqual(["Groceries 650", "Transport 85", "Dining 230", "Household 64", "Fun 150"]);
    expect(text("live-list")).toMatch(/^Sunday 8 NovemberCinemaFun150/);
    const html = renderToStaticMarkup(<LiveExpenses slug={SLUG} />);
    expect(html).toContain(">1,179 spent<");
    expect(html).toContain("Pizza with friends");
  });

  it("adds an expense once and the total and its category add it up, dated today and listed first", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 27, 9));
    expect(addButton().disabled).toBe(true);
    type("Amount", "4,50");
    type("What", "Coffee");
    pick("Dining");
    expect(host.querySelector("[role=radio][aria-checked=true]")!.textContent).toBe("Dining");
    add();
    expect(text("live-spent")).toBe("1,183.5 spent");
    expect(byCategory()).toContain("Dining 234.5");
    expect(text("live-list")).toMatch(/^Friday 27 NovemberCoffeeDining4\.5/);
    expect(input("Amount").value).toBe("");
    expect(input("What").value).toBe("");
  });

  it("names an expense by its category when What is left empty, and starts Other when it's picked", () => {
    type("Amount", "12");
    pick("Other");
    add();
    expect(byCategory()).toContain("Other 12");
    expect(host.querySelector('button[aria-label="Delete Other"]')).not.toBeNull();
  });

  it("keeps Add off until the amount is a number above nothing", () => {
    for (const bad of ["", "0", "-5", "abc"]) {
      type("Amount", bad);
      expect(addButton().disabled, bad).toBe(true);
    }
    expect([amountOf("12.345"), amountOf(" 7 "), amountOf("1e400")]).toEqual([12.35, 7, null]);
  });

  it("deletes an expense and takes it off its category, and says what to do when the log is empty", () => {
    drop("Cinema");
    expect(text("live-spent")).toBe("1,029 spent");
    expect(byCategory().some((r) => r.startsWith("Fun"))).toBe(false);
    for (const w of ["Weekly shop", "Weekly shop", "Bus card", "Pizza with friends", "Light bulbs"]) drop(w);
    expect(text("live-list")).toBe("Your log is empty. Add an expense above.");
    expect(byCategory()).toEqual([]);
    expect(copyButton().disabled).toBe(true);
  });

  it("copies the reader's own log in the template's Math Results form, with no = on the total line", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 27, 9));
    type("Amount", "18");
    type("What", "Taxi\thome = late");
    pick("Transport");
    add();
    document.documentElement.dataset.platform = "ios";
    await copy();
    expect(clipboard).toEqual([[
      "Expenses, November", "", "Date\tWhat\tCategory\tAmount",
      "1 Nov\tWeekly shop\tGroceries\t412", "2 Nov\tBus card\tTransport\t85", "3 Nov\tPizza with friends\tDining\t230",
      "5 Nov\tLight bulbs\tHousehold\t64", "6 Nov\tWeekly shop\tGroceries\t238", "8 Nov\tCinema\tFun\t150", "27 Nov\tTaxi home late\tTransport\t18",
      "", "Groceries = 412 + 238", "Transport = 85 + 18", "Dining = 230", "Household = 64", "Fun = 150",
      "", "Groceries + Transport + Dining + Household + Fun", "",
    ].join("\n")]);
    expect(text("live-after")).toBe("Paste into a new note in Apple Notes, then type = at the end of the last line to show the total.");
  });

  it("gives the Mac steps on a Mac, the Table button and the =", async () => {
    document.documentElement.dataset.platform = "mac";
    await copy();
    expect(text("live-after")).toBe("Paste into a new note. Select the lines from Date down and press the Table button (Format, Table). Then type = at the end of the last line.");
    type("Amount", "3");
    add();
    expect(text("live-after")).toBe("");
  });

  it("copies the same log as the post's own Apple Notes template, from the same six expenses", () => {
    const post = readFileSync(path.join(WEB, "app/blog/apple-notes-expense-tracker/page.tsx"), "utf8");
    const template = /const TEMPLATE = `([\s\S]*?)`;/.exec(post)?.[1] ?? "";
    expect(noteText(START)).toBe(template.replace(/\\t/g, "\t"));
  });

  it("sends blog_live_template_edited once, on the first change, naming only the page and the template", () => {
    pick("Fun");
    expect(sent).toEqual([]);
    type("Amount", "9");
    add();
    drop("Cinema");
    expect(sent).toEqual([{ event: "blog_live_template_edited", properties: { path: "/", slug: SLUG, template: "budget-log" }, leaves: false }]);
  });

  it("keeps what the reader types in the page: no request, no cookie, nothing stored", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const cookie = document.cookie;
    type("Amount", "40");
    type("What", "Dentist");
    add();
    drop("Cinema");
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

  it("puts Keep it straight under the add form, on a phone's first screen, and the copy after the log", () => {
    const order = [addButton(), host.querySelector("[data-cta-action=app_store]"), host.querySelector("[data-testid=live-list]"), copyButton()];
    for (let n = 1; n < order.length; n++) expect(order[n - 1]!.compareDocumentPosition(order[n]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the copy plain: no dashes, no first person, no iPad, no AI named", () => {
    expect(host.textContent).not.toMatch(/[–—]|\bI\b|iPad|Incredible|ChatGPT|Claude/);
    for (const f of ["lib/LiveExpenses.tsx", "lib/live-expenses.ts"]) expect(readFileSync(path.join(WEB, f), "utf8")).not.toMatch(/[–—]|iPad/);
  });
});

describe("the port of the template app", () => {
  const app = readFileSync(path.join(WEB, "content/templates/budget-log.app/src/lib/budget.ts"), "utf8");
  const ours = readFileSync(path.join(WEB, "lib/live-expenses.ts"), "utf8");

  it("dates and writes amounts exactly as the app does", () => {
    const line = (src: string, start: string) => src.split("\n").find((l) => l.startsWith(start));
    for (const start of ["export const iso = ", "const num = ", "export const money = ", "  const s = num.format(", "  return /^[$€£]$/.test(currency)"]) {
      expect(line(ours, start), start).toBeDefined();
      expect(line(ours, start), start).toBe(line(app, start));
    }
    expect(iso(new Date(2026, 10, 1))).toBe("2026-11-01");
  });

  it("starts from the Apple Notes template's categories, each one word so Math Results can name it", () => {
    const post = readFileSync(path.join(WEB, "app/blog/apple-notes-expense-tracker/page.tsx"), "utf8");
    for (const c of CATEGORIES.filter((c) => c !== "Other")) expect(post).toContain(`\n${c} = `);
    for (const c of CATEGORIES) expect(c).toMatch(/^[A-Z][a-z]+$/);
  });
});
