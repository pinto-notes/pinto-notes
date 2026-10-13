import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/lab/home-d", useRouter: () => ({ push: () => {} }) }));
import HomeD from "./page";
import { chipAt, linesAt, STEPS as HERO } from "./HeroNote";
import { rowsAt, STEPS } from "./Notebook";
import { DAYS, runsAt } from "./Week";
import { D } from "../copy";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, " ");
const css = readFileSync(resolve(__dirname, "d.module.css"), "utf8");

// The home page study D (/lab/home-d), round 2: each section its own shape, light and dark bands.
describe("home study D", () => {
  const html = renderToStaticMarkup(<HomeD />);
  const page = text(html);

  it("says what it is, with one download and the quiet line, and names Incredible among the AIs", () => {
    expect(page).toContain("One notes app for every AI you use.");
    expect(page).toContain("Free. Brings your Apple Notes over.");
    expect(D.lede).toContain("Incredible");
    expect(JSON.stringify(D)).not.toMatch(/[–—]/);
  });

  it("has its sections in order, ending on the facts", () => {
    const order = ["Every AI you use, one notebook.", "Plans don't die here.", "Feels like Apple Notes. Brings yours over.", "Wait, it can do that?", "Start with the notes you already have.", "Every change undoable"];
    const at = order.map((t) => page.indexOf(t));
    for (const [k, i] of at.entries()) expect(i, order[k]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("cuts what a first-time visitor doesn't need", () => {
    expect(page).not.toContain("Updates install themselves");
    expect(page).toContain("Requires macOS 26.");
    expect(page).not.toContain("any app that supports MCP");
    expect(page.match(/\bFree\b/g)?.length).toBeLessThanOrEqual(2); // the hero's line and the fact
  });

  it("labels the iPhone as coming soon, links the templates, and keeps the header quiet", () => {
    expect(page).toContain("iPhone app coming soon");
    expect(html).toContain('href="/templates"');
    expect(html).toContain("data-quiet-nav");
  });

  it("keeps the page cream and puts the contrast in two leaf brown bands", () => {
    expect(css).toMatch(/\.band \{[^}]*background: #2e180a/);
    expect(html.match(/<section class="[^"]*band/g)).toHaveLength(2);
  });

  it("sets section titles a clear step under the hero's headline, and only the band's line big", () => {
    expect(css).toMatch(/\.title \{[^}]*font-size: clamp\(28px, 3\.3vw, 46px\)/); // 46 of the hero's 80
    expect(css).toMatch(/\.statement \{[^}]*font-size: clamp\(56px/);
  });

  it("gives every fact a paper-cut icon and a moment, and none under Reduce Motion", () => {
    for (const f of ["lock", "box", "tag", "undo"]) expect(html).toContain(`/home-d/facts/${f}.webp`);
    const moments = css.slice(css.indexOf("@media (prefers-reduced-motion: no-preference) {\n  .factFlip"));
    expect(moments).toContain(':hover .scramble');
  });
});

describe("the hero note's one motion", () => {
  const ticked = (step: number) => linesAt(step).filter((l) => l.k === "done").map((l) => l.text);
  it("has ChatGPT tick two, then you one, each credited", () => {
    expect(ticked(2)).toEqual(["Book the van for Saturday", "Cancel the old internet"]);
    expect(chipAt(3)).toEqual({ who: "chatgpt", text: "ChatGPT ticked 2" });
    expect(ticked(HERO.length)).toContain("Pack the kitchen");
    expect(chipAt(HERO.length)).toEqual({ who: "you", text: "You ticked 1" });
  });
});

describe("one notebook, told over time", () => {
  it("adds one change per step, tints only that change, and keeps every line's place", () => {
    for (let s = 0; s < STEPS.length; s++) expect(rowsAt(s)).toHaveLength(rowsAt(STEPS.length - 1).length);
    expect(rowsAt(0).filter((r) => r.in).map((r) => r.key)).toEqual(["goal"]);
    expect(rowsAt(1).filter((r) => r.tint).map((r) => r.key)).toEqual(["h", "hours", "orders"]);
    expect(rowsAt(2).filter((r) => r.tint)).toEqual([]); // your tick is credited, not tinted
    expect(rowsAt(2).find((r) => r.key === "hours")?.k).toBe("done");
    expect(rowsAt(3).filter((r) => r.tint).map((r) => r.text)).toEqual(["Sunday special at the top"]);
    expect(STEPS.map((s) => s.credit)).toEqual(["You wrote the goal", "Claude added 2", "You ticked 1", "ChatGPT added 1 line"]);
  });
  it("rests on the whole story before it plays, so no script and Reduce Motion show the end", () => {
    const html = renderToStaticMarkup(<HomeD />);
    expect(html).toContain("ChatGPT added 1 line");
  });
});

describe("the week, told over time", () => {
  it("ticks two on Wednesday and moves Thursday's run to Sunday on Friday, below Saturday's", () => {
    expect(runsAt(0).filter((r) => r.done)).toEqual([]);
    expect(runsAt(1).filter((r) => r.done).map((r) => r.key)).toEqual(["mon", "wed"]);
    const fri = runsAt(2);
    const thu = fri.find((r) => r.key === "thu")!, sat = fri.find((r) => r.key === "sat")!;
    expect(thu.text).toBe("Sun · 5 km easy, moved from Thursday");
    expect(thu.slot).toBeGreaterThan(sat.slot);
    expect(fri.filter((r) => r.tint).map((r) => r.key)).toEqual(["thu"]);
    expect(DAYS.map((d) => d.credit)).toEqual(["You wrote the plan", "ChatGPT ticked 2", "Claude moved 1"]);
  });
  it("has no orange border on the plan card", () => {
    expect(css).not.toMatch(/\.plan \{[^}]*0 0 0 2px var\(--amber\)/);
  });
});
