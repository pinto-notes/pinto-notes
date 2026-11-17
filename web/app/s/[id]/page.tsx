import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BoardPage from "./BoardPage";

// A note's link, https://pintonotes.com/s/<id>#<secret>. Pinto Notes claims these links (the
// apple-app-site-association), so with the app installed they open the app, which joins the note.
// A browser that lands here opens a shared whiteboard right here, live (BoardPage.tsx): read only
// until someone with an Edit link signs in. Any other note tries the app by its own scheme, then
// says how to get it (NoteLink.tsx). The secret is in the fragment: it never reaches this server,
// and PostHog never loads here (lib/posthog.ts).
export const dynamic = "force-static";
export const dynamicParams = true;
export const metadata: Metadata = { title: "A shared note · Pinto Notes", robots: { index: false, follow: false } };

const NOTE_LINK_ID = /^[A-Za-z0-9_-]{22}$/;

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  if (!NOTE_LINK_ID.test(id)) notFound();
  return <BoardPage id={id} supabaseURL={process.env.SUPABASE_URL ?? ""} anonKey={process.env.SUPABASE_ANON_KEY ?? ""} />;
}
