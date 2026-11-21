import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-vs-notion", {
  title: "Notion vs Apple Notes: which one to use, and when",
});

// Written 21 November 2026 for "notion vs apple notes" (Google autocomplete, en-US, read 21 Nov: notion vs apple notes,
// notion or apple notes, is notion or apple notes better, notion vs apple notes and reminders, notion vs iphone notes,
// notion vs ios notes, notion vs icloud notes, apple notes vs notion, is apple notes better than notion, can notion read
// my notes, notion import apple notes). The reader is choosing between the two, or wants more from Apple Notes.
// Notion, every fact read on 21 November 2026 on notion.com:
// notion.com/pricing (Free "for individuals"; block limit "Limited for 2+ members"; 5 MB uploads and 7 days of page
// history on Free; Plus adds 5 GB uploads and 30 days; "Trial of Notion AI" on Free and Plus; Notion Agent, AI meeting
// notes and enterprise search on Business. USD prices from the page's own price data: Plus $120 a year or $12 a month,
// Business $240 a year or $24 a month, per member), notion.com/help/notion-ai-faqs ("Notion AI is available on Business
// and Enterprise Plans"; Free and Plus get "a limited number of complimentary AI responses"), notion.com/help/notion-mcp
// (Claude, ChatGPT and Cursor can read and write pages; "They can access everything you can access"),
// notion.com/help/import-data-into-notion (Evernote, Trello, Confluence, Asana, Google Docs, Word, Text and Markdown and
// more; Apple Notes isn't listed; Settings, Import), notion.com/help/export-your-content (PDF, HTML, Markdown and CSV;
// databases export as CSV), notion.com/help/guides/working-offline-in-notion-everything-you-need-to-know (desktop and
// mobile apps; "Available offline" per page, per device), notion.com/help/reminders (@remind in a page, a Date property in
// a database, push and email; recurring reminders "on the roadmap"), notion.com/help/duplicate-delete-and-restore-content
// (page history 7, 30, 90 days or any number by plan), notion.com/help/intro-to-databases (table, list, board, calendar
// and gallery views; filter, sort, group; formulas), notion.com/templates (community template gallery),
// notion.com/desktop (macOS, Windows) and notion.com/mobile (iOS and Android).
// Apple, read 21 November 2026: support.apple.com/102223 (Notes on a Mac imports .txt, .rtf, .rtfd, .html, .enex and .md
// with File, Import to Notes; File, Import Markdown; nothing about Notion), support.apple.com/102484 (Reminders: due date
// and time, location, Siri, iCloud sync, shared lists, scheduled reminders in Calendar on iOS 18 and later),
// support.apple.com/HT210402 (Notes and Reminders on iCloud.com from a Windows PC; Android isn't mentioned).
// Apple Notes facts from earlier posts: tags and Smart Folders (apple-notes-tags-smart-folders), tables with no sums or
// sorting (apple-notes-tables), Math Results (apple-notes-budget-template), sharing needs an Apple Account for each person
// (apple-notes-1-on-1-template), Apple Intelligence transcripts and summaries of recordings (apple-notes-for-school),
// "Automatically sort checked items" (apple-notes-checklist-sort), no templates and File, Duplicate Note
// (apple-notes-templates), no version history (apple-notes-version-history).
// Pinto side: import-your-notes (File menu imports; "Notion, Joplin, Logseq or anything else: a folder or .zip of
// Markdown or text files. Each folder becomes a folder."), apple-notes-version-history (versions kept, the last of each
// day for 90 days), move-from-apple-notes (Apple Notes import on a Mac, Apple Notes isn't changed).
// Pictures, all reused: /blog/news/apple-notes-mac-groceries and /blog/news/notion-mac-team-weekly (from
// best-notes-app-for-mac) and /blog/news/pinto-notes-mac-chatgpt-edit-framed (same post). No new screenshots.

type Row = { what: string; apple: string; notion: string };

