// The demo notes the studies show: fictional people and plans, written the way real notes are.
// Plus the ending every study shares.

import DownloadLink from "../DownloadLink";
import PlatformNote from "../PlatformNote";
import { SHARED } from "./copy";
import { Apple, type Line, type Who } from "./kit";
import l from "./lab.module.css";

/** A small bakery's website plan, written by its owner and four AIs. */
export const BAKERY: Line[] = [
  { k: "p", text: "Get the site up before the spring market: menu, opening hours, preorders.", by: "you" },
  { k: "h", text: "Next steps", by: "claude" },
  { k: "todo", text: "Opening hours in the footer", by: "claude" },
  { k: "todo", text: "Take preorders by email", by: "claude" },
  { k: "done", text: "Put the menu online", by: "claude-code" },
  { k: "h", text: "Ideas from the market", by: "chatgpt" },
  { k: "bullet", text: "A photo of the sourdough on the front page", by: "chatgpt" },
  { k: "bullet", text: "Sunday special at the top", by: "chatgpt" },
  { k: "p", text: "Photos were slow on phones. Resized them to 1200 px and load them as you scroll.", by: "codex", tint: true },
];

/** The groceries note from the app's own capture (public/blog/amber-notes-iphone-chatgpt-edited-checklist.webp). */
export const GROCERIES: Line[] = [
  { k: "p", text: "For the weekend, and Sunday dinner with Sara and Jonas." },
  { k: "todo", text: "Paella rice", tint: true },
  { k: "todo", text: "Saffron", tint: true },
  { k: "todo", text: "Chorizo", tint: true },
  { k: "todo", text: "Chicken thighs", tint: true },
  { k: "todo", text: "Smoked paprika", tint: true },
  { k: "todo", text: "Oat milk" },
  { k: "todo", text: "Lemons" },
  { k: "todo", text: "Coffee beans" },
  { k: "todo", text: "Fresh basil" },
  { k: "done", text: "Sourdough" },
  { k: "done", text: "Spinach" },
];
export const GROCERIES_ADDED = ["Paella rice", "Saffron", "Chorizo", "Chicken thighs", "Smoked paprika"];

/** A running plan over one week, as the note's history keeps it. */
const RUNS = ["Mon · 5 km easy", "Wed · Intervals, 6 × 400 m", "Thu · 5 km easy", "Sat · Long run, 12 km"];
const plan = (done: number[], tint: number[] = [], swap?: [number, string]): Line[] => [
  { k: "p", text: "Half marathon on 30 November. Four runs a week, nothing heroic.", quiet: true },
  { k: "h", text: "This week" },
  ...RUNS.map((r, i): Line => ({ k: done.includes(i) ? "done" : "todo", text: swap && swap[0] === i ? swap[1] : r, tint: tint.includes(i) })),
];
export const WEEK: { day: string; who: Who; what: string; lines: Line[] }[] = [
  { day: "Monday", who: "you", what: "You wrote the plan", lines: plan([]) },
  { day: "Wednesday", who: "chatgpt", what: "ChatGPT ticked 2", lines: plan([0, 1], [0, 1]) },
  { day: "Friday", who: "claude", what: "Claude moved 1", lines: plan([0, 1], [2], [2, "Sun · 5 km easy, moved from Thursday"]) },
];

export const HABITS = {
  days: ["M", "T", "W", "T", "F", "S", "S"],
  rows: [
    { name: "Walk", done: [true, true, false, true, true, true, true] },
    { name: "Read", done: [true, false, true, true, false, true, true] },
    { name: "Stretch", done: [false, true, true, true, true, false, true] },
    { name: "No phone in bed", done: [true, true, true, false, true, true, true] },
  ],
};

/** The four asks, one per app (from the pitch, plus Codex). */
export const ASKS = [
  { who: "chatgpt" as const, where: "on your phone", ask: "Turn my kitchen reno note into next steps", note: "Kitchen reno", did: "7 steps added as a checklist" },
  { who: "claude" as const, where: "on your Mac", ask: "How did my running plan go this week? Move what I missed.", note: "Running plan", did: "3 of 4 done, 1 moved" },
  { who: "claude-code" as const, where: "in your terminal", ask: "What did I say I'd do before the release?", note: "Standup notes", did: "3 open items" },
  { who: "codex" as const, where: "in your terminal", ask: "Write what we changed today into my project note", note: "Bakery website", did: "3 lines added" },
];

export function Closing() {
  const c = SHARED.closing;
  return (
    <section className={l.band} aria-labelledby="closing">
      <div className={l.bandInner}>
        <img src="/mark-256.png" alt="" width={88} height={88} className={l.bandIcon} />
        <h2 id="closing" className={l.bandTitle}>{c.title}</h2>
        <p className={l.bandLede}>{c.lede}</p>
        <div className="pi-apple pi-not-ios"><DownloadLink><Apple /> Download for Mac</DownloadLink></div>
        <PlatformNote place="band" />
        <p className={`${l.bandFine} pi-apple pi-not-ios`}>{c.fine}</p>
      </div>
    </section>
  );
}
