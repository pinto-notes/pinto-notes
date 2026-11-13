import type { Metadata } from "next";
import { HomeH } from "./HomeH";

export const metadata: Metadata = {
  title: "Pinto Notes: write, draw and build with your AI",
  description: "Notes that feel like Apple Notes, whiteboards and small apps, for Mac and iPhone. ChatGPT, Claude, Claude Code and Codex work in them with you. Free and open source.",
};

// Study H, "Write. Draw. Build.": three words carry the page.
export default function Page() {
  return <HomeH />;
}
