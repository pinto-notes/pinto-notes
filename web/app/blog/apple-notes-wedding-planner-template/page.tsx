import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-wedding-planner-template", { title: "Apple Notes wedding planner template to copy" });

// Written 21 November 2026 for "apple notes wedding planner template" and "wedding planning checklist".
// Research: blog-growth/topic-research-2026-11-22.md, row 13. An existing Apple Notes wedding guide already
// answers this topic; this post offers one compact note, with guests/RSVPs, vendor decisions and next actions.
// Google autocomplete rechecked 21 November 2026, client=firefox, hl=en, gl=us:
// "wedding planning checklist" returned "wedding planning checklist and timeline", "wedding planning checklist
// template", "wedding planning checklist by month" and other variants. "wedding planning template" returned
// "wedding planning templates", "wedding planning template free" and spreadsheet/document variants.
// "apple notes wedding planning" and "apple notes wedding planner template" both returned no suggestions.
// Apple pages read today, 21 November 2026:
// https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac
//   Table button or Format > Table; convert selected paragraphs; Tab in the last cell adds a row.
//   Tab-separated layout and wording follow apple-notes-cornell-notes-template, previously tested on macOS 27.
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac
//   Select paragraphs and click Checklist; click the circle to complete an item; iCloud feature availability.
// https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios
//   New Note, Format > Heading, Checklist and Add Table buttons. No automatic table conversion promised on iPhone.
// https://support.apple.com/en-ca/guide/iphone/iphe4d04f674/27/ios/27
//   iOS 27 sharing: Share, menu under title, Share a Link; Apple Account and iCloud Notes for each participant.
// Pinto claims: BRIEF.md Pinto facts, looks/works like Apple Notes on iPhone and Mac, connected ChatGPT/Claude
// read and edit; Pane/Editor/SlashCommands.swift, checklist and table commands confirmed by reading the file.
// Consent verified header in connect-chatgpt-to-your-notes: one Allow permits reading and editing.
// Import: BRIEF.md and import-your-notes, Mac Apple Notes import leaves Apple Notes unchanged.
// Original fictional example. No shipped wedding template, template prop, new screenshot or reused picture.

const TEMPLATE = `Maya and Sam's wedding, 19 June 2027

Venue: Willow Hall
Guest limit: 48
RSVP deadline: 31 May 2027
Venue's final guest count due: 5 June 2027
Last reviewed: 21 November 2026

Guests, sample rows
Guest\tRSVP and meal
Lena Ortiz\tYes; vegetarian
Alex Chen\tYes; chicken
Nora Patel\tAwaiting reply; meal unknown
Ben Carter\tNo; declined 20 November

Vendors
Supplier\tDecision and next date
Venue, Willow Hall\tBooked; send final guest count by 5 June
Catering, Olive Kitchen\tQuote received; tasting 28 November
Photographer, June Studio\tShortlisted; ask about ceremony coverage

Next actions
Maya: confirm tasting time with Olive Kitchen by 24 November
Sam: ask June Studio about ceremony coverage by 25 November
Maya: add remaining invitees to the guest list by 29 November
Sam: put the venue balance and due date in the budget by 30 November

Open questions
Can the caterer offer a vegan main as well as vegetarian?
Who will take the flowers home after the reception?
`;

