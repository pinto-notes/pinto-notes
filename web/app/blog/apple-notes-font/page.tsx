import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-font", { title: "Apple Notes font: change size, style and color" });

// Written 21 November 2026 for "apple notes font". Google autocomplete read live today, en-US, using
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=apple+notes+font
// and each of these queries: apple notes font size, apple notes font size change, apple notes font change,
// apple notes font color, apple notes font style. Results include those six queries, apple notes font name,
// apple notes font size increase, mac notes font size, iphone notes text size, and what font does apple notes use.
// BRIEF-wave4 supplies this topic; no apple-notes-font row was found in topic-research-2026-11-20.md.
// Apple pages read live today:
// https://support.apple.com/en-us/guide/notes/apd1955d3b21/mac (Format notes on Mac): Format button for styles;
// Control-click selected text, Font, Show Fonts; highlight button and adjacent colored circle; paragraph styles
// require iCloud notes or notes stored on the Mac. Some features are unavailable with other account providers.
// https://support.apple.com/guide/mac-help/mchlp2544/mac (Format text in documents with fonts on Mac): Fonts window
// typeface and size controls; Text Color color well opens the Colors window. No TextEdit-only steps used.
// https://support.apple.com/guide/notes/apd97da26aed/mac (Change settings in Notes on Mac): Notes, Settings;
// New notes start with chooses the first paragraph style; Default text size sets the preferred size.
// https://support.apple.com/guide/notes/apd8b73d28be/mac (View your notes in Notes on Mac): Default text size slider
// changes text size in every note; View, Zoom In or Zoom Out changes the view of one note.
// https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios (Create and format notes on iPhone): Format button,
// Heading, bold, italic and highlight; select heading text, Format, Heading or Subheading for sections.
// https://support.apple.com/guide/iphone/iph3c076905a/ios (Make text easier to read on iPhone): Settings,
// Accessibility, Display & Text Size, Larger Text; slider, Larger Accessibility Sizes and Bold Text; includes Notes.
// https://support.apple.com/guide/iphone/iph1f48544ab/ios (Customize visual accessibility settings for specific apps
// on iPhone): Accessibility, Per-App Settings, Add App, choose an app, then its name for text size settings.
// Pinto: apple-notes-custom-look does not exist in this worktree. All claims use BRIEF.md's Pinto facts and
// BRIEF-compare.md: Apple Notes look and behavior on iPhone and Mac; connected ChatGPT or Claude reads and edits;
// every earlier version is kept; Markdown files; Apple Notes import on Mac leaves Apple Notes unchanged.
// Pictures: none. No claim about Pinto font, color, theme or accessibility controls.
// Registration copy for the lead: description "Change Apple Notes font size on iPhone and Mac, choose a different
// font on Mac, and find the settings for text styles, color and larger text."

