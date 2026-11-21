import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-daily-standup-template", { title: "Daily standup notes template for Apple Notes" });

// Written 21 November 2026 for "daily standup notes template" (Google autocomplete 20 Nov: daily standup notes
// template, daily scrum notes template, daily stand up meeting minutes template; topic-research-2026-11-20.md row 26).
// The result page is agile vendor pages; none gives a note to paste into Apple Notes. Apple Notes facts, all from
// earlier posts tried on macOS 27: Apple Notes has no templates, and Edit, Paste as Markdown turns #, ## and "- [ ]"
// lines into a title, headings and checklists, and an empty item doesn't survive (apple-notes-templates); pinning a
// note and search reading every word (apple-notes-recipe-template); "Automatically sort checked items" in the Notes
// settings (apple-notes-grocery-list-template); with Apple Intelligence a recording in Notes turns into a transcript
// and a summary (best-ai-notes-app, used in apple-notes-meeting-notes-template). Pinto side:
// web/content/templates/daily-standup.json (Blockers on top, then Days with one ### section per working day, newest
// first, Yesterday and Today as short bullets; the AI writes the day from what you tell it and removes a blocker when
// you say it's unblocked; the claudeCode prompt runs git log --since=yesterday for your own commits, turns them into two
// to five plain bullets with no hashes and asks what's next and what's blocking; the asks "What was I blocked on last
// week?" and "Summarize my standups since Monday for the sprint review."). The picture is
// BlogSnapshots.dailyStandupForTemplatePost: the template's own example, drawn offscreen by the Mac app's NoteDetailView.

const TEMPLATE = `# Standup notes

## Blockers
- Waiting on API keys for the staging payment provider

## Friday 6 November
Yesterday
- Fixed the sync conflict when two devices edit the same note
- Added tests for the importer's table handling

Today
- [ ] Review the onboarding pull request
- [ ] Start on the export to PDF

## Thursday 5 November
Yesterday
- Paired with Emma on the importer

Today
- [x] Fix the sync conflict
- [x] Write the importer's table tests
`;

const TEAM = `# Team standup, week of 2 November

## Blockers
- [ ] Sara: waiting on API keys for the staging payment provider

## Friday 6 November
- Sara: fixed the sync conflict. Today the onboarding review.
- Jonas: checkout total moved. Today the VAT check.
- Emma: importer tests done. Today the export to PDF.
`;

