import { diamond, ellipse, head, line, roundRect, type Pt } from "./rough";
import s from "./f.module.css";

// The "Publishing flow" whiteboard from the app's captures (Idea, Draft, Ready?, Publish, Fix it),
// drawn stroke by stroke as the AI makes it. Same shapes, colours and hand-drawn font as the app's
// whiteboard (Excalidraw); the toolbar's active tool follows what is being drawn.

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };

export type Tool = "select" | "hand" | "pen" | "rect" | "ellipse" | "diamond" | "arrow" | "text" | "eraser";

type Shape = { kind: "ellipse" | "rect" | "diamond"; x: number; y: number; w: number; h: number; fill?: string; text: string; at: number; seed: number };
type Arrow = { kind: "arrow"; from: Pt; to: Pt; at: number; seed: number; label?: { text: string; x: number; y: number; gap?: [number, number] } };
type El = Shape | Arrow;

const YELLOW = "#ffec99", GREEN = "#b2f2bb", RED = "#ffc9c9";

// Seconds after the drawing starts. Shapes take 0.55 s, their words 0.3 s; arrows 0.32 s.
const WIDE: El[] = [
  { kind: "ellipse", x: 10, y: 102, w: 170, h: 96, fill: YELLOW, text: "Idea", at: 0, seed: 11 },
  { kind: "arrow", from: [184, 150], to: [262, 150], at: 0.95, seed: 12 },
  { kind: "rect", x: 266, y: 104, w: 190, h: 92, text: "Draft", at: 1.35, seed: 13 },
  { kind: "arrow", from: [460, 150], to: [538, 150], at: 2.25, seed: 14 },
  { kind: "diamond", x: 540, y: 84, w: 220, h: 132, text: "Ready?", at: 2.65, seed: 15 },
  { kind: "arrow", from: [764, 150], to: [880, 150], at: 3.55, seed: 16, label: { text: "yes", x: 822, y: 150, gap: [0.26, 0.74] } },
  { kind: "rect", x: 884, y: 104, w: 190, h: 92, fill: GREEN, text: "Publish", at: 4.05, seed: 17 },
  { kind: "arrow", from: [652, 220], to: [744, 332], at: 5.0, seed: 18, label: { text: "no", x: 698, y: 277, gap: [0.36, 0.66] } },
  { kind: "rect", x: 626, y: 336, w: 184, h: 86, fill: RED, text: "Fix it", at: 5.5, seed: 19 },
];
const TALL: El[] = [
  { kind: "ellipse", x: 50, y: 8, w: 160, h: 86, fill: YELLOW, text: "Idea", at: 0, seed: 21 },
  { kind: "arrow", from: [130, 98], to: [130, 150], at: 0.95, seed: 22 },
  { kind: "rect", x: 40, y: 154, w: 180, h: 78, text: "Draft", at: 1.35, seed: 23 },
  { kind: "arrow", from: [130, 236], to: [130, 290], at: 2.25, seed: 24 },
  { kind: "diamond", x: 25, y: 294, w: 210, h: 126, text: "Ready?", at: 2.65, seed: 25 },
  { kind: "arrow", from: [130, 424], to: [130, 484], at: 3.55, seed: 26, label: { text: "yes", x: 158, y: 456 } },
  { kind: "rect", x: 40, y: 488, w: 180, h: 70, fill: GREEN, text: "Publish", at: 4.05, seed: 27 },
  { kind: "arrow", from: [238, 357], to: [292, 357], at: 5.0, seed: 28, label: { text: "no", x: 264, y: 336 } },
  { kind: "rect", x: 296, y: 320, w: 100, h: 74, fill: RED, text: "Fix it", at: 5.5, seed: 29 },
];
/** When the last stroke lands, in seconds after the drawing starts. */
export const BOARD_DONE = 6.4;

const SHAPE = 0.55, WORDS = 0.3, SHAFT = 0.32;

function Stroke({ d, p, width = 3 }: { d: string; p: number; width?: number }) {
  if (p <= 0) return null;
  return <path d={d} pathLength={1} fill="none" stroke="#1e1e1e" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"
    strokeDasharray="1 1" strokeDashoffset={(1 - p).toFixed(4)} />;
}

/** Hand-written words, letter by letter. */
function Words({ text, x, y, t, size }: { text: string; x: number; y: number; t: number; size: number }) {
  if (t <= 0) return null;
  const n = text.length;
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" className={s.hand} fontSize={size} fill="#1e1e1e">
      {[...text].map((c, i) => <tspan key={i} opacity={clamp(t * n * 1.25 - i)}>{c}</tspan>)}
    </text>
  );
}

function shapePaths(e: Shape): [string, string] {
  if (e.kind === "ellipse") return ellipse(e.x + e.w / 2, e.y + e.h / 2, e.w / 2, e.h / 2, e.seed);
  if (e.kind === "diamond") return diamond(e.x + e.w / 2, e.y + e.h / 2, e.w, e.h, e.seed);
  return roundRect(e.x, e.y, e.w, e.h, e.seed);
}

/** The tool the toolbar shows at time t (seconds after the drawing starts). */
export function toolAt(t: number, tall: boolean): Tool {
  if (t < 0) return "rect";
  const els = tall ? TALL : WIDE;
  let tool: Tool = "rect";
  for (const e of els) {
    if (t < e.at) break;
    if (e.kind === "arrow") tool = e.label && t > e.at + SHAFT ? "text" : "arrow";
    else tool = t > e.at + SHAPE ? "text" : e.kind;
  }
  return t > BOARD_DONE ? "select" : tool;
}

