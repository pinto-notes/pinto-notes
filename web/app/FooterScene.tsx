"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";

/// The paper town under the footer links: dusk on cream pages, night on leaf-brown pages.
/// Animated by hand in CSS (site.css, "Footer scene"): windows and lamps twinkle, one window switches
/// on, smoke rises from three chimneys, a small flock crosses. Decorative: hidden from assistive tech, still for
/// reduced motion.
const SMOKE = "M10 60 C4 48 16 40 10 28 C5 18 14 10 10 0";
const SMOKE2 = "M10 60 C15 50 5 42 10 31 C14 21 6 12 10 3";
// A bird: two wings hinged at the body, so they beat up and down and then glide.
const WING_L = "M10 6.2 Q6 3.8 0.6 4.9 Q5.6 5.5 10 7.2Z";
const WING_R = "M10 6.2 Q14 3.8 19.4 4.9 Q14.4 5.5 10 7.2Z";
// Windows twinkle in three bands, each on its own beat, so the town never pulses as one.
const BANDS = [
  { clip: "inset(0 66% 0 0)", delay: "0s", bloom: "-3s" },
  { clip: "inset(0 33% 0 34%)", delay: "-2s", bloom: "-5s" },
  { clip: "inset(0 0 0 67%)", delay: "-4s", bloom: "-1s" },
];
// Smoke from the big house and two chimneys across the valley. Each plume's foot sits on the top of a
// chimney pot, measured on the painting (2172 x 724): the span's bottom edge is the pot's top.
const SMOKES = [
  { left: "25.8%", top: "26%", height: "19%" },
  { left: "76.2%", top: "40%", width: "1.9%", height: "15%", "--d": "-2s" } as CSSProperties,
  { left: "88.9%", top: "29.3%", width: "1.9%", height: "15%", "--d": "-4s" } as CSSProperties,
];
// A small flock crossing the evening sky, right to left.
const BIRDS = [
  { left: "74%", top: "31%" },
  { left: "76%", top: "28.4%", width: "1.3%", animationDelay: "-.3s" },
  { left: "76.3%", top: "34%", width: "1.3%", animationDelay: "-.75s" },
  { left: "78.2%", top: "26%", width: "1.2%", animationDelay: "-1.1s" },
  { left: "78.6%", top: "36.4%", width: "1.2%", animationDelay: "-1.5s" },
];

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
        {BANDS.map((b) => <Fragment key={b.clip}>
          <img className="fs-lights fs-bloom" style={{ clipPath: b.clip, animationDelay: b.bloom }} src={`${base}-windows.webp`} alt="" loading="lazy" />
          <img className="fs-lights" style={{ clipPath: b.clip, animationDelay: b.delay }} src={`${base}-windows.webp`} alt="" loading="lazy" />
        </Fragment>)}
        <img className="fs-lights fs-lamps fs-bloom" src={`${base}-lamps.webp`} alt="" loading="lazy" />
        <img className="fs-lights fs-lamps" src={`${base}-lamps.webp`} alt="" loading="lazy" />
        <img className="fs-off" src={`${base}-off.webp`} alt="" loading="lazy" />
        {SMOKES.map((m) => <span key={m.left} className="fs-smoke" style={m}>
          <svg viewBox="0 0 20 60"><path className="fs-haze" d={SMOKE} /><path d={SMOKE} /><path d={SMOKE2} /></svg>
        </span>)}
        {!night && BIRDS.map((b, i) => <span key={i} className="fs-bird" style={b}><svg viewBox="0 0 20 10"><path className="fs-wing" d={WING_L} /><path className="fs-wing fs-wing-r" d={WING_R} /><ellipse cx="10" cy="6.7" rx="1.2" ry=".8" /></svg></span>)}
      </div>
    </div>
  );
}
