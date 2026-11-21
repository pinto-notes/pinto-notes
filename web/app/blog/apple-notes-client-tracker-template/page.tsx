import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-client-tracker-template", {
  title: "Apple Notes client tracker template, with a client index",
});

// Written 21 November 2026 for "client tracker template" and "apple notes client tracker template".
// Research: blog-growth/topic-research-2026-11-22.md, row 6. Google autocomplete rechecked today,
// client=firefox, hl=en, gl=us, at https://suggestqueries.google.com/complete/search.
// "client tracker template" returned itself, "client tracker template free", "client log template",
// and spreadsheet variants. "personal crm template" returned itself and Notion/Google Sheets variants.
// "apple notes client tracker template", "apple notes client template" and "apple notes crm template"
// returned no suggestions. Broad template demand is not evidence of exact Apple Notes demand.
// Apple support pages read today, including the full article text fetched directly when web fetch hit 429:
// https://support.apple.com/en-bw/guide/notes/apd0a136b9cc/mac
//   Format, Table; converting selected paragraphs to a table; Tab in the last cell adds a row.
//   Tab-separated conversion wording follows the live apple-notes-cornell-notes-template post.
// https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac
//   Select paragraphs and click the Checklist button; click a circle to complete an item.
// https://support.apple.com/en-mt/guide/iphone/iph1ac0b3a2/ios
//   Checklist and Add Table buttons. iPhone instructions below create checklist items with that button.
// https://support.apple.com/en-gb/guide/notes/apde615d29c2/mac
//   Edit, Add Link, type the target note title, select it, click OK.
// https://support.apple.com/en-gb/guide/iphone/iph908d1558b/ios
//   Select text, Forward button, Add Link, type the target note title, select it, Done.
// Pinto sources opened today, paths relative to the repo root above web/:
// Pane/Editor/SlashCommands.swift: headings, checklists, tables and links to notes.
// supabase/functions/mcp/files_tools.ts: search/fetch read notes; edit/write update their text.
// README.md and BRIEF.md: Apple Notes-like app on iPhone and Mac; ChatGPT/Claude access once connected.
// Pane/Views/AppleNotesImport.swift: copies selected notes without changing Apple Notes, on Mac.
// No shipped client-tracker template is claimed. These filled examples are fictional. No picture used.

const TEMPLATE = `North Quay Ceramics

Contact
Mara Ellis, owner
mara@northquay.example
Prefers email. Calls on Tuesday afternoons.

Work together
Website copy for the winter collection.
Mara approves wording. Leon supplies product photos.

Current position
First draft sent on 18 November 2026.
Waiting for Mara's comments before revising the product pages.
Last contact: 20 November 2026, email from Mara.
Next follow-up: 24 November 2026, ask for comments if none arrive.

Next actions
Ask Mara for comments on 24 November
Confirm when Leon can send the glaze photos

Contact log
20 November 2026: Mara expects to review the draft on Monday.
18 November 2026: Sent the first draft. Two glaze photos still missing.

For next time
Use British spelling. Keep care instructions on each product page.

Related notes
North Quay, kickoff, 12 November 2026
`;

const INDEX = `Clients

Client\tLast contact\tNext follow-up
North Quay Ceramics\t20 Nov 2026\t24 Nov, draft comments
Birch Studio\t19 Nov 2026\t25 Nov, January availability
`;

