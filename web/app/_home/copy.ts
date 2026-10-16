// The home page's shared words: the page title, the download lines and the template taglines.
export const G = {
  title: "Pinto Notes: the notes app ChatGPT and Claude can use",
  description: "Notes for Mac and iPhone that ChatGPT, Claude, Claude Code and Codex can read and edit, with your OK. Imports Apple Notes. Free and open source.",
  h1: "One notes app for every AI you use.",
  lede: "ChatGPT, Claude, Claude Code and Codex read and edit your notes, with your OK.",
  quiet: "Free for Mac. Brings your Apple Notes over.",
  notebook: {
    title: "Every AI you use, one notebook.",
    lede: "Ask ChatGPT on your phone and Claude at your desk. Both work in the same note, and each change says who made it.",
  },
  plans: {
    title: "Plans don't die here.",
    lede: "Write the plan once. Your AI checks it when you ask, ticks what's done and moves what's left.",
  },
  apps: {
    title: "Wait, it can do that?",
    lede: "A note can be an app: a habit tracker, a budget, a trip plan. Change it yourself, or ask your AI.",
    all: "See all templates",
    /** The cards' lines, short enough to sit on one line on a fanned card. */
    taglines: { "habit-tracker": "A few small habits, on your schedule.", "trip-plan": "Days, bookings, packing.", "budget-log": "Spending against your budget." } as Record<string, string>,
  },
  feel: {
    title: "Feels like Apple Notes. Brings yours over.",
    lede: "Import Apple Notes in one go. Folders, checklists and tables come along, and Apple Notes stays as it is.",
    /** ?alt=art: the picture and the import card, no phone. */
    ledeAlt: "Import Apple Notes in one go. Folders, checklists and tables come along, and Apple Notes stays as it is. Mac today, iPhone app coming soon.",
    soon: "iPhone app coming soon",
  },
  control: {
    title: "You decide what your AI can touch.",
  },
  closing: {
    title: "Start with the notes you already have.",
    /** Emil, 14 October: the closing works as D round 2 had it; no steps, no extra lines. */
    fine: "Requires macOS 26. iPhone app coming soon.",
  },
};
