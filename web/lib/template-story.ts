/// A template page told as a story (Emil, 21 November 2026: "think outside the box, be ambitious"):
/// the template's world as art across the top with the app on a Mac and an iPhone together, then a
/// real week of it, where tapping a day shows that day's phone and what was said to the AI.
///
/// Truth: every chat is a real run (Claude Code 2.1.330 through the Pinto Notes connector, on the
/// local stack with a fresh test account), cut short but never reworded. Every picture is the app
/// itself, drawn over the data those chats saved, on that day's date. Transcripts and data:
/// blog-growth/research/s1/habit-week-2026-11-21.

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
};

const P = "/templates/story/habit-tracker";

export const TEMPLATE_STORY: Record<string, TemplateStory> = {
  "habit-tracker": {
    headline: "Habits, kept for you.",
    lede: "A habit tracker on your iPhone and Mac that ChatGPT and Claude can tick.",
    art: { src: `${P}/art.webp`, phone: `${P}/art-phone.webp`, ground: "#a2b07f", ink: "#1f2a12" },
    mac: { src: `${P}/mac.webp`, width: 1800, height: 745, alt: "The habit tracker in Pinto Notes on a Mac: Saturday 21 November, 15 of 18 since Monday, the week's dots, and Walk, Read and Water with their streaks." },
    phone: { src: `${P}/phone-d6.webp`, alt: "The same habit tracker on an iPhone: Walk and Read ticked, Water at 4 of 8 glasses." },
    week: {
      title: "Six messages. One week, counted.",
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
  },
};

export const templateStory = (slug: string): TemplateStory | undefined => TEMPLATE_STORY[slug];
