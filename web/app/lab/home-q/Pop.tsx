"use client";

import { type ReactNode, useEffect, useRef } from "react";
import q from "./q.module.css";

// The headline's hover: as the pointer moves over the words, a paper object pops up under it, the
// letters beneath step back, and both settle in under a second. Without hover (phones), it plays once
// along the first line after the page has arrived. Off with Reduce Motion. Inspired by Wabi's type
// experiments (11-14), drawn with Pinto's own paper objects.

const OBJECTS = ["notepad", "lock", "envelope", "devices", "box", "bring", "tag", "undo"];
const LIFE = 900; // ms an object stays
const BACK = 650; // ms the letters under it stay faded

/** Splits words into letter spans, keeping each word unbreakable. */
function letters(text: string) {
  return text.split(" ").map((w, i, all) => (
    <span key={i} className={q.popWord}>
      {[...w].map((c, j) => <span key={j} data-c="">{c}</span>)}
      {i < all.length - 1 ? " " : null}
    </span>
  ));
}

export function PopTitle({ className, style, children }: { className: string; style?: React.CSSProperties; children?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const h = ref.current;
    if (!h || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chars = [...h.querySelectorAll<HTMLElement>("[data-c]")];
    const timers = new Map<HTMLElement, number>();
    const alive = new Set<number>();
    let k = 0;
    let last = { x: -1e4, y: -1e4 };
    const size = () => chars[0].getBoundingClientRect().height * 1.3;

    const spawn = (x: number, y: number) => {
      const s = size();
      const img = document.createElement("img");
      img.src = `/lab/q/pop/${OBJECTS[k++ % OBJECTS.length]}.webp`;
      img.alt = "";
      img.className = q.pop;
      img.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s}px;--r:${(Math.random() * 24 - 12).toFixed(1)}deg`;
      h.appendChild(img);
      alive.add(window.setTimeout(() => img.remove(), LIFE));
      const box = h.getBoundingClientRect();
      for (const c of chars) {
        const r = c.getBoundingClientRect();
        const cx = r.left - box.left + r.width / 2, cy = r.top - box.top + r.height / 2;
        if (Math.abs(cx - x) < s * 0.55 && Math.abs(cy - y) < s * 0.5) {
          c.dataset.hide = "";
          clearTimeout(timers.get(c));
          timers.set(c, window.setTimeout(() => delete c.dataset.hide, BACK));
        }
      }
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const box = h.getBoundingClientRect();
      const x = e.clientX - box.left, y = e.clientY - box.top;
      if (Math.hypot(x - last.x, y - last.y) < size() * 0.7) return;
      last = { x, y };
      spawn(x, y);
    };
    h.addEventListener("pointermove", move);

    // No hover: one pass along the first line, after the hero has risen in.
    if (!matchMedia("(hover: hover)").matches) {
      const top = chars[0].offsetTop;
      const line = chars.filter((c) => c.offsetTop === top && c.textContent?.trim());
      const box = () => h.getBoundingClientRect();
      line.forEach((c, i) => {
        if (i % 3) return;
        alive.add(window.setTimeout(() => {
          const r = c.getBoundingClientRect(), b = box();
          spawn(r.left - b.left + r.width / 2, r.top - b.top + r.height / 2);
        }, 1200 + i * 45));
      });
    }

    return () => {
      h.removeEventListener("pointermove", move);
      alive.forEach(clearTimeout);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <h1 ref={ref} className={`${className} ${q.popTitle}`} style={style}>
      <span className={q.srOnly}>The notebook for you and your AI.</span>
      <span aria-hidden="true">
        <span className={q.h1Line}>{letters("The notebook for")}</span> <em className={q.h1Em}>{letters("you and your AI")}</em>.
      </span>
      {children}
    </h1>
  );
}
