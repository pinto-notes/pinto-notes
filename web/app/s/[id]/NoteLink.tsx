"use client";

import { useEffect, useState } from "react";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { Card, Mark, ui } from "@/lib/ui";
import { appURL } from "@/lib/app-scheme";
import { tryApp } from "../../open/try-app";
import s from "../../open/open.module.css";

const SECRET = /^[A-Za-z0-9_-]{22}$/;

/// The app's link for a note's link: `<scheme>://s/<id>#<secret>`, or null when the address
/// isn't a whole link. Nothing else from the address goes into it.
export function appLink(id: string, hash: string): string | null {
  const secret = hash.replace(/^#/, "");
  return /^[A-Za-z0-9_-]{22}$/.test(id) && SECRET.test(secret) ? `${appURL("s")}/${id}#${secret}` : null;
}

/// Tries Pinto Notes as the page loads; if it doesn't open within about 1.5 s, says how to get it.
export default function NoteLink({ id }: { id: string }) {
  const [href, setHref] = useState<string | null>(null);
  const [state, setState] = useState<"trying" | "opened" | "fallback" | "broken">("fallback");
  useEffect(() => {
    const link = appLink(id, window.location.hash);
    if (!link) { setState("broken"); return; }
    setHref(link);
    setState("trying");
    return tryApp(link, 1500, (opened) => setState(opened ? "opened" : "fallback"));
  }, [id]);

  if (state === "broken") {
    return (
      <div className={`${ui.stage} ${ui.stageInSite} ${s.page}`}>
        <Card>
          <Mark />
          <div className={ui.group}>
            <h1 className={ui.title}>This link isn&apos;t complete</h1>
            <p className={ui.lede}>Part of it is missing. Ask the person who shared the note to send it again.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${ui.stage} ${ui.stageInSite} ${s.page}`} data-state={state}>
      <Card className={s.anim}>
        <Mark />
        <div className={ui.group}>
          <h1 className={ui.title}>
            <span className={s.whenTrying}>Opening Pinto Notes</span>
            <span className={s.whenOpened}>Opened in Pinto Notes</span>
            <span className={s.whenFallback}>A note was shared with you</span>
          </h1>
          <p className={ui.lede}>It opens in Pinto Notes, on iPhone or Mac, where you can read it or edit it with the people in it.</p>
        </div>
        <p className={`${s.status} ${s.whenTrying}`} role="status"><i className={s.dot} aria-hidden="true" />Looking for Pinto Notes on this device</p>
        <ol className={`${s.steps} ${s.whenFallback}`}>
          <li>Get Pinto Notes and sign in.</li>
          <li>Open this link again, or choose <b>Open in Pinto Notes</b> below.</li>
        </ol>
        <div className={`${s.stack} ${s.whenFallback}`}>
          {href && <a className={ui.primary} href={href}>Open in Pinto Notes</a>}
          <a className={ui.secondary} href="/download/mac">Download for Mac</a>
          {APP_STORE_LIVE
            ? <a className={ui.secondary} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get it for iPhone</a>
            : <p className={s.soon}>iPhone app: coming soon</p>}
        </div>
        {href && <p className={`${ui.small} ${s.again} ${s.whenOpened}`}>Didn&apos;t open? <a href={href}>Open Pinto Notes</a></p>}
      </Card>
    </div>
  );
}
