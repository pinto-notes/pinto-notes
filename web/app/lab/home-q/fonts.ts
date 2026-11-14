import { Newsreader } from "next/font/google";

// The headlines' display face. Round 6 (owner: "the header texts feel too thin"): tried Newsreader
// 500 and 560, Fraunces 600 (SOFT 50, WONK 0) and Source Serif 4 600 against Instrument Serif
// (shots/q3/font-specimen.png). Newsreader at 500 with its optical sizes reads confident and warm,
// close to Granola's heading weight, its italic is the best of the three for "you and your AI", and
// the letters keep their room. Variable, so the weight is set in q.module.css.
export const display = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--q-display", display: "swap" });
