import type { Metadata } from "next";

// The home page in progress (/lab/home). Never in search, never in the sitemap, linked from nowhere
// on the site. It stays cream like the home page (lib/theme.ts).
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
