import type { Metadata } from "next";
import { Ctas, Ending } from "./Ending";
import { hand, serif } from "./fonts";
import { Story } from "./Story";
import s from "./t.module.css";

export const metadata: Metadata = {
  title: "Pinto Notes: the notebook for you and your AI",
  description: "Write notes, draw on whiteboards and build small apps, with your AI. Feels like Apple Notes, on Mac and iPhone. Works with ChatGPT and Claude. Free.",
};

// Study T, round 6 (2026-11-14): "one note becomes everything". One running project on a sticky
// stage (Story.tsx): a note you and ChatGPT both wrote in, which fills the screen, turns into a
// whiteboard, then a habit tracker, and one request changes all three. The named cursors of you,
// ChatGPT and Claude are the signature. Then a short ending (Ending.tsx): who wrote what, Mac and
// iPhone, and the download.

export default function Page() {
  return (
    <div className={`${s.main} ${serif.variable} ${hand.variable}`}>
      <Story cta={<Ctas />} ctaPhone={<Ctas fine={false} />} />
      <Ending cta={<Ctas fine={false} />} />
      <noscript dangerouslySetInnerHTML={{ __html: `<style>.${s.story}{height:auto}.${s.pin}{position:relative;top:0}.${s.cv} [data-k="gptLine"],.${s.cv} [data-k="gptTint"],.${s.cv} [data-k="pill0"]{opacity:1!important}</style>` }} />
    </div>
  );
}
