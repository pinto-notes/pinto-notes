import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/lab/home-g", useRouter: () => ({ push: () => {} }) }));
import HomeG, { metadata } from "./page";
import { noteAt, SHEET, STEPS } from "./Control";
import { G } from "../copy";
import { themeFor } from "@/lib/theme";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ");
const ROOT = resolve(__dirname, "../../../..");

const render = async (alt?: string) => renderToStaticMarkup(await HomeG({ searchParams: Promise.resolve(alt ? { alt } : {}) }));

describe("home study G, the joint homepage", async () => {
  const html = await render();
  const page = text(html);

  it("keeps what must survive: with your OK, the three connect steps, and the four control facts", () => {
    expect(page).toContain("with your OK");
    for (const s of ["Download for Mac", "Import your Apple Notes", "Connect your AI", "One press for Claude Code and Codex.", "Works with ChatGPT, Claude, Incredible and any MCP app."]) expect(page, s).toContain(s);
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

  it("drops the facts tiles and the Free tag, and only prints proof it checked", () => {
    expect(html).not.toContain("/home-d/facts/tag.webp");
    expect(page).not.toMatch(/connector directory/i);
    expect(readFileSync(resolve(ROOT, "LICENSE"), "utf8")).toMatch(/^MIT License/);
    expect(G.closing.proof).toEqual(["Open source (MIT)", "Listed in awesome-mac"]);
  });

  it("takes the sheet's words from the app", () => {
    const swift = readFileSync(resolve(ROOT, "Pane/Views/ConnectAI.swift"), "utf8");
    expect(swift).toContain('"Allow \\(r.who) to use your notes?"');
    for (const w of [SHEET.edit, SHEET.read, SHEET.editLine, SHEET.readLine, "Locked notes stay private.", "Don\\u{2019}t Allow"]) expect(swift, w).toContain(w);
  });

  it("tells the approval in four steps, tinting only ChatGPT's line and taking it back", () => {
    expect(STEPS.map((s) => s.credit)).toEqual(["ChatGPT asks first", "You allow Read and edit", "ChatGPT added 1 line", "Undo took it back"]);
    expect(noteAt(2).filter((r) => r.tint && r.in)).toHaveLength(1);
    expect(noteAt(3).some((r) => r.in && r.text.startsWith("Book the table"))).toBe(false);
    for (let k = 0; k < STEPS.length; k++) expect(noteAt(k)).toHaveLength(4); // the note keeps its height
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
  it("puts macOS 26 in step 1, not in the small print, and keeps iPhone coming soon", () => {
    expect(text(html)).toContain("Free, macOS 26.");
    expect(text(html)).not.toContain("Requires macOS 26");
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
