"use client";

import { useEffect, useRef, useState } from "react";

/// When a figure has come into view, and seconds since. `?t=` freezes every figure at that second
/// (for screenshots); Reduce Motion shows the finished state.
export function useStage<T extends Element>() {
  const ref = useRef<T>(null);
  const [state, set] = useState<{ on: boolean; frozen: number | null }>({ on: false, frozen: null });
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("t");
    if (q !== null) { set({ on: true, frozen: Number(q) }); return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { set({ on: true, frozen: 99 }); return; }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { set({ on: true, frozen: null }); io.disconnect(); }
    }, { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, ...state };
}
