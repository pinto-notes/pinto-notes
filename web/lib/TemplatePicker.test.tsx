// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { APPLE_NOTES_TEMPLATES } from "./apple-notes-templates";
import { blocksOf, TemplatePicker } from "./TemplatePicker";

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
