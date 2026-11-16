import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { Story } from "./Story";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build small apps, with your AI. Feels like Apple Notes, on Mac and iPhone. Works with ChatGPT and Claude. Free.",
};

// Study S, "Editorial colour" (round 9). A ring binder: one colour chapter per thing, each arriving as
// its card from the first screen and leaving its tab docked under the header. See Story.tsx.
const display = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--s-display", display: "swap" });

/** Round 21's variants: `?wb=a|b|c|d` (the whiteboard chapter), `?ai=a|b|c` (Your AI), `?hero=a|b|c`
 *  (the first screen). Each defaults to 0, round 19 as it was. */
const pick = (v: string | string[] | undefined) => (v === "a" || v === "b" || v === "c" ? v : "0");
const pickWb = (v: string | string[] | undefined) => (v === "d" ? v : pick(v));
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return <Story className={display.variable} wb={pickWb(q.wb)} ai={pick(q.ai)} hero={pick(q.hero)} />;
}