const FAQ = [
  { q: "What should a daily standup note include?", a: [
    "Three things: what you did yesterday, what you'll do today, and what's blocking you. A few short bullets each. Keep blockers at the top of the note, because they're the part someone else can act on.",
  ] },
  { q: "Does Apple Notes have a standup template?", a: [
    "No. Apple Notes has no templates. One running note with a heading per day, newest first, works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "How do I take daily scrum meeting minutes?", a: [
    "One note per sprint or per week, a heading per day, and one line per person with what they did and what's next. Write blockers as a checklist with the person's name first, and tick each one when it clears.",
  ] },
  { q: "Can Claude Code write my standup from my commits?", a: [
    "With Pinto Notes connected, yes. The daily standup template has its own Claude Code instructions: it reads your commits since yesterday, turns them into a few plain bullets, asks what's next, and writes the day into your note.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-daily-standup-template"
      intro={<>
        Most standups start with someone trying to remember yesterday. A note you write as you go fixes that. Here&apos;s a daily standup
        notes template for Apple Notes to paste in, a version for a whole team, and where Notes stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#each-day", label: "Each day" },
          { href: "#team", label: "For a team" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A standup from your commits" },
        ]}>
          <p>
            Apple Notes has no standup template, but one running note does the job: blockers at the top, then a heading per working day,
            newest first, with Yesterday and Today under each. Write Today as a checklist, and the ticked lines are tomorrow&apos;s Yesterday.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-daily-standup-template" position="answer" template="daily-standup" title="Want yesterday written for you?">
            <p>Pinto Notes works like Apple Notes and has a free standup template. Tell ChatGPT or Claude what you did, or let Claude Code draft yesterday from your commits.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/daily-standup-note" width={1520} height={1207} maxWidth={600}
        alt="A Standup notes note in Pinto Notes on a Mac: one blocker waiting on staging API keys, then Friday 6 November and Thursday 5 November, each with Yesterday and Today bullets."
        caption="Standup notes in Pinto Notes: blockers on top, one section a day, newest first. The same layout works in Apple Notes." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note, a heading a day</h2>
      <p>
        One note for every standup keeps the trail: what you said you&apos;d do on Tuesday is right under what you did on Wednesday.
        Blockers sit above the days so they&apos;re the first thing you see. Keep a word in every line, because an empty checklist item
        doesn&apos;t survive the paste.
      </p>
      <Keep title="Standup notes for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, each ## line into a heading and the Today lines
        into a checklist. A plain Command-V keeps the symbols as text. On iPhone, type it in, select the Today lines and tap the
        checklist button.
      </p>

      <h2 id="each-day">Each day</h2>
      <ul>
        <li>
          <strong>Pin it.</strong> Pin the note to the top of its folder, so it&apos;s the first thing you open in the morning.
        </li>
        <li>
          <strong>Start from yesterday&apos;s ticks.</strong> Add today&apos;s heading under Blockers. What you ticked under yesterday&apos;s
          Today becomes your Yesterday, and what&apos;s left unticked carries over.
        </li>
        <li>
          <strong>Write Today the evening before.</strong> Two or three lines while you still know where you stopped saves the morning.
        </li>
        <li>
          <strong>Clear blockers out.</strong> When something is unblocked, delete its line. A list of old blockers stops being read.
        </li>
        <li>
          <strong>Search the past.</strong> Search reads every word in every note, so searching &ldquo;importer&rdquo; finds every day you
          worked on it.
        </li>
      </ul>
      <p>
        Keep the bullets short and in plain words. The standup is for people who don&apos;t know the code by its branch names.
      </p>

      <h2 id="team">For a team: one line per person</h2>
      <p>
        If you&apos;re the one taking the minutes for the daily scrum, a line per person is enough: what they did and what&apos;s next.
        Blockers get a name first, so everyone can see who&apos;s stuck on what.
      </p>
      <Keep title="Team standup for Apple Notes" text={TEAM}
        note="Start a new note each week or sprint, so it stays short." />
      <p>
        Turn on Automatically sort checked items in the Notes settings, and cleared blockers drop to the bottom. With Apple Intelligence,
        a recording in Notes turns into a transcript and a summary, which helps if you can&apos;t type while you run the meeting. For
        longer meetings, the <a href="/blog/apple-notes-meeting-notes-template">meeting notes template</a> has decisions and action items
        with owners, and <a href="/blog/apple-notes-templates">Apple Notes templates</a> has a weekly review to paste in.
      </p>

      <h2 id="limits">Where standup notes in Notes stop</h2>
      <ul>
        <li><strong>Yesterday is from memory.</strong> What you did is in your commits and pull requests, and Notes can&apos;t see them.</li>
        <li><strong>The sprint review is by hand.</strong> Summing up two weeks means reading ten days of bullets and writing it again.</li>
        <li><strong>Old blockers are hard to find.</strong> Once you delete a blocker, nothing remembers how long you waited on it.</li>
        <li><strong>The note grows.</strong> A running note gets long, and trimming it is one more job.</li>
      </ul>

      <h2 id="pinto-notes">A standup from your commits</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/daily-standup">daily standup</a> template is one note with Blockers on top and Days
        below, a section per working day, newest first.
      </p>
      <p>
        Each morning, tell your AI what you did and what&apos;s next. It adds a section with the weekday and the date, and Yesterday and
        Today as short bullets. Anything blocked goes under Blockers, and when you say it&apos;s unblocked, it comes out. In Claude Code,
        the template has its own instructions: it runs git log in the repo for your own commits since yesterday, turns them into two to
        five plain bullets without the hashes, asks what&apos;s next and what&apos;s blocking you, then writes the day.{" "}
        <a href="/blog/notes-in-claude-code-and-codex">Notes in Claude Code and Codex</a> has the one command to add it.
      </p>
      <p>
        Later, ask &ldquo;what was I blocked on last week?&rdquo; or &ldquo;summarize my standups since Monday for the sprint
        review&rdquo;. Every earlier version of the note is kept, so a deleted blocker is still there to find. The AI part works once
        ChatGPT or Claude is connected; <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute. The notes
        you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes
        isn&apos;t changed.
      </p>
      <p>
        For work you repeat the same way each time, write it down once as a <a href="/blog/apple-notes-sop-template">standard operating procedure</a>.
      </p>
    </PostPage>
  );
}
