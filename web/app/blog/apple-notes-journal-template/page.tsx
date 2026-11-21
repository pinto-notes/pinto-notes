import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-journal-template", { title: "Apple Notes journal template, one entry a day" });

// Written 21 November 2026 for "apple notes journal template" (Google autocomplete 20 Nov: apple notes journal
// template, apple notes daily journal template, apple notes diary template, iphone notes journal template, also apple
// notes bullet journal template and apple notes notebook template; topic-research-2026-11-20.md row 24). The result
// page: the same template spam as for "apple notes templates". apple-notes-templates has a Daily plan (top three, if
// there's time) and the Templates folder method, but no journal; this post is the journal one (one running note, newest
// day first, the questions, finding old entries) and says nothing against duplicating from a Templates folder. Apple
// Notes facts, all from earlier posts tried on macOS 27: Edit, Paste as Markdown turns # and ## lines into a title
// and headings, and a plain Command-V keeps the symbols (apple-notes-templates); File, Duplicate Note
// (apple-notes-templates, apple-notes-meal-planner-template); typing #word makes a tag and a Smart Folder rule can use
// Tags (apple-notes-tags-smart-folders); search reads every word (apple-notes-recipe-template); pin a note
// (apple-notes-workout-log-template); locked notes open with a password or Face ID (forgot-apple-notes-password).
// Pinto side: web/content/templates/daily-journal.json (a Daily journal note with four Questions and Entries, newest
// day first; the AI asks the questions one at a time and skips any you pass on, or writes the entry from your day told
// in one go, as a ### weekday and date heading with Today, Energy, Remember and Tomorrow lines in your own words; no
// advice unless asked; the asks "Today was long: Maja's move is done..." and "What's been on my mind this week?").
// The picture is BlogSnapshots.dailyJournalForTemplatePost: the template's own example, drawn offscreen by the Mac
// app's NoteDetailView.

const TEMPLATE = `# Daily journal

A few lines a day, newest day first.

## Questions
1. What happened today?
2. What took energy, and what gave it back?
3. What do I want to remember?
4. What's one thing for tomorrow?

## Sunday 8 November
- Today: quiet day; finished the bookshelf and went for a long walk.
- Energy: low after lunch, better after coffee with Jonas.
- Remember: the bakery on the corner opens at seven.
- Tomorrow: call Mum.

## Saturday 7 November
- Today: helped Maja move; it went faster than we feared.
- Energy: the stairs took it, the pizza after gave it back.
- Remember: Maja said the new flat gets the evening sun.
- Tomorrow: reply to the landlord before noon.
`;

const PROMPTS = `Who did I talk to today?
What surprised me?
What would I do differently?
What am I looking forward to?
What did I put off, and why?
`;

