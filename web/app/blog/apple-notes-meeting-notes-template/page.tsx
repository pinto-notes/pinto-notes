import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-meeting-notes-template", { title: "Apple Notes meeting notes template, with action items" });

// Written 21 November 2026 for "apple notes meeting notes template" (Google autocomplete 20 Nov: apple notes meeting
// notes template, apple notes meeting minutes template, apple notes template for meetings; topic-research-2026-11-20.md
// row 3). The result page: ClickUp, Notelyn, an Apple Community thread, template.net and App Store meeting apps; no
// Notes template to paste. Apple Notes facts, all from earlier posts tried on macOS 27: Edit, Paste as Markdown turns
// #, ## and "- [ ]" lines into a title, headings and checklists, and an empty item doesn't survive (apple-notes-templates);
// File, Duplicate Note (apple-notes-meal-planner-template); Type # and a word to tag a note, and a Smart Folder rule can
// filter by Folders and by Checklists, Unchecked (apple-notes-tags-smart-folders); with Apple Intelligence a recording
// turns into a transcript and a summary (best-ai-notes-app); sharing to edit together needs an Apple Account
// (support.apple.com/102462, in apple-notes-meal-planner-template). Pinto side: web/content/templates/meeting-notes.json
// (Action items as "Owner: task (due)" checklist lines at the top, one ### section per meeting with a two-line summary
// and the decisions; the AI writes both from pasted notes or a transcript; the asks "What's still open for me?" and
// "Mark Jonas's design review as done."). The picture is BlogSnapshots.meetingNotesForTemplatePost: the template's own
// example, drawn offscreen by the Mac app's NoteDetailView.

const TEMPLATE = `# Product sync, 24 November

People: Sara, Jonas, Emma

## Agenda
- Pricing page
- Checkout design

## Notes
- Sales asked for the new prices before December
- Two of three testers missed the total in checkout

## Decisions
- Three plans stay, no lifetime deal
- The total moves above the card details

## Action items
- [ ] Sara: send the new pricing to sales (Fri)
- [ ] Jonas: move the total in checkout (Wed)
- [ ] Emma: check VAT rules for Norway (next week)
`;

