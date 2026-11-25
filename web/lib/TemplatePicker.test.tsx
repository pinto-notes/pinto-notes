// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APPLE_NOTES_TEMPLATES } from "./apple-notes-templates";
import { blocksOf, TemplatePicker } from "./TemplatePicker";
import { MAC_DOWNLOAD_PATH } from "./downloads";
import { APP_STORE_URL } from "./site";

vi.mock("next/navigation", () => ({ usePathname: () => "/blog/apple-notes-templates", useRouter: () => ({ push: () => {} }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TEMPLATES = [
  { title: "Packing list", text: "# Packing list\n\n## Documents\n- [ ] Passport or ID\n- [ ] Tickets" },
  { title: "Meeting notes", text: "# Meeting notes\nDate:\n\n## Agenda\n- First topic\n\n## Action items\n- [ ] Who: what" },
];

let host: HTMLDivElement, root: Root;
beforeEach(() => { host = document.createElement("div"); document.body.append(host); root = createRoot(host); act(() => root.render(<TemplatePicker templates={TEMPLATES} legend="Pick a template" />)); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const panels = () => [...host.firstElementChild!.children].filter((el): el is HTMLElement => el.tagName === "DIV");
const shown = () => panels().filter((p) => p.hidden).length;
const visibleTitle = () => panels().find((p) => !p.hidden)?.querySelector("p")?.textContent;

describe("the template picker", () => {
  it("keeps every template in the page and shows the first", () => {
    expect(host.textContent).toContain("Passport or ID");
    expect(host.textContent).toContain("Who: what");
    expect(shown()).toBe(1);
    expect(visibleTitle()).toBe("Packing list");
  });

  it("shows the template that was picked, and counts the pick", () => {
    const b = [...host.querySelectorAll("button")].find((x) => x.textContent === "Meeting notes")!;
    expect(b.getAttribute("data-event")).toBe("blog_helper_used");
    act(() => b.click());
    expect(b.getAttribute("aria-pressed")).toBe("true");
    expect(visibleTitle()).toBe("Meeting notes");
  });
});

describe("drawing a template the way Notes pastes it", () => {
  it("turns # into a title, ## into headings, - [ ] into a checklist and - into dashes", () => {
    expect(blocksOf(TEMPLATES[1].text)).toEqual([
      { kind: "title", text: "Meeting notes" },
      { kind: "line", text: "Date:" },
      { kind: "heading", text: "Agenda" },
      { kind: "dash", items: ["First topic"] },
      { kind: "heading", text: "Action items" },
      { kind: "tick", items: ["Who: what"] },
    ]);
  });
});

describe("drawing a Markdown table the way Notes pastes it", () => {
  // Paste as Markdown in Notes on macOS 27 makes a real table of it (24 Nov 2026): the header row as a plain first row.
  it("makes one table of the | rows, drops the --- line and keeps the text around it", () => {
    const text = "# Spanish flashcards\n\n| Spanish | English |\n| --- | --- |\n| la tarea | the homework |\n\n## Missed this time\n- [ ] la tarea";
    expect(blocksOf(text)).toEqual([
      { kind: "title", text: "Spanish flashcards" },
      { kind: "table", rows: [["Spanish", "English"], ["la tarea", "the homework"]] },
      { kind: "heading", text: "Missed this time" },
      { kind: "tick", items: ["la tarea"] },
    ]);
  });

  it("draws the table's cells in the picker", () => {
    const h = document.createElement("div"); document.body.append(h); const r = createRoot(h);
    act(() => r.render(<TemplatePicker legend="Pick" templates={[{ title: "Cards", text: "# Cards\n| Q | A |\n| --- | --- |\n| one | two |" }]} />));
    expect([...h.querySelectorAll("td")].map((td) => td.textContent)).toEqual(["Q", "A", "one", "two"]);
    act(() => r.unmount()); h.remove();
  });
});

describe("the Apple Notes templates post", () => {
  // In Notes on macOS 27, Paste as Markdown turns an empty "- [ ]" into the text [ ] and drops an empty "- ".
  it.each(APPLE_NOTES_TEMPLATES.map((t) => [t.title, t.text]))("%s has words in every list item", (_, text) => {
    for (const line of text.split("\n")) if (line.startsWith("- ")) expect(line.replace(/^- (\[ \] )?/, "").trim(), line).not.toBe("");
  });
});

describe("a template's Pinto Notes line", () => {
  it("links to the Pinto template that does the same job, counted as the post's call to action", () => {
    const h = document.createElement("div"); document.body.append(h); const r = createRoot(h);
    act(() => r.render(<TemplatePicker post="apple-notes-templates" legend="Pick" templates={[
      { title: "Groceries by aisle", text: "# Groceries\n- [ ] Milk", pinto: { slug: "grocery-list", name: "grocery list", rest: "sorted by aisle." } },
      { title: "Daily plan", text: "# Today\n- [ ] One thing" },
    ]} />));
    const a = h.querySelector("a")!;
    expect(a.getAttribute("href")).toBe("/templates/grocery-list");
    expect(a.textContent).toBe("grocery list template");
    expect(a.getAttribute("data-cta")).toBe("apple-notes-templates");
    expect(a.getAttribute("data-cta-position")).toBe("template");
    expect(h.querySelectorAll("a")).toHaveLength(1);
    act(() => r.unmount()); h.remove();
  });

  it("names a real template for every Apple Notes template that has one", async () => {
    const { template } = await import("./templates");
    for (const t of APPLE_NOTES_TEMPLATES) if (t.pinto) expect(template(t.pinto.slug), t.pinto.slug).toBeDefined();
  });
});

// Experiment B42 (25 Nov 2026): on the templates post the Pinto side follows the pick. Each template's twin sits under the
// paste steps with a download, and nothing in the picker leads to a template page, whose Use template fails without the app
// (4 of the 6 readers who went on to /templates from this post got "not found", 1 to 24 Nov).
describe("a template's Pinto Notes twin", () => {
  const twin = (label: string, template: string) => ({ label, line: `${label} line.`, apple: "Holds it.", alt: `${label} picture.`,
    phone: { src: `/blog/side-by-side/${template}-pinto-phone`, width: 780, height: 1600 }, desk: { src: `/blog/side-by-side/${template}-pinto-mac`, width: 1520, height: 1200 } });
  const withTwins = [
    { title: "Groceries by aisle", text: "# Groceries\n- [ ] Milk", pinto: { slug: "grocery-list", name: "grocery list", rest: "sorted.", twin: twin("The grocery list template in Pinto Notes", "grocery-list") } },
    { title: "Packing list", text: "# Packing list\n- [ ] Passport", pinto: { slug: "trip-plan", name: "trip plan", rest: "with days.", twin: twin("The same packing list in Pinto Notes", "packing") } },
  ];

  it("shows the picked template's twin only, and follows the pick", () => {
    const h = document.createElement("div"); document.body.append(h); const r = createRoot(h);
    act(() => r.render(<TemplatePicker post="apple-notes-templates" legend="Pick" templates={withTwins} start={1} />));
    const figures = () => [...h.querySelectorAll("figure")];
    const visible = () => figures().filter((f) => !f.hidden).map((f) => f.getAttribute("aria-label"));
    expect(figures()).toHaveLength(2);
    expect(visible()).toEqual(["The same packing list in Pinto Notes"]);
    act(() => { h.querySelector<HTMLButtonElement>("fieldset button")!.click(); });
    expect(visible()).toEqual(["The grocery list template in Pinto Notes"]);
    act(() => r.unmount()); h.remove();
  });

  it("downloads Pinto Notes, counted as the post's picker click naming the template, and never opens a template page", () => {
    const h = document.createElement("div"); document.body.append(h); const r = createRoot(h);
    act(() => r.render(<TemplatePicker post="apple-notes-templates" legend="Pick" templates={withTwins} />));
    const links = [...h.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([MAC_DOWNLOAD_PATH, APP_STORE_URL, "/download", MAC_DOWNLOAD_PATH, APP_STORE_URL, "/download"]);
    for (const a of links) {
      expect(a.getAttribute("href")).not.toMatch(/^\/templates|^\/open\//);
      expect(a.getAttribute("data-cta")).toBe("apple-notes-templates");
      expect(a.getAttribute("data-cta-position")).toBe("picker");
      expect(a.textContent).toBe("Get Pinto Notes, free");
    }
    expect(links.slice(0, 3).map((a) => a.getAttribute("data-cta-template"))).toEqual(["grocery-list", "grocery-list", "grocery-list"]);
    expect(links.slice(0, 3).map((a) => a.getAttribute("data-cta-action"))).toEqual(["download_mac", "app_store", "download_page"]);
    expect(h.textContent).toContain("In Apple Notes: Holds it.");
    act(() => r.unmount()); h.remove();
  });

  it("keeps the plain link where a post gives no twin", () => {
    const h = document.createElement("div"); document.body.append(h); const r = createRoot(h);
    act(() => r.render(<TemplatePicker legend="Pick" templates={withTwins} />));
    expect(h.querySelectorAll("figure")).toHaveLength(0);
    act(() => r.unmount()); h.remove();
  });

  it("gives every template on the templates post a twin of a real Pinto template, with its pictures at their own sizes", async () => {
    const { template } = await import("./templates");
    const { existsSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const size = (file: string) => {
      const b = readFileSync(file);
      const kind = b.toString("ascii", 12, 16);
      if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      if (kind === "VP8L") { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
      return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    };
    for (const t of APPLE_NOTES_TEMPLATES) {
      const tw = t.pinto?.twin;
      expect(tw, t.title).toBeDefined();
      expect(template(t.pinto!.slug), t.pinto!.slug).toBeDefined();
      for (const img of [tw!.phone, tw!.desk]) {
        for (const ext of ["webp", "avif"]) expect(existsSync(join(process.cwd(), "public", `${img.src}.${ext}`)), `${img.src}.${ext}`).toBe(true);
        expect(size(join(process.cwd(), "public", `${img.src}.webp`)), img.src).toEqual([img.width, img.height]);
      }
      // House rules for the words: no dashes, ChatGPT and Claude named only in headings, no "I".
      for (const words of [tw!.label, tw!.line, tw!.apple, tw!.alt]) {
        expect(words, t.title).not.toMatch(/[–—]|\b(ChatGPT|Claude|iPad)\b|\bI\b/);
      }
    }
  });
});
