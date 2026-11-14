import { cut, leaf, oval } from "./rough";
import s from "./pic.module.css";

// Study Q's paper rooms: study N's dioramas grown to section size. Each room is a stack of flat
// cut-paper planes (a far view, a wall with a window cut in it, a sill or a table) with soft shadows
// between them, and the real piece of Pinto standing in front. A few props (a plant, a mug) sit in
// front of the window so the paper frames the product. Everything is SVG, so it stays sharp.
// The scene's space is 1000 x 800; it is cropped like object-fit: cover, so a taller room on a phone
// keeps the middle.

type P = [number, number];
const rect = (x: number, y: number, w: number, h: number): P[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** A wall with a hole cut in it: the wall runs off the room on every side, so only the hole's edge shows. */
const wall = (hole: string) => `M-80 -80 H1080 V880 H-80 Z ${hole}`;

/** `low`: crop from the top, keeping the floor (for the wide, short rooms). */
function Plane({ shade = true, children, front = false, low = false }: { shade?: boolean; front?: boolean; low?: boolean; children: React.ReactNode }) {
  return (
    <div className={s.plane} data-shade={shade ? "" : undefined} data-front={front ? "" : undefined} aria-hidden="true">
      <svg viewBox="0 0 1000 800" preserveAspectRatio={low ? "xMidYMax slice" : "xMidYMid slice"}>{children}</svg>
    </div>
  );
}

export type Scene = "morning" | "night" | "cafe" | "dusk" | "evening";

/** One room: the planes behind, the product (children) in the middle, the props in front. */
export function Room({ scene, children, className = "" }: { scene: Scene; children: React.ReactNode; className?: string }) {
  const S = SCENES[scene];
  return (
    <div className={`${s.room} ${className}`} data-scene={scene}>
      {S.back}
      <div className={s.product}>{children}</div>
      {S.front}
      <div className={s.edge} aria-hidden="true" />
    </div>
  );
}

/* ── Morning (Write): a big window over the rooftops at sunrise, a plant on the sill ── */
const M = {
  sun: cut(oval(250, 200, 70, 70, 40), 5, 1.2),
  hill: cut([...oval(260, 470, 380, 70, 36, Math.PI, Math.PI * 2), [700, 560], [-120, 560]], 4, 1.4),
  roofs: cut([[-60, 470], [20, 470], [20, 420], [70, 380], [120, 420], [120, 445], [200, 445], [200, 400], [290, 400], [290, 436], [390, 436], [390, 384], [420, 356], [450, 384], [450, 452], [540, 452], [540, 410], [610, 410], [610, 470], [700, 470], [700, 560], [-60, 560]], 3, 1.3, 14),
  hole: cut(rect(60, 70, 520, 450), 6, 1.6, 14),
  frame: `${cut(rect(44, 54, 552, 482), 7, 1.4, 14)} ${cut(rect(66, 76, 508, 438), 8, 1.2, 14)}`,
  bars: [cut(rect(312, 76, 14, 438), 9, 0.8), cut(rect(66, 290, 508, 13), 10, 0.8)],
  sill: cut(rect(20, 536, 610, 26), 11, 1),
  sillLip: cut(rect(30, 562, 590, 12), 12, 0.6),
  floor: cut([[-80, 700], [1080, 700], [1080, 880], [-80, 880]], 27, 1.6),
  beam: cut([[90, 574], [330, 574], [240, 880], [-60, 880]], 13, 2),
  pot: cut([[42, 668], [150, 668], [138, 760], [54, 760]], 15, 1),
  potRim: cut(rect(34, 654, 124, 20), 16, 0.8),
  leaves: [
    { d: cut(leaf(94, 664, 160, -2.0), 17, 1), c: "#5d8a4c" },
    { d: cut(leaf(98, 664, 190, -1.6), 18, 1), c: "#6f9d58" },
    { d: cut(leaf(102, 664, 150, -1.12), 19, 1), c: "#5d8a4c" },
    { d: cut(leaf(90, 668, 120, -2.6, 0.36), 20, 0.8), c: "#7fae66" },
    { d: cut(leaf(106, 668, 130, -0.6, 0.36), 21, 0.8), c: "#7fae66" },
  ],
};

/* ── Night (Draw): a tall window with the moon over the rooftops, a desk, a mug ── */
const STARS: P[] = [[690, 110], [760, 80], [880, 130], [930, 230], [720, 200], [840, 280], [660, 260], [920, 70], [800, 170]];
const N = {
  moon: cut(oval(850, 170, 46, 46, 34), 30, 1),
  moonBite: cut(oval(870, 156, 40, 40, 30), 31, 0.8),
  roofs: cut([[600, 520], [600, 420], [650, 420], [650, 390], [680, 360], [710, 390], [710, 436], [770, 436], [770, 400], [830, 400], [830, 376], [852, 350], [874, 376], [874, 420], [960, 420], [1080, 420], [1080, 600], [600, 600]], 32, 1.2, 14),
  roofs2: cut([[600, 540], [600, 470], [670, 470], [670, 488], [740, 488], [740, 460], [810, 460], [810, 480], [880, 480], [880, 452], [1080, 452], [1080, 600], [600, 600]], 33, 1.2, 14),
  hole: cut(rect(620, 50, 330, 480), 34, 1.6, 14),
  frame: `${cut(rect(604, 34, 362, 512), 35, 1.3, 14)} ${cut(rect(624, 54, 322, 472), 36, 1.1, 14)}`,
  bar: cut(rect(778, 54, 13, 472), 37, 0.7),
  desk: cut([[-80, 690], [1080, 690], [1080, 900], [-80, 900]], 38, 1.8),
  deskEdge: cut([[-80, 690], [1080, 690], [1080, 704], [-80, 704]], 39, 1),
  mug: cut([[862, 618], [938, 618], [932, 708], [868, 708]], 48, 0.9),
  mugHandle: `${cut(oval(944, 652, 22, 22, 22), 49, 0.6)} ${cut(oval(944, 652, 11, 11, 18), 50, 0.5)}`,
  pencil: cut([[700, 742], [900, 722], [902, 734], [702, 754]], 51, 0.5),
  tip: cut([[900, 722], [924, 727], [902, 734]], 52, 0.3),
};

/* ── Café (Build): striped awning, the water through the window, a table ── */
const C = {
  water: cut([[-80, 400], [1080, 400], [1080, 600], [-80, 600]], 60, 1),
  shore: cut([[-80, 404], [-80, 360], [60, 360], [60, 320], [100, 320], [100, 300], [116, 272], [132, 300], [132, 340], [240, 340], [240, 356], [330, 356], [330, 316], [420, 316], [420, 346], [540, 346], [540, 330], [610, 300], [680, 330], [680, 350], [780, 350], [780, 280], [796, 252], [812, 280], [812, 340], [1080, 340], [1080, 404]], 61, 1.2, 14),
  glints: [cut(rect(120, 450, 90, 5), 62, 0.5), cut(rect(560, 480, 120, 5), 63, 0.5), cut(rect(330, 530, 70, 5), 64, 0.5)],
  hole: cut(rect(40, 150, 920, 470), 65, 1.6, 14),
  bar: cut(rect(492, 150, 16, 470), 66, 0.7),
  awning: Array.from({ length: 11 }, (_, i) => {
    const x = -80 + i * 112, pts: P[] = [[x, -80], [x + 112, -80], [x + 112, 110]];
    for (let k = 1; k < 10; k++) { const a = (k / 10) * Math.PI; pts.push([x + 56 + 56 * Math.cos(a), 110 + 26 * Math.sin(a)]); }
    pts.push([x, 110]);
    return { d: cut(pts, 70 + i, 1, 12), c: i % 2 ? "#fbf1e3" : "#e8864a" };
  }),
  table: cut([[-80, 700], [1080, 700], [1080, 900], [-80, 900]], 80, 1.6),
  tableEdge: cut([[-80, 700], [1080, 700], [1080, 716], [-80, 716]], 81, 1),
};

/* ── Dusk (your AI): a wide evening sky, low sun, layered hills and a town ── */
const D = {
  sun: cut(oval(760, 420, 90, 90, 44), 90, 1.4),
  far: cut([...oval(300, 520, 560, 120, 40, Math.PI, Math.PI * 2), [900, 620], [-300, 620]], 91, 1.6, 16),
  mid: cut([...oval(820, 560, 520, 110, 40, Math.PI, Math.PI * 2), [1400, 680], [240, 680]], 92, 1.6, 16),
  town: cut([[-80, 640], [-80, 590], [10, 590], [10, 560], [50, 530], [90, 560], [90, 580], [170, 580], [170, 540], [240, 540], [240, 570], [330, 570], [330, 520], [352, 490], [374, 520], [374, 590], [470, 590], [470, 556], [560, 556], [560, 584], [660, 584], [660, 548], [720, 548], [720, 590], [820, 590], [820, 560], [900, 560], [900, 530], [930, 506], [960, 530], [960, 600], [1080, 600], [1080, 700], [-80, 700]], 93, 1.2, 14),
  near: cut([[-80, 680], [1080, 680], [1080, 900], [-80, 900]], 94, 1.8),
};
const LIGHTS: P[] = [[30, 600], [120, 596], [196, 560], [300, 592], [350, 540], [500, 600], [600, 598], [690, 566], [860, 590], [920, 548]];

/* ── Evening (Mac and iPhone): a warm wall, a shelf with a plant and books, a long desk ── */
const E = {
  pot: cut([[14, 716], [74, 716], [68, 770], [20, 770]], 104, 0.6),
  leaves: [cut(leaf(44, 716, 80, -2.1), 105, 0.7), cut(leaf(44, 716, 96, -1.65), 106, 0.7), cut(leaf(44, 716, 74, -1.2), 107, 0.7)],
  glow: cut(oval(840, 300, 220, 170, 40), 109, 1.4),
  desk: cut([[-80, 700], [1080, 700], [1080, 900], [-80, 900]], 110, 1.6),
  deskEdge: cut([[-80, 700], [1080, 700], [1080, 714], [-80, 714]], 111, 1),
};

const SCENES: Record<Scene, { back: React.ReactNode; front: React.ReactNode }> = {
  morning: {
    back: (
      <>
        <Plane shade={false}>
          <rect x="-80" y="-80" width="1160" height="960" fill="#fde6c3" />
          <path d={M.sun} fill="#ffcf7c" />
          <path d={M.hill} fill="#efc896" />
          <path d={M.roofs} fill="#e9b984" />
        </Plane>
        <Plane>
          <path d={wall(M.hole)} fill="#efd0a6" fillRule="evenodd" />
          <path d={M.frame} fill="#fbf2e4" fillRule="evenodd" />
          {M.bars.map((d, i) => <path key={i} d={d} fill="#fbf2e4" />)}
          <path d={M.floor} fill="#e7bf8f" />
        </Plane>
        <Plane>
          <path d={M.sill} fill="#fdf6ec" />
          <path d={M.sillLip} fill="#e9d6bd" />
          <path d={M.beam} fill="#fff8e8" opacity="0.45" />
        </Plane>
      </>
    ),
    front: (
      <Plane front>
        {M.leaves.map((l, i) => <path key={i} d={l.d} fill={l.c} />)}
        <path d={M.pot} fill="#cf6f43" />
        <path d={M.potRim} fill="#dc8556" />
      </Plane>
    ),
  },
  night: {
    back: (
      <>
        <Plane shade={false}>
          <rect x="-80" y="-80" width="1160" height="960" fill="#2a3150" />
          {STARS.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 2.4 : 3.4} fill="#f6e3b8" opacity="0.85" />)}
          <path d={N.moon} fill="#f7e6bd" />
          <path d={N.moonBite} fill="#2a3150" />
          <path d={N.roofs} fill="#222842" />
          {[[660, 410], [690, 404], [790, 418], [846, 400], [920, 440]].map(([x, y], i) => <rect key={i} x={x} y={y} width="9" height="11" fill="#f2b45a" />)}
          <path d={N.roofs2} fill="#1a1f35" />
        </Plane>
        <Plane>
          <path d={wall(N.hole)} fill="#3c3754" fillRule="evenodd" />
          <path d={N.frame} fill="#2e2a43" fillRule="evenodd" />
          <path d={N.bar} fill="#2e2a43" />
        </Plane>
        <Plane>
          <path d={N.desk} fill="#5b3d28" />
          <path d={N.deskEdge} fill="#7a5235" />
        </Plane>
      </>
    ),
    front: (
      <Plane front>
        <path d={N.mugHandle} fill="#d97a3a" fillRule="evenodd" />
        <path d={N.mug} fill="#d97a3a" />
        <path d={N.pencil} fill="#f0b43c" />
        <path d={N.tip} fill="#3a2a1c" />
      </Plane>
    ),
  },
  cafe: {
    back: (
      <>
        <Plane shade={false}>
          <rect x="-80" y="-80" width="1160" height="960" fill="#fbe1c0" />
          <path d={C.shore} fill="#d7ad84" />
          <path d={C.water} fill="#a8c6c2" />
          {C.glints.map((d, i) => <path key={i} d={d} fill="#eef3e8" />)}
        </Plane>
        <Plane>
          <path d={wall(C.hole)} fill="#5f7f6a" fillRule="evenodd" />
          <path d={C.bar} fill="#4f6c59" />
        </Plane>
        <Plane>
          {C.awning.map((a, i) => <path key={i} d={a.d} fill={a.c} />)}
        </Plane>
        <Plane>
          <path d={C.table} fill="#f6e9d6" />
          <path d={C.tableEdge} fill="#d7bf9d" />
        </Plane>
      </>
    ),
    front: null,
  },
  dusk: {
    back: (
      <>
        <Plane shade={false}>
          <rect x="-80" y="-80" width="1160" height="960" fill="#f7cfa0" />
          <path d={D.sun} fill="#ffe1a6" />
        </Plane>
        <Plane><path d={D.far} fill="#eeb07c" /></Plane>
        <Plane><path d={D.mid} fill="#de9463" /></Plane>
        <Plane>
          <path d={D.town} fill="#a85f3c" />
          {LIGHTS.map(([x, y], i) => <rect key={i} x={x} y={y} width="8" height="10" fill="#ffd27a" />)}
        </Plane>
        <Plane><path d={D.near} fill="#7d4329" /></Plane>
      </>
    ),
    front: null,
  },
  evening: {
    back: (
      <>
        <Plane shade={false} low>
          <rect x="-80" y="-80" width="1160" height="960" fill="#ecd2b0" />
          <path d={E.glow} fill="#f6e2c2" />
        </Plane>
        <Plane low>
          <path d={E.desk} fill="#b9825a" />
          <path d={E.deskEdge} fill="#d29a6d" />
        </Plane>
      </>
    ),
    // A plant on the desk, left of the Mac, in front.
    front: (
      <Plane front low>
        {E.leaves.map((d, i) => <path key={i} d={d} fill={i === 1 ? "#6f9d58" : "#5d8a4c"} />)}
        <path d={E.pot} fill="#fbf2e4" />
      </Plane>
    ),
  },
};
