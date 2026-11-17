"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Cta } from "./Cta";
import c from "./closeR.module.css";

// Round 26 (`ribbon`), the close in the first screen's language: one picture, one headline, the buttons,
// one line of small print. The ribbon comes back for its last line: a casual question runs in on the
// dark of a chat, into the Pinto Notes pill, and out comes a strip of paper with the answer, set as the
// headline: "Pinto Notes is free." The question is the visitor's own (nobody is quoted); the answer is
// ours. When the close docks, the question slides up to the pill and the strip comes out, then both
// hold still. With Reduce Motion or `?t=`, it's already written.

const ASK = "so what does it cost?";

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);

export function CloseRibbon() {
  const stage = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);
  const [band, setBand] = useState<{ d: string; w: number; h: number; font: number; width: number } | null>(null);
  const [p, setP] = useState(0);

  // The chat band: from off the left edge, a little low, rising into the pill.
  useLayoutEffect(() => {
    const el = stage.current, pl = pill.current; if (!el || !pl) return;
    const fit = () => {
      const s = el.getBoundingClientRect(), r = pl.getBoundingClientRect();
      const x = r.left + r.width / 2 - s.left, y = r.top + r.height / 2 - s.top;
      const narrow = s.width <= 760;
      // On a phone the strip hangs under the pill, so the chat comes in from above it.
      const drop = narrow ? -64 : 64;
      const d = `M${-80} ${Math.round(y + drop)}C${Math.round(x * 0.3)} ${Math.round(y + drop)} ${Math.round(x * 0.6)} ${Math.round(y)} ${Math.round(x)} ${Math.round(y)}`;
      setBand({ d, w: Math.round(s.width), h: Math.round(s.height), font: narrow ? 15 : 19, width: narrow ? 34 : 46 });
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(el);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  // Write it once, when most of the close is in view.
  useEffect(() => {
    const el = stage.current; if (!el) return;
    if (new URLSearchParams(location.search).has("t") || matchMedia("(prefers-reduced-motion: reduce)").matches) { setP(1); return; }
    let raf = 0, t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      setP(Math.min(1, t / 2.2));
      if (t < 2.2) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { if (e.intersectionRatio > 0.6 && !raf && !t0) { raf = requestAnimationFrame(tick); io.disconnect(); } }, { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  // The question arrives over the first 1.1 s; the strip comes out from 0.7 s to 2.2 s.
  const q = ease((p * 2.2) / 1.1), out = ease((p * 2.2 - 0.7) / 1.5);
  const textRef = useRef<SVGTextElement>(null);
  const [askLen, setAskLen] = useState(0);
  useEffect(() => { if (textRef.current) setAskLen(textRef.current.getComputedTextLength()); }, [band?.font]);
  const pathRef = useRef<SVGPathElement>(null);
  const [len, setLen] = useState(0);
  useEffect(() => { if (pathRef.current) setLen(pathRef.current.getTotalLength()); }, [band?.d]);
  // At rest the question ends a little before the pill's edge.
  const pillHalf = band ? band.width * 1.32 * 1.7 / 2 : 0;
  const restOff = len - pillHalf - 18 - askLen;
  const off = restOff - (1 - q) * 420;

  return (
    <div ref={stage} className={c.stage} role="img" aria-label="A question runs into Pinto Notes, so what does it cost?, and out comes the answer on a strip of paper: Pinto Notes is free.">
      {band && (
        <svg className={c.band} width={band.w} height={band.h} viewBox={`0 0 ${band.w} ${band.h}`} aria-hidden="true" style={{ "--rf": `${band.font}px` } as React.CSSProperties}>
          <defs>
            <filter id="cr-soft" x="-20%" y="-200%" width="140%" height="500%"><feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#1a0d02" floodOpacity="0.18" /></filter>
          </defs>
          <path ref={pathRef} id="cr-a" d={band.d} className={c.chat} strokeWidth={band.width} filter="url(#cr-soft)" />
          <text ref={textRef} className={c.askText} dominantBaseline="central"><textPath href="#cr-a" startOffset={askLen ? off.toFixed(1) : -9999}>{ASK}</textPath></text>
        </svg>
      )}
      <div className={c.row}>
        <div className={c.strip}>
          <div ref={pill} className={c.pill} style={band ? ({ "--pillH": `${Math.round(band.width * 1.32)}px` } as React.CSSProperties) : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mark-256.png" alt="" width={256} height={256} />
          </div>
          <div className={c.out}>
            <div className={c.paper} style={{ "--out": out.toFixed(4) } as React.CSSProperties}>
              <svg className={c.paperBg} aria-hidden="true" preserveAspectRatio="none">
                <defs>
                  <filter id="cr-torn" x="-6%" y="-40%" width="112%" height="200%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.05 0.09" numOctaves="3" seed="11" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G" />
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#3c1e08" floodOpacity="0.18" />
                    <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#3c1e08" floodOpacity="0.16" />
                  </filter>
                </defs>
                <rect fill="#fffdf8" filter="url(#cr-torn)" />
              </svg>
              <h2 id="s-free-h" className={c.title}>Pinto Notes <span>is free.</span></h2>
            </div>
          </div>
        </div>
      </div>
      <div className={c.under}>
        <Cta className={c.ctas} />
        <p className={c.req}>Requires macOS 26 or iOS 26.</p>
      </div>
    </div>
  );
}
