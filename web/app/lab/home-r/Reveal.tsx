"use client";

import { type ReactNode, useEffect, useRef } from "react";

/** True when the page should show every picture finished: Reduce Motion, or `?t=` for stable shots. */
export function still() {
  return new URLSearchParams(location.search).has("t") || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window);
}

/** With `?t=`, marks the page so the first screen's entrance shows its end state for stable shots. */
export function StillMark() {
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("t")) return;
    document.documentElement.dataset.rStill = "";
    return () => { delete document.documentElement.dataset.rStill; };
  }, []);
  return null;
}

/** Calls `go` once, when the element is mostly in view. Not at all when still() (the end state shows). */
export function useOnce<T extends HTMLElement>(go: (el: T) => void, threshold = 0.4) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || still()) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { go(el); io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ref;
}

/** A block whose pen marks and small steps play once as it comes into view. Without JS, with Reduce
 *  Motion or `?t=`, it is simply shown finished (data-arm is never set). */
export function Reveal({ as: Tag = "div", className, children, threshold = 0.35, ...rest }: {
  as?: "div" | "section" | "header"; className?: string; children: ReactNode; threshold?: number;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || still()) return;
    el.dataset.arm = "";
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { el.dataset.in = ""; io.disconnect(); }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Tag ref={ref as any} className={className} {...rest}>{children}</Tag>;
}
