import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { post } from "../posts";
import { LANGS, TRANSLATIONS, UI, languagesFor, localPath } from "./blog";

// The language pilot's rules, for every translated post (lib/i18n/translations/<lang>.ts).
const source = (lang: string, slug: string) => new URL(`../../app/${lang}/blog/${slug}/page.tsx`, import.meta.url);

describe("translated blog posts", () => {
  it("translate a published English post, once per language", () => {
    for (const t of TRANSLATIONS) {
      expect(post(t.of).draft, t.of).toBeFalsy();
      expect(TRANSLATIONS.filter((x) => x.of === t.of && x.lang === t.lang), `${t.lang} ${t.of}`).toHaveLength(1);
    }
  });

  it("each have a page, at /<lang>/blog/<slug>, that renders its own translation", () => {
    for (const t of TRANSLATIONS) {
      expect(existsSync(source(t.lang, t.slug)), localPath(t)).toBe(true);
      const src = readFileSync(source(t.lang, t.slug), "utf8");
      expect(src, localPath(t)).toContain(`localPostMetadata("${t.lang}", "${t.slug}")`);
      expect(src, localPath(t)).toContain(`slug="${t.slug}"`);
    }
  });

  it("have slugs made for search: lowercase words and hyphens, no repeats", () => {
    for (const t of TRANSLATIONS) expect(t.slug, t.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(new Set(TRANSLATIONS.map(localPath)).size).toBe(TRANSLATIONS.length);
  });

  it("keep the search title to 60 characters and the description between 70 and 160", () => {
    for (const t of TRANSLATIONS) {
      expect(t.title.length, t.title).toBeLessThanOrEqual(60);
      expect(t.description.length, t.description).toBeGreaterThanOrEqual(70);
      expect(t.description.length, t.description).toBeLessThanOrEqual(160);
    }
  });

  it("follow the blog's writing rules in every language", () => {
    for (const t of TRANSLATIONS) {
      const text = [t.title, t.description, readFileSync(source(t.lang, t.slug), "utf8")].join("\n");
      expect(text, `${localPath(t)}: no em or en dashes`).not.toMatch(/[–—]/);
      expect(text, `${localPath(t)}: no iPad`).not.toMatch(/iPad/);
      expect(text, `${localPath(t)}: never "end to end"`).not.toMatch(/end[- ]to[- ]end|extremo a extremo|ponta a ponta|ende[- ]zu[- ]ende|bout en bout|end-to-end/i);
      expect(text, `${localPath(t)}: never Incredible`).not.toMatch(/incredible/i);
    }
  });

  it("say the app is in English wherever they offer the download", () => {
    for (const lang of LANGS) expect(UI[lang].cta.english.length, lang).toBeGreaterThan(0);
    for (const t of TRANSLATIONS) {
      const src = readFileSync(source(t.lang, t.slug), "utf8");
      if (src.includes("<PostCta")) expect(src, localPath(t)).toContain(`ui={ui.cta}`);
    }
  });

  it("point to each other and to the English post with hreflang", () => {
    for (const t of TRANSLATIONS) {
      const l = languagesFor(t.of)!;
      expect(l.en).toBe(`/blog/${t.of}`);
      expect(l["x-default"]).toBe(`/blog/${t.of}`);
      expect(l[t.lang]).toBe(localPath(t));
    }
  });
});
