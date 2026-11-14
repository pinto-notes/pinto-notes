import { Caveat, Newsreader } from "next/font/google";
import localFont from "next/font/local";

// Study R's three voices: Newsreader for the headlines (warm and bookish, Granola's register), Caveat
// for the pen notes in the margins, and Excalifont (Excalidraw's own) for the whiteboard.
export const display = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--r-display", display: "swap" });
export const pen = Caveat({ subsets: ["latin"], weight: ["500", "700"], variable: "--r-pen", display: "swap" });
export const board = localFont({ src: "./Excalifont-Regular.woff2", variable: "--r-board", display: "block" });
