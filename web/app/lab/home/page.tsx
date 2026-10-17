import type { Metadata } from "next";
import { G } from "../../_home/copy";
import { Home } from "../../_home/Home";

export const metadata: Metadata = { title: G.title, description: G.description };

// The home page in progress. Earlier versions and alternatives are in git history.
export default function Page() {
  return <Home />;
}
