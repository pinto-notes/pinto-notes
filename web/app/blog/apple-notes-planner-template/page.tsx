import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-planner-template", { title: "Apple Notes planner template: plan your week in one note" });

// Written 21 November 2026 for "apple notes planner template" (Google autocomplete en-US, 21 Nov: apple notes planner
// template, apple notes daily planner template, apple notes weekly planner template, apple notes day planner, iphone notes
// daily planner, how to use apple notes as a planner, apple notes to do list template, iphone notes to do list template).
// No Pinto template covered it, so the weekly-planner template was made with this post. Apple Notes facts, all from
// earlier posts tried in Notes on macOS 27: Edit, Paste as Markdown turns #, ## and "- [ ]" lines into a title,
// headings and checklists, and an empty item doesn't survive (apple-notes-templates); File, Duplicate Note
// (apple-notes-meal-planner-template); Format, More, Uncheck All (apple-notes-meal-planner-template, from Apple's "Add
// lists in Notes on Mac"); Automatically sort checked items (apple-notes-grocery-list-template); a Smart Folder rule
// Checklists: Unchecked (apple-notes-tags-smart-folders, apple-notes-meeting-notes-template); pinning a note to the top
// of its folder (apple-notes-recipe-template); Edit, Add Link, Command-K (apple-notes-ios-27). Pinto side:
// web/content/templates/weekly-planner.json (a Weekly planner note with Top three this week, a heading per day from
// Monday to Sunday and Later; the AI plans the week from one message, puts each task under its day, keeps the top
// three, moves unticked items from past days to today when asked, and on Sunday clears the ticked items, moves what's
// left to Monday and asks for next week's top three). The picture is BlogSnapshots.weeklyPlannerForTemplatePost: the
// template's own example week as a note, drawn offscreen by the Mac app's NoteDetailView.

const WEEKLY = `# Week of 16 November

## Top three this week
- [ ] Send the Q4 budget to Jonas
- [ ] Book flights home for Christmas
- [ ] Run three times

## Monday
- [ ] Team meeting at 9:00
- [ ] Finish the budget draft

## Tuesday
- [ ] Dentist at 8:30
- [ ] Run 5 km

## Wednesday
- [ ] Call Mum
- [ ] Return the parcel

## Thursday
- [ ] Book the car service
- [ ] Dinner with Sara at 19:00

## Friday
- [ ] Pick up the dry cleaning

## Saturday
- [ ] Farmers' market

## Sunday
- [ ] Plan next week

## Later
- [ ] Renew my passport
- [ ] Fix the bike light
`;

const DAILY = `# Today

## Top three
- [ ] Finish the budget draft
- [ ] Call Mum
- [ ] Run 5 km

## Morning
- [ ] Team meeting at 9:00
- [ ] Answer the email from Jonas

## Afternoon
- [ ] Review Emma's slides
- [ ] Pick up the dry cleaning

## Evening
- [ ] Dinner with Sara at 19:00

## Tomorrow
- [ ] Anything that didn't get done
`;

