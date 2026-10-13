import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/lab/home-d", useRouter: () => ({ push: () => {} }) }));
import HomeD from "./page";
import { chipAt, linesAt, STEPS } from "./HeroNote";
import { D } from "../copy";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, " ");

// The home page study D (/lab/home-d): the plan that gets done.
describe("home study D", () => {
  const html = renderToStaticMarkup(<HomeD />);
  const page = text(html);

  it("says what it is, with one download and the quiet line", () => {
    expect(page).toContain("One notes app for every AI you use.");
    expect(page).toContain("Free. Brings your Apple Notes over.");
    expect(JSON.stringify(D)).not.toMatch(/[–—]/); // the copy; a bullet's dash is the note's own marker
  });

  it("has its sections in order", () => {
    const order = ["Every AI you use, one notebook.", "Plans don't die here.", "Feels like Apple Notes. Brings yours over.", "Wait, it can do that?", "Every change undoable", "Start with the notes you already have."];
    const at = order.map((t) => page.indexOf(t));
    for (const [k, i] of at.entries()) expect(i, order[k]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("credits at most you and two AIs in the margin", () => {
    const who = new Set([...html.matchAll(/data-who="([a-z-]+)"/g)].map((m) => m[1]));
    for (const w of who) expect(["you", "chatgpt", "claude"], w).toContain(w);
  });

  it("labels the iPhone as coming soon, links the templates, and keeps the header quiet", () => {
    expect(page).toContain("iPhone app coming soon");
    expect(html).toContain('href="/templates"');
    expect(html).toContain("data-quiet-nav");
    expect(readFileSync(resolve(__dirname, "../../site.css"), "utf8")).toContain("html:has([data-quiet-nav]) .site-badge, html:has([data-quiet-nav]) .site-stars { display: none; }");
  });

  it("ends on cream, never the dark band", () => {
    expect(html).not.toMatch(/class="[^"]*band/);
    expect(readFileSync(resolve(__dirname, "d.module.css"), "utf8")).not.toMatch(/#2a1d10|#2e180a/);
  });
});

describe("the hero note's one motion", () => {
  const ticked = (step: number) => linesAt(step).filter((l) => l.k === "done").map((l) => l.text);
  it("starts with nothing ticked and no chip", () => {
    expect(ticked(0)).toEqual([]);
    expect(chipAt(0)).toBeNull();
  });
  it("has ChatGPT tick two, tinted, then credits it", () => {
    expect(ticked(2)).toEqual(["Book the van for Saturday", "Cancel the old internet"]);
    expect(linesAt(2).filter((l) => l.tint)).toHaveLength(2);
    expect(chipAt(3)).toEqual({ who: "chatgpt", text: "ChatGPT ticked 2" });
  });
  it("ends with you ticking one, untinted, and saying so", () => {
    const end = STEPS.length;
    expect(ticked(end)).toEqual(["Book the van for Saturday", "Cancel the old internet", "Pack the kitchen"]);
    expect(linesAt(end).find((l) => l.text === "Pack the kitchen")?.tint).toBeFalsy();
    expect(chipAt(end)).toEqual({ who: "you", text: "You ticked 1" });
  });
  it("renders the end state at rest, so reduced motion and no script see the finished plan", () => {
    const html = renderToStaticMarkup(<HomeD />);
    expect(html).toContain("You ticked 1");
  });
});
