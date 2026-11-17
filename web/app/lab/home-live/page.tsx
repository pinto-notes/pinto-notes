import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { G } from "./copy";
import { Home } from "./Home";

export const metadata: Metadata = { title: G.title, description: G.description };

const display = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--s-display", display: "swap" });

/** Round 28 (2026-11-17): the live home page, without the film and the people, with Write notes, Draw
 *  on whiteboards, Build apps and Write together rows. `?h1=a|b|c` picks the headline, `?font=sans`
 *  the live type. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const h1 = q.h1 === "b" ? "b" : "a";
  const sub = q.sub === "2" || q.sub === "3" ? q.sub : "1";
  return <div className={display.variable}><Home h1={h1} sub={sub} rows={q.rows === "full" ? "full" : "alt"} serif={q.font !== "sans"} /></div>;
}
