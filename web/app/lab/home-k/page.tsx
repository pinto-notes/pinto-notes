import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../_home/Download";
import d from "../../_home/sections.module.css";
import { Street } from "./Street";
import k from "./k.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: notes, whiteboards and apps for you and your AI",
  description: "Notes for iPhone and Mac that feel like Apple Notes, whiteboards and small apps. ChatGPT, Claude, Claude Code and Codex work in all three, with your OK. Free.",
};

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

// Study K, "Three windows" (2026-11-14): one paper-cut street at dusk with three lit windows, one for
// each of the three. Under it, only the AIs, the memory study and the download.
export default function Page() {
  return (
    <div className={k.main}>
      <Street />

      <section className={k.ai} aria-labelledby="ai">
        <h2 id="ai" className={k.aiTitle}>Your AI works in all three.</h2>
        <ul className={k.aiRow}>
          {AIS.map((a) => (
            <li key={a.name}><span className={k.aiMark} data-ai={a.glyph}><AIGlyph name={a.glyph} size={26} /></span>{a.name}</li>
          ))}
        </ul>
        <p className={k.aiSay}>In a new chat, Claude got 18% of questions about months of past chats right. With Pinto Notes connected, 82.5%. <a className={d.inline} href="/blog/ai-memory-with-notes">Read the study</a></p>
      </section>

      <section className={`${d.closingPlain} ${d.closing}`} aria-labelledby="closing">
        <div className={d.bandInner}>
          <img src="/mark-256.png" alt="" width={96} height={96} className={d.closingIcon} />
          <h2 id="closing" className={d.closingTitle}>Start your notebook.</h2>
          <Download className={`${d.closingCta} ${d.ctaCenter}`} quiet="Free and open source. Requires macOS 26 or iOS 26." />
        </div>
      </section>
    </div>
  );
}
