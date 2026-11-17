"use client";

import { useEffect, useRef, useState } from "react";

/** Mounts its children once the box is half on screen, so a show plays when it's seen (at once with
 *  Reduce Motion or `?t=`). The box keeps its size from CSS, so nothing moves when it mounts. */
export function Seen({ className, children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || new URLSearchParams(location.search).has("t")) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className}>{on && children}</div>;
}
