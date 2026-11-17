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

/** Round 27, `film` (2026-11-17): the first screen's picture is a recording (Film.tsx, FilmHero in
 *  Story.tsx). `?hero=1` (default): the words left, the iPhone recording on the paper right. `?hero=2`: the
 *  words big and centred over a wide slab of ChatGPT's recording. The middle chapters and the close are
 *  round 26 `carry`'s, unchanged (`?close=0` for round 25's close). */
const pick = <T extends string>(v: string | string[] | undefined, ok: readonly T[], fallback: T): T =>
  typeof v === "string" && (ok as readonly string[]).includes(v) ? (v as T) : fallback;
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return (
    <Story
      className={display.variable}
      film={pick(q.hero, ["1", "2"] as const, "1")}
      close={pick(q.close, ["0", "1"] as const, "1")}
      wb={pick(q.wb, ["0", "a", "b", "c", "d"] as const, "d")}
      ai={pick(q.ai, ["0", "a", "b", "c"] as const, "b")}
      collab={q.collab === "1"}
    />
  );
}
