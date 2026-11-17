import { noteCard } from "@/lib/og/note-card";

// A shared note's share card (1200 × 630), at /og/n/<slug>. The note's page points og:image here.
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  return noteCard((await params).slug);
}