const FAQ = [
  { q: "How do I make a wedding planner in Apple Notes?", a: [
    "Paste the layout on this page into a note. On Mac, select each tab-separated guest or vendor block and click the Table button. Select the next-action lines and click Checklist. Replace the example details with your own.",
  ] },
  { q: "Can my partner edit the same wedding note?", a: [
    "Yes, with an iCloud note. Both people need an Apple Account with Notes turned on in iCloud. On iOS 27, tap Share, open the menu under the note title and choose Share a Link. Give your partner permission to edit.",
  ] },
  { q: "Will this Apple Notes guest list collect RSVPs for me?", a: [
    "No. This is a manual record. Enter each reply yourself and keep Awaiting reply separate from No. The layout does not send invitations, collect replies or maintain a live headcount.",
  ] },
  { q: "Can ChatGPT update my wedding plan in Pinto Notes?", a: [
    "Once connected, ChatGPT can read and edit your Pinto Notes. Give it the guest replies or vendor details you want added. It can update the note from that information; it does not receive guests' replies through this layout.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-wedding-planner-template"
      intro={<>
        Copy this wedding planner into Apple Notes for a guest list with RSVPs, vendor decisions and a checklist of next actions.
        The filled example below shows what to record, with setup steps for iPhone and Mac.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the template" },
          { href: "#set-up", label: "Set it up" },
          { href: "#keep-current", label: "Keep it current" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Update it with AI" },
        ]}>
          <p>
            Use one Apple Notes note with a guest table, a vendor table and a checklist with an owner and date on each task.
            Copy the wedding planner template below, then turn the relevant lines into Notes&apos; own tables and checklist.
          </p>
          <PostCta slug="apple-notes-wedding-planner-template" position="answer" title="Let your AI update the plan">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your wedding note and edit it with the guest replies or vendor updates you give it.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="template">The template: guests and the next decisions</h2>
      <p>
        This example is for Maya and Sam&apos;s June wedding. The guest rows are a sample, so replace them and add everyone you plan
        to invite. Keep one row per person, even for couples, so each reply and meal choice has a name beside it.
      </p>
      <Keep title="Wedding planner for Apple Notes" text={TEMPLATE}
        note="Paste as ordinary text. Each table line has a tab between the two columns. Format the tables and checklist separately below." />

      <h2 id="set-up">Set it up in Apple Notes</h2>
      <MenuPaths rows={[
        { on: "Mac table", steps: ["Format", "Table"] },
        { on: "Mac tasks", steps: ["Select task lines", "Checklist button"] },
        { on: "iPhone table", steps: ["Add Table button"] },
        { on: "iPhone tasks", steps: ["Checklist button"] },
      ]} />
      <p>
        On a Mac, paste the template into a new note, select the five lines from Guest to Ben&apos;s row, and press the Table button.
        Every tab becomes a column, so you get Guest and RSVP and meal side by side. Repeat for the four lines from Supplier to the
        photographer&apos;s row. You can also choose Format, Table. Tab in the last cell adds a row.
        Apple documents these controls in <a href="https://support.apple.com/guide/notes/add-a-table-apd0a136b9cc/mac">its Mac table guide</a>.
      </p>
      <p>
        Select only the four task lines under Next actions and click the Checklist button. Each line gets its own circle to tick.
        Leave the guest replies as text: an unanswered invitation is different from a declined one.
      </p>
      <p>
        On iPhone, tap New Note. For each table, tap Add Table and enter the example&apos;s two columns into the cells. For next actions,
        tap Checklist and enter the tasks as checklist items. Select each section label, tap Format, then Heading if you want larger
        headings. Apple&apos;s <a href="https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios">iPhone formatting guide</a> shows these buttons.
        You can also keep the guest and vendor lines as plain text while you plan.
      </p>

      <h2 id="keep-current">Keep the plan current</h2>
      <p>
        When a reply arrives, change that person&apos;s row immediately. Use Yes, No or Awaiting reply, then add the meal choice.
        Record dietary requirements in the guest&apos;s own words and confirm anything unclear before sending the list to the caterer.
        Count confirmed guests again before the venue&apos;s deadline; the guest limit at the top is your capacity, not your current count.
      </p>
      <p>
        Keep a vendor&apos;s status beside its name. A quote received is still a quote until you accept it. When you make a decision,
        replace the old status and put the next task in the checklist. Keep costs and payment dates in a separate budget note;
        the <a href="/blog/apple-notes-budget-template">Apple Notes budget template</a> gives you a layout for the amounts.
      </p>
      <p>
        Review the unchecked tasks together once a week. Give every new task a person and a date, then update Last reviewed.
        To edit the same iCloud note together on iOS 27, tap Share, tap the menu under the title and choose Share a Link.
        Both people need an Apple Account with Notes enabled in iCloud. Apple&apos;s
        {" "}<a href="https://support.apple.com/en-ca/guide/iphone/iphe4d04f674/27/ios/27">sharing guide</a> explains access and editing permissions.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        This layout is a record you maintain. It has no RSVP form or automatic headcount, and typing a due date into a task does not
        schedule an alert. It also has no seating-chart tool. Keep a separate reminder for a deadline you cannot miss.
      </p>
      <p>
        A few short rows work well in a note. If you need to filter a long guest list by meal choice or compare totals, use a spreadsheet
        for that part. Keep this note for the decisions and the next actions. The
        {" "}<a href="/blog/apple-notes-tables">Apple Notes table guide</a> explains the limits of Notes tables.
      </p>

      <h2 id="pinto-notes">Update the wedding note with ChatGPT or Claude</h2>
      <p>
        Pinto Notes looks and works like Apple Notes on iPhone and Mac, with tables and checklists. You can keep this layout in a note
        there. After you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, your AI can read and edit your notes.
        Choosing Allow gives it both permissions.
      </p>
      <p>
        Give it a specific update, such as &ldquo;In Maya and Sam&apos;s wedding note, Nora has replied yes and wants the vegan meal.
        Add a task for Maya to confirm that option with Olive Kitchen by 24 November.&rdquo; Check the changed row and the new task
        against the reply. You still supply the information; this layout does not collect it from guests or vendors.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
