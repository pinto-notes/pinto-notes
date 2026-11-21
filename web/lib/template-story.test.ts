import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TemplatePage from "../app/templates/[slug]/page";
import { TEMPLATE_STORY } from "./template-story";
import { template } from "./templates";

const pub = (p: string) => path.join(process.cwd(), "public", p);

describe("template story pages", () => {
  for (const [slug, story] of Object.entries(TEMPLATE_STORY)) {
    it(`${slug}: is a real template with an app`, () => {
      expect(template(slug)?.app).toBe(true);
    });

    it(`${slug}: every picture is on disk`, () => {
      for (const p of [story.art.src, story.art.phone, story.mac.src, story.phone.src, ...story.week.days.map((d) => d.phone), ...story.change.asks.flatMap((a) => [a.before.src, a.after.src])]) expect(existsSync(pub(p)), p).toBe(true);
    });

    it(`${slug}: the week's rows have a value per day, between 0 and 1`, () => {
      for (const r of story.week.rows) {
        expect(r.days).toHaveLength(story.week.days.length);
        for (const v of r.days) expect(v >= 0 && v <= 1).toBe(true);
      }
    });

    it(`${slug}: every ask starts with what the person said and ends with what came back`, () => {
      expect(story.change.asks.length).toBeGreaterThan(0);
      for (const a of story.change.asks) {
        expect("you" in a.chat[0]).toBe(true);
        expect("ai" in a.chat.at(-1)!).toBe(true);
        expect(a.before.src).not.toBe(a.after.src);
      }
    });

    it(`${slug}: writes plainly (no dashes, no iPad)`, () => {
      const text = JSON.stringify(story);
      expect(text).not.toMatch(/[–—]/);
      expect(text).not.toMatch(/iPad/);
    });

    it(`${slug}: the page shows the story top, the week with the last day open, and still answers its questions`, async () => {
      const html = renderToStaticMarkup(await TemplatePage({ params: Promise.resolve({ slug }) }));
      expect(html).toContain(story.headline);
      expect(html).toContain(story.mac.src);
      expect(html).toContain('id="week"');
      const last = story.week.days.at(-1)!;
      expect(html).toContain(last.phone);
      expect(html).toContain(last.you.replace(/'/g, "&#x27;"));
      expect(html).toContain('id="change"');
      const first = story.change.asks[0];
      expect(html).toContain(first.after.src);
      expect(html).toContain(("you" in first.chat[0] ? first.chat[0].you : "").replace(/'/g, "&#x27;"));
      expect(html).toContain('id="questions"');
      expect(html.match(/<h1/g)).toHaveLength(1);
    });
  }

  it("the week's phones are real captures at the phone size the frame expects", () => {
    for (const story of Object.values(TEMPLATE_STORY)) for (const src of [...story.week.days.map((d) => d.phone), ...story.change.asks.flatMap((a) => [a.before.src, a.after.src])]) {
      const b = readFileSync(pub(src));
      expect(b.subarray(0, 4).toString()).toBe("RIFF");
    }
  });
});
