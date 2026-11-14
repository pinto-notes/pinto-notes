import s from "./home-i.module.css";

// Each card's paper world, cut from flat coloured paper with a soft shadow under every layer, the way
// the paper town footer reads: leaves for Notes, a dusk sky for Whiteboards, a café awning for Apps.
// A scene is two layers behind the app (back, then mid), so on hover they can part by a few pixels,
// plus one small piece in front that rests on the app's top edge. All vector, so always sharp.

export type World = "notes" | "whiteboards" | "apps";

/** A leaf: base at 0,0, pointing along +x, then moved to x, y and turned by a degrees. */
function Leaf({ x, y, len, w, a, fill }: { x: number; y: number; len: number; w: number; a: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={`M0 0 C${len * 0.28} ${-w} ${len * 0.72} ${-w * 0.9} ${len} 0 C${len * 0.7} ${w * 0.9} ${len * 0.3} ${w} 0 0Z`} fill={fill} />
      <path d={`M${len * 0.04} 0 Q${len * 0.5} ${-w * 0.08} ${len * 0.9} 0`} fill="none" stroke="rgba(255,255,255,0.42)" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

/** A cloud: a flat bottom and three bumps. */
const cloud = (x: number, y: number, k: number) =>
  `M${x} ${y} h${92 * k} a${16 * k} ${16 * k} 0 0 0 ${-14 * k} ${-24 * k} a${22 * k} ${22 * k} 0 0 0 ${-34 * k} ${-14 * k} a${24 * k} ${24 * k} 0 0 0 ${-40 * k} ${10 * k} a${14 * k} ${14 * k} 0 0 0 ${-4 * k} ${28 * k}z`;

/** A shadow under a cut-paper layer, coloured for its world. */
function Shade({ id, color, dy = 2, blur = 2.4, o = 0.24 }: { id: string; color: string; dy?: number; blur?: number; o?: number }) {
  return <filter id={id} x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy={dy} stdDeviation={blur} floodColor={color} floodOpacity={o} /></filter>;
}

/** A card's paper world behind its app. In a sheet, the world is drawn twice, left and mirrored right,
    at the card's scale, so the shapes keep their size on the wider page and frame the picture. */
export function Scene({ world, id, sheet }: { world: World; id: string; sheet?: boolean }) {
  if (!sheet) return <div className={s.scene} aria-hidden="true"><Layers world={world} id={id} /></div>;
  return (
    <div className={s.scene} data-sheet-scene="" aria-hidden="true">
      <div className={s.half}><Layers world={world} id={`${id}-l`} /></div>
      <div className={s.half} data-mirror=""><Layers world={world} id={`${id}-r`} mirror /></div>
    </div>
  );
}

/** The back and mid layers. Drawn in a 400 × 480 box, top-aligned; the app covers its middle. */
function Layers({ world, id, mirror }: { world: World; id: string; mirror?: boolean }) {
  const f = (n: string) => `${id}-${n}`;
  return (
    <>
      <svg className={s.layer} data-z="1" viewBox="0 0 400 480" preserveAspectRatio="xMidYMin slice">
        {world === "notes" && (
          <>
            <defs><Shade id={f("a")} color="#3f4d2b" o={0.16} /></defs>
            <g filter={`url(#${f("a")})`}>
              <Leaf x={-24} y={44} len={176} w={44} a={-12} fill="#d2dabc" />
              <Leaf x={4} y={-14} len={150} w={40} a={24} fill="#c7d1ad" />
              <Leaf x={424} y={40} len={176} w={44} a={192} fill="#d2dabc" />
              <Leaf x={396} y={-18} len={140} w={38} a={156} fill="#c7d1ad" />
              <Leaf x={-30} y={250} len={110} w={30} a={-28} fill="#c7d1ad" />
              <Leaf x={430} y={300} len={110} w={30} a={206} fill="#c7d1ad" />
            </g>
          </>
        )}
        {world === "whiteboards" && (
          <>
            <defs><Shade id={f("a")} color="#3a3f66" o={0.16} /></defs>
            {!mirror && <circle cx="292" cy="56" r="26" fill="#f6cf98" />}
            <g filter={`url(#${f("a")})`}>
              <path d="M0 52 C40 44 86 60 132 50 S226 38 270 52 S352 62 400 48 V480 H0Z" fill="#eed8cf" />
            </g>
          </>
        )}
        {world === "apps" && (
          <>
            <defs><Shade id={f("a")} color="#5b3215" o={0.16} /></defs>
            <g filter={`url(#${f("a")})`}>
              <path d="M110 480 V96 a90 90 0 0 1 180 0 V480Z" fill="#f9eee0" />
              <path d="M200 6 V480 M110 120 H290" stroke="#ead6bd" strokeWidth="5" />
            </g>
          </>
        )}
      </svg>
      <svg className={s.layer} data-z="2" viewBox="0 0 400 480" preserveAspectRatio="xMidYMin slice">
        {world === "notes" && (
          <>
            <defs><Shade id={f("b")} color="#33401f" o={0.22} /></defs>
            <g filter={`url(#${f("b")})`}>
              <Leaf x={-14} y={112} len={124} w={32} a={-34} fill="#a7b78a" />
              <Leaf x={36} y={-6} len={104} w={28} a={44} fill="#8fa274" />
              <Leaf x={414} y={104} len={128} w={32} a={212} fill="#a7b78a" />
              <Leaf x={350} y={-10} len={96} w={26} a={128} fill="#8fa274" />
              <Leaf x={-20} y={190} len={84} w={22} a={-8} fill="#8fa274" />
              <Leaf x={420} y={210} len={84} w={22} a={188} fill="#8fa274" />
            </g>
          </>
        )}
        {world === "whiteboards" && (
          <>
            <defs><Shade id={f("b")} color="#3a3f66" o={0.2} /></defs>
            <g filter={`url(#${f("b")})`}>
              <path d={cloud(36, 40, 0.74)} fill="#fffbf6" />
              <path d={cloud(176, 24, 0.5)} fill="#fffbf6" />
              <path d="M0 66 C50 54 96 70 150 60 S260 50 312 64 S380 70 400 62 V480 H0Z" fill="#bebfdc" />
            </g>
          </>
        )}
        {world === "apps" && (
          <>
            <defs><Shade id={f("b")} color="#5b3215" o={0.26} dy={3} blur={3} /></defs>
            {/* The awning: stripes, each ending in a scallop. */}
            <g filter={`url(#${f("b")})`}>
              {Array.from({ length: 11 }, (_, i) => (
                <path key={i} d={`M${i * 40 - 20} -10 H${i * 40 + 20} V14 a20 20 0 0 1 -40 0Z`} fill={i % 2 ? "#fbf3e8" : "#e3a983"} />
              ))}
            </g>
          </>
        )}
      </svg>
    </>
  );
}

/** The one piece in front: it rests on the app's top-right corner. */
export function Front({ world, id }: { world: World; id: string }) {
  const f = `${id}-front`;
  return (
    <svg className={s.front} data-world={world} viewBox="0 0 96 72" aria-hidden="true">
      {world === "notes" && (
        <>
          <defs><Shade id={f} color="#2c3a1a" o={0.28} dy={2} blur={2} /></defs>
          <g filter={`url(#${f})`}>
            <Leaf x={14} y={58} len={70} w={18} a={-38} fill="#b9c79c" />
            <Leaf x={22} y={64} len={62} w={16} a={-8} fill="#7f9566" />
          </g>
        </>
      )}
      {world === "whiteboards" && (
        <>
          <defs><Shade id={f} color="#30355c" o={0.26} dy={2} blur={2} /></defs>
          <path filter={`url(#${f})`} d={cloud(8, 66, 0.82)} fill="#fffdf9" />
        </>
      )}
      {world === "apps" && (
        <>
          <defs><Shade id={f} color="#4d2a10" o={0.3} dy={2} blur={2} /></defs>
          <g fill="none" stroke="#d9b796" strokeWidth="2.4" strokeLinecap="round">
            <path d="M40 22 c-6 -6 6 -10 0 -18" /><path d="M52 24 c-6 -6 6 -10 0 -18" />
          </g>
          <g filter={`url(#${f})`}>
            <ellipse cx="46" cy="68" rx="34" ry="5" fill="#f3e6d6" />
            <path d="M74 40 a10 10 0 1 1 0 18" fill="none" stroke="#fbf6ef" strokeWidth="5" />
            <path d="M22 32 H74 V50 a18 16 0 0 1 -18 16 H40 a18 16 0 0 1 -18 -16Z" fill="#fbf6ef" />
            <path d="M22 40 H74 V46 H22Z" fill="#c9875a" />
          </g>
        </>
      )}
    </svg>
  );
}
