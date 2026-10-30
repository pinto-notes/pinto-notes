import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COVERS } from "./template-covers";
import { templates } from "./templates";

/// The Mac app's template viewer reads its own copy of this list (Pane/Resources/Templates, made by
/// scripts/template-catalog.py). A template added here and not there fails until the script runs.
describe("the app's copy of the templates", () => {
  const dir = path.join(process.cwd(), "../Pane/Resources/Templates");
  const copy = JSON.parse(readFileSync(path.join(dir, "catalog.json"), "utf8")) as { slug: string; title: string; tagline: string; ground: string; ask: string }[];

  it("has every template, in the gallery's order, with its words", () => {
    expect(copy.map((t) => t.slug)).toEqual(templates().map((t) => t.slug));
    for (const t of templates()) {
      const c = copy.find((x) => x.slug === t.slug)!;
      expect([c.title, c.tagline, c.ask, `#${c.ground}`]).toEqual([t.title, t.tagline, t.asks[0], COVERS[t.slug].ground]);
    }
  });

  it("has every cover", () => {
    for (const t of copy) expect(existsSync(path.join(dir, `template-cover-${t.slug}.jpg`)), t.slug).toBe(true);
  });
});
