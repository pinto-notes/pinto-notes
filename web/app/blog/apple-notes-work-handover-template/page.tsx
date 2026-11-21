import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, MenuPaths } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-work-handover-template", { title: "Apple Notes work handover template for leave cover" });

// Written 21 November 2026 for "apple notes work handover template", topic-research-2026-11-24.md row 4, A4 and B3.
// Google autocomplete rechecked today by direct HTTPS, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=apple+notes+work+handover+template
// returned []. The same endpoint with q=work+handover+template returned "work handover template word",
// "work handover template", "work handover template excel", "work handover template free download",
// "work handover template word doc", "work handover template word free", "what is a handover at work",
// "how to do a handover at work" and "how to write a handover". Generic demand only, not exact-head demand or volume.
// Apple support read today, including search-served page text where direct opens returned HTTP 429:
// https://support.apple.com/en-ca/guide/notes/apd0a136b9cc/mac (Format, Table; convert selected paragraphs;
// two initial rows and columns; Tab in the last cell adds a row). Tab-separated conversion also follows
// apple-notes-cornell-notes-template, whose header records its Mac verification.
// https://support.apple.com/en-euro/guide/notes/apd93c815aa0/mac (select paragraphs, Checklist button; click circles).
// https://support.apple.com/en-ie/guide/notes/apd1955d3b21/mac (Format button, Heading; iCloud or local notes).
// https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios (New Note, Format button, Heading, Add Table).
// https://support.apple.com/en-gb/102296 (Checklist button, Return adds an item; iCloud or device notes).
// Pinto sources opened in this wave9 checkout: README.md:15-26 and BRIEF.md (Apple Notes feel, Mac/iPhone,
// connected ChatGPT/Claude read/edit access); Pane/Editor/SlashCommands.swift:5-35 (headings, checklists, tables);
// supabase/functions/mcp/files_tools.ts:46-101 (fetch, create, edit; existing notes must be read before editing).
// connect-chatgpt-to-your-notes/page.tsx verified header (one Allow grants reading and editing).
// BRIEF.md supplies Mac Apple Notes import leaving Apple Notes unchanged. Paths above are relative to repo root,
// except the blog connection post, which is under web/app/blog. No version-history or shared-workspace claim.
// New editorial layout and fictional leave-cover example, not a shipped Pinto template or an exercised AI result.
// No screenshots used. All body blog links and the inbound suggestion checked as draft: false in lib/posts.ts.

const TEMPLATE = `Cedar workshop handover, 30 November to 4 December

Cover
Away: Sara, 30 November to 4 December 2026. Back 7 December.
Cover lead: Jonas. Workshop date: 10 December.
Last updated: 27 November, 15:00, Stockholm time.
Sara is offline during leave. Escalate urgent decisions to Emma.

Work in flight
Work item\tStatus, receiving owner and next action
Registration page\tCopy approved; page unpublished. Jonas: get Emma's final page check on 30 November by 10:00, then publish by 12:00.
Room booking\t18 places held; deposit not approved. Jonas: ask Emma to approve the deposit by 1 December, 15:00.
Attendee email\tDraft ready. Noor: send after the room is confirmed, by 3 December, 10:00. Hold if confirmation is missing.

Key documents
Project plan: Cedar workshop plan, updated 27 November.
Room quote: R218, dated 26 November.
Email draft: Cedar attendee email, version 2.
Replace these document names with your team's working links.

Access to arrange
Jonas needs the registration editor role and access to the workshop folder.
Sara filed request IT-248 on 27 November; approval is still pending.
Access process: https://example.com/it/temporary-access
Jonas: follow up with IT and test both by 27 November, 16:00.
Use your own account. Never put passwords, recovery codes or access tokens in this note.

Contacts
Emma, budget approval and escalation: emma@example.com
Noor, attendee messages: noor@example.com
Luis, venue booking, quote R218: luis@example.com
IT service desk, request IT-248: it@example.com

Open risks and questions
Room hold expires 2 December at 12:00. Jonas: if approval is missing on 1 December at 15:00, contact Emma that day. Do not pay without approval.
Can we accept 22 attendees? Emma to decide by 30 November, 15:00. Keep the limit at 18 until she approves a change.
Slide design can wait until Sara returns. No cover action needed.

Receiver check before leave
Jonas: open each document link using your own account
Jonas: test registration editing and workshop folder access
Jonas and Noor: confirm the next actions and deadlines together
Jonas: record any unanswered question here before 27 November, 16:30

On return
Jonas: add a dated summary of completed work and anything still open by 7 December, 09:00.
Sara: review it with Jonas before taking the work back.
`;

const PROMPT = `Read my Pinto Notes project notes "Cedar workshop plan", "Room booking R218" and "Cedar attendee email".
Draft a separate note called "Cedar workshop handover, 30 November to 4 December" using the handover layout I paste below.
Sara is away from 30 November to 4 December 2026 and returns on 7 December. Jonas is the cover lead.
For each open item, include the current status, the receiving owner, the next action, the deadline and the source note title.
Separate confirmed facts from questions. If an owner, deadline or approval is missing, write "Needs confirmation" and ask me here.
Include access requests and who must approve them. Do not include passwords, recovery codes or access tokens.
Do not assume access works or that anyone has accepted a task. Leave the receiver checklist unchecked.
Keep the source notes unchanged. I will check the draft and confirm responsibilities with the people involved.`;

