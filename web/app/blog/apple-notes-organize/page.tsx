import { SHOTS } from "@/lib/posts";
import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-organize", { title: "How to organize Apple Notes: a system that lasts" });

// Written 21 November 2026 for "how to organize apple notes". Google autocomplete 21 Nov (en-US): how to organize apple
// notes, ...app, ...into folders, ...folders, ...alphabetically, ...reddit, ...better, ...for work, best way to organize
// apple notes, how to organize iphone notes; also "apple notes organization system", "apple notes organization ideas",
// "apple notes organization tips", "apple notes folder structure ideas", "apple notes life organization".
// Apple pages read 21 Nov 2026:
// - Add and remove folders in Notes on Mac (support.apple.com/guide/notes/add-and-remove-folders-apd558a85438/mac): File,
//   New Folder; drag notes in, Option-drag copies; drag a folder onto another to make a subfolder; Rename Folder and Delete
//   Folder from the More button or Control-click; notes in a deleted folder go to Recently Deleted for 30 days; no subfolder in
//   the All folder or the Notes folder; All, Notes and Recently Deleted can't be deleted.
// - Sort and pin notes on Mac (support.apple.com/guide/notes/sort-and-pin-notes-apdb54e469b6/mac): Notes, Settings, "Sort
//   notes by"; one folder: More button, Sort By; the All folders and Recently Deleted use the default; File, Pin Note, or a
//   two-finger swipe right; drag between Pinned and Notes; a pin shows on every device with the same Apple Account; pinning
//   needs upgraded iCloud notes or On My Mac.
// - Customize how notes appear in Notes on Mac (support.apple.com/guide/notes/customize-how-notes-appear-apd000074a4e/mac):
//   Notes, Settings, "Group notes by date"; per folder, More button, Group By Date; not available when sorted by title.
// - Organize your notes in folders on iPhone (support.apple.com/guide/iphone/organize-in-folders-ipha61270292/ios): New
//   Folder button; touch and hold a folder and drag it onto another for a subfolder; Rename; swipe left to delete; move a
//   note with swipe left and the Move Folder button, or touch and hold, Move; Folder Actions button, Sort By, Oldest First or
//   Descending; Settings, Apps, Notes, Sort Notes By; notes grouped by date by default, Group By Date to change; touch and hold,
//   Pin Note, or swipe right and tap the pin. The three sort choices by name (Date Edited, Date Created, Title) are from the
//   iOS 15 version of the same page (support.apple.com/guide/iphone/search-and-organize-notes-ipha61270292/15.0/ios/15.0);
//   the current page says "title or date".
// Facts from earlier posts: tags, Smart Folder rules (Tags with Untagged Notes Only, Date Edited back a number of days,
// Checklists Unchecked), Apple's folders-for-areas, tags-for-topics tip, tagged notes can't be locked, iPhone More button,
// Select Notes (apple-notes-tags-smart-folders); Control-click, Move to on Mac, Folder button after Select Notes on iPhone
// (move-apple-notes-to-icloud); Edit, Add Link (Command-K), >> and a title, Link to Section on iOS 27 and macOS 27
// (apple-notes-backlinks, apple-notes-ios-27); Paste as Markdown and Format, More, Uncheck All (apple-notes-recipe-template);
// search reads every word. Pictures, reused for what they show: Apple's iOS 27 Folders list and Select Notes images
// (public/blog/apple), and SHOTS.notesDefaultAccount (Notes settings on macOS 26 with Sort notes by Date Edited).
// Pinto side: the BRIEF's Pinto facts, the weekly-review template (content/templates/weekly-review.json), and the
// folders, sub-folders and pins already described in apple-notes-tags-smart-folders.

const TIDY = `# Weekly tidy

- [ ] File every note in the Notes folder, or delete it
- [ ] Tag the notes in Untagged that need a tag
- [ ] Look through This week for anything in the wrong folder
- [ ] Unpin what's finished
- [ ] Clear or delete done lists in Open to-dos
- [ ] Move finished projects to Archive
`;

