"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { APP_STORE_URL } from "@/lib/site";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../_home/Download";
import * as Ic from "./icons";
import { MacWindow, Phone, type Step } from "./Window";
import g from "./home-g.module.css";

// Study G, the window. One Mac window under a short headline; scrolling (or its three create
// buttons) turns it from a note into a whiteboard into an app, and the words above follow. Three
// steps, then the AIs it works with and the download. On a phone the window is an iPhone.

const STEPS = [
  { title: "Notes", line: "Write like in Apple Notes. Bring yours over in one go.", Icon: Ic.Compose },
  { title: "Whiteboards", line: "Sketch how it works. Your AI can read it and draw on it.", Icon: Ic.Board },
  { title: "Apps", line: "Pick a habit tracker or a budget, or describe one. Any AI can update it.", Icon: Ic.Apps },
];

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function HomeG() {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const fit = useRef<HTMLDivElement>(null);
  const ctas = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(0);
  const [moment, setMoment] = useState(false);
  const [still, setStill] = useState(false);

  // ?t= freezes the page at rest (for screenshots); Reduce Motion does too. ?step= opens on a step.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.has("t") || matchMedia("(prefers-reduced-motion: reduce)").matches) setStill(true);
    const s = Number(q.get("step"));
    if (s === 1 || s === 2) setStep(s);
  }, []);

  useEffect(() => {
    const el = ctas.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-hero-download", e.isIntersecting), { rootMargin: "-84px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The step follows the scroll through the pinned stretch.
  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const t = track.current, s = stage.current;
      if (!t || !s) return;
      const top = parseFloat(getComputedStyle(s).top) || 0, seg = (t.offsetHeight - s.offsetHeight) / 2;
      if (seg <= 0) return;
      const p = (top - t.getBoundingClientRect().top) / seg;
      if (p < -0.05) return; // still above: the step a click or ?step= chose stays
      setStep(p < 0.45 ? 0 : p < 1.45 ? 1 : 2);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    window.addEventListener("scroll", on, { passive: true });
    return () => { window.removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);

  // Each step's AI moment (the line ChatGPT adds, Claude's branch, the tick) lands a beat after it shows.
  useEffect(() => {
    if (still) { setMoment(true); return; }
    setMoment(false);
    const id = setTimeout(() => setMoment(true), step === 1 ? 1500 : 1000);
    return () => clearTimeout(id);
  }, [step, still]);

  // The window keeps the app's own proportions and scales as one piece to fit the stage.
  useIso(() => {
    const el = fit.current;
    if (!el) return;
    const size = () => {
      const phone = matchMedia("(max-width: 760px)").matches;
      const [W, H] = phone ? [415, 874] : [1180, 720];
      const k = Math.min(el.clientWidth / W, el.clientHeight / H, phone ? 0.86 : 1.12);
      el.style.setProperty("--k", String(Math.max(0.2, k)));
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // A click on a step, a create button or a note scrolls to that step, so the scroll and the window agree.
  const go = useCallback((i: Step) => {
    const t = track.current, s = stage.current;
    setStep(i);
    if (!t || !s) return;
    const top = parseFloat(getComputedStyle(s).top) || 0, seg = (t.offsetHeight - s.offsetHeight) / 2;
    const y = t.getBoundingClientRect().top + window.scrollY - top + seg * i + 2;
    window.scrollTo({ top: y, behavior: still ? "auto" : "smooth" });
  }, [still]);

  return (
    <div className={g.page} data-still={still ? "" : undefined}>
      <header className={g.head}>
        <h1 className={`${g.h1} rise`} style={{ "--i": 0 } as React.CSSProperties}>
          Notes, whiteboards and apps. <span>Your AI works in all three.</span>
        </h1>
        {/* While these are in view the header's download steps aside (data-hero-download, site.css); once
            they scroll away it comes back, so the window's steps always have a download beside them. */}
        <div className={`${g.ctas} rise`} style={{ "--i": 1 } as React.CSSProperties} ref={ctas} data-hero-download="">
          <Download note={false} />
          <a className={g.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
        </div>
      </header>

      <section className={g.track} ref={track} aria-label="Notes, whiteboards and apps">
        <div className={g.stage} ref={stage}>
          <ol className={`${g.steps} rise`} style={{ "--i": 2 } as React.CSSProperties}>
            {STEPS.map(({ title, line, Icon }, i) => (
              <li key={title}>
                <button type="button" className={g.step} data-on={step === i ? "" : undefined} aria-current={step === i ? "step" : undefined} onClick={() => go(i as Step)}>
                  <span className={g.stepTitle}><Icon size={24} />{title}</span>
                  <span className={g.stepLine}>{line}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className={g.phoneLine} aria-live="polite">{STEPS[step].line}</p>
          <div className={`${g.fit} rise-soft`} style={{ "--i": 3 } as React.CSSProperties} ref={fit}>
            <div className={g.scaled}>
              <div className={g.forMac}><MacWindow step={step} moment={moment} onPick={go} /></div>
              <div className={g.forPhone}><Phone step={step} moment={moment} onPick={go} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className={g.ais}>
        <h2 className={g.aiTitle}>Connect the AI you already use.</h2>
        <ul className={g.aiRow}>
          {AIS.map((a) => <li key={a.name}><AIGlyph name={a.glyph} size={30} />{a.name}</li>)}
        </ul>
        <p className={g.study}>
          In a new chat, Claude got 18% of questions about past chats right. With its notes in Pinto, 82.5%.{" "}
          <a href="/blog/ai-memory-with-notes">Read the study</a>
        </p>
      </section>

      <section className={g.end}>
        <h2 className={g.endTitle}>Free for Mac and iPhone.</h2>
        <div className={g.ctas}>
          <Download note={false} />
          <a className={g.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
        </div>
        <p className={g.fine}>Open source. Encrypted. Imports Apple Notes. Requires macOS 26 or iOS 26.</p>
      </section>
    </div>
  );
}
