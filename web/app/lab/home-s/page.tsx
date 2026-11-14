import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { Story } from "./Story";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build small apps, with your AI. Feels like Apple Notes, on Mac and iPhone. Works with ChatGPT and Claude. Free.",
};

// Study S, "Editorial colour" (round 8). A ring binder: one colour chapter per thing, each arriving as
// its card from the first screen and leaving its tab docked under the header. See Story.tsx.
// `?hero=one` shows the first screen as a single picture (the note, written by two hands).
const display = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--s-display", display: "swap" });

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return <Story className={display.variable} hero={q.hero === "one" ? "one" : "three"} />;
}
