"use client";

import { useEffect, useRef, useState } from "react";
import s from "./paper.module.css";

/// One paper scene: the art fills the band, the words sit in its calm left third, and one small real
/// piece of the app (the proof) settles into the art when the scene comes into view. The art drifts a
/// little slower than the page. Every frame is finished: the proof is in place at rest; only its last
/// few pixels move.
export function Scene({ art, alt, dark = false, flip = false, children, proof, id, ground }: {
  art: string; alt: string; dark?: boolean; flip?: boolean; children: React.ReactNode; proof?: React.ReactNode; id: string; ground?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [y, setY] = useState(0);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const still = matchMedia("(prefers-reduced-motion: reduce), (max-width: 760px)").matches;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    if (still) { setSeen(true); return () => io.disconnect(); }
    let raf = 0;
    const read = () => { raf = 0; const r = el.getBoundingClientRect(); const mid = r.top + r.height / 2 - innerHeight / 2; setY(Math.max(-1, Math.min(1, mid / innerHeight))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true });
    return () => { io.disconnect(); removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <section ref={ref} className={s.scene} data-dark={dark || undefined} data-flip={flip || undefined} aria-labelledby={id} style={ground ? ({ "--ground": ground } as React.CSSProperties) : undefined}>
      <div className={s.art}>
        <img src={art} alt={alt} width={1672} height={941} loading="lazy" decoding="async" style={{ transform: `translateY(${(y * 36).toFixed(1)}px) scale(${flip ? -1.06 : 1.06}, 1.06)` }} />
      </div>
      <div className={s.words}>{children}</div>
      {proof && <div className={s.proof} data-seen={seen || undefined}>{proof}</div>}
    </section>
  );
}
