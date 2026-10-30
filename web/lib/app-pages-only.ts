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

/// The site's own address, for a site with only the app's pages: SITE_URL, else the address Vercel
/// gives the project. Its links that open the app (NEXT_PUBLIC_APP_LINK_ORIGIN, lib/app-scheme.ts)
/// follow it, so a build of your own needs no setting for them. Nothing for pintonotes.com.
export function appPagesOnlyEnv(env: Record<string, string | undefined> = process.env): Record<string, string> {
  if (env.APP_PAGES_ONLY !== "1" || env.NEXT_PUBLIC_APP_LINK_ORIGIN) return {};
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL;
  const site = env.SITE_URL?.startsWith("https://") ? env.SITE_URL : vercel ? `https://${vercel}` : undefined;
  return site ? { NEXT_PUBLIC_APP_LINK_ORIGIN: site.replace(/\/+$/, "") } : {};
}