const FAQ = [
  { q: "Does Apple Notes have a planner template?", a: [
    "No. Apple Notes has no templates. One note per week with a heading for each day and that day's to-dos as a checklist works as a planner, and you can paste the template on this page straight in.",
  ] },
  { q: "How do I use Apple Notes as a planner?", a: [
    "Keep one note per week in a Planner folder and pin this week's note to the top. Put your top three first, each task under its day, and anything without a day under Later. On Sunday, duplicate the note for next week and move what's left.",
  ] },
  { q: "Can I make a daily planner in Notes on iPhone?", a: [
    "Yes. Type the headings and tasks, select the tasks and tap the checklist button. Paste as Markdown is on the Mac, so the quickest way is to paste the template on a Mac and let the note sync to your iPhone.",
  ] },
  { q: "Is there a planner app that works like Apple Notes?", a: [
    "Pinto Notes looks and works like Apple Notes and has a free weekly planner template. Tell ChatGPT or Claude what's on this week and it puts each task under its day and keeps your top three.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-planner-template"
      intro={<>
        A lot of people plan their week in Apple Notes: a list per day, a few things that matter most, and a pile of things for
        some other time. It works well once every week looks the same. Here&apos;s a weekly planner template for Apple Notes to paste in, a
        daily version, how to run a week with it, and where it stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#weekly", label: "The weekly planner" },
          { href: "#daily", label: "A daily planner" },
          { href: "#how-to", label: "Using Notes as a planner" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "A week planned for you" },
        ]}>
          <p>
            Apple Notes has no planner template, but one note per week does the job: your top three at the top, a heading for each day
            with that day&apos;s to-dos as a checklist, and a Later list for the rest. Paste the weekly template below into a new note,
            or the daily one if you plan a day at a time.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-planner-template" position="answer" title="Want the week planned for you?">
            <p>Pinto Notes works like Apple Notes and has a free weekly planner. Tell ChatGPT or Claude what&apos;s on and it puts each task under its day and keeps your top three.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600}
        alt="A Weekly planner note in Pinto Notes on a Mac: a Top three this week checklist with one ticked, a heading for each day from Monday to Sunday with that day's to-dos as a checklist, the days up to Friday ticked off, and a Later list."
        caption="A week in Pinto Notes, planned with the weekly planner template. The same layout works in Apple Notes. Example data." />}
      faq={FAQ}
    >
      <h2 id="weekly">The weekly planner template</h2>
      <p>
        One note holds the whole week. The top three go first, so they&apos;re the first thing you see when you open it. Each day gets a
        heading and its own checklist, and Later holds what has no day yet, so it stops crowding Monday. Swap in your own tasks before you
        paste, and keep a word in every line, because an empty checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="Weekly planner for Apple Notes" text={WEEKLY}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, each ## line into a heading and the tasks into a
        checklist. A plain Command-V keeps the symbols as text. On iPhone, type it in, select the tasks and tap the checklist button.
      </p>

      <h2 id="daily">A daily planner version</h2>
      <p>
        If you plan one day at a time, keep a single note called Today and pin it to the top of its folder. The top three come first again,
        then the day in three parts, and a Tomorrow list for what didn&apos;t get done.
      </p>
      <Keep title="Daily planner for Apple Notes" text={DAILY} />
      <p>
        Each morning, delete what you ticked yesterday, move the Tomorrow lines up into the day, and pick a new top three. If some lines
        repeat every day, like a run or the inbox, click in the checklist and choose Format, More, Uncheck All instead of typing them again.
      </p>

      <h2 id="how-to">How to use Apple Notes as a planner</h2>
      <ul>
        <li>
          <strong>One note per week.</strong> Keep them in a Planner folder and pin this week&apos;s note to the top, so it&apos;s one tap away
          on your iPhone.
        </li>
        <li>
          <strong>Start next week from this one.</strong> On Sunday, choose File, Duplicate Note, change the date in the title, delete
          what&apos;s ticked and move what&apos;s left under Monday.
        </li>
        <li>
          <strong>Let done things sink.</strong> Turn on Automatically sort checked items, and ticked tasks move to the bottom of each day.
        </li>
        <li>
          <strong>Find what&apos;s still open.</strong> A Smart Folder with the rule Checklists: Unchecked shows every note that still has
          an open to-do, across all your folders (more in <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a>).
        </li>
        <li>
          <strong>Link the bigger things.</strong> Select a task, choose Edit, Add Link (Command-K) and pick the note it belongs to, like
          the meeting notes for Monday&apos;s meeting.
        </li>
      </ul>
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "Duplicate Note"] },
        { on: "Mac", steps: ["Edit", "Add Link"], keys: "⌘K" },
      ]} />
      <p>
        The same one-note-a-week layout works for other routines. The <a href="/blog/apple-notes-habit-tracker">Apple Notes habit
        tracker</a> ticks habits day by day, the <a href="/blog/apple-notes-meal-planner-template">meal planner</a> plans the
        week&apos;s dinners, and <a href="/blog/apple-notes-templates">Apple Notes templates</a> has more notes to paste in.
      </p>

      <h2 id="limits">Where a planner in Notes stops</h2>
      <ul>
        <li><strong>Nothing moves by itself.</strong> A task you didn&apos;t get to on Wednesday stays on Wednesday until you cut it and paste it under today.</li>
        <li><strong>A new week is by hand.</strong> Duplicate the note, change the date, delete what&apos;s done and move the rest. Skip it once and the week runs on in last week&apos;s note.</li>
        <li><strong>The planning is yours.</strong> A list of twenty things doesn&apos;t sort itself into days, and the top three doesn&apos;t pick itself.</li>
        <li><strong>Search finds words, not answers.</strong> It finds the dentist. It can&apos;t tell you what&apos;s left this week or what keeps getting moved.</li>
      </ul>
      <p>
        For a short week, a note and a few minutes on Sunday is all you need. For a full one, the moving and sorting is the work, and
        it&apos;s left to you.
      </p>

      <h2 id="pinto-notes">A week planned for you</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/weekly-planner">weekly planner</a> template is one note with Top three this week, a
        heading for each day from Monday to Sunday, and Later.
      </p>
      <p>
        Tell your AI what&apos;s on this week, all in one message. It puts each task under its day as a checklist, files what has no day
        under Later, and keeps the top three to the three things you say matter most. Ask it to &ldquo;move what I didn&apos;t finish to
        today&rdquo; and the unticked tasks from earlier days come along. On Sunday, say it&apos;s a new week: it clears what&apos;s ticked,
        moves what&apos;s left to Monday and asks for next week&apos;s top three. You can still type and tick everything yourself, and every
        earlier version of a note is kept. The AI part works once ChatGPT or Claude is connected, and{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The plans you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