const FAQ = [
  { q: "Can I use Apple Notes to keep track of clients?", a: [
    "Yes. Keep a note for each client with their contact details, current work, last contact and next follow-up. Use a separate index table to see the dates together, with links to the client notes.",
  ] },
  { q: "What should a client note include between meetings?", a: [
    "Keep the current position, the date you last spoke and one specific next action. Add a short dated entry after each exchange. The client note holds the ongoing relationship; separate meeting notes hold each meeting's detail.",
  ] },
  { q: "Will the follow-up date in this client tracker send an alert?", a: [
    "No. The date is text in the template. Set a separate reminder for any follow-up you must not miss, and review the index yourself.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-client-tracker-template"
      intro={<>
        Use this Apple Notes client tracker template for one note per client, with a separate index table of follow-up dates.
        Copy the filled examples below, then replace the details with your own.
      </>}
      answer={
        <Answer jump={[
          { href: "#template", label: "The client note" },
          { href: "#index", label: "The index table" },
          { href: "#daily-use", label: "Keep it current" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Use it with your AI" },
        ]}>
          <p>
            Give each client a note with contact context, a dated log and a next follow-up. Keep one index table that links to those
            notes and shows when to get in touch. This is a relationship record you maintain by hand.
          </p>
          <PostCta slug="apple-notes-client-tracker-template" position="answer" title="Ask your AI to read the client history">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your client notes and update the next action after you give it new information.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="template">The template: one note per client</h2>
      <p>
        This example is for a freelance copywriter waiting for a client&apos;s feedback. Contact preferences stay near the top.
        The current position tells you what needs to happen next without rereading every exchange.
      </p>
      <Keep title="Client record for Apple Notes" text={TEMPLATE}
        note="Paste this as plain text. Turn the two lines under Next actions into a native checklist." />
      <p>
        On Mac, select the two action lines and click the Checklist button. On iPhone, tap the Checklist button on a blank line
        under Next actions, then type each action as its own item. Leave the contact log as dated text.
        Apple documents these controls in its <a href="https://support.apple.com/en-ca/guide/notes/apd93c815aa0/mac">Mac list guide</a>
        {" "}and <a href="https://support.apple.com/en-mt/guide/iphone/iph1ac0b3a2/ios">iPhone formatting guide</a>.
      </p>
      <p>
        For another client, copy the layout into a new note and replace every example detail. Keep the contact log short.
        Record what was agreed and what you are waiting for, rather than pasting an entire email thread.
      </p>

      <h2 id="index">The index: dates and links</h2>
      <p>
        Keep a separate note called Clients. Each row points to one client record. Put only a short follow-up in the last column;
        the client note holds the explanation. The dates here match the North Quay example above.
      </p>
      <Keep title="Client index for Apple Notes" text={INDEX}
        note="Each table line has tabs between its cells. Paste it, then turn those lines into a table on Mac." />
      <MenuPaths rows={[{ on: "Mac", steps: ["Format", "Table"] }]} />
      <p>
        Paste, then make the table. Paste the template into a new note, select the three lines from Client to the last client,
        and press the Table button. Every tab becomes a column. Tab in the last cell adds the next row.
        On iPhone, tap the Add Table button and enter the rows by hand.
        Apple&apos;s <a href="https://support.apple.com/en-bw/guide/notes/apd0a136b9cc/mac">Mac table guide</a> covers text conversion;
        our <a href="/blog/apple-notes-tables">Apple Notes table guide</a> explains the other table controls.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Edit", "Add Link"] },
        { on: "iPhone", steps: ["Forward button", "Add Link"] },
      ]} />
      <p>
        Turn each client name into a link. On Mac, select the name, choose Edit, Add Link, type the client note&apos;s title,
        select the match and click OK. On iPhone, select the name, tap the Forward button in the edit menu, then Add Link.
        Type the note title, select it and tap Done. Apple gives the steps for
        {" "}<a href="https://support.apple.com/en-gb/guide/notes/apde615d29c2/mac">Mac</a> and
        {" "}<a href="https://support.apple.com/en-gb/guide/iphone/iph908d1558b/ios">iPhone</a>.
      </p>

      <h2 id="daily-use">Keep the record current</h2>
      <p>
        After a call or email, add one dated line to the contact log. Rewrite Current position if the agreement changed.
        Tick off a completed action and give the next one a date. Update the index row at the same time, so it matches the record.
      </p>
      <p>
        Before a call, read Current position and For next time. If the conversation needs an agenda or detailed decisions,
        use a separate <a href="/blog/apple-notes-meeting-notes-template">meeting note</a> and link it under Related notes.
        Keep the client record for what still matters after that meeting.
      </p>

      <h2 id="limits">Where it stops</h2>
      <p>
        The index and client notes are separate text. Changing a date in one does not update the other.
        Writing a follow-up date does not schedule an alert. Set a separate reminder when missing a date would matter.
      </p>
      <p>
        This layout does not log emails, look up contacts or calculate a sales forecast. If you need a shared sales pipeline
        with assigned owners and automatic follow-ups, use a CRM. The note is a place to keep the context for your next conversation.
      </p>

      <h2 id="pinto-notes">Use the layout with ChatGPT or Claude</h2>
      <p>
        You can write this layout in Pinto Notes, which looks and works like Apple Notes on iPhone and Mac.
        It has tables, checklists and links between notes. Set up the client records yourself, then
        {" "}<a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> to let your AI read and edit them.
      </p>
      <p>
        Before replying to Mara, ask: &ldquo;Read North Quay Ceramics. What are we waiting for, and what did Mara say about timing?
        Draft a short follow-up email using only the facts in the note.&rdquo; Check the draft before you use it.
        After you hear back, give the AI the new details and ask it to update both the client record and the Clients index.
        These are requests you make in the connected chat, not automatic follow-ups.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
