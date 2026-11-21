import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-home-inventory-template", { title: "Apple Notes home inventory template, with photos" });

// Written 21 November 2026 for "apple notes home inventory template". BRIEF-wave7.md, post 4;
// topic-research-2026-11-22.md, row 14 reports inventory apps and useful spreadsheet downloads, including Itemlist.
// Google autocomplete rechecked live 21 November 2026, client=firefox, hl=en, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=home+inventory+template
// Relevant results: home inventory template free, home inventory template with photos, home inventory
// template for numbers, home inventory template for insurance. The exact Apple Notes seed and
// "notes app for home inventory" returned none. The photos seed also returned home inventory spreadsheet
// with photos and excel home inventory template with pictures. These are broader than Apple Notes demand.
// Apple Support pages read live today, fetched directly after web open returned 429:
// https://support.apple.com/en-us/guide/notes/apd0a136b9cc/mac
// Mac tables: select paragraphs, Table button or Format, Table; two rows and columns; Tab adds a row
// in the last cell. Tab-separated columns use apple-notes-cornell-notes-template's verified wording.
// https://support.apple.com/en-us/guide/notes/apd93c815aa0/mac
// Mac lists: select paragraphs, Checklist button converts them to checklist items.
// https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios
// iPhone formatting: Add Table and Checklist buttons while writing; Format, Heading.
// https://support.apple.com/en-us/guide/notes/not95edd2813/mac
// Mac attachments: drag photos from Photos, files from Finder; Exchange cannot attach files.
// https://support.apple.com/en-us/guide/iphone/iph23f4d9aa9/ios
// iPhone attachments: Attachments button; in Files, Share, Notes, choose an existing note.
// Pinto sources opened today, relative to the repo root: Pane/Editor/SlashCommands.swift confirms Table
// and Attach File; Pane/Model/NoteExport.swift confirms Markdown ZIP, available attachments, skipped
// locked notes and missing-file reporting. BRIEF.md verifies Apple Notes look and behavior on iPhone
// and Mac, connected ChatGPT/Claude read and edit, and Mac import leaving Apple Notes unchanged.
// No home inventory template file exists or is promised, per the research row and BRIEF-wave7.md.
// Pictures: none. All five body blog links have draft: false in lib/posts.ts.
// Registration description: Copy an Apple Notes home inventory template for each room. Keep details, serial numbers, receipts and photos together, with a checklist for missing records.

const TEMPLATE = `Living room inventory
Room: Living room
Last checked: 21 November 2026

Item\tRecord
LR-01: DAB radio\tSerial recorded; receipt and photos to attach
LR-02: Oak coffee table\tNo serial marked; receipt missing; photo to attach

LR-01: DAB radio
Room and location: Living room, shelf beside the window
Make/model: Roberts Play 10
Serial number: DEMO-LR01-2047 (example only)
Bought: 8 March 2025
Purchase price: GBP 59, not a current valuation
Receipt: LR-01-receipt.pdf, attach below this record
Photos: LR-01-front.jpg and LR-01-label.jpg, attach below
Condition: Small scratch beside the volume knob

LR-02: Oak coffee table
Room and location: Living room, in front of the sofa
Make/model: Unbranded, solid oak, 90 x 50 cm
Serial number: Not marked
Bought: 12 June 2023, second-hand
Purchase price: GBP 75, not a current valuation
Receipt: Missing, bought for cash
Photo: LR-02-table.jpg, attach below this record
Condition: Water mark on the left corner

Still to capture
Attach the radio receipt
Attach the radio front and serial-label photos
Attach the coffee table photo
Check the radio serial number against its label
`;

