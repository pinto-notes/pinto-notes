import r from "./r.module.css";

// The pen: warm, hand-written notes in the margins (Caveat), and the strokes that go with them. Each
// stroke draws itself once its block is in view (see Reveal); the words fade in after it.

/** Hand-written words. `i` orders it among the block's other pen marks. */
export function Note({ children, className = "", i = 0, style }: { children: React.ReactNode; className?: string; i?: number; style?: React.CSSProperties }) {
  return <span className={`${r.pen} ${className}`} style={{ "--p": i, ...style } as React.CSSProperties} aria-hidden="true">{children}</span>;
}

/** A pen stroke: one or more paths in a box of w x h, placed by className. */
export function Stroke({ d, w, h, className = "", i = 0, width = 2.6, style }: {
  d: string | string[]; w: number; h: number; className?: string; i?: number; width?: number; style?: React.CSSProperties;
}) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg className={`${r.stroke} ${className}`} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true"
      style={{ "--p": i, ...style } as React.CSSProperties}>
      {paths.map((p, k) => <path key={k} d={p} pathLength={1} strokeWidth={width} style={{ "--k": k } as React.CSSProperties} />)}
    </svg>
  );
}
