/// Paid campaigns, such as ads in ChatGPT. An ad's link lands with ?utm_medium=paid, a
/// utm_source (who shows the ad, e.g. chatgpt_ads), a utm_campaign and an optional utm_content
/// (which version of the ad). Only paid links count: ChatGPT itself adds utm_source=chatgpt.com to
/// the pages it cites, and that is not an ad.
///
/// The tag is held in memory for the visit, never in a cookie or in storage, so it is gone when the
/// tab closes or the page reloads. While it is held:
/// - the site's named clicks (the App Store, the Mac download) carry it to PostHog
///   (app/PostHogAnalytics.tsx), so a report can say which ad led to a download click;
/// - App Store links get Apple's campaign parameters (pt and ct, app/CampaignLinks.tsx), so App Store
///   Connect's App Analytics counts the page views, downloads and sessions that came from each ad.
///   Apple counts only people who share analytics with developers, and tells us totals, not people.
///
/// A visit without a paid campaign gets an organic source instead (organicSourceFrom), so App Store
/// Connect also counts downloads from ChatGPT's answers, Google and the rest. It is decided by the
/// first page of the visit and held the same way, in memory only. A paid campaign always wins.

export type Campaign = { source: string; medium: "paid"; name: string; content: string };

/// The provider token from App Store Connect (App Analytics, Acquisition, Campaigns, Generate a
/// campaign link). It is the same for every app of the account and is public: every campaign link
/// shows it. Without it, App Store links are left as they are.
export const APPLE_PROVIDER_TOKEN = "129528541";

/// A tag value: letters, digits, dot, dash and underscore, 1 to 40 characters.
const VALUE = /^[a-z0-9][a-z0-9._-]{0,39}$/;
/// Apple's ct: up to 40 characters.
const CT_MAX = 40;

function value(params: URLSearchParams, key: string): string | null {
  const v = params.get(key)?.trim().toLowerCase() ?? "";
  return VALUE.test(v) ? v : null;
}

/// The paid campaign a page address names, or null when it names none or a value is malformed.
export function campaignFrom(search: string | null | undefined): Campaign | null {
  const params = new URLSearchParams(search ?? "");
  if (params.get("utm_medium")?.trim().toLowerCase() !== "paid") return null;
  const source = value(params, "utm_source");
  const name = value(params, "utm_campaign");
  if (!source || !name) return null;
  const content = params.has("utm_content") ? value(params, "utm_content") : "";
  if (content === null) return null;
  return { source, medium: "paid", name, content };
}

/// What a named event carries for the campaign: nothing without one.
export function campaignProperties(c: Campaign | null): Record<string, string> {
  if (!c) return {};
  return { campaign_source: c.source, campaign_medium: c.medium, campaign_name: c.name, ...(c.content ? { campaign_content: c.content } : {}) };
}

/// Apple's campaign token: source, campaign and ad version, cut to 40 characters.
export function appleCampaignToken(c: Campaign): string {
  return [c.source, c.name, c.content].filter(Boolean).join("-").slice(0, CT_MAX);
}

/// An App Store link with Apple's campaign parameters added, or null when there is nothing to add:
/// no campaign, no provider token, or not an App Store link. A link's own query stays (the Mac
/// listing's ?platform=mac), and mt says which store: 12 for the Mac, 8 for iPhone.
export function withAppleCampaign(href: string, c: Campaign | null, providerToken: string = APPLE_PROVIDER_TOKEN): string | null {
  return withAppleToken(href, c ? appleCampaignToken(c) : null, providerToken);
}

/// An App Store link with Apple's campaign parameters for a ready-made ct, or null when there is
/// nothing to add (see withAppleCampaign).
export function withAppleToken(href: string, ct: string | null, providerToken: string = APPLE_PROVIDER_TOKEN): string | null {
  if (!ct || !/^\d+$/.test(providerToken)) return null;
  let url: URL;
  try { url = new URL(href); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname !== "apps.apple.com") return null;
  url.searchParams.set("pt", providerToken);
  url.searchParams.set("ct", ct.slice(0, CT_MAX));
  url.searchParams.set("mt", url.searchParams.get("platform") === "mac" ? "12" : "8");
  return url.toString();
}

