import type { CaptureOptions, PostHog, Properties } from "posthog-js";
import { CONSENT_KEY, type ConsentChoice } from "@/lib/consent";
import { posthogOptions, REPLAY_REMOTE_CONFIG, replayAllowed, visitorOptedOut } from "@/lib/posthog";
import { browserTelemetryAllowed, rememberChoiceForServer } from "@/lib/telemetry-gate";

// The only file that loads PostHog or calls its capture (lib/telemetry-guard.test.ts). Everything
// goes through the website's telemetry gate (lib/telemetry-gate.ts).

let loading: Promise<PostHog | null> | undefined;

/// Do Not Track or Global Privacy Control in this browser.
export function browserOptedOut(): boolean {
  return visitorOptedOut(navigator as Navigator & { globalPrivacyControl?: boolean }, window as Window & { doNotTrack?: string | null });
}

/// PostHog is fetched and started once, the first time a public page asks for it, and not at all
/// for a visitor who rejected, or sends Do Not Track or Global Privacy Control (the gate).
export function startPostHog(key: string, host: string): Promise<PostHog | null> {
  if (!loading && !browserTelemetryAllowed()) return Promise.resolve(null);
  loading ??= browserOptedOut()
    ? Promise.resolve(null)
    // Dead clicks are a PostHog extension it would otherwise fetch from its own servers; it comes
    // with the site instead, so the page still talks to the capture endpoint only.
    : import("posthog-js/dist/dead-clicks-autocapture")
      .then(() => import("posthog-js"))
      .then(({ default: posthog }) => posthog.init(key, posthogOptions(host, browserTelemetryAllowed)) ?? posthog)
      .then((posthog) => {
        // Replay failing to start never stops the rest.
        syncReplay(posthog, window.location.pathname).catch(() => undefined);
        return posthog;
      })
      .catch(() => null);
  return loading;
}

/// Records this page as a session replay when replayAllowed says so, and stops recording when it
/// doesn't (a private page, or the visitor rejected). The recorder comes with the site, fetched
/// only for a visitor who accepted, so the page still talks to the capture endpoint only.
export async function syncReplay(posthog: PostHog, path: string): Promise<void> {
  if (!replayAllowed(path, readConsent(), browserOptedOut())) {
    if (posthog.sessionRecordingStarted()) posthog.stopSessionRecording();
    return;
  }
  if (posthog.sessionRecordingStarted()) return;
  await import("posthog-js/dist/posthog-recorder");
  posthog.sessionRecording?.onRemoteConfig({ ok: true, config: REPLAY_REMOTE_CONFIG as never });
  posthog.startSessionRecording();
}

/// The same for a page change, without loading PostHog on a page that never asked for it.
export function replayOnPage(path: string): void {
  void loading?.then((posthog) => posthog && syncReplay(posthog, path)).catch(() => undefined);
}

/// One of the site's own events: only through the gate.
export function track(posthog: PostHog | null, event: string, properties?: Properties, options?: CaptureOptions): void {
  if (!posthog || !browserTelemetryAllowed()) return;
  posthog.capture(event, properties, options);
}

/// The visitor's answer from the banner, kept first so the gate knows it at once. Accepting lets
/// PostHog keep its cookie. Rejecting stops everything: no event of any kind is sent after it (not
/// even one saying so), replay stops, PostHog's cookie and window marker go, and the server routes
/// are told by a cookie of our own.
export async function recordChoice(key: string, host: string, choice: ConsentChoice): Promise<void> {
  try { localStorage.setItem(CONSENT_KEY, choice === "accepted" ? "1" : "0"); } catch { /* storage blocked: asked again next visit */ }
  rememberChoiceForServer(choice);
  if (choice === "accepted") {
    const posthog = await startPostHog(key, host);
    if (!posthog) return;
    posthog.opt_in_capturing({ captureEventName: "cookies_accepted" });
    await syncReplay(posthog, window.location.pathname).catch(() => undefined);
    return;
  }
  const posthog = loading ? await loading : null;
  if (posthog) {
    posthog.stopSessionRecording();
    posthog.opt_out_capturing();
  }
  // PostHog removes its cookie, but leaves the tab's window marker in sessionStorage.
  try {
    for (const k of Object.keys(sessionStorage)) if (k.startsWith("ph_")) sessionStorage.removeItem(k);
  } catch { /* storage blocked: nothing there */ }
}

/// The stored answer's raw value, or null when there is none or storage is blocked.
export function readConsent(): string | null {
  try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
}
