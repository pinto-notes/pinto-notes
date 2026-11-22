"use client";

import DownloadLink from "@/app/DownloadLink";
import OpenInApp from "@/app/OpenInApp";
import { appURL } from "./app-scheme";
import { mailLink, sendLink } from "./platform";
import { APP_STORE_LIVE, APP_STORE_URL, SITE_URL } from "./site";
import type { Ui } from "./i18n/blog";
import s from "./post-parts.module.css";
import { AIConnect } from "./AIConnect";
import { AIGlyph } from "./ai-glyphs";

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
/// `look` (experiment B34, 21 Nov 2026, after Emil called the plain card boring): "scene" puts one of the home page's own
/// pictures beside the words, like a small home hero; "connect" opens with ChatGPT and Claude joined to a note, for cards
/// that are about them; "note" draws the next steps as a checklist; "plain" is the card as it was. By default a card whose
/// title names ChatGPT, Claude or an AI gets "connect", and every other card "scene".
export type CtaLook = "plain" | "scene" | "connect" | "note";
const AI_TITLE = /\b(ChatGPT|Claude|Codex|Gemini|Grok|AI|KI|IA)\b/;
export const ctaLook = (title: string): CtaLook => (AI_TITLE.test(title) ? "connect" : "scene");
export function PostCta({ slug, position, title, children, appStoreLive = APP_STORE_LIVE, ui, path, template, look: chosen, steps }: {
  slug: string; position: string; title: string; children: React.ReactNode; appStoreLive?: boolean; ui?: Ui["cta"]; path?: string; template?: string;
  look?: CtaLook; steps?: string[];
}) {
  const t = ui ?? EN;
  const look = chosen ?? ctaLook(title);
  const cta = (action: string) => ({ "data-cta": slug, "data-cta-position": position, "data-cta-action": action });
  const url = `${SITE_URL}${path ?? `/blog/${slug}`}`;
  const send = (
    <a className="pi-send" href={mailLink(url)} onClick={(e) => sendLink(navigator, e, url)} {...cta("send_link")}>{t.send}</a>
  );
  const body = (
    <>
      <p className={s.ctaTitle}>{title}</p>
      {look === "note" ? (
        <ul className={s.ctaSteps}>
          {(steps ?? ["Download Pinto Notes, free", "Bring your notes over in one import", "Connect ChatGPT or Claude"]).map((x, i, all) => (
            <li key={x} data-first={i === 0 || undefined}><span className={s.ctaCircle} aria-hidden="true" />{x}
              {i === all.length - 1 && !steps ? <span className={s.ctaMarks} aria-hidden="true"><AIGlyph name="openai" size={18} color="#0d0d0d" /><AIGlyph name="claude" size={18} color="#d97757" /></span> : null}
            </li>
          ))}
        </ul>
      ) : children}
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
    </>
  );
  // Under the short answer the card stays a row: a small picture beside the words, so the answer, not the card, holds the
  // first screen (Emil, 21 Nov 2026: "too much focus on Pinto Notes here, it's like half the screen on first open").
  // Cards further down keep the big picture.
  if (position === "answer" && (look === "scene" || look === "connect")) return (
    <div className={`${s.cta} ${s.ctaCompact}`}>
      <div className={s.ctaThumb} data-look={look} aria-hidden="true">
        {look === "connect" ? (
          <span className={s.ctaChain}>
            <span className={s.ctaDot}><AIGlyph name="openai" size={20} color="#0d0d0d" /></span>
            <img src="/icon-96.png" alt="" width={44} height={44} />
            <span className={s.ctaDot}><AIGlyph name="claude" size={20} color="#d97757" /></span>
          </span>
        ) : <img src="/home-v5/frontier/sara-cafe.webp" alt="" loading="lazy" decoding="async" />}
      </div>
      <div className={s.ctaBody}>{body}</div>
    </div>
  );
  if (look === "scene") return (
    <div className={`${s.cta} ${s.ctaScene}`}>
      <div className={s.ctaBody}>{body}</div>
      <div className={s.ctaArt} aria-hidden="true"><img src="/home-v5/frontier/sara-cafe.webp" alt="" loading="lazy" decoding="async" /></div>
    </div>
  );
  if (look === "connect") return (
    <div className={`${s.cta} ${s.ctaConnect}`}>
      <AIConnect ais={["chatgpt", "claude"]} bare />
      <div className={s.ctaBody}>{body}</div>
    </div>
  );
  if (look === "note") return <div className={`${s.cta} ${s.ctaNote}`}><img className={s.ctaIcon} src="/icon-96.png" alt="" width={48} height={48} />{body}</div>;
  return <div className={s.cta}>{body}</div>;
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
