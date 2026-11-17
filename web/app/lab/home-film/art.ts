"use client";

import { useSearchParams } from "next/navigation";

// Round 22: `?art=` swaps the first screen's picture (HeroArt) and the close's (Cover in Story.tsx)
// together. Round 23: paper-b, cut from paper like the rest of the page, is the default; `?art=0` is
// the engraved still life of round 19.
// - paper-a: the same table as the engraving (glasses, herbs, green book, half an orange, pen, coffee).
// - paper-b: a thinker's desk, no food (a folded page, an olive sprig, an orange notebook, pen, coffee).
// Sources and prompts: ~/content-tools/projects/pinto-site-art/r22-paper/.

export type Art = "0" | "paper-a" | "paper-b";

type Pics = { hero: string; heroSide: number; close: string; closeW: number; closeH: number };

export const ART: Record<Art, Pics> = {
  "0": { hero: "/lab/z/hero-table-v1.webp", heroSide: 1254, close: "/lab/z/close-life-v1.webp", closeW: 1536, closeH: 1024 },
  "paper-a": { hero: "/lab/z/hero-paper-a-v1.webp", heroSide: 1600, close: "/lab/z/close-paper-a-v1.webp", closeW: 2400, closeH: 1600 },
  // Round 23: regenerated at the image tool's largest size, then Real-ESRGAN x4, so it's sharp on a 2x
  // screen (~/content-tools/projects/pinto-site-art/r23-paper/README.md).
  "paper-b": { hero: "/lab/z/hero-paper-b-v2.webp", heroSide: 2400, close: "/lab/z/close-paper-b-v2.webp", closeW: 3072, closeH: 2048 },
};

/** Round 23: paper-b is the default; `?art=0` brings back the engraving, `?art=paper-a` the kitchen table. */
export const pickArt = (v: string | null | undefined): Art => (v === "0" || v === "paper-a" ? v : "paper-b");

/** The pictures for this page's `?art=`. */
export function useArt(): Pics {
  return ART[pickArt(useSearchParams()?.get("art"))];
}
