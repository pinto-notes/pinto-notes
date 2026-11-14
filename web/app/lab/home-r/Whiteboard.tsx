"use client";

import { useEffect, useRef } from "react";
import { still } from "./Reveal";
import r from "./r.module.css";
import { arrow, box, clean, curve, diamond, ellipse, rng } from "./sketch";

// The whiteboard, full width, in Excalidraw's hand-drawn look and font: the "Publishing flow" from
// the app's capture (public/lab/big3/canvas-selected-light-main.webp), same words and fills. It draws
// itself stroke by stroke as you scroll: Idea, Draft, Ready?, Publish. Then Claude's cursor comes in
// and adds its part: the "no" branch, the Fix it box and the arrow back to Draft. Scroll back up and
// it un-draws. Without JavaScript, with Reduce Motion or `?t=`, it is simply there, finished.

type Step = { k: "ink" | "show"; a: number; b: number };
const ink = (d: string, a: number, b: number, key: string, ai = false) =>
  <path key={key} className={r.ink} data-ai={ai || undefined} d={d} pathLength={1} data-k="ink" data-a={a} data-b={b} />;
const show = (a: number, b: number, children: React.ReactNode, key?: string) =>
  <g key={key} data-k="show" data-a={a} data-b={b}>{children}</g>;
const word = (x: number, y: number, t: string, size: number) =>
  <text className={r.bWord} x={x} y={y} fontSize={size} textAnchor="middle">{t}</text>;

function Cursor({ name = "Claude" }: { name?: string }) {
  return (
    <g>
      <path d="M0 0 L0 22 L6 16.4 L10.4 26 L14.2 24.2 L10 15 L17.6 14.8 Z" fill="#d97757" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="18" y="20" width="70" height="27" rx="8" fill="#d97757" />
      <text x="53" y="38.5" className={r.bCursorName} textAnchor="middle">{name}</text>
    </g>
  );
}

/** Desktop: the capture's layout, Idea to Publish in a row, Fix it under Ready?. */
function Wide() {
  const g = rng(11);
  const a1 = arrow(g, 266, 300, 340, 300), a2 = arrow(g, 548, 300, 618, 300), a3 = arrow(g, 820, 300, 896, 300), a4 = arrow(g, 724, 374, 724, 452);
  const loop = curve(g, 612, 508, 452, 520, 446, 362);
  return (
    <svg className={r.bWide} viewBox="40 170 1120 420" aria-hidden="true">
      {show(0.06, 0.12, <ellipse cx={170} cy={300} rx={92} ry={52} fill="#ffec99" />)}
      {ink(ellipse(g, 170, 300, 92, 52), 0, 0.1, "i")}
      {show(0.08, 0.12, word(170, 310, "Idea", 32))}
      {ink(a1[0], 0.12, 0.16, "a1")}{ink(a1[1], 0.16, 0.18, "a1h")}
      {ink(box(g, 346, 248, 196, 104), 0.18, 0.28, "d")}
      {show(0.26, 0.3, word(444, 310, "Draft", 32))}
      {ink(a2[0], 0.3, 0.34, "a2")}{ink(a2[1], 0.34, 0.36, "a2h")}
      {ink(diamond(g, 722, 300, 98, 72), 0.36, 0.46, "r")}
      {show(0.44, 0.48, word(722, 310, "Ready?", 28))}
      {ink(a3[0], 0.48, 0.53, "a3")}{ink(a3[1], 0.53, 0.55, "a3h")}
      {show(0.52, 0.56, word(858, 284, "yes", 24))}
      {show(0.62, 0.66, <path d={clean(902, 248, 204, 104)} fill="#b2f2bb" />)}
      {ink(box(g, 902, 248, 204, 104), 0.56, 0.65, "p")}
      {show(0.63, 0.67, word(1004, 310, "Publish", 32))}
      {/* Claude's part. */}
      {ink(a4[0], 0.74, 0.79, "a4", true)}{ink(a4[1], 0.79, 0.81, "a4h", true)}
      {show(0.79, 0.82, word(752, 420, "no", 24))}
      {show(0.88, 0.91, <path d={clean(618, 458, 212, 98)} fill="#ffc9c9" />)}
      {ink(box(g, 618, 458, 212, 98), 0.81, 0.9, "f", true)}
      {show(0.88, 0.92, word(724, 517, "Fix it", 32))}
      {ink(loop[0], 0.91, 0.97, "l", true)}{ink(loop[1], 0.97, 0.99, "lh", true)}
      <g data-cursor="" data-path="1240,120 744,392 744,452 836,560 600,540" transform="translate(600 540)"><Cursor /></g>
    </svg>
  );
}

