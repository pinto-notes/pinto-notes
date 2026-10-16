import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import TemplatePage from "../app/templates/[slug]/page";
import { post } from "./posts";
import { TEMPLATE_SEO } from "./template-seo";
import { templates } from "./templates";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const apps = templates().filter((t) => t.app);

describe("the app templates' search copy", () => {
  it("covers every template with an app, and nothing else", () => {
    expect(Object.keys(TEMPLATE_SEO).sort()).toEqual(apps.map((t) => t.slug).sort());
  });

  it("writes plainly: no dashes, no iPad, and no iPhone app on the App Store yet", () => {
    const text = JSON.stringify(TEMPLATE_SEO);
    expect(text).not.toMatch(/[–—]/);
    expect(text).not.toMatch(/iPad/);
    expect(text).not.toMatch(/iPhone app is on the App Store/);
  });

  for (const t of apps) {
    const seo = TEMPLATE_SEO[t.slug];

    it(`${t.slug}: shows its h1, what you can do, its questions as FAQPage data, and links its how-to post`, async () => {
      const html = renderToStaticMarkup(await TemplatePage(params(t.slug)));
      expect(html).toContain(`>${seo.h1}</h1>`);
      expect(seo.can.length).toBeGreaterThanOrEqual(3);
      for (const c of seo.can) expect(html).toContain(`<b>${c.name.replace(/'/g, "&#x27;")}</b>`);
      expect(seo.faq.length).toBeGreaterThanOrEqual(3);
      expect(html).toContain('"@type":"FAQPage"');
      expect(html).toContain(`href="/blog/${seo.post.slug}"`);
      // Use installs the app; the page shows no prompt, and beside the app, things to ask your AI to
      // change it (Emil, 14 October 2026).
      expect(html).not.toContain("What the prompt does");
      expect(html).not.toContain("Copy the prompt");
      expect(html.indexOf(">Ask your AI to change the app.<")).toBeGreaterThan(html.indexOf('id="result"'));
      expect(seo.make.length).toBeGreaterThanOrEqual(4);
      for (const m of seo.make) expect(html).toContain(m.replace(/'/g, "&#x27;"));
    });

    it(`${t.slug}: its how-to post is published and links back to the template`, () => {
      const p = post(seo.post.slug);
      expect(p.draft).toBe(false);
      const src = readFileSync(path.join(process.cwd(), "app/blog", p.slug, "page.tsx"), "utf8");
      expect(src).toContain(`href="/templates/${t.slug}"`);
      expect(src).not.toMatch(/[–—]/);
      expect(src).not.toMatch(/iPad/);
    });
  }
});
