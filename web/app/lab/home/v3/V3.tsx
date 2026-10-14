import { AIGlyph } from "@/lib/ai-glyphs";
import { G } from "../../copy";
import { Download } from "../../kit";
import l from "../../lab.module.css";
import d from "../../home-d/d.module.css";
import g from "../../home-g/g.module.css";
import { Scene } from "./Scene";
import s from "./paper.module.css";

const Ok = () => <svg className={s.ok} viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" /></svg>;

/// Version 3, "Paper": the picture book. Each benefit is one cut-paper scene drawn for it, with the
/// words in its calm left third and one real piece of the app laid in as proof.
export function V3() {
  return (
    <div className={`${l.main} ${s.page}`} data-quiet-nav="">
      <Scene id="hero" ground="#fce1b2" art="/home-paper/hero.webp" alt="A cut-paper notebook lying open, with three small speech bubbles threaded to its page."
        proof={<>
          <span className={s.chip}><AIGlyph name="openai" size={14} /><b>ChatGPT</b> added a day trip</span>
          <span className={s.chip}><AIGlyph name="claude" size={14} /><b>Claude</b> ticked the hotel</span>
          <span className={s.chip}><AIGlyph name="claude" size={14} /><b>Claude Code</b> logged the fix</span>
        </>}>
        <h1 id="hero">The notebook <span className={s.mark}>you and your AI</span> share.</h1>
        <p>ChatGPT, Claude, Claude Code and Codex read and write in it, with your OK. It looks and feels like Apple Notes.</p>
        <div className={s.cta}><Download quiet={G.quiet} /></div>
      </Scene>

      <Scene id="memory" flip ground="#fde6c1" art="/home-paper/memory.webp" alt="Two cut-paper speech bubbles threaded into one note card."
        proof={
          <div className={s.card}>
            <span className={s.cardTop}><AIGlyph name="claude" size={13} />Claude · Wednesday</span>
            <p className={s.cardMe}>What should I run today?</p>
            <p className={s.cardTool}>Used Pinto Notes · Running plan</p>
            <p className={s.cardAi}>Intervals, 6 × 400 m. It's in the plan ChatGPT saved on Monday.</p>
          </div>
        }>
        <h2 id="memory">Stop re‑explaining yourself.</h2>
        <p>Tell one AI once. It goes in your notebook, and every other AI you use can read it there.</p>
      </Scene>

      <Scene id="plans" dark art="/home-paper/week-dark.webp" alt="A cut-paper week with four days ticked and one day moving to Sunday."
        proof={<span className={s.chip}><AIGlyph name="claude" size={14} /><b>Claude</b> moved Thursday's run to Sunday</span>}>
        <h2 id="plans">Notes are where plans go to die. Not here.</h2>
        <p>Ask your AI how the week went. It reads what you ticked, tells you straight, and moves what's left so the plan keeps going.</p>
      </Scene>

      <Scene id="apps" flip ground="#fde4bb" art="/home-paper/popup.webp" alt="A cut-paper notebook page folding up into a small app with a progress ring."
        proof={<span className={s.chip}><Ok />Habit tracker · <b>2 of 6 done today</b></span>}>
        <h2 id="apps">A note can be an app.</h2>
        <p>A habit tracker, a budget, a trip plan. Change it yourself, or ask your AI to build what you need. <a className={d.inline} href="/templates">See the templates</a></p>
      </Scene>

      <Scene id="home" ground="#fce5ba" art="/home-paper/home.webp" alt="A yellow legal pad with cut-paper notes moving across to a cream notebook."
        proof={<span className={s.chip}><Ok /><b>1,284 notes</b> brought over from Apple Notes</span>}>
        <h2 id="home">Feels like Apple Notes. Bring yours over.</h2>
        <p>Import every note in one go, folders and checklists included. Encrypted before it syncs, and every change can be undone.</p>
      </Scene>

      <section className={`${d.band} ${d.closing}`} aria-labelledby="closing" data-dark-band="" style={{ marginTop: 100 }}>
        <div className={d.bandInner}>
          <img src="/mark-256.png" alt="" width={104} height={104} className={d.closingIcon} />
          <h2 id="closing" className={d.closingTitle}>Start your notebook.</h2>
          <Download className={`${d.closingCta} ${g.ctaCenter}`} quiet={G.closing.fine} />
        </div>
      </section>
    </div>
  );
}
