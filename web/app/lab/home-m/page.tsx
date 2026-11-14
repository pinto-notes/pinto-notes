import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Download } from "../../_home/Download";
import { Desk } from "./Desk";
import m from "./m.module.css";

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

// Study M, "The desk" (2026-11-14): the first screen is the desk. Under it, three short things: the
// AIs, the memory study, the download.
export default function Page() {
  return (
    <div className={m.main}>
      <Desk />

      <section className={m.ai} aria-labelledby="ai">
        <h2 id="ai" className={m.aiTitle}>Your AI works in all three, <span>with your OK.</span></h2>
        <ul className={m.aiRow}>
          {AIS.map((a) => (
            <li key={a.name}><span className={m.aiMark} data-ai={a.glyph}><AIGlyph name={a.glyph} size={24} /></span>{a.name}</li>
          ))}
        </ul>
        <p className={m.study}>
          In a new chat, Claude got 18% of questions about months of past chats right. With Pinto Notes connected, 82.5%.{" "}
          <a href="/blog/ai-memory-with-notes">Read the study</a>
        </p>
      </section>

      <section className={m.closing} aria-labelledby="closing">
        <img src="/mark-256.png" alt="" width={88} height={88} className={m.closingIcon} />
        <h2 id="closing" className={m.closingTitle}>Start your notebook.</h2>
        <Download className={m.closingCta} quiet="Free and open source. Requires macOS 26 or iOS 26." />
      </section>
    </div>
  );
}
