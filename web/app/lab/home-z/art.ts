"use client";

import { useSearchParams } from "next/navigation";

// Round 22: `?art=paper-a|paper-b` swaps the first screen's picture (HeroArt) and the close's (Cover in
// Story.tsx) together, for a version cut from paper like the rest of the page. Use it with `?hero=c`.
// Without it, the engraved still life of round 19.
// - paper-a: the same table as the engraving (glasses, herbs, green book, half an orange, pen, coffee).
// - paper-b: a thinker's desk, no food (a folded page, an olive sprig, an orange notebook, pen, coffee).
// Sources and prompts: ~/content-tools/projects/pinto-site-art/r22-paper/.

export type Art = "0" | "paper-a" | "paper-b";

type Pics = { hero: string; heroSide: number; close: string; closeW: number; closeH: number };

export const ART: Record<Art, Pics> = {
  "0": { hero: "/lab/z/hero-table-v1.webp", heroSide: 1254, close: "/lab/z/close-life-v1.webp", closeW: 1536, closeH: 1024 },
  "paper-a": { hero: "/lab/z/hero-paper-a-v1.webp", heroSide: 1600, close: "/lab/z/close-paper-a-v1.webp", closeW: 2400, closeH: 1600 },
  "paper-b": { hero: "/lab/z/hero-paper-b-v1.webp", heroSide: 1600, close: "/lab/z/close-paper-b-v1.webp", closeW: 2400, closeH: 1600 },
};

export const pickArt = (v: string | null | undefined): Art => (v === "paper-a" || v === "paper-b" ? v : "0");

/** The pictures for this page's `?art=`. */
export function useArt(): Pics {
  return ART[pickArt(useSearchParams()?.get("art"))];
}
