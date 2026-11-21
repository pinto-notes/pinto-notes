import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostCta } from "@/lib/PostCta";
import { Answer, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-scan-document", { title: "Apple Notes scan document: iPhone, Mac and PDF" });

// Written 21 November 2026 for "apple notes scan document". Google autocomplete read live today, en-US,
// suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us, for all five brief queries:
// apple notes scan document: to pdf, to pdf size, from photo, to text, ocr, size; apple notes scanner:
// app, iphone notes scanner not available, not working, dpi; apple notes scan to pdf: multiple pages,
// iphone notes scan to pdf reduce file size, too large, not working, mac notes scan to pdf, no camera icon;
// apple notes scan to text: image to text, scan handwriting to text, convert scan to text;
// apple notes scan reduce file size: iphone notes scan reduce file size, how do i make a scanned document a smaller file size.
// No scan-document row in topic-research-2026-11-20.md; this is wave 4's assigned topic.
// Apple pages read live today on support.apple.com, fetched directly when web fetch returned 429:
// /en-us/108963: Attachment, Scan Documents, automatic or shutter/volume capture, corners, Keep Scan,
// Done after additional scans; More, Scan is another route. This post uses the current Done wording.
// /guide/iphone/iph653f28965/ios: scan saved as PDF; Attachments, Scan Text, select text, Insert,
// supported languages. Scan Text inserts words; this post does not claim conversion of an existing PDF.
// /en-us/102332: Notes supports Continuity Camera, Control-click, Scan Documents, optional Insert from
// device submenu, iPhone camera, Save, PDF on Mac; Wi-Fi, Bluetooth, same Apple Account, two-factor
// authentication, macOS Mojave 10.14 and iOS 12 or later with supported hardware.
// /guide/iphone/iph8958dd125/ios: PDF's Menu button has sharing and Quick Look; View As changes preview size.
// /guide/iphone/iphdf551cfa2/ios: exporting the whole note includes only the first page of an attached multipage scan.
// /guide/preview/prvw1509/mac: File, Export, Quartz Filter, Reduce File Size, Save; quality and size vary.
// Pinto: BRIEF.md's verified facts for Apple Notes-like iPhone/Mac app, connected ChatGPT/Claude read/edit,
// every earlier note version kept, one Mac import leaves Apple Notes unchanged. Files/PDFs in notes and
// folders from the live pinto-notes-for-iphone post, explicitly required by BRIEF-wave4.md. No Pinto scan,
// OCR, PDF compression or AI reading of scanned attachments claimed. Pictures: none.

const FAQ = [
  { q: "How do I scan several pages into one PDF in Apple Notes?", a: [
    "In a note on iPhone, tap the Attachments button, then Scan Documents. Capture each page before tapping Done. Notes saves the pages together as a PDF in the note.",
  ] },
  { q: "Does Scan Text in Apple Notes make an editable note?", a: [
    "It inserts the words you select into the note. Tap Attachments, Scan Text, point the camera at the text, select the words and tap Insert. Apple says this works in supported languages. Scan Documents instead saves a PDF.",
  ] },
  { q: "How can I make an Apple Notes scan smaller to upload?", a: [
    "On a Mac, open the scan's PDF in Preview and choose File, Export. Set Quartz Filter to Reduce File Size and save a copy. Check that small print is still readable. Apple says compression can lower quality and the resulting size varies.",
  ] },
  { q: "Can I scan into Notes on my Mac with my iPhone?", a: [
    "Yes, with Continuity Camera. Control-click inside a note and choose Scan Documents, opening the submenu for your iPhone if needed. Scan on your iPhone, then tap Save. Both devices need Wi-Fi, Bluetooth and the same Apple Account with two-factor authentication.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-scan-document"
      intro={<>To scan a document in Apple Notes on iPhone, open a note, tap the Attachments button, then Scan Documents. Capture the pages and tap Done to save a PDF in the note.</>}
      answer={
        <Answer jump={[
          { href: "#iphone", label: "Scan on iPhone" },
          { href: "#pdf", label: "Share the PDF" },
          { href: "#text", label: "Scan to text" },
          { href: "#mac", label: "Scan into a Mac" },
          { href: "#file-size", label: "Reduce file size" },
        ]}>
          <p>
            Apple Notes has a document scanner built in: Attachments, Scan Documents on iPhone saves one or more pages as a PDF.
            For editable words, choose Scan Text instead. On a Mac, Continuity Camera uses your iPhone to scan straight into a note.
          </p>
          <PostCta slug="apple-notes-scan-document" position="answer" title="Keep PDFs beside notes your AI can edit">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac, with PDFs and files in your notes and folders. Once connected, ChatGPT or Claude can read and edit your notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="iphone">Scan a document on iPhone</h2>
      <MenuPaths rows={[{ on: "iPhone", steps: ["Attachments", "Scan Documents"] }]} />
      <Steps>
        <li>Open Notes and open a note, or create a new one.</li>
        <li>Tap the Attachments button, then Scan Documents.</li>
        <li>Point the camera at the page. In Auto mode, hold the phone steady while it captures the scan.</li>
        <li>To capture it yourself, tap the shutter or press a volume button. Drag the corners to fit the page, then tap Keep Scan.</li>
        <li>Scan the remaining pages before you finish. Tap Done to save the document in the note.</li>
      </Steps>
      <p>
        You can also open the note&apos;s More menu and tap Scan. Apple&apos;s <a href="https://support.apple.com/en-us/108963" rel="noopener">document
        scanning guide</a> describes both routes, including the flash and image filters available in iOS 26. You don&apos;t need a separate scanner app for these steps.
      </p>

      <h2 id="pdf">The scan is already a PDF</h2>
      <p>
        Scan Documents saves the result as a PDF inside your note. For several pages in one file, keep scanning in the same session before
        tapping Done. To send it, use the scanned PDF&apos;s Menu button in the note and choose the sharing action. Quick Look in the same
        menu opens the PDF full screen. Apple lists these controls in <a href="https://support.apple.com/guide/iphone/iph8958dd125/ios" rel="noopener">Work
        with PDFs in Notes on iPhone</a>.
      </p>
      <p>
        Share the scan itself when you need every page. Apple says exporting the whole note as a PDF includes only the first page of an
        attached multipage scan. <a href="/blog/apple-notes-export-pdf">Exporting Apple Notes to PDF</a> explains that difference and the
        export steps for a whole note.
      </p>

      <h2 id="text">Scan to text instead of a PDF</h2>
      <MenuPaths rows={[{ on: "iPhone", steps: ["Attachments", "Scan Text", "Insert"] }]} />
      <p>
        If you want to edit the words from a printed page, use Scan Text. In a note, tap Attachments, then Scan Text. Point the camera at
        the words, drag or use the selection handles to choose the text, then tap Insert. The words go into the note.
      </p>
      <p>
        Apple&apos;s <a href="https://support.apple.com/guide/iphone/iph653f28965/ios" rel="noopener">guide to scanning text and documents</a>{" "}
        says Scan Text works in supported languages. These are camera steps for inserting text into a note. They don&apos;t describe a way
        to turn an existing scanned PDF into an editable document. Check the inserted words against the paper before you use them.
      </p>

      <h2 id="mac">Scan into Notes on a Mac with Continuity Camera</h2>
      <p>
        Continuity Camera opens the camera on your iPhone and puts the finished PDF in the note on your Mac. Before starting, turn on
        Wi-Fi and Bluetooth on both devices. Sign in to the same Apple Account with two-factor authentication.
      </p>
      <Steps>
        <li>Open the note on your Mac and Control-click where you want the scan.</li>
        <li>Choose Scan Documents, opening the submenu for your iPhone first if needed.</li>
        <li>Point your iPhone at the document. Let it scan automatically, or use the shutter and adjust the corners.</li>
        <li>Add the other pages, then tap Save on your iPhone. The PDF appears in the Mac note.</li>
      </Steps>
      <p>
        Apple&apos;s <a href="https://support.apple.com/en-us/102332" rel="noopener">Continuity Camera requirements</a> list macOS Mojave
        10.14 or later on supported Macs and iOS 12 or later. If the option is missing, check the hardware list and account requirements
        there. Apple also asks you to use the latest macOS version.
      </p>

      <h2 id="file-size">Reduce the scan&apos;s file size</h2>
      <p>
        For a scan that is too large to upload, Apple documents PDF compression in Preview on a Mac. Open the scan&apos;s PDF there,
        then choose File, Export. In Quartz Filter, choose Reduce File Size and save it with a different name to keep the original.
      </p>
      <MenuPaths rows={[{ on: "Preview on Mac", steps: ["File", "Export", "Quartz Filter", "Reduce File Size"] }]} />
      <p>
        Open the smaller copy and check the small print before sending it. Apple says the resulting size and image quality vary. Its{" "}
        <a href="https://support.apple.com/guide/preview/prvw1509/mac" rel="noopener">Preview compression guide</a> also describes export
        options to optimize images for screen or save images as JPEG.
      </p>

      <h2 id="limits">Where scanning in Notes stops</h2>
      <p>
        Choose Scan Documents when you need the page as a PDF, and Scan Text when you need words in a note. Changing a PDF&apos;s View As
        setting changes its preview size in Notes. Use the separate compression steps above when the file itself needs to be smaller.
      </p>

      <h2 id="pinto-notes">Keep the PDF with your working notes</h2>
      <p>
        Pinto Notes holds photos, PDFs and files in notes and folders on iPhone, as shown in <a href="/blog/pinto-notes-for-iphone">Pinto
        Notes for iPhone</a>. Keep a scanned PDF beside the notes you write about it. Use Apple&apos;s scanner steps above to make the scan.
      </p>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit your notes, with every
        earlier version kept. Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple
        Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
