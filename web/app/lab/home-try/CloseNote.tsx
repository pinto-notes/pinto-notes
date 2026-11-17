"use client";

import { useEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { useArt } from "./art";
import c from "./carry.module.css";
import s from "./s.module.css";

// Round 26, `carry`, close 1: the page ends where it began. The same window comes back on the same
// paper, the sidebar folded away as in the first screen, a new note open, and its title is typed in:
// "Pinto Notes is free." Under it one line of the note says where it runs and which AIs. Under the
// window, the buttons and one line of small print. The study has moved to the end of Your AI, so
// nothing else is here. The footer's torn edge lies on this sheet (s.module.css).
// The title types once the sheet is in view (Reduce Motion or `?t`: already typed).

const TITLE = "Pinto Notes is free.";

const Ico = {
  side: <svg viewBox="0 0 20 16"><rect x="1.5" y="1.5" width="17" height="13" rx="3" /><path d="M7.5 1.5v13" /></svg>,
  back: <svg viewBox="0 0 10 16"><path d="M7.5 2 1.8 8l5.7 6" /></svg>,
  fwd: <svg viewBox="0 0 10 16"><path d="M2.5 2l5.7 6-5.7 6" /></svg>,
  check: <svg viewBox="0 0 20 16"><circle cx="3.5" cy="4" r="2.2" /><path d="M8.5 4h10M8.5 12h10" /><circle cx="3.5" cy="12" r="2.2" /></svg>,
  more: <svg viewBox="0 0 20 6"><circle cx="3" cy="3" r="1.6" /><circle cx="10" cy="3" r="1.6" /><circle cx="17" cy="3" r="1.6" /></svg>,
};

export function CloseNote() {
  const art = useArt();
  const ref = useRef<HTMLElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const still = new URLSearchParams(location.search).has("t") || matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) { setN(TITLE.length); return; }
    let t = 0, i = 0;
    const step = () => { i++; setN(i); if (i < TITLE.length) t = window.setTimeout(step, 52 + ((i * 37) % 5) * 12); };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); t = window.setTimeout(step, 380); }
    }, { threshold: 0.6 });
    io.observe(el.querySelector("[data-cwin]")!);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  const done = n >= TITLE.length;
  return (
    <section ref={ref} id="s-cover" className={c.close} aria-labelledby="s-free-h">
      <div className={c.closePaper} aria-hidden="true">
        <div className={c.closeSheet}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={c.closeArt} src={art.hero} alt="" width={art.heroSide} height={art.heroSide} loading="lazy" />
        </div>
      </div>
      <div className={c.closeBody}>
        <div className={c.cwin} data-cwin role="group" aria-label="Pinto Notes on a Mac, a new note">
          <div className={c.cwBar} aria-hidden="true">
            <span className={c.cwLights}><i /><i /><i /></span>
            <span className={c.cwIco}>{Ico.side}</span>
            <span className={c.cwIco}>{Ico.back}</span>
            <span className={`${c.cwIco} ${c.cwDim}`}>{Ico.fwd}</span>
            <span className={c.cwCrumb}>Notes</span>
            <span className={c.cwTools}><b>Aa</b><span className={c.cwIco}>{Ico.check}</span><span className={c.cwIco}>{Ico.more}</span></span>
          </div>
          <div className={c.cwNote}>
            <h2 id="s-free-h" className={c.cwTitle} aria-label={TITLE}>
              <span aria-hidden="true">{TITLE.slice(0, n)}</span>
              <b className={c.cwCaret} data-blink={done || undefined} aria-hidden="true" />
            </h2>
            <p className={c.cwLine} data-in={done || undefined}>On Mac and iPhone. Works with <span className={c.with}><AIGlyph name="openai" size={17} />ChatGPT</span> and <span className={c.with}><AIGlyph name="claude" size={17} color="#d97757" />Claude</span>.</p>
          </div>
        </div>
        <div className={c.closeCtas}>
          <div className={`${x.ctas} ${s.ctas}`}>
            <Download note={false} />
            <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
              Get it for iPhone
            </a>
            <a className={x.offMac} href="/download">Download for Mac</a>
            <p className={`${x.fine} ${x.offApple}`} data-off-apple>
              Pinto Notes is for iPhone and Mac.{" "}
              <a href={mailLink(SITE_URL)} onClick={(e) => sendLink(navigator, e, SITE_URL)}>Send myself the link</a>
            </p>
          </div>
          <p className={c.closeReq}>Requires macOS 26 or iOS 26.</p>
        </div>
      </div>
    </section>
  );
}
