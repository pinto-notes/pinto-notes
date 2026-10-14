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
    expect(shots.length).toBeGreaterThanOrEqual(5);
    for (const [tag, src] of shots) {
      expect(existsSync(pub(src)), src).toBe(true);
      if (!src.includes("divider")) expect(tag, src).toMatch(/alt="[^"]{12,}"/);
    }
  });

  const section = (id: string) => html.slice(html.indexOf(`aria-labelledby="${id}"`), html.indexOf("</section>", html.indexOf(`aria-labelledby="${id}"`)));
  const srcs = (part: string) => [...part.matchAll(/<img [^>]*src="([^"]+)"/g)].map((m) => m[1]);

  it("shows one big capture beside 'one notebook': the version history, no phone", () => {
    expect(srcs(section("one-notebook")).filter((s) => s.startsWith("/home-h/"))).toEqual(["/home-h/history.webp"]);
  });

  it("proves 'feels like Apple Notes' with the iPhone and the finished import, not the import sheet", () => {
    const feel = srcs(section("feel"));
    expect(feel).toEqual(["/home-h/iphone-notes.webp", "/home-h/import-done.webp"]);
    expect(html).not.toContain("/home-h/import.webp");
    expect(section("feel")).toContain("iPhone app coming soon");
  });

  it("brings back G's fanned template cards for 'Wait, it can do that?', with See all templates", () => {
    const wait = section("wait");
    for (const slug of ["habit-tracker", "trip-plan", "budget-log"]) expect(wait, slug).toContain(`/templates/${slug}`);
    expect(wait).toContain('href="/templates"');
    expect(wait).not.toContain("/home-h/");
  });

  it("never crops the divider's table: the picture is as tall as the strip, not cover-fitted", () => {
    const css = readFileSync(resolve(__dirname, "h.module.css"), "utf8");
    const rule = css.slice(css.indexOf(".divider img"), css.indexOf("}", css.indexOf(".divider img")));
    expect(rule).toContain("height: 100%");
    expect(rule).toContain("width: auto");
    expect(rule).not.toContain("object-fit");
    expect(html).toContain('src="/home-h/divider-table.webp"');
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
