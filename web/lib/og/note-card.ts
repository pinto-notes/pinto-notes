import { summary, withoutTitle } from "@/lib/render";
import { sharedNote } from "@/lib/shared";
import { renderNoteCard } from "./render";

/// The share card for a shared note, or 404 when the note isn't shared (any more). Never cached, like
/// the page: Stop Sharing and locking take the card down with it.
export async function noteCard(slug: string, sub?: string): Promise<Response> {
  const note = await sharedNote(slug, sub);
  if (!note) return new Response("Not shared", { status: 404, headers: { "cache-control": "no-store" } });
  const card = renderNoteCard({ title: note.title, body: summary(withoutTitle(note.body), 150) });
  card.headers.set("cache-control", "no-store");
  return card;
}

/// og:image and twitter:image for a shared note's page.
export function noteShareImage(slug: string, sub?: string, title?: string) {
  return { url: `/og/n/${slug}${sub ? `/${sub}` : ""}`, width: 1200, height: 630, alt: title ? `${title}, a note shared from Pinto Notes` : "A note shared from Pinto Notes" };
}
