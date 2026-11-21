import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { fixSpaces, missingSpaces } from "./jsx-spaces";

const pages = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? pages(p) : f === "page.tsx" ? [p] : [];
  });

describe("prose keeps its spaces around links", () => {
  it("finds both kinds of lost space and fixes them", () => {
    const src = ["      <p>", "        other people can edit.", '        <a href="/x">Docs can</a>', "        while keeping it.", "      </p>"].join("\n");
    expect(missingSpaces(src)).toEqual([2, 3]);
    expect(missingSpaces(fixSpaces(src))).toEqual([]);
  });

  it("leaves tags on their own lines alone", () => {
    expect(missingSpaces(["      <p>", '        <a href="/x">Docs</a>', "      </p>"].join("\n"))).toEqual([]);
  });

  it("no page loses a space before or after a link", () => {
    const bad = pages(join(__dirname, "..", "app")).flatMap((p) => missingSpaces(readFileSync(p, "utf8")).map((n) => `${p}:${n}`));
    expect(bad).toEqual([]);
  });
});
