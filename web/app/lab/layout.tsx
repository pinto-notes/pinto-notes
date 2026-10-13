import type { Metadata } from "next";

// Design studies for the home page (/lab/home-a, -b, -c, -e). Never in search, never in the sitemap,
// linked from nowhere on the site. A to C follow the visitor's system theme; E stays cream like the
// home page (lib/theme.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
