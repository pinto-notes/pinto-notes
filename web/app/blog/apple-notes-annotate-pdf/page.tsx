import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-annotate-pdf", { title: "Apple Notes annotate PDF: Markup on iPhone and Mac" });

// Written 21 November 2026 for "apple notes annotate pdf". Google autocomplete read live today, en-US,
// using suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q= with each of these queries:
// apple notes annotate pdf; apple notes pdf markup; can apple notes edit pdf; can apple notes annotate pdf;
// how to use markup in notes. Returned variants used here: apple notes pdf annotation, how to edit a pdf
// in notes, how to use markup in notes on iphone, how to use markup in apple notes. Other returned variants:
// how to annotate notes, can you convert apple notes to pdf, how long can apple notes be,
// how to make a pdf from apple notes, apple notes edit pdf, how to edit apple notes,
// can you link notes in apple notes. One other suggestion concerned a device outside this post's scope.
// Apple pages fetched live today from support.apple.com with Python urllib after the web reader returned 429:
// guide/iphone/work-with-pdfs-in-notes-iph8958dd125/ios: attach through Share, Notes, Save; small preview,
// open the PDF then Handwriting Tools; medium/large preview, Handwriting Tools directly; PDF Menu, View As;
// thumbnails and page rotation; Crop Page and Filters apply only to scanned documents.
// guide/iphone/draw-and-handwrite-with-markup-iph893c6f8bf/27/ios/27: pen, marker or pencil with a finger;
// tap the selected tool for weight/opacity, Color Picker for colour; tap minimized toolbar to expand it.
// guide/notes/mark-up-attachments-apdef7f74190/mac: arrow next to PDF title, Markup, tools, Done.
// guide/mac-help/mark-up-files-mchl1fd88863/mac: Sketch, Text, Highlight Selection and Sign; tools vary by file.
// guide/preview/annotate-a-pdf-prvw11580/mac: Preview cannot edit existing PDF text; Text adds a text box.
// The Notes guides document annotation and page actions, not rewriting the PDF's existing text.
// guide/iphone/export-or-print-notes-iphdf551cfa2/ios: note Share, Markup exports a new PDF of the note;
// View More if needed; Done to save; only first page of each multipage PDF/scan in that export.
// Models read: apple-notes-vs-obsidian, apple-notes-export-pdf, plus the BRIEF template/how-to models.
// Pinto claims: BRIEF.md, "Pinto facts you may use", verifies Apple Notes' look and behaviour on iPhone/Mac,
// connected ChatGPT/Claude reading and editing notes, every earlier note version, and Apple Notes import
// on Mac without changing Apple Notes. No Pinto PDF annotation, PDF reading by AI, or recording claimed.
// Pictures: none. Empty hero suppresses PostPage's default screenshot; the lead registers metadata separately.

const REVIEW = `PDF review

Document:
Page:
Feedback:
Next step:
`;

