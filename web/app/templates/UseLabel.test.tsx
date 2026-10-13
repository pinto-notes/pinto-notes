import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { APP_TEMPLATE_VERBS_IPHONE, APP_TEMPLATE_VERBS_LIVE, APP_VERBS, templates, useLabel } from "@/lib/templates";
import Card from "./Card";

const bySlug = (slug: string) => templates().find((t) => t.slug === slug)!;
const text = (html: string) => html.replace(/<[^>]+>/g, "");

// An app template's button says what you'll do with it on a Mac (1.2.26 installs template apps);
// on an iPhone it says "Use template" until the iPhone app does too.
describe("the template button's words", () => {
  it("ships with the verbs on for desktop and off for iPhone", () => {
    expect(APP_TEMPLATE_VERBS_LIVE).toBe(true);
    expect(APP_TEMPLATE_VERBS_IPHONE).toBe(false);
  });

  it("gives every app template its verb on a Mac, and Use template on an iPhone", () => {
    expect(APP_VERBS).toEqual({ "habit-tracker": "Start tracking", "budget-log": "Start budgeting", "trip-plan": "Plan the trip", "study-flashcards": "Study now" });
    for (const t of templates().filter((t) => t.app)) {
      expect(useLabel(t, "desktop"), t.slug).toBe(APP_VERBS[t.slug]);
      expect(useLabel(t, "ios"), t.slug).toBe("Use template");
    }
  });

  it("keeps Use template on every platform for a template without an app", () => {
    for (const t of templates().filter((t) => !t.app)) for (const on of ["desktop", "ios"] as const) expect(useLabel(t, on), t.slug).toBe("Use template");
  });

  it("puts both words in an app template's card and lets the platform pick, and one word in the rest", () => {
    const app = renderToStaticMarkup(<Card t={bySlug("habit-tracker")} />);
    expect(app).toMatch(/class="[^"]*labelDesktop[^"]*">Start tracking</);
    expect(app).toMatch(/class="[^"]*labelIos[^"]*">Use template</);
    const plain = renderToStaticMarkup(<Card t={bySlug("meeting-notes")} />);
    expect(plain).not.toContain("labelDesktop");
    expect(text(plain)).toContain("Use template");
    const css = readFileSync(resolve(__dirname, "templates.module.css"), "utf8");
    expect(css).toContain(':global(:root[data-platform="ios"]) .labelDesktop { display: none; }');
    expect(css).toContain(".labelIos { display: none; }");
  });
});
