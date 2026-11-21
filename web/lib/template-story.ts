/// A template page told as a story (Emil, 21 November 2026: "think outside the box, be ambitious"):
/// the template's world as art across the top with the app on a Mac and an iPhone together, then a
/// real week of it, where tapping a day shows that day's phone and what was said to the AI, then
/// the part no other habit app has: asking for a change and getting a changed app, before and after.
///
/// Truth: every chat is a real run (Claude Code 2.1.330 through the Pinto Notes connector, on the
/// local stack with a fresh test account), cut short but never reworded. Every picture is the app
/// itself, drawn over the data those chats saved, on that day's date. Transcripts and data:
/// blog-growth/research/s1/habit-week-2026-11-21 and habit-talk-2026-11-21 (the changes, with the
/// app's own tests running on every save).

export type StoryDay = {
  /// "Monday"
  label: string;
  /// "M", the column head.
  short: string;
  you: string;
  ai: string;
  /// The phone that day, in public/.
  phone: string;
};

/// One message in a chat: what the person said, or (who set) what came back.
export type Said = { you: string } | { ai: string };

/// A change asked for in a new chat, with the app before and after.
export type StoryAsk = {
  /// The tab: "A year view"
  label: string;
  chat: Said[];
  before: { src: string; alt: string };
  after: { src: string; alt: string };
};

export type TemplateStory = {
  headline: string;
  lede: string;
  /// Wide art for the top, and a lighter copy for phones.
  art: { src: string; phone: string; ground: string; ink: string };
  mac: { src: string; width: number; height: number; alt: string };
  /// The phone the top shows: the last day.
  phone: { src: string; alt: string };
  week: {
    title: string;
    lede: string;
    who: string;
    /// The rows: each habit's share of its target, per day, from the saved data.
    rows: { name: string; days: number[] }[];
    days: StoryDay[];
    caption: string;
  };
  change: { title: string; lede: string; who: string; asks: StoryAsk[]; caption: string };
};

const P = "/templates/story/habit-tracker";

export const TEMPLATE_STORY: Record<string, TemplateStory> = {
  "habit-tracker": {
    headline: "A habit tracker you can talk to.",
    lede: "Tell ChatGPT or Claude what you did, and it ticks it off. Tell it what you want, and it changes the app.",
    art: { src: `${P}/art.webp`, phone: `${P}/art-phone.webp`, ground: "#a2b07f", ink: "#1f2a12" },
    mac: { src: `${P}/mac.webp`, width: 2000, height: 1250, alt: "The habit tracker in Pinto Notes on a Mac: Saturday 21 November, 15 of 18 since Monday, the week's dots, and Walk, Read and Water with their streaks." },
    phone: { src: `${P}/phone-d6.webp`, alt: "The same habit tracker on an iPhone: Walk and Read ticked, Water at 4 of 8 glasses." },
    week: {
      title: "Tell it what you did.",
      lede: "A real week with Claude, a new chat each day. Tap a day.",
      who: "Claude",
      rows: [
        { name: "Walk", days: [1, 1, 0, 1, 1, 1] },
        { name: "Read", days: [1, 1, 1, 1, 1, 1] },
        { name: "Water", days: [1, 1, 5 / 8, 1, 1, 4 / 8] },
      ],
      days: [
        { label: "Monday", short: "M", phone: `${P}/phone-d1.webp`, you: "Monday: walked, read 20 pages, 8 glasses of water.",
          ai: "I logged Monday, November 16 in your Habits app. You walked, read your 20 pages and drank all 8 glasses of water, so every habit was done that day." },
        { label: "Tuesday", short: "T", phone: `${P}/phone-d2.webp`, you: "Tuesday: walked and read. 8 glasses.",
          ai: "I added Tuesday, 17 November, to your Habits tracker. All three habits are done that day, the same as Monday." },
        { label: "Wednesday", short: "W", phone: `${P}/phone-d3.webp`, you: "Wednesday: no walk, it rained. Read before bed. Only 5 glasses.",
          ai: "Missing the walk breaks its streak, which had run since Monday. If you'd rather count the rain as a skip day so the streak survives, I can change it." },
        { label: "Thursday", short: "T", phone: `${P}/phone-d4.webp`, you: "Thursday: walked, read, 8 glasses.",
          ai: "I logged Thursday, Nov 19, in your Habits tracker as walked, read and 8 of 8 glasses of water." },
        { label: "Friday", short: "F", phone: `${P}/phone-d5.webp`, you: "Friday: walked, read, 8 glasses.",
          ai: "That's 4 full days out of 5 this week. Wednesday was the only miss, when you didn't walk and had 5 glasses." },
        { label: "Saturday", short: "S", phone: `${P}/phone-d6.webp`, you: "Walked and read 20 pages this morning. 4 glasses of water so far.",
          ai: "Walk: done. That's 3 days in a row, since you missed Wednesday. Water: 4 of 8 glasses. You need 4 more to finish it today." },
      ],
      caption: "Claude through the Pinto Notes connector, on a test account, 16 to 21 November 2026. Replies cut short, not reworded. Each phone is the app on that day.",
    },
    change: {
      title: "Tell it what you want.",
      lede: "Most habit apps stay the way they shipped. This one changes when you ask. Claude edits the app itself, and the app runs its tests before you see the new version.",
      who: "Claude",
      asks: [
        {
          label: "A year view",
          chat: [
            { you: "Can my habit tracker show a year view for each habit? Like a GitHub-style grid of the whole year." },
            { ai: "Your habit tracker now has a year view for each habit, like GitHub's grid. It's live on your devices, and all 40 tests pass, including 2 new ones for this view." },
          ],
          before: { src: `${P}/year-before.webp`, alt: "Before: the Month tab, a calendar per habit." },
          after: { src: `${P}/year-after.webp`, alt: "After: the Month tab has a Month and Year switch, and Year shows a grid of 2026 for each habit." },
        },
        {
          label: "A bigger goal",
          chat: [
            { you: "Make water 10 glasses a day from now on." },
            { ai: "Your Water goal in the Habits app is now 10 glasses a day, up from 8. So the days you drank 8 glasses (Nov 16, 17, 19 and 20) now show as partly done instead of done. If you want the 8-glass days to stay done, I can change the app so a new goal only applies from the day you set it." },
            { you: "The days I drank 8 glasses should still count as done. Can a new goal only apply from the day I set it?" },
            { ai: "Yes. A new goal now counts only from the day you set it, and your earlier 8-glass days count as done again. I added a test that raises Water from 8 to 10 and checks that yesterday still counts and the streak holds. All 41 tests pass." },
          ],
          before: { src: `${P}/goal-before.webp`, alt: "Before: Water at 4 of 8 glasses." },
          after: { src: `${P}/goal-after.webp`, alt: "After: Water at 4 of 10 glasses, with its 2-day streak kept." },
        },
      ],
      caption: "Claude through the Pinto Notes connector, on the same test week, 21 November 2026. A new chat for each ask. Replies cut short, not reworded.",
    },
  },
};

export const templateStory = (slug: string): TemplateStory | undefined => TEMPLATE_STORY[slug];
