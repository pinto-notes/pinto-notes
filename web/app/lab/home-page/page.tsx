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

/** Round 27, `page`: the first screen is a Pinto note (PageHero.tsx). `?hero=1` (default): one sheet,
 *  ChatGPT's one marked line. `?hero=2`: ChatGPT and Claude each leave one marked edit, with 1.4's mark.
 *  Round 26, `carry` (2026-11-17): `?hero=1` (default) and `?hero=2` are this round's first screens,
 *  where the Notes chapter's window is the picture and carries on into Notes (Carry.tsx); `?close=1`
 *  (default) ends on the same window, `?close=0` on round 25's close. The older first screens stay
 *  reachable as `?hero=0|a|b|c`.
 *  Round 23: the picks are the page with no query string: hero c (with the paper-b art, art.ts),
 *  whiteboard d, Your AI b. The older variants stay reachable: `?hero=0|a|b`, `?wb=0|a|b|c`,
 *  `?ai=0|a|c`, `?art=0|paper-a`. `?collab=1` adds the sharing chapter (collaboration ships in 1.4). */
const pick = <T extends string>(v: string | string[] | undefined, ok: readonly T[], fallback: T): T =>
  typeof v === "string" && (ok as readonly string[]).includes(v) ? (v as T) : fallback;
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return (
    <Story
      className={display.variable}
      page={pick(q.hero, ["1", "2"] as const, "1")}
      close={pick(q.close, ["0", "1"] as const, "1")}
      wb={pick(q.wb, ["0", "a", "b", "c", "d"] as const, "d")}
      ai={pick(q.ai, ["0", "a", "b", "c"] as const, "b")}
      collab={q.collab === "1"}
    />
  );
}
