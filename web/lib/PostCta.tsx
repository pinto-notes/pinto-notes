"use client";

import DownloadLink from "@/app/DownloadLink";
import OpenInApp from "@/app/OpenInApp";
import { appURL } from "./app-scheme";
import { mailLink, sendLink } from "./platform";
import { APP_STORE_LIVE, APP_STORE_URL, SITE_URL } from "./site";
import type { Ui } from "./i18n/blog";
import s from "./post-parts.module.css";

/// A post's one call to action, at the end of its "How Pinto Notes helps" section. Every link in it
/// names the post, where in the post it sits and what it does (data-cta…), and lib/posthog.ts sends
/// that as blog_cta_clicked when it's clicked. A Mac gets the download, which also counts as
/// download_mac_clicked with the post's path. An iPhone is told where the iPhone app stands, and
/// anyone else that Pinto Notes is for iPhone and Mac; both can send themselves the link. The page
/// says which before first paint (lib/platform.ts), so nothing flashes or moves.
/// A translated post passes its language's words (`ui`) and its own path; its slug is "<lang>/<slug>",
/// so its clicks read apart from the English post's. The card then also says the app is in English.
/// A template post names its template (`template`): the card then ends with a link that opens that
/// template in Pinto Notes, for the readers who have the app already (experiment B16).
export function PostCta({ slug, position, title, children, appStoreLive = APP_STORE_LIVE, ui, path, template }: {
  slug: string; position: string; title: string; children: React.ReactNode; appStoreLive?: boolean; ui?: Ui["cta"]; path?: string; template?: string;
}) {
  const t = ui ?? EN;
  const cta = (action: string) => ({ "data-cta": slug, "data-cta-position": position, "data-cta-action": action });
  const url = `${SITE_URL}${path ?? `/blog/${slug}`}`;
  const send = (
    <a className="pi-send" href={mailLink(url)} onClick={(e) => sendLink(navigator, e, url)} {...cta("send_link")}>{t.send}</a>
  );
  return (
    <div className={s.cta}>
      <p className={s.ctaTitle}>{title}</p>
      {children}
      <DownloadLink className={`${s.ctaButton} pi-apple pi-not-ios`} {...cta("download_mac")}>{t.mac}</DownloadLink>
      <div className="pi pi-ios">
        {appStoreLive ? (
          <a className={s.ctaButton} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" {...cta("app_store")}>{t.iphone}</a>
        ) : (
          <>
            <p className="pi-line"><strong>{t.iphoneSoon}</strong> {t.iphoneSoonRest}</p>
            {send}
          </>
        )}
      </div>
      <div className="pi pi-other">
        <p className="pi-line"><strong>{t.other}</strong> {t.otherRest}</p>
        {send}
      </div>
      <p className={`${s.ctaFine} pi-apple pi-not-ios`}>{t.fineMac}{t.english ? ` ${t.english}` : ""}</p>
      {appStoreLive ? <p className={`${s.ctaFine} pi pi-ios`}>{t.fineIos}{t.english ? ` ${t.english}` : ""}</p> : null}
      {template ? (
        <p className={s.ctaFine}>
          {t.haveApp ?? EN.haveApp}{" "}
          <OpenInApp href={`/open/template/${template}`} app={appURL(`template/${template}`)} attrs={cta("open_template")}>{t.openTemplate ?? EN.openTemplate}</OpenInApp>
        </p>
      ) : null}
    </div>
  );
}

const EN: Ui["cta"] = {
  mac: "Download Pinto Notes for Mac",
  iphone: "Download for iPhone",
  send: "Send myself the link",
  iphoneSoon: "The iPhone app is coming to the App Store soon.",
  iphoneSoonRest: "Pinto Notes is on Mac today: send yourself the link to open there.",
  other: "Pinto Notes is for iPhone and Mac.",
  otherRest: "Send yourself the link to open on one.",
  fineMac: "Free, for macOS 26 or later. Importing from Apple Notes only reads it; nothing there changes.",
  fineIos: "Free, for iOS 26 or later.",
  english: "",
  haveApp: "Have Pinto Notes already?",
  openTemplate: "Open this template in it",
};
