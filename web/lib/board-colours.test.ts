// One colour per person on every device (round 14: Sara was purple on the Mac and teal in the
// browser). The browser gives each person on a board the colour the shared vectors list for its
// members (supabase/functions/_shared/collab-vectors.json, people_colours), as the app does
// (PaneTests/Collab/BoardFollowTests.swift), and its session gives the same to their pointer, their
// avatar and their comments.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PALETTE, paletteIndex, slots } from "./board-doc";

const v = JSON.parse(readFileSync(new URL("../../supabase/functions/_shared/collab-vectors.json", import.meta.url), "utf8"));
const c = v.people_colours as { palette: string[]; cases: { about: string; members: string[]; colours: string[] }[] };

describe("each person's colour", () => {
  it("is from the app's palette", () => {
    expect(PALETTE.map(([light]) => light)).toEqual(c.palette);
  });

  it.each(c.cases.map((k) => [k.about, k] as const))("%s", (_, k) => {
    const s = slots(k.members);
    expect(k.members.map((m) => PALETTE[s.get(m.toLowerCase()) ?? paletteIndex(m)][0])).toEqual(k.colours);
  });
});
