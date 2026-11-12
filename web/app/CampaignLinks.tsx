"use client";

import { useEffect } from "react";
import { heldCampaign, holdCampaign, withAppleCampaign } from "@/lib/campaign";
import { posthogAllowed } from "@/lib/posthog";

/// Paid campaigns (lib/campaign.ts): holds an ad's tag for the visit, in memory only, and adds
/// Apple's campaign parameters to an App Store link at the moment it is clicked, so App Store Connect
/// can count the downloads each ad led to. Without a held campaign, or on a private page, links are
/// left as they are.
export default function CampaignLinks({ path }: { path: string | null }) {
  useEffect(() => {
    if (!posthogAllowed(path)) return;
    holdCampaign(window.location.search);
  }, [path]);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement) || !posthogAllowed(window.location.pathname)) return;
      const tagged = withAppleCampaign(a.href, heldCampaign());
      if (tagged) a.href = tagged;
    };
    // Capture phase, before the browser follows the link.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
