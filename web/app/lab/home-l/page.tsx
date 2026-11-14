import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL } from "@/lib/site";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { Dioramas } from "./Dioramas";
import { OffApple } from "./OffApple";
import s from "./l.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: notes, whiteboards and apps for you and your AI",
  description: "Notes for iPhone and Mac that feel like Apple Notes, whiteboards and small apps. ChatGPT, Claude, Claude Code and Codex work in all three, with your OK. Free.",
};

// Study L, "Paper dioramas" (2026-11-14): D's three cards, right under a short headline and the
// download, each built as one of E's paper-cut scenes. Every card is a shadow box of cut paper with
// the real piece of Pinto standing in it; pointing at one tilts it and the planes move apart. Under
// the cards only the AIs, the memory study and the download.

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

export default function Page() {
  return (
    <div className={s.main}>
      <section className={s.hero}>
        <div className={s.head}>
          <h1 className={s.h1}>The notebook <span className={s.mark}>you and your AI</span> share.</h1>
          <div className={s.side}>
            <p className={s.lede}>Write notes, draw on whiteboards and make small apps. ChatGPT and Claude work in all three, with your OK.</p>
            <div className={x.ctas}>
              <Download note={false} />
              <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
                Get it for iPhone
              </a>
              <a className={x.offMac} href="/download">Download for Mac</a>
              <OffApple />
            </div>
          </div>
        </div>
        <Dioramas />
      </section>

      <section className={s.ai} aria-labelledby="ai">
        <div>
          <h2 id="ai" className={s.aiTitle}>One notebook. <span>Every AI you use works in it.</span></h2>
          <p className={s.aiSay}>In a new chat, Claude answered 18% of questions about months of past chats right. With Pinto Notes connected, 82.5%. <a className={s.inline} href="/blog/ai-memory-with-notes">Read the study</a></p>
        </div>
        <ul className={s.aiRow}>
          {AIS.map((a) => (
            <li key={a.name}><span className={s.aiMark} data-ai={a.glyph}><AIGlyph name={a.glyph} size={30} /></span>{a.name}</li>
          ))}
        </ul>
      </section>

      <section className={s.closing} aria-labelledby="closing">
        <img src="/mark-256.png" alt="" width={96} height={96} className={s.closingIcon} />
        <h2 id="closing" className={s.closingTitle}>Start your notebook.</h2>
        <Download className={s.closingCta} quiet="Free and open source. Requires macOS 26 or iOS 26." />
      </section>
    </div>
  );
}
