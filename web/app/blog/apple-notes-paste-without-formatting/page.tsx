import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-paste-without-formatting", {
  title: "Apple Notes paste without formatting: Mac and iPhone",
});

// Written 21 November 2026 for "apple notes paste without formatting", research row 23 in
// topic-research-2026-11-22.md. Google autocomplete rechecked today, en-US, using
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=
// Head query returned: apple notes paste without formatting, mac notes paste without formatting,
// ios notes paste without formatting, iphone notes paste without formatting, mac notes app paste
// without formatting, apple paste without formatting, notepad paste without formatting,
// apple notes remove formatting. Additional seeds: iphone notes paste without formatting returned
// paste into notes without formatting iphone; mac notes paste without formatting returned
// macbook notes paste without formatting and mac shortcut paste without formatting;
// apple notes remove formatting returned mac notes remove formatting, iphone notes remove
// formatting, apple notes clear formatting and apple notes remove table formatting, among others.
// Only relevant variants are recorded here; suggestions are not evidence of a working feature.
// Apple sources read live today, directly fetched after web open returned access errors:
// https://support.apple.com/en-us/guide/notes/not9474646a9/26/mac/26
// Create and edit notes, macOS 26: Edit, Copy; Edit, Paste; Edit, Paste and Match Style ignores
// clipboard styles and applies surrounding styles; Paste and Retain Style keeps source styles.
// The current macOS 27 version at /guide/notes/not9474646a9/mac was also read, but omits that section.
// https://support.apple.com/en-us/102553
// How to copy and paste on Mac: Option-Shift-Command-V; Edit, Paste and Match Style; unavailable
// paste actions are dimmed. Also retrieved through web search today.
// https://support.apple.com/en-us/guide/notes/apd46c25187e/mac
// Notes keyboard shortcuts: Shift-Command-B applies Body; keyboard layouts can change shortcuts.
// https://support.apple.com/en-us/guide/iphone/iph1a9cae52c/ios
// Select, edit, and move text: double-tap a word; drag grab points for a block; tap selection for
// editing options; tap to place insertion point; pinch open with three fingers to paste.
// https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios
// Create and format notes: Format button for Heading, bold, italic and other styles. Neither iPhone
// page documents Paste and Match Style or a universal plain-text paste control. No tested absence claimed.
// Pinto sources opened today, paths relative to the repo root, one level above web/:
// Pane/Editor/MarkdownEditor.swift, Mac paste(_:) at line 3137: files and images first, then rich
// paste converted to Markdown, then pasteAsPlainText. No claim that every paste is plain.
// Pane/Model/RichPaste.swift, markdownFromPasteboard(): rich text becomes Markdown if the result
// differs from plain text. README.md, Features in detail: Markdown underneath, formatted on screen.
// Apple Notes look and behavior on iPhone and Mac, connected ChatGPT/Claude read and edit access,
// and Mac import that leaves Apple Notes unchanged: BRIEF.md's permitted Pinto facts.
// Models read: recipe, meeting notes, Cornell notes, budget, meal planner, code block, font,
// best-notes-app-for-mac, move-apple-notes-to-obsidian-notion-keep, import-your-notes,
// recover-deleted-apple-notes; shared PostPage, PostParts and PostCta.
// Pictures: none. All four body blog links checked in lib/posts.ts: draft: false.
// Registration description: "Paste into Apple Notes without the source styling on Mac. Find the
// shortcut, fix text already pasted, and see what Apple documents for iPhone."

