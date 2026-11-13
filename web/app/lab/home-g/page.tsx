import type { Metadata } from "next";
import { HomeG } from "./HomeG";

export const metadata: Metadata = {
  title: "Pinto Notes: notes, whiteboards and apps your AI works in",
  description: "Notes, whiteboards and small apps for Mac and iPhone. ChatGPT, Claude, Claude Code and Codex can read and change them. Free and open source.",
};

// Study G, the window (BRIEF in content-tools/projects/pinto-home-big3).
export default function Page() {
  return <HomeG />;
}
