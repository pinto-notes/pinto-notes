import type { Metadata } from "next";
import { Suspense } from "react";
import { G } from "../copy";
import { Switcher, type VersionInfo } from "./Switcher";
import { V1 } from "./v1/V1";
import { V2 } from "./v2/V2";
import { V3 } from "./v3/V3";
import { V4 } from "./v4/V4";
import { V5 } from "./v5/V5";

export const metadata: Metadata = { title: G.title, description: G.description };

// Every home page version on one page. The switcher in the lower-left picks a version (?v=) and
// flips its parts (each version's own keys). Versions are built one by one, each with its storyboard
// in /storyboards; only finished ones are listed here.

const VERSIONS: (VersionInfo & { render: (p: Record<string, string | undefined>) => React.ReactNode })[] = [
  {
    id: "notebook", name: "The notebook",
    idea: "The notebook you and your AI share. One running story: Monday you tell ChatGPT, Wednesday Claude knows, Friday it moves what you missed.",
    take: "Clear and honest, a benefit per section. Calm rather than spectacular.",
    parts: [{ key: "hero", label: "Hero", options: [{ id: "story", label: "Story, then try it" }, { id: "play", label: "Playground" }, { id: "window", label: "The real app window" }] }],
    render: (p) => <V1 hero={p.hero} />,
  },
  {
    id: "week", name: "The week",
    idea: "The whole product as one scrolled film: Monday ChatGPT writes your plan, Wednesday Claude reads it, Friday it moves what you missed, Sunday you tick the last run.",
    take: "The most cinematic. Scroll slowly through the middle.",
    render: () => <V2 />,
  },
  {
    id: "paper", name: "Paper",
    idea: "The picture book: each benefit is one cut-paper scene drawn for it, with one real piece of the app laid in as proof.",
    take: "The warmest and most ours. Lighter on demonstration than the others.",
    render: () => <V3 />,
  },
  {
    id: "remember", name: "It remembers",
    idea: "Problem first: every AI you use forgets you, your notebook doesn't. Then a few huge statements, each with one real proof.",
    take: "The boldest copy and the fewest words. Scroll the top slowly.",
    render: () => <V4 />,
  },
  {
    id: "life", name: "The week, then real life",
    idea: "The week film is the hero, its first frame on the first screen. Then three moments people really have: an evening walk by voice, the week's shopping, a brain dump. Then templates and every app you can bring notes from.",
    take: "Built from your picks: #2's film, real use cases instead of statements.",
    parts: [{ key: "hero", label: "Hero", options: [{ id: "side", label: "Beside the note" }, { id: "stack", label: "Band + stack of notes" }, { id: "single", label: "Band + one note" }] }],
    render: (p) => <V5 hero={p.hero} />,
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
