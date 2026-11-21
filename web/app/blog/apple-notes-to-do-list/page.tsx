import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Checklist, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-to-do-list", { title: "Apple Notes to-do list on iPhone and Mac, with a template" });

// Written 21 November 2026 for "apple notes to do list" (Google autocomplete 21 Nov, en-US: apple notes to do list,
// apple notes to do list template, iphone notes to do list, iphone notes to do list sort, iphone notes to do list
// template, ios notes to do list, mac notes to do list, apple notes app to do list, iphone notes app to do list).
// apple-notes-planner-template already answers the to-do template query with a list by day, so this post is the
// to-do list itself: making one, a list by place and time, sorting, and many lists at once. It links the planner.
// Apple Notes facts, read on Apple's pages on 21 Nov 2026:
// - "Create a checklist with Notes" (support.apple.com/102296, published 11 Feb 2025, iPhone): Compose button, title,
//   Return, the Checklist button, each Return adds an item, tap the empty circle to mark it complete; drag to reorder;
//   swipe right to indent, left to undo; Settings > Apps > Notes > Sort Checked Items, Manually or Automatically;
//   share with the Share button, Collaborate.
// - Notes User Guide for Mac, "Add lists in Notes on Mac" (support.apple.com/guide/notes/apd93c815aa0/mac): the Checklist
//   button; select paragraphs and click it, each becomes an item; click a circle to tick; Format > More > Check All or
//   Uncheck All; Command-click any item; "Automatically sort checked items" in Notes settings; click and hold, drag;
//   Control-Command-Up or Down Arrow; Tab and Shift-Tab.
// - "Use Reminders on your iPhone" (support.apple.com/102484, published 9 Oct 2026): the Date and Time button sets a due
//   date, a notification by default at 9:00 AM, a Location button for a notification on arriving or leaving.
// - Earlier posts: Shift-Command-L and Shift-Command-U (apple-notes-checklist-sort, Apple's Mac shortcuts page);
//   Notes, Settings on Mac (apple-notes-checklist-sort); Edit, Paste as Markdown on macOS 27 and an empty item doesn't
//   survive (apple-notes-templates); select lines, tap the checklist button on iPhone (BRIEF list); pin a note: File,
//   Pin Note on Mac, touch and hold, Pin Note on iPhone (apple-notes-for-school, Apple's guides); #word makes a tag and
//   the Smart Folder rule Checklists, Unchecked, File, New Smart Folder (apple-notes-tags-smart-folders,
//   apple-notes-checklist-sort); sharing needs an Apple Account for each person (BRIEF list).
// Not on any Apple page read, so left out: due dates or alerts inside Notes, sorting a checklist by name.
// Pictures: the hero is the Apple Notes Groceries capture on a Mac from best-notes-app-for-mac (as in
// apple-notes-checklist-sort, ticked items at the bottom); the Smart Folder dialog is the macOS 27 capture from
// apple-notes-tags-smart-folders; the Pinto picture is BlogSnapshots.weeklyPlannerForTemplatePost from
// apple-notes-planner-template. Pinto side: ChatGPT or Claude read and edit notes once connected (BRIEF Pinto facts);
// web/content/templates/weekly-planner.json (top three, a checklist per day, Later; moves unticked items to today;
// on Sunday clears ticked items and moves the rest to Monday).

const TEMPLATE = `# To do

## Today
- [ ] Send the Q4 budget to Jonas
- [ ] Call Mum
- [ ] Return the parcel

## This week
- [ ] Book flights home for Christmas
- [ ] Review Emma's slides
- [ ] Book the car service

## Errands
- [ ] Pick up the dry cleaning
- [ ] Buy a bike light

## Waiting on
- [ ] Jonas: sign-off on the budget

## Someday
- [ ] Renew my passport
- [ ] Clear out the garage
`;

