"use client";

import { APP_STORE_URL } from "@/lib/site";
import { useEffect, useRef, useState } from "react";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { OffApple } from "../home-l/OffApple";
import { BuildPic, DrawPic, WritePic } from "./Pictures";
import s from "./o.module.css";

// Study O, "The verbs are the switch". The headline is the control: Write, Draw and Build are tabs,
// and the chosen one changes the one big picture under them, the way Bear's Mac, iPhone, iPad switch
// does. It moves on by itself every few seconds until the visitor picks a word, then stays put.
// On a phone the picture is a swipe row, and swiping picks the word too.
// `?w=draw` opens on a word and holds it; `?t=<anything>` holds still (for screenshots).
// Reduce Motion: no turning by itself, no fades.

type Word = { id: "write" | "draw" | "build"; word: string; noun: string; line: string; art: string; artAlt: string; flip?: boolean; Pic: () => React.JSX.Element };
const WORDS: Word[] = [
  { id: "write", word: "Write", noun: "Notes", line: "Notes that feel like Apple Notes. Bring yours over.", art: "/home-v5/frontier/maya-paper.webp", artAlt: "", Pic: WritePic },
  { id: "draw", word: "Draw", noun: "Whiteboards", line: "A whiteboard next to your notes. Your AI can read it and draw on it.", art: "/home-v5/frontier/jonas-lisbon.webp", artAlt: "", flip: true, Pic: DrawPic },
  { id: "build", word: "Build", noun: "Apps", line: "Small apps in a note, like a habit tracker. Your AI can make one.", art: "/home-v5/frontier/sara-cafe.webp", artAlt: "", Pic: BuildPic },
];
const EVERY = 4600;

export function Switch() {
  const [on, setOn] = useState(0);
  const [held, setHeld] = useState(false); // the visitor chose; no more turning by itself
  const [calm, setCalm] = useState(false); // Reduce Motion or a still
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const ours = useRef(0); // until when a scroll of the track is our own

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const w = WORDS.findIndex((v) => v.id === q.get("w"));
    if (w >= 0) { setOn(w); setHeld(true); }
    if (q.get("t") !== null) { setHeld(true); setCalm(true); } // a still: no fades, the drawing finished
    const rm = matchMedia("(prefers-reduced-motion: reduce)");
    if (rm.matches) setCalm(true);
  }, []);

  // Turning by itself, slowly, until the visitor picks a word.
  useEffect(() => {
    if (held || calm) return;
    const id = setInterval(() => { if (!paused.current && !document.hidden) setOn((i) => (i + 1) % WORDS.length); }, EVERY);
    return () => clearInterval(id);
  }, [held, calm]);

  // On a phone the track scrolls; keep the chosen picture in view.
  useEffect(() => {
    const t = track.current; if (!t || t.scrollWidth <= t.clientWidth + 4) return;
    const slide = t.children[on] as HTMLElement | undefined; if (!slide) return;
    const left = slide.offsetLeft - t.offsetLeft - (t.clientWidth - slide.clientWidth) / 2;
    if (Math.abs(t.scrollLeft - left) < 4) return;
    ours.current = performance.now() + 900;
    t.scrollTo({ left, behavior: calm ? "auto" : "smooth" });
  }, [on, calm]);

  const pick = (i: number, focus = false) => {
    setHeld(true);
    setOn(i);
    if (focus) tabs.current[i]?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const n = WORDS.length;
    const go = { ArrowRight: on + 1, ArrowDown: on + 1, ArrowLeft: on - 1, ArrowUp: on - 1, Home: 0, End: n - 1 }[e.key];
    if (go === undefined) return;
    e.preventDefault();
    pick((go + n) % n, true);
  };

  // A swipe on the phone picks the picture it lands on.
  const onScroll = () => {
    const t = track.current; if (!t || performance.now() < ours.current) return;
    const kids = Array.from(t.children) as HTMLElement[];
    const mid = t.scrollLeft + t.clientWidth / 2 + t.offsetLeft;
    let best = 0, dist = Infinity;
    kids.forEach((k, i) => { const d = Math.abs(k.offsetLeft + k.clientWidth / 2 - mid); if (d < dist) { dist = d; best = i; } });
    if (best !== on) { setHeld(true); setOn(best); }
  };

  const w = WORDS[on];
  return (
    <section className={s.hero} data-calm={calm ? "" : undefined} aria-labelledby="o-h1">
      <h1 id="o-h1" className={s.h1}>The notebook for you and your AI.</h1>
      {/* Write, Draw and Build name the three things next to their nouns; they're the switch, not the headline (Emil, 11-14). */}
      <div role="tablist" aria-label="Notes, whiteboards and apps" className={s.tabs} onKeyDown={onKey}>
        {WORDS.map((v, i) => (
          <button key={v.id} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`o-tab-${v.id}`}
            aria-selected={i === on} aria-controls={`o-panel-${v.id}`} tabIndex={i === on ? 0 : -1}
            className={s.tab} onClick={() => pick(i)}>
            <span className={s.verb}>{v.word}</span>
            <span className={s.noun}>{v.noun}</span>
          </button>
        ))}
      </div>
      <p className={s.line} key={w.id}>{w.line}</p>

      <div className={`${x.ctas} ${s.ctas}`}>
        <Download note={false} />
        <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
          Get it for iPhone
        </a>
        <a className={x.offMac} href="/download">Download for Mac</a>
        <OffApple />
      </div>
      <p className={s.fine}>Free on Mac and iPhone. Works with ChatGPT and Claude.</p>

      <div className={s.stage}
        onPointerEnter={(e) => { if (e.pointerType === "mouse") paused.current = true; }}
        onPointerLeave={() => { paused.current = false; }}
        onFocusCapture={() => { paused.current = true; }}
        onBlurCapture={() => { paused.current = false; }}>
        <div className={s.track} ref={track} onScroll={onScroll} onTouchStart={() => setHeld(true)}>
          {WORDS.map((v, i) => (
            <div key={v.id} id={`o-panel-${v.id}`} role="tabpanel" aria-labelledby={`o-tab-${v.id}`}
              className={s.pane} data-on={i === on || undefined} data-word={v.id} aria-hidden={i !== on}>
              <div className={s.frame}>
                <img className={s.art} src={v.art} alt={v.artAlt} width={2000} height={1126} data-flip={v.flip || undefined}
                  decoding="async" fetchPriority={i === 0 ? "high" : "low"} />
                <v.Pic />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
