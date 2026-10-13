// Every word study F says. F is D's page with E's week and E's two phones, so most lines are D's.
// Changed from D: the hero lede and the encrypted fact no longer say "on your iPhone" (the iPhone app
// isn't on the App Store yet), and the week's lede is E's, which says what the pictures show.

import { D, SHARED } from "../copy";

export const F = {
  h1: D.h1,
  lede: "ChatGPT, Claude, Claude Code and Codex read and edit the same notes as you, and every change says who made it.",
  quiet: D.quiet,
  oneNotebook: D.oneNotebook,
  also: SHARED.everyAi.also,
  plans: {
    title: "Plans don't die here.",
    lede: "Tell your AI how the week went, and it ticks what you did and moves what you missed. It never changes a note on its own.",
  },
  feel: {
    title: D.feel.title,
    lede: D.feel.lede,
    soon: "iPhone app coming soon",
  },
  wait: D.wait,
  facts: [
    { title: "Encrypted", line: "Your notes are encrypted on your Mac before they leave it." },
    { title: "Open source", line: "The app's code is on GitHub." },
    { title: "Free", line: "No ads, and no tracking in the app." },
    { title: "Every change undoable", line: "Each edit keeps the version before it." },
  ],
  closing: SHARED.closing,
};
