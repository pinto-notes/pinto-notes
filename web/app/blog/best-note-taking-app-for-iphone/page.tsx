import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("best-note-taking-app-for-iphone", {
  title: "Best note-taking app for iPhone in 2026: 7 apps compared",
});

// Written 21 November 2026 for "best note taking app for iphone". Google autocomplete (en-US, read 21 Nov):
// best note taking app for iphone, best note app for iphone, best notes app for iphone and mac, best note taking
// app for iphone free, best note taking app for iphone ai, plus iphone and windows, iphone and android, iphone and pc.
// The model is best-notes-app-for-mac (same list format). Every fact about another app was read today on the
// maker's own pages or its US App Store listing:
// Apple: support.apple.com/guide/iphone Notes chapter (topics: drawings and handwriting, formulas, record and
// transcribe audio, scan, PDFs, tags, Smart Folders, share, lock); "Record and transcribe audio" (transcription on
// iPhone 12 and later in supported languages; Apple Intelligence summary of a transcript on iOS 27 on an Apple
// Intelligence iPhone; not in all languages or regions); "Lock notes" (device passcode or a separate password,
// Face ID or Touch ID; notes with video, audio, PDF or file attachments or tags can't be locked); "Use Notes on
// iCloud.com" (support.apple.com/guide/icloud/mm6704cac5: icloud.com/notes in a web browser on a phone, tablet
// or computer). Checklists, tables, Math Results, pins and sharing are from BRIEF.md's verified list.
// Bear: bear.app (Free: local notes; Pro: iCloud sync, themes, search inside PDFs and images, $2.99 a month or
// $29.99 a year; Mac and iPhone), App Store listing (Pro: password-encrypted notes, Face ID lock; iOS 16),
// bear.app/faq/command-line-interface (Claude Connector, MCP server and CLI are macOS only).
// Obsidian: obsidian.md/mobile (free on iOS and Android), obsidian.md/pricing (free; Sync $4 a month billed
// yearly, $5 monthly, encrypted so Obsidian can't read it), App Store listing (local folder of Markdown files,
// iCloud vaults).
// Notion: App Store listing (free; Plus $11.99 a month or $119.99 a year; Notion AI; iOS 18), notion.com/mobile
// (iOS and Android), notion.com/help guide on working offline (all users can view, edit and create pages
// offline on mobile), notion.com/help/notion-mcp (Claude, ChatGPT, Cursor).
// Google Keep: App Store listing (free, no in-app purchases; reminders by time or place, labels and colours,
// voice memos transcribed, shared lists, keep.google.com; no AI mentioned; iOS 18), Keep help 2888240 (iOS and
// Android versions) and 6191044 (up to 50 labels, pins; no folders).
// Evernote: evernote.com/compare-plans (Free: 50 notes, 1 notebook, 1 device; AI Assistant, Semantic Search,
// AI Transcribe, AI Edit, MCP connection; no prices shown, so none quoted), evernote.com/download (iOS,
// Android, Mac, Windows), App Store listing (iOS 15.1).
// Pinto Notes: app/blog/pinto-notes-for-iphone (free on the App Store; AI edits land a second later, tinted,
// with Undo; every version kept; checklists, tables, files, offline, lock with a password and Face ID; connect
// from the Mac app or from the AI itself), app/blog/import-your-notes (imports on a Mac; iPhone brings notes
// one at a time), its App Store listing (free, no in-app purchases, iOS 26), BRIEF.md (encrypted, with no stronger claim).
// Pictures: /blog/launch/iphone-chatgpt-changed-groceries (Pinto Notes on iPhone, as in posts.ts),
// /blog/apple/iphone-notes-ios27-folders-list (Apple), /blog/news/bear-2-mac-and-iphone (Bear).
// Recheck prices monthly.

type Row = { app: string; price: string; also: string; organise: string; ai: string; reach: string };

const ROWS: Row[] = [
  { app: "Pinto Notes", price: "Free", also: "Mac", organise: "Folders, checklists, tables, files", ai: "No, bring your own", reach: "Yes, from your phone, the web or a Mac, with Undo" },
  { app: "Apple Notes", price: "Comes with your iPhone", also: "Mac; iCloud.com in a browser", organise: "Folders, tags, Smart Folders", ai: "Apple Intelligence summaries of recordings, on supported iPhones", reach: "Not from your iPhone" },
  { app: "Bear", price: "Free; sync needs Pro ($2.99 a month or $29.99 a year)", also: "Mac", organise: "Tags", ai: "No", reach: "Claude, on a Mac only" },
  { app: "Obsidian", price: "Free; Sync $4 a month billed yearly, or use iCloud", also: "Mac, Windows, Linux, Android", organise: "Folders and links between notes", ai: "No (community plugins)", reach: "Takes extra setup" },
  { app: "Notion", price: "Free; Plus $11.99 a month or $119.99 a year", also: "Mac, Windows, Android, web", organise: "Pages and databases", ai: "Notion AI", reach: "Yes, official MCP server" },
  { app: "Google Keep", price: "Free", also: "Android, web", organise: "Labels, colours, pins", ai: "None in its App Store listing", reach: "No" },
  { app: "Evernote", price: "Free for 50 notes on one device; paid plans", also: "Mac, Windows, Android, web", organise: "Notebooks and tags", ai: "AI Assistant, transcription, search", reach: "MCP connection" },
];

