import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-code-block", { title: "Apple Notes code block: Monostyled and shortcuts" });

// Written 21 November 2026 for "apple notes code block", topic-research-2026-11-20.md row 8.
// Google autocomplete read live 21 November 2026, en-US, via suggestqueries.google.com/complete/search:
// apple notes code block (syntax highlighting, shortcut, reddit), mac notes code block,
// ios notes code block, iphone notes code block, mac notes code block shortcut,
// apple notes add code block, apple notes app code block; apple notes code block shortcut
// (mac notes code block shortcut, apple notes keyboard shortcuts); apple notes syntax highlighting
// (apple notes code syntax highlighting, apple notes code highlight, apple notes code block syntax highlighting,
// can i highlight text in apple notes, how do you highlight on apple notes, can you highlight in apple notes);
// apple notes monospaced (apple notes monospace, apple notes monospace font, apple notes font size,
// can you get lines on apple notes, apple notes increase font size, can you sort in apple notes);
// apple notes block quote (apple notes block quote shortcut, can you get lines on apple notes,
// does apple notes support markdown).
// Official Apple sources read live 21 November 2026, fetched directly when web open returned 429:
// https://support.apple.com/en-us/guide/notes/apd1955d3b21/mac
// Format notes on Mac: Format button for styles, including block quote; paragraph styles need iCloud
// notes or notes stored on the Mac. The guide also distinguishes manual text highlighting.
// https://support.apple.com/en-us/guide/notes/apd46c25187e/mac
// Keyboard shortcuts: Monostyled Shift-Command-M, Block Quote Command-', Body Shift-Command-B;
// shortcuts can vary with keyboard language and layout.
// https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios
// Create and format notes on iPhone: Format button opens styles; swipe the format bar for common styles.
// https://www.apple.com/mideast/ios/ios-17/a/pdf/iOS_All_New_Features_en-AE.pdf, page 8:
// Monospaced was updated to Monostyled, inset text with a background; Block Quote has a quote bar.
// The iPhone paths combine the current guide's Format route with the names in Apple's feature guide;
// the current iPhone page does not enumerate those two styles. No dedicated Code Block command or
// syntax highlighting is documented on the formatting and shortcut pages checked, not a tested absence.
// Models read: apple-notes-vs-obsidian and apple-notes-not-working; template structure from recipe,
// meeting notes and Cornell notes. Pinto claims: Code Block and Callout names, slash at line start,
// and availability on both platforms from Pane/Editor/SlashCommands.swift, relative to the repo root.
// Looks and works like Apple Notes on iPhone and Mac, AI access once connected, and unchanged Apple
// Notes after Mac import: BRIEF.md's verified Pinto facts. No syntax highlighting claim for Pinto.
// Pictures: none. Body blog links checked in lib/posts.ts; all have draft: false.

const SNIPPET = `{
  "timeoutSeconds": 30,
  "retryCount": 2
}`;