/** Phone: the same flow stacked, the two branches side by side under Ready?. */
function Tall() {
  const g = rng(12);
  const a1 = arrow(g, 180, 100, 180, 138, 11), a2 = arrow(g, 180, 222, 180, 262, 11);
  const yes = arrow(g, 226, 372, 262, 446, 11), no = arrow(g, 134, 372, 98, 446, 11);
  return (
    <svg className={r.bTall} viewBox="0 10 360 560" aria-hidden="true">
      {show(0.06, 0.12, <ellipse cx={180} cy={62} rx={70} ry={36} fill="#ffec99" />)}
      {ink(ellipse(g, 180, 62, 70, 36), 0, 0.1, "i")}
      {show(0.08, 0.12, word(180, 71, "Idea", 26))}
      {ink(a1[0], 0.12, 0.16, "a1")}{ink(a1[1], 0.16, 0.18, "a1h")}
      {ink(box(g, 92, 144, 176, 74), 0.18, 0.28, "d")}
      {show(0.26, 0.3, word(180, 190, "Draft", 26))}
      {ink(a2[0], 0.3, 0.34, "a2")}{ink(a2[1], 0.34, 0.36, "a2h")}
      {ink(diamond(g, 180, 330, 88, 62), 0.36, 0.46, "r")}
      {show(0.44, 0.48, word(180, 339, "Ready?", 23))}
      {ink(yes[0], 0.48, 0.53, "y")}{ink(yes[1], 0.53, 0.55, "yh")}
      {show(0.52, 0.56, word(270, 404, "yes", 20))}
      {show(0.62, 0.66, <path d={clean(196, 452, 152, 74)} fill="#b2f2bb" />)}
      {ink(box(g, 196, 452, 152, 74), 0.56, 0.65, "p")}
      {show(0.63, 0.67, word(272, 497, "Publish", 25))}
      {ink(no[0], 0.74, 0.79, "n", true)}{ink(no[1], 0.79, 0.81, "nh", true)}
      {show(0.79, 0.82, word(92, 404, "no", 20))}
      {show(0.88, 0.91, <path d={clean(12, 452, 152, 74)} fill="#ffc9c9" />)}
      {ink(box(g, 12, 452, 152, 74), 0.81, 0.9, "f", true)}
      {show(0.88, 0.92, word(88, 497, "Fix it", 25))}
      <g data-cursor="" data-path="420,200 140,380 104,440 150,530 140,540" transform="translate(140 540)"><Cursor /></g>
    </svg>
  );
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (t: number) => t * t * (3 - 2 * t);

/** Places the cursor along its waypoints: in from the side at 0.64, then along with Claude's strokes. */
function cursorAt(path: number[][], p: number) {
  const keys = [0.64, 0.74, 0.81, 0.9, 0.99];
  if (p <= keys[0]) return path[0];
  for (let i = 1; i < keys.length; i++) {
    if (p <= keys[i]) {
      const t = ease((p - keys[i - 1]) / (keys[i] - keys[i - 1]));
      return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t];
    }
  }
  return path[path.length - 1];
}

export function Whiteboard() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || still()) return;
    const steps = [...el.querySelectorAll<SVGElement>("[data-a]")].map((n) => ({ n, k: n.dataset.k as Step["k"], a: Number(n.dataset.a), b: Number(n.dataset.b) }));
    const cursors = [...el.querySelectorAll<SVGGElement>("[data-cursor]")].map((n) => ({
      n, path: (n.dataset.path ?? "").split(" ").map((pt) => pt.split(",").map(Number)),
    }));
    let raf = 0;
    const draw = () => {
      raf = 0;
      const b = el.getBoundingClientRect(), vh = innerHeight;
      // 0 when the board's top is at 92% of the screen; 1 when its top is at 40%.
      const p = clamp((vh * 0.92 - b.top) / (vh * 0.52));
      for (const s of steps) {
        const t = clamp((p - s.a) / (s.b - s.a));
        if (s.k === "ink") { s.n.style.strokeDashoffset = String(1 - t); s.n.style.opacity = t > 0.001 ? "1" : "0"; }
        else s.n.style.opacity = String(t);
      }
      el.parentElement?.style.setProperty("--bp", p.toFixed(3));
      for (const c of cursors) {
        const [x, y] = cursorAt(c.path, p);
        c.n.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        c.n.style.opacity = String(clamp((p - 0.62) / 0.04));
      }
    };
    el.dataset.scroll = "";
    draw();
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} className={r.bBox} role="img"
      aria-label="A whiteboard called Publishing flow, drawn by hand: Idea, then Draft, then Ready? If yes, Publish. If no, Fix it, and back to Draft. Claude draws the no branch.">
      <Wide />
      <Tall />
    </div>
  );
}

/** The small sketch on the first screen: Idea to Draft to Publish, with Claude's cursor. Static. */
export function MiniBoard() {
  const g = rng(5);
  const a1 = arrow(g, 104, 92, 136, 92, 10), a2 = arrow(g, 192, 122, 192, 158, 10);
  return (
    <svg className={r.mini} viewBox="-56 0 370 250" aria-hidden="true">
      <ellipse cx={62} cy={92} rx={40} ry={26} fill="#ffec99" />
      <path className={r.ink} d={ellipse(g, 62, 92, 40, 26)} />
      {word(62, 99, "Idea", 19)}
      <path className={r.ink} d={a1[0]} /><path className={r.ink} d={a1[1]} />
      <path className={r.ink} d={box(g, 140, 64, 104, 56, 10)} />
      {word(192, 99, "Draft", 19)}
      <path className={r.ink} d={a2[0]} /><path className={r.ink} d={a2[1]} />
      <path d={clean(136, 162, 112, 54, 10)} fill="#b2f2bb" />
      <path className={r.ink} d={box(g, 136, 162, 112, 54, 10)} />
      {word(192, 196, "Publish", 19)}
      <g transform="translate(222 26) scale(0.82)"><Cursor /></g>
    </svg>
  );
}
