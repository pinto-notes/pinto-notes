import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: () => {} }), notFound: () => { throw new Error("404"); } }));
import HomeA from "./A";
import HomeB from "./B";
import HomeC from "./C";
import Demo from "../Demo";
import { ImportCard } from "./parts";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, " ");
const pub = (p: string) => resolve(__dirname, "../../public", p.replace(/^\//, ""));

// The home page directions (/?v=a, b, c): the same pitch as the home page, in pictures.
describe.each([["A", HomeA], ["B", HomeB], ["C", HomeC]])("home direction %s", (_, Page) => {
  const html = renderToStaticMarkup(<Page />);
  const page = text(html);

  it("keeps the headline and every section's pitch", () => {
    expect(page).toContain("Write the plan. Your AI helps you follow through.");
    for (const s of ["Every AI you use works from the same notes", "It feels like Apple Notes, especially on iPhone", "A note can also be an app", "The iPhone app is coming to the App Store soon."]) expect(page, s).toContain(s);
    for (const ai of ["ChatGPT", "Claude", "Claude Code", "Codex", "Incredible"]) expect(page, ai).toContain(ai);
    expect(page).not.toMatch(/[–—]/);
  });

  it("brings in paper-craft pictures that exist, each described", () => {
    const pics = [...html.matchAll(/<img [^>]*src="(\/(?:home|templates\/covers)\/[^"]+)"/g)].map((m) => m[1]);
    expect(pics.length).toBeGreaterThanOrEqual(5);
    for (const p of pics) expect(existsSync(pub(p)), p).toBe(true);
    for (const m of html.matchAll(/<img [^>]*class="[^"]*art[^"]*"[^>]*>/g)) expect(m[0], m[0]).toMatch(/alt="[^"]+"/);
  });

  it("softens the demo's tint", () => {
    expect(html).toContain("lisbon-1-soft");
    expect(html).not.toContain("lisbon-1-tint");
  });
});

describe("the home page directions' parts", () => {
  it("has a soft frame at every size for each tinted one", () => {
    for (const n of [1, 2]) for (const sfx of ["", "-1180", "-800"]) expect(existsSync(pub(`/demo/lisbon/lisbon-${n}-soft${sfx}.webp`))).toBe(true);
  });

  it("leaves the home page's demo as it is", () => {
    const html = renderToStaticMarkup(<Demo />);
    expect(html).toContain("lisbon-1-tint");
    expect(html).not.toContain("soft");
  });

  it("gives the import card's total a place in its title row, so the card is never half empty", () => {
    const html = renderToStaticMarkup(<ImportCard />);
    const top = html.split("importTop")[1].split("</div></div>")[0];
    expect(text(top)).toMatch(/1,284 notes/);
    expect(html).not.toContain("runEnd");
  });

  it("is reached from the home page's own address and never indexed", () => {
    const config = readFileSync(resolve(__dirname, "../../next.config.ts"), "utf8");
    expect(config).toContain('{ source: "/", has: [{ type: "query", key: "v", value: "(?<v>a|b|c)" }], destination: "/home-v/:v" }');
    expect(readFileSync(resolve(__dirname, "[v]/page.tsx"), "utf8")).toMatch(/robots: \{ index: false/);
    expect(readFileSync(resolve(__dirname, "../site.css"), "utf8")).toContain("html:has([data-home-v]) .site-badge, html:has([data-home-v]) .site-stars { display: none; }");
  });
});
