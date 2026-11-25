// THE WEBSITE'S TELEMETRY CHOKEPOINT (docs/Technical/telemetry-inventory.md).
//
// The website has no signed-in pages that send analytics, so its switch is the visitor's own
// choice in this browser (the device fallback of the apps' Share diagnostics and usage switch):
// Reject in the cookie banner (app/ConsentBanner.tsx), Do Not Track or Global Privacy Control.
// Any of them, and nothing is sent: no PostHog event of any kind (cookieless ones included), no
// session replay, no Vercel Web Analytics page view, no download count, no email click count.
//
// Every way the site reports usage asks here:
//   - PostHog: every event passes posthogOptions' before_send, which asks browserTelemetryAllowed,
//     and the site's own events go through track() in app/posthog-client.ts, which asks too;
//   - Vercel Web Analytics: beforeSend is vercelEvent, below;
//   - the Mac download count (lib/downloads.ts countDownload) and the email click count
//     (app/go/route.ts) ask requestTelemetryAllowed with the request's headers, which carry the
//     opt-out cookie set here when the visitor rejects.
// lib/telemetry-guard.test.ts fails when anything reaches PostHog, Vercel Analytics or a count
// any other way.
import { analyticsEvent } from "./analytics";
import { CONSENT_KEY, type ConsentChoice, storedChoice } from "./consent";
import { visitorOptedOut } from "./posthog";

/// Set when the visitor rejects, so the server routes (which can't read localStorage) know too.
/// Holds no id: it says only "don't count me".
export const OPT_OUT_COOKIE = "pinto_no_analytics";

export type Signals = { consent: string | null | undefined; optedOut: boolean };

/// THE GATE: whether this visitor may be counted at all.
export function telemetryAllowed(s: Signals): boolean {
  return !s.optedOut && storedChoice(s.consent) !== "rejected";
}

/// The gate in the browser: the banner's stored answer, Do Not Track and Global Privacy Control.
export function browserTelemetryAllowed(): boolean {
  if (typeof window === "undefined") return false;
  let consent: string | null = null;
  try { consent = window.localStorage.getItem(CONSENT_KEY); } catch { /* storage blocked: no answer */ }
  const optedOut = visitorOptedOut(navigator as Navigator & { globalPrivacyControl?: boolean }, window as Window & { doNotTrack?: string | null });
  return telemetryAllowed({ consent, optedOut });
}

/// The gate on the server, from a request's headers: the opt-out cookie, Sec-GPC or DNT.
export function requestTelemetryAllowed(headers: Headers): boolean {
  if (headers.get("sec-gpc") === "1" || headers.get("dnt") === "1") return false;
  const cookies = (headers.get("cookie") ?? "").split(";").map((c) => c.trim());
  return !cookies.includes(`${OPT_OUT_COOKIE}=1`);
}

/// Keeps the opt-out cookie in step with the banner's answer.
export function rememberChoiceForServer(choice: ConsentChoice): void {
  try {
    document.cookie = choice === "rejected"
      ? `${OPT_OUT_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax; secure`
      : `${OPT_OUT_COOKIE}=; path=/; max-age=0; samesite=lax; secure`;
  } catch { /* no cookies: the server falls back to DNT and GPC */ }
}

/// What Vercel Web Analytics may send: nothing for a visitor who said no, otherwise the page's
/// address only (lib/analytics.ts).
export function vercelEvent<T extends { url: string }>(event: T): T | null {
  return browserTelemetryAllowed() ? analyticsEvent(event) : null;
}
