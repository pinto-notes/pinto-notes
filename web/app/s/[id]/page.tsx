import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NoteLink from "./NoteLink";

// A note's link, https://pintonotes.com/s/<id>#<secret>. Pinto Notes claims these links (the
// apple-app-site-association), so with the app installed they open the app, which joins the note.
// A browser that lands here tries the app by its own scheme, then says how to get it. The secret
// is in the fragment: it never reaches this server, and PostHog never loads here (lib/posthog.ts).
export const dynamic = "force-static";
export const dynamicParams = true;
export const metadata: Metadata = { title: "A shared note · Pinto Notes", robots: { index: false, follow: false } };

export const NOTE_LINK_ID = /^[A-Za-z0-9_-]{22}$/;

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!NOTE_LINK_ID.test(id)) notFound();
  return <NoteLink id={id} />;
}
