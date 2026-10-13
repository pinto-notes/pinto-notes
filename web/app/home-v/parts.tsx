"use client";

// Parts the three home page directions (/?v=a, b, c) share: the hero, the import that never shows a
// blank card, the illustrated row of everything else, and a note becoming an app. Each is complete at
// rest and plays once on first view (reduced motion: it stays complete and still).

import { useEffect, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { coverPath, COVERS } from "@/lib/template-covers";
import DownloadLink from "../DownloadLink";
import PlatformNote from "../PlatformNote";
import { AppleGlyph } from "../SiteChrome";
import { FOLDERS, FolderIcon, PINNED, PinIcon, TOTAL, Tick, reduce, useFirstView } from "../Sections";
import home from "../home.module.css";
import a from "../sections.module.css";
import h from "./home-v.module.css";

const rise = (i: number) => ({ style: { "--i": i } as React.CSSProperties });

export const HEADLINE = <>Write the plan. <mark className={home.mark}>Your AI</mark> helps you follow through.</>;
export const LEDE = "One notes app that ChatGPT, Claude, Codex and Incredible all read and edit. It feels like Apple Notes, and brings yours over in one go.";

/// The promise and the buttons, as on the home page today. `aside` sits beside it (direction C).
export function Hero({ className = "", aside }: { className?: string; aside?: React.ReactNode }) {
  return (
    <section className={`${home.hero} ${className}`}>
      {aside}
      <h1 className={`${home.h1} rise`} {...rise(0)}>{HEADLINE}</h1>
      <p className={`${home.lede} rise`} {...rise(1)}>{LEDE}</p>
      <div className={`${home.ctas} rise pi-apple pi-not-ios`} {...rise(2)}>
        <DownloadLink className={home.primary}><AppleGlyph /> Download for Mac</DownloadLink>
        {APP_STORE_LIVE && <a className={home.secondary} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get it for iPhone</a>}
      </div>
      <PlatformNote place="hero" className="rise" {...rise(2)} />
    </section>
  );
}

/// A paper-craft illustration, drawn at 1000 px with a 600 px copy for phones.
export function Art({ name, alt, className = "", priority = false }: { name: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <img className={`${h.art} ${className}`} src={`/home/${name}.webp`} srcSet={`/home/${name}-600.webp 600w, /home/${name}.webp 1000w`} sizes="(min-width: 900px) 560px, 92vw"
      alt={alt} width={1000} height={1000} loading={priority ? "eager" : "lazy"} decoding="async" />
  );
}

export const APPLE_TITLE = "It feels like Apple Notes, especially on iPhone";
export function AppleCopy() {
  return (
    <>
      <p className={a.lede}>Apple Notes is still the best notes app on a phone, so Pinto Notes works the way it does. The same note list, the same checklists, and a new note is one tap away when you have a thought in the queue for coffee.</p>
      <p className={a.lede}>
        Bring all your Apple Notes over in one go on your Mac. Folders, checklists and tables come along, pins too if you allow Full Disk Access, and your Apple Notes stay as they are.
        Your notes sync between iPhone and Mac in about a second. The iPhone app is coming to the App Store soon.
      </p>
    </>
  );
}

/// The import, run once: the total counts up in the card's title row while the bar fills and each
/// folder fills in. Every part has its place from the start, so the card is never half empty.
export function ImportCard({ className = "" }: { className?: string }) {
  const [ref, seen] = useFirstView<HTMLDivElement>(0.45);
  const [p, setP] = useState(1); // complete at rest
  useEffect(() => {
    if (!seen || reduce()) return;
    let raf = 0, start = 0;
    const tick = (now: number) => {
      if (!start) start = now + 250;
      const t = Math.max(0, Math.min(1, (now - start) / 3200));
      setP(1 - Math.pow(1 - t, 3));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    setP(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen]);
  const full = p >= 1;
  const of = FOLDERS.length + 1;
  const count = (n: number, k: number) => Math.round(Math.max(0, Math.min(1, (p - k / of) * of)) * n);
  return (
    <div ref={ref} className={`${h.import} ${className}`} aria-label={`Imported ${TOTAL.toLocaleString("en")} notes from Apple Notes, with ${PINNED} pinned. Folders kept, Apple Notes unchanged.`}>
      <div className={h.importTop} aria-hidden="true">
        <img src="/apple-notes.webp" alt="" width={36} height={36} />
        <div className={h.importName}>
          <b>{full ? "Imported from Apple Notes" : "Importing from Apple Notes…"}</b>
          <span><Tick /> Folders kept <Tick /> Apple Notes unchanged</span>
        </div>
        <p className={h.importTotal}><span className={a.num}>{Math.round(TOTAL * p).toLocaleString("en")}</span> notes</p>
      </div>
      <div className={a.bar} aria-hidden="true">
        <i style={{ transform: `scaleX(${p})` }} />
        <span className={a.barDone} data-on={full || undefined}><Tick /></span>
      </div>
      <ul className={`${a.folders} ${h.folders}`} aria-hidden="true">
        {FOLDERS.map((f, k) => (
          <li key={f.name} data-on={p > k / of || undefined}><FolderIcon /><b>{f.name}</b><span className={a.num}>{count(f.n, k).toLocaleString("en")}</span></li>
        ))}
        <li data-on={p > FOLDERS.length / of || undefined} className={a.pinned}><PinIcon /><b>Pinned</b><span className={a.num}>{count(PINNED, FOLDERS.length)}</span></li>
      </ul>
    </div>
  );
}

/// Everything else, each with its own small paper-craft picture from the templates.
const ALSO = [
  { label: "Lists that tidy themselves", cover: "grocery-list" },
  { label: "Real tables", cover: "content-calendar" },
  { label: "Photos and files", cover: "recipe-box" },
  { label: "No ads, no tracking in the app", cover: "mood-energy-log" },
];
export function AlsoTiles({ className = "" }: { className?: string }) {
  return (
    <ul className={`${h.also} ${className}`} aria-label="Also">
      {ALSO.map((t) => (
        <li key={t.label}>
          <span className={h.alsoArt} style={{ background: COVERS[t.cover].ground }}><img src={coverPath(t.cover)} alt="" width={800} height={800} loading="lazy" decoding="async" /></span>
          <span className={h.alsoLabel}><Tick />{t.label}</span>
        </li>
      ))}
    </ul>
  );
}

export const APPS_TITLE = "A note can also be an app";
export const APPS_ASK = "Turn my habits note into a tracker";
export function AppsCopy() {
  return (
    <>
      <h2 id="apps" className={a.h2}>{APPS_TITLE}</h2>
      <p className={a.lede}>Ask your AI to turn a note into a small app, and it builds one inside the note. Your habits note becomes a tracker you tick each day, and a budget note can add itself up. The note&apos;s text stays underneath, and you can remove the app whenever you like.</p>
      <p className={a.also}><a href="/help#apps">How to make one</a></p>
    </>
  );
}
/// The request and what came of it, in ChatGPT on a phone.
export function AppsChat({ className = "" }: { className?: string }) {
  return (
    <figure className={`${a.job} ${a.phone} ${h.appsChat} ${className}`} aria-label={`ChatGPT: ${APPS_ASK}. Result: Habits, now an app you can tick.`}>
      <figcaption className={a.jobBar} aria-hidden="true"><span className={a.jobApp}><AIGlyph name="openai" size={13} />ChatGPT</span></figcaption>
      <div className={a.jobBody} aria-hidden="true">
        <p className={a.bubble} data-on>{APPS_ASK}</p>
        <p className={a.chip} data-on><Tick /> <b>Habits</b> · now an app you can tick</p>
      </div>
    </figure>
  );
}