const FAQ = [
  { q: "How do I change font size in Apple Notes on iPhone?", a: [
    "Go to Settings, Accessibility, Display & Text Size, Larger Text and move the slider. Turn on Larger Accessibility Sizes for more sizes. To adjust Notes separately, add it under Settings, Accessibility, Per-App Settings.",
  ] },
  { q: "Can I choose a different font in Apple Notes on Mac?", a: [
    "Yes. Select the text, Control-click it and choose Font, Show Fonts. Choose a typeface in the Fonts window. This formats the selected text. The Default text size setting is a separate control for how large notes appear.",
  ] },
  { q: "How do I change Apple Notes font color?", a: [
    "On a Mac, select text, Control-click it and choose Font, Show Fonts. Click the Text Color control and choose a color in the Colors window. Apple's iPhone Notes guide documents highlighting, without giving this same color-picker route.",
  ] },
  { q: "Why does a new Apple Note start in large text?", a: [
    "On a Mac, check Notes, Settings, New notes start with. That setting chooses the paragraph style at the beginning of a new note. Default text size is separate and sets your preferred text size across notes.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-font"
      intro={<>
        On a Mac, select text, Control-click it and choose Font, Show Fonts to change its font.
        On iPhone, use the Format button for styles or Display &amp; Text Size in Settings for larger text.
      </>}
      answer={
        <Answer jump={[
          { href: "#mac-font", label: "Change the font" },
          { href: "#mac-size", label: "Mac text size" },
          { href: "#iphone-size", label: "iPhone text size" },
          { href: "#color", label: "Color and highlighting" },
        ]}>
          <p>
            Apple Notes on Mac lets you choose a font for selected text through Font, Show Fonts.
            For larger text across notes, use Notes, Settings, Default text size on Mac, or Settings,
            Accessibility, Display &amp; Text Size, Larger Text on iPhone. Use the Format button inside a
            note for headings, bold or italic text.
          </p>
          <PostCta slug="apple-notes-font" position="answer" title="Let ChatGPT or Claude work in your notes">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read and edit your notes, and every earlier version is kept.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="mac-font">Change the Apple Notes font on a Mac</h2>
      <MenuPaths rows={[
        { on: "Selected text", steps: ["Control-click", "Font", "Show Fonts"] },
      ]} />
      <Steps>
        <li>Open the note and select the text you want to change.</li>
        <li>Control-click the selection, then choose Font, Show Fonts.</li>
        <li>Choose a typeface and size in the Fonts window.</li>
      </Steps>
      <p>
        This changes your selection. Apple documents the route in{" "}
        <a href="https://support.apple.com/guide/notes/apd1955d3b21/mac" rel="noopener">Format notes on Mac</a>.
        For a heading or bold text, use the note&apos;s Format button instead.
      </p>

      <h2 id="mac-size">Make text bigger in every note on Mac</h2>
      <MenuPaths rows={[
        { on: "Every note", steps: ["Notes", "Settings", "Default text size"] },
        { on: "One note", steps: ["View", "Zoom In"] },
      ]} />
      <p>
        Open Notes, Settings and drag the Default text size slider. Apple describes this as changing
        the size of text in every note. For one note, use View, Zoom In or View, Zoom Out, as described in{" "}
        <a href="https://support.apple.com/guide/notes/apd8b73d28be/mac" rel="noopener">View your notes in Notes on Mac</a>.
      </p>
      <p>
        To change how new notes begin, use New notes start with in the same Settings window.
        That chooses the first paragraph&apos;s style. It is separate from Default text size.
        Apple lists both in <a href="https://support.apple.com/guide/notes/apd97da26aed/mac" rel="noopener">Notes settings</a>.
      </p>

      <h2 id="iphone-size">Change Apple Notes font size on iPhone</h2>
      <MenuPaths rows={[
        { on: "Larger text", steps: ["Settings", "Accessibility", "Display & Text Size", "Larger Text"] },
        { on: "Notes separately", steps: ["Settings", "Accessibility", "Per-App Settings", "Add App", "Notes"] },
      ]} />
      <Steps>
        <li>Open Settings, then Accessibility, Display &amp; Text Size.</li>
        <li>Tap Larger Text and move the slider to a comfortable size.</li>
        <li>For more sizes, turn on Larger Accessibility Sizes.</li>
      </Steps>
      <p>
        This sets a preferred size for supported apps, including Notes. Bold Text is another option
        in Display &amp; Text Size. Apple explains these controls in{" "}
        <a href="https://support.apple.com/guide/iphone/iph3c076905a/ios" rel="noopener">Make text easier to read on iPhone</a>.
      </p>
      <p>
        To adjust Notes separately, open Settings, Accessibility, Per-App Settings. Tap Add App,
        choose Notes, then tap Notes to open its settings. Apple documents app-specific text size in{" "}
        <a href="https://support.apple.com/guide/iphone/iph1f48544ab/ios" rel="noopener">Per-App Settings</a>.
      </p>

      <h2 id="styles">Use headings and text styles on iPhone</h2>
      <p>
        In a note, tap the Format button for styles such as Heading, bold or italic text.
        For a section heading, select its text, tap Format, then choose Heading or Subheading.
        Apple describes this in <a href="https://support.apple.com/guide/iphone/iph1ac0b3a2/ios" rel="noopener">Create and format notes on iPhone</a>.
      </p>
      <p>
        Use a heading to label a section, such as Ingredients above a recipe&apos;s checklist.
        Use the accessibility settings above when the whole note is too small to read.
        The <a href="/blog/apple-notes-templates">Apple Notes templates guide</a> has layouts you can copy.
      </p>

      <h2 id="color">Change font color or highlight text</h2>
      <p>
        On Mac, select text and open Font, Show Fonts through Control-click. In the Fonts window,
        click the Text Color control, then choose a color in the Colors window. Apple describes
        that control in <a href="https://support.apple.com/guide/mac-help/mchlp2544/mac" rel="noopener">Format text with fonts on Mac</a>.
      </p>
      <p>
        For highlighting on Mac, select text, click Format, then the highlight button.
        The colored circle beside it lets you choose a highlight color. On iPhone, Apple lists
        highlight among the Format options. Its iPhone guide does not give the Mac&apos;s font color-picker steps.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        Apple&apos;s iPhone instructions cover text styles and display size. They do not describe
        a typeface picker like the Mac&apos;s Fonts window. Apple also notes that some Mac formatting
        depends on the account. Paragraph styles need iCloud notes or notes stored on your Mac.
      </p>

      <h2 id="pinto-notes">If you also want AI to work in your notes</h2>
      <p>
        Pinto Notes is a notes app for iPhone and Mac that looks and works like Apple Notes.
        It keeps notes as Markdown files and saves every earlier version. Once you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, either can read and edit your notes.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>,
        and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
