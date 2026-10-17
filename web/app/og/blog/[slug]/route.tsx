import { renderPostCard } from "@/lib/og/render";
import { post, published } from "@/lib/posts";

// Each blog post's share card (1200 × 630): its cover, large, on its own ground, beside its title. Built at build time, one PNG
// per published post, at /og/blog/<slug>. postMetadata points og:image and twitter:image here.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return published().map((p) => ({ slug: p.slug }));
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const x = post((await params).slug);
  // The card cover's JPEG copy in lib/og/covers/covers is named like the cover in public/blog/covers.
  return renderPostCard({ cover: x.thumb.src.replace(/^\/blog\/(covers\/)?/, "").replace(/\.webp$/, ""), title: x.title, kind: x.category });
}
