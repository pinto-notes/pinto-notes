import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-1-on-1-template", { title: "1 on 1 meeting notes template for Apple Notes" });

// Written 21 November 2026 for "1 on 1 meeting notes template" (Google autocomplete 20 Nov: 1 on 1 meeting notes
// template, 1 1 meeting note template, 1 on 1 meeting agenda template, 1 1 meeting minutes template;
// topic-research-2026-11-20.md row 20). The result page is template sites (Fellow, Lattice, Asana style); none gives a
// note to paste into Apple Notes. Apple Notes facts, all from earlier posts tried on macOS 27: Apple Notes has no
// templates, and Edit, Paste as Markdown turns #, ## and "- [ ]" lines into a title, headings and checklists, and an
// empty item doesn't survive (apple-notes-templates); File, Duplicate Note (apple-notes-meal-planner-template); a Smart
// Folder rule can filter by Folders and by Checklists, Unchecked (apple-notes-tags-smart-folders); "Automatically sort
// checked items" in the Notes settings, and a locked note can't be shared to edit, sharing needs an Apple Account for
// each person (apple-notes-grocery-list-template, from support.apple.com/102462); pinning a note and search reading every
// word (apple-notes-recipe-template). Pinto side: web/content/templates/one-on-one-notes.json (one running note per
// person with Next time, Follow-ups and Past 1:1s newest first; the AI asks who the 1:1 is with, adds topics under Next
// time during the week, and after the 1:1 writes a section with the name and date, what you talked about and how they
// seemed, adds promises as checklist lines and removes the topics covered; the asks "What did I promise last time?" and
// "Emma and I just had our 1:1. She wants to lead the next launch and asked for a mentor."). The picture is
// BlogSnapshots.oneOnOneNotesForTemplatePost: the template's own example, drawn offscreen by the Mac app's NoteDetailView.

const TEMPLATE = `# 1:1 with Emma

Every other Thursday. Add topics during the week.

## Next time
- Feedback on the design review
- The conference budget
- Emma's goals for next quarter

## Follow-ups
- [ ] Me: find Emma a mentor from the platform team
- [ ] Me: ask about a quieter rotation
- [ ] Emma: draft the launch plan by 20 Nov

## Past 1:1s
5 November
- On-call was rough: two pages at night. She wants a quieter rotation.
- Wants to lead the spring launch. Seemed tired but positive.
`;

const QUESTIONS = `Standing questions
- What's on your mind this week?
- What's in your way?
- Anything you need from me?
- Feedback, both ways
- How are your goals going?
`;

