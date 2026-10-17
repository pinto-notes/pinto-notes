import type { Metadata } from "next";
import { Home as Page } from "./_home/Home";
import { latestVersion } from "@/lib/changelog";
import { pageMetadata } from "@/lib/site";
import { JsonLd, app, incredible, maker, organization, website } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Pinto Notes: one notes app for every AI you use",
  shareTitle: "The notebook you and your AI share.",
  description:
    "A notes app for Mac that feels like Apple Notes. Claude, Claude Code, Codex and Incredible read and edit the same notes, with your approval. ChatGPT and the iPhone app are coming soon. Imports your Apple Notes. Free.",
  path: "/",
});

// The home page (app/_home): the hero, her note lifting off into a week in one note, three people
// already living like this, templates, everything else, and the download. /lab/home shows the same page.
export default function Home() {
  return (
    <>
      <JsonLd graph={[app(latestVersion()), organization, maker, incredible, website]} />
      <Page />
    </>
  );
}