const FAQ = [
  { q: "How do I make a to-do list in Apple Notes?", a: [
    "On iPhone, tap the Compose button, type a title and tap Return, then tap the Checklist button. Each Return adds an item, and tapping the circle ticks it. On a Mac, click the Checklist button or press Shift-Command-L.",
  ] },
  { q: "Can I sort a to-do list in Notes on iPhone?", a: [
    "Only ticked items. Go to Settings, Apps, Notes, Sort Checked Items and choose Automatically, and each item you tick moves to the bottom. For any other order, drag items by hand.",
  ] },
  { q: "Should I use Notes or Reminders for to-dos?", a: [
    "Use Reminders when a task needs a due date or a notification, since Reminders has a Date and Time button and can remind you when you arrive or leave a place. Use a Notes checklist for a list you read in one go, like today's tasks or errands.",
  ] },
  { q: "How do I see all my unfinished to-dos in Apple Notes?", a: [
    "Make a Smart Folder with the rule Checklists, Unchecked. It lists every note that still has an unticked item, whichever folder it's in.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-to-do-list"
      intro={<>
        A to-do list is one of the most common things people keep in Apple Notes. It takes one button on iPhone and one shortcut on a
        Mac. Here&apos;s how to make one, a to-do template to paste in, how to sort it, and how to keep track when you have more than one
        list.
      </>}
      answer={
        <Answer jump={[
          { href: "#iphone", label: "On iPhone" },
          { href: "#mac", label: "On Mac" },
          { href: "#template", label: "The template" },
          { href: "#sort", label: "Sort the list" },
          { href: "#many-lists", label: "More than one list" },
          { href: "#pinto-notes", label: "A list your AI keeps" },
        ]}>
          <p>
            On iPhone, open a new note, type a title, tap Return and tap the Checklist button. Each Return adds a to-do, and tapping its
            circle ticks it. On a Mac, click the Checklist button or press Shift-Command-L. To have done items drop to the bottom, turn on
            Sort Checked Items on iPhone, or Automatically sort checked items on a Mac.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-to-do-list" position="answer" template="weekly-planner" title="Want your AI to keep the list?">
            <p>Pinto Notes works like Apple Notes, and ChatGPT or Claude can add to-dos to your list and clear what you&apos;ve ticked. Its free weekly planner moves what you didn&apos;t finish to today.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="A Groceries note in Apple Notes on a Mac: eight unticked items from Oat milk to Dark chocolate, then Sourdough, Eggs and Spinach ticked at the bottom."
        caption="A checklist in Apple Notes on a Mac, with the ticked items at the bottom. A to-do list works the same way." />}
      faq={FAQ}
    >
      <h2 id="iphone">Make a to-do list on iPhone</h2>
      <ol>
        <li>Open Notes and tap the Compose button.</li>
        <li>Type a title, like To do, and tap Return.</li>
        <li>Tap the Checklist button. Type a to-do and tap Return for the next one.</li>
        <li>Tap the empty circle next to an item to mark it done.</li>
      </ol>
      <p>
        To add a list to a note you already have, put the cursor where it should go and tap the Checklist button. If you typed the
        to-dos as plain lines, select them and tap the Checklist button to turn them into one list. Drag an item to move it, and swipe
        it right to indent it under another, or left to undo the indent.
      </p>

      <h2 id="mac">Make a to-do list on Mac</h2>
      <MenuPaths rows={[
        { on: "Checklist", steps: ["Checklist button"], keys: "⇧⌘L" },
        { on: "Tick", steps: ["Mark or unmark an item"], keys: "⇧⌘U" },
        { on: "Move", steps: ["Item up or down"], keys: "⌃⌘↑ ⌃⌘↓" },
      ]} />
      <p>
        In a note, click the Checklist button in the toolbar or press Shift-Command-L, and type your to-dos with Return between them.
        To turn lines you&apos;ve already typed into a list, select them and click the Checklist button: each line becomes an item. Click
        a circle to tick an item, or press Shift-Command-U to tick the one the cursor is in.
      </p>
      <p>
        Click and hold an item to drag it, or press Control-Command-Up Arrow or Down Arrow to move it a line at a time. Tab indents an
        item and Shift-Tab undoes it. With your notes in iCloud, a list made on the Mac is on your iPhone too.
      </p>

      <h2 id="template">A to-do list template for Apple Notes</h2>
      <p>
        Apple Notes has no templates, so here&apos;s one to paste in. It sorts to-dos by when and where you&apos;ll do them: Today for
        what has to happen now, This week for the rest of the week, Errands for when you&apos;re out, Waiting on for what someone else
        owes you, and Someday so the long-term things stop crowding today. Swap in your own tasks, and keep a word in every line,
        because an empty checklist item doesn&apos;t survive the paste.
      </p>
      <Keep title="To-do list for Apple Notes" text={TEMPLATE}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the # line into the title, each ## line into a heading and the to-dos into
        a checklist. A plain Command-V keeps the symbols as text. On iPhone, the quickest start is a plain list: copy this one into a new
        note, select every line under the title and tap the Checklist button.
      </p>
      <Checklist title="To do today" items={[
        "Send the Q4 budget to Jonas",
        "Call Mum",
        "Return the parcel",
        "Pick up the dry cleaning",
      ]} />
      <p>
        If you plan by day, the <a href="/blog/apple-notes-planner-template">Apple Notes planner template</a> has a heading for each day
        of the week and a top three. <a href="/blog/apple-notes-templates">Apple Notes templates</a> has more notes to paste in.
      </p>

      <h2 id="sort">Sort a to-do list in Notes</h2>
      <MenuPaths rows={[
        { on: "iPhone", steps: ["Settings", "Apps", "Notes", "Sort Checked Items"] },
        { on: "Mac", steps: ["Notes", "Settings", "Automatically sort checked items"] },
        { on: "Mac", steps: ["Format", "More", "Uncheck All"] },
      ]} />
      <p>
        The one sort Notes does is for ticked items. On iPhone, open Settings, tap Apps, Notes, Sort Checked Items, and choose
        Automatically: each to-do you tick moves to the bottom, so what&apos;s left stays on top. On a Mac, choose Notes, Settings and
        select Automatically sort checked items. Each device has its own switch, and it covers every checklist on that device.
      </p>
      <p>
        Notes won&apos;t sort a list by name or by priority, so put the most important to-do first by dragging it there. For a list that
        repeats, like a Monday routine, click in it on a Mac and choose Format, More, Uncheck All to start over. The details, and how to
        turn sorting off, are in <a href="/blog/apple-notes-checklist-sort">moving checked items to the bottom</a>.
      </p>

      <h2 id="many-lists">Keep track of more than one list</h2>
      <ul>
        <li>
          <strong>Pin the main list.</strong> A pinned note sits at the top of its folder. On a Mac, choose File, Pin Note. On iPhone,
          touch and hold the note in the list, then tap Pin Note.
        </li>
        <li>
          <strong>Tag to-do notes.</strong> Type a word after a #, like #todo, in each note that holds to-dos. The tag shows in the
          sidebar and lists those notes together.
        </li>
        <li>
          <strong>Share a list.</strong> Tap the Share button in the note and choose Collaborate. Each person you invite needs an Apple
          Account.
        </li>
        <li>
          <strong>Use Reminders for deadlines.</strong> A to-do that needs a due date or a notification belongs in Apple&apos;s Reminders
          app, which has a Date and Time button and can remind you when you arrive at or leave a place.
        </li>
      </ul>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700}
        alt="The New Smart Folder dialog in Apple Notes on macOS 27, named Open to-dos, with one rule: Checklists, Unchecked."
        caption="A Smart Folder of every note with an unticked item. Apple Notes on macOS 27." />
      <p>
        To see every open to-do at once, make a Smart Folder with the rule Checklists, Unchecked. On a Mac, choose File, New Smart
        Folder. It lists every note that still has an unticked item, from any folder. The steps for iPhone are in <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a>.
      </p>

      <h2 id="limits">Where a to-do list in Notes stops</h2>
      <ul>
        <li><strong>No dates or alerts.</strong> Apple&apos;s checklist steps for Notes have no due dates or notifications. A to-do with a deadline needs Reminders or your memory.</li>
        <li><strong>Ticked items pile up.</strong> They sink to the bottom and stay until you delete or uncheck them.</li>
        <li><strong>Nothing carries over.</strong> A to-do you didn&apos;t get to today stays under Today until you move it yourself.</li>
        <li><strong>The order is by hand.</strong> Notes won&apos;t sort by priority or put a new to-do under the right heading.</li>
      </ul>
      <p>
        For a short list, a minute of tidying a day is all it needs. For a long one, the tidying becomes a job of its own.
      </p>

      <h2 id="pinto-notes">A to-do list your AI can keep</h2>
      <PostFigure src="/blog/launch/weekly-planner-note" width={1520} height={2058} maxWidth={600}
        alt="A Weekly planner note in Pinto Notes on a Mac: a Top three this week checklist with one ticked, a heading for each day from Monday to Sunday with that day's to-dos as a checklist, the days up to Friday ticked off, and a Later list."
        caption="A week of to-dos in Pinto Notes, kept with the weekly planner template. Example data." />
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, with the same checklists you tick with a tap. Once ChatGPT or
        Claude is connected, it can read and edit your notes from the chat you already use. Tell it &ldquo;add these to my to-do
        list&rdquo; in one long message and it adds each one as a checklist line, or ask it to clear what you&apos;ve ticked and tell you
        what&apos;s left.
      </p>
      <p>
        For a list by day, the free <a href="/templates/weekly-planner">weekly planner</a> template has Top three this week, a heading for
        each day and Later. Ask your AI to &ldquo;move what I didn&apos;t finish to today&rdquo; and the unticked to-dos from earlier days
        come along. On Sunday, say it&apos;s a new week: it clears what&apos;s ticked, moves what&apos;s left to Monday and asks for next
        week&apos;s top three. You can still type, tick and drag every item yourself, and every earlier version of a note is kept. The AI
        part works once ChatGPT or Claude is connected, and <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a
        minute.
      </p>
      <p>
        The lists you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
