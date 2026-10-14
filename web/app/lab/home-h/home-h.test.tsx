import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/lab/home-h", useRouter: () => ({ push: () => {} }) }));
import HomeH from "./page";
import { themeFor } from "@/lib/theme";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, " ");
const pub = (p: string) => resolve(__dirname, "../../../public", p.replace(/^\//, ""));

describe("home study H, the real app", () => {
  const html = renderToStaticMarkup(<HomeH />);
  const page = text(html);

  it("keeps the headline and with your OK, and four sections then G's ending", () => {
    expect(page).toContain("One notes app for every AI you use.");
    expect(page).toContain("with your OK");
    const order = ["Every AI you use, one notebook.", "Plans don't die here.", "Wait, it can do that?", "Feels like Apple Notes. Brings yours over.", "Start with the notes you already have."];
    const at = order.map((t) => page.indexOf(t));
    for (const [k, i] of at.entries()) expect(i, order[k]).toBeGreaterThan(-1);
    expect([...at].sort((a, b) => a - b)).toEqual(at);
    expect(page).not.toContain("You decide what your AI can touch");
  });

  it("states the three trust facts in words", () => {
    for (const l of ["You approve each AI.", "Undo any change.", "Encrypted before it syncs."]) expect(page, l).toContain(l);
  });

  it("is built around real captures that exist, each described", () => {
    const shots = [...html.matchAll(/<img [^>]*src="(\/home-h\/[^"]+)"[^>]*>/g)];
    expect(shots.length).toBeGreaterThanOrEqual(6);
    for (const [tag, src] of shots) {
      expect(existsSync(pub(src)), src).toBe(true);
      if (!src.includes("divider")) expect(tag, src).toMatch(/alt="[^"]{12,}"/);
    }
  });

  it("enters nothing from nothing: no entrance classes on the page", () => {
    expect(html).not.toMatch(/class="[^"]*\brise(-soft)?\b/);
  });

  it("is cream, quiet in its header, and marks its dark bands", () => {
    expect(themeFor("/lab/home-h")).toBe("cream");
    expect(html).toContain("data-quiet-nav");
    expect(html.match(/data-dark-band=""/g)).toHaveLength(2);
    expect(readFileSync(resolve(__dirname, "h.module.css"), "utf8")).toContain(".window");
  });
});
