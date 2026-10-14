import type { Metadata } from "next";
import { Played, Scrubbed, Tried } from "./Story";
import { Download } from "../kit";
import l from "../lab.module.css";
import h from "../home-h/h.module.css";
import s from "./story.module.css";

export const metadata: Metadata = { title: "Hero lab" };

// Hero motion lab. ?v=played (default): the story plays once beside the headline when in view.
// ?v=scrubbed: the same story pinned and scrubbed by scroll. ?t= freezes the played story.
export default async function HeroLab({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  const { v = "played" } = await searchParams;
  return (
    <div className={`${l.main} ${h.main}`} data-quiet-nav="">
      <section className={s.hero}>
        <div className={s.words}>
          <h1 className={l.h1} style={{ maxWidth: "11ch" }}>One notes app for <span className={h.mark}>every AI</span> you use.</h1>
          <p className={l.lede} style={{ maxWidth: "30em" }}>ChatGPT, Claude, Claude Code and Codex read and edit your notes, with your OK.</p>
          <Download quiet="Free for Mac. Brings your Apple Notes over." />
        </div>
        {v === "scrubbed" ? <Scrubbed /> : v === "try" ? <Tried /> : <Played />}
      </section>
      <div style={{ height: "80vh" }} />
    </div>
  );
}
