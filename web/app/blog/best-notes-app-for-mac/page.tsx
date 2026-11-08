import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("best-notes-app-for-mac", {
  title: "Best notes app for Mac in 2026: 6 apps compared",
});

type Row = { app: string; price: string; apple: string; other: string; where: string; ai: string; reach: string };

// Every price and feature was read on the maker's own pages or its US App Store listing on 7 November 2026:
// support.apple.com/guide/notes and /en-us/102651, bear.app (and its FAQ), obsidian.md (pricing, sync, cli),
// notion.com (pricing, desktop, help/notion-mcp), craft.do (and pricing), evernote.com/compare-plans,
// getupnote.com, goodnotes.com/pricing, and the App Store listings of Notion, Craft, Evernote and OneNote.
// Recheck them monthly and bump `updated` in lib/posts.ts.
const ROWS: Row[] = [
  { app: "Pinto Notes", price: "Free", apple: "iPhone", other: "No", where: "Markdown, encrypted on your device, synced", ai: "No, bring your own", reach: "Yes, from any device, with Undo and history" },
  { app: "Apple Notes", price: "Comes with your Mac", apple: "iPhone and iPad", other: "No (iCloud.com in a browser)", where: "Apple's database, in iCloud", ai: "Siri AI on macOS 27 (beta)", reach: "On your Mac only: ChatGPT reads open notes, Claude through an extension" },
  { app: "Bear", price: "Free; sync needs Pro ($2.99 a month)", apple: "iPhone and iPad", other: "No (Bear Web in a browser)", where: "Markdown, in iCloud", ai: "No", reach: "Claude on your Mac (Bear's MCP server)" },
  { app: "Obsidian", price: "Free; Sync from $4 a month, billed yearly", apple: "iPhone and iPad", other: "Windows, Android, Linux", where: "Plain Markdown files on your disk", ai: "No (plugins)", reach: "Agents on the same computer; no official hosted connector" },
  { app: "Notion", price: "Free; Plus $11.99 a month (App Store)", apple: "iPhone and iPad", other: "Windows, Android, web", where: "Notion's servers", ai: "Notion AI (trial on Free and Plus)", reach: "Yes, official MCP server" },
  { app: "Craft", price: "Free; Plus $9.99 a month (App Store)", apple: "iPhone and iPad", other: "Windows, web", where: "Craft's servers", ai: "Yes (about 20 lifetime sessions free)", reach: "Yes, official MCP server" },
];

