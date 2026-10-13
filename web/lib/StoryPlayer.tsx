"use client";

import { useEffect, useRef, useState } from "react";
import s from "./story-player.module.css";

/// A story played over time (docs/DESIGN.md, Motion): one stage shows one step, and the steps take
/// turns. Under the stage, one row per step: its title, and a thin line that fills while it plays.
/// When the line is full the next step comes up. Pointing at the player or focusing into it holds
/// the current step; so does scrolling it out of view. With Reduce Motion nothing advances on its
/// own: the first step shows and the titles switch steps. Every step is in the HTML; only the
/// playing one is shown, so its entrance plays each time it comes back.
export type Step = { title: string; text?: string };

export function StoryPlayer({ steps, slides, label, seconds = 5.5, numbered = false, backdrop }: {
  steps: Step[];
  /// One stage picture per step, in the same order.
  slides: React.ReactNode[];
  label: string;
  seconds?: number;
  /// Number the rows (an install, a set-up), or not (three things to ask).
  numbered?: boolean;
  /// A picture that stays put behind every step (a scene); only the steps' own parts change on it.
  backdrop?: React.ReactNode;
}) {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const [seen, setSeen] = useState(false);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const m = matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setStill(m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = seen && !held && !still;
  const next = () => setAt((i) => (i + 1) % steps.length);

  return (
    <div
      ref={root}
      className={s.player}
      role="group"
      aria-roledescription="story"
      aria-label={label}
      data-playing={playing ? "" : undefined}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setHeld(true); }}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHeld(false); }}
      style={{ "--story-s": `${seconds}s` } as React.CSSProperties}
    >
      <div className={s.stage} data-backdrop={backdrop ? "" : undefined}>
        {backdrop && <div className={s.backdrop}>{backdrop}</div>}
        {slides.map((slide, i) => (
          <div key={i} className={s.slide} hidden={i !== at} aria-hidden={i !== at}>{slide}</div>
        ))}
      </div>
      <ol className={s.steps} data-numbered={numbered ? "" : undefined}>
        {steps.map((st, i) => (
          <li key={st.title} className={s.step} data-on={i === at ? "" : undefined}>
            <h3 className={s.title}>
              <button type="button" aria-pressed={i === at} onClick={() => setAt(i)}>
                {numbered && <span className={s.n}>{i + 1}</span>}
                {st.title}
              </button>
            </h3>
            <span className={s.track} aria-hidden="true">
              {i === at && <i key={at} className={s.fill} onAnimationEnd={next} />}
            </span>
            {st.text && <p className={s.text}>{st.text}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
