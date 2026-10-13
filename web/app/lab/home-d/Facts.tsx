"use client";

import { useEffect, useRef } from "react";
import s from "./d.module.css";

// The four facts in the closing band, each a paper-cut icon, a short title and one line, and a small
// moment that proves it: on hover (Mac), or once as the row comes into view (touch). Under Reduce
// Motion nothing moves. Each moment is 400 ms or less and moves nothing around it.

export type Fact = { key: string; title?: string; line: React.ReactNode };
export const FACTS: Fact[] = [
  { key: "lock", title: "Encrypted", line: "Encrypted on your Mac before it syncs." },
  { key: "box", title: "Open source", line: "The code is on GitHub." },
  { key: "tag", title: "Free", line: "No ads, no tracking in the app." },
  { key: "undo", title: "Every change undoable", line: <>Undo any <span className={s.strike}>change<i aria-hidden="true">⌘Z</i></span>, yours or your AI&apos;s.</> },
];

/// `items` replaces the four facts (home-g: three lines, no titles); `light` sets them on cream.
export default function Facts({ items = FACTS, light = false }: { items?: Fact[]; light?: boolean } = {}) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(hover: none)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const tile = e.target as HTMLElement;
        tile.dataset.play = "";
        window.setTimeout(() => delete tile.dataset.play, 1400);
      }
    }, { threshold: 0.8 });
    el.querySelectorAll("li").forEach((li) => io.observe(li));
    return () => io.disconnect();
  }, []);
  return (
    <ul ref={ref} className={s.facts} data-light={light || undefined} data-count={items.length}>
      {items.map((f) => (
        <li key={f.key} className={s.fact} data-fact={f.key}>
          <span className={s.factIcon} aria-hidden="true">
            <span className={s.factFlip}>
              <img src={`/home-d/facts/${f.key}.webp`} alt="" width={96} height={96} loading="lazy" decoding="async" />
              {f.key === "tag" && <span className={s.factBack}>0</span>}
            </span>
          </span>
          {f.title && <b>{f.title}</b>}
          <span className={s.factLine}>
            {f.key === "lock" && typeof f.line === "string" ? <Scramble text={f.line} /> : f.line}
          </span>
        </li>
      ))}
    </ul>
  );
}

/// The line as words, each with a run of dots laid over it: the dots take each word's own box, so the
/// block keeps its lines, their lengths and their wraps when it turns to dots.
function Scramble({ text }: { text: string }) {
  return (
    <span className={s.scramble}>
      {text.split(" ").map((w, i, all) => (
        <span key={i}><span className={s.word} data-dots={"•".repeat(w.length)}>{w}</span>{i < all.length - 1 ? " " : ""}</span>
      ))}
    </span>
  );
}

/// One word struck through and brought back with ⌘Z when its fact's moment plays (the undo fact).
export function Struck({ children }: { children: React.ReactNode }) {
  return <span className={s.strike}>{children}<i aria-hidden="true">⌘Z</i></span>;
}
