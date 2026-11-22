import { PostPage, postMetadata } from "@/lib/PostPage";
import { Keep, MenuPath, Steps } from "@/lib/PostParts";
import { SideBySide } from "@/lib/SideBySide";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-mood-tracker", { title: "Apple Notes mood tracker, with energy and sleep" });

// Written 21 November 2026 for "apple notes mood tracker"; rebuilt 22 November 2026 in pattern E (lib/SideBySide.tsx).
// Apple Notes: blog-growth/research/apple-notes-captures-2026-11-22 (macOS 27.0). Plain paste, the six lines from Date to
// 8 Nov made a table with the Table button: five columns, six rows, Patterns under it. Typing 4+3+4+4+4= under the table got
// the suggestion 19.
// Pinto Notes: the mood and energy log template's note (content/templates/mood-energy-log.json) with the same five evenings
// and three patterns written under them, drawn by the Mac app offscreen (PaneTests/HIG/BlogSnapshots.swift).

const TEMPLATE = `Mood and energy log

Date\tMood (1 to 5)\tEnergy (1 to 5)\tSleep (hours)\tNote
4 Nov\t4\t4\t7.5\tGym before work
5 Nov\t3\t2\t6\tMeetings all day
6 Nov\t4\t3\t6.5\tLunch with Maja
7 Nov\t4\t2\t5.5\tMaja's moving day
8 Nov\t4\t4\t8\tSlept in

Patterns
`;

const FAQ = [
  { q: "Does Apple Notes have a mood tracker?", a: [
    "No. Apple Notes has no mood tracker and no templates. A table with a row for each evening, with mood, energy, sleep and a short note, works as one.",
  ] },
  { q: "What should a mood tracker include?", a: [
    "Keep it small enough to fill in every evening: the date, mood and energy from 1 to 5, hours of sleep and one line about the day. The line matters most, because it's what explains a low score later.",
  ] },
  { q: "Can Apple Notes make a chart of my mood?", a: [
    "No. A table in Notes doesn't sort, add up or draw a chart. You read the columns yourself, or copy the rows into a spreadsheet when you want a graph.",
  ] },
  { q: "Is there a mood tracker that spots patterns for me?", a: [
    "Pinto Notes has a free mood and energy log template. Tell ChatGPT or Claude about your day and it logs the scores, and when you ask, it writes down what it notices and how many days that rests on.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-mood-tracker"
      cover={false}
      intro={<>A row each evening: mood, energy, sleep and one line about the day.</>}
      answer={<>
        <Keep title="Mood and energy log for Apple Notes" text={TEMPLATE} fold={10}
          note="After pasting, select the six lines from Date to 8 Nov and press the Table button." />
        <SideBySide slug="apple-notes-mood-tracker"
          apple={{ src: "/blog/side-by-side/mood-tracker-apple-notes", width: 1894, height: 600, line: "Keeps the rows. Finding the patterns is up to you.",
            alt: "The mood template in Apple Notes on macOS 27: a table of five evenings from 4 to 8 November with mood, energy, sleep and a note, and an empty Patterns line." }}
          pinto={{ frame: false, title: "The same log in Pinto Notes", line: "Tell your AI about your day and it logs the row. Ask, and it writes down the patterns.",
            alt: "The same five evenings in the Pinto Notes mood and energy log, with three patterns written under the table.",
            phone: { src: "/blog/side-by-side/mood-energy-log-pinto-phone", width: 780, height: 1100 },
            desk: { src: "/blog/side-by-side/mood-energy-log-pinto-mac", width: 1520, height: 895 },
            href: "/templates/mood-energy-log", button: "Get the mood log template" }} />
      </>}
      faq={FAQ}
    >
      <h2 id="how">How to use it</h2>
      <Steps>
        <li>Paste the template into a new note, select the six lines from Date to 8 Nov and press the Table button: <MenuPath steps={["Format", "Table"]} keys="⌥⌘T" /></li>
        <li>Replace the examples with your evenings. Tab in the last cell adds the next row. A few words in Note is enough.</li>
        <li>Fill it in at the same time each evening, and leave a missed day out.</li>
        <li>Once a week, read down the columns and write what you notice under Patterns. For a quick total, type 4+3+4+4+4= under the table and Notes offers 19.</li>
      </Steps>
      <p>This is a diary of how you felt, not a health tool. If low days keep piling up, talk to a doctor.</p>
      <p>More for Apple Notes: <a href="/blog/apple-notes-habit-tracker">a habit tracker</a> and <a href="/blog/apple-notes-tables">what tables in Notes can and can&apos;t do</a>.</p>
    </PostPage>
  );
}
