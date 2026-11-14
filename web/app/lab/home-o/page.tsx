import type { Metadata } from "next";
import { AIGlyph } from "@/lib/ai-glyphs";
import { Switch } from "./Switch";
import s from "./o.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: write, draw and build with your AI",
  description: "Notes for Mac and iPhone that feel like Apple Notes, whiteboards and small apps. ChatGPT and Claude work in all three, with your OK. Free.",
};

// Study O, "The verbs are the switch" (2026-11-14): one centred headline whose three words are the
// tabs, and one big picture that changes with the chosen word. Under it, one band for the AIs.

const AIS = [
  { name: "ChatGPT", glyph: "openai" },
  { name: "Claude", glyph: "claude" },
  { name: "Claude Code", glyph: "claude" },
  { name: "Codex", glyph: "openai" },
] as const;

export default function Page() {
  return (
    <div className={s.main}>
      <Switch />

      <section className={s.ai} aria-labelledby="o-ai">
        <h2 id="o-ai" className={s.aiTitle}>Your AI works in all three.</h2>
        <p className={s.aiLine}>Connect it once. It can add to a note, draw on a whiteboard and make you an app, with your OK.</p>
        <ul className={s.aiRow}>
          {AIS.map((a) => (
            <li key={a.name}><span className={s.aiMark} data-ai={a.glyph}><AIGlyph name={a.glyph} size={26} /></span>{a.name}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
