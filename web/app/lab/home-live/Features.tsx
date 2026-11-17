import { AIGlyph } from "@/lib/ai-glyphs";
import { HeroG } from "../home-z/HeroG";
import { Seen } from "./Seen";
import f from "./features.module.css";

// Round 29 (Emil, after Granola's second section): a heading, three killer features as one line each
// with the key words in bold, and beside them the product doing its thing: a Pinto note with ChatGPT
// writing into it (home-z HeroG, the real UI).

const ROWS: { icon: React.ReactNode; say: React.ReactNode }[] = [
  {
    icon: <span className={f.glyphs}><AIGlyph name="openai" size={22} /><AIGlyph name="claude" size={22} color="#d97757" /></span>,
    say: <>Works with <b>ChatGPT, Claude, Claude Code and Codex.</b> They all work in the same notes.</>,
  },
  {
    icon: <img src="/home-v5/icons/undo.webp" alt="" width={56} height={56} loading="lazy" />,
    say: <><b>Every change says who made it,</b> you or which AI.</>,
  },
  {
    icon: <img src="/home-v5/icons/notepad.webp" alt="" width={56} height={56} loading="lazy" />,
    say: <><b>Feels like Apple Notes,</b> on Mac and iPhone, and brings yours over.</>,
  },
];

export function Features() {
  return (
    <section className={f.features} aria-labelledby="features-h">
      <div className={f.words}>
        <h2 id="features-h" className={f.title}>Every AI you use,<br />one notebook.</h2>
        <ul className={f.list}>
          {ROWS.map((r, i) => (
            <li key={i}><span className={f.icon}>{r.icon}</span><p>{r.say}</p></li>
          ))}
        </ul>
      </div>
      <Seen className={f.pic}><HeroG /></Seen>
    </section>
  );
}
