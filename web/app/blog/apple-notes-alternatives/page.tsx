import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-alternatives", { title: "Apple Notes alternatives for Windows, Android and Mac" });

// Written 21 November 2026 for "apple notes alternatives". Google autocomplete read 21 Nov (en-US): apple notes
// alternatives, apple notes alternative free, apple notes alternative for windows, apple notes alternative for
// android, apple notes alternative cross platform, apple notes alternative open source (also: reddit, for linux,
// self hosted, for mac, for iphone). The reader is leaving Apple Notes or needs it on a device Apple doesn't make.
// Every fact about another app was read on 21 November 2026 on the maker's own pages:
// Obsidian: obsidian.md (notes stored locally as plain text Markdown files, thousands of plugins and themes, graph
// view, "Free without limits", no sign-up), obsidian.md/pricing (Sync $4 per user per month billed annually or $5
// billed monthly, with encryption and version history), obsidian.md/download (iOS, Android, Windows,
// macOS, Linux). obsidian.md doesn't say it's open source, so the post doesn't call it that.
// Notion: notion.com/pricing (Free, Plus, Business; Free has a trial of Notion AI and 7 days of page history; prices
// were shown in euros only, so none are quoted), notion.com/help/notion-ai-faqs (Notion AI is on Business and
// Enterprise; Free and Plus get a limited number of AI responses), notion.com/desktop (Mac and Windows apps),
// notion.com/help/notion-for-mobile (iOS and Android; some tasks need the desktop app or the browser).
// Google Keep: support.google.com/keep/answer/9050190 (computer: the two latest versions of Chrome, Firefox, Edge
// on Windows, Safari on Mac; tabs for Android and iPhone), /6191044 (labels, colours and pins, up to 50 labels; no
// folders), /13820887 (version history of text changes, on a computer), /3187168 (reminders), /6101196 (sharing);
// the US App Store listing by Google LLC (Free).
// Evernote: evernote.com/compare-plans (Free, Starter, Advanced, Flexible, Unlimited; Free is 50 notes, 1 notebook,
// 1 device; no prices shown, so none are quoted), evernote.com/download (Mac, Windows, App Store, Google Play, web,
// Web Clipper for Chrome, Firefox and Safari).
// Bear: bear.app (Mac and iPhone; Pro is a 7-day trial, then $2.99 a month or $29.99 a year; sync with iCloud
// is Pro only; nothing about Windows, Android or the web).
// Joplin: joplinapp.org ("an open source note-taking app"; Windows, macOS, Linux, Android, iOS and a terminal app;
// encryption so no one but you can read your notes) and joplinapp.org/help ("a free, open source note taking and to-do application"; Markdown;
// sync with Nextcloud, Dropbox, OneDrive and Joplin Cloud; imports notes exported from Evernote).
// Apple: support.apple.com/guide/icloud/mm6704cac5 (Notes on iCloud.com covers notes stored in iCloud only) and
// support.apple.com/en-us/105119 (Notes on iCloud.com in a browser on a Windows PC and on iPhone; the page doesn't
// mention Android). Other Apple Notes facts are from BRIEF.md's verified list (search, tags, Smart Folders, tables,
// locked notes, sharing needs an Apple Account).
// Pinto Notes: Apple only (iPhone and Mac); free download for Mac, App Store for iPhone; ChatGPT, Claude, Claude
// Code and Codex read and edit notes once connected; every earlier version kept; notes as Markdown, encrypted.
// Import sources and their wording are from app/blog/import-your-notes (Apple Notes, Obsidian, Evernote .enex with
// each notebook a folder and tags, Google Keep with labels as folders, Bear, Markdown or text folders).
// Pictures, all reused from best-notes-app-for-mac and import-your-notes: Pinto's ChatGPT edit, Obsidian's
// groceries note (own screenshot), Bear's and Notion's own images, and Pinto's File menu import picture.

type Row = { app: string; runs: string; free: string; notes: string; suits: string };

const ROWS: Row[] = [
  { app: "Obsidian", runs: "Mac, Windows, Linux, iPhone, Android", free: "Yes; Sync is paid", notes: "Markdown files on your device", suits: "Owning your files, links, plugins" },
  { app: "Google Keep", runs: "Android, iPhone, any computer browser", free: "Yes", notes: "Your Google Account", suits: "Quick notes and lists, Android" },
  { app: "Notion", runs: "Mac, Windows, iPhone, Android, browser", free: "Free plan, paid plans", notes: "Your Notion workspace", suits: "Teams, wikis and databases" },
  { app: "Evernote", runs: "Mac, Windows, iPhone, Android, web", free: "Free plan: 50 notes, 1 device", notes: "Your Evernote account", suits: "Clipping the web, long archives" },
  { app: "Bear", runs: "Mac, iPhone", free: "Yes; sync needs Pro", notes: "On your devices, iCloud with Pro", suits: "Writing in Markdown" },
  { app: "Pinto Notes", runs: "Mac, iPhone", free: "Free download", notes: "Markdown, encrypted, synced", suits: "Apple Notes habits, with ChatGPT or Claude" },
];

