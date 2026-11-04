"use client";

import { useEffect, useRef } from "react";

/// The paper town under the footer links: dusk on cream pages, night on leaf-brown pages.
/// Animated by hand in CSS (site.css, "Footer scene"): windows and lamps breathe, one window switches
/// on, smoke curls from the chimney, two birds cross. Decorative: hidden from assistive tech, still for
/// reduced motion.
const SMOKE = "M10 60 C4 48 16 40 10 28 C5 18 14 10 10 0";
const SMOKE2 = "M8 60 C2 50 14 42 9 30 C4 20 12 12 9 2";
const WING = "M1 6 Q5 0 10 6 Q15 0 19 6";

export default function FooterScene({ night }: { night: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  // While the town is on screen the page behind it takes the ground's colour, so a bounce past the end
  // shows dark ground, not cream. Away from it (and on the way back up) the page is cream again.
  useEffect(() => {
    const el = root.current; if (!el) return;
    const html = document.documentElement;
    const io = new IntersectionObserver(([e]) => html.classList.toggle("fs-at-ground", e.isIntersecting));
    io.observe(el);
    return () => { io.disconnect(); html.classList.remove("fs-at-ground"); };
  }, []);
  const base = `/art/footer/a-${night ? "night" : "dusk"}`;
  return (
    <div ref={root} className={`fs${night ? " fs-night" : ""}`} aria-hidden="true">
      <img className="fs-plate" src={night ? "/art/footer/home-night.webp" : "/art/footer/home.webp"} alt="" loading="lazy" decoding="async" />
      <div className="fs-layer">
        <div className="fs-sky" />
        <img className="fs-lights fs-bloom" src={`${base}-windows.webp`} alt="" loading="lazy" />
        <img className="fs-lights" src={`${base}-windows.webp`} alt="" loading="lazy" />
        <img className="fs-lights fs-lamps fs-bloom" src={`${base}-lamps.webp`} alt="" loading="lazy" />
        <img className="fs-lights fs-lamps" src={`${base}-lamps.webp`} alt="" loading="lazy" />
        <img className="fs-off" src={`${base}-off.webp`} alt="" loading="lazy" />
        <span className="fs-smoke" style={{ left: "25.5%", top: "29%" }}>
          <svg viewBox="0 0 20 60"><path d={SMOKE} /><path d={SMOKE2} /></svg>
        </span>
        {!night && <>
          <span className="fs-bird" style={{ left: "70%", top: "34%" }}><svg viewBox="0 0 20 8"><path d={WING} /></svg></span>
          <span className="fs-bird" style={{ left: "73%", top: "37%", width: ".9%", animationDelay: "-.6s" }}><svg viewBox="0 0 20 8"><path d={WING} /></svg></span>
        </>}
      </div>
    </div>
  );
}