const FAQ = [
  { q: "What's the best free note-taking app for iPhone?", a: [
    "Apple Notes, Pinto Notes and Google Keep are free, and all three sync between your devices at no cost. Obsidian is free too, with sync through iCloud or its paid Sync. Bear's free version keeps notes on one device, and Evernote's free plan stops at 50 notes on one device.",
  ] },
  { q: "Which iPhone notes app has the best AI?", a: [
    "It depends on whose AI. Notion and Evernote have their own AI inside the app. Apple Notes can summarise a recording with Apple Intelligence on supported iPhones. Pinto Notes has no AI of its own: ChatGPT or Claude, the AI you already use, can read and edit your notes once connected.",
  ] },
  { q: "What's the best note app for iPhone and Windows?", a: [
    "Obsidian, Notion and Evernote all have Windows apps, and Google Keep has keep.google.com in a browser. Apple Notes runs in a browser at icloud.com/notes. Pinto Notes and Bear don't run on Windows.",
  ] },
  { q: "What's the best notes app for iPhone and Android?", a: [
    "Google Keep, Obsidian, Notion and Evernote all have Android apps. Apple Notes, Bear and Pinto Notes are Apple only, so if you switch phones often, pick one of the first four.",
  ] },
  { q: "Which iOS version does each app need?", a: [
    "From their App Store listings on 21 November 2026: Pinto Notes needs iOS 26, Notion and Google Keep need iOS 18, Bear iOS 16, Obsidian iOS 15.6 and Evernote iOS 15.1. Apple Notes comes with every iPhone.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="best-note-taking-app-for-iphone"
      intro={<>Many notes start on a phone: a list in the shop, an idea on the bus, a number someone reads out. The app you put them in decides whether you find them again. Pinto Notes is our app, so this list isn&apos;t neutral. Every other app gets its real strengths, from its maker&apos;s own pages.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#pinto-notes", label: "The seven apps" },
          { href: "#ai", label: "Apps that work with AI" },
          { href: "#which-one", label: "Which one to pick" },
        ]}>
          <p>
            For most people, <strong>Apple Notes</strong> is already a very good notes app, and it&apos;s free. If you want ChatGPT or Claude
            to read and edit your notes from your phone, pick <strong>Pinto Notes</strong>. <strong>Bear</strong> is the nicest place to write,{" "}
            <strong>Obsidian</strong> keeps plain files, <strong>Notion</strong> suits teams, <strong>Google Keep</strong> is quick lists
            on any phone, and <strong>Evernote</strong> has the most built-in AI.
          </p>
          <PostCta slug="best-note-taking-app-for-iphone" position="answer" title="Pinto Notes is free on iPhone and Mac.">
            <p>It works like Apple Notes. Ask ChatGPT or Claude to add to a note, and it&apos;s on your phone a second later, with Undo.</p>
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
            <tr><th scope="col">App</th><th scope="col">Price</th><th scope="col">Also on</th><th scope="col">How you organise</th><th scope="col">AI built in</th><th scope="col">ChatGPT and Claude can use your notes</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.app}><th scope="row">{r.app}</th><td>{r.price}</td><td>{r.also}</td><td>{r.organise}</td><td>{r.ai}</td><td>{r.reach}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Prices are from the US App Store or the maker&apos;s own page, read on 21 November 2026. Evernote&apos;s plans page doesn&apos;t
        show prices, so none are quoted here.
      </p>

      <h2 id="pinto-notes">1. Pinto Notes: best if you use ChatGPT or Claude</h2>
      <PostFigure src="/blog/launch/iphone-chatgpt-changed-groceries" width={660} height={1434} maxWidth={300}
        alt="A Groceries list in Pinto Notes on iPhone with five lines ChatGPT added tinted amber, and a bar saying ChatGPT changed 5 lines, with Undo."
        caption="ChatGPT added five items to a Groceries list. They're tinted, with Undo. Screenshot: Pinto Notes." />
      <p>
        Pinto Notes is a free notes app for iPhone and Mac that works like Apple Notes: folders, checklists that move ticked items to the
        bottom, tables you edit cell by cell, and photos, PDFs and files in your notes. You can keep writing offline, and lock a note with a
        password and Face ID.
      </p>
      <p>
        The difference is that ChatGPT and Claude can read and edit the same notes. Ask for a shopping list from your laptop, and it&apos;s
        on your phone when you&apos;re in the shop. The lines an AI changed are tinted, with Undo, and every earlier version stays in the
        note&apos;s history. You connect your AI once, from the Mac app or from the AI itself:{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connecting ChatGPT or Claude</a> has the steps.
      </p>
      <p>
        Notes are encrypted on your device before they sync. A whole library from Apple Notes, Obsidian, Evernote, Google Keep or Bear is
        easiest to <a href="/blog/import-your-notes">import on a Mac</a>, and it&apos;s on your iPhone a moment later. Apple Notes isn&apos;t
        changed.
      </p>
      <p>
        <strong>Where it falls short:</strong> iPhone and Mac only, with no Windows, Android or web app. It needs iOS 26, and it&apos;s new,
        so it doesn&apos;t have the years of polish Apple Notes and Bear have. More in <a href="/blog/pinto-notes-for-iphone">Pinto Notes is
        on iPhone</a>.
      </p>
      <p><strong>Best for:</strong> anyone who already asks ChatGPT or Claude to plan things and is tired of copying notes back and forth.</p>

      <h2>2. Apple Notes: best if you want nothing new</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="The Folders list in Notes on iPhone with iOS 27: Quick Notes and Shared, iCloud folders such as Notes, Gift Ideas and Grocery List, and a Tags section below."
        caption="Folders and tags in Notes on iPhone. Image: Apple." />
      <p>
        Apple Notes comes with your iPhone and syncs to your Mac through iCloud for free. It does far more than most people use: checklists,
        tables, tags and Smart Folders, scanned documents, drawings and handwriting, PDFs, and Math Results for sums you type. You can pin a
        note to the top of its folder and share a note with anyone who has an Apple Account.
      </p>
      <p>
        Record audio in a note and Notes writes a live transcript, on iPhone 12 and later in supported languages. On an iPhone that supports
        Apple Intelligence, it can summarise the transcript too. You can lock notes with your iPhone passcode or a separate password, and open
        them with Face ID or Touch ID, though notes with tags or audio, video, PDF or file attachments can&apos;t be locked.
      </p>
      <p>
        <strong>Where it falls short:</strong> Apple only. On Windows or Android you get icloud.com/notes in a browser. And there&apos;s no
        way for ChatGPT or Claude to work in your notes from your phone: what exists runs on a Mac, as{" "}
        <a href="/blog/claude-and-apple-notes">can Claude read your Apple Notes?</a> explains.
      </p>
      <p><strong>Best for:</strong> people who live on Apple devices and want something free and solid.</p>

      <h2>3. Bear: best for writing</h2>
      <PostFigure src="/blog/news/bear-2-mac-and-iphone" width={1270} height={760}
        alt="Bear 2 on a Mac and an iPhone: a sidebar of nested tags, a list of notes and a note about the North Pole with a highlight, a footnote and a table."
        caption="Bear 2 on the Mac and iPhone. Image: Bear." />
      <p>
        Bear is a Markdown notes app for iPhone and Mac, and the one we&apos;d point a writer to. It&apos;s calm and fast, and it organises
        notes with tags instead of folders.
      </p>
      <p>
        The free version keeps notes on one device. Bear Pro adds iCloud sync, more themes, search inside PDFs and images, password-encrypted
        notes and an app lock with Face ID or Touch ID, for $2.99 a month or $29.99 a year. Bear&apos;s Claude connector and MCP server run on the Mac only.
      </p>
      <p><strong>Where it falls short:</strong> Apple only, and sync between your iPhone and Mac costs money.</p>
      <p><strong>Best for:</strong> writers, students and anyone who likes Markdown and tags.</p>

      <h2>4. Obsidian: best for plain files</h2>
      <p>
        Obsidian keeps your notes as plain Markdown files in a folder, so any text editor can open them. The iPhone app is free, as it is on
        Android, and it has the same tabs, command palette and plugins as the desktop app.
      </p>
      <p>
        To get your notes onto other devices, keep the vault in iCloud, or pay for Obsidian Sync: $4 a month billed yearly, or $5 monthly,
        encrypted so Obsidian can&apos;t read it, with version history.
      </p>
      <p><strong>Where it falls short:</strong> it takes setup, and it feels more like a toolkit than a quick notes app on a phone.</p>
      <p><strong>Best for:</strong> people who want to own their files and build their own system.</p>

      <h2>5. Notion: best for teams</h2>
      <p>
        Notion is a workspace more than a notes app: pages, databases and wikis, shared with your team, on iPhone, Android, Mac, Windows and
        the web. Every user can view, edit and create pages offline on the phone app. Notion AI can search, write, analyse and chat inside
        the app, and Notion&apos;s MCP server lets Claude, ChatGPT and Cursor work with your pages.
      </p>
      <p>On the App Store, Plus is $11.99 a month or $119.99 a year.</p>
      <p><strong>Where it falls short:</strong> heavy for a quick note on your phone, and your notes live on Notion&apos;s servers.</p>
      <p><strong>Best for:</strong> teams, and people who want databases and projects next to their notes.</p>

      <h2>6. Google Keep: best for quick lists on any phone</h2>
      <p>
        Google Keep is free, with no in-app purchases. Notes are cards you sort with labels (up to 50), colours and pins, and it has no
        folders. It reminds you of a note at a time or a place, turns voice memos into text, and lets you share a list that ticks off in
        real time. It runs on iPhone, Android and keep.google.com.
      </p>
      <p><strong>Where it falls short:</strong> no folders, and its App Store listing mentions no AI features.</p>
      <p><strong>Best for:</strong> shopping lists and reminders, especially in a home with both iPhones and Android phones.</p>

      <h2>7. Evernote: most AI built in</h2>
      <p>
        Evernote runs on iPhone, Android, Mac and Windows, and its plans list an AI Assistant that searches and organises your notes from a
        chat, transcription of audio and images, AI editing, search in plain language, and an MCP connection for outside AI apps.
      </p>
      <p>
        <strong>Where it falls short:</strong> the free plan is 50 notes, one notebook and one device. Its plans page didn&apos;t show prices
        when we read it, so check the App Store before you subscribe.
      </p>
      <p><strong>Best for:</strong> people with a big Evernote library, or who want AI inside the notes app itself.</p>

      <h2 id="ai">Which iPhone notes apps work with AI?</h2>
      <p>There are two kinds of AI in a notes app, and they suit different people.</p>
      <ul>
        <li><strong>AI inside the app.</strong> Notion AI, Evernote&apos;s AI Assistant, and Apple Intelligence summaries in Apple Notes. You use the app&apos;s AI, on its terms.</li>
        <li><strong>Your own AI in your notes.</strong> Pinto Notes, Notion and Evernote let an outside AI app work with your notes. With Pinto Notes, ChatGPT and Claude can do it from your phone, and every change has Undo.</li>
      </ul>
      <p>
        <a href="/blog/best-notes-app-for-mac">Best notes app for Mac</a> compares the same apps on the Mac, with Craft and a few more.
      </p>

      <h2 id="which-one">Which one should you pick?</h2>
      <ul>
        <li>You use ChatGPT or Claude every week: <strong>Pinto Notes</strong>.</li>
        <li>You want free, built in, nothing new to learn: <strong>Apple Notes</strong>.</li>
        <li>You write a lot and love Markdown: <strong>Bear</strong>.</li>
        <li>You want plain files, or Windows and Linux: <strong>Obsidian</strong>.</li>
        <li>You work with a team: <strong>Notion</strong>.</li>
        <li>Your household mixes iPhone and Android: <strong>Google Keep</strong>.</li>
        <li>You want AI inside the app: <strong>Evernote</strong> or <strong>Notion</strong>.</li>
      </ul>
      <p>
        For iPhone and Mac, Apple Notes, Pinto Notes, Bear, Obsidian, Notion and Evernote all have Mac apps. Need Windows or Android too? See{" "}
        <a href="/blog/apple-notes-alternatives">Apple Notes alternatives</a>.
      </p>
      <p className="label">Sources</p>
      <p>
        Read on 21 November 2026: <a href="https://support.apple.com/guide/iphone/record-and-transcribe-audio-iphbe11247b5/ios">Record and transcribe audio</a>{" "}
        and <a href="https://support.apple.com/guide/iphone/lock-notes-iphf177bb154/ios">Lock notes</a> in the iPhone User Guide,{" "}
        <a href="https://support.apple.com/guide/icloud/notes-on-icloudcom-overview-mm6704cac5/icloud">Notes on iCloud.com</a>, <a href="https://bear.app">Bear</a>,{" "}
        <a href="https://obsidian.md/pricing">Obsidian pricing</a>, <a href="https://www.notion.com/help/notion-mcp">Notion MCP</a>,{" "}
        <a href="https://support.google.com/keep/answer/6191044">Google Keep Help</a>, <a href="https://evernote.com/compare-plans">Evernote plans</a>,
        and the US App Store listings of Notion, Google Keep, Bear, Obsidian and Evernote.
      </p>
      <PostCta slug="best-note-taking-app-for-iphone" position="end" title="Try Pinto Notes. It's free.">
        <p>Get it on your iPhone, then connect ChatGPT or Claude.</p>
      </PostCta>
    </PostPage>
  );
}