const FAQ = [
  { q: "Does Apple Notes have a journal template?", a: [
    "No. Apple Notes has no templates. One note with a few questions at the top and a heading for each day works as a journal, and you can paste the template on this page straight in.",
  ] },
  { q: "Should I use one note per day or one note for the whole journal?", a: [
    "One note is easier to keep up: it's always in the same place, and the last few days are right under the questions. When it gets long, start a new note for the next month.",
  ] },
  { q: "Can I lock my journal in Apple Notes?", a: [
    "Yes. Apple Notes can lock a note, and a locked note opens with a password or Face ID. Lock the journal note itself, and every day in it is locked with it.",
  ] },
  { q: "How do I find an old journal entry?", a: [
    "Search reads every word in every note, so search for a name, a place or a word you remember writing. A tag like #trip on the days that matter lets a Smart Folder gather those notes.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-journal-template"
      intro={<>
        Most journals stop at the empty page. A few fixed questions get you past it, and Apple Notes is already on your phone at the end
        of the day. Here&apos;s a journal template for Apple Notes to paste in, how to keep it going, how to find old days, and where it
        stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#every-day", label: "Every day" },
          { href: "#prompts", label: "When you're stuck" },
          { href: "#old-entries", label: "Finding old days" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A journal that asks" },
        ]}>
          <p>
            Apple Notes has no journal template, but one note does the job: four short questions at the top, then a heading for each day
            with the newest day first. Answer the questions in a line each, and the last few days are always right there when you open it.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-journal-template" position="answer" template="daily-journal" title="Want the entry written for you?">
            <p>Pinto Notes works like Apple Notes and has a free daily journal. Tell ChatGPT or Claude about your day and it writes the entry in your words, newest day first.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-journal-note" width={1520} height={1093} maxWidth={600}
        alt="A Daily journal note in Pinto Notes on a Mac: four numbered questions, then entries for Sunday 8 November and Saturday 7 November, newest first, each with Today, Energy, Remember and Tomorrow lines."
        caption="A daily journal in Pinto Notes, newest day first. The same layout works in Apple Notes." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note, newest day first</h2>
      <p>
        The questions sit at the top so you never face a blank page. Each day gets a heading with the weekday and date, and the answers go
        under it as one short line each. The newest day goes straight under the questions, so you read today and yesterday without
        scrolling. Two example days are filled in; replace them with yours.
      </p>
      <Keep title="Daily journal for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title and each ## line into a heading. A plain
        Command-V keeps the symbols as text. On iPhone, type the questions in once, then add each day by hand.
      </p>
      <p>
        If you plan your day in the morning as well, the Daily plan in <a href="/blog/apple-notes-templates">Apple Notes templates</a>{" "}
        is the other half: three things for today, and what to do if there&apos;s time. Keep it in its own note, so the journal stays a
        record of what happened.
      </p>

      <h2 id="every-day">Every day</h2>
      <ul>
        <li>
          <strong>Pin the note.</strong> Pinned at the top of its folder, it&apos;s the first thing you see when you open Notes in bed.
        </li>
        <li>
          <strong>Add the day at the top.</strong> Click at the end of the last question, press Return, and type the new heading. The day
          before slides down under it.
        </li>
        <li>
          <strong>A line is enough.</strong> Skip a question when there&apos;s nothing to say. A journal you keep for a year with two lines a
          day beats one you keep for a week with two pages.
        </li>
        <li>
          <strong>Write it in your own words.</strong> &ldquo;The stairs took it, the pizza after gave it back&rdquo; will mean more in a
          year than &ldquo;tired&rdquo;.
        </li>
        <li>
          <strong>Start a new note each month.</strong> When the note gets long, choose File, Duplicate Note, name the copy after the new
          month and delete the old days from it. The questions come with it.
        </li>
      </ul>
      <MenuPaths rows={[{ on: "Mac", steps: ["File", "Duplicate Note"] }]} />

      <h2 id="prompts">When the four questions don&apos;t fit</h2>
      <p>
        The four questions cover most days. On the days they don&apos;t, swap one for a question from this list, or keep the list at the
        bottom of the note to pick from.
      </p>
      <Keep title="Spare journal questions" text={PROMPTS} />
      <p>
        If you want to track how you feel in numbers as well as words, the{" "}
        <a href="/blog/apple-notes-mood-tracker">Apple Notes mood tracker</a> is a table with a row for each evening. For habits you tick
        off, there&apos;s the <a href="/blog/apple-notes-habit-tracker">Apple Notes habit tracker</a>.
      </p>

      <h2 id="old-entries">Finding old days</h2>
      <ul>
        <li>
          <strong>Search for a word.</strong> Notes search reads every word in every note, so &ldquo;bakery&rdquo; or a friend&apos;s name finds
          the day you wrote it.
        </li>
        <li>
          <strong>Tag the days that matter.</strong> Type #trip or #family on the line and it becomes a tag. A Smart Folder with a Tags
          rule then gathers every note that has it. <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> covers how
          they work and what to check when they don&apos;t.
        </li>
      </ul>
      <p>
        A journal is private. You can lock the note with a password or Face ID, so it doesn&apos;t open for whoever picks up your phone.
      </p>

      <h2 id="limits">Where a journal in Notes stops</h2>
      <ul>
        <li><strong>The blank line is still yours to fill.</strong> The questions help, but on a tired evening nothing asks them for you.</li>
        <li><strong>Every day is typed.</strong> If you&apos;d rather talk through your day, it has to be written up afterwards.</li>
        <li><strong>Search finds words, not themes.</strong> It finds &ldquo;landlord&rdquo;. It can&apos;t tell you what&apos;s been on your mind for the last three weeks.</li>
      </ul>
      <p>
        For many people, one note and four questions is the whole journal, and it&apos;s enough. The part it can&apos;t do is look back for you.
      </p>

      <h2 id="pinto-notes">A journal that asks the questions</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/daily-journal">daily journal</a> template is one note with the same four questions and
        your entries under them, newest day first.
      </p>
      <p>
        Say you want to journal and your AI asks the questions one at a time, and skips any you pass on. Or tell it about your day in one
        go, like &ldquo;today was long: Maja&apos;s move is done, her boxes aren&apos;t, and I&apos;m on the sofa&rdquo;, and it writes the entry
        without asking. Each day gets a heading with the weekday and date, and short lines in your own words for Today, Energy, Remember
        and Tomorrow. It doesn&apos;t add advice unless you ask. Later, ask &ldquo;what&apos;s been on my mind this week?&rdquo; and it answers
        from your entries. You can still write and edit every day yourself, and every earlier version of the note is kept. This works
        once ChatGPT or Claude is connected; <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        A journal you already keep in Apple Notes comes over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
