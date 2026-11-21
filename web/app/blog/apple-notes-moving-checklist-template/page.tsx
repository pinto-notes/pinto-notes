import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-moving-checklist-template", {
  title: "Apple Notes moving checklist template, boxes included",
});

// Written 21 November 2026 for "moving checklist template", with an Apple Notes layout.
// Research: topic-research-2026-11-22.md, row 10. Google autocomplete rechecked today with
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=moving%20checklist%20template
// and seeds "moving house checklist", "apple notes moving checklist", "apple notes moving template".
// Returned: "moving checklist template", "moving checklist template free", "moving house checklist",
// "moving house checklist who to notify", "moving house checklist change of address".
// The Apple Notes checklist seed returned reordering help, including "apple notes stop checklist from moving";
// the Apple Notes template seed returned no suggestions. These do not establish exact Apple Notes moving demand.
// Apple's support pages read today:
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac (Add lists): select paragraphs, Checklist button;
// click circles to complete tasks; checklists need iCloud notes or notes stored on the Mac.
// https://support.apple.com/en-ge/guide/notes/apd0a136b9cc/mac (Add a table): select paragraphs, Table button
// or Format, Table; an empty table has two rows and columns; row/column handles add columns; Tab adds a row
// from the last cell. The tab-separated conversion wording also follows apple-notes-cornell-notes-template.
// https://support.apple.com/en-lamr/guide/iphone/iph1ac0b3a2/27/ios/27 (Create and format notes):
// New Note, Format, Heading; Checklist and Add Table buttons.
// https://support.apple.com/en-is/102296 (Create a checklist with Notes): title, Return, Checklist button;
// Return adds an item; tap a circle to finish it. iCloud or device storage supports the latest features.
// Pinto sources: BRIEF.md's Pinto facts for Apple Notes-like editing on iPhone and Mac, free download,
// connected ChatGPT/Claude read and edit, and Mac Apple Notes import leaving Apple Notes unchanged.
// ../Pane/Editor/SlashCommands.swift, opened today, confirms heading, checklist and table commands.
// This is an original paste-in layout, not a shipped Pinto template. No template prop and no screenshots.

const TEMPLATE = `Move, 5 December 2026

From: 18 Cedar Road, apartment 2
To: 42 Birch Lane, apartment 4
Keys: collect at the new building at 08:00

Who to notify
Mara: update the address with the bank by 28 November
Theo: tell the employer payroll team by 30 November
Mara: contact the home insurer about the move by 28 November
Theo: arrange mail forwarding by 30 November
Both: update delivery addresses before the next order

Utilities and connections
Theo: confirm electricity at Birch Lane starts 5 December
Mara: confirm the final day of electricity at Cedar Road
Theo: confirm internet installation for 7 December, 09:00 to 12:00
Mara: ask the water provider how to close the old account
Both: record final meter readings before returning the keys

Before the van arrives
Mara: confirm the loading space with the mover on 3 December
Theo: pack K01 and B01, then update the box list
Mara: keep the kettle bag outside the boxes
Both: keep keys and phone chargers in the day bag

Moving day
08:00 Mara collects the new keys
09:00 Theo meets the van at Cedar Road
12:30 Both check the old flat and record meter readings
15:00 Mara meets the building manager to return the old keys

Moving-day contacts, fictional example
Mover: Alex, 202-555-0147, booking M0526
New building manager: Robin, 202-555-0182, keys at 08:00
Old building manager: Sam, 202-555-0114, keys back at 15:00

First night
Find K01 for mugs and the kettle
Find B01 for sheets and towels
Unpack the day bag before opening other boxes
`;

const BOXES = `Box\tRoom\tContents
K01\tKitchen\tKettle, two mugs, tea, teaspoons
K02\tKitchen\tDinner plates, bowls, tea towels
B01\tBedroom\tSheets, two pillows, bath towels
L01\tLiving room\tDesk cables, router, power strip`;

