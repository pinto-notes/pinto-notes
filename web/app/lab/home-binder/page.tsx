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

/** Round 26, "binder" (Binder.tsx): the page is a notebook you open and close.
 *  `?hero=2` the first screen is the binder's cover, which swings away onto Notes (the default: it
 *  pairs with the close, which shuts the same cover);
 *  `?hero=1` the closed binder beside the headline, opened by scrolling into Notes;
 *  `?close=1` the cover swings shut over Your AI, "Pinto Notes is free." on it (the default);
 *  `?close=0` round 25's close. Round 23's variants stay reachable: `?hero=0|a|b|c`, `?wb=`, `?ai=`. */
const pick = <T extends string>(v: string | string[] | undefined, ok: readonly T[], fallback: T): T =>
  typeof v === "string" && (ok as readonly string[]).includes(v) ? (v as T) : fallback;
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return (
    <Story
      className={display.variable}
      hero={pick(q.hero, ["0", "a", "b", "c", "1", "2"] as const, "2")}
      close={pick(q.close, ["0", "1"] as const, "1")}
      wb={pick(q.wb, ["0", "a", "b", "c", "d"] as const, "d")}
      ai={pick(q.ai, ["0", "a", "b", "c"] as const, "b")}
      collab={q.collab === "1"}
    />
  );
}
