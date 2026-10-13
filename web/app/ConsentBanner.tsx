"use client";

import { useEffect, useState } from "react";
import { bannerAsks, CONSENT_OPEN_EVENT, storedChoice, type ConsentChoice } from "@/lib/consent";
import { browserOptedOut, readConsent, recordChoice } from "./posthog-client";

/// How far the visitor scrolls, or how long they stay, before the banner asks: the first screen (the
/// promise and the product) is never covered on arrival.
export const ASK_AFTER_PX = 480;
export const ASK_AFTER_MS = 12000;

/// The cookie banner (lib/consent.ts): a small card in the bottom left corner that never covers the
/// page's middle or blocks it. It asks once, after the first screen; the footer's Cookie settings opens it again.
/// Reject and Accept are the same size and both plainly readable; Accept sits on the right in the
/// site's primary button colour, like Download for Mac. SiteAnalytics renders it only where PostHog may run.
export default function ConsentBanner({ apiKey, host }: { apiKey: string; host: string }) {
  const [open, setOpen] = useState(false);
  const [asked, setAsked] = useState(true); // false when the footer link opened it
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [optedOut, setOptedOut] = useState(false);

  useEffect(() => {
    const stored = storedChoice(readConsent());
    const dnt = browserOptedOut();
    setChoice(stored);
    setOptedOut(dnt);
    // Asking waits until the visitor scrolls past the first screen, or has stayed a while.
    let timer = 0;
    const stop = () => { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
    const ask = () => { stop(); setOpen(true); };
    const onScroll = () => { if (window.scrollY > ASK_AFTER_PX) ask(); };
    if (bannerAsks(true, dnt, stored)) {
      timer = window.setTimeout(ask, ASK_AFTER_MS);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    const reopen = () => {
      stop();
      setChoice(storedChoice(readConsent()));
      setAsked(false);
      setOpen(true);
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => { stop(); window.removeEventListener(CONSENT_OPEN_EVENT, reopen); };
  }, []);

  if (!open) return null;

  const choose = (c: ConsentChoice) => {
    setChoice(c);
    setOpen(false);
    void recordChoice(apiKey, host, c);
  };

  return (
    <section className="consent" role="region" aria-label="Cookies">
      {optedOut ? (
        <p className="consent-text">Your browser asks sites not to track you, so this one doesn&rsquo;t, and won&rsquo;t ask.</p>
      ) : (
        <p className="consent-text">
          Accept to let us remember your visits, so we can see what helps people find Pinto Notes.{" "}
          <a href="/privacy#cookies-and-storage-on-the-website">Details</a>
          {!asked && choice && <span className="consent-now"> You chose {choice === "accepted" ? "Accept" : "Reject"}.</span>}
        </p>
      )}
      <div className="consent-actions">
        {optedOut ? (
          <button type="button" className="consent-button" onClick={() => setOpen(false)}>OK</button>
        ) : (
          <>
            <button type="button" className="consent-button" aria-pressed={!asked ? choice === "rejected" : undefined} onClick={() => choose("rejected")}>Reject</button>
            <button type="button" className="consent-button consent-accept" aria-pressed={!asked ? choice === "accepted" : undefined} onClick={() => choose("accepted")}>Accept</button>
          </>
        )}
      </div>
    </section>
  );
}
