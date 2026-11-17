import { AIGlyph } from "@/lib/ai-glyphs";
import s from "./share.module.css";

// Round 30 (2026-11-17): the Together row's picture without UI, in the site's cut-paper style. Four
// directions, `?share=1..4`. The art never paints a logo: where an AI is in the picture, it is a blank
// paper disc in the art with the real mark laid over it here (lib/ai-glyphs, Simple Icons). Sources and
// prompts: ~/content-tools/projects/pinto-site-art/r30-share.
//   1  Two cities, one note: the Stockholm and Lisbon scenes (home-v5/frontier), one note across both.
//   2  One sheet, two hands: two people writing on the same page from opposite sides of a table.
//   3  Across the street: one page strung between two windows, both people writing on it.
//   4  One page: two small people on one huge sheet, their two lines of writing meeting in the middle.
// (Tried and dropped: the old Together portraits around a note; the blushing faces read as a children's book.)

export type ShareV = "1" | "2" | "3" | "4";

const A = "/lab/live/share";

type Mark = "claude" | "openai";
const COLOR: Record<Mark, string> = { claude: "#d97757", openai: "#1d1b19" };

/** An AI's real mark on a small paper disc. `x`, `y`: its centre, in % of the picture; `d`: its width, in % of
 *  the picture's width. `onArt`: the art has a blank disc there, so the mark is printed on it, and only gets a
 *  disc of its own where the picture is too small for the painted one. */
function Charm({ mark, x, y, d, tilt = 0, onArt }: { mark: Mark; x: number; y: number; d: number; tilt?: number; onArt?: boolean }) {
  return (
    <span className={`${s.charm} ${onArt ? s.onArt : ""}`} style={{ left: `${x}%`, top: `${y}%`, "--d": d, rotate: `${tilt}deg` } as React.CSSProperties}>
      <AIGlyph name={mark} color={COLOR[mark]} />
    </span>
  );
}

function TwoCities() {
  return (
    <div className={`${s.art} ${s.cities}`} role="img" aria-label="Two people in two cities, one in a café in Stockholm and one at a desk in Lisbon, with one shared note laid across both scenes. One has ChatGPT, the other Claude.">
      <img className={s.cityA} src={`${A}/city-stockholm.webp`} alt="" width={1200} height={676} loading="lazy" decoding="async" />
      <img className={s.cityB} src={`${A}/city-lisbon.webp`} alt="" width={1200} height={676} loading="lazy" decoding="async" />
      <img className={s.citiesNote} src={`${A}/note.webp`} alt="" width={760} height={1009} loading="lazy" decoding="async" />
      <Charm mark="openai" x={5.5} y={55} d={6.2} tilt={-6} />
      <Charm mark="claude" x={94.5} y={90} d={6.2} tilt={5} />
    </div>
  );
}

function Hands() {
  return (
    <div className={`${s.art} ${s.hands}`} role="img" aria-label="Seen from above: two people writing on the same sheet of paper from opposite sides of a table, one in green ink and one in amber. ChatGPT sits beside one, Claude beside the other.">
      <img className={s.fill} src={`${A}/hands.webp`} alt="" width={1536} height={1024} loading="lazy" decoding="async" />
      <Charm mark="openai" x={26.1} y={86.8} d={7.2} onArt />
      <Charm mark="claude" x={75.45} y={29.7} d={7.4} onArt />
    </div>
  );
}

function Street() {
  return (
    <div className={`${s.art} ${s.street}`} role="img" aria-label="At dusk, two neighbours lean out of facing windows across a narrow street and write on one page strung between them. ChatGPT is on her windowsill, Claude on his.">
      <img className={s.fill} src={`${A}/street.webp`} alt="" width={1536} height={1024} loading="lazy" decoding="async" />
      <Charm mark="openai" x={13.3} y={59.4} d={4.5} onArt />
      <Charm mark="claude" x={87.3} y={59.7} d={4.3} onArt />
    </div>
  );
}

function OnePage() {
  return (
    <div className={`${s.art} ${s.page}`} role="img" aria-label="Two small people stand on one huge sheet of paper, each writing with a pencil as tall as they are. Her green line and his amber line meet in the middle. ChatGPT stands beside her, Claude beside him.">
      <img className={s.fill} src={`${A}/page.webp`} alt="" width={1536} height={804} loading="lazy" decoding="async" />
      <Charm mark="openai" x={7.3} y={44.3} d={5.4} onArt />
      <Charm mark="claude" x={93.2} y={68.4} d={5.5} onArt />
    </div>
  );
}

export function ShareArt({ v }: { v: ShareV }) {
  return (
    <div className={s.wrap} data-share-v={v}>
      {v === "1" ? <TwoCities /> : v === "2" ? <Hands /> : v === "3" ? <Street /> : <OnePage />}
    </div>
  );
}
