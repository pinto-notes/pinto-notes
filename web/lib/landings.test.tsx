// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import nextConfig from "../next.config";
import sitemap from "../app/sitemap";
import { FAQ } from "../app/help/questions";
import * as forRoute from "../app/for/[slug]/page";
import * as altRoute from "../app/alternatives/[slug]/page";
import { LANDING_LINKS } from "./landing-links";
import { landingPath, landings, type Landing } from "./landings";
import { llmsTxt } from "./llms";
import { posts, published } from "./posts";

vi.mock("next/navigation", () => ({ usePathname: () => "/for/chatgpt", useRouter: () => ({ push: () => {} }), notFound: () => { throw new Error("404"); } }));

const route = (x: Landing) => (x.kind === "for" ? forRoute : altRoute);
async function render(x: Landing) {
  const el = await route(x).default({ params: Promise.resolve({ slug: x.slug }) });
  return new DOMParser().parseFromString(`<!doctype html><body>${renderToStaticMarkup(el)}</body>`, "text/html");
}
// happy-dom gives import.meta.url no file: address, so read from the site's folder (vitest runs in web/).
const postSource = (slug: string) => readFileSync(join(process.cwd(), "app/blog", slug, "page.tsx"), "utf8");

describe("landing pages", () => {
  it("builds exactly the pages in lib/landings.ts, under /for and /alternatives", () => {
    expect(forRoute.generateStaticParams()).toEqual(landings.filter((x) => x.kind === "for").map((x) => ({ slug: x.slug })));
    expect(altRoute.generateStaticParams()).toEqual(landings.filter((x) => x.kind === "alternatives").map((x) => ({ slug: x.slug })));
    expect(new Set(landings.map(landingPath)).size).toBe(landings.length);
  });

  for (const x of landings) {
    const path = landingPath(x);
    describe(path, () => {
      it("renders one h1, the headline, with three things to do and the download", async () => {
        const doc = await render(x);
        const h1s = doc.querySelectorAll("h1");
        expect(h1s.length).toBe(1);
        expect(h1s[0].textContent).toBe(x.h1);
        expect(doc.querySelectorAll("ol li h3").length).toBe(3);
        expect(doc.querySelectorAll('a[href="/download/mac"], a[download]').length).toBeGreaterThanOrEqual(2);
        for (const it of x.faq) expect(doc.body.textContent).toContain(it.q);
      });

      it("has its canonical, may be indexed, and has a search title and description of the right length", async () => {
        const m = await route(x).generateMetadata({ params: Promise.resolve({ slug: x.slug }) });
        expect(m.alternates?.canonical).toBe(path);
        expect(m.robots).toEqual({ index: true, follow: true });
        expect(String(m.title).length).toBeLessThanOrEqual(60);
        expect(x.description.length).toBeGreaterThanOrEqual(70);
        expect(x.description.length).toBeLessThanOrEqual(160);
      });

      it("emits FAQPage JSON-LD with every question", async () => {
        const doc = await render(x);
        const ld = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent!);
        const faq = ld["@graph"].find((t: { "@type": string }) => t["@type"] === "FAQPage");
        expect(faq.url).toBe(`https://pintonotes.com${path}`);
        expect(faq.mainEntity.map((q: { name: string }) => q.name)).toEqual(x.faq.map((q) => q.q));
      });

      it("is in the sitemap, /llms.txt and the footer, and isn't sent noindex", async () => {
        expect(sitemap().map((e) => e.url)).toContain(`https://pintonotes.com${path}`);
        expect(llmsTxt()).toContain(`https://pintonotes.com${path})`);
        expect(LANDING_LINKS.map((l) => l.href)).toContain(path);
        const noindex = (await nextConfig.headers!()).find((h) => h.headers.some((v) => v.key === "X-Robots-Tag" && h.source.startsWith("/((?!")))!;
        expect(new RegExp(`^${noindex.source}$`).test(path)).toBe(false);
        expect(new RegExp(`^${noindex.source}$`).test(`${path}/x`)).toBe(true);
      });

      it("links only to published posts and is linked from at least one", () => {
        const live = new Set(published().map((p) => p.slug));
        for (const r of x.read.filter((r) => r.href.startsWith("/blog/"))) expect(live.has(r.href.slice(6)), r.href).toBe(true);
        expect(posts.some((p) => !p.draft && postSource(p.slug).includes(`href="${path}"`))).toBe(true);
      });

      it("dates its comparison", () => {
        if (!x.compare) return;
        expect(x.compare.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        for (const row of x.compare.rows) expect(row.length).toBe(x.compare.columns.length + 1);
      });
    });
  }

  it("asks each question once, across the landing pages, the posts and the help page", () => {
    const qs = landings.flatMap((x) => x.faq.map((q) => q.q));
    expect(new Set(qs).size).toBe(qs.length);
    const help = new Set(FAQ.map((q) => q.q));
    const sources = posts.map((p) => postSource(p.slug)).join("\n");
    for (const q of qs) {
      expect(help.has(q), q).toBe(false);
      expect(sources.includes(`q: "${q}"`), q).toBe(false);
    }
  });

  it("gives every page its own headline, title, description and closing", () => {
    for (const key of ["h1", "title", "description"] as const) expect(new Set(landings.map((x) => x[key])).size).toBe(landings.length);
    expect(new Set(landings.map((x) => x.closing.title)).size).toBe(landings.length);
  });

  it("follows the site's writing rules: no dashes, no iPad, and the iPhone app still coming", () => {
    const text = JSON.stringify(landings);
    expect(text).not.toMatch(/[–—]/);
    expect(text).not.toMatch(/ipad/i);
    expect(text).not.toMatch(/on the App Store now|available on the App Store/i);
  });

  it("lets the text column shrink on a phone, so a wide comparison scrolls in its box instead of widening the page", () => {
    // At 390 px the comparison table pushed the questions and links past the screen's edge.
    const css = readFileSync(join(process.cwd(), "lib/landing.module.css"), "utf8");
    expect(css).toMatch(/\.col > \* \{ min-width: 0; \}/);
  });

  it("sends /chatgpt, the address ChatGPT ads link to, to the ChatGPT page for good (308)", async () => {
    expect(await nextConfig.redirects!()).toContainEqual({ source: "/chatgpt", destination: "/for/chatgpt", permanent: true });
    expect(landings.some((x) => landingPath(x) === "/for/chatgpt")).toBe(true);
  });

  it("lists the same pages in the footer as there are", () => {
    expect(LANDING_LINKS.map((l) => l.href).sort()).toEqual(landings.map(landingPath).sort());
  });
});
