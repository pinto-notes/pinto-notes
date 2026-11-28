import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Experiment B47 (28 Nov 2026, blog-growth research/tables-deep-pass-2026-11-28.md): on the tables post both App Store clicks
// came after the reader had scrolled down to the sums and gone back up to the answer card. The answer card stays as it was
// (B1), and the same offer sits again where the sum trick ends, so the two read apart by position.
const src = readFileSync(join(process.cwd(), "app", "blog", "apple-notes-tables", "page.tsx"), "utf8");
const cards = [...src.matchAll(/<PostCta slug="apple-notes-tables" position="(\w+)"[\s\S]*?<\/PostCta>/g)];

describe("the tables post's download cards", () => {
  it("keeps the answer card word for word, in the short answer", () => {
    const answer = /<Answer[\s\S]*?<\/Answer>/.exec(src)?.[0] ?? "";
    expect(answer).toContain('<PostCta slug="apple-notes-tables" position="answer" title="A table you can just ask.">');
    expect(answer).toContain("<p>Pinto Notes brings your Apple Notes tables over in one import. Connect ChatGPT or Claude, and they add the row you mention and do the sum when you ask.</p>");
  });

  it("has one more card, position sum, after the paste box and before Sort", () => {
    expect(cards.map((c) => c[1])).toEqual(["answer", "sum"]);
    const sum = src.indexOf('position="sum"');
    expect(sum).toBeGreaterThan(src.indexOf('<Keep title="Paste this under your table"'));
    expect(sum).toBeLessThan(src.indexOf('<h2 id="sort">'));
  });

  it("keeps the new card's copy plain and true: your AI, no dashes, no first person, no claim that tables add up", () => {
    const card = cards.find((c) => c[1] === "sum")?.[0] ?? "";
    expect(card).not.toMatch(/[–—]|\bI\b|\bmy\b|iPad|Incredible|ChatGPT|Claude/);
    expect(card).toContain("your AI");
    expect(card).not.toMatch(/formula|sorts?\b|adds? (it|itself|the column) up/i);
  });

  it("leaves the paste box's last line without =, and asks the reader to type it", () => {
    const total = /const TOTAL = `([\s\S]*?)`;/.exec(src)?.[1] ?? "";
    expect(total).toContain("Boxes + Van + Cleaning");
    expect(total).not.toMatch(/=\s*$/);
    expect(src).toMatch(/type = at the end of the last line/i);
  });

  it("names Apple's iPhone button as Apple's guide does, and speaks without an author", () => {
    expect(src).toContain('{ on: "iPhone", steps: ["Add Table button"] }');
    const body = src.slice(src.indexOf("export default function Page"));
    expect(body.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")).not.toMatch(/\bI\b|\bmy\b|\bme\b/);
  });
});
