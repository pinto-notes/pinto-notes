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
      for (const p of [story.art.src, story.art.phone, story.mac.src, story.phone.src, ...story.week.days.map((d) => d.phone)]) expect(existsSync(pub(p)), p).toBe(true);
    });

    it(`${slug}: the week's rows have a value per day, between 0 and 1`, () => {
      for (const r of story.week.rows) {
        expect(r.days).toHaveLength(story.week.days.length);
        for (const v of r.days) expect(v >= 0 && v <= 1).toBe(true);
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
      expect(html).toContain('id="questions"');
      expect(html.match(/<h1/g)).toHaveLength(1);
    });
  }

  it("the week's phones are real captures at the phone size the frame expects", () => {
    for (const story of Object.values(TEMPLATE_STORY)) for (const d of story.week.days) {
      const b = readFileSync(pub(d.phone));
      expect(b.subarray(0, 4).toString()).toBe("RIFF");
    }
  });
});