const FAQ = [
  { q: "Which shortcut pastes matching text in Apple Notes on Mac?", a: [
    "Use Option-Shift-Command-V, or choose Edit, Paste and Match Style. The pasted text takes the surrounding style. If the shortcut differs on your keyboard, check the Edit menu.",
  ] },
  { q: "Does Apple document Paste and Match Style for iPhone Notes?", a: [
    "The iPhone text-editing and Notes formatting guides checked for this article do not document it. They describe ordinary paste and the Format controls. You can select pasted text and adjust its formatting, but those pages give no universal plain-text paste command.",
  ] },
  { q: "Why is pasted text still a heading after Paste and Match Style?", a: [
    "The command applies the surrounding style. If you paste into a heading, matching that style can still give you a heading. On Mac, use Shift-Command-B for Body at the insertion point before pasting again.",
  ] },
  { q: "How can I remove source styling from text already pasted in a Mac note?", a: [
    "Copy just the affected passage, then select that passage in the note. Apply Body with Shift-Command-B if you want body text, then choose Edit, Paste and Match Style to replace the selection.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-paste-without-formatting"
      intro={<>
        To paste without the source formatting in Apple Notes on Mac, choose Edit, Paste and Match Style,
        or press Option-Shift-Command-V. Apple&apos;s iPhone guides do not document an equivalent command.
      </>}
      answer={
        <Answer jump={[
          { href: "#mac", label: "Mac shortcut" },
          { href: "#already-pasted", label: "Fix pasted text" },
          { href: "#iphone", label: "On iPhone" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Pinto Notes" },
        ]}>
          <p>
            On Mac, Paste and Match Style makes copied text use the style around your cursor.
            Use Option-Shift-Command-V instead of Command-V. On iPhone, Apple documents ordinary
            paste and formatting controls, without giving the same match-style command.
          </p>
          <PostCta slug="apple-notes-paste-without-formatting" position="answer" title="Try notes written in Markdown">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac, with Markdown underneath.
              Its Mac editor converts supported rich text to Markdown and uses plain text as a fallback.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="mac">Paste without source formatting on Mac</h2>
      <Steps>
        <li>Select the text you want in the source document or page, then press Command-C.</li>
        <li>Open your note and click where the text should go.</li>
        <li>Choose Edit, Paste and Match Style, or press Option-Shift-Command-V.</li>
      </Steps>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Paste and Match Style"], keys: "⌥⇧⌘V" },
      ]} />
      <p>
        Apple&apos;s <a href="https://support.apple.com/en-us/guide/notes/not9474646a9/26/mac/26" rel="noopener">macOS 26
        Notes guide</a> documents this menu path. Its current <a href="https://support.apple.com/en-us/102553" rel="noopener">Mac
        copy-and-paste article</a> gives the shortcut. Check the Edit menu if your keyboard uses a different combination.
      </p>
      <p>
        For example, paste a paragraph from a recipe into your own cooking notes. Matching the surrounding
        style lets it read like the rest of your note, rather than keeping the recipe page&apos;s styling.
        To keep the source styling instead, Apple&apos;s Notes guide lists Edit, Paste and Retain Style.
      </p>

      <h2 id="already-pasted">Fix text you already pasted</h2>
      <p>
        Select only the passage you want to fix, so the replacement leaves the rest of the note alone.
      </p>
      <Steps>
        <li>Select the affected text and press Command-C to copy it.</li>
        <li>Keep that passage selected. If you want ordinary body text, press Shift-Command-B to apply Body.</li>
        <li>Choose Edit, Paste and Match Style to replace the selection with the copied text.</li>
      </Steps>
      <p>
        Apple lists Shift-Command-B in its <a href="https://support.apple.com/en-us/guide/notes/apd46c25187e/mac" rel="noopener">Notes
        keyboard shortcuts</a>. For changing a typeface or text size after pasting, see the separate
        <a href="/blog/apple-notes-font"> Apple Notes font guide</a>.
      </p>

      <h2 id="iphone">What Apple documents for iPhone</h2>
      <p>
        Apple&apos;s <a href="https://support.apple.com/en-us/guide/iphone/iph1a9cae52c/ios" rel="noopener">iPhone text-editing
        guide</a> explains how to select, copy and paste. It does not document Paste and Match Style.
        The <a href="https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios" rel="noopener">Notes formatting guide</a> gives
        controls for changing text after it is in a note.
      </p>
      <Steps>
        <li>Tap in the note to place the insertion point. Apple documents pinching open with three fingers to paste.</li>
        <li>To select pasted text, double-tap a word, then drag the grab points to include the passage.</li>
        <li>Tap the Format button and adjust the unwanted formatting, such as bold or italic, using its controls.</li>
      </Steps>
      <p>
        This lets you adjust the selected text. Apple&apos;s pages do not describe these controls as a single
        command that strips every source style. For a passage you want to paste with matching style,
        use the Mac command when you have access to Notes on a Mac.
      </p>

      <h2 id="limits">Where matching the style stops</h2>
      <p>
        Paste and Match Style uses the destination&apos;s style. If the cursor is in a heading, the pasted
        text can still look like a heading. On Mac, apply Body with Shift-Command-B before pasting
        when you want a paragraph of ordinary text.
      </p>
      <p>
        Check the result before replacing a long passage. Decide whether you want to keep its links or
        list structure as well as its words. For snippets that need their own text style,
        <a href="/blog/apple-notes-code-block"> Monostyled in Apple Notes</a> is a separate formatting choice.
      </p>
      <p>
        If a paste command is dimmed, Apple says the app cannot use that action with the current item
        or location. Click in the note&apos;s text and copy a text selection before trying again.
      </p>

      <h2 id="pinto-notes">How Pinto Notes handles pasted text</h2>
      <p>
        Pinto Notes stores the note&apos;s text as Markdown and displays it formatted on screen.
        On Mac, its editor handles files and images first. It then tries to convert rich text to Markdown.
        If that route produces no Markdown, the editor falls back to pasting plain text.
      </p>
      <p>
        Rich pastes can preserve structure through Markdown, so check what arrives in your note.
        This describes the Mac editor&apos;s behavior. If unwanted source styling is your only problem,
        try Apple Notes&apos; Mac command first.
      </p>
      <p>
        If you also want ChatGPT or Claude to read and edit your notes, Pinto supports that
        <a href="/blog/connect-chatgpt-to-your-notes"> once connected</a>. Your Apple Notes come over in
        <a href="/blog/move-from-apple-notes"> one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
