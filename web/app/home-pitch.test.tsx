import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/", useRouter: () => ({ push: () => {} }) }));
import Home from "./page";
import { AiSection, AppsSection, ImportSection } from "./Sections";
import { FAQ } from "./help/questions";

const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, " ");

// The home page pitch (2026-10-13): what you get from connecting your AI, not only what connects.
describe("the home page pitch", () => {
  const page = text(renderToStaticMarkup(<Home />));

  it("leads with following through, and names every AI that connects", () => {
    expect(page).toContain("Write the plan. Your AI helps you follow through.");
    for (const ai of ["ChatGPT", "Claude", "Claude Code", "Codex", "Incredible"]) expect(page, ai).toContain(ai);
  });

  it("shows what an AI does with your notes, each with a real request", () => {
    const ai = text(renderToStaticMarkup(<AiSection />));
    for (const job of ["Turns a messy note into next steps", "Checks in on the plan when you ask", "Remembers what you said you'd do"]) expect(ai, job).toContain(job);
    // Claude Code shows the server's real name and a real tool.
    expect(ai).toContain("amber-notes · search");
  });

  it("says once, in the Apple Notes section, that the iPhone app is coming, and never says iPad", () => {
    expect(text(renderToStaticMarkup(<ImportSection />))).toContain("The iPhone app is coming to the App Store soon.");
    expect(page).not.toContain("iPhone · coming soon");
    expect(page).not.toMatch(/iPad/);
  });

  it("shows a note becoming an app", () => {
    const html = renderToStaticMarkup(<AppsSection />);
    expect(text(html)).toContain("A note can also be an app");
    // Note apps are in the released Mac app (1.2.25), so Help answers how, and the section links there.
    expect(html).toContain('href="/help#apps"');
    expect(FAQ.some((q) => q.id === "apps")).toBe(true);
  });

  it("has no em or en dashes and no grocery-list gimmick", () => {
    expect(page).not.toMatch(/[–—]/);
    expect(page).not.toContain("oat milk");
  });
});
