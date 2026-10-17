import { describe, expect, it } from "vitest";
import { FACTS, WHAT_IT_IS } from "./facts";
import { APP_STORE_LIVE } from "./site";

describe("facts", () => {
  it("only offer the iPhone once the App Store has it", () => {
    if (APP_STORE_LIVE) return;
    const text = [WHAT_IT_IS, ...FACTS].join(" ");
    expect(text).not.toMatch(/iPhone (and|or) Mac|between iPhone/);
    for (const sentence of FACTS.filter((f) => f.includes("iPhone"))) expect(sentence).toContain("coming soon");
  });
});