const FAQ = [
  { q: "What is the closest thing to a code block in Apple Notes?", a: [
    "Monostyled text. It uses a monospace font with inset text and a distinct background. Apple's formatting guides document this style and Block Quote, but no dedicated Code Block command or syntax highlighting.",
  ] },
  { q: "Which Mac shortcut formats a snippet in Apple Notes?", a: [
    "Select the snippet and press Shift-Command-M to apply Monostyled. Apple lists Command-apostrophe for Block Quote and Shift-Command-B for Body. These are text styles, not a documented syntax-highlighting mode.",
  ] },
  { q: "Why is Monospaced called Monostyled in Apple Notes?", a: [
    "Apple's iOS 17 feature guide says Monospaced formatting was updated to Monostyled, with inset text and a distinct background. Look for Monostyled when an older tip tells you to choose Monospaced.",
  ] },
  { q: "Does an Apple Notes block quote color code by language?", a: [
    "Apple describes Block Quote as a way to offset writing with a quote bar. It does not document syntax highlighting for it. Use it for a quoted passage; Monostyled is the relevant style for a code snippet.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-code-block"
      intro={<>For a code snippet in Apple Notes, use Monostyled. Apple documents that style and Block Quote, but no dedicated Code Block command or syntax highlighting.</>}
      answer={
        <Answer jump={[
          { href: "#mac", label: "Mac shortcut" },
          { href: "#iphone", label: "On iPhone" },
          { href: "#block-quote", label: "Block Quote" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Pinto Notes" },
        ]}>
          <p>
            On a Mac, select your code and press Shift-Command-M for Monostyled, the style previously called Monospaced.
            On iPhone, open the Format controls and choose Monostyled. This gives the snippet its own formatting;
            Apple&apos;s guides don&apos;t document language-aware syntax highlighting.
          </p>
          <PostCta slug="apple-notes-code-block" position="answer" title="Want a Code Block command?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac, with Code Block and Callout in its / menu.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="mac">Format a code snippet on a Mac</h2>
      <p>
        Monostyled uses a monospace font, with inset text and a distinct background. It gives a short configuration
        example or command a separate place in the note. Apple&apos;s current shortcut guide calls it Monostyled.
      </p>
      <Steps>
        <li>
          <strong>Paste the snippet into a note.</strong>
          Keep your explanation above or below it, so you can select just the code.
        </li>
        <li>
          <strong>Select the code and apply Monostyled.</strong>
          Open the Format button in the toolbar and choose Monostyled, or press Shift-Command-M.
        </li>
        <li>
          <strong>Use Body for the explanation.</strong>
          Select the prose and press Shift-Command-B to give it the Body style.
        </li>
      </Steps>
      <MenuPaths rows={[
        { on: "Mac, snippet", steps: ["Format button", "Monostyled"], keys: "⇧⌘M" },
        { on: "Mac, prose", steps: ["Format button", "Body"], keys: "⇧⌘B" },
      ]} />
      <p>
        These shortcuts come from Apple&apos;s <a href="https://support.apple.com/en-us/guide/notes/apd46c25187e/mac" rel="noopener">Notes
        keyboard shortcut guide</a>. Apple says they can vary with your keyboard language and layout. For paragraph
        styles on a Mac, use iCloud notes or notes stored on the Mac.
      </p>
      <Keep title="A small snippet to try" text={SNIPPET} code
        note="Paste this example into Notes, select it, then apply Monostyled. The code formatting on this web page does not show Apple Notes." />

      <h2 id="iphone">Use Monostyled on iPhone</h2>
      <p>
        In your note, select the snippet, tap the Format button and choose Monostyled. Apple&apos;s
        <a href="https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios" rel="noopener"> iPhone formatting guide</a> describes
        the Format controls and says you can swipe over the format bar options to reach commonly used styles.
      </p>
      <MenuPaths rows={[{ on: "iPhone", steps: ["Select text", "Format button", "Monostyled"] }]} />
      <p>
        If you&apos;re following an older guide that says Monospaced, look for Monostyled. Apple explains the name change
        in its <a href="https://www.apple.com/mideast/ios/ios-17/a/pdf/iOS_All_New_Features_en-AE.pdf" rel="noopener">iOS 17 feature guide</a>.
        That is also where Apple describes the inset text and background.
      </p>

      <h2 id="block-quote">Block Quote is for quoted text</h2>
      <p>
        Block Quote offsets a passage with a quote bar. Use it for wording copied from documentation, then keep your
        own explanation outside the quote. For the code itself, choose Monostyled.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Select text", "Format button", "Block Quote"], keys: "⌘'" },
        { on: "iPhone", steps: ["Select text", "Format button", "Block Quote"] },
      ]} />
      <p>
        Apple&apos;s <a href="https://support.apple.com/en-us/guide/notes/apd1955d3b21/mac" rel="noopener">Mac formatting guide</a> puts
        block quotes among the styles in the Format controls. Its shortcut guide lists Command-apostrophe.
        For other ways to organize the text around a snippet, see <a href="/blog/apple-notes-tips">Apple Notes tips for iPhone and Mac</a>.
      </p>

      <h2 id="limits">Where it stops: syntax highlighting</h2>
      <p>
        Apple&apos;s formatting and shortcut guides document Monostyled and Block Quote. They don&apos;t document a
        dedicated Code Block command or syntax highlighting that recognizes a programming language.
        Monostyled is a useful way to keep a small snippet beside your notes, but those pages don&apos;t describe a code editor.
      </p>
      <p>
        Notes also has manual text highlighting. That lets you mark selected text with a color. It is a different task
        from having an editor recognize keywords and strings in code. Keep a runnable copy in your project and use the
        note to explain what the snippet does or why you saved it.
      </p>

      <h2 id="pinto-notes">Code Block and Callout in Pinto Notes</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. Type / at the start of a line to open its menu,
        then choose Code Block for a snippet or Callout for a warning beside it. Both commands are in the menu on iPhone and Mac.
      </p>
      <p>
        If you also want an AI to read and edit your notes, Claude Code and Codex can do that once connected.
        <a href="/blog/notes-in-claude-code-and-codex"> Your notes in Claude Code and Codex</a> explains the connection.
      </p>
      <p>
        Your existing Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>,
        and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
