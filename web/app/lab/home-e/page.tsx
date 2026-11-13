import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../_home/Download";
import d from "../../_home/sections.module.css";
import { Doors } from "./Doors";
import e from "./e.module.css";

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

// Study E, "Three doors" (2026-11-13): the hero is the three. Under it, only the AIs and the download.
export default function Page() {
  return (
    <div className={e.main}>
      <Doors />

      <section className={e.ai} aria-labelledby="ai">
        <div className={e.aiWords}>
          <h2 id="ai" className={e.aiTitle}>One notebook. <span>Every AI you use works in it.</span></h2>
          <p className={e.aiSay}>In a new chat, Claude answered 18% of questions about months of past chats right. With Pinto Notes connected, 82.5%. <a className={d.inline} href="/blog/ai-memory-with-notes">Read the study</a></p>
        </div>
        <ul className={e.aiRow}>
          {AIS.map((a) => (
            <li key={a.name}><span className={e.aiMark} data-ai={a.glyph}><AIGlyph name={a.glyph} size={30} /></span>{a.name}</li>
          ))}
        </ul>
      </section>

      <section className={`${d.closingPlain} ${d.closing}`} aria-labelledby="closing">
        <div className={d.bandInner}>
          <img src="/mark-256.png" alt="" width={104} height={104} className={d.closingIcon} />
          <h2 id="closing" className={d.closingTitle}>Start your notebook.</h2>
          <Download className={`${d.closingCta} ${d.ctaCenter}`} quiet="Free and open source. Requires macOS 26 or iOS 26." />
        </div>
      </section>
    </div>
  );
}
