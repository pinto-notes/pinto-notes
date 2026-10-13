import type { Metadata } from "next";

// Design studies for the home page (/lab/home-a, -b, -c). Never in search, never in the sitemap,
// linked from nowhere on the site. They follow the visitor's system theme (lib/theme.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
