"use client";

import { useState } from "react";
import type { Slide } from "@/lib/template-pages";
import s from "./d.module.css";

/// The gallery of a template's page: one slide at a time, each a short chat over the real app (a Mac
/// window with the phone over it, or the phone alone), and a row of thumbnails to pick one. Every
/// slide is in the page as served, so its words are there without JavaScript; the first one shows.
/// A slide with a before picture has a Before and After switch. A plain note's phone is drawn bigger
/// (`note`): its pictures are the iPhone app's note screen, whose text reads only at that size.
export default function Slides({ slug, slides, note }: { slug: string; slides: Slide[]; note?: boolean }) {
  const [on, setOn] = useState(0);
  const [after, setAfter] = useState(true);
  // As lib/template-pages.ts picture(), which this client part can't import (it reads files).
  const src = (name: string) => `/templates/page/${slug}/${name}.webp`;
  return (
    <div>
      <div className={s.stage} data-note={note || undefined}>
        {slides.map((sl, k) => {
          const shown = sl.before && !after ? sl.before : { mac: sl.mac, phone: sl.phone, alt: sl.alt };
          return (
            <div key={k} className={s.slide} data-on={k === on || undefined} aria-hidden={k !== on || undefined}>
              {sl.note
                ? <p className={s.note}>{sl.note}</p>
                : <div className={s.chat}><p className={s.you}>{sl.you}</p><p className={s.ai}>{sl.ai}</p></div>}
              <div className={s.shot} data-duo={sl.mac ? true : undefined}>
                {shown.mac && (
                  <div className={s.mac}>
                    <div className={s.bar} aria-hidden="true"><i /><i /><i /></div>
                    <img src={src(shown.mac)} alt={shown.alt} width={1600} height={1000} loading={k ? "lazy" : "eager"} decoding="async" />
                  </div>
                )}
                <div className={s.phone}>
                  <div className={s.screen}>
                    <div className={s.status} aria-hidden="true"><span>9:41</span><span>●●●</span></div>
                    <img src={src(shown.phone)} alt={shown.mac ? `${shown.alt}, on iPhone` : shown.alt} width={780} height={1688} loading={k ? "lazy" : "eager"} decoding="async" />
                  </div>
                  <span className={s.island} aria-hidden="true" />
                </div>
                {sl.before && (
                  <div className={s.flip} role="group" aria-label="Before and after">
                    <button type="button" aria-pressed={!after} onClick={() => setAfter(false)}>Before</button>
                    <button type="button" aria-pressed={after} onClick={() => setAfter(true)}>After</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className={s.thumbs} role="group" aria-label="Pictures">
        {slides.map((sl, k) => (
          <button key={k} type="button" className={s.thumb} aria-pressed={k === on} onClick={() => { setOn(k); setAfter(true); }}
            style={{ "--d": `url(${src(sl.mac ?? sl.phone)})`, "--m": `url(${src(sl.phone)})` } as React.CSSProperties}
            data-phone={sl.mac ? undefined : true}>
            <span className={s.thumbPic} aria-hidden="true" />
            <span className={s.thumbText}>{sl.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