const ROWS: Row[] = [
  { what: "Price", apple: "Free, comes with your iPhone and Mac", notion: "Free plan; Plus $10 a member a month billed yearly ($12 monthly)" },
  { what: "Devices", apple: "iPhone and Mac; iCloud.com in a browser on Windows", notion: "Mac, Windows, iPhone, Android and the web" },
  { what: "How notes are organised", apple: "Folders, tags and Smart Folders", notion: "Pages inside pages, and databases" },
  { what: "Tables", apple: "Simple tables; no sums or sorting", notion: "Databases with views, filters, sorting and formulas" },
  { what: "Templates", apple: "None; duplicate a note", notion: "A large community gallery" },
  { what: "Reminders", apple: "A separate app, Reminders", notion: "@remind in a page, or a date in a database" },
  { what: "Earlier versions of a note", apple: "Not kept", notion: "7 days on Free, 30 on Plus, 90 on Business" },
  { what: "AI built in", apple: "Apple Intelligence, on supported devices", notion: "Notion AI on Business; a limited trial on Free and Plus" },
  { what: "Sharing", apple: "Each person needs an Apple Account", notion: "Members and guests in a workspace" },
];

const FAQ = [
  { q: "Is Notion better than Apple Notes?", a: [
    "For databases, project tracking and team wikis, yes: Notion does far more. For quick notes, lists and checklists on iPhone and Mac, Apple Notes is simpler, free and already installed.",
  ] },
  { q: "Is Notion free for personal use?", a: [
    "Yes. Notion's Free plan is for individuals, with uploads up to 5 MB a file and 7 days of page history. The block limit applies when a workspace has two or more members. Notion AI is a limited trial on Free.",
  ] },
  { q: "Can Notion replace Apple Notes and Reminders?", a: [
    "Partly. Notion can hold your notes and remind you with @remind or a date in a database, with push notifications and email. It has no recurring reminders yet, and no location reminders or Siri, which Apple's Reminders app has.",
  ] },
  { q: "Can I move my Notion pages into Apple Notes?", a: [
    "Yes, as files. Export from Notion as Markdown and CSV, then in Notes on a Mac choose File, Import Markdown. Pages come over as notes. Databases export as CSV, which Apple Notes doesn't import.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-vs-notion"
      intro={<>Apple Notes is the Notes app on your iPhone and Mac. Notion is a workspace of pages and databases on Mac, Windows, phones and the web. Both are good, and they suit different people. Here&apos;s how they compare, from what each maker says today.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#apple-notes", label: "Apple Notes" },
          { href: "#notion", label: "Notion" },
          { href: "#reminders", label: "Notes and Reminders" },
          { href: "#which-one", label: "Which one to pick" },
        ]}>
          <p>
            Pick <strong>Apple Notes</strong> if you mostly write notes, lists and checklists on your iPhone and Mac. It&apos;s free,
            built in, and there&apos;s nothing to set up. Pick <strong>Notion</strong> if you want databases, project boards, a team
            wiki, or Windows and Android apps. It does much more, and takes more time to set up and learn.
          </p>
          <PostCta slug="apple-notes-vs-notion" position="answer" title="Like Apple Notes, with your AI in it.">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. ChatGPT or Claude can read and edit your notes once you connect them, and earlier versions of every note are kept.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="at-a-glance">At a glance</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Apple Notes</th><th scope="col">Notion</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.what}><th scope="row">{r.what}</th><td>{r.apple}</td><td>{r.notion}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Notion&apos;s prices are from its pricing page, in US dollars, read on 21 November 2026. The Notion facts are from its own
        help pages, and the Apple ones from Apple&apos;s support pages and Notes itself.
      </p>

      <h2 id="apple-notes">Where Apple Notes is the better pick</h2>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000}
        alt="Apple Notes on a Mac: folders in the sidebar, a list of notes, and a Groceries note with a checklist where three items are ticked."
        caption="A Groceries note in Apple Notes on a Mac. Screenshot: Pinto Notes." />
      <p>
        Apple Notes is already on your iPhone and Mac, and it syncs through iCloud. You open it and type. There are no pages to
        design, and no plan to pick.
      </p>
      <p>
        It does more than it looks. Checklists can move ticked items to the bottom (&ldquo;Automatically sort checked
        items&rdquo;). Typing #word makes a tag, and Smart Folders gather notes by tag, folder or unchecked checklists. Search reads
        every word in every note. Math Results works out sums you type, and you can pin a note to the top of its folder or lock it
        with a password, Face ID or Touch ID. On supported devices, Apple Intelligence turns a recording in a note into a transcript and a
        summary.
      </p>
      <p>
        <strong>Where it stops:</strong> it&apos;s Apple only. On a Windows PC you get Notes at iCloud.com in a browser, and
        Apple&apos;s page doesn&apos;t mention Android. Its <a href="/blog/apple-notes-tables">tables</a> are simple, with no sums
        or sorting. There are no templates, so you duplicate a note instead (File, Duplicate Note on a Mac). It keeps{" "}
        <a href="/blog/apple-notes-version-history">no version history</a>, so text you delete is gone once you can&apos;t undo
        it. And sharing a note needs an Apple Account for each person.
      </p>
      <p><strong>Best for:</strong> personal notes, lists and quick capture, on Apple devices.</p>

      <h2 id="notion">Where Notion is the better pick</h2>
      <PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000}
        alt="A Notion page on a Mac called Team weekly, with team and participant properties, an agenda with a chart, and action items with checkboxes."
        caption="A team meeting page in Notion on a Mac. Image: Notion." />
      <p>
        Notion is built around pages and databases. A database is a set of pages with properties such as dates and status, shown as a
        table, list, board, calendar or gallery, and each view can filter, sort and group. That makes it good for things Apple Notes
        can&apos;t do: a reading list you sort by rating, a project board, a content calendar, a team wiki. Its template gallery has
        community templates for most of these.
      </p>
      <p>
        It runs on Mac, Windows, iPhone, Android and the web. Offline, the desktop and mobile apps can open and edit the pages you
        mark &ldquo;Available offline&rdquo;, page by page on each device. Page history goes back 7 days on Free, 30 on Plus and 90 on
        Business. Export gives you PDF, HTML, or Markdown and CSV.
      </p>
      <p>
        For AI, Notion AI writes, summarises, answers questions across your workspace and takes meeting notes. Notion says it&apos;s
        available on Business and Enterprise, and Free and Plus get a limited number of responses to try it. Notion MCP lets
        Claude, ChatGPT and Cursor read and write your pages. Notion notes that these tools can access everything you can.
      </p>
      <p>
        <strong>Where it stops:</strong> it&apos;s a lot of app for a grocery list, and it takes time to set up the way you want.
        Uploads on the Free plan are capped at 5 MB a file, and a workspace with two or more
        members hits a block limit.
      </p>
      <p><strong>Best for:</strong> teams, projects, and anyone who wants their notes as a database.</p>

      <h2 id="reminders">Notion vs Apple Notes and Reminders</h2>
      <p>
        On Apple devices, notes and to-dos live in two apps. Notes holds the writing; Reminders holds the things with a date. Apple
        says a reminder can have a due date and time or a place (arriving or leaving), you can ask Siri to add one, lists can be
        shared, and since iOS 18 scheduled reminders also show in Calendar. Both apps sync through iCloud.
      </p>
      <p>
        Notion keeps both in one place. Type @remind tomorrow, or @remind Wednesday at 1pm, in a page, or give a database a Date
        property and set a time. Notion sends a push notification, and an email if the app isn&apos;t open. Recurring reminders
        aren&apos;t available yet; Notion says they&apos;re on the roadmap.
      </p>
      <p>
        If you want one app for tasks and notes and you plan in tables, Notion fits. If you want a phone that nags you on time and at
        the right place, Apple&apos;s pair is hard to beat.
      </p>

      <h2 id="moving">Moving between them</h2>
      <p>
        Notion has no Apple Notes importer. Its import list has Evernote, Trello, Confluence, Google Docs, Word and more, plus Text
        and Markdown files. So the route is to export your Apple Notes as Markdown first, zip them and import the ZIP under Settings,
        Import: <a href="/blog/move-apple-notes-to-obsidian-notion-keep">how to move Apple Notes to Notion</a> has the steps and
        Notion&apos;s limits.
      </p>
      <p>
        The other way, export a Notion page as Markdown and CSV. In Notes on a Mac, File, Import Markdown turns the .md files into
        notes with their formatting (macOS 26 and later). Notes also imports .txt, .rtf, .html and Evernote&apos;s .enex files
        with File, Import to Notes. CSV isn&apos;t on Apple&apos;s list, so a database comes across only as its pages.
      </p>

      <h2 id="pinto-notes">If you like Apple Notes and want AI in it</h2>
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178}
        alt="Pinto Notes on a Mac: folders in the sidebar, a list of notes, and a Lisbon trip note where the line ChatGPT just added, Late checkout requested, is tinted, with a bar saying ChatGPT changed 1 line and an Undo button."
        caption="ChatGPT added a line to a trip note. Pinto Notes tints it and offers Undo. Screenshot: Pinto Notes." />
      <p>
        If you like how Apple Notes feels and were looking at Notion for AI, there&apos;s a smaller step. Pinto Notes looks and works like Apple Notes on iPhone and Mac: folders, pinned notes,
        checklists and tables. Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>, which takes
        a minute, your AI can read and edit your notes, and Claude Code and Codex can too.
      </p>
      <p>
        Every change keeps the version before it, so you can restore a note after you or an AI edit it. Notes are stored as
        Markdown and encrypted. Templates add a ready note in one tap, and tables can have typed columns (choice, number, date,
        scale).
      </p>
      <p>
        It <a href="/blog/import-your-notes">imports on a Mac</a> from Apple Notes, Obsidian, Evernote, Google Keep and Bear. From
        Notion, export as Markdown and drop in the folder or .zip: each folder becomes a folder.
      </p>
      <p>
        <strong>Where it stops:</strong> Pinto Notes is Apple only, with no Windows, Android or web app. For databases with board
        and calendar views, or a wiki for a whole team, Notion is the better tool.
      </p>

      <h2 id="which-one">Which one should you pick?</h2>
      <ul>
        <li>Quick notes, lists and checklists on iPhone and Mac: <strong>Apple Notes</strong>.</li>
        <li>Projects, databases, a team wiki, or Windows and Android: <strong>Notion</strong>.</li>
        <li>Dates and places that should ping your phone: <strong>Apple Reminders</strong>, next to either.</li>
        <li>Apple Notes, with ChatGPT or Claude working in your notes: <strong>Pinto Notes</strong>.</li>
      </ul>
      <p>
        Your Apple Notes come over to Pinto Notes in one import on your Mac, and Apple Notes isn&apos;t changed:{" "}
        <a href="/blog/move-from-apple-notes">how to move from Apple Notes</a>.
      </p>
      <p className="label">Sources</p>
      <p>
        Read on 21 November 2026: <a href="https://www.notion.com/pricing">Notion pricing</a>,{" "}
        <a href="https://www.notion.com/help/notion-ai-faqs">Notion AI FAQs</a>, <a href="https://www.notion.com/help/notion-mcp">Notion MCP</a>,{" "}
        <a href="https://www.notion.com/help/import-data-into-notion">importing into Notion</a>,{" "}
        <a href="https://www.notion.com/help/export-your-content">exporting from Notion</a>,{" "}
        <a href="https://www.notion.com/help/reminders">Notion reminders</a>,{" "}
        <a href="https://www.notion.com/help/guides/working-offline-in-notion-everything-you-need-to-know">Notion offline</a>,{" "}
        <a href="https://www.notion.com/help/duplicate-delete-and-restore-content">Notion page history</a>,{" "}
        <a href="https://support.apple.com/en-us/102223">importing into Apple Notes</a>,{" "}
        <a href="https://support.apple.com/en-us/102484">Apple Reminders</a> and{" "}
        <a href="https://support.apple.com/en-us/HT210402">iCloud.com features by device</a>.
      </p>
    </PostPage>
  );
}
