"use client";

import { useEffect, useRef, useState } from "react";
import s from "./templates.module.css";

/// An app template's card: the note's table first, then, once, the app it becomes. About 600 ms after
/// the card is half in view the table blurs away while the iPhone app rises into its place. The app's
/// place is kept from the start, so nothing moves around it. With Reduce Motion it is the app at once.
export const SWAP_DELAY_MS = 600;

export default function AppSwap({ slug, title, children }: { slug: string; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [app, setApp] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { setApp(true); return; }
    let t = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      // The picture is decoded before it shows, so the table never blurs away onto an empty space.
      const img = el.querySelector("img");
      const ready = img ? img.decode().catch(() => {}) : Promise.resolve();
      t = window.setTimeout(() => { void ready.then(() => setApp(true)); }, SWAP_DELAY_MS);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => { io.disconnect(); window.clearTimeout(t); };
  }, []);
  const src = (m: "light" | "dark") => `/templates/apps/phone/${slug}-${m}.webp`;
  return (
    <span ref={ref} className={s.swap} data-app={app || undefined}>
      <span className={s.swapTable}>{children}</span>
      <span className={s.appScreen}>
        <img className={s.appLight} src={src("light")} alt={`${title} as an app on iPhone`} width={600} height={662} loading="eager" decoding="async" />
        <img className={s.appDark} src={src("dark")} alt="" aria-hidden="true" width={600} height={662} loading="lazy" decoding="async" />
      </span>
    </span>
  );
}
