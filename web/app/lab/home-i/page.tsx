import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { G } from "../../_home/copy";
import { Download } from "../../_home/Download";
import { Hero } from "../../_home/Hero";
import { Cards } from "./Cards";
import s from "./home-i.module.css";

export const metadata: Metadata = { title: G.title, description: G.description };

// Home page study I, "D, finished": D's page (today's hero, then three tall cards that open into
// sheets, the AI band, four basics, the download), with the hero tightened so the cards are on the
// first screen, and each card its own cut-paper world with the real app in front.

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

const BASICS = [
  { icon: "/home-v5/icons/envelope.webp", title: "Private.", say: "Encrypted on your device before it syncs." },
  { icon: "/home-v5/icons/undo.webp", title: "Every change says who.", say: "You or which AI. Undo takes it back." },
  { icon: "/home-v5/icons/devices.webp", title: "Mac and iPhone.", say: "Free on both, always in sync." },
  { icon: "/home-v5/icons/box.webp", title: "Open source.", say: "Anyone can check the code." },
];

export default function Page() {
  return (
    <div className={s.main}>
      <div className={s.heroWrap}><Hero /></div>

      <Cards />

      <section className={s.ai} aria-labelledby="ais">
        <div className={s.aiWords}>
          <h2 id="ais" className={s.title}>Every AI you use, one notebook.</h2>
          <p className={s.lede}>They read and edit your notes, whiteboards and apps, with your OK.</p>
          <ul className={s.logos}>
            {AIS.map((a) => <li key={a.name}><span><AIGlyph name={a.glyph} size={26} /></span>{a.name}</li>)}
          </ul>
        </div>
        <figure className={s.study}>
          <figcaption>In a new chat, Claude answered questions about months of past chats.</figcaption>
          <div className={s.bar} style={{ "--v": 0.18 } as React.CSSProperties}><span>Without notes</span><i /><b>18%</b></div>
          <div className={s.bar} data-pinto="" style={{ "--v": 0.825 } as React.CSSProperties}><span>With Pinto</span><i /><b>82.5%</b></div>
          <a className={s.inline} href="/blog/ai-memory-with-notes">Read the study</a>
        </figure>
      </section>

      <section className={s.basicsSec} aria-labelledby="basics">
        <h2 id="basics" className={s.title}>And the basics.</h2>
        <ul className={s.basics}>
          {BASICS.map((b) => (
            <li key={b.title}>
              <img src={b.icon} alt="" width={56} height={56} loading="lazy" />
              <p><b>{b.title}</b> {b.say}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.closing} aria-labelledby="closing">
        <img src="/mark-256.png" alt="" width={96} height={96} className={s.closingIcon} />
        <h2 id="closing" className={s.closingTitle}>Start your notebook.</h2>
        <Download className={s.closingCta} quiet={G.closing.fine} />
      </section>
    </div>
  );
}
