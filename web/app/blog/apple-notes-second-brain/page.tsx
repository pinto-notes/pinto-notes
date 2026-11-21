import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-second-brain", { title: "Apple Notes second brain: a simple system to copy" });

// Written 21 November 2026 for "apple notes second brain", topic-research-2026-11-20.md row 18.
// Google autocomplete read live 21 November 2026 at suggestqueries.google.com/complete/search,
// client=firefox, hl=en, gl=us. Queries: apple notes second brain; using apple notes as second brain;
// how to use apple notes as second brain; apple notes second brain template. Relevant returned variants:
// apple notes second brain reddit; apple notes second brain template; using apple notes as second brain;
// apple notes as second brain; how to use apple notes as second brain; how to use apple notes effectively.
// Apple pages read live today, 21 November 2026, fetched directly from support.apple.com after web fetches
// returned 429 for some pages. All Notes guide paths below are on support.apple.com/guide/notes/:
// apd558a85438/mac: File, New Folder; drag notes into folders; folders and subfolders.
// not9474646a9/mac: select a folder, click New Note; first line becomes the title; File, Duplicate Note;
// full guide functionality with iCloud notes, some features unavailable with other account providers.
// apdc88ed7f1d/mac: type #word; tags span folders and appear at the bottom of the sidebar.
// apd58edc7964/mac: File, New Smart Folder; Tags rules; references to notes stay in their original folders.
// apdb54e469b6/mac: File, Pin Note; pins appear at the top of the notes list.
// apde615d29c2/mac: Edit, Add Link, type the target title; >> shortcut; Use Note Title updates on rename.
// support.apple.com/guide/iphone/iph908d1558b/ios: >> followed by the note title also links notes on iPhone.
// support.apple.com/en-us/102288: on iPhone, #tag plus a space activates a tag; New Folder, Make Into
// Smart Folder, choose filters. This is a suggested filing and review habit, not a method Apple prescribes.
// Earlier verified posts: apple-notes-recipe-template for an index note and File, Duplicate Note;
// apple-notes-tags-smart-folders for tags and saved filters; apple-notes-backlinks for the absence of backlinks.
// Pinto: BRIEF.md facts for Apple Notes' feel on iPhone and Mac, connected ChatGPT or Claude reading and
// editing notes, and Mac import leaving Apple Notes unchanged. apple-notes-backlinks' verified header:
// Linked From in the note's More menu, real links only, from NoteDetailView LinkedFromMenu.
// Read ai-memory-with-notes too: AI-written notes remain readable and editable by the user. No study scores
// or claims about built-in AI memory are used. Pictures: none. The Home note below is an original example.

const HOME = `Home

This week
Choose plants for the balcony

Current projects
Balcony garden

Useful reference
Plants for shade
Watering notes

Weekly review
Read the notes in Inbox
File anything worth keeping
Write the next step in each active project
Move finished projects to Archive
`;

