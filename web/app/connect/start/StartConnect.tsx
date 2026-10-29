"use client";

import { useEffect, useState } from "react";
import { preFrom, redeemRequest, savePre, startParams, startTarget, type StoredPre } from "@/lib/connect-browser";
import { EndedScreen, WorkingScreen } from "../ConnectScreens";
import { BrowserFrame } from "../BrowserScreens";

const local = () => { try { return window.localStorage; } catch { return null; } };

/// Swaps the app's one-time ticket for this browser's key, then goes on to the AI's page. The
/// ticket leaves the address bar first. Any failure says to press Connect in the app again.
export default function StartConnect({ mcp }: { mcp: string }) {
  const [ai, setAI] = useState<StoredPre["ai"] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const { ticket, to } = startParams(window.location.hash);
    window.history.replaceState(null, "", window.location.pathname);
    if (!ticket) return setFailed(true);
    void (async () => {
      try {
        const res = await fetch(...redeemRequest(mcp, ticket));
        const pre = res.ok ? preFrom(await res.json().catch(() => null)) : null;
        if (!pre) return setFailed(true);
        setAI(pre.ai);
        savePre(local(), pre);
        window.location.replace(startTarget(to, pre.ai));
      } catch {
        setFailed(true);
      }
    })();
    // Runs once, for the address the page was opened with.
  }, []);

  return (
    <BrowserFrame ai={ai} done={false}>
      {failed
        ? <EndedScreen title="This link has expired" text="Choose Connect in Pinto Notes again." />
        : <WorkingScreen text={ai ? `Opening ${ai}…` : "Loading…"} />}
    </BrowserFrame>
  );
}
