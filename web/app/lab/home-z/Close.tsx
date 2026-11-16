import { AIGlyph } from "@/lib/ai-glyphs";
import c from "./close.module.css";

// Round 21: the close is one short sheet on the table (the stats sheet is gone). "Pinto Notes is free.",
// the download, what it needs, and four true facts, each a few words beside a small glyph:
// - Apple Notes come over: the Mac reads them straight from Notes (Pane/Views/ImportSources.swift).
// - Mac and iPhone: the two apps, synced (deployment targets macOS 26 and iOS 26).
// - ChatGPT and Claude: they connect to Pinto Notes and read and write your notes.
// - The study (/blog/ai-memory-with-notes): in a new chat, Claude answered 18% of questions about
//   months of past chats right; with Pinto Notes connected, 82.5%. The glyph's two bars are those two
//   numbers to scale.

const Glyph = {
  apple: <svg viewBox="0 0 18 18"><path d="M9 2.5v8M5.6 7.4 9 10.8l3.4-3.4" /><path d="M2.5 11v2.3c0 1.2.9 2.2 2.2 2.2h8.6c1.3 0 2.2-1 2.2-2.2V11" /></svg>,
  devices: (
    <svg viewBox="0 0 24 18">
      <rect x="1.8" y="2.5" width="14.4" height="9.6" rx="1.4" /><path d="M.8 14.6h16.6" />
      <rect className={c.cut} x="15.6" y="5.6" width="7.2" height="11.6" rx="1.7" /><path d="M18.4 15h1.6" />
    </svg>
  ),
  study: (
    <svg viewBox="0 0 20 20" className={c.bars}>
      <rect className={c.barLo} x="3" y={18 - 17 * 0.18} width="6" height={17 * 0.18} rx="1" />
      <rect className={c.barHi} x="11" y={18 - 17 * 0.825} width="6" height={17 * 0.825} rx="1" />
    </svg>
  ),
};

/** Four true facts in a row, each a few words beside its glyph. */
export function Facts() {
  return (
    <ul className={c.facts}>
      <li><span className={c.tile}>{Glyph.apple}</span><span>Bring your Apple Notes over</span></li>
      <li><span className={c.tile}>{Glyph.devices}</span><span>On Mac and iPhone, in sync</span></li>
      <li><span className={`${c.tile} ${c.marks}`}><AIGlyph name="openai" size={16} color="#24170d" /><AIGlyph name="claude" size={16} color="#d97757" /></span><span>Works with ChatGPT and Claude</span></li>
      <li><span className={c.tile}>{Glyph.study}</span><a href="/blog/ai-memory-with-notes">The study: 82.5% right with Pinto, 18% without</a></li>
    </ul>
  );
}
