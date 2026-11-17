import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NotePage } from "@/lib/NotePage";
import { summary, withoutTitle } from "@/lib/render";
import { noteShareImage } from "@/lib/og/note-card";
import { boardPicture, sharedFiles, sharedNote } from "@/lib/shared";

// Rendered on every visit, never cached: Stop Sharing and locking the note take the page
// down at once, and nothing of a note that was locked is served afterwards.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = await sharedNote(slug);
  if (!note) return { title: "Not shared · Pinto Notes" };
  // A whiteboard is described by its words, and its picture is the link's preview.
  const board = boardPicture(slug, note);
  const description = board ? summary(board.words.join(" · ")) || "A whiteboard shared from Pinto Notes." : summary(withoutTitle(note.body));
  // Next.js replaces the layout's openGraph and twitter rather than merging, so the card goes in both.
  const images = board && note.picture
    ? [{ url: board.url, width: note.picture.width, height: note.picture.height, alt: board.alt }]
    : [noteShareImage(slug, undefined, note.title)];
  return {
    title: `${note.title} · Pinto Notes`,
    description,
    openGraph: { title: note.title, description, siteName: "Pinto Notes", type: "article", images },
    twitter: { card: "summary_large_image", title: note.title, description, images },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const note = await sharedNote(slug);
  if (!note) notFound();
  const board = boardPicture(slug, note);
  // A board's page is its picture: it embeds no files.
  const files = board ? {} : await sharedFiles(slug);
  return <NotePage slug={slug} note={note} files={files} board={board} />;
}
