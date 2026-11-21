import { describe, expect, it } from "vitest";
import { ctaLook } from "./PostCta";

// B34 (21 Nov 2026): the download card is no longer a plain box. A card about ChatGPT, Claude or an AI opens with
// them joined to a note; every other card carries one of the home page's pictures.
describe("the download card's look", () => {
  it("joins the AIs to a note when the card is about them", () => {
    expect(ctaLook("Want ChatGPT and Claude in your notes?")).toBe("connect");
    expect(ctaLook("Want a budget your AI keeps for you?")).toBe("connect");
    expect(ctaLook("ChatGPT und Claude in deinen Notizen?")).toBe("connect");
  });
  it("shows a scene otherwise", () => {
    expect(ctaLook("Try a small Mem export in Pinto Notes")).toBe("scene");
    expect(ctaLook("Want tables that add up?")).toBe("scene");
    // "said" or "maid" must not count as AI.
    expect(ctaLook("Notes that stay where you said")).toBe("scene");
  });
});
