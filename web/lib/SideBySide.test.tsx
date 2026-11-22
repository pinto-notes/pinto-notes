import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SideBySide } from "./SideBySide";

const props = {
  slug: "apple-notes-budget-template",
  apple: { src: "/blog/side-by-side/budget-template-apple-notes", width: 906, height: 577, alt: "The budget in Apple Notes.", line: "Adds up the plan. You type every change." },
  pinto: {
    title: "The same budget in Pinto Notes", line: "Tracks the month as you spend.", alt: "The same budget in Pinto Notes.",
    phone: { src: "/blog/side-by-side/budget-pinto-phone", width: 780, height: 1688 },
    desk: { src: "/blog/side-by-side/budget-pinto-mac", width: 1526, height: 1280 },
    href: "/templates/budget-log", button: "Get the budget template",
  },
};

describe("the Apple Notes and Pinto Notes side by side", () => {
  const html = renderToStaticMarkup(<SideBySide {...props} />);

  it("labels each card and says one line under each picture", () => {
    expect(html).toContain(">In Apple Notes<");
    expect(html).toContain(">The same budget in Pinto Notes<");
    expect(html).toContain("Adds up the plan. You type every change.");
    expect(html).toContain("Tracks the month as you spend.");
  });

  it("shows the phone screen on a phone and the Mac crop from 900 px, AVIF first", () => {
    expect(html).toMatch(/<source media="\(min-width: 900px\)" type="image\/avif" srcSet="\/blog\/side-by-side\/budget-pinto-mac.avif"/);
    expect(html).toMatch(/<img src="\/blog\/side-by-side\/budget-pinto-phone.webp" alt="The same budget in Pinto Notes."/);
    expect(html).toMatch(/<img src="\/blog\/side-by-side\/budget-template-apple-notes.webp" alt="The budget in Apple Notes."/);
  });

  it("has one button, to the Pinto template, counted as the post's call to action", () => {
    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toMatch(/<a [^>]*href="\/templates\/budget-log" data-cta="apple-notes-budget-template" data-cta-position="side-by-side" data-cta-action="template_page">Get the budget template<\/a>/);
  });

  it("cuts only a tall Apple Notes note", () => {
    expect(html).not.toContain("data-tall");
    const tall = renderToStaticMarkup(<SideBySide {...props} apple={{ ...props.apple, width: 694, height: 1763 }} />);
    expect(tall).toContain('data-tall="true"');
  });

  it("has every picture the posts use, in both formats", () => {
    const pics = ["budget", "expense", "habit", "trip", "packing"].flatMap((n) => [`${n}-pinto-phone`, `${n}-pinto-mac`])
      .concat(["job-hunt", "meal-plan", "mood-energy-log", "reading-list", "time-log", "workout-log"].flatMap((n) => [`${n}-pinto-phone`, `${n}-pinto-mac`]))
      .concat(["budget-template", "expense-tracker", "habit-tracker", "job-search-tracker", "meal-planner-template", "mood-tracker", "reading-list",
        "templates", "time-log-template", "trip-planner-template", "workout-log-template"].map((s) => `${s}-apple-notes`));
    for (const p of pics) for (const ext of ["webp", "avif"]) expect(existsSync(join(process.cwd(), "public/blog/side-by-side", `${p}.${ext}`)), `${p}.${ext}`).toBe(true);
  });

  // The app posts' Pinto side turned from a note into the app on 22 Nov 2026, drawn at new sizes: the
  // width and height each post gives must be the picture's own, or the card is drawn stretched.
  it("gives each picture its own size", () => {
    const size = (file: string) => {
      const b = readFileSync(file);
      const kind = b.toString("ascii", 12, 16);
      if (kind === "VP8X") return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
      if (kind === "VP8L") { const n = b.readUInt32LE(21); return [1 + (n & 0x3fff), 1 + ((n >> 14) & 0x3fff)]; }
      return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    };
    const blog = join(process.cwd(), "app/blog");
    let checked = 0;
    for (const post of readdirSync(blog).filter((d) => d.startsWith("apple-notes-") && existsSync(join(blog, d, "page.tsx")))) {
      const page = readFileSync(join(blog, post, "page.tsx"), "utf8");
      for (const m of page.matchAll(/src: "\/blog\/side-by-side\/([a-z0-9-]+)", width: (\d+), height: (\d+)/g)) {
        expect(size(join(process.cwd(), "public/blog/side-by-side", `${m[1]}.webp`)), `${post}: ${m[1]}`).toEqual([Number(m[2]), Number(m[3])]);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});
