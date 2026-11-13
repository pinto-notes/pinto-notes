/// Short addresses for the links on our social profiles and in video descriptions. Each one lands on
/// the home page with utm tags, which PostHog keeps as utm_source and utm_medium (lib/posthog.ts strips
/// only the query from page addresses). Instagram's and TikTok's in-app browsers often send no
/// referrer, so without these a visit from a bio link counts as "direct".
export const SOURCE_LINKS: Record<string, { source: string; medium: string }> = {
  ig: { source: "instagram", medium: "bio" },
  tt: { source: "tiktok", medium: "bio" },
  x: { source: "x", medium: "bio" },
  yt: { source: "youtube", medium: "bio" },
  ytv: { source: "youtube", medium: "video" },
  gh: { source: "github", medium: "repo" },
};

/// Temporary redirects, so a link can be pointed somewhere else later.
export function sourceLinkRedirects() {
  return Object.entries(SOURCE_LINKS).map(([path, { source, medium }]) => ({
    source: `/${path}`,
    destination: `/?utm_source=${source}&utm_medium=${medium}`,
    permanent: false,
  }));
}
