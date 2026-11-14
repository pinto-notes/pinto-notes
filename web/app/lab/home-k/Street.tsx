"use client";

import { APP_STORE_URL, SITE_URL } from "@/lib/site";
import { mailLink, sendLink } from "@/lib/platform";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { publishingFlow } from "./rough";
import k from "./k.module.css";

// Study K, three windows: one cut-paper street at dusk. Three lit windows, one for each of the three:
// Maya with her note, Jonas with his whiteboard, Sara in the café with her app. Point at a window and
// it brightens while the street dims; click and the camera moves in on it, with two facts beside it.
//
// The street is drawn in world units (1400 x 716) and scaled to fit, so every shape and every piece
// of UI is vector or HTML and stays sharp at any zoom. The only picture is the paper town behind the
// roofs, drawn at most at half its pixel width and faded out while zoomed.

const W = 1400;
const H = 716;
/// On a phone the top of the sky is cropped so the label stays on the first screen.
const PHONE_TOP = 44;

type Rect = { x: number; y: number; w: number; h: number };
type Unit = { key: string; title: string; line: string; facts: [string, string]; x: number; w: number; room: Rect; label: string };

const UNITS: Unit[] = [
  {
    key: "notes", title: "Notes.", line: "Feels like Apple Notes, on Mac and iPhone.",
    facts: ["Your Apple Notes come along when you start.", "ChatGPT and Claude can add to a note, with your OK."],
    x: 15, w: 410, room: { x: 32, y: 236, w: 346, h: 312 }, label: "Maya's window: her Tomorrow note on her phone.",
  },
  {
    key: "whiteboards", title: "Whiteboards.", line: "Draw how something works. Your AI can draw too.",
    facts: ["Your AI reads a whiteboard and draws into it.", "Saved in the standard Excalidraw format."],
    x: 432, w: 534, room: { x: 32, y: 128, w: 470, h: 288 }, label: "Jonas's window: a whiteboard on his Mac.",
  },
  {
    key: "apps", title: "Apps.", line: "A note that works like a small app.",
    facts: ["Pick a template and it's ready, or describe one and your AI builds it.", "Any AI can update it. Tell Claude you went to the gym and it's ticked."],
    x: 973, w: 412, room: { x: 30, y: 262, w: 352, h: 290 }, label: "Sara's window at the café: a habit tracker on her phone.",
  },
];

const FLOW = publishingFlow();

