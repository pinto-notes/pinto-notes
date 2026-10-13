// Every word the three home page studies say, in one place, so copy can be swapped without touching
// the layouts. Drawn from the homepage pitch (content-tools/projects/amber-home/PITCH.md, 13 October
// 2026). Only what the released app does today; the iPhone App Store line appears once per page.

export const SHARED = {
  everyAi: {
    title: "Every AI you use works from the same notes",
    lede: "Connect ChatGPT, Claude, Claude Code or Codex, and each one reads the notes you already keep. Ask ChatGPT on your phone in the morning and Claude at your desk in the afternoon, and both see the same plan.",
    also: "Also Incredible, and any app that supports MCP.",
  },
  apps: {
    title: "A note can also be an app",
    lede: "Ask your AI to turn a note into a small app, and it builds one inside the note. Your habits note becomes a tracker you tick each day. The note's text stays underneath, and you can remove the app whenever you like.",
    ask: "Turn my habits note into a tracker",
    answer: "Done. Your Habits note is now a tracker. Tap a day to tick it.",
  },
  iphone: {
    title: "It feels like Apple Notes, especially on iPhone",
    lede: "The same note list, the same checklists, and a new note is one tap away when you have a thought in the queue for coffee.",
    soon: "The iPhone app is coming to the App Store soon. The Mac app is a free download today.",
  },
  importNotes: {
    title: "Bring all your Apple Notes over in one go",
    lede: "Import on your Mac. Folders, checklists and tables come along, and your Apple Notes stay as they are. Everything is on your iPhone a second later.",
  },
  closing: {
    title: "Start with the notes you already have.",
    lede: "Pinto Notes is free and open source, with no ads and no tracking in the app. Import your Apple Notes, connect the AI you use, and ask it what's next.",
    fine: "Requires macOS 26.",
  },
};

/** A: the note everyone writes in. */
export const A = {
  concept: "One note written by you and every AI you use, with each line's author in the margin.",
  h1: "One notes app for every AI you use.",
  lede: "ChatGPT, Claude, Claude Code and Codex read and edit the notes you keep on your iPhone and Mac. Pinto Notes shows who changed what, with Undo.",
  undo: {
    title: "You can see every change, and undo it",
    lede: "When an AI edits a note, the lines it touched are tinted and Pinto Notes says which app did it. Undo is one tap, and the version before stays in the note's history.",
  },
};

/** B: the plan that keeps moving. */
export const B = {
  concept: "The same plan on Monday, Wednesday and Friday, ticked off by you and your AI: notes as a week, not a pile.",
  h1: "Write the plan. Your AI helps you follow through.",
  lede: "One notes app that ChatGPT, Claude, Claude Code and Codex all read and edit. It feels like Apple Notes, and brings yours over in one go.",
  checkIn: {
    title: "Ask how it's going",
    lede: "Your AI reads the plan when you ask, counts what you ticked, and moves what's left. It never changes a note on its own.",
  },
};

/** C: feels like Apple Notes, on your phone. */
export const C = {
  concept: "Ask on one phone, see it land on the other: the app's amber tint runs from the answer to the lines it changed.",
  h1: "Feels like Apple Notes. Works with every AI you use.",
  lede: "Ask ChatGPT, Claude, Claude Code or Codex to change a note. The lines they touched show up tinted on your iPhone and Mac, with Undo.",
  apps: {
    title: "Works with the AI you already use",
  },
  plan: {
    title: "Write the plan. Your AI helps you follow through.",
    lede: "It can search all your notes, so a promise you wrote down in March still comes up when you ask.",
  },
};

/** D: the plan that gets done. Every line earns its place (docs/DESIGN.md, Copy). */
export const D = {
  concept: "A real plan on a paper desk, ticked off by you and your AI; then why it stays done.",
  h1: "One notes app for every AI you use.",
  lede: "ChatGPT, Claude, Claude Code, Codex and Incredible read and edit the notes you keep.",
  quiet: "Free. Brings your Apple Notes over.",
  oneNotebook: {
    title: "Every AI you use, one notebook.",
    lede: "You and your AIs work in the same note, and each change says who made it.",
  },
  plans: {
    title: "Plans don't die here.",
    lede: "Your AI reads the plan when you ask and moves what's left.",
  },
  feel: {
    title: "Feels like Apple Notes. Brings yours over.",
    lede: "Import on your Mac. Folders, checklists and tables come along, and Apple Notes stays as it is.",
    soon: "iPhone app coming soon",
  },
  wait: {
    title: "Wait, it can do that?",
    lede: "Start from a template your AI fills in.",
    all: "See all templates",
  },
  closing: {
    title: "Start with the notes you already have.",
    fine: "Requires macOS 26.",
  },
};

/** E: the revised direction (A's first screen, B's week, C's two phones). One sentence per lede. */
export const E = {
  concept: "A's note everyone writes in, with you and two AIs; then B's week, C's two phones, the import, a note that is an app, privacy and the facts.",
  h1: "One notes app for every AI you use.",
  lede: "ChatGPT, Claude, Claude Code, Codex and Incredible read and edit the same notes, and the margin shows who wrote what.",
  quiet: "Free for Mac. Imports your Apple Notes.",
  week: {
    title: "Write the plan. Your AI helps you follow through.",
    lede: "Tell your AI how the week went, and it ticks what you did and moves what you missed.",
  },
  iphone: {
    title: "It feels like Apple Notes, especially on iPhone",
    lede: "The same note list and the same checklists, and the lines an AI just added are tinted, with Undo.",
    soon: "iPhone app coming soon",
  },
  importNotes: {
    title: "Bring all your Apple Notes over in one go",
    lede: "Import on your Mac, and folders, checklists and tables come along while your Apple Notes stay as they are.",
  },
  apps: {
    title: "A note can also be an app",
    lede: "Ask your AI to turn a note into a small app, and it builds one inside the note.",
    ask: "Turn my habits note into a tracker",
    templates: "Start from a template",
  },
  facts: [
    { title: "Encrypted", text: "Your notes are encrypted on your iPhone or Mac." },
    { title: "Open source", text: "The code is public on GitHub." },
    { title: "Free", text: "The Mac app is free, with no ads and no tracking in the app." },
    { title: "Every change undoable", text: "Each version of a note stays in its history." },
  ],
  closing: {
    title: "Start with the notes you already have.",
    lede: "Import your Apple Notes, connect the AI you use, and ask it what's next.",
    fine: "Requires macOS 26.",
  },
};
