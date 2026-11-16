import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { Story, type HeroOption } from "./Story";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build small apps, with your AI. Feels like Apple Notes, on Mac and iPhone. Works with ChatGPT and Claude. Free.",
};

// Study Z, round 20: real Pinto screenshots, one per section, with room around each. See Story.tsx.
const display = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--s-display", display: "swap" });

/** `?hero=a|b|c` picks the first screen's picture (a by default). */
export default async function Page({ searchParams }: { searchParams: Promise<{ hero?: string }> }) {
  const { hero } = await searchParams;
  const option: HeroOption = hero === "b" || hero === "c" ? hero : "a";
  return <Story className={display.variable} hero={option} />;
}
