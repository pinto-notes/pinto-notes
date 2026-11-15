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
  if (!c || !/^\d+$/.test(providerToken)) return null;
  let url: URL;
  try { url = new URL(href); } catch { return null; }
  if (url.protocol !== "https:" || url.hostname !== "apps.apple.com") return null;
  url.searchParams.set("pt", providerToken);
  url.searchParams.set("ct", appleCampaignToken(c));
  url.searchParams.set("mt", url.searchParams.get("platform") === "mac" ? "12" : "8");
  return url.toString();
}

let held: Campaign | null = null;

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

/// For tests: forget the held campaign.
export function forgetCampaign(): void {
  held = null;
}