const FAQ = [
  { q: "How do I make a moving checklist in Apple Notes?", a: [
    "Copy the layout on this page into a note. On Mac, select the task lines under each heading and click the Checklist button. Keep the moving-day timetable and contacts as plain text, with box contents in a separate table.",
  ] },
  { q: "Who should go on my moving address-change list?", a: [
    "Start with your bank, employer, home insurer, mail forwarding service and regular deliveries. Add any other organizations that use your address. Give each line an owner and a date, and check each organization's own process.",
  ] },
  { q: "How should I number moving boxes in a note?", a: [
    "Use a room letter and a number, such as K01 for the first kitchen box. Write the same code on the box and in your note. Keep one row per box with its destination room and a short contents list.",
  ] },
  { q: "Can Claude update a moving checklist in Pinto Notes?", a: [
    "Yes, once Claude is connected to Pinto Notes, it can read and edit the note. Ask it to update a box's contents or revise a task. This article supplies the layout; Pinto does not have a ready-made moving template.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-moving-checklist-template"
      intro={<>
        Copy this moving checklist template into Apple Notes to track who to notify, utility changes and moving-day contacts.
        Add the box table below so you can find the kettle and bedding when you arrive.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The checklist" },
          { href: "#set-up", label: "Set it up" },
          { href: "#boxes", label: "Box contents" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Update it with your AI" },
        ]}>
          <p>
            Keep one note for the move, with a checklist of address changes and utility tasks, then the day&apos;s timetable and contacts.
            Give every task an owner and use the same box codes in the note and on the boxes. Copy the filled example below and replace its details.
          </p>
          <PostCta slug="apple-notes-moving-checklist-template" position="answer" title="Want your AI to update the moving note?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once ChatGPT or Claude is connected, it can read your moving note and edit tasks or box contents when you ask.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="template">The template: one note for the move</h2>
      <p>
        Mara and Theo move on 5 December in this fictional example. The notification list says who does each job and when.
        Utility tasks stay open until the provider confirms them. Replace the addresses, contacts and times before using it.
      </p>
      <Keep title="Moving checklist for Apple Notes" text={TEMPLATE}
        note="Paste as plain text. Turn the task groups into checklists using the steps below." />

      <h2 id="set-up">Turn the tasks into checklists</h2>
      <p>
        Use an iCloud note, or a note saved on the device, for the checklist features. On a Mac, select only the task lines under
        Who to notify and click the Checklist button. Repeat for Utilities and connections, Before the van arrives and First night.
        Leave their headings out of the selection. Click a circle when that job is done.
      </p>
      <p>
        On iPhone, start a task group with the Checklist button and type its tasks. Return adds the next item.
        To format a section heading, select its text, tap Format, then Heading. Tap a task&apos;s circle to mark it complete.
        Apple documents these controls in its <a href="https://support.apple.com/en-is/102296">checklist guide</a>.
      </p>
      <p>
        Keep Moving day and Moving-day contacts as plain text. Collecting the keys at 08:00 is a time to keep visible, even after
        the job is done. For other layouts to keep alongside this one, see <a href="/blog/apple-notes-templates">Apple Notes templates</a>.
      </p>

      <h2 id="boxes">A box list you can use while unpacking</h2>
      <p>
        Write K01 on the kitchen box and on its row in the note. Add the room it goes to and enough detail to find a specific item.
        &ldquo;Kitchen things&rdquo; won&apos;t tell you which box has the kettle. Update the row if you move something to another box.
      </p>
      <Keep title="Moving box contents" text={BOXES}
        note="Each line has tabs between its columns. On Mac, paste, select these lines and press the Table button." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"] }]} />
      <p>
        Paste the template into your moving note, select the five lines from Box to the last contents row, and press the Table button.
        Every tab becomes a column, so you get Box, Room and Contents side by side. Tab in the last cell adds the next row.{" "}
        <a href="/blog/apple-notes-tables"> Tables in Apple Notes</a> covers the table controls.
      </p>
      <p>
        On iPhone, tap Add Table to create a table and enter the box details in its cells. You can also keep each box as a plain line
        if that is easier on a small screen. Keep the first-night boxes together in the van so their codes help you find them on arrival.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        The dates in this layout are text you maintain. Changing the move to 12 December means checking every utility date and appointment
        yourself. Set any deadline alerts separately. A checked task records your progress; it does not notify a provider or change an account.
      </p>
      <p>
        The box list is also manual. It only knows what you wrote, and the codes do not generate labels. Check the physical boxes against
        the note before the van leaves. Confirm each provider&apos;s process directly rather than treating the example as a complete list for your move.
      </p>

      <h2 id="pinto-notes">Ask your AI to update the moving note</h2>
      <p>
        Pinto Notes is a free notes app for iPhone and Mac that looks and works like Apple Notes. You can write this layout yourself
        with headings, checklists and a table. There is no ready-made moving template in Pinto; the copyable layout is on this page.
      </p>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT</a> or Claude, it can read and edit the note.
        Ask, &ldquo;In my moving note, change the internet installation to 8 December, 10:00 to 13:00. Leave the move date alone.&rdquo;
        Or ask it to add the router to K02 and remove it from L01. Check the revised note against the confirmation or box before relying on it.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