const FAQ = [
  { q: "Does Apple Notes have a 1 on 1 meeting template?", a: [
    "No. Apple Notes has no templates. One running note per person, with headings for the next agenda, the follow-ups and past 1:1s, works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "What should be on a 1 on 1 meeting agenda?", a: [
    "Their topics first, then yours, then the follow-ups from last time. Add one or two standing questions, such as what's in their way and whether they need anything from you. Write topics down during the week, when they come up.",
  ] },
  { q: "Should I keep one note per 1:1 or one note per person?", a: [
    "One per person. The agenda, the open follow-ups and every past 1:1 stay together, newest first, so you read last time's notes before the next one without hunting for them.",
  ] },
  { q: "Is there an app that writes up my 1:1 notes?", a: [
    "Pinto Notes has a free 1:1 notes template. Tell ChatGPT or Claude how the 1:1 went and it writes the section, adds what each of you promised as a checklist, and clears the topics you covered.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-1-on-1-template"
      intro={<>
        A good 1:1 is built during the two weeks before it, when the topics come up. Here&apos;s a 1 on 1 meeting notes template for Apple
        Notes to paste in: one running note per person, with the next agenda, the follow-ups and every past 1:1. Then how to keep it up,
        and where Notes stops.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#agenda", label: "The agenda" },
          { href: "#week", label: "Between 1:1s" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "1:1s that write themselves up" },
        ]}>
          <p>
            Apple Notes has no 1:1 template, but one note per person does the job: a Next time list you add to during the week, the
            follow-ups as a checklist with a name on each, and past 1:1s below, newest first. Read the top of it before each meeting and
            write the new section straight after.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-1-on-1-template" position="answer" template="one-on-one-notes" title="Want your 1:1s written up for you?">
            <p>Pinto Notes works like Apple Notes and has a free 1:1 notes template. Tell ChatGPT or Claude how it went and it writes it up, adds the follow-ups and clears what you covered.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/one-on-one-notes-note" width={1520} height={1062} maxWidth={600}
        alt="A 1:1 notes note in Pinto Notes on a Mac: 1:1s with Emma every other Thursday, three topics under Next time, four follow-ups with one ticked, and the 5 November 1:1 under Past 1:1s."
        caption="A running 1:1 note in Pinto Notes: what to bring up, what each of you promised, and past 1:1s newest first. The same layout works in Apple Notes." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one running note per person</h2>
      <p>
        A note per meeting scatters the follow-ups. A note per person keeps the whole story in one place: what you want to raise, what
        you each said you&apos;d do, and how the last few 1:1s went. Put a name on every follow-up, &ldquo;Me&rdquo; included, so it&apos;s
        clear who owes what. Keep a word in every line, because an empty checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="1:1 notes for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Paste as Markdown"] },
        { on: "Mac", steps: ["File", "Duplicate Note"] },
      ]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, each ## line into a heading and the follow-ups
        into a checklist. A plain Command-V keeps the symbols as text. On iPhone, type it in, select the follow-ups and tap the checklist
        button. For the next person, clear the example lines, keep that blank copy in a 1:1s folder, and choose File, Duplicate Note.
      </p>

      <h2 id="agenda">The agenda: Next time</h2>
      <p>
        Next time is the agenda, written over two weeks instead of two minutes before the call. Their topics go first; it&apos;s their
        meeting more than yours. A few standing questions under it catch what neither of you thought to write down.
      </p>
      <Keep title="Standing questions" text={QUESTIONS} />
      <p>
        If you both want to add to the agenda, share a note that holds only Next time and let them make changes. Each of you needs an
        Apple Account. Keep the rest, how they seemed included, in your own note.
      </p>

      <h2 id="week">Between 1:1s</h2>
      <ul>
        <li>
          <strong>Pin it.</strong> Pin the note to the top of its folder, so adding a topic on your phone takes a few seconds.
        </li>
        <li>
          <strong>Write it up straight after.</strong> Add the date as a line at the top of Past 1:1s, two or three bullets on what you
          talked about and how they seemed, and move any promises into Follow-ups. Delete the topics you covered.
        </li>
        <li>
          <strong>Let ticked follow-ups drop.</strong> Turn on Automatically sort checked items in the Notes settings, and what&apos;s done
          moves to the bottom of the list.
        </li>
        <li>
          <strong>See every open promise.</strong> Make a Smart Folder with two rules, Folders set to your 1:1s folder and Checklists set
          to Unchecked. Every person you still owe something to is in it.
        </li>
        <li>
          <strong>Lock it if it&apos;s private.</strong> How someone seemed is for you. A locked note opens with your password, Face ID or Touch ID,
          though it can&apos;t be shared to edit.
        </li>
      </ul>
      <p>
        Search reads every word in every note, so searching &ldquo;rotation&rdquo; finds each time it came up.{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders</a> goes through every rule a Smart Folder can use. For
        team meetings, the <a href="/blog/apple-notes-meeting-notes-template">meeting notes template</a> puts action items with owners
        on top, and <a href="/blog/apple-notes-templates">Apple Notes templates</a> has more notes to paste in.
      </p>

      <h2 id="limits">Where 1:1 notes in Notes stop</h2>
      <ul>
        <li><strong>The write-up is on you.</strong> Straight after a 1:1 is when the next meeting starts, and the notes wait until you&apos;ve forgotten half of it.</li>
        <li><strong>Cleaning up is by hand.</strong> Moving promises into Follow-ups and deleting covered topics is easy to skip, and the agenda fills with old items.</li>
        <li><strong>No patterns.</strong> On-call coming up in three 1:1s in a row is in the note, but nothing points it out.</li>
        <li><strong>Search finds words, not answers.</strong> &ldquo;What did I promise Emma last time?&rdquo; means reading the follow-ups yourself.</li>
      </ul>
      <p>
        For one or two people, the template is enough. With a team of six, the write-ups are the part that slips.
      </p>

      <h2 id="pinto-notes">1:1 notes that write themselves up</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/one-on-one-notes">1:1 notes</a> template is one running note per person with Next time,
        Follow-ups and Past 1:1s, newest first.
      </p>
      <p>
        The first time, your AI asks who the 1:1 is with and writes their name in. During the week, mention something to bring up and it
        goes under Next time. After the 1:1, tell it how it went, such as &ldquo;Emma and I just had our 1:1. She wants to lead the next
        launch and asked for a mentor.&rdquo; It adds a section at the top of Past 1:1s with her name and the date, what you talked about
        and how she seemed, adds what each of you promised as checklist lines under Follow-ups, and removes the topics you covered. Ask
        &ldquo;what did I promise last time?&rdquo; before the next one. You can still write and tick everything yourself, and every
        earlier version of the note is kept. The AI part works once ChatGPT or Claude is connected;{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The 1:1 notes you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
