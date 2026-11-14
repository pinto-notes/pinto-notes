import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { APP_STORE_URL } from "@/lib/site";
import { Download } from "../../_home/Download";
import x from "../../_home/hero.module.css";
import { Dioramas } from "./Dioramas";
import { OffApple } from "./OffApple";
import s from "./n.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: notes, whiteboards and apps for you and your AI",
  description: "Notes for iPhone and Mac that feel like Apple Notes, whiteboards and small apps. ChatGPT, Claude, Claude Code and Codex work in all three, with your OK. Free.",
};

// Study N (2026-11-14, round 3): study L's paper dioramas at the reference sites' scale. One big
// headline with its line and the download right under it, then the three rooms, each with the real
// piece of Pinto filling it. On a phone the rooms are a 3-up strip so all three show in the first
// screen. Under the rooms only the AIs, the memory study and the download.

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
          <h1 className={s.h1}>Write. Draw. Build.</h1>
          <p className={s.sub}>The notebook for you and your AI.</p>
          <div className={s.act}>
            <div className={x.ctas}>
              <Download note={false} />
              <a className={x.iphone} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="4.5" y="1.5" width="7" height="13" rx="1.8" /><path d="M7 12.5h2" /></svg>
                Get it for iPhone
              </a>
              <a className={x.offMac} href="/download">Download for Mac</a>
              <OffApple />
            </div>
            <p className={s.free}>Free on Mac and iPhone. Works with ChatGPT and Claude.</p>
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