const FAQ = [
  { q: "Can I use Apple Notes as a second brain?", a: [
    "Yes. Use an Inbox folder for new notes, Projects for active work, Reference for things you will reuse, and Archive for finished work. A pinned Home note links to what matters this week. Review the inbox regularly so you can find what you saved.",
  ] },
  { q: "Is there an Apple Notes second brain template I can copy?", a: [
    "Copy the Home note on this page into a new note. Replace the example project and reference titles with your own, then add real note links with Edit, Add Link on a Mac, or by typing >> and the target title on iPhone or Mac. Pasted titles alone are plain text.",
  ] },
  { q: "How do I collect one project's notes across Apple Notes folders?", a: [
    "Give each related note the same tag, such as #garden. On a Mac, choose File, New Smart Folder and add a Tags rule for that tag. The Smart Folder lists the matching notes while they stay in their original folders.",
  ] },
  { q: "How often should I review my Apple Notes second brain?", a: [
    "Try once a week. File the useful notes from Inbox, update the next step in each project, and move finished work to Archive. Review sooner if you keep saving notes you need for today's work.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-second-brain"
      intro={<>Apple Notes can be your second brain: a place to save things and find them when you need them. Start with an Inbox folder and a pinned Home note, then file what you capture once a week.</>}
      answer={
        <Answer jump={[
          { href: "#folders", label: "The folders" },
          { href: "#home", label: "Copy a Home note" },
          { href: "#tags", label: "Tags and Smart Folders" },
          { href: "#capture", label: "The daily habit" },
          { href: "#pinto-notes", label: "Links back and AI access" },
        ]}>
          <p>
            To use Apple Notes as a second brain, make four folders: Inbox, Projects, Reference and Archive. Pin a Home note with links
            to your active projects, and use a shared tag plus a Smart Folder to collect related notes across folders. Capture new notes
            in Inbox and review them each week.
          </p>
          <PostCta slug="apple-notes-second-brain" position="answer" title="Let your AI work with the notes you keep">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Linked From shows which notes link to the one you have open, and ChatGPT or Claude can read and edit your notes once connected.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="folders">Start with four folders</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["File", "New Folder"] }]} />
      <p>
        On a Mac, select a folder under iCloud in the sidebar, then choose File, New Folder. Repeat for the folders below. Use iCloud
        notes for this setup, since Apple says some Notes features aren&apos;t available with accounts from other providers.
      </p>
      <ul>
        <li>Inbox holds new notes you haven&apos;t filed yet. Put the thought here while you still remember it.</li>
        <li>Projects holds work with a finish, such as Balcony garden. Keep the plan and its next step in a note with that name.</li>
        <li>Reference holds things you expect to reuse, such as plant advice or a watering guide.</li>
        <li>Archive holds finished projects you may want to look up later. Move them here when the work is done.</li>
      </ul>
      <p>
        Start with your next new note. You don&apos;t need to sort your whole library first. On a Mac, drag a note from the notes list
        onto a folder in the sidebar to file it. Add subfolders only when a folder becomes hard for you to browse.
      </p>

      <h2 id="home">Copy a Home note and pin it</h2>
      <p>
        Keep Home in Projects and use it as your starting point. Paste this plain text into a new note, then replace the examples with
        your own work. The project and reference names are placeholders, so you&apos;ll add their links next.
      </p>
      <Keep title="Apple Notes second brain Home note" text={HOME}
        note="Paste as plain text. Create the project and reference notes, then replace their names here with real note links." />
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link"] },
        { on: "Mac", steps: ["File", "Pin Note"] },
      ]} />
      <p>
        Create a separate note called Balcony garden. Back in Home, select the placeholder name, choose Edit, Add Link, start typing
        Balcony garden and select the note. Leave Use Note Title on so the link name updates if you rename the project. Do the same
        for the reference notes you want to open from Home.
      </p>
      <p>
        On iPhone or Mac, you can also type <code>&gt;&gt;</code> in a note, then the target note&apos;s title, and choose it. Apple&apos;s{" "}
        <a href="https://support.apple.com/guide/notes/apde615d29c2/mac" rel="noopener">guide to adding links</a> documents the Mac steps.
        Select Home in the notes list and choose File, Pin Note to keep it at the top of its folder.
      </p>

      <h2 id="tags">Use tags for topics that cross folders</h2>
      <p>
        A folder tells you where you filed a note. A tag can group notes you filed in different places. Add <code>#garden</code> to the
        Balcony garden project and to Plants for shade in Reference. On iPhone, add a space after the tag to activate it. Start with
        tags you expect to use again, rather than tagging every word you might search for.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["File", "New Smart Folder"] },
        { on: "iPhone", steps: ["New Folder", "Make Into Smart Folder"] },
      ]} />
      <p>
        On a Mac, choose File, New Smart Folder, name it Garden, and choose Tags as its rule. Select the garden tag and click OK.
        On iPhone, tap New Folder from the folders list, name it Garden, tap Make Into Smart Folder, then choose the tag filter and
        confirm. You now have one list for the project and its references, while each note stays in its original folder.
      </p>
      <p>
        This is a saved filter, so you still add the tag yourself. Our guide to{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a> covers the rules and what to check if
        a note doesn&apos;t appear.
      </p>

      <h2 id="capture">Capture first, then review the inbox</h2>
      <p>
        On a Mac, select Inbox in the sidebar and click the New Note button. Give the note a title you would recognize next month,
        such as Plants for a north-facing balcony. Add the useful detail and the source link if there is one. Leave filing until your
        review, unless you already know where the note belongs.
      </p>
      <p>
        Once a week, open Inbox. Read each note and decide whether you will use it. Move useful material into Reference, and active
        work into Projects. For each project, write the next step in its plan and add a link from Home if you need it this week.
        Move finished projects to Archive and remove their links from Home.
      </p>
      <p>
        Keep a blank project layout if you find yourself writing the same headings each time. On a Mac, File, Duplicate Note makes a
        copy to fill in. Aim for notes you can act on, such as which plants you chose and why, rather than a folder full of links you
        haven&apos;t read.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        Home needs upkeep. A new project won&apos;t add itself to your index, and a Smart Folder only lists notes that match its rules.
        You still decide what to keep and how it changes your plan. Apple Notes also has no list of incoming note links, so linking
        Plants for shade from a project won&apos;t make that project appear on the reference note.
      </p>

      <h2 id="pinto-notes">Pinto Notes adds links back and AI access</h2>
      <p>
        In Pinto Notes, Linked From in a note&apos;s More menu lists the notes that link to it. You can open a reference note and find
        the projects using it. Only actual links count. The <a href="/blog/apple-notes-backlinks">backlinks guide</a> shows how it works. For one outcome you work toward over weeks, a <a href="/blog/apple-notes-goal-template">goal note with milestones and evidence</a> keeps the proof of progress in one place.
      </p>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit your notes. For a
        weekly review, try asking it to read a project&apos;s notes and write a draft of the next steps. Check the draft against the
        notes and correct it yourself. You can read and edit the notes the AI keeps too.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
