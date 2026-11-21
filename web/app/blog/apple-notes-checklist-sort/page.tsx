import { Figure } from "@/lib/blog";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPaths, PostFigure } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-checklist-sort", { title: "Apple Notes checklist: move checked items to the bottom" });

// Written 21 November 2026 for "apple notes checklist move to bottom" (Google autocomplete 21 Nov, en-US: apple notes
// checklist move to bottom, iphone notes checklist move to bottom, ios notes checklist move to bottom, mac notes
// checklist move to bottom, apple notes list move to bottom, apple notes checklist don't move to bottom, iphone notes
// checklist not move to bottom, how to make apple notes checklist (not) move; also apple notes checklist sorting, apple
// notes list sort, apple notes list auto sort, apple notes checklist uncheck all, apple notes checklist strikethrough,
// apple notes checklist greyed out, apple notes checklist shortcut).
// Apple Notes facts, all read on Apple's pages on 21 Nov 2026:
// - "Create a checklist with Notes" (support.apple.com/102296, published 11 Feb 2025, iPhone): Settings > Apps > Notes,
//   Sort Checked Items, Manually or Automatically; drag an item to reorder; swipe right to indent, left to undo; the
//   Checklist button; tap the empty circle to tick.
// - iPhone User Guide for iOS 16, "Create and format notes" (support.apple.com/guide/iphone/iph1ac0b3a2/16.0/ios):
//   the older path Settings > Notes > Sort Checked Items, and that Automatically applies "in all your notes". Its
//   in-note Checklist menu (Move Checked to Bottom, Delete Checked) is not in the current guides, so it's left out.
//   The iOS 27 version of that page says only "Make a checklist: tap the Checklist button".
// - Notes User Guide for Mac, macOS 27: "Add lists in Notes on Mac" (apd93c815aa0): click and hold an item and drag it;
//   select "Automatically sort checked items" in Notes settings; Format > More > Check All or Uncheck All;
//   Command-click any item checks all (or unchecks all if none is unchecked); Tab and Shift-Tab change the level.
//   "Change settings in Notes on Mac" (apd97da26aed): Notes > Settings; the setting moves items to the bottom as
//   they're checked and moves unchecked items back to the top. "Keyboard shortcuts and gestures in Notes on Mac"
//   (apd46c25187e): Shift-Command-L checklist, Shift-Command-U mark or unmark an item, Control-Command-Up or Down Arrow
//   move a list or checklist item.
// - Earlier posts: Smart Folder rule Checklists, Unchecked (apple-notes-tags-smart-folders, tried on macOS 27); Notes
//   keeps items in the order you type them, no sort by aisle (apple-notes-grocery-list-template).
// Not confirmed on any Apple page, so left out: why a ticked item looks grey or struck through, and the iPhone taps
// for Uncheck All in iOS 27.
// Pictures: the hero is the Apple Notes Groceries capture on a Mac from best-notes-app-for-mac (ticked items at the
// bottom); the Smart Folder dialog is the macOS 27 capture from apple-notes-tags-smart-folders; SHOTS.aiEdit is a real
// Pinto Notes capture. Pinto side: web/content/templates/grocery-list.json (files each item under its aisle, skips what's
// already on the list and unticked, removes the ticked lines on "I'm back from the shop").

