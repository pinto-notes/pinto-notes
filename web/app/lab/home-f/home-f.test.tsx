import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/lab/home-f", useRouter: () => ({ push: () => {} }) }));
import HomeF from "./page";
import { F } from "./copy";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ");
const css = readFileSync(resolve(__dirname, "f.module.css"), "utf8");

// The home page study F (/lab/home-f): D's desk and sections, E's week and E's two phones.
describe("home study F", () => {
  const html = renderToStaticMarkup(<HomeF />);
  const page = text(html);

  it("opens on D's desk and note, with the headline and one download", () => {
    expect(page).toContain("One notes app for every AI you use.");
    expect(html).toContain("/home-d/desk.webp");
    expect(page).toContain("You ticked 1"); // the end state at rest: reduced motion and no script see it
    // The hero's and the ending's download (each with the site's notes for iPhone and other platforms), nothing between.
    const between = page.slice(page.indexOf("Moving on the 18th"), page.indexOf("Start with the notes you already have."));
    expect(between).not.toContain("Download for Mac");
  });

  it("has its sections in order, with D's headings and E's week", () => {
    const order = ["Every AI you use, one notebook.", "Plans don't die here.", "Claude moved Thursday", "Feels like Apple Notes. Brings yours over.", "Imported from Apple Notes", "Wait, it can do that?", "Every change undoable", "Start with the notes you already have."];
    const at = order.map((t) => page.indexOf(t));
    for (const [k, i] of at.entries()) expect(i, order[k]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
  });

  it("credits Friday with Undo, and dims what nobody touched on Wednesday and Friday", () => {
    expect(page).toContain("Claude changed 1 line");
    expect(page).toContain("Undo");
    expect(html.match(/data-dim="true"/g)).toHaveLength(2);
    expect(css).toMatch(/\[data-dim\] \[data-k\]:not\(\[data-tint\]\) \{ opacity: 0\.4; \}/);
  });

  it("labels the iPhone as coming soon, never says it is on the App Store, and never mentions iPad", () => {
    expect(page).toContain("iPhone app coming soon");
    expect(page).not.toMatch(/iPad|on your iPhone/);
    for (const m of page.matchAll(/App Store[^.]*\./g)) expect(m[0]).toBe("App Store soon.");
  });

  it("draws the tint behind the phones as a soft band, and drops it on phones", () => {
    const band = css.slice(css.indexOf(".band {"), css.indexOf("}", css.indexOf(".band {")));
    expect(band).toMatch(/mask-image: linear-gradient/);
    expect(band).not.toMatch(/inset/);
    expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*\.band, \.chatPhone \{ display: none; \}/);
  });

  it("links the templates, credits at most you and two AIs, and keeps the one motion in the hero", () => {
    expect(html).toContain('href="/templates"');
    const who = new Set([...html.matchAll(/data-who="([a-z-]+)"/g)].map((m) => m[1]));
    for (const w of who) expect(["you", "chatgpt", "claude"], w).toContain(w);
    expect(readFileSync(resolve(__dirname, "ImportCard.tsx"), "utf8")).not.toMatch(/useEffect|requestAnimationFrame/);
    expect(css).not.toMatch(/animation|transition/);
  });

  it("ends on cream, never the dark band, and its words have no dashes", () => {
    expect(html).not.toMatch(/class="[^"]*\bband\b/);
    expect(JSON.stringify(F)).not.toMatch(/[–—]/);
  });
});