const FAQ = [
  { q: "What should an Apple Notes work handover include?", a: [
    "Include cover dates, current work, the receiving owner and next action for each item, document links, access requests, contacts and open risks. Finish with a checklist the person covering you can use before you leave.",
  ] },
  { q: "Should I put passwords in a handover note?", a: [
    "No. Record the system, the access role needed, the approver and a link to your organization's approved access process. The person covering you should use their own account. Keep passwords, recovery codes and access tokens out of the note.",
  ] },
  { q: "How do I check that my leave handover is ready?", a: [
    "Ask the person covering you to open every document link, test the access they need and confirm each next action and deadline. Record unresolved questions before you leave. A name in a note does not confirm that someone has accepted the work.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-work-handover-template"
      intro={<>Copy this Apple Notes work handover template for a week of leave. It puts current work beside its cover owner and next action, with access requests, contacts and open risks below.</>}
      answer={
        <Answer jump={[
          { href: "#template", label: "Copy the handover" },
          { href: "#set-up", label: "Set it up" },
          { href: "#receiver", label: "Check with your cover" },
          { href: "#limits", label: "Where it stops" },
          { href: "#pinto-notes", label: "Draft with your AI" },
        ]}>
          <p>
            Use one note for the cover period, with a named owner and dated next action for every open item.
            This filled example hands over a workshop for one week; replace its details and example addresses with your own.
            Link to your approved access process and never put passwords in the note.
          </p>
          <div id="template">
            <Keep title="Work handover for Apple Notes" text={TEMPLATE}
              note="Copy into a new note. The steps below turn Work in flight into a table and Receiver check before leave into a checklist." />
          </div>
          <PostCta slug="apple-notes-work-handover-template" position="answer" title="Draft a handover from your project notes">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Once connected, ChatGPT or Claude can read your project notes and create a handover draft for you to check.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="set-up">Set up the handover in Apple Notes</h2>
      <p>
        Use iCloud notes or notes stored on your device. Apple says some features aren&apos;t available with other email providers.
        The layout is plain text, so you can read it before adding headings, a table or checklists.
      </p>
      <MenuPaths rows={[
        { on: "Mac", steps: ["Format button", "Heading"] },
        { on: "Mac", steps: ["Format", "Table"] },
        { on: "iPhone", steps: ["Format button", "Heading"] },
      ]} />
      <p>
        On a Mac, paste into a new note. Select a section label, click the Format button and choose Heading.
        Select the four lines from Work item through Attendee email and press the Table button.
        Each tab becomes a column. Or choose Format, Table to start with two rows and two columns, then enter the work items yourself.
        Tab in the last cell adds a row. See <a href="/blog/apple-notes-tables">tables in Apple Notes</a> for more detail.
      </p>
      <p>
        Select the four lines under Receiver check before leave and click the Checklist button.
        The person covering you can click each circle after checking that item.
      </p>
      <p>
        On iPhone, tap New Note and paste the layout. Select each section label, tap the Format button and choose Heading.
        For the work table, tap where it belongs, tap Add Table and enter the work items in two columns.
        Remove the original work lines once they&apos;re in the table. For the receiver check, tap the Checklist button and type each item,
        tapping Return for the next one. Remove the plain check lines after replacing them.
        Apple&apos;s <a href="https://support.apple.com/en-ie/guide/iphone/iph1ac0b3a2/ios">iPhone formatting guide</a> shows the controls.
      </p>

      <h2>Give each open item a next action</h2>
      <p>
        Write what the cover owner must do next. In the example, the room is on hold, so Jonas needs a deposit decision before the hold
        expires. Keep the approval deadline beside the action and the expiry time under Open risks. Both dates matter.
      </p>
      <p>
        Separate work that can wait. Sara&apos;s slide design needs no cover action, which leaves Jonas free to handle the booking.
        Replace the document names with working links, including the actual IT access process instead of example.com.
        Use <a href="/blog/apple-notes-meeting-notes-template">meeting notes with action items</a> as a source for decisions you need to carry over.
      </p>

      <h2 id="receiver">Check the note with the person covering you</h2>
      <p>
        Walk through each next action together before leave starts. Jonas should open the registration editor using his own account,
        rather than checking that Sara can open it. An access request marked pending still needs someone to approve it.
        Ask Noor to confirm the email deadline too.
      </p>
      <p>
        Leave an unanswered question visible until someone answers it. The attendance limit stays at 18 while Emma decides about 22.
        Record her answer and its date when it arrives. At the end of the cover period, add what finished and what remains before the
        returning person takes over again.
      </p>

      <h2 id="limits">Where a handover note stops</h2>
      <p>
        This layout records responsibility. It doesn&apos;t grant access, confirm that a colleague accepted a task or send an alert when
        the room hold expires. Use your team&apos;s normal tools for those actions and update the note after they happen.
        If your workplace requires a formal handover record, use that process too.
      </p>

      <h2 id="pinto-notes">Draft the handover from your project notes</h2>
      <p>
        You can use this layout in Pinto Notes, a notes app for Mac and iPhone with headings, tables and checklists.
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and choose Allow, your AI can read and edit your notes.
        Ask it to read named project notes and create a separate handover draft. Use work information your organization permits you to share with that AI.
      </p>
      <Keep title="Ask your AI for a handover draft" text={PROMPT}
        note="Replace the note titles, names and dates, then paste the handover layout after this prompt. Connect Pinto Notes first." />
      <p>
        Check every owner, deadline and approval against the source notes. Ask the people involved to confirm their responsibilities.
        In this example, the draft must keep the deposit unapproved, access pending and the attendance limit at 18.
        Only tick the receiver checks after the cover owner has actually done them.
      </p>
      <p>
        Your Apple Notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>, and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