const FAQ = [
  { q: "Does Apple Notes have a meeting notes template?", a: [
    "No. Apple Notes has no templates. One note per meeting, with headings for the agenda, notes, decisions and action items, works as one, and you can paste the template on this page straight in.",
  ] },
  { q: "How do I keep track of action items from meetings in Apple Notes?", a: [
    "Write them as a checklist with the person's name first. Then make a Smart Folder with two rules, your Meetings folder and Checklists: Unchecked, and every meeting with something still open shows up in one place.",
  ] },
  { q: "Can Apple Notes record and summarize a meeting?", a: [
    "With Apple Intelligence, a recording in Notes turns into a transcript and a summary. It doesn't pull out who does what by when; you still write the action items yourself.",
  ] },
  { q: "Is there a meeting notes app that writes the action items for me?", a: [
    "Pinto Notes has a free meeting notes template. Paste your rough notes or a transcript into ChatGPT or Claude, and it writes the summary, the decisions and each action item with its owner and date.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-meeting-notes-template"
      intro={<>
        Meeting notes are only useful for the part most people skip: what was decided, and who does what next. Here&apos;s a meeting notes
        template for Apple Notes to paste in, a way to see every open action item in one place, and where Notes stops being enough.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#action-items", label: "Open action items" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Notes that write themselves up" },
        ]}>
          <p>
            Apple Notes has no meeting notes template, but one note per meeting does the job: who was there, the agenda, your notes, the
            decisions, and the action items as a checklist with a name on each. Keep them in a Meetings folder, and a Smart Folder shows
            every item that&apos;s still open.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-meeting-notes-template" position="answer" title="Want the action items written for you?">
            <p>Pinto Notes works like Apple Notes and has a free meeting notes template. Paste your rough notes into ChatGPT or Claude and it writes the summary, the decisions and who does what.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/launch/meeting-notes-note" width={1520} height={1110} maxWidth={620}
        alt="A Meeting notes note in Pinto Notes on a Mac: action items with an owner and a date on each, one ticked, then a Pricing sync section with a two-line summary and the decisions."
        caption="Meeting notes in Pinto Notes: open action items on top, each meeting below. Example data." />}
      faq={FAQ}
    >
      <h2 id="template">The template: one note per meeting</h2>
      <p>
        The decisions and the action items are the parts you&apos;ll come back for, so they get their own headings. Put a name and a day on
        every action item; &ldquo;look into VAT&rdquo; with no owner is how nothing happens. Keep a word in every line, because an empty
        checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="Meeting notes for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />

      <h2 id="set-up">Set it up</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Paste as Markdown"] },
        { on: "Mac", steps: ["File", "Duplicate Note"] },
      ]} />
      <ul>
        <li>
          <strong>Paste it once.</strong> On a Mac with macOS 27, make a note and choose Edit, Paste as Markdown. The # line becomes the
          title, each ## line a heading and the action items a checklist. On iPhone, type the headings and tap the checklist button for
          the action items.
        </li>
        <li>
          <strong>Keep a blank copy.</strong> Clear out the example lines and keep that note in a Meetings folder. Before each meeting,
          choose File, Duplicate Note and change the title.
        </li>
        <li>
          <strong>Tag the regular ones.</strong> Type #sync in a meeting&apos;s note and every week&apos;s sync is one tap away in the
          sidebar.
        </li>
        <li>
          <strong>Record it if you can&apos;t type.</strong> With Apple Intelligence, a recording in Notes turns into a transcript and a
          summary. Copy the decisions and action items out of it into the template.
        </li>
      </ul>

      <h2 id="action-items">See every open action item</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["File", "New Smart Folder"] }]} />
      <p>
        Action items scattered over twenty meeting notes are action items nobody does. On a Mac, choose File, New Smart Folder, call it
        Open actions, and give it two rules that must both match: Folders set to your Meetings folder, and Checklists set to Unchecked.
        Every meeting with something still open is in that folder, and a meeting drops out once its last item is ticked.
      </p>
      <p>
        If the people in the meeting use Apple Notes too, share the note and let them make changes, so each person ticks their own items.
        Everyone needs an Apple Account. For the end of the week, the <a href="/blog/apple-notes-templates">Apple Notes templates</a> post
        has a weekly review to paste in, and <a href="/blog/apple-notes-tags-smart-folders">tags and Smart Folders</a> goes through every
        rule a Smart Folder can use.
      </p>

      <h2 id="limits">Where meeting notes in Notes stop</h2>
      <ul>
        <li><strong>Writing it up is on you.</strong> Rough notes or a transcript don&apos;t turn themselves into decisions and owners.</li>
        <li><strong>No list by person.</strong> A Smart Folder shows meetings with open items, not &ldquo;everything Sara owes&rdquo;.</li>
        <li><strong>No answers across meetings.</strong> &ldquo;What did we decide about pricing last month?&rdquo; means opening notes until you find it.</li>
      </ul>
      <p>
        For a couple of meetings a week, the template and a Smart Folder are enough. With more, the write-up is the job nobody has time for.
      </p>

      <h2 id="pinto-notes">Meeting notes that write themselves up</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/meeting-notes">meeting notes</a> template is one note for all your meetings: the open
        action items at the top, and a short section per meeting below, newest first.
      </p>
      <p>
        After a meeting, paste your rough notes or a transcript into your AI. It writes a two-line summary and the decisions, and adds each
        action item as &ldquo;Sara: send the new pricing to sales (Fri)&rdquo;. If something is unclear, it asks before writing it. Then
        ask &ldquo;what&apos;s still open for me?&rdquo;, or tell it Jonas&apos;s review is done and it ticks the line. You can still type
        and tick everything yourself, and every earlier version of the note is kept.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute, and your Apple Notes come over
        in <a href="/blog/move-from-apple-notes">one import on your Mac</a>.
      </p>
    </PostPage>
  );
}
