import type { Metadata } from "next";
import { Fragment } from "react";
import { AIGlyph } from "@/lib/ai-glyphs";
import { G } from "../../_home/copy";
import { Download } from "../../_home/Download";
import { Flip } from "./Flip";
import s from "./j.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: say it to your AI, and it's in your notes",
  description: "Notes for Mac and iPhone that feel like Apple Notes, with whiteboards and small apps. ChatGPT, Claude, Claude Code and Codex work in all of it, with your OK. Free.",
};

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

// Study J, "Say it, and it's there" (2026-11-14): D's three cards are the hero, and each one turns
// over from what you said to your AI to what it made in Pinto. Under them, one line for the AIs, one
// for the memory study, and the download.
export default function Page() {
  return (
    <div className={s.main}>
      <Flip />

      <section className={s.ai} aria-labelledby="j-ai">
        <h2 id="j-ai" className={s.aiLine}>
          Works with{" "}
          {AIS.map((a, i) => (
            <Fragment key={a.name}>
              <span className={s.aiName}><span className={s.aiMark} data-ai={a.glyph}><AIGlyph name={a.glyph} size={22} /></span>{a.name}{i < AIS.length - 2 ? "," : i === AIS.length - 1 ? "." : ""}</span>
              {i === AIS.length - 2 ? " and " : i < AIS.length - 2 ? " " : ""}
            </Fragment>
          ))}
        </h2>
        <p className={s.study}>
          In a new chat, Claude got 18% of questions about months of past chats right. With Pinto Notes connected, 82.5%.{" "}
          <a className={s.inline} href="/blog/ai-memory-with-notes">Read the study</a>
        </p>
      </section>

      <section className={s.closing} aria-labelledby="j-closing">
        <img src="/mark-256.png" alt="" width={96} height={96} className={s.closingIcon} />
        <h2 id="j-closing" className={s.closingTitle}>Say it, and it’s there.</h2>
        <Download className={s.closingCta} quiet={`Free and open source. ${G.closing.fine}`} />
      </section>
    </div>
  );
}
