import { Instrument_Serif } from "next/font/google";

// The headlines' display face. Tried against Newsreader and Fraunces (round 5): Instrument Serif has
// the most character, its italic carries the one word that matters, and being narrow it keeps the
// hero's "The notebook for / you and your AI." on two lines. The UI and body stay in the site's sans.
export const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--q-display", display: "swap" });
