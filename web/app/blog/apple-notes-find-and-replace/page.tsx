import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-find-and-replace", { title: "Apple Notes find and replace on Mac and iPhone" });

// Written 21 November 2026 for "apple notes find and replace", research 2026-11-22 row 22.
// Google autocomplete rechecked live 21 November 2026, client=firefox, hl=en, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=apple%20notes%20find%20and%20replace
// Returned: apple notes find and replace; ios notes find and replace; iphone notes find and replace;
// mac notes find and replace; apple notes app find and replace; ios notes search and replace;
// iphone notes search and replace; ios notes app find and replace; does apple notes have find and replace;
// how to find and replace in notes. Also rechecked iphone notes find and replace and mac notes find and replace.
// Research row variants include "does apple notes have find and replace"; its not-working suffix returned none.
// Apple sources read live today, directly fetched where web access failed:
// https://support.apple.com/en-us/guide/notes/search-your-notes-not18ab658ed/mac
// Documents Command-F, then entering text, for search inside one note; search across accounts is separate.
// https://support.apple.com/en-us/guide/iphone/iphb8628c6b8/ios
// Documents Note Actions, Find in Note, Search button for options, then entering the search text.
// Neither current Notes search guide specifies replacement controls. This is a documentation gap,
// not evidence that Notes lacks Find and Replace. No unverified replacement menu path is supplied.
// https://support.apple.com/en-us/guide/notes/not9474646a9/mac
// Documents editing, copying and pasting text, and File, Duplicate Note. Duplicating shared notes
// makes an unshared copy; locked notes cannot be duplicated. Those exceptions are outside this article.
// https://support.apple.com/en-us/guide/iphone/iph1a9cae52c/ios
// Documents double-tap word selection, selection handles and editing selected text.
// https://support.apple.com/en-us/guide/textedit/find-and-replace-text-txtef6cfde1a/mac
// TextEdit only: Edit, Find, Find; Replace checkbox; Replace field; Replace and All buttons; Done.
// These TextEdit instructions are explicitly a separate route for a copy of ordinary text.
// Pinto claims: BRIEF.md verified facts for Apple Notes appearance/behavior on iPhone and Mac,
// connected ChatGPT/Claude read/edit access, every earlier version kept, Mac import leaves Apple Notes unchanged.
// Opened ../supabase/functions/mcp/files_tools.ts: search/fetch/edit schemas at lines 46/77/99;
// replaceIn at line 602 and edit handler at line 1097 confirm exact strings, one path per call,
// replace_all within that path, and reading the current version before editing. Cross-note rename
// is a proposed sequence of AI tool calls, not a built-in global Replace All. No Pinto iPhone replace UI claim.
// Pictures: none. Body blog links verified live in lib/posts.ts, all draft: false.
// Registration description: Find text in Apple Notes on Mac and iPhone, see what Apple's guides document,
// and use a checked replacement workflow for one note or several.

const RENAME = `In my Launch folder in Pinto Notes, find notes containing "Harbor pilot".
Read each matching note and show me the passages you would change to "Harbor preview".
Leave old meeting quotations and web addresses unchanged. Do not edit anything yet.
After I approve the passages, update those notes and list the notes you changed.`;

