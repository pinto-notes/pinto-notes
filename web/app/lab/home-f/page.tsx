import type { Metadata } from "next";
import localFont from "next/font/local";
import { AIGlyph } from "@/lib/ai-glyphs";
import { G } from "../../_home/copy";
import { Download } from "../../_home/Download";
import { Say } from "./Say";
import s from "./f.module.css";

export const metadata: Metadata = { title: G.title, description: G.description };

// Excalifont, the whiteboard's hand-drawn font (Excalidraw, SIL Open Font License 1.1), its Latin
// subset as the app ships it.
const hand = localFont({ src: "./Excalifont-Regular.woff2", variable: "--hand", display: "block" });

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

const BASICS = [
  { icon: "/home-v5/icons/notepad.webp", title: "Feels like Apple Notes", say: "Brings your Apple Notes over in one go." },
  { icon: "/home-v5/icons/devices.webp", title: "Mac and iPhone", say: "Always in sync, and works offline." },
  { icon: "/home-v5/icons/lock.webp", title: "Private", say: "Encrypted on your device before it syncs." },
  { icon: "/home-v5/icons/box.webp", title: "Free and open source", say: "Anyone can check the code." },
];

/// Study F: "Say it to any AI". The first screen is a sentence and what it makes in Pinto: a note, a
/// whiteboard or an app. Under it, the one band about the AIs (with the memory study), the basics,
/// and the download. Nothing else.
export default function Page() {
  return (
    <div className={`${s.main} ${hand.variable}`}>
      <Say />

      <section className={s.any} aria-labelledby="any">
        <div className={s.anyHead}>
          <h2 id="any" className={s.title}>One notebook for every AI you use.</h2>
          <p className={s.lede}>Connect them once. Each change says which AI made it, and you can undo it.</p>
        </div>
        <ul className={s.logos}>
          {AIS.map((a) => <li key={a.name}><AIGlyph name={a.glyph} size={40} />{a.name}</li>)}
        </ul>
        <figure className={s.study}>
          <figcaption>Right answers about you, in a new chat</figcaption>
          <div className={s.bars}>
            <p><span>Without notes</span><i style={{ "--v": 0.18 } as React.CSSProperties} /><b>18%</b></p>
            <p data-pinto=""><span>With Pinto</span><i style={{ "--v": 0.825 } as React.CSSProperties} /><b>82.5%</b></p>
          </div>
          <a className={s.inline} href="/blog/ai-memory-with-notes">Read the study</a>
        </figure>
      </section>

      <section className={s.basics} aria-label="The basics">
        <ul>
          {BASICS.map((b) => (
            <li key={b.title}>
              <img src={b.icon} alt="" width={56} height={56} loading="lazy" />
              <h3>{b.title}</h3>
              <p>{b.say}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.closing} aria-labelledby="closing">
        <img src="/mark-256.png" alt="" width={96} height={96} />
        <h2 id="closing" className={s.title}>Say the first thing.</h2>
        <Download className={s.closingCta} quiet={G.closing.fine} />
      </section>
    </div>
  );
}
