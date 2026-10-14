import type { Metadata } from "next";
import { Suspense } from "react";
import { G } from "../copy";
import { Switcher, type VersionInfo } from "./Switcher";
import { V1 } from "./v1/V1";
import { V2 } from "./v2/V2";

export const metadata: Metadata = { title: G.title, description: G.description };

// Every home page version on one page. The switcher in the lower-left picks a version (?v=) and
// flips its parts (each version's own keys). Versions are built one by one, each with its storyboard
// in /storyboards; only finished ones are listed here.

const VERSIONS: (VersionInfo & { render: (p: Record<string, string | undefined>) => React.ReactNode })[] = [
  {
    id: "notebook", name: "The notebook",
    idea: "The notebook you and your AI share. One running story: Monday you tell ChatGPT, Wednesday Claude knows, Friday it moves what you missed.",
    take: "Clear and honest, a benefit per section. Calm rather than spectacular.",
    parts: [{ key: "hero", label: "Hero", options: [{ id: "story", label: "Story, then try it" }, { id: "window", label: "The real app window" }] }],
    render: (p) => <V1 hero={p.hero} />,
  },
  {
    id: "week", name: "The week",
    idea: "The whole product as one scrolled film: Monday ChatGPT writes your plan, Wednesday Claude reads it, Friday it moves what you missed, Sunday you tick the last run.",
    take: "The most cinematic. Scroll slowly through the middle.",
    render: () => <V2 />,
  },
];

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const p = await searchParams;
  const v = VERSIONS.find((x) => x.id === p.v) ?? VERSIONS[0];
  return (
    <>
      {v.render(p)}
      <Suspense><Switcher versions={VERSIONS.map(({ render: _, ...info }) => info)} /></Suspense>
    </>
  );
}
