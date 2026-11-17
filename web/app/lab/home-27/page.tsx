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

/** Round 27 (2026-11-17): one page on round 26's Carry 2. `?hero=a` (default), `b`, `c`: three first
 *  screens, each ending in the same hand-off (the note picked up into Notes); `?close=a` (default) the
 *  notebook-art close, `b` the binder's cover closing. `?t` (any value): every show at its end, from the
 *  server's first paint on. Whiteboard d and Your AI b, as on home-z; `?collab=1` adds Sharing. */
const pick = <T extends string>(v: string | string[] | undefined, ok: readonly T[], fallback: T): T =>
  typeof v === "string" && (ok as readonly string[]).includes(v) ? (v as T) : fallback;
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  return (
    <Story
      className={display.variable}
      hero={pick(q.hero, ["a", "b", "c"] as const, "a")}
      close={pick(q.close, ["a", "b"] as const, "a")}
      wb={pick(q.wb, ["0", "a", "b", "c", "d"] as const, "d")}
      ai={pick(q.ai, ["0", "a", "b", "c"] as const, "b")}
      collab={q.collab === "1"}
      still={q.t !== undefined}
    />
  );
}