const FAQ = [
  { q: "What's the best notes app for MacBook Air?", a: [
    "The same as for any Mac: every app here runs on a MacBook Air, so pick by how you work. Check the macOS version: Pinto Notes needs macOS 26 or later, and older Macs may need an older app.",
  ] },
  { q: "What's the best notes app for MacBook Pro?", a: [
    "The same as for the Air. If you write code, Obsidian (plain files you can keep in Git) or Pinto Notes (Claude Code and Codex can use your notes from the terminal) fit best.",
  ] },
  { q: "What's the best free notes app for Mac?", a: [
    "Apple Notes and Pinto Notes are free with no limit on notes, and both sync to your iPhone for free. Obsidian is free too, without sync. Bear, Craft, Notion, Evernote and UpNote have free plans with limits.",
  ] },
  { q: "What's the best notes app for Mac and iPhone?", a: [
    "Apple Notes, Pinto Notes, Craft and Bear all have iPhone apps that sync with the Mac. Bear needs Pro for sync; the other three sync for free.",
  ] },
  { q: "What's the best notes app for Mac and iPad?", a: [
    "Apple Notes, especially with an Apple Pencil. Bear, Craft, Notion and Obsidian also have iPad apps. For handwriting first, look at Goodnotes or Notability.",
  ] },
  { q: "Goodnotes or Notability for Mac and iPad?", a: [
    "Both are handwriting apps that are best on an iPad with a Pencil, with Mac apps to read and type. Goodnotes is free for up to 3 files, then from $11.99 a year, and also runs on Windows, Android and the web. Notability records audio alongside your notes and adds AI study tools like summaries and flashcards on its paid plans.",
  ] },
  { q: "Is Apple Notes good enough?", a: [
    "For many people, yes. Pick something else if you want Windows or Android, your notes as files you can open anywhere, or ChatGPT and Claude able to use your notes from any device.",
  ] },
  { q: "Does the Mac have anything like OneNote?", a: [
    "OneNote itself is free on the Mac App Store and syncs through OneDrive. Its pages are free-form: you can type or draw anywhere on the page. Apple Notes keeps text in one column, so for OneNote-style pages, OneNote itself or Goodnotes for handwriting fit better.",
  ] },
  { q: "Which notes app works with ChatGPT?", a: [
    "Of these, Pinto Notes, Notion and Craft have hosted connections ChatGPT can use, and so does Evernote. Apple Notes and Bear only work with AI apps on your own Mac, and Obsidian needs extra setup to go further.",
  ] },
  { q: "Which notes app is the most private?", a: [
    "Obsidian without sync keeps everything on your disk. Apple Notes with Advanced Data Protection and Obsidian Sync are end-to-end encrypted, and so is Bear with Advanced Data Protection, except note titles and tag names. Pinto Notes encrypts notes on your device before they sync, but keeps a sealed copy of your key so you can sign in on a new device, so it isn't end-to-end encryption.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="best-notes-app-for-mac"
      intro={<>You open a new note on your Mac and have to decide where it lives. Pick wrong, and in a year you have two thousand notes in an app you&apos;ve outgrown. I make Pinto Notes, so I&apos;m not a neutral source. I&apos;ve tried to give every app its due, and I say where each one beats mine.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#pinto-notes", label: "The six apps" },
          { href: "#which-one", label: "Which one to pick" },
        ]}>
          <p>
            If you use ChatGPT or Claude, pick <strong>Pinto Notes</strong>: it feels like Apple Notes, it&apos;s free, and your AI can read
            and edit your notes from any device, with Undo. If you want what&apos;s already on your Mac, <strong>Apple Notes</strong> is very
            good. <strong>Bear</strong> is the nicest place to write, <strong>Obsidian</strong> is for plain files and plugins,{" "}
            <strong>Notion</strong> is for teams, and <strong>Craft</strong> makes the best-looking documents.
          </p>
          <PostCta slug="best-notes-app-for-mac" position="answer" title="Pinto Notes is free on Mac and iPhone.">
            <p>Your notes, with ChatGPT and Claude able to use them, and every change undoable.</p>
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
            <tr><th scope="col">App</th><th scope="col">Price</th><th scope="col">iPhone and iPad</th><th scope="col">Windows and Android</th><th scope="col">Where your notes live</th><th scope="col">AI built in</th><th scope="col">ChatGPT and Claude can use your notes</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.app}><th scope="row">{r.app}</th><td>{r.price}</td><td>{r.apple}</td><td>{r.other}</td><td>{r.where}</td><td>{r.ai}</td><td>{r.reach}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Prices are the maker&apos;s own page or the US App Store, read on 7 November 2026. Some makers charge less on their own website than
        in the App Store.
      </p>

      <h2>How I picked</h2>
      <p>
        I looked at what people ask before they switch: will it sync with my iPhone, will my notes still be mine in ten years, what does
        it cost a year, and lately, can ChatGPT or Claude use it. Handwriting apps like Goodnotes do a different job, so they&apos;re at the
        end.
      </p>
      <p>
        The pictures of Pinto Notes, Apple Notes and Obsidian are my own, taken on a Mac running macOS 27. The pictures of Bear, Notion
        and Craft come from the companies that make them.
      </p>

      <h2 id="pinto-notes">1. Pinto Notes: best if you use ChatGPT or Claude</h2>
      <PostFigure src="/blog/news/pinto-notes-mac-chatgpt-edit-framed" width={1720} height={1178}
        alt="Pinto Notes on a Mac: folders in the sidebar, a list of notes, and a Lisbon trip note where the line ChatGPT just added, Late checkout requested, is tinted, with a bar saying ChatGPT changed 1 line and an Undo button."
        caption="ChatGPT added a line to a trip note. Pinto Notes tints it and offers Undo. Screenshot: Pinto Notes." />
      <p>
        Pinto Notes is a free notes app for Mac and iPhone that works like Apple Notes: folders, pinned notes, checklists, tables, and a
        note list sorted by date. The difference is that ChatGPT, Claude, Claude Code and Codex can search, read and edit the
        same notes, from your phone, the web or your Mac.
      </p>
      <p>
        You approve each AI app once. When one changes a note, you see what changed, with Undo, and every earlier version stays in the
        note&apos;s history. That&apos;s what I&apos;d want from any app before I let an AI near my notes.
      </p>
      <p>
        It <a href="/blog/move-from-apple-notes">imports your Apple Notes</a> on the Mac with their folders, and leaves Apple Notes as it
        was. Notes are stored as markdown and encrypted on your device before they sync, and the code is open source under the MIT license.
      </p>
      <p>
        <strong>Where it falls short:</strong> it runs on Mac and iPhone only, with no Windows or Android, no handwriting, and no shared notes. It&apos;s also
        new, so it doesn&apos;t have the years of polish Apple Notes and Bear have.
      </p>
      <p><strong>Best for:</strong> anyone who already asks ChatGPT or Claude to plan things, and is tired of pasting notes back and forth.</p>

      <h2>2. Apple Notes: best if you want nothing new to install</h2>
      <PostFigure src="/blog/news/apple-notes-mac-groceries" width={1600} height={1000}
        alt="Apple Notes on a Mac: folders in the sidebar, a list of notes, and a Groceries note with a checklist where three items are ticked."
        caption="A Groceries note in Apple Notes on a Mac. Screenshot: Pinto Notes." />
      <p>
        Apple Notes is already on your Mac, iPhone and iPad, and it&apos;s better than its reputation. You get folders, tags, Smart
        Folders, <a href="/blog/apple-notes-tables">tables</a>, checklists, scanned documents, Apple Pencil sketches on iPad, and audio
        recordings with a live transcript. It exports notes as PDF or Markdown, and imports Markdown, text and Evernote files.
      </p>
      <p>
        Notes sync through iCloud. By default Apple holds the keys to your notes on its servers; turn on Advanced Data Protection and
        Notes becomes end-to-end encrypted.
      </p>
      <p>
        <strong>Where it falls short:</strong> it&apos;s Apple only (on Windows and Android you get iCloud.com in a browser), your notes live
        in Apple&apos;s database rather than files, and AI help stays on one Mac. The ChatGPT Mac app can read a note you have open
        (Work with Apps) but can&apos;t edit it, and Claude Desktop can read and add notes through Anthropic&apos;s Apple Notes extension:
        see <a href="/blog/claude-and-apple-notes">can Claude read your Apple Notes?</a>
      </p>
      <p><strong>Best for:</strong> people who live on Apple devices and want something free and solid.</p>

      <h2>3. Bear: best for writing</h2>
      <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760}
        alt="Bear 2 on a Mac and an iPhone: a sidebar of nested tags, a list of notes and a note about the North Pole with a highlight, a footnote and a table."
        caption="Bear 2 on the Mac and iPhone. Image: Bear." />
      <p>
        Bear is a Markdown notes app for Mac, iPhone and iPad, and the one I&apos;d point a writer to. It&apos;s beautiful and fast, and
        organises notes with nested tags instead of folders. It has won an Apple Design Award.
      </p>
      <p>
        Bear Free keeps notes on one device. Bear Pro adds iCloud sync, more themes and more export formats, for $2.99 a month or $29.99 a
        year after a 7-day trial. Sync respects Advanced Data Protection, though note titles and tag names stay unencrypted, and Pro lets
        you lock single notes with a password.
      </p>
      <p>
        Bear 2.8 added a command line tool, a Claude connector and an MCP server, so Claude Desktop and Claude Code can work with your
        notes. All three run on the Mac only, and encrypted notes stay off limits to them.
      </p>
      <p><strong>Where it falls short:</strong> Apple only, sync costs money, and no AI on your phone or the web.</p>
      <p><strong>Best for:</strong> writers, students and anyone who likes Markdown and tags.</p>

      <h2>4. Obsidian: best for plain files and plugins</h2>
      <PostFigure src="/blog/news/obsidian-mac-groceries" width={1600} height={1000}
        alt="Obsidian on a Mac: a vault's folders in the sidebar and the Groceries note open in a tab, with ticked items struck through."
        caption="The same Groceries note in Obsidian on a Mac, as a Markdown file in a folder. Screenshot: Pinto Notes." />
      <p>
        Obsidian keeps your notes as plain Markdown files in a folder on your disk, so you own them outright: any text editor can open them. It runs on Mac, Windows, Linux, iPhone, iPad and Android, and it&apos;s free with no sign-up.
      </p>
      <p>
        Its strength is links. You connect notes to each other, build your own wiki and see a graph of how it all fits together, and
        thousands of community plugins and themes let you shape it however you like. Sync is optional and paid, from $4 a month billed
        yearly, with end-to-end encryption, or you can sync the folder yourself.
      </p>
      <p>
        For AI, Obsidian has a command line tool that lets agents work with your vault while the app runs on that computer, and community
        plugins add MCP servers. There&apos;s no official hosted connector, so using your vault from ChatGPT on the web or your phone takes
        extra setup. More in{" "}
        <a href="/blog/obsidian-mcp">Obsidian MCP servers compared</a>.
      </p>
      <p><strong>Where it falls short:</strong> it takes setup, plugins you rely on can stop being maintained, and sync or AI access means paying or tinkering.</p>
      <p><strong>Best for:</strong> people who want to own their files and enjoy building their own system.</p>

      <h2>5. Notion: best for teams</h2>
      <PostFigure src="/blog/news/notion-mac-team-weekly" width={1600} height={1000}
        alt="A Notion page on a Mac called Team weekly, with team and participant properties, an agenda with a chart, and action items with checkboxes."
        caption="A team meeting page in Notion on a Mac. Image: Notion." />
      <p>
        Notion is less a notes app than a workspace: pages, databases, wikis, project boards and docs, shared with your team. It runs on
        Mac, Windows, the web and phones, and works offline on desktop and mobile.
      </p>
      <p>
        Notion AI answers questions across your workspace with citations, and the Business plan adds agents and AI meeting notes; Free and
        Plus get a trial. Notion also has an official MCP server, so Claude, ChatGPT and Cursor can work with your pages. On the App Store,
        Plus is $11.99 a month or $119.99 a year.
      </p>
      <p><strong>Where it falls short:</strong> heavy for quick personal notes, and your notes live on Notion&apos;s servers, so getting them out means an export.</p>
      <p><strong>Best for:</strong> teams, and people who want databases and project tracking next to their notes.</p>

      <h2>6. Craft: best-looking documents</h2>
      <PostFigure src="/blog/news/craft-mac-big-sur-trip" width={1200} height={1225} maxWidth={560}
        alt="Craft on a Mac: a sidebar of folders and a Big Sur Road Trip document with a cover photo, a checklist and day cards with photos."
        caption="A Craft document with a checklist and cards, on a Mac. Image: Craft, from the Mac App Store." />
      <p>
        Craft makes notes that look like finished documents, with cards, pages inside pages and tasks inside your docs. It&apos;s a native
        app rather than a web page in a window, it was an App Store Mac App of the Year, and it runs on Mac, iPhone, iPad, Windows and the
        web, offline too.
      </p>
      <p>
        AI is built in, with about 20 lifetime AI sessions on the free plan and more on paid plans, and Craft connects to Claude, ChatGPT, Claude
        Code and other MCP apps. On the App Store, Plus is $9.99 a month or $95.99 a year.
      </p>
      <p><strong>Where it falls short:</strong> the free plan is limited, and your notes live on Craft&apos;s servers.</p>
      <p><strong>Best for:</strong> people who write plans, proposals and guides for other people to read.</p>

      <h2>Didn&apos;t make the list</h2>
      <ul>
        <li><strong>Evernote.</strong> Still capable, with strong search, its own AI assistant and an MCP connection. The free plan is now 50 notes, one notebook and one device; Starter is $14.99 a month or $99 a year.</li>
        <li><strong>UpNote.</strong> Clean, cheap and on every platform, including Windows, Linux and Android: free up to 50 notes, then $1.99 a month or $39.99 once. No built-in AI and no official connector for ChatGPT or Claude, though it has URL automation.</li>
        <li><strong>Microsoft OneNote.</strong> Free on the Mac App Store, with free-form pages you can type or draw anywhere on, and sync through OneDrive. A good pick if you live in Microsoft 365. It left our top six because it doesn&apos;t follow Mac conventions as closely as the apps above.</li>
        <li><strong>Goodnotes and Notability.</strong> The handwriting apps. Goodnotes is free for up to 3 files, then from $11.99 a year, on Apple devices, Windows, Android and the web. Notability adds audio recording and AI study tools. Both are best on an iPad with a Pencil.</li>
      </ul>

      <h2 id="which-one">Which one should you pick?</h2>
      <ul>
        <li>You use ChatGPT or Claude every week: <strong>Pinto Notes</strong>.</li>
        <li>You want free, built in, nothing new to learn: <strong>Apple Notes</strong>.</li>
        <li>You write a lot and love Markdown: <strong>Bear</strong>.</li>
        <li>You want plain files, Windows or Linux, or plugins: <strong>Obsidian</strong>.</li>
        <li>You work with a team: <strong>Notion</strong>.</li>
        <li>You make documents other people read: <strong>Craft</strong>.</li>
      </ul>
      <p>
        Moving later is easier than it used to be. Apple Notes, Bear and Obsidian all export Markdown, and Pinto Notes brings over your
        Apple Notes with their folders: <a href="/blog/move-from-apple-notes">how to move from Apple Notes</a>.
      </p>
      <p className="label">Sources</p>
      <p>
        Read on 7 November 2026 on each maker&apos;s own pages: <a href="https://support.apple.com/guide/notes/welcome/mac">Apple Notes guide</a>,{" "}
        <a href="https://support.apple.com/en-us/102651">iCloud data security</a>, <a href="https://help.openai.com/en/articles/10119604-work-with-apps-on-macos">ChatGPT Work with Apps</a>,{" "}
        <a href="https://bear.app">Bear</a> and <a href="https://bear.app/faq/command-line-interface/">its MCP server</a>, <a href="https://obsidian.md/pricing">Obsidian pricing</a>,{" "}
        <a href="https://www.notion.com/pricing">Notion pricing</a>, <a href="https://www.notion.com/help/notion-mcp">Notion MCP</a>, <a href="https://www.craft.do/pricing">Craft pricing</a>,{" "}
        <a href="https://evernote.com/compare-plans">Evernote plans</a>, <a href="https://getupnote.com">UpNote</a> and <a href="https://www.goodnotes.com/pricing">Goodnotes pricing</a>,
        plus the US App Store listings of Notion, Craft and OneNote.
      </p>
      <PostCta slug="best-notes-app-for-mac" position="end" title="Try Pinto Notes. It's free.">
        <p>Import your Apple Notes, then connect ChatGPT or Claude.</p>
      </PostCta>
    </PostPage>
  );
}
