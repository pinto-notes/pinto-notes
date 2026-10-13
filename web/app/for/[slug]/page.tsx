import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage, landingMetadata } from "@/lib/Landing";
import { landing, landings } from "@/lib/landings";

// The landing pages for an AI app you already use (lib/landings.ts), built once each.
export const dynamic = "force-static";
export const dynamicParams = false;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return landings.filter((x) => x.kind === "for").map((x) => ({ slug: x.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const x = landing("for", (await params).slug);
  return x ? landingMetadata(x) : {};
}

export default async function Page({ params }: Props) {
  const x = landing("for", (await params).slug);
  if (!x) notFound();
  return <LandingPage x={x} />;
}
