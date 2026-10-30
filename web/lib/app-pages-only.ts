// A site with only the pages a build of your own needs (docs/MAKE-IT-YOURS.md): build it with
// APP_PAGES_ONLY=1 and the home page, the blog, the changelog, downloads and help are 404s. What
// stays is what the app and its backend use: connecting an AI (/connect, /open/connect), password
// resets, share links (/s, /n), the app's /open links, reports, and the template data the AI server
// reads (/templates/<slug>.json, /api).

/// Pinto Notes' own pages: its pitch, posts and downloads, which a build of your own doesn't serve.
export const PINTO_PAGES = [
  "/", "/blog", "/blog/:path*", "/changelog", "/changelog/:path*", "/download", "/download/:path*",
  "/help", "/help/:path*", "/lab", "/lab/:path*", "/amber-notes", "/amber-notes/:path*", "/go/:path*",
  "/privacy-security", "/llms.txt", "/llms-full.txt", "/sitemap.xml",
];

/// Rewrites for next.config.ts's beforeFiles: each of Pinto Notes' pages to a page that doesn't
/// exist, so it answers 404. None when the flag is off, so pintonotes.com is unchanged.
export function appPagesOnlyRewrites(flag = process.env.APP_PAGES_ONLY) {
  if (flag !== "1") return [];
  return PINTO_PAGES.map((source) => ({ source, destination: "/app-pages-only/not-here" }));
}