const FAQ = [
  { q: "Can I make a home inventory in Apple Notes?", a: [
    "Yes. Use one note per room, with an entry for each item and its serial number, receipt and photos. Copy the filled layout on this page, then replace the example records with your own.",
  ] },
  { q: "How do I add receipt photos to a home inventory note?", a: [
    "On iPhone, tap the Attachments button in the note and choose a photo option. For a PDF in Files, open it, tap Share, then Notes and choose the inventory note. On Mac, drag a receipt file from Finder into the note.",
  ] },
  { q: "Does a home inventory note calculate replacement values?", a: [
    "No. This layout records what you own and what you paid. It does not calculate current value or replacement cost, and it provides no insurer approval.",
  ] },
  { q: "What should I write when an inventory item has no serial number?", a: [
    "Write Not marked if you checked the item and found none, or Not checked yet if you still need to look. Keep its description and photos so the entry remains useful without a serial number.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-home-inventory-template"
      intro={<>
        Copy this Apple Notes home inventory template into one note per room. Each item gets a serial number field, a receipt record and space for photos.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Tables and checklists" },
          { href: "#photos", label: "Receipts and photos" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Use it in Pinto Notes" },
        ]}>
          <p>
            Apple Notes can hold a home inventory with one note per room, a short item table and detailed records below it.
            Paste the example, replace the item details, then attach your receipts and photos beside the matching record.
            The note does not value your belongings or provide insurer approval.
          </p>
          <PostCta slug="apple-notes-home-inventory-template" position="answer" title="Let your AI help update the records">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read and edit your inventory notes using the details you give it.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="template">The template: one room at a time</h2>
      <p>
        This living room example includes a radio and a second-hand table. The serial number and filenames are examples; copying the text
        does not attach any files. Replace the records with your own, including the make and model.
      </p>
      <Keep title="Home inventory for Apple Notes" text={TEMPLATE}
        note="Paste as plain text. Turn the three tab-separated Item and Record lines into a table, then make Still to capture a checklist." />
      <p>
        Keep the item number on its record and its attachments. LR-01 ties the radio to its receipt and photos even when another room has a similar radio.
        Write &ldquo;Not checked yet&rdquo; for unfinished fields and &ldquo;Missing&rdquo; for a receipt you cannot find. Those mean different things.
      </p>

      <h2 id="set-up">Make the table and capture checklist</h2>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format", "Table"] },
        { on: "iPhone", steps: ["Add Table button"] },
      ]} />
      <p>
        On Mac, paste the template into a new note, select the three lines from Item to LR-02, and press the Table button.
        Every tab becomes a column, so you get Item and Record side by side. You can also choose Format, Table for an
        empty two-column table and enter those rows yourself. Tab in the last cell adds the next row.
        Apple documents these controls in its <a href="https://support.apple.com/en-us/guide/notes/apd0a136b9cc/mac">Mac table guide</a>.
      </p>
      <p>
        On iPhone, tap the Add Table button while writing the note and enter Item and Record as the two columns.
        Copy the two example rows into the cells, then remove their plain-text versions. To style a section heading,
        select its text and tap Format, Heading. See Apple&apos;s <a href="https://support.apple.com/en-us/guide/iphone/iph1ac0b3a2/ios">iPhone formatting guide</a>.
      </p>
      <p>
        On Mac, select the four task lines under Still to capture and click the Checklist button.
        On iPhone, tap the Checklist button to start the list, then enter each task on its own line.
        Tick a task only after the file is attached or the field is filled in. Apple&apos;s <a href="https://support.apple.com/en-us/guide/notes/apd93c815aa0/mac">Mac list guide</a> covers converting existing lines.
      </p>
      <p>
        Keep the table short and put the long descriptions below it. For more table controls, see <a href="/blog/apple-notes-tables">tables in Apple Notes</a>.
        The <a href="/blog/apple-notes-templates">Apple Notes templates guide</a> has other layouts to copy.
      </p>

      <h2 id="photos">Attach the receipt and photos to the right item</h2>
      <p>
        Photograph the whole item and its serial label separately. Put the files beneath that item&apos;s written record, outside the table.
        Type the serial number too, then compare it with the label photo before marking the task done.
      </p>
      <p>
        On iPhone, tap the Attachments button in the note and choose a photo option.
        For a PDF receipt in Files, open the PDF, tap Share, then Notes, and choose the existing room note.
        Apple explains both routes in <a href="https://support.apple.com/en-us/guide/iphone/iph23f4d9aa9/ios">adding photos and other attachments</a>.
      </p>
      <p>
        On Mac, drag receipt PDFs from Finder into the note and photos from Photos.
        Use an iCloud note for this layout; Apple says Exchange notes cannot hold file attachments.
        Its <a href="https://support.apple.com/en-us/guide/notes/not95edd2813/mac">Mac attachment guide</a> lists the supported routes.
      </p>
      <p>
        When an item leaves the house, record when you sold, donated or discarded it. After a purchase, add its record while
        you still have the receipt. Keep repair dates and recurring jobs in a separate <a href="/blog/apple-notes-home-maintenance-checklist">home maintenance checklist</a>.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        A purchase price is a record of what you paid. It is not a current valuation or a replacement-cost estimate. This note provides no insurer approval.
        Ask your insurer what records it requires before relying on this layout for a claim.
      </p>
      <p>
        You still check every label, attach every file and update the room table yourself. A filename in the text does not
        prove the attachment is present. Open each receipt and photo after adding it, and keep a separate copy of the originals.
      </p>

      <h2 id="pinto-notes">Keep the inventory in Pinto Notes</h2>
      <p>
        The same written layout can be used in Pinto Notes, which supports tables and file attachments. There is no ready-made Pinto
        home inventory template for this post. Copy the layout above and add your own records.
      </p>
      <p>
        Once <a href="/blog/connect-chatgpt-to-your-notes">ChatGPT is connected</a>, it can read and edit the notes; Claude can too.
        Connecting grants both read and edit access. Ask &ldquo;List the items whose written fields say receipt missing or serial not checked. Do not guess any missing details.&rdquo;
        Check the results against your records before you use them.
      </p>
      <p>
        Pinto can export your notes as Markdown files in a ZIP with the attachments it can retrieve. Check the export summary: locked notes
        can be skipped, and files that cannot be downloaded are reported as missing. Open the exported receipts and photos before treating the copy as complete.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