const FAQ = [
  { q: "What is the best way to organize Apple Notes?", a: [
    "A few broad folders for the areas of your life, tags for topics that cut across them, one pinned index note per folder, and ten minutes a week to file what piled up. Search finds any word, so the system only has to make browsing easy.",
  ] },
  { q: "How do I sort Apple Notes alphabetically?", a: [
    "Sort by title. On iPhone, open the folder, tap the Folder Actions button, tap Sort By and choose Title. On a Mac, click the folder's More button and choose Sort By, or set Sort notes by in Notes, Settings for every folder. Grouping by date switches off for a folder sorted by title.",
  ] },
  { q: "Can you make subfolders in Apple Notes?", a: [
    "Yes. Drag one folder onto another, on a Mac or iPhone (touch and hold it first on iPhone). The only folders that can't take a subfolder are the All folder of an account and the Notes folder.",
  ] },
  { q: "Should I use folders or tags in Apple Notes?", a: [
    "Both. A note lives in one folder and can carry many tags. Apple's own tip in Notes is folders for broad areas, like work, and tags for specific topics, like #taxes. A note with a tag can't be locked, so keep locked notes organized by folder.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-organize"
      intro={<>
        Most Apple Notes libraries grow the same way: everything lands in Notes, sorted by the last edit, until scrolling stops
        working. Here&apos;s how to organize Apple Notes on iPhone and Mac with what Notes already has, a folder structure to copy, and
        a weekly tidy that keeps it that way.
      </>}
      answer={
        <Answer jump={[
          { href: "#folders", label: "Folders" },
          { href: "#sort", label: "Sort" },
          { href: "#pin", label: "Pin" },
          { href: "#tags", label: "Tags and Smart Folders" },
          { href: "#structure", label: "A structure to copy" },
          { href: "#links", label: "Links" },
          { href: "#weekly-tidy", label: "Weekly tidy" },
        ]}>
          <p>
            Make a handful of broad folders, with subfolders only where a folder gets crowded, and tag notes for topics that span
            folders. Sort each folder the way you look for things (by date edited, date created or title) and pin the few notes you
            open every day. Then spend ten minutes a week filing what landed in Notes.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-organize" position="answer" title="Rather not do the filing?">
            <p>Pinto Notes looks and works like Apple Notes. Connect ChatGPT or Claude, and they move notes into the right folders, tag them and tidy them when you ask.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="The Folders list in Notes on iPhone with iOS 27: Quick Notes and Shared, iCloud folders such as Notes, Gift Ideas, Grocery List and Sketches, and a Tags section below."
        caption="Folders for areas, tags for topics, both in one list. Image: Apple." />}
      faq={FAQ}
    >
      <h2 id="folders">Folders and subfolders</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "New Folder"] },
        { on: "iPhone", steps: ["Folders", "New Folder button"] },
      ]} />
      <p>
        On a Mac, select a folder in the account you want, choose File, New Folder and type a name. On iPhone, tap the New Folder
        button in the Folders list. To make a subfolder, drag one folder onto another (on iPhone, touch and hold it first). Drag it out
        again to undo that. The All folder and the Notes folder can&apos;t hold subfolders, so build your structure beside them.
      </p>
      <p>
        To move a note on a Mac, drag it onto a folder in the sidebar, or Control-click it and choose Move to. Hold Option as you drop
        to copy it instead. On iPhone, swipe left on the note and tap the Move Folder button, or touch and hold it and tap Move.
      </p>
      <PostFigure src="/blog/apple/iphone-notes-ios27-select-notes-move" width={640} height={1320} maxWidth={280}
        alt="Notes on iPhone with iOS 27 in selection mode: 3 Selected, three notes ticked, and a Folder button at the bottom left for moving them."
        caption="To file several notes at once: Select Notes, then the Folder button. Image: Apple." />
      <p>
        For a pile of notes on iPhone, open the folder, tap the More button, then Select Notes, tick them and tap the Folder button.
        Deleting a folder sends its notes to Recently Deleted, where they stay for 30 days, so a wrong delete can be undone.
      </p>

      <h2 id="sort">Sort notes by date or title</h2>
      <Figure shot={SHOTS.notesDefaultAccount} ground="sky" caption="Notes, Settings on a Mac running macOS 26. Sort notes by sets the order for every folder." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Notes", "Settings", "Sort notes by"] },
        { on: "Mac, one folder", steps: ["More button", "Sort By"] },
        { on: "iPhone, one folder", steps: ["Folder Actions button", "Sort By"] },
        { on: "iPhone, every folder", steps: ["Settings", "Apps", "Notes", "Sort Notes By"] },
      ]} />
      <p>
        A folder can sort by date edited, date created or title. Title is how you sort Apple Notes alphabetically, and it suits a
        folder of reference notes like recipes or manuals. Date edited suits a working folder, where what you touched last is what you
        want next. On iPhone, Sort By also offers Oldest First for a date and Descending for a title.
      </p>
      <p>
        A sort set on one folder applies to that folder only. On a Mac, the All folders and Recently Deleted always follow the default
        in Settings. Notes also groups a list under dates like Today and Yesterday; turn that off with Group By Date in the same menu.
        A folder sorted by title can&apos;t be grouped by date.
      </p>

      <h2 id="pin">Pin the notes you open every day</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "Pin Note"] },
        { on: "iPhone", steps: ["Touch and hold the note", "Pin Note"] },
      ]} />
      <p>
        A pinned note stays at the top of its folder whatever the sort. On a Mac you can also swipe right with two fingers and click
        the pin, or drag a note between the Pinned and Notes sections. On iPhone, swipe right and tap the pin. A pin shows on every
        device signed in to the same Apple Account. It needs iCloud notes or notes on your Mac.
      </p>
      <p>
        Keep pins few. Two or three per folder is plenty: the current shopping list, this week&apos;s plan, and an index note for the
        folder (more on that below).
      </p>

      <h2 id="tags">Tags and Smart Folders</h2>
      <p>
        A note sits in one folder but can carry many tags. Type # and a word, like #taxes, anywhere in the note. Apple&apos;s own tip in
        Notes is folders for broad areas and tags for topics, and it holds up: a receipt goes in Money with #taxes, and a note about the
        accountant goes in Work with #taxes too.
      </p>
      <p>
        A Smart Folder is a saved filter that lists notes from every folder by rules like Tags, Date Edited or Checklists. Three are
        worth making for the weekly tidy below: Untagged (a Tags rule set to Untagged Notes Only), This week (Date Edited in the last 7
        days) and Open to-dos (Checklists, Unchecked). The notes stay where they are. Every rule, and why a tag sometimes won&apos;t
        form, is in <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a>. One catch: a note with a tag
        can&apos;t be locked.
      </p>

      <h2 id="structure">A simple folder structure to copy</h2>
      <p>
        Start with folders for the places you&apos;d look, and add a subfolder only when a folder gets too long to scan. Two levels is
        enough for most people.
      </p>
      <ul>
        <li><strong>Notes.</strong> The built-in folder, used as an inbox. Capture here and file later.</li>
        <li><strong>Home.</strong> The house, the car, manuals and warranties.</li>
        <li><strong>Money.</strong> Budgets, receipts, subscriptions. Tag anything for the tax return #taxes.</li>
        <li><strong>Health.</strong> Appointments, medication, training.</li>
        <li><strong>Work.</strong> With subfolders Projects, Meetings and Reference if it gets busy.</li>
        <li><strong>Trips.</strong> One note per trip.</li>
        <li><strong>Recipes.</strong> Sorted by title.</li>
        <li><strong>Ideas.</strong> Anything you want to come back to.</li>
        <li><strong>Archive.</strong> Finished projects and old trips, out of the way and still searchable.</li>
      </ul>
      <p>
        Organizing Apple Notes for work follows the same pattern. Give each project a subfolder under Work, and tag a client across
        folders, like #acme. Meetings are easiest with one note per meeting in the same shape, which the{" "}
        <a href="/blog/apple-notes-meeting-notes-template">Apple Notes meeting notes template</a> gives you. More notes to paste in are
        in <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="links">Link notes into an index</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link"], keys: "⌘K" },
        { on: "iPhone", steps: ["Edit menu", "Add Link"] },
      ]} />
      <p>
        Folders sort notes by date or title. An index note sorts them by meaning. Make one note per busy folder, say Work index, with a
        heading for each project and a link to each note under it, and pin it. To link, select the text, choose Add Link and pick the
        note, or type <code>&gt;&gt;</code> and the note&apos;s title. On iOS 27 and macOS 27 a link can also jump to a heading inside a
        note, which <a href="/blog/apple-notes-ios-27">what&apos;s new in Apple Notes</a> covers.
      </p>

      <h2 id="weekly-tidy">A ten-minute weekly tidy</h2>
      <p>
        Once a week (Sunday evening works), go through the inbox and the three Smart Folders. Paste this
        checklist into a note and pin it.
      </p>
      <Keep title="Weekly tidy for Apple Notes" text={TIDY}
        note="On a Mac, paste it into a new note with Edit, Paste as Markdown." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Edit", "Paste as Markdown"] }]} />
      <p>
        On a Mac with macOS 27, Edit, Paste as Markdown turns the lines into a checklist. On iPhone, type the lines, select them and tap
        the checklist button. When you&apos;re done, click in the list and choose Format, More, Uncheck All, and it&apos;s ready for next
        week.
      </p>

      <h2 id="limits">Where organizing Apple Notes stops</h2>
      <ul>
        <li><strong>Filing is by hand.</strong> Every note in the inbox waits for you to move it.</li>
        <li><strong>Tags go on by hand</strong>, one note or one selected batch at a time.</li>
        <li><strong>Index notes go stale.</strong> A new note isn&apos;t in the index until you add its link.</li>
        <li><strong>Search finds words, not answers.</strong> It finds every note that says &ldquo;kitchen&rdquo;. It can&apos;t say which of them decided the budget.</li>
      </ul>
      <p>
        For a few hundred notes, folders, pins and a weekly tidy are enough. Past that, the tidying is the job, and it&apos;s left to you.
      </p>

      <h2 id="pinto-notes">Notes that file themselves</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, with folders, sub-folders, pins and search across every word.
        Once ChatGPT or Claude is connected, they can do the tidy for you. Ask &ldquo;file everything in Notes into the right
        folders&rdquo;, &ldquo;tag every note about the kitchen renovation&rdquo; or &ldquo;move my finished trips to Archive&rdquo;, and
        the notes move. You can still file and edit everything yourself, and every earlier version of a note is kept.{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        For the weekly habit, the free <a href="/templates/weekly-review">weekly review</a> template has your AI ask five questions on
        Sunday and write the week up in one note, newest week first, with your top three for next week as a checklist. More are in{" "}
        <a href="/templates">templates</a>.
      </p>
      <p>
        The notes you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, folders
        included, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