const FAQ = [
  { q: "Is there an Apple Notes app for Windows?", a: [
    "No. On a Windows PC you can open Notes on iCloud.com in a web browser, and it shows notes stored in iCloud. For an app that runs on Windows itself, Obsidian, Notion, Evernote and Joplin all have one.",
  ] },
  { q: "Is there an Apple Notes app for Android?", a: [
    "No. Apple's page on iCloud.com in a browser lists Windows computers and iPhone and doesn't mention Android. If you're moving to Android, Google Keep, Obsidian, Notion, Evernote and Joplin all have Android apps.",
  ] },
  { q: "What's a free alternative to Apple Notes on every platform?", a: [
    "Obsidian and Joplin are free on Mac, Windows, Linux, iPhone and Android, and Google Keep is free on Android, iPhone and in a browser. Obsidian's own sync is paid; Joplin can sync through Dropbox, OneDrive or Nextcloud.",
  ] },
  { q: "Is there an open source Apple Notes alternative?", a: [
    "Joplin is a free, open source notes app for Windows, Mac, Linux, Android and iPhone, with encrypted sync. Obsidian keeps notes as open Markdown files, though its own site doesn't call the app open source.",
  ] },
  { q: "Will switching apps delete my Apple Notes?", a: [
    "No. Exports and imports copy your notes, and Apple Notes keeps them until you delete them yourself.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-alternatives"
      intro={<>Apple Notes is good, and it only runs on Apple devices. When you get a Windows laptop, move to Android or want your notes to do more, you need something else. Here are six apps, what each runs on, what it costs to start, and who it suits. Pinto Notes is our app, so we say where each of the others is the better pick.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#obsidian", label: "The six apps" },
          { href: "#windows-android", label: "Windows and Android" },
          { href: "#open-source", label: "Open source" },
          { href: "#moving", label: "Moving your notes" },
        ]}>
          <p>
            On Windows or Android, look at <strong>Obsidian</strong> (free, plain files, every platform), <strong>Google Keep</strong> (free and
            quick) or <strong>Notion</strong> (for teams). <strong>Evernote</strong> runs on Mac, Windows, iPhone, Android and the web, with a small free plan. For open source,
            there&apos;s <strong>Joplin</strong>. If you&apos;re staying on iPhone and Mac, <strong>Bear</strong> suits writers, and{" "}
            <strong>Pinto Notes</strong> works like Apple Notes and lets ChatGPT or Claude use your notes.
          </p>
          <PostCta slug="apple-notes-alternatives" position="answer" title="Staying on iPhone and Mac?">
            <p>Pinto Notes looks and works like Apple Notes, imports your Apple Notes on your Mac, and lets ChatGPT or Claude read and edit your notes. It doesn&apos;t run on Windows or Android.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="at-a-glance">At a glance</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">App</th><th scope="col">Runs on</th><th scope="col">Free</th><th scope="col">Where your notes live</th><th scope="col">Suits</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.app}><th scope="row">{r.app}</th><td>{r.runs}</td><td>{r.free}</td><td>{r.notes}</td><td>{r.suits}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Read on each maker&apos;s own pages on 21 November 2026. The order follows what people search for: the apps that run on Windows and
        Android come first. For a Mac-only comparison, see <a href="/blog/best-notes-app-for-mac">notes apps for Mac compared</a>.
      </p>

      <h2 id="obsidian">Obsidian: your notes as files, on every platform</h2>
      <PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000} maxWidth={600}
        alt="Obsidian on a Mac: a vault's folders in the sidebar and the Groceries note open in a tab, with ticked items struck through."
        caption="A Groceries note in Obsidian on a Mac, as a Markdown file in a folder. Screenshot: Pinto Notes." />
      <p>
        Obsidian stores your notes as plain text Markdown files on your device, so any text editor can open them, today or in ten years. It
        runs on Mac, Windows, Linux, iPhone and Android, it&apos;s free for personal use with no sign-up, and it works offline.
      </p>
      <p>
        Its strength is links between notes, with a graph that shows how they connect, and thousands of plugins and themes. Obsidian Sync
        is the paid add-on: $4 a month billed yearly, or $5 billed monthly, with encryption and version history. You can also sync
        the folder with a service you already use.
      </p>
      <p><strong>Where it falls short:</strong> it asks you to build your own system, and syncing between devices means paying for Sync or setting up another service.</p>
      <p><strong>Suits:</strong> people on more than one platform who want to own their files.</p>

      <h2 id="google-keep">Google Keep: quick notes, free with a Google Account</h2>
      <p>
        Keep is Google&apos;s notes app for Android, iPhone and any computer browser (the two latest versions of Chrome, Firefox, Edge on
        Windows and Safari on Mac). It&apos;s free on the App Store. Notes and lists are cards you sort with labels, colours and pins, with
        reminders and sharing, and on a computer you can see earlier versions of a note&apos;s text.
      </p>
      <p>
        <strong>Where it falls short:</strong> there are no folders, only labels, up to 50 of them. If you sort notes into folders in Apple
        Notes, that structure doesn&apos;t carry over.
      </p>
      <p><strong>Suits:</strong> Android users, and anyone whose notes are mostly lists and reminders.</p>

      <h2 id="notion">Notion: a workspace for teams</h2>
      <PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000} maxWidth={600}
        alt="A Notion page on a Mac called Team weekly, with team and participant properties, an agenda with a chart, and action items with checkboxes."
        caption="A team meeting page in Notion on a Mac. Image: Notion." />
      <p>
        Notion is pages, databases and wikis you share with other people. It has apps for Mac, Windows, iPhone and Android, and works in a
        browser. There&apos;s a Free plan, then Plus and Business per member. Notion AI comes with Business and Enterprise; Free and Plus get a
        limited number of AI responses to try it, and Free keeps 7 days of page history.
      </p>
      <p><strong>Where it falls short:</strong> it&apos;s built for shared workspaces, which is more than a quick note needs, and AI beyond the trial is on Business.</p>
      <p><strong>Suits:</strong> teams, and people who want project tracking beside their notes.</p>

      <h2 id="evernote">Evernote: the long-running one</h2>
      <p>
        Evernote has apps for Mac, Windows, iPhone and Android, a web app, and a Web Clipper for Chrome, Firefox and Safari that saves pages
        you find. The Free plan holds 50 notes in one notebook on one device, and the paid plans are Starter, Advanced, Flexible and Unlimited.
      </p>
      <p><strong>Where it falls short:</strong> the free plan is small, so a real library means paying.</p>
      <p><strong>Suits:</strong> people who clip a lot from the web and want one archive on every device.</p>

      <h2 id="bear">Bear: writing, on Apple devices</h2>
      <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760} maxWidth={600}
        alt="Bear 2 on a Mac and an iPhone: a sidebar of nested tags, a list of notes and a note about the North Pole with a highlight, a footnote and a table."
        caption="Bear 2 on the Mac and iPhone. Image: Bear." />
      <p>
        Bear is a Markdown notes app for Mac and iPhone. It&apos;s free to start; syncing with iCloud needs Bear Pro, which is $2.99 a month or
        $29.99 a year after a 7-day trial. Pro also adds themes and search inside PDFs and images.
      </p>
      <p><strong>Where it falls short:</strong> Apple only, so it doesn&apos;t help on Windows or Android, and sync costs money.</p>
      <p><strong>Suits:</strong> writers who like Markdown and are staying on Apple devices.</p>

      <h2 id="pinto-notes">Pinto Notes: Apple Notes, with your AI in it</h2>
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178} maxWidth={600}
        alt="Pinto Notes on a Mac: folders in the sidebar, a list of notes, and a Lisbon trip note where the line ChatGPT just added, Late checkout requested, is tinted, with a bar saying ChatGPT changed 1 line and an Undo button."
        caption="ChatGPT added a line to a trip note. Pinto Notes tints it and offers Undo." />
      <p>
        Pinto Notes is our app for iPhone and Mac. It looks and works like Apple Notes, so there&apos;s little to learn. What it adds: ChatGPT,
        Claude, Claude Code and Codex can read and edit your notes once you connect them, which takes a minute (
        <a href="/blog/connect-chatgpt-to-your-notes">how to connect ChatGPT or Claude</a>). Every earlier version of a note is kept, which
        Apple Notes doesn&apos;t do (<a href="/blog/apple-notes-version-history">version history in Apple Notes</a>). Notes are stored as
        Markdown and encrypted.
      </p>
      <p>
        <strong>Where it falls short:</strong> it&apos;s Apple only. There&apos;s no Windows, Android or web app, so if that&apos;s why you&apos;re
        leaving Apple Notes, pick one of the apps above.
      </p>
      <p><strong>Suits:</strong> people who like Apple Notes and want ChatGPT or Claude to work in their notes.</p>

      <h2 id="windows-android">If you&apos;re on Windows or Android</h2>
      <p>
        You don&apos;t always have to leave Apple Notes. On a Windows PC, Apple lists Notes among the iCloud.com features that work in a
        browser, for notes stored in iCloud. Apple&apos;s page doesn&apos;t mention Android. A browser tab is fine for reading a note now and
        then; for daily use on Windows or Android, an app that runs there will feel better.
      </p>
      <ul>
        <li>You&apos;ll use several platforms and want files you own: <strong>Obsidian</strong>.</li>
        <li>You&apos;re on Android and want quick lists: <strong>Google Keep</strong>.</li>
        <li>You share notes with a team: <strong>Notion</strong>.</li>
        <li>You clip web pages into one archive: <strong>Evernote</strong>.</li>
      </ul>
      <p>Pinto Notes and Bear don&apos;t run on Windows or Android.</p>

      <h2 id="open-source">Open source</h2>
      <p>
        The app to look at is <strong>Joplin</strong>, a free, open source
        notes and to-do app for Windows, Mac, Linux, Android and iPhone, with a terminal app too. It stores notes in Markdown, syncs through
        Nextcloud, Dropbox, OneDrive or Joplin Cloud, encrypted so only you can read your notes, and can import notes exported from Evernote. Obsidian is
        the nearest of the six in spirit: the app isn&apos;t described as open source, but your notes are plain Markdown files.
      </p>

      <h2 id="moving">Moving your notes out of Apple Notes</h2>
      <p>
        Every route copies your notes and leaves Apple Notes as it was. Obsidian has an importer that reads Apple Notes on a Mac, Notion takes
        Markdown files in a ZIP, and Google Keep has no import at all. The steps for each are in{" "}
        <a href="/blog/move-apple-notes-to-obsidian-notion-keep">move Apple Notes to Obsidian, Notion or Google Keep</a>.
      </p>
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={460} kind="plain"
        alt="The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep, each with its app's icon, and Import Markdown or Text."
        caption="The File menu in Pinto Notes on the Mac: pick the app your notes are in." />
      <p>
        Pinto Notes imports on a Mac from the File menu, and the app you leave stays as it is
        (<a href="/blog/import-your-notes">what each import brings</a>):
      </p>
      <ul>
        <li><strong>Apple Notes:</strong> your folders and pictures. Checklists and pins too, once you give Pinto Notes Full Disk Access.</li>
        <li><strong>Obsidian:</strong> Pinto Notes finds your vault. Subfolders, pictures and the links between notes come too.</li>
        <li><strong>Evernote:</strong> export each notebook as an .enex file and drop them all in at once. Each notebook becomes a folder, and tags come too.</li>
        <li><strong>Google Keep:</strong> Pinto Notes opens Google&apos;s download page with only Keep ticked. Drop the download in, and your labels become folders.</li>
        <li><strong>Bear:</strong> export your notes as Markdown with attachments, then choose the folder.</li>
        <li><strong>Anything else:</strong> a folder or .zip of Markdown or text files. Each folder becomes a folder.</li>
      </ul>
      <p>
        Apple Notes comes over in one import on your Mac, with Apple Notes unchanged: <a href="/blog/move-from-apple-notes">how to move from
        Apple Notes</a>.
      </p>
      <p className="label">Sources</p>
      <p>
        Read on 21 November 2026: <a href="https://obsidian.md/pricing">Obsidian pricing</a> and <a href="https://obsidian.md/download">downloads</a>,{" "}
        <a href="https://support.google.com/keep/answer/9050190">what you need to use Google Keep</a> and{" "}
        <a href="https://support.google.com/keep/answer/6191044">organizing Keep notes</a>, <a href="https://www.notion.com/pricing">Notion pricing</a> and{" "}
        <a href="https://www.notion.com/help/notion-ai-faqs">Notion AI FAQs</a>, <a href="https://evernote.com/compare-plans">Evernote plans</a>,{" "}
        <a href="https://bear.app">Bear</a>, <a href="https://joplinapp.org/help/">Joplin</a>, and Apple&apos;s{" "}
        <a href="https://support.apple.com/en-us/105119">iCloud.com features by device</a>.
      </p>
      <PostCta slug="apple-notes-alternatives" position="end" title="Try Pinto Notes on your Mac and iPhone.">
        <p>Import your Apple Notes, then connect ChatGPT or Claude.</p>
      </PostCta>
    </PostPage>
  );
}