const FAQ = [
  { q: "What does Apple document for find and replace in Notes?", a: [
    "Apple's current Notes guides document Command-F inside a note on Mac and Note Actions, Find in Note on iPhone. They do not spell out replacement controls. That gap does not establish that Notes lacks Find and Replace.",
  ] },
  { q: "Which search opens inside a single Apple Note on Mac?", a: [
    "Open the note and press Command-F, then enter the text. Apple's guide separates this from the search field used to find notes across an account.",
  ] },
  { q: "Where is Find in Note on an iPhone?", a: [
    "Open a note, tap the Note Actions button, then Find in Note. Apple's guide says the Search button inside that view opens search options. Enter the text you want to locate.",
  ] },
  { q: "Can a connected AI rename a phrase across Pinto notes?", a: [
    "Yes. Once connected, ChatGPT or Claude can search and read matching notes, then edit each one. Pinto's edit tool replaces exact text in one named note per call. Updating several notes takes several edits.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-find-and-replace"
      intro={<>
        To find text inside an Apple Note, press Command-F on Mac or choose Note Actions, Find in Note on iPhone.
        Apple&apos;s current Notes guides explain search, but don&apos;t spell out the replacement controls.
      </>}
      answer={
        <Answer jump={[
          { href: "#mac", label: "Find on Mac" },
          { href: "#iphone", label: "Find on iPhone" },
          { href: "#replace", label: "Bulk replacement route" },
          { href: "#limits", label: "Several notes" },
          { href: "#pinto-notes", label: "Rename with an AI" },
        ]}>
          <p>
            Start with Command-F inside the note on Mac, or Note Actions, Find in Note on iPhone.
            You can edit the wording you find by hand. For a bulk replacement with a button sequence Apple documents,
            work on a copy of the text in TextEdit on Mac using its Replace checkbox and All button.
          </p>
          <PostCta slug="apple-notes-find-and-replace" position="answer" title="Rename a term across several notes">
            <p>In Pinto Notes, a connected ChatGPT or Claude can find a phrase and edit each matching note. Every earlier version is kept.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="mac">Find text inside an Apple Note on Mac</h2>
      <Steps>
        <li>Open the note you want to check.</li>
        <li>Press Command-F to open its search field.</li>
        <li>Enter the word or phrase you want to find.</li>
      </Steps>
      <MenuPaths rows={[{ on: "Mac", steps: ["Open a note", "Search inside the note"], keys: "⌘F" }]} />
      <p>
        This is the route in Apple&apos;s <a href="https://support.apple.com/en-us/guide/notes/search-your-notes-not18ab658ed/mac" rel="noopener">Notes search guide for Mac</a>.
        Searching inside a note is separate from finding notes across your account.
        Use the phrase you actually want to change, such as &ldquo;Harbor pilot&rdquo; instead of just &ldquo;Harbor&rdquo;.
      </p>
      <p>
        The guide doesn&apos;t give the replacement controls or a replacement shortcut. That does not mean Notes lacks
        Find and Replace. It means those controls aren&apos;t verified by this page. For a few corrections, edit the
        matching wording in the note. For the documented bulk route below, use a copy of the text in TextEdit.
      </p>

      <h2 id="iphone">Find text in Apple Notes on iPhone</h2>
      <Steps>
        <li>Open the note, then tap the Note Actions button.</li>
        <li>Tap Find in Note.</li>
        <li>Enter the word or phrase. The Search button in this view opens search options.</li>
      </Steps>
      <MenuPaths rows={[{ on: "iPhone", steps: ["Note Actions", "Find in Note"] }]} />
      <p>
        Apple documents these steps in <a href="https://support.apple.com/en-us/guide/iphone/iphb8628c6b8/ios" rel="noopener">Search through your notes on iPhone</a>.
        That page describes finding text inside one note, without giving a Find and Replace button sequence.
      </p>
      <p>
        For a manual correction, return to editing the note. Double-tap a word to select it, adjust the selection
        handles for a phrase and type the new wording. Apple explains selection in its{" "}
        <a href="https://support.apple.com/en-us/guide/iphone/iph1a9cae52c/ios" rel="noopener"> iPhone text editing guide</a>.
        Check the sentence around each match before changing it.
      </p>

      <h2 id="replace">A documented bulk replacement route on Mac</h2>
      <p>
        For a long passage of ordinary text, you can do the replacement in TextEdit and copy the revised passage back.
        Keep the original note until you have checked the result. This workflow is for text;
        it is not a way to transfer a note&apos;s attachments or preserve a complex layout.
      </p>
      <Steps>
        <li>Copy the passage from Notes into a TextEdit document.</li>
        <li>In TextEdit, choose Edit, Find, Find and enter the old phrase.</li>
        <li>Select the Replace checkbox beside Done. Enter the new phrase in the Replace field below Find.</li>
        <li>Click Replace for one match, or All to replace all matches in that TextEdit document.</li>
        <li>Click Done. Read the revised passage, then copy it back into the intended place in your note.</li>
      </Steps>
      <MenuPaths rows={[{ on: "TextEdit on Mac", steps: ["Edit", "Find", "Find", "Replace checkbox"] }]} />
      <p>
        These controls come from Apple&apos;s <a href="https://support.apple.com/en-us/guide/textedit/find-and-replace-text-txtef6cfde1a/mac" rel="noopener">TextEdit find and replace guide</a>.
        Its button is called All. The steps above describe TextEdit, and should not be read as Notes menu names.
      </p>

      <h2 id="limits">Where it stops: changing several notes</h2>
      <p>
        Finding every note that mentions a name and changing that name are separate jobs.
        The Apple Notes search guides checked here don&apos;t document a single replacement command across notes.
        Search for the old phrase, open each relevant note and check the context before editing it.
      </p>
      <p>
        A project rename might belong in a current plan while an old meeting quotation should keep its original wording.
        Write down which notes need changing before you start. If search can&apos;t locate a note you know exists,
        follow the <a href="/blog/apple-notes-search-not-working">Apple Notes search checks</a> first.
      </p>

      <h2 id="pinto-notes">Rename a phrase across notes with a connected AI</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once{" "}
        <a href="/blog/connect-chatgpt-to-your-notes"> ChatGPT or Claude is connected</a>, it can search your notes,
        read the matches and replace text in each note. A useful first request is to ask for the proposed changes.
      </p>
      <Keep title="A rename request for your connected AI" text={RENAME}
        note="Change the folder and phrases to match your notes. This is a suggested workflow, not an automatic rename rule." />
      <p>
        Pinto&apos;s edit tool replaces exact text in one named note. It can replace every occurrence within that note,
        and requires the AI to read the current version before editing. Changing several notes means searching,
        reading and editing each one. This is an AI workflow with separate edits for each note.
      </p>
      <p>
        After reviewing the proposed passages, tell the AI which changes to make. Read the resulting notes and check
        any exceptions you named. Every earlier version is kept, as explained in the{" "}
        <a href="/blog/apple-notes-version-history"> note history guide</a>.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>,
        and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