/// ?t= (or Reduce Motion) freezes everything at rest. ?zoom=0..2 opens a window, ?hover=0..2 points at one.
function useParams() {
  const [p, setP] = useState<{ still: boolean; zoom: number | null; hover: number | null }>({ still: false, zoom: null, hover: null });
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const n = (v: string | null) => (v !== null && /^[0-2]$/.test(v) ? Number(v) : null);
    setP({ still: q.get("t") !== null || matchMedia("(prefers-reduced-motion: reduce)").matches, zoom: n(q.get("zoom")), hover: n(q.get("hover")) });
  }, []);
  return p;
}

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Street() {
  const p = useParams();
  const scene = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.97);
  const [size, setSize] = useState({ w: 1440, inner: 1384, h: 694, phone: false });
  const [hot, setHot] = useState<number | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [left, setLeft] = useState(0);

  useEffect(() => { if (p.zoom !== null) setZoom(p.zoom); if (p.hover !== null) setHot(p.hover); }, [p.zoom, p.hover]);

  // Fit the street to the window: its full width on a desktop (and all of it inside the first screen),
  // a fixed scale on a phone, where it pans window to window.
  useIso(() => {
    const el = scene.current; if (!el) return;
    const measure = () => {
      const full = el.clientWidth;
      const pad = full < 720 ? 0 : Math.max(28, (full - 1408) / 2);
      const w = full - 2 * pad;
      const phone = w < 720;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const room = Math.max(520, window.innerHeight - top - 14);
      const f = phone ? Math.min(0.84, (w - 60) / 420) : Math.min(1, w / W, room / H);
      setFit(f);
      setSize({ w: full, inner: w, h: (H - (phone ? PHONE_TOP : 0)) * f, phone });
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const close = useCallback(() => setZoom(null), []);
  useEffect(() => {
    if (zoom === null) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [zoom, close]);

  const open = (i: number) => {
    setLeft(scroller.current?.scrollLeft ?? 0);
    setZoom(i);
  };

  // The camera. At rest the world is scaled to fit; zoomed in, the window fills most of the scene's
  // height, beside the facts on a desktop and above them on a phone.
  let transform = `translate(${size.phone ? 0 : (size.w - W * fit) / 2}px, ${size.phone ? -PHONE_TOP * fit : 0}px) scale(${fit})`;
  if (zoom !== null) {
    const u = UNITS[zoom], r = u.room;
    const cx = u.x + r.x + r.w / 2, cy = r.y + r.h / 2;
    const s = size.phone
      ? Math.min((size.w - 24) / r.w, (size.h * 0.5) / r.h)
      : Math.min((size.h * 0.86) / r.h, (size.inner * 0.54) / r.w, 2.2);
    const tx = left + (size.phone ? size.w / 2 : (size.w - size.inner) / 2 + size.inner * 0.34) - s * cx;
    const ty = (size.phone ? size.h * 0.28 : size.h / 2) - s * cy;
    transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  }
  const z = zoom !== null ? UNITS[zoom] : null;

  return (
    <section className={k.hero} data-still={p.still ? "" : undefined}>
      <div className={k.head}>
        <h1 className={k.h1}>The notebook you and your AI share.</h1>
        <div className={x.ctas}>
          <Download note={false} />
          <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
            Get it for iPhone
          </a>
          <a className={x.offMac} href="/download">Download for Mac</a>
          <p className={`${x.fine} ${x.offApple}`} data-off-apple>
            Pinto Notes is for iPhone and Mac.{" "}
            <a href={mailLink(SITE_URL)} onClick={(ev) => sendLink(navigator, ev, SITE_URL)}>Send myself the link</a>
          </p>
        </div>
      </div>

      <div ref={scene} className={k.scene} data-zoom={zoom ?? undefined} data-phone={size.phone ? "" : undefined} style={{ height: size.h }}>
        <div ref={scroller} className={k.scroller}>
          <div className={k.sizer} style={{ width: size.phone ? W * fit : "100%", height: size.h }}>
            {size.phone && UNITS.map((u) => <i key={u.key} className={k.snap} style={{ left: (u.x + u.w / 2) * fit }} />)}
            <div className={k.world} style={{ transform }} data-hot={hot ?? zoom ?? undefined}
              onMouseLeave={() => setHot(p.hover)}>
              <Far />
              {UNITS.map((u, i) => (
                <div key={u.key} className={k.unit} data-unit={u.key} data-on={(hot ?? zoom) === i ? "" : undefined}
                  style={{ left: u.x, width: u.w, "--i": i } as React.CSSProperties}
                  onMouseEnter={() => { if (matchMedia("(hover: hover) and (pointer: fine)").matches) setHot(i); }}>
                  <svg className={k.back} viewBox={`0 0 ${u.w} ${H}`} aria-hidden="true">{i === 0 ? <HouseBack /> : i === 1 ? <StudioBack /> : <CafeBack />}</svg>
                  <div className={k.room} style={{ left: u.room.x, top: u.room.y, width: u.room.w, height: u.room.h }} aria-hidden="true">
                    {i === 0 && <><Lamp x={58} /><div className={k.uiNote}><Note /></div><Person who="maya" /></>}
                    {i === 1 && <><div className={k.uiBoard}><Whiteboard /></div><Person who="jonas" /></>}
                    {i === 2 && <><Lamp x={64} /><div className={k.uiApp}><Habits /></div><Person who="sara" /></>}
                    <i className={k.sheen} />
                  </div>
                  <svg className={k.front} viewBox={`0 0 ${u.w} ${H}`} aria-hidden="true">{i === 0 ? <HouseFront /> : i === 1 ? <StudioFront /> : <CafeFront />}</svg>
                  <div className={k.label} style={{ left: u.room.x }}>
                    <h2 className={k.lTitle}>{u.title}</h2>
                    <p className={k.lLine}>{u.line}</p>
                  </div>
                  <button type="button" className={k.hit} aria-label={`${u.title} ${u.line} ${u.label}`} aria-expanded={zoom === i}
                    tabIndex={zoom !== null ? -1 : 0} onClick={() => open(i)} onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setHot(i); }} onBlur={() => setHot(null)} />
                </div>
              ))}
              <svg className={k.street} viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><StreetFront /></svg>
            </div>
          </div>
        </div>

        {z && <button type="button" className={k.away} aria-label="Back to the street" onClick={close} />}
        <aside className={k.facts} aria-live="polite" hidden={!z}>
          {z && <>
            <h2 className={k.fTitle}>{z.title}</h2>
            <p className={k.fLine}>{z.line}</p>
            <ul className={k.fList}>{z.facts.map((f) => <li key={f}>{f}</li>)}</ul>
            <button type="button" className={k.backBtn} onClick={close} autoFocus>
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" /></svg>Back to the street
            </button>
          </>}
        </aside>
      </div>
    </section>
  );
}

/* ── The far town: dusk sky, cut-paper hills, and the paper town's own hills and roofs behind ── */
function Far() {
  return (
    <div className={k.far} aria-hidden="true">
      <svg className={k.hills} viewBox="-400 0 2200 610" preserveAspectRatio="none">
        <path d="M-400 120 C-200 90 -60 100 0 110 C120 76 230 78 330 96 C430 114 520 68 640 70 C760 72 860 100 980 86 C1100 72 1220 50 1400 82 C1560 60 1700 80 1800 100 L1800 610 L-400 610Z" fill="#cfa2ae" />
        <path d="M-400 160 C-200 130 -80 140 0 152 C140 122 260 136 380 146 C520 158 600 122 760 126 C900 130 1020 154 1160 138 C1260 128 1340 122 1400 130 C1560 120 1700 140 1800 150 L1800 610 L-400 610Z" fill="#a98aa6" />
        <path d="M-400 230 C-250 196 -120 210 -20 226 C80 240 180 214 300 228 L300 610 L-400 610Z M1100 230 C1240 206 1360 214 1480 224 C1600 234 1700 206 1800 214 L1800 610 L1100 610Z" fill="#7d6f86" />
      </svg>
      <img className={k.town} src="/art/footer/home.webp" alt="" width={2172} height={724} decoding="async" fetchPriority="high" />
      <i className={k.fade} />
    </div>
  );
}

/* ── The houses, drawn in each unit's own units (its width x 716). Back: behind the lit room. ── */
function HouseBack() {
  return (
    <g className={k.paper}>
      <rect x="292" y="96" width="40" height="80" fill="#a5603f" /><rect x="286" y="88" width="52" height="12" fill="#7d4630" />
      <path d="M-10 206 L205 82 L420 206Z" fill="#544a66" />
      <path d="M8 206 L205 100 L402 206Z" fill="#62577a" />
      <circle cx="205" cy="166" r="17" fill="#f6c27a" /><circle cx="205" cy="166" r="17" fill="none" stroke="#e9d6bd" strokeWidth="5" />
      <rect x="6" y="200" width="398" height="410" fill="#d0a681" />
      <rect x="370" y="200" width="34" height="410" fill="#bf9370" />
      <rect x="6" y="200" width="398" height="12" fill="#b78a68" />
      <ellipse className={k.glow} cx="205" cy="392" rx="250" ry="210" fill="url(#k-glow)" />
      <rect x="18" y="222" width="374" height="340" rx="4" fill="#efdcc1" />
      <rect x="26" y="230" width="358" height="324" rx="2" fill="#3a2b2c" />
      <defs><radialGradient id="k-glow"><stop offset="0" stopColor="#ffcf86" stopOpacity="0.7" /><stop offset="1" stopColor="#ffcf86" stopOpacity="0" /></radialGradient></defs>
    </g>
  );
}
function HouseFront() {
  return (
    <g className={k.paper}>
      <rect x="10" y="548" width="390" height="16" rx="3" fill="#f1e1c8" />
      <path d="M30 564 h350 v26 h-350Z" fill="#8f5f45" />
      <path transform="translate(0 22)" d="M36 566 c8 -24 30 -26 40 -10 c10 -22 34 -20 40 0 c10 -18 32 -16 38 2 c8 -20 34 -22 42 -2 c10 -18 34 -16 40 2 c8 -18 32 -18 40 0 c10 -20 34 -18 40 2 c6 -14 26 -14 34 6Z" fill="#5c7350" />
      <rect x="6" y="590" width="398" height="20" fill="#a17a5d" />
    </g>
  );
}

function StudioBack() {
  const dentils = Array.from({ length: 22 }, (_, i) => <rect key={i} x={10 + i * 24} y="62" width="12" height="10" fill="#6e5468" />);
  return (
    <g className={k.paper}>
      <rect x="0" y="44" width="534" height="566" fill="#94738c" />
      <rect x="500" y="44" width="34" height="566" fill="#866780" />
      <rect x="-8" y="30" width="550" height="32" fill="#6e5468" /><rect x="-8" y="30" width="550" height="6" fill="#a8889f" />
      {dentils}
      <ellipse className={k.glow} cx="267" cy="272" rx="330" ry="210" fill="url(#k-glow2)" />
      <rect x="20" y="116" width="494" height="312" rx="4" fill="#ecd9c4" />
      <rect x="26" y="122" width="482" height="300" rx="2" fill="#2e2330" />
      <rect x="218" y="492" width="98" height="118" rx="49" fill="#e9d6c2" />
      <path d="M226 610 V541 a41 41 0 0 1 82 0 V610Z" fill="#4a3442" />
      <path d="M232 541 a35 35 0 0 1 70 0Z" fill="#f2b56b" opacity="0.85" />
      <rect x="62" y="508" width="104" height="74" rx="3" fill="#e9d6c2" /><rect x="68" y="514" width="92" height="62" fill="#5a4252" />
      <rect x="368" y="508" width="104" height="74" rx="3" fill="#e9d6c2" /><rect x="374" y="514" width="92" height="62" fill="#5a4252" />
      <defs><radialGradient id="k-glow2"><stop offset="0" stopColor="#ffc979" stopOpacity="0.6" /><stop offset="1" stopColor="#ffc979" stopOpacity="0" /></radialGradient></defs>
    </g>
  );
}
function StudioFront() {
  const bars = Array.from({ length: 31 }, (_, i) => <rect key={i} x={26 + i * 16} y="444" width="3" height="44" fill="#2e2330" />);
  return (
    <g className={k.paper}>
      <rect x="10" y="426" width="514" height="16" rx="2" fill="#5e4659" />
      <g>{bars}<rect x="22" y="440" width="494" height="5" rx="2" fill="#2e2330" /><rect x="22" y="472" width="494" height="3" fill="#2e2330" /><rect x="16" y="486" width="502" height="6" rx="2" fill="#2e2330" /></g>
      <rect x="0" y="598" width="534" height="12" fill="#7a5e74" />
    </g>
  );
}

function CafeBack() {
  return (
    <g className={k.paper}>
      <rect x="6" y="150" width="400" height="460" fill="#6f8270" />
      <rect x="372" y="150" width="34" height="460" fill="#647665" />
      <rect x="-4" y="136" width="420" height="24" fill="#586a5b" /><rect x="-4" y="136" width="420" height="5" fill="#8a9c86" />
      <rect x="110" y="172" width="192" height="40" rx="5" fill="#2f3a32" />
      <text x="206" y="193" className={k.sign}>Café</text>
      <ellipse className={k.glow} cx="206" cy="410" rx="240" ry="200" fill="url(#k-glow3)" />
      <rect x="16" y="248" width="380" height="318" rx="4" fill="#efe0c6" />
      <rect x="24" y="256" width="364" height="302" rx="2" fill="#2f2a26" />
      <defs><radialGradient id="k-glow3"><stop offset="0" stopColor="#ffd38a" stopOpacity="0.65" /><stop offset="1" stopColor="#ffd38a" stopOpacity="0" /></radialGradient></defs>
    </g>
  );
}
function CafeFront() {
  const n = 8, w = 424 / n;
  const stripes = Array.from({ length: n }, (_, i) => (
    <path key={i} d={`M${-6 + i * w} 222 h${w} v36 a${w / 2} ${w / 4} 0 0 1 ${-w} 0Z`} fill={i % 2 ? "#f6e7d0" : "#df7a38"} />
  ));
  return (
    <g className={k.paper}>
      <rect x="-8" y="214" width="428" height="10" rx="3" fill="#b85d27" />
      <g>{stripes}</g>
      <rect x="12" y="556" width="388" height="14" rx="3" fill="#efe0c6" />
      <rect x="6" y="570" width="400" height="40" fill="#586a5b" />
    </g>
  );
}

/* ── The street in front: pavement, a cut edge, and two lamps between the houses ── */
function StreetFront() {
  const lamp = (cx: number) => (
    <g key={cx}>
      <ellipse className={k.lampGlow} cx={cx} cy="330" rx="46" ry="46" fill="url(#k-lamp)" />
      <rect x={cx - 2.5} y="338" width="5" height="272" rx="2" fill="#2e2330" />
      <rect x={cx - 7} y="598" width="14" height="10" rx="2" fill="#2e2330" />
      <path d={`M${cx - 11} 340 h22 l-4 -24 h-14Z`} fill="#ffd58e" />
      <path d={`M${cx - 13} 318 h26 l-13 -10Z`} fill="#2e2330" />
    </g>
  );
  return (
    <g>
      <defs><radialGradient id="k-lamp"><stop offset="0" stopColor="#ffd58e" stopOpacity="0.75" /><stop offset="1" stopColor="#ffd58e" stopOpacity="0" /></radialGradient></defs>
      <g className={k.paper}>
        <path d="M-400 604 H1800 V626 C1500 634 1200 624 960 628 C620 634 300 622 0 630 C-200 634 -300 626 -400 630Z" fill="#5a4856" />
        <path d="M-400 604 H1800 V609 H-400Z" fill="#8a7384" />
      </g>
      <g className={k.paper}>
        <path d="M-400 604 V420 C-360 380 -300 384 -280 410 C-250 360 -170 364 -150 410 C-120 380 -60 392 -50 430 C-20 420 10 440 12 470 V604Z" fill="#3f4a3a" />
        <path d="M-400 604 V480 C-340 450 -280 470 -260 494 C-220 460 -150 470 -130 500 C-90 480 -30 500 -20 530 C0 526 14 540 14 560 V604Z" fill="#4d5c45" />
        <path d="M1800 604 V430 C1760 390 1700 394 1680 420 C1650 370 1570 374 1550 420 C1520 392 1460 402 1446 436 C1416 426 1390 444 1388 470 V604Z" fill="#3f4a3a" />
        <path d="M1800 604 V490 C1740 460 1680 480 1660 504 C1620 470 1550 480 1530 510 C1490 490 1430 506 1420 534 C1400 530 1386 546 1386 566 V604Z" fill="#4d5c45" />
      </g>
      {[428.5, 969.5].map(lamp)}
    </g>
  );
}

/// A pendant lamp hanging in the room.
function Lamp({ x: cx }: { x: number }) {
  return (
    <svg className={k.lamp} viewBox="0 0 120 90" style={{ left: cx - 60 }} aria-hidden="true">
      <ellipse cx="60" cy="58" rx="58" ry="30" fill="#fff3d6" opacity="0.6" />
      <rect x="59" y="0" width="2" height="34" fill="#3a2b2c" />
      <path d="M36 52 a24 20 0 0 1 48 0Z" fill="#8a5a3c" />
      <ellipse cx="60" cy="53" rx="13" ry="3.5" fill="#fff6e0" />
    </svg>
  );
}

/// Over the shoulder: each person seen from behind, low in the window, looking at the screen.
function Person({ who }: { who: "maya" | "jonas" | "sara" }) {
  if (who === "maya") return (
    <svg className={k.person} data-who="maya" viewBox="0 0 200 170" aria-hidden="true">
      <circle cx="78" cy="22" r="17" fill="#3e2a28" />
      <path d="M8 170 C10 120 40 104 62 98 L64 82 C46 76 38 58 40 46 C42 24 58 12 80 12 C104 12 120 30 118 52 C116 70 106 80 94 84 L96 98 C124 104 150 120 156 170Z" fill="#4e3634" />
      <path d="M40 170 C44 136 60 122 80 118 C104 122 120 136 124 170Z" fill="#7b8a5a" />
    </svg>
  );
  if (who === "jonas") return (
    <svg className={k.person} data-who="jonas" viewBox="0 0 200 170" aria-hidden="true">
      <path d="M20 170 C24 124 56 108 80 102 L82 86 C64 80 56 62 58 48 C58 24 76 10 100 10 C124 10 140 26 140 48 C140 66 130 80 118 86 L120 102 C146 108 176 124 180 170Z" fill="#463436" />
      <ellipse cx="57" cy="58" rx="6" ry="10" fill="#463436" /><ellipse cx="141" cy="58" rx="6" ry="10" fill="#463436" />
      <path d="M58 46 C56 22 76 6 100 6 C126 6 144 22 142 46 C130 34 116 28 100 30 C82 30 68 36 58 46Z" fill="#33262a" />
      <path d="M44 170 C50 132 72 118 100 116 C128 118 150 132 156 170Z" fill="#3d5a46" />
    </svg>
  );
  return (
    <svg className={k.person} data-who="sara" viewBox="0 0 200 170" aria-hidden="true">
      <path d="M10 170 C14 124 40 108 60 102 L62 86 C46 78 40 60 42 46 C44 22 60 8 84 8 C108 8 124 26 122 48 C120 66 112 78 100 84 L102 102 C128 108 154 124 158 170Z" fill="#4e3634" />
      <path d="M38 132 C30 96 34 60 42 40 C50 16 70 4 88 6 C112 8 128 28 126 52 C124 78 128 104 134 128 C120 120 108 116 96 114 L74 114 C60 118 48 124 38 132Z" fill="#3a2826" />
      <path d="M40 170 C46 136 64 124 84 120 C106 122 124 136 128 170Z" fill="#8aa08a" />
    </svg>
  );
}

/* ── The UI in each window, drawn as the apps draw it ── */

/// Maya's Tomorrow note on her iPhone.
function Note() {
  const rows: [string, boolean, boolean][] = [
    ["Pick up the dry cleaning", true, false],
    ["Run before work, 5 km", false, true],
    ["Call the dentist", false, true],
    ["Book Lisbon flights", false, true],
  ];
  return (
    <div className={k.phone}>
      <div className={k.note}>
        <p className={k.nBack}>‹ My notebook</p>
        <p className={k.nTitle}>Tomorrow</p>
        <ul className={k.nList}>
          {rows.map(([t, done, ai], i) => (
            <li key={t} style={{ "--r": i } as React.CSSProperties} data-ai={ai ? "" : undefined}>
              <i data-on={done ? "" : undefined} /><span>{t}</span>{ai && <em className={k.chip}><AIGlyph name="openai" size={10} /></em>}
            </li>
          ))}
        </ul>
        <p className={k.nPara}>Saturday: long run, 12 km.</p>
      </div>
    </div>
  );
}

/// Jonas's whiteboard in the Mac app, drawing itself stroke by stroke on arrival.
function Whiteboard() {
  let n = 0;
  return (
    <div className={k.board}>
      <div className={k.bBar}><span className={k.lights}><i /><i /><i /></span><span className={k.bBack}>‹</span><b>Publishing flow</b></div>
      <svg className={k.bInk} viewBox="0 0 572 268" role="presentation">
        {FLOW.map((s, j) => {
          const at = n; n += s.strokes.length;
          return (
            <g key={j}>
              {s.fill && <path className={k.fill} d={s.fill.d} fill={s.fill.color} style={{ "--s": at + 1 } as React.CSSProperties} />}
              {s.strokes.map((d, m) => <path key={m} className={k.stroke} d={d} pathLength={1} style={{ "--s": at + m * 0.7 } as React.CSSProperties} />)}
              {s.label && <text className={k.ink} x={s.label.x} y={s.label.y} style={{ "--s": at + 0.8 } as React.CSSProperties}>{s.label.text}</text>}
            </g>
          );
        })}
        <g className={k.cursor} style={{ "--s": n } as React.CSSProperties} transform="translate(436 244)">
          <path d="M0 0 L0 17 L4.6 12.6 L8 20 L11 18.6 L7.7 11.4 L13.6 11.2 Z" fill="#d97757" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
          <rect x="14" y="12" width="88" height="22" rx="6" fill="#d97757" />
          <text x="58" y="23.5" className={k.cursorName}>Claude Code</text>
        </g>
      </svg>
    </div>
  );
}

/// Sara's habit tracker, the template app's Today screen on iPhone.
function Habits() {
  const week = ["M", "T", "W", "T", "F", "S", "S"];
  const rows: [string, string, boolean, boolean][] = [
    ["Gym", "Logged by Claude", true, true],
    ["Morning walk", "5 days in a row", true, false],
    ["Read 20 pages", "4 of 7 this week", true, false],
    ["No phone after 22", "3 of 7 this week", false, false],
  ];
  return (
    <div className={k.phone}>
      <div className={k.app}>
        <p className={k.aTop}><b>Habit tracker</b><span>App</span></p>
        <p className={k.aTitle}>Today</p>
        <div className={k.aWeek}>{week.map((w, i) => <span key={i} data-on={i < 4 ? "" : undefined} data-now={i === 3 ? "" : undefined}><small>{w}</small><i /></span>)}</div>
        <ul className={k.aList}>
          {rows.map(([t, sub, done, ai]) => (
            <li key={t} data-ai={ai ? "" : undefined}>
              <span><b>{t}</b><small>{ai ? <><AIGlyph name="claude" size={10} color="#d97757" /> {sub}</> : sub}</small></span>
              <i data-on={done ? "" : undefined}><svg viewBox="0 0 16 16"><path d="M4 8.4l2.6 2.6L12 5.4" /></svg></i>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
