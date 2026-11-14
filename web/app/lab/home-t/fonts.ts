import { Newsreader } from "next/font/google";
import localFont from "next/font/local";

// Study T's two voices (round 6). Newsreader is the page's own voice: the headline and the section
// titles, warm and bookish, with an italic for "you and your AI". The product keeps its own faces:
// notes and apps in the system sans, the whiteboard in Excalifont, Excalidraw's hand.
export const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--t-serif", display: "swap" });
export const hand = localFont({ src: "./Excalifont-Regular.woff2", variable: "--t-hand", display: "block" });
