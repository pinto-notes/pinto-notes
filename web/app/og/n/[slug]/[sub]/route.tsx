import { noteCard } from "@/lib/og/note-card";

// A shared sub-note's share card (1200 × 630), at /og/n/<slug>/<sub>.
export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string; sub: string }> }) {
  const { slug, sub } = await params;
  return noteCard(slug, sub);
}
