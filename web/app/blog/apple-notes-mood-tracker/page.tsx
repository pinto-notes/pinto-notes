import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-mood-tracker", { title: "Apple Notes mood tracker, with energy and sleep" });

// Written 21 November 2026 for "apple notes mood tracker" (topic-research-2026-11-20.md row 29). Google autocomplete
// gave no variants for it on 20 Nov and the result page wasn't checked, so this is a cheap post with no demand
// evidence. Apple Notes facts, all from apple-notes-tables and apple-notes-cornell-notes-template (tried on macOS 27):
// Format, Table (Option-Command-T) makes a table of two rows and two columns; type rows with a tab between columns,
// select them and press the Table button, and every tab becomes a column; Tab in the last cell adds a row; column
// widths can't be dragged; tables don't add up or sort. Paste as Markdown is NOT used for the table: only headings,
// lists and checklists were verified for it. Also: pin a note (apple-notes-workout-log-template), search reads every
// word (apple-notes-recipe-template), Math Results does sums you type (apple-notes-budget-template). No medical advice
// anywhere, as the template's own prompt says. Pinto side: web/content/templates/mood-energy-log.json (a Check-ins table
// with typed columns Date, Mood 1 to 5 and Energy 1 to 5 as scales, Sleep in hours as a number and a Note; the AI logs
// a row from your day told in your own words and asks when it's unsure of a score; Patterns says how many days it rests
// on; the asks "What do my best days have in common?" and "Does a short night change my energy the next day?"). The
// picture is BlogSnapshots.moodEnergyLogForTemplatePost: the template's own example, drawn offscreen by NoteDetailView.

// Tabs between the columns: select those lines in Notes and press the Table button.
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
    "No. Apple Notes has no mood tracker and no templates. A table with a row for each evening, with mood, energy, sleep and a short note, works as one, and you can paste the template on this page and turn it into a table.",
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
      intro={<>
        A bad week feels like it came from nowhere until you look at the nights before it. A mood tracker is how you look. Here&apos;s a
        mood and energy tracker for Apple Notes to paste in, a way to keep it up for more than a week, and where a note stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#evening", label: "Each evening" },
          { href: "#look-back", label: "Looking back" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A log that spots patterns" },
        ]}>
          <p>
            Apple Notes has no mood tracker, but a table does the job: a row for each evening with the date, mood and energy from 1 to 5,
            hours of sleep and one line about the day. After a few weeks, read down the columns to see what your good days have in common.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-mood-tracker" position="answer" template="mood-energy-log" title="Want the patterns found for you?">
            <p>Pinto Notes works like Apple Notes and has a free mood and energy log. Tell ChatGPT or Claude about your day and it logs the row, then tells you what it notices when you ask.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/mood-energy-log-note" width={1520} height={1057} maxWidth={600}
        alt="A Mood and energy log note in Pinto Notes on a Mac: a Check-ins table with five evenings from 4 to 8 November, each with mood, energy, hours of sleep and a short note, and three patterns below it."
        caption="A mood and energy log in Pinto Notes, where mood and energy are 1 to 5 scales. In Apple Notes the same columns work as a plain table. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one row an evening</h2>
      <p>
        Five columns, and every one earns its place. Mood is how the day felt. Energy is how much you had, which isn&apos;t the same
        thing: a good day can leave you flat. Sleep is the number most likely to explain both. The note is one line about the day, so a
        3 in two weeks still means something. Five example evenings are filled in; replace them with yours.
      </p>
      <Keep title="Mood and energy log for Apple Notes" text={TEMPLATE}
        note="Each table line has a tab between the columns. Paste it, then turn those lines into a table." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"], keys: "⌥⌘T" }]} />
      <ul>
        <li>
          <strong>Paste, then make the table.</strong> Paste the template into a new note, select the six lines from Date to the last
          evening, and press the Table button. Every tab becomes a column, so you get Date, Mood, Energy, Sleep and Note side by side.
        </li>
        <li>
          <strong>Clear the examples, add your rows.</strong> Delete the example evenings or type over them. Tab in the last cell adds the
          next row.
        </li>
        <li>
          <strong>Keep the note short.</strong> Notes sets the column widths itself and you can&apos;t drag them, so a long note squeezes the
          numbers. A few words is plenty.
        </li>
        <li>
          <strong>Pin it.</strong> Pin the note to the top of its folder, so the evening check-in is one tap away.
        </li>
      </ul>
      <p>
        <a href="/blog/apple-notes-tables">Tables in Apple Notes</a> covers everything a table in Notes can and can&apos;t do.
      </p>

      <h2 id="evening">Each evening</h2>
      <ul>
        <li><strong>Same time, every day.</strong> Fill it in when you brush your teeth or put the phone on charge, so it rides on something you already do.</li>
        <li><strong>Score the whole day.</strong> Mood at 10 pm after a nice dinner says little about a hard afternoon. Think back over the day before you pick a number.</li>
        <li><strong>Use the whole scale.</strong> If every day is a 3, the log can&apos;t show you anything. A 1 or a 5 now and then is honest.</li>
        <li><strong>Write what was different.</strong> &ldquo;Meetings all day&rdquo; or &ldquo;slept in&rdquo; is what you&apos;ll search for later.</li>
        <li><strong>Leave a missed day out.</strong> A gap is better than a score you made up three days later.</li>
      </ul>
      <p>
        If you want words as well as numbers, the <a href="/blog/apple-notes-journal-template">Apple Notes journal template</a> asks four
        short questions a day, and the <a href="/blog/apple-notes-habit-tracker">habit tracker</a> fits next to this note for things
        like a walk or no screens after ten.
      </p>

      <h2 id="look-back">Looking back</h2>
      <p>
        Once a week, read down the table and write what you notice under Patterns. Search reads every word in every note, so searching
        &ldquo;meetings&rdquo; finds every day you wrote it. For a quick total, Math Results does sums you type, so 4+3+4+4+4= under the table
        adds up the week&apos;s mood.
      </p>
      <p>
        Give it a few weeks before you draw conclusions; five days is a start. This is a diary of how you felt, and it isn&apos;t a health
        tool. If low days keep piling up, talk to a doctor.
      </p>

      <h2 id="limits">Where a mood tracker in Notes stops</h2>
      <ul>
        <li><strong>Tables don&apos;t count.</strong> A table in Notes can&apos;t sort your best days to the top, average a column or draw a chart.</li>
        <li><strong>Patterns are by eye.</strong> Seeing that energy drops after a short night means reading every row and holding it in your head.</li>
        <li><strong>The row is typed.</strong> On a tired evening, five cells is enough to make you skip it.</li>
      </ul>
      <p>
        For a month, a table in a note is all you need. Over months, the useful part, seeing what lifts you and what drains you, is left
        to you.
      </p>

      <h2 id="pinto-notes">A mood log that spots patterns</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/mood-energy-log">mood and energy log</a> template is one note with a Check-ins table:
        a date, mood and energy as 1 to 5 scales, sleep in hours and a note, with Patterns below it.
      </p>
      <p>
        Each evening, tell your AI about your day in your own words. It adds the row, with mood and energy from 1 (low) to 5 (great), your
        sleep and one short line. When it isn&apos;t sure about a score, it asks you instead of guessing. After a few weeks, ask &ldquo;what do my
        best days have in common?&rdquo; or &ldquo;does a short night change my energy the next day?&rdquo; and it writes what it notices
        under Patterns, with how many days that rests on. It doesn&apos;t give medical advice. You can still add and edit every row
        yourself, and every earlier version of the note is kept. This works once ChatGPT or Claude is connected;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        A log you already keep in Apple Notes comes over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple
        Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