const FAQ = [
  { q: "Can Apple Notes annotate a PDF on iPhone?", a: [
    "Yes. For a small attachment preview, tap the PDF to open it, then tap Handwriting Tools. For a medium or large preview, tap Handwriting Tools directly. Choose a pen, marker or pencil and draw with your finger.",
  ] },
  { q: "Can Apple Notes edit the original text in a PDF?", a: [
    "Apple's Notes guides describe annotations and page actions, such as rotation. They don't document rewriting a PDF's existing text. Markup's Text tool on Mac adds a text box over the page. Apple also says Preview cannot edit a PDF's existing text.",
  ] },
  { q: "Where is PDF Markup in Apple Notes on a Mac?", a: [
    "Open the note, click the down arrow beside the attached PDF's title, then choose Markup. Use the annotation tools and click Done when you finish.",
  ] },
  { q: "Does Share, Markup edit the PDF attached to my note?", a: [
    "On iPhone, using Share, Markup on the whole note creates a PDF of the note. To annotate the attached PDF itself, use Handwriting Tools for that attachment. The whole-note export includes only the first page of a multipage PDF or scan.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-annotate-pdf"
      intro={<>Apple Notes can annotate a PDF on iPhone and Mac. On iPhone, use the attachment&apos;s Handwriting Tools button. On Mac, click the arrow beside the PDF&apos;s title and choose Markup.</>}
      answer={
        <Answer jump={[
          { href: "#iphone", label: "On iPhone" },
          { href: "#mac", label: "On a Mac" },
          { href: "#limits", label: "What editing means" },
          { href: "#export", label: "Attachment or whole note?" },
          { href: "#pinto-notes", label: "Written review notes" },
        ]}>
          <p>
            On iPhone, tap a small PDF preview to open it, then tap Handwriting Tools. With a medium or large preview, tap
            Handwriting Tools directly. On Mac, open the PDF&apos;s title menu, choose Markup, add your annotations and click Done.
          </p>
          <PostCta slug="apple-notes-annotate-pdf" position="answer" title="Keep your written feedback in a note">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read and edit the review notes you write, and Pinto keeps every earlier version of each note.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="iphone">Annotate a PDF in Notes on iPhone</h2>
      <p>
        If the PDF is still in Files or Mail, touch and hold the file, tap Share, then Notes. Choose the note and tap Save.
        Then open that note to work on the attachment.
      </p>
      <Steps>
        <li>Find the PDF in your note.</li>
        <li>If its preview is small, tap the PDF to open it, then tap Handwriting Tools. For medium and large previews, tap Handwriting Tools directly.</li>
        <li>Choose the pen, marker or pencil and draw or write with your finger.</li>
        <li>Tap the selected tool again to change its line weight or opacity. Use Color Picker to change its colour.</li>
      </Steps>
      <p>
        To change the preview size, tap the PDF&apos;s Menu button, then View As and choose Small, Medium or Large. If the
        Markup toolbar has shrunk, tap its minimized version to open it again. Apple documents these controls in{" "}
        <a href="https://support.apple.com/guide/iphone/work-with-pdfs-in-notes-iph8958dd125/ios" rel="noopener">Work with PDFs in Notes on iPhone</a>{" "}
        and <a href="https://support.apple.com/guide/iphone/draw-and-handwrite-with-markup-iph893c6f8bf/ios" rel="noopener">Draw and handwrite with Markup</a>.
      </p>

      <h2 id="mac">Use PDF Markup in Notes on a Mac</h2>
      <MenuPaths rows={[{ on: "Mac", steps: ["PDF title arrow", "Markup", "Done"] }]} />
      <Steps>
        <li>Open Notes and select the note containing the PDF.</li>
        <li>Click the down arrow beside the PDF&apos;s title, then choose Markup.</li>
        <li>Use the toolbar to add your annotations.</li>
        <li>Click Done when you finish.</li>
      </Steps>
      <p>
        Use Text for a typed comment, then drag the text box into place. Highlight Selection marks selected text.
        Sketch lets you draw a shape, and Sign adds a signature. The available tools depend on the file.
      </p>
      <p>
        These steps come from Apple&apos;s <a href="https://support.apple.com/guide/notes/mark-up-attachments-apdef7f74190/mac" rel="noopener">Mark up attachments in your notes on Mac</a>.
        Its <a href="https://support.apple.com/guide/mac-help/mark-up-files-mchl1fd88863/mac" rel="noopener">Markup tool guide</a>{" "}
        explains the toolbar, including how to create a signature.
      </p>

      <h2 id="limits">Where PDF editing in Notes stops</h2>
      <p>
        Markup lets you add feedback to a page. The Text tool adds a box you can move over the document. Apple&apos;s Notes guides
        don&apos;t describe replacing the PDF&apos;s existing words, so don&apos;t treat that box as a way to correct the original text.
        Apple also states that <a href="https://support.apple.com/guide/preview/annotate-a-pdf-prvw11580/mac" rel="noopener">Preview cannot edit a PDF&apos;s existing text</a>.
      </p>
      <p>
        There are page controls too. On iPhone, use a medium or large preview, show the thumbnails, then tap a page thumbnail
        and its More button for actions such as Rotate Left or Rotate Right. Apple limits Crop Page and Filters to scanned documents.
      </p>

      <h2 id="export">Mark up the attachment or export the whole note?</h2>
      <p>
        On iPhone, Share, Markup on the whole note makes a new PDF of that note. It&apos;s useful when you want to send the
        note&apos;s own text as a document. To work on the attached PDF, use its Handwriting Tools route above.
      </p>
      <p>
        The export has a catch. Apple says a PDF of a note includes only the first page of an attached multipage PDF or scanned
        document. Check which file you are sending if the reader needs every page. Apple&apos;s{" "}
        <a href="https://support.apple.com/guide/iphone/export-or-print-notes-iphdf551cfa2/ios" rel="noopener">export guide</a>{" "}
        explains that limit. <a href="/blog/apple-notes-export-pdf">Export Apple Notes to PDF</a> has the full iPhone and Mac steps.
      </p>

      <h2 id="pinto-notes">Keep the written review notes too</h2>
      <p>
        A circle on page 4 can show where a change belongs. A note alongside it can explain the change and who needs to make it.
        Copy this into a note and repeat the page and feedback lines for each comment.
      </p>
      <Keep title="PDF review note" text={REVIEW} />
      <p>
        For that written feedback, Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, it can read and edit your notes. Try asking,
        &ldquo;Turn these review notes into a checklist. Keep the page numbers.&rdquo; This uses the feedback you wrote in the note.
        Pinto keeps every earlier version of each note.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
