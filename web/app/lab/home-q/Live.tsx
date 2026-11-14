"use client";

import { type ReactNode, useEffect, useRef } from "react";

// A feature frame that plays its few steps once, when it is mostly on screen. Without JS, with Reduce
// Motion, or with `?t=`, the frame is simply shown in its final state (data-arm is never set).
export function Live({ className, tone, children }: { className: string; tone: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || new URLSearchParams(location.search).has("t") || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < innerHeight * 0.5) return; // already in view on load: leave it finished
    el.dataset.arm = "";
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { el.dataset.in = ""; io.disconnect(); }
    }, { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={className} data-tone={tone}>{children}</div>;
}
