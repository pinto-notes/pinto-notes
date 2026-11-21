import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("mem-ai-alternative-for-mac-and-iphone", {
  title: "Mem AI alternative for Mac and iPhone: Pinto Notes",
});

// Written 21 November 2026 for "mem ai alternative", topic-research-2026-11-24.md row 2.
// Google autocomplete rechecked today by direct HTTPS, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=mem%20ai%20alternative
// Full response suggestions: mem ai alternatives; mem ai alternatives reddit; mem ai open source
// alternative; ai alternative; ai alternative free; ai sound alternatives. The final three are
// unrelated noise. These match research appendix A2; no Mac/iPhone-specific demand is claimed.
// Maker pages read live today:
// https://help.mem.ai/migration confirms read-only notes on 18 December 2026, closure on
// 15 January 2027, continued reading/export until closure, and re-exporting after later edits.
// https://help.mem.ai/migration/save-a-copy supplies Settings, Exports, Start new export,
// My Computer, Next, Start export, Download; notes/, collections/, attachments/ and the optional
// export-report.md; available transcripts by default, audio recordings by export option.
// https://help.mem.ai/features/chat documents built-in note creation, editing and retrieval.
// https://help.mem.ai/features/collections documents multiple collections per note.
// No numeric Mem prices used. No Apple Notes instructions or feature limits asserted.
// Pinto sources opened in the wave9 checkout, paths relative to its repo root:
// BRIEF.md and README.md:15-26, 62-75 supply Apple Notes feel, free Mac/iPhone apps,
// approved ChatGPT/Claude reading and editing, and earlier versions kept.
// BRIEF-compare.md supplies Mac/iPhone only, no Windows, Android or web app.
// web/app/blog/import-your-notes/page.tsx supplies the generic route verbatim:
// "a folder or .zip of Markdown or text files. Each folder becomes a folder."
// Pane/Model/MarkdownImport.swift:6-21, 30-60, 176-187, 232-256 confirms Markdown/text,
// folder/ZIP input and extension-based note classification. Index/report files becoming extra
// notes is an inference from that classification, not a tested Mem migration result.
// Pane/Views/ImportSheet.swift:6-23 lists import kinds, none for Mem, and the menu label.
// web/app/blog/connect-chatgpt-to-your-notes/page.tsx verified header confirms one Allow
// grants reading and editing. supabase/functions/mcp/files_tools.ts:46-110 confirms search,
// fetch and edit tools. Pane/Model/NoteHistory.swift:338-365 confirms version restore.
// This is a format-based trial, not a fresh Mem export/import test. Collection membership,
// internal links, dates, formatting, attachments and meeting audio preservation are unverified.
// Pictures: none. Both body blog links and inbound source have draft: false in lib/posts.ts.

const IMPORT_CHECK = `Mem trial import
- [ ] Compare the full text of a long note with the original
- [ ] Check a table and a checklist
- [ ] Follow a link to another note
- [ ] Open a picture and a PDF
- [ ] Compare creation and modification dates
- [ ] Check a note that belonged to two collections
- [ ] Find the meeting transcript and play the saved recording separately
- [ ] Account for collection indexes or reports imported as extra notes
- [ ] Open the imported notes on iPhone
- [ ] Keep the original Mem ZIP and extracted folder`;

