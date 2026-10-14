import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/lab/home-g", useRouter: () => ({ push: () => {} }) }));
import HomeG, { metadata } from "./page";
import { NOTE, SHEET } from "./Control";
import { rowsComplete, STEPS as NB } from "../home-d/Notebook";
import { G } from "../copy";
import { themeFor } from "@/lib/theme";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ");
const ROOT = resolve(__dirname, "../../../..");

const render = async (alt?: string) => renderToStaticMarkup(await HomeG({ searchParams: Promise.resolve(alt ? { alt } : {}) }));

describe("home study G, the joint homepage", async () => {
  const html = await render();
  const page = text(html);

  it("keeps what must survive: with your OK and the four control facts (the connect steps went at Emil's call)", () => {
    expect(page).toContain("with your OK");
    expect(page).toContain(SHEET.title); // you approve each AI
    expect(page).toMatch(/Undo takes it back/);
    expect(page).toContain("Encrypted on your Mac before it syncs.");
    expect(page).toContain("Open source, so anyone can check.");
  });

  it("has its sections in order, light and dark: cream, cream, dark, cream, tint, cream, dark", () => {
    const order = ["Every AI you use, one notebook.", "Plans don't die here.", "Wait, it can do that?", "Feels like Apple Notes. Brings yours over.", "You decide what your AI can touch.", "Start with the notes you already have."];
    const at = order.map((t) => page.indexOf(t));
    for (const [k, i] of at.entries()) expect(i, order[k]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(html.match(/<section class="[^"]*band/g)).toHaveLength(2);
    expect(readFileSync(resolve(__dirname, "g.module.css"), "utf8")).toMatch(/\.tint \{[^}]*background: #f7e5cc/);
  });

  it("drops the facts tiles and the Free tag", () => {
    expect(html).not.toContain("/home-d/facts/tag.webp");
    expect(page).not.toMatch(/connector directory/i);
  });

  it("takes the sheet's words from the app", () => {
    const swift = readFileSync(resolve(ROOT, "Pane/Views/ConnectAI.swift"), "utf8");
    expect(swift).toContain('"Allow \\(r.who) to use your notes?"');
    for (const w of [SHEET.edit, SHEET.read, SHEET.editLine, "Locked notes stay private.", "Don\\u{2019}t Allow"]) expect(swift, w).toContain(w);
  });

  it("shows the approval as one still picture: the sheet with Read and edit chosen, then the note with ChatGPT's line tinted and Undo", () => {
    const six = html.slice(html.indexOf('aria-labelledby="control"'), html.indexOf('aria-labelledby="closing"'));
    expect(text(six)).toContain(SHEET.title);
    expect(six).toMatch(/<i data-on="">Read and edit<\/i>/);
    expect(NOTE.filter((r) => r.tint).map((r) => r.text)).toEqual(["Book the table at Trindade for 19:00"]);
    expect(text(six)).toContain("ChatGPT added 1 line");
    expect(six).not.toContain('role="group"'); // no scrubber
  });

  it("keeps the notebook complete at every step: only the tint, the marks and the chip move", () => {
    for (let k = 0; k < NB.length; k++) {
      const rows = rowsComplete(k);
      expect(rows.every((r) => r.in), `step ${k}`).toBe(true);
      expect(rows.map((r) => r.text)).toEqual(rowsComplete(0).map((r) => r.text));
    }
    expect(rowsComplete(3).filter((r) => r.tint).map((r) => r.text)).toEqual(["Sunday special at the top"]);
    expect(rowsComplete(1).filter((r) => r.tint).map((r) => r.key)).toEqual(["h", "hours", "orders"]);
  });

  it("closes as D round 2 did: the icon, the line, Download and one line of small print", () => {
    const seven = text(html.slice(html.indexOf('aria-labelledby="closing"')));
    expect(seven).toContain("Requires macOS 26. iPhone app coming soon.");
    for (const gone of ["Import your Apple Notes", "Works with ChatGPT", "awesome-mac", "Open source (MIT)"]) expect(seven, gone).not.toContain(gone);
  });

  it("is cream in light and dark, quiet in its header, and has the title and description", () => {
    expect(themeFor("/lab/home-g")).toBe("cream");
    expect(html).toContain("data-quiet-nav");
    expect(metadata.title).toBe("Pinto Notes: the notes app ChatGPT and Claude can use");
    expect(existsSync(resolve(__dirname, "../home-d/page.tsx"))).toBe(true);
  });
});

describe("home study G, the final changes", async () => {
  const html = await render(), alt = await render("art");
  it("shows the phone and the import card in section 5, and the picture only in the ?alt=art version", () => {
    const five = (h: string) => h.slice(h.indexOf('aria-labelledby="feel"'), h.indexOf('aria-labelledby="control"'));
    expect(five(html)).not.toContain("/home-d/bring");
    expect(five(html)).toContain("iPhone app coming soon");
    expect(five(alt)).toContain("/home-d/bring");
    expect(text(five(alt))).toContain("Mac today, iPhone app coming soon.");
    expect(five(alt)).not.toContain("Groceries");
    // Only section 5 differs.
    const rest = (h: string) => h.replace(/aria-labelledby="feel"[\s\S]*?aria-labelledby="control"/, "");
    expect(rest(alt)).toBe(rest(html));
  });
  it("gives the fanned cards short lines", () => {
    for (const l of ["Days, bookings, packing.", "Spending against your budget.", "A few small habits, on your schedule."]) expect(text(html)).toContain(l);
  });
  it("ends the hero on the AI: you tick first, ChatGPT last, and it rests on ChatGPT's chip", async () => {
    const { linesAt, chipAt, STEPS: H } = await import("../home-d/HeroNote");
    expect(chipAt(1, "ai-last")).toEqual({ who: "you", text: "You ticked 1" });
    expect(linesAt(1, "ai-last").filter((l) => l.k === "done").map((l) => l.text)).toEqual(["Pack the kitchen"]);
    expect(chipAt(H.length, "ai-last")).toEqual({ who: "chatgpt", text: "ChatGPT ticked 2" });
    expect(text(html)).toContain("ChatGPT ticked 2");
    expect(chipAt(H.length)).toEqual({ who: "you", text: "You ticked 1" }); // home-d keeps its order
  });
});

describe("home study G's first screen", () => {
  const css = readFileSync(resolve(__dirname, "g.module.css"), "utf8");
  it("ends on section 2's note, never its headline: the hero fills to just above the fold, and the note comes before the title", () => {
    expect(css).toMatch(/\.heroFold \{ min-height: calc\(100svh - 84px - 150px\)/);
    expect(css).toMatch(/\.noteFirst > :first-child \{ order: 2;/);
  });
});
