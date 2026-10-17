import type { Metadata } from "next";
import { G } from "../../_home/copy";
import { Home } from "../../_home/Home";

export const metadata: Metadata = { title: G.title, description: G.description };

// The home page in progress. Earlier versions and alternatives are in git history.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  return <Home jonas={q.jonas} />;
}
