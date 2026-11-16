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

/** Round 23: the picks are the page with no query string: hero c (with the paper-b art, art.ts),
 *  whiteboard d, Your AI b. The older variants stay reachable: `?hero=0|a|b`, `?wb=0|a|b|c`,
 *  `?ai=0|a|c`, `?art=0|paper-a`. `?collab=1` adds the sharing chapter (collaboration ships in 1.4). */
const pick = <T extends string>(v: string | string[] | undefined, ok: readonly T[], fallback: T): T =>
  typeof v === "string" && (ok as readonly string[]).includes(v) ? (v as T) : fallback;
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return (
    <Story
      className={display.variable}
      hero={pick(q.hero, ["0", "a", "b", "c"] as const, "c")}
      wb={pick(q.wb, ["0", "a", "b", "c", "d"] as const, "d")}
      ai={pick(q.ai, ["0", "a", "b", "c"] as const, "b")}
      collab={q.collab === "1"}
    />
  );
}
