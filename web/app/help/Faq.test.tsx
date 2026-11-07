// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SITE_EVENT } from "@/lib/open-in-app";
import Faq from "./Faq";
import { FAQ } from "./questions";

describe("the help FAQ component", () => {
  it("labels each answer region by its question button and assigns unique ids", () => {
    const html = renderToStaticMarkup(<Faq items={FAQ} />);
    const doc = new DOMParser().parseFromString(html, "text/html");

    const rows = doc.querySelectorAll("[id]");
    const ids = Array.from(rows).map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);

    const regions = doc.querySelectorAll('[role="region"]');
    expect(regions.length).toBe(FAQ.length);

    for (const item of FAQ) {
      const row = doc.getElementById(item.id);
      expect(row).not.toBeNull();

      const button = doc.getElementById(`${item.id}-q`);
      expect(button).not.toBeNull();
      expect(button?.tagName.toLowerCase()).toBe("button");
      expect(button?.getAttribute("aria-controls")).toBe(`${item.id}-a`);

      const region = doc.getElementById(`${item.id}-a`);
      expect(region).not.toBeNull();
      expect(region?.getAttribute("role")).toBe("region");
      expect(region?.getAttribute("aria-labelledby")).toBe(`${item.id}-q`);
    }
  });
});

describe("what the help FAQ counts", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const events: { event: string; properties: Record<string, string> }[] = [];
  const onEvent = (e: Event) => events.push((e as CustomEvent).detail);
  let host: HTMLDivElement, root: Root;

  beforeEach(() => {
    events.length = 0;
    window.addEventListener(SITE_EVENT, onEvent);
    window.history.replaceState(null, "", "/help");
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });
  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    window.removeEventListener(SITE_EVENT, onEvent);
    window.history.replaceState(null, "", "/");
  });

  const click = (el: Element | null | undefined) => act(() => { (el as HTMLElement).click(); });

  it("counts opening a question, not closing it", () => {
    act(() => root.render(<Faq items={FAQ} />));
    const q = FAQ[0].id;
    click(host.querySelector(`#${q}-q`));
    click(host.querySelector(`#${q}-q`));
    expect(events).toEqual([{ event: "help_question_opened", properties: { path: "/help", question: q, how: "click" }, leaves: false }]);
  });

  it("counts a question opened from a link to its anchor", () => {
    window.history.replaceState(null, "", "/help#share");
    act(() => root.render(<Faq items={FAQ} />));
    expect(events).toContainEqual({ event: "help_question_opened", properties: { path: "/help", question: "share", how: "link" }, leaves: false });
  });

  it("asks whether the answer helped, sends the answer once and says thanks", () => {
    act(() => root.render(<Faq items={FAQ} />));
    const q = FAQ[0].id;
    click(host.querySelector(`#${q}-q`));
    const region = host.querySelector(`#${q}-a`)!;
    expect(region.textContent).toContain("Did this answer it?");
    const no = Array.from(region.querySelectorAll("button")).find((b) => b.textContent === "No");
    click(no);
    expect(events.at(-1)).toEqual({ event: "help_answer_rated", properties: { path: "/help", question: q, answer: "no" }, leaves: false });
    expect(region.querySelector('[role="status"]')?.textContent).toContain("Tell me what you were looking for");
    expect(region.querySelector("button")).toBeNull();
  });
});

describe("the help page's support email", () => {
  it("names every support email link, so writing in is counted as the page not helping", async () => {
    const { default: Help } = await import("./page");
    const doc = new DOMParser().parseFromString(renderToStaticMarkup(<Help />), "text/html");
    const mail = Array.from(doc.querySelectorAll('a[href^="mailto:"]'));
    expect(mail.length).toBeGreaterThan(0);
    for (const a of mail) expect(a.getAttribute("data-event")).toBe("help_email_clicked");
  });
});