/// Where an unpaid visit came from, by the address it was linked by (the referrer) or its utm_source.
/// The AI apps come first: gemini.google.com is Gemini, not Google search.
const ORGANIC: [source: string, hosts: RegExp][] = [
  ["chatgpt", /(?:^|\.)(?:chatgpt\.com|chat\.openai\.com)$/],
  ["perplexity", /(?:^|\.)perplexity\.ai$/],
  ["claude", /(?:^|\.)claude\.ai$/],
  ["gemini", /^(?:gemini|bard)\.google\.com$/],
  ["copilot", /^copilot\.(?:microsoft\.com|cloud\.microsoft)$/],
  ["google", /^(?:www\.)?google\.[a-z]{2,3}(?:\.[a-z]{2})?$|^com\.google\.android\.googlequicksearchbox$/],
  ["bing", /(?:^|\.)bing\.com$/],
  ["ddg", /(?:^|\.)duckduckgo\.com$/],
];

function organicSource(host: string): string | null {
  return ORGANIC.find(([, hosts]) => hosts.test(host))?.[0] ?? null;
}

function hostOf(address: string): string | null {
  try { return new URL(address).hostname.toLowerCase() || null; } catch { return null; }
}

/// Where the visit started: a blog post (in any language), a template page or the home page.
function entryKind(pathname: string): string {
  if (/^\/(?:(?:de|es|fr|it|pt)\/)?blog(?:\/|$)/.test(pathname)) return "blog";
  if (/^\/templates(?:\/|$)/.test(pathname)) return "tpl";
  if (pathname === "/" || pathname === "") return "home";
  return "";
}

const bare = (host: string) => host.replace(/^www\./, "");

/// Apple's ct for a visit without a paid campaign: org-<source>, plus where the visit started when
/// that fits (org-chatgpt-blog). Sources: chatgpt (utm_source=chatgpt.com or its referrer),
/// perplexity, claude, gemini, copilot, google, bing, ddg, ref for any other outside site, and direct
/// for no referrer and no utm. Null when the referrer is this site: that page is not the start of the
/// visit, so it can't tell where the visit came from.
export function organicSourceFrom(search: string | null | undefined, referrer: string | null | undefined, pathname: string, siteHost: string): string | null {
  const params = new URLSearchParams(search ?? "");
  const utmSource = params.get("utm_source")?.trim().toLowerCase() ?? "";
  const refHost = referrer ? hostOf(referrer) : null;
  if (refHost && bare(refHost) === bare(siteHost.toLowerCase())) return null;
  const hasUtm = [...params.keys()].some((k) => k.startsWith("utm_"));
  const source =
    (utmSource === "chatgpt.com" ? "chatgpt" : null) ??
    (refHost ? organicSource(refHost) : null) ??
    (utmSource ? organicSource(utmSource) : null) ??
    (refHost || hasUtm ? "ref" : "direct");
  const token = `org-${source}`;
  const kind = entryKind(pathname);
  return kind && token.length + 1 + kind.length <= CT_MAX ? `${token}-${kind}` : token.slice(0, CT_MAX);
}

let held: Campaign | null = null;
let organic: string | null = null;
let organicDecided = false;

/// Holds the campaign this page address names, for the rest of the visit. A later page without
/// one keeps the earlier one; a page with another campaign replaces it.
export function holdCampaign(search: string | null | undefined): Campaign | null {
  const c = campaignFrom(search);
  if (c) held = c;
  return held;
}

/// The campaign this visit came from, or null.
export function heldCampaign(): Campaign | null {
  return held;
}

/// Holds the organic source of the visit's first page (organicSourceFrom). Later pages don't
/// change it, whatever their referrer or address says.
export function holdOrganicSource(search: string | null | undefined, referrer: string | null | undefined, pathname: string, siteHost: string): string | null {
  if (!organicDecided) {
    organic = organicSourceFrom(search, referrer, pathname, siteHost);
    organicDecided = true;
  }
  return organic;
}

/// Apple's ct for this visit: the paid campaign's when there is one, else the organic source's.
export function heldAppleToken(): string | null {
  return held ? appleCampaignToken(held) : organic;
}

/// For tests: forget the held campaign and organic source.
export function forgetCampaign(): void {
  held = null;
  organic = null;
  organicDecided = false;
}