const FAQ = [
  { q: "What are Mem's read-only and shutdown dates?", a: [
    "Mem's migration guide, checked 21 November 2026, says notes become read-only on 18 December 2026. You can read and export until the service closes on 15 January 2027. Save your export before then.",
  ] },
  { q: "Does Pinto Notes have a dedicated Mem importer?", a: [
    "No. On a Mac, use Import Markdown or Text with a folder or .zip of Markdown or text files. Mem exports Markdown, so this is a format-based route to try. Check a small sample before importing the full library.",
  ] },
  { q: "Will Mem collections become the same collections in Pinto?", a: [
    "That is not verified. Pinto's general importer follows folders in the export. Check a note that belonged to more than one Mem collection, and keep the collection indexes with your original export.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="mem-ai-alternative-for-mac-and-iphone"
      intro={<>Mem says notes become read-only on 18 December 2026 and its service closes on 15 January 2027. Pinto Notes is a Mem AI alternative for Mac and iPhone to try with a copy of your Markdown export.</>}
      answer={
        <Answer jump={[
          { href: "#save", label: "Save your export" },
          { href: "#fit", label: "Is Pinto a fit?" },
          { href: "#import", label: "Try an import" },
          { href: "#check", label: "Check the result" },
          { href: "#pinto-notes", label: "Connect your AI" },
        ]}>
          <p>
            Save your library before the deadline in <a href="https://help.mem.ai/migration">Mem&apos;s migration guide</a>.
            Try Pinto Notes if you want Apple Notes-style editing with connected ChatGPT or Claude access.
            There is no dedicated Mem importer, so test its Markdown export through Pinto&apos;s general import and keep the original ZIP.
          </p>
          <PostCta slug="mem-ai-alternative-for-mac-and-iphone" position="answer" title="Try a few Mem notes in Pinto Notes">
            <p>Download Pinto Notes free on your Mac and import a small working copy first. Connect ChatGPT or Claude when you want it to read and edit those notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="save">Save a copy before choosing your next app</h2>
      <p>
        You can export now and decide where to move later. If you keep editing in Mem, make a fresh export before notes become
        read-only. Label each download with its date so you know which copy includes your latest work.
      </p>
      <Steps>
        <li>On your computer, sign in to Mem and open Settings, Exports.</li>
        <li>Click Start new export. Choose My Computer, then Next, review the options and click Start export.</li>
        <li>Return to Exports. When it is ready, click Download and save the ZIP.</li>
      </Steps>
      <p>
        Mem&apos;s <a href="https://help.mem.ai/migration/save-a-copy">download guide</a> describes a <code>notes/</code> folder
        with one Markdown file per note, <code>collections/</code> with collection indexes, and <code>attachments/</code> with
        available referenced files. Keep those folders together. Read <code>export-report.md</code> if present for missing items.
      </p>
      <p>
        Available meeting transcripts are included by default. Select the audio recordings option if you want the sound too.
        Keep both the original ZIP and its extracted folder. A meeting note alone does not establish that you saved the recording.
      </p>

      <h2 id="fit">What you liked about Mem still matters</h2>
      <p>
        Mem already has <a href="https://help.mem.ai/features/chat">built-in chat for creating, editing and finding notes</a>.
        Its <a href="https://help.mem.ai/features/collections">collections</a> let one note belong to several groups.
        AI access alone is not a reason to prefer Pinto. Choose it if you want an app that looks and works like Apple Notes,
        with ChatGPT or Claude connected separately.
      </p>
      <p>
        If your current work depends on Mem&apos;s chat and collections, staying while you check a replacement may make sense.
        Export now, then plan to finish the move before closure. Test your usual tasks in the new app as well as the imported text.
      </p>
      <p>
        Pinto Notes runs on Mac and iPhone only. It has no Windows, Android or web app.
        If you need to open your notes on a Windows work computer or an Android phone, choose a destination that covers those devices.
      </p>

      <h2 id="import">Try Pinto&apos;s Markdown import on a Mac</h2>
      <p>
        Unpack the Mem ZIP and duplicate the extracted folder. In that working copy, keep a few note files for the trial and
        remove the others. Keep the folder layout and attachment files together so the trial can test relative links.
        Include a note with a table and one that links to another note you kept.
      </p>
      <p>
        Open Pinto Notes&apos; File menu and find Import Markdown or Text. Choose the working folder and follow the import steps.
        The route in <a href="/blog/import-your-notes">Import your notes</a> accepts a folder or .zip of Markdown or text files.
        Each folder becomes a folder.
      </p>
      <p>
        That follows the export&apos;s folders. It does not establish that Mem&apos;s collection membership transfers.
        Markdown collection indexes and an export report may appear as extra notes, so compare the imported list with the
        actual note files you selected. This guide has not tested a fresh Mem export in Pinto.
      </p>

      <h2 id="check">Compare the copies before moving everything</h2>
      <p>
        Open a familiar note in Mem beside its imported copy. Read through it, including the bottom of a long note.
        Check the parts you use daily before deciding to bring over the rest.
      </p>
      <Keep title="A check for your Mem import" text={IMPORT_CHECK}
        note="Use the items relevant to your library. Record anything missing beside the source filename." />
      <p>
        A successful text import does not prove that dates or attachments transferred correctly. Check each separately.
        For collection membership, compare a note you used in two places. For meetings, check the transcript and saved audio
        separately from the written note. Leave any unverified files in your archive while you decide how to use them.
      </p>

      <h2 id="pinto-notes">Use the imported notes with ChatGPT or Claude</h2>
      <p>
        Once the import looks right, <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and choose Allow
        in Pinto Notes. That grants reading and editing access. Ask it to find one imported project note and list its unfinished
        tasks in the chat, without changing the note yet.
      </p>
      <p>
        Compare that list with the note. Then ask it to add one next step with wording you supply, and open the note to check the edit.
        Pinto keeps earlier versions of a note. That history covers changes in Pinto; it is not a transfer of Mem&apos;s earlier versions.
      </p>
      <p>
        Keep the original Mem export after the move. If you notice a missing detail later, you can compare it with the source file
        even after Mem closes. Keep any newer export separately too, so an earlier download does not replace your latest copy.
      </p>
    </PostPage>
  );
}
