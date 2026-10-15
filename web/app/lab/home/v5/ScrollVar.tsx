"use client";

import { useEffect, useRef } from "react";

/// Sets `--s` (0..1) on its element as it scrolls through the screen: 0 when its top is near the
/// bottom of the screen, 1 when its top has risen to about a third. CSS turns that into motion that
/// follows the scroll without ever holding it. Reduce Motion and `?m=` show the end.
export function ScrollVar({ as: Tag = "div", className, children, from = 0.92, to = 0.3 }:
  { as?: "div" | "ul"; className?: string; children: React.ReactNode; from?: number; to?: number }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const set = (v: number) => el.style.setProperty("--s", v.toFixed(4));
    if (new URLSearchParams(location.search).has("m") || matchMedia("(prefers-reduced-motion: reduce)").matches) { set(1); return; }
    let raf = 0;
    const read = () => { raf = 0; const top = el.getBoundingClientRect().top; set(Math.min(1, Math.max(0, (innerHeight * from - top) / (innerHeight * (from - to))))); };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read(); addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [from, to]);
  return <Tag ref={ref as never} className={className} style={{ "--s": 0 } as React.CSSProperties}>{children}</Tag>;
}
