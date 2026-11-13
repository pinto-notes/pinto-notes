"use client";

import { useStage } from "./clock";
import h from "./h.module.css";

// The whiteboard draws itself: the real capture ("Publishing flow"), revealed stroke by stroke along
// its own lines in the order a person would draw it, then its fills. Coordinates are the capture's,
// on a 2000 × 1250 grid.

type S = { d: string; w: number; at: number; dur: number };
const STROKES: S[] = [
  { d: "M342 530 A107 57 0 1 1 556 530 A107 57 0 1 1 342 530", w: 26, at: 0, dur: 0.55 },
  { d: "M412 529 H488", w: 44, at: 0.5, dur: 0.22 },
  { d: "M556 529 H682", w: 40, at: 0.75, dur: 0.3 },
  { d: "M681 473 H918 V586 H681 Z", w: 26, at: 1.05, dur: 0.55 },
  { d: "M760 528 H842", w: 44, at: 1.55, dur: 0.22 },
  { d: "M918 529 H1020", w: 40, at: 1.8, dur: 0.25 },
  { d: "M1157 448 L1293 529 L1157 610 L1018 529 Z", w: 26, at: 2.05, dur: 0.55 },
  { d: "M1108 529 H1206", w: 44, at: 2.55, dur: 0.22 },
  { d: "M1293 529 H1420", w: 48, at: 2.8, dur: 0.35 },
  { d: "M1418 473 H1656 V586 H1418 Z", w: 26, at: 3.1, dur: 0.55 },
  { d: "M1490 528 H1588", w: 44, at: 3.6, dur: 0.22 },
  { d: "M1157 612 L1218 692 L1272 762", w: 64, at: 3.85, dur: 0.4 },
  { d: "M1043 773 H1268 V873 H1043 Z", w: 26, at: 4.2, dur: 0.5 },
  { d: "M1118 822 H1196", w: 44, at: 4.65, dur: 0.22 },
];
const FILLS_AT = 4.9;

export function Draw() {
  const { ref, on, frozen } = useStage<HTMLElement>();
  const style = { "--t": frozen ?? 0 } as React.CSSProperties;
  return (
    <figure ref={ref} className={`${h.frame} ${h.drawShot}`} data-on={on ? "" : undefined} data-frozen={frozen !== null ? "" : undefined} style={style}
      role="img" aria-label="A whiteboard in Pinto Notes called Publishing flow, drawing itself: Idea, then Draft, then Ready?; yes leads to Publish, no leads to Fix it.">
      <svg className={h.board} viewBox="0 0 2000 1250" aria-hidden="true">
        <defs>
          {/* While it draws, only the ink shows: the pale fills are lifted to white until they fade in. */}
          <filter id="h-lines" colorInterpolationFilters="sRGB">
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer><feFuncR type="table" tableValues="0 0.35 0.95 1 1" /><feFuncG type="table" tableValues="0 0.35 0.95 1 1" /><feFuncB type="table" tableValues="0 0.35 0.95 1 1" /></feComponentTransfer>
          </filter>
          <mask id="h-ink" maskUnits="userSpaceOnUse" x="0" y="0" width="2000" height="1250">
            {/* The app around the drawing (its toolbar) is there from the start. */}
            <rect x="0" y="1140" width="2000" height="110" fill="#fff" />
            <rect x="0" y="0" width="2000" height="90" fill="#fff" />
            <g className={h.ink} fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round">
              {STROKES.map((s) => (
                <path key={s.d} d={s.d} pathLength={1} strokeWidth={s.w}
                  style={{ "--d": s.at, "--dur": `${s.dur}s` } as React.CSSProperties} />
              ))}
            </g>
          </mask>
        </defs>
        <rect width="2000" height="1250" fill="#fff" />
        <image href="/lab/big3/canvas-focused-light-main.webp" width="2000" height="1250" mask="url(#h-ink)" filter="url(#h-lines)" />
        <image className={h.fills} href="/lab/big3/canvas-focused-light-main.webp" width="2000" height="1250"
          style={{ "--d": FILLS_AT } as React.CSSProperties} />
      </svg>
    </figure>
  );
}
