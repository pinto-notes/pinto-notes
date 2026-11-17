import { boardAlt, boardWords, readSharedNote } from "@/lib/shared";
import type { BoardMeta } from "@/lib/board-live";

// What a shared whiteboard's open page asks every few seconds (lib/BoardLive.tsx): the version of
// its picture and scene, its title and when it was edited. Never the note's text, never cached.
// 404 when the link no longer shows anything (Stop Sharing, locked, deleted); 503 when the
// database couldn't be asked, so a hiccup never takes the picture off the page.
export const dynamic = "force-dynamic";

const headers = { "cache-control": "no-store" };

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let note;
  try {
    note = await readSharedNote(slug);
  } catch {
    note = undefined;
  }
  if (note === undefined) return Response.json({ error: "unavailable" }, { status: 503, headers });
  if (!note) return Response.json({ error: "not_found" }, { status: 404, headers });
  const meta: BoardMeta = {
    title: note.title,
    updated_at: note.updated_at,
    alt: boardAlt(boardWords(note.body)),
    picture: note.picture ? { version: note.picture.version, width: note.picture.width, height: note.picture.height } : null,
    scene: note.scene ? { version: note.scene.version, size: note.scene.size } : null,
  };
  return Response.json(meta, { headers });
}