const FAQ = [
  { q: "Why do checked items move to the bottom in Apple Notes?", a: [
    "Sort Checked Items is set to Automatically. On iPhone, go to Settings, Apps, Notes, Sort Checked Items and tap Manually to keep ticked items where they are. On a Mac, choose Notes, Settings and deselect Automatically sort checked items.",
  ] },
  { q: "Can I sort checked items in one note only?", a: [
    "The setting applies to every checklist in every note on that device. To tidy one list and leave the rest alone, keep the setting off and drag the ticked items down by hand.",
  ] },
  { q: "Can Apple Notes sort a checklist alphabetically?", a: [
    "No. Notes keeps items in the order you type them, and the sorting Apple describes only moves ticked items to the bottom. Drag items by hand, or on a Mac press Control-Command-Up Arrow or Down Arrow to move one line at a time.",
  ] },
  { q: "What is the keyboard shortcut for a checklist in Apple Notes?", a: [
    "On a Mac, Shift-Command-L turns the line into a checklist and Shift-Command-U ticks or unticks the item you're on. Command-click any item ticks them all.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-checklist-sort"
      intro={<>
        Tick an item in an Apple Notes checklist and it either drops to the bottom or stays put. One setting decides which, and it lives
        in a different place on iPhone and on Mac. Here&apos;s where to find it, how to move items by hand, and how to reset a list.
      </>}
      answer={
        <Answer jump={[
          { href: "#iphone", label: "On iPhone" },
          { href: "#mac", label: "On Mac" },
          { href: "#by-hand", label: "Move items by hand" },
          { href: "#uncheck-all", label: "Uncheck All" },
          { href: "#shortcuts", label: "Shortcuts" },
          { href: "#pinto-notes", label: "A list that tidies itself" },
        ]}>
          <p>
            On iPhone, go to Settings, Apps, Notes, tap Sort Checked Items, then tap Automatically to move ticked items to the bottom, or
            Manually to keep them where they are. On a Mac, choose Notes, Settings and select or deselect Automatically sort checked
            items. It&apos;s one switch for all your notes, so each device needs it set once.
          </p>
          {/* Experiment B1 pattern: the download where readers are. */}
          <PostCta slug="apple-notes-checklist-sort" position="answer" template="grocery-list" title="Want the ticked items cleared for you?">
            <p>Pinto Notes works like Apple Notes and has a free grocery list. Tell ChatGPT or Claude what you need and it files each item by aisle, then clears the ticked lines when you&apos;re back.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000} maxWidth={640}
        alt="A Groceries note in Apple Notes on a Mac: eight unticked items from Oat milk to Dark chocolate, then Sourdough, Eggs and Spinach ticked at the bottom."
        caption="A Groceries checklist in Apple Notes on a Mac, with the ticked items at the bottom." />}
      faq={FAQ}
    >
      <h2 id="iphone">Move checked items to the bottom on iPhone</h2>
      <MenuPaths rows={[
        { on: "iPhone", steps: ["Settings", "Apps", "Notes", "Sort Checked Items"] },
      ]} />
      <p>
        The setting is in the Settings app, not in Notes. Open Settings, tap Apps, then Notes, then Sort Checked Items, and choose:
      </p>
      <ul>
        <li><strong>Automatically.</strong> Each item you tick moves to the bottom of its checklist, so what&apos;s left stays on top.</li>
        <li><strong>Manually.</strong> Ticked items stay where they are. Choose this if your list has an order you want to keep, like the steps of a recipe.</li>
      </ul>
      <p>
        On older versions of iOS the same setting sits one level up, at Settings, Notes, Sort Checked Items. Either way it applies to
        every checklist in every note on that iPhone.
      </p>

      <h2 id="mac">Move checked items to the bottom on Mac</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Notes", "Settings", "Automatically sort checked items"] },
      ]} />
      <p>
        In Notes, choose Notes, Settings and select Automatically sort checked items. Tick an item and it moves to the bottom of the list.
        Untick it and it moves back up to the top. Deselect the setting and items stay where they are when you tick them.
      </p>
      <p>
        The Mac has its own switch, separate from the iPhone&apos;s, so set it on both if you want your lists to behave the same on each.
      </p>

      <h2 id="by-hand">Move a checklist item by hand</h2>
      <MenuPaths rows={[
        { on: "iPhone", steps: ["Drag the item"] },
        { on: "Mac", steps: ["Click and hold", "Drag"] },
        { on: "Mac", steps: ["Move item up"], keys: "⌃⌘↑" },
        { on: "Mac", steps: ["Move item down"], keys: "⌃⌘↓" },
      ]} />
      <p>
        With sorting set to Manually, the order is yours. On iPhone, drag an item to where you want it. On a Mac, click and hold an item and
        drag it, or put the cursor in a line and press Control-Command-Up Arrow or Down Arrow to move it one place at a time. Notes has
        no alphabetical sort for a checklist, so dragging is also how you put items in order.
      </p>
      <p>
        To group items, indent them. On iPhone, swipe an item right to indent it and left to undo. On a Mac, press Tab to indent and
        Shift-Tab to undo. For a shop, headings work better than order: one heading per aisle, as in the{" "}
        <a href="/blog/apple-notes-grocery-list-template">Apple Notes grocery list template</a>.
      </p>

      <h2 id="uncheck-all">Uncheck all, or check all</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format", "More", "Uncheck All"] },
        { on: "Mac", steps: ["Format", "More", "Check All"] },
      ]} />
      <p>
        To reuse a list, click in it and choose Format, More, Uncheck All. Check All ticks everything. There&apos;s a quicker way too:
        Command-click any item. If any item is unticked, Notes ticks them all, and if all are ticked, it unticks them all.
      </p>
      <p>
        Unchecking all loses the record of what you ticked. For a list you keep for its history, like a{" "}
        <a href="/blog/apple-notes-habit-tracker">habit tracker</a>, choose File, Duplicate Note first and reset the copy.
      </p>

      <h2 id="shortcuts">Checklist keyboard shortcuts on Mac</h2>
      <MenuPaths rows={[
        { on: "Checklist", steps: ["Apply Checklist format"], keys: "⇧⌘L" },
        { on: "Tick", steps: ["Mark or unmark an item"], keys: "⇧⌘U" },
        { on: "Move", steps: ["Item up or down"], keys: "⌃⌘↑ ⌃⌘↓" },
      ]} />
      <p>
        Shift-Command-L applies the checklist format, the same as the Checklist button. Shift-Command-U ticks or unticks
        the item the cursor is in, so you never need the mouse. Shift-Return adds a second line inside one item. On iPhone, tap the
        Checklist button, and each Return starts the next item.
      </p>

      <h2 id="open-lists">Find every list with something left to do</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700}
        alt="The New Smart Folder dialog in Apple Notes on macOS 27, named Open to-dos, with one rule: Checklists, Unchecked."
        caption="A Smart Folder of every note with an unticked item. Apple Notes on macOS 27." />
      <p>
        Sorting tidies one list. To see all of them, make a Smart Folder with the rule Checklists, Unchecked: it lists every note that
        still has an unticked item, from any folder. On a Mac, choose File, New Smart Folder. The steps for iPhone are in{" "}
        <a href="/blog/apple-notes-tags-smart-folders">Apple Notes tags and Smart Folders</a>.
      </p>

      <h2 id="limits">Where checklist sorting stops</h2>
      <ul>
        <li><strong>All notes or none.</strong> The setting covers every checklist on the device, so a shopping list and a recipe sort the same way.</li>
        <li><strong>Ticked items pile up.</strong> They sink to the bottom and stay there until you delete them or uncheck them.</li>
        <li><strong>The order is by hand.</strong> Notes won&apos;t sort by name or by aisle, and a new item goes where you type it.</li>
      </ul>
      <p>
        For one list you use every week, that&apos;s fine. For a list that changes every day, the tidying is a job of its own.
      </p>

      <h2 id="pinto-notes">A list that tidies itself</h2>
      <Figure shot={SHOTS.aiEdit} caption="A Groceries note in Pinto Notes on a Mac. The five lines ChatGPT just added are tinted, with Undo at the bottom." />
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, and ChatGPT or Claude can work in your notes from the chat you
        already use. The free <a href="/templates/grocery-list">grocery list</a> template is one list with a heading for each aisle.
      </p>
      <p>
        Tell your AI what you need, even in one long sentence, and it adds each item under the right aisle and skips what&apos;s already on
        the list. Tick things off as you shop. Say &ldquo;I&apos;m back from the shop&rdquo; and it removes the ticked lines and tells you
        what&apos;s left. You can still add, tick and drag every item yourself, and every earlier version of a note is kept. This works once
        ChatGPT or Claude is connected, and <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT</a> takes a minute.
      </p>
      <p>
        The checklists you already keep in Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and
        Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