export function Board({ t, tall }: { t: number; tall: boolean }) {
  const els = tall ? TALL : WIDE;
  const size = tall ? 25 : 30;
  const w = tall ? 0.78 : 1;
  return (
    <svg className={s.board} data-tall={tall ? "" : undefined} viewBox={tall ? "0 0 400 566" : "0 0 1084 430"} role="img"
      aria-label="A whiteboard called Publishing flow: Idea, then Draft, then Ready?. Yes leads to Publish, no leads to Fix it.">
      {els.map((e, i) => {
        const local = t - e.at;
        if (local <= 0) return null;
        if (e.kind === "arrow") {
          const [a, b] = line(e.from, e.to, e.seed);
          const p = ease(local / SHAFT);
          const gap = e.label?.gap;
          const lt = e.label ? (local - SHAFT * (gap ? gap[0] : 1)) / WORDS : 0;
          return (
            <g key={i}>
              {gap ? (
                <>
                  <mask id={`gap${i}${tall ? "t" : "w"}`} maskUnits="userSpaceOnUse">
                    <rect x="-50" y="-50" width="1200" height="700" fill="#fff" />
                    <circle cx={e.label!.x} cy={e.label!.y} r={e.label!.text === "yes" ? 30 : 22} fill="#000" />
                  </mask>
                  <g mask={`url(#gap${i}${tall ? "t" : "w"})`}><Stroke d={a} p={p} width={3 * w} /><Stroke d={b} p={ease((local - 0.04) / SHAFT)} width={2 * w} /></g>
                </>
              ) : (<><Stroke d={a} p={p} width={3 * w} /><Stroke d={b} p={ease((local - 0.04) / SHAFT)} width={2 * w} /></>)}
              <Stroke d={head(e.from, e.to, e.seed + 100, tall ? 15 : 18)} p={ease((local - SHAFT) / 0.12)} width={3 * w} />
              {e.label && <Words text={e.label.text} x={e.label.x} y={e.label.y} t={lt} size={size - 4} />}
            </g>
          );
        }
        const [a, b] = shapePaths(e);
        const p1 = ease(local / SHAPE), p2 = ease((local - 0.08) / SHAPE);
        const fill = ease((local - SHAPE + 0.05) / 0.18);
        return (
          <g key={i}>
            {e.fill && fill > 0 && <path d={a} fill={e.fill} opacity={fill} />}
            <Stroke d={a} p={p1} width={3.1 * w} />
            <Stroke d={b} p={p2} width={2 * w} />
            <Words text={e.text} x={e.x + e.w / 2} y={e.y + e.h / 2 + 1} t={(local - SHAPE) / WORDS} size={size} />
          </g>
        );
      })}
    </svg>
  );
}

const I: Record<Tool, React.ReactNode> = {
  select: <path d="M7 4.5v14l3.6-3.4 2.4 5.4 2.2-1-2.4-5.2h5z" fill="currentColor" stroke="none" />,
  hand: <path d="M9 12V6.5a1.3 1.3 0 0 1 2.6 0V11m0-5.5V5a1.3 1.3 0 0 1 2.6 0v6m0-5a1.3 1.3 0 0 1 2.6 0v6.5m0-4a1.3 1.3 0 0 1 2.6 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.6-2.2L5 15.4a1.4 1.4 0 0 1 2.2-1.7L9 15.5" />,
  pen: <path d="M6 18 17 7" />,
  rect: <rect x="4.5" y="6.5" width="15" height="11" rx="2" />,
  ellipse: <circle cx="12" cy="12" r="7" />,
  diamond: <path d="M12 4.5 19.5 12 12 19.5 4.5 12z" />,
  arrow: <path d="M6 18 18 6m-7 0h7v7" />,
  text: <text x="12" y="16.5" textAnchor="middle" fontSize="12.5" fontWeight="500" fill="currentColor" stroke="none" fontFamily="-apple-system, system-ui, sans-serif">Aa</text>,
  eraser: <path d="m13.5 5.5 5 5-8 8h-4l-2-2a1.5 1.5 0 0 1 0-2.1zM9 10l5 5" />,
};
const ORDER: Tool[] = ["select", "hand", "pen", "rect", "ellipse", "diamond", "arrow", "text", "eraser"];

/** The whiteboard's floating toolbar, as in the app. */
export function BoardTools({ tool, compact }: { tool: Tool; compact: boolean }) {
  const tools = compact ? ORDER.filter((x) => x !== "hand" && x !== "eraser") : ORDER;
  return (
    <div className={s.tools} aria-hidden="true">
      {!compact && <>
        <svg viewBox="0 0 24 24" className={s.toolMuted}><path d="M9 14 4.5 9.5 9 5M5 9.5h9a5 5 0 0 1 0 10h-2" /></svg>
        <svg viewBox="0 0 24 24" className={s.toolMuted}><path d="m15 14 4.5-4.5L15 5m4 4.5h-9a5 5 0 0 0 0 10h2" /></svg>
        <i className={s.toolGap} />
      </>}
      {tools.map((x) => <svg key={x} viewBox="0 0 24 24" data-on={x === tool ? "" : undefined}>{I[x]}</svg>)}
    </div>
  );
}
