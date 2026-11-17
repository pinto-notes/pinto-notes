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
  const three = q.hero === "three";
  const h1 = q.h1 === "b" || q.h1 === "c" || q.h1 === "d" ? q.h1 : three ? "d" : "a";
  return <div className={display.variable}><Home h1={h1} three={three} serif={q.font !== "sans"} /></div>;
}
