import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, FigurePair, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-vs-obsidian", { title: "Apple Notes vs Obsidian: what each does better" });

// Written 21 November 2026 for "apple notes vs obsidian". Google autocomplete (en-US, read 21 Nov): apple notes vs obsidian
// (reddit, 2026), obsidian vs apple notes, apple notes or obsidian, ios notes vs obsidian, mac notes vs obsidian, apple notes
// better than obsidian, icloud notes vs obsidian, obsidian vs iphone notes, obsidian and apple notes sync, apple notes obsidian
// integration, apple notes vs obsidian vs notion, notion vs apple notes vs obsidian.
// The slug is in lib/removed-posts.ts (redirected 7 November); the lead removes that entry when registering this post.
// Obsidian, read 21 Nov 2026 on obsidian.md: /pricing ("Free without limits. No sign-up required."; Sync $4 per user per month
// billed annually, $5 monthly, "AES-256 end-to-end encryption"; Publish $8 per site per month billed annually, $10 monthly;
// commercial license optional), the home page (plain text Markdown files stored locally, links, graph, canvas, thousands of
// plugins), /download (Windows, Mac, Linux, iOS, Android), /help/data-storage (a vault is a folder; other editors can open the
// files), /help/sync-notes (iCloud can sync vaults between iOS and macOS; other services), /help/links ([[ ]] links, updated on
// rename), /help/plugins/backlinks (linked and unlinked mentions), /help/plugins/file-recovery (snapshots kept 7 days by
// default, not synced), /help/sync/version-history (1 month on Standard, 12 months on Plus), /help/cli (needs the app running),
// /help/import/apple-notes (macOS only, locked notes skipped, tables, images, drawings, scans and PDFs).
// Notion, read 21 Nov 2026: notion.com/product ("The AI workspace that works for you", for teams), /desktop (Mac and Windows,
// "Notion is also on mobile"), /pricing (Free includes a trial of Notion AI). No Notion prices: the page showed euros.
// Apple, read 21 Nov 2026 on support.apple.com: guide/notes/not201900c07/mac (File, Import to Notes or Import Markdown: Markdown,
// TXT, RTF, RTFD, HTML, ENEX; File, Export To, PDF or Markdown, for the selected note), guide/notes/apde615d29c2/mac (Edit, Add
// Link, or >>; links named with the title update on rename; nothing on links back), en-us/102651 (Notes: Apple holds the keys
// by default, end-to-end with Advanced Data Protection), guide/icloud/mm000b55f946 and mmc0cd6edf (icloud.com/notes, on a phone
// or computer). From BRIEF's verified list: tags, Smart Folders, tables, checklists, search, pinning, Math Results, Apple
// Intelligence transcripts and summaries, locked notes, sharing needs an Apple Account. No version history in Apple Notes:
// verified in apple-notes-version-history. ChatGPT and Claude only on a Mac: best-notes-app-for-mac.
// Pinto Notes: Obsidian and Apple Notes import wording from import-your-notes; [[links]] and Linked From from
// apple-notes-backlinks (Pane/Model/WikiLinks.swift, LinkedFromMenu on main); File, Version History from
// recover-deleted-apple-notes; Mac and iPhone only, free, Markdown, encrypted: BRIEF. No graph view in the app (checked on main).
// Pictures: the Groceries pair from best-notes-app-for-mac, the Obsidian import screens (PaneTests/HIG/PersonaImportShots,
// offscreen), and SHOTS.aiEdit.

const FAQ = [
  { q: "Is Apple Notes better than Obsidian?", a: [
    "For quick notes on an iPhone and a Mac, often yes: it's already there, syncs for free and needs no setup. Obsidian is better if you want plain Markdown files, backlinks, plugins, or apps for Windows, Linux and Android.",
  ] },
  { q: "Can Obsidian sync with Apple Notes?", a: [
    "No. There's no live link between them. Obsidian's Importer plugin copies your Apple Notes into a vault once, on a Mac, and Apple Notes can import Markdown files the other way. After that, each app keeps its own copy.",
  ] },
  { q: "Is Obsidian free?", a: [
    "Yes. Obsidian says it's free without limits and needs no sign-up. Obsidian Sync costs $4 a month billed annually, or $5 monthly, and Publish $8 a month billed annually, or $10 monthly (obsidian.md, 21 November 2026). You can also sync your vault with iCloud between iPhone and Mac.",
  ] },
  { q: "Notion, Apple Notes or Obsidian: which should I use?", a: [
    "Apple Notes for quick personal notes on Apple devices, Obsidian for a linked library of files you own, and Notion for shared work with a team.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-vs-obsidian"
      intro={<>Apple Notes is the app you already have. Obsidian is the one that comes up when people want more. They solve different problems, so the right pick depends on what you keep in your notes and where you open them.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#apple-notes", label: "Where Apple Notes wins" },
          { href: "#obsidian", label: "Where Obsidian wins" },
          { href: "#switching", label: "Moving between them" },
          { href: "#pinto-notes", label: "A third option" },
        ]}>
          <p>
            Pick <strong>Apple Notes</strong> if you want quick notes on your iPhone and Mac that sync for free with nothing to set up. Pick{" "}
            <strong>Obsidian</strong> if you want your notes as plain Markdown files you own, links with backlinks and a graph, plugins, or
            apps for Windows, Linux and Android. Obsidian is free; its sync costs extra, unless you sync through iCloud.
          </p>
          <PostCta slug="apple-notes-vs-obsidian" position="answer" title="Want Apple Notes' feel with Markdown underneath?">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac, keeps notes as Markdown with [[links]], saves every earlier version, and lets ChatGPT or Claude read and edit them. It imports Apple Notes or an Obsidian vault on your Mac.</p>
          </PostCta>
        </Answer>
      }
      hero={<FigurePair
        items={[
          { src: "/blog/news/apple-notes-mac-groceries", width: 1600, height: 1000, alt: "Apple Notes on a Mac: folders in the sidebar, a list of notes, and a Groceries note with a checklist where three items are ticked." },
          { src: "/blog/news/obsidian-mac-groceries", width: 1600, height: 1000, alt: "Obsidian on a Mac: a vault's folders in the sidebar and the Groceries note open in a tab, with ticked items struck through." },
        ]}
        caption="The same Groceries note in Apple Notes (left) and Obsidian (right), on a Mac. In Obsidian it's a Markdown file in a folder. Screenshots: Pinto Notes." />}
      faq={FAQ}
    >
      <h2 id="at-a-glance">At a glance</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col"></th><th scope="col">Apple Notes</th><th scope="col">Obsidian</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Price</th><td>Free, comes with your iPhone and Mac</td><td>Free, no sign-up. Sync from $4 a month, billed annually</td></tr>
            <tr><th scope="row">Runs on</th><td>Apple devices; icloud.com/notes in a browser</td><td>Mac, Windows, Linux, iPhone, Android</td></tr>
            <tr><th scope="row">Where notes live</th><td>Inside Notes, synced with iCloud by default</td><td>A folder of plain Markdown files</td></tr>
            <tr><th scope="row">Sync</th><td>iCloud</td><td>Obsidian Sync, iCloud (iPhone and Mac), or another service</td></tr>
            <tr><th scope="row">Links between notes</th><td>Edit, Add Link; no list of links back</td><td>[[Links]], backlinks, a graph</td></tr>
            <tr><th scope="row">Earlier versions</th><td>None</td><td>Local snapshots for 7 days; 1 or 12 months with Sync</td></tr>
            <tr><th scope="row">Encryption</th><td>Apple holds the keys by default; end-to-end with Advanced Data Protection</td><td>End-to-end with Sync; files on your disk otherwise</td></tr>
            <tr><th scope="row">Extras</th><td>Tables, tags, Smart Folders, recordings with transcripts</td><td>Thousands of community plugins and themes, Canvas, Publish</td></tr>
          </tbody>
        </table>
      </div>
      <p>Prices and features as read on Apple&apos;s and Obsidian&apos;s own pages on 21 November 2026.</p>

      <h2 id="apple-notes">Where Apple Notes is better</h2>
      <p>
        <strong>It&apos;s already there.</strong> Notes comes with your iPhone and Mac and syncs through iCloud at no extra cost. There&apos;s
        nothing to set up and no plugins to keep updated. On a computer that isn&apos;t yours, your iCloud notes open at
        icloud.com/notes.
      </p>
      <p>
        <strong>The everyday tools are built in.</strong> Checklists that can sort ticked items to the bottom, tables (Format, Table),{" "}
        #tags with Smart Folders, pinned notes, Math Results for sums you type, and locked notes with a password, Face ID or Touch ID. Search reads
        every word in every note. With Apple Intelligence, a recording in a note becomes a transcript and a summary.
      </p>
      <p>
        <strong>Sharing is simple.</strong> You can share a note with anyone who has an Apple Account. Obsidian shares vaults through
        Sync, a paid add-on.
      </p>
      <p>
        <strong>Where it falls short:</strong> your notes live inside Notes rather than as files, export is File, Export To (PDF or
        Markdown) for the note you&apos;ve selected, and there are no Windows or Android apps. Links between notes exist (Edit, Add Link, or
        type &gt;&gt;), but a note never shows what links to it; <a href="/blog/apple-notes-backlinks">Apple Notes backlinks</a> covers the
        workarounds. And it keeps <a href="/blog/apple-notes-version-history">no version history</a>, so a paragraph you deleted last week
        is gone.
      </p>

      <h2 id="obsidian">Where Obsidian is better</h2>
      <p>
        <strong>Your notes are files.</strong> Obsidian stores notes as plain text Markdown files in a vault, which is an ordinary folder
        on your disk. Any text editor can open them, you can back them up however you like, and they&apos;ll still open if you stop using
        Obsidian.
      </p>
      <p>
        <strong>Links are the point.</strong> Type [[ and a note&apos;s name to link it. Obsidian updates those links when you rename a
        note, the Backlinks panel lists every note that links to the one you&apos;re in (and the ones that only mention its name), and the
        graph shows how it all connects. Canvas gives you an open board to lay out ideas.
      </p>
      <p>
        <strong>It runs everywhere and bends to you.</strong> There are apps for Mac, Windows, Linux, iPhone and Android, and thousands of
        community plugins and themes. Sync is optional: Obsidian Sync is end-to-end encrypted and keeps earlier versions of each note
        (1 month on Standard, 12 months on Plus), or you can sync the vault with iCloud between your iPhone and Mac. Obsidian warns
        against syncing one vault with two services at once.
      </p>
      <p>
        <strong>Where it falls short:</strong> you build your own system, and that takes time. Plugins you rely on are made by other
        people and can stop being maintained. Without Sync, earlier versions are only local snapshots, kept 7 days by default and not
        shared between devices. For AI, Obsidian&apos;s command line tool controls the app on that computer while it runs, and community
        plugins add MCP servers; <a href="/blog/obsidian-mcp">Obsidian MCP servers, compared</a> has the details.
      </p>

      <h2 id="switching">Moving between them</h2>
      <p>
        <strong>Apple Notes to Obsidian:</strong> Obsidian&apos;s official Importer plugin reads your Apple Notes on a Mac and writes each one
        as a Markdown file, with tables, pictures, drawings, scans and PDFs. It doesn&apos;t run on iPhone, and it skips locked notes, so
        unlock those first. <a href="/blog/move-apple-notes-to-obsidian-notion-keep">Move Apple Notes to Obsidian, Notion or Google Keep</a>{" "}
        has the steps.
      </p>
      <p>
        <strong>Obsidian to Apple Notes:</strong> on a Mac, File, Import to Notes (or File, Import Markdown) brings in Markdown and text
        files. Apple Notes links notes its own way, so check a few notes with [[links]] after the import.
      </p>
      <p>
        Neither move keeps the two apps in sync. Each one copies the notes once, and from then on you have two separate libraries.
      </p>

      <h2 id="notion">And Notion?</h2>
      <p>
        Notion is the third name in this search, and it does a different job. Notion calls itself &ldquo;the AI workspace that works for you&rdquo;
        and is built for teams, with Notion AI included (the Free plan has a trial). It has apps for Mac and Windows and on mobile. If your notes are mostly for you, Apple Notes or Obsidian fits
        better. If they&apos;re for a team, Notion does.
      </p>

      <h2 id="pinto-notes">A third option: Apple Notes&apos; feel, Markdown underneath</h2>
      <p>
        A common reason to look at Obsidian is wanting what Apple Notes doesn&apos;t give you: notes as Markdown, links both ways, earlier
        versions, and an AI that can use them. Pinto Notes, the notes app for iPhone and Mac, keeps Apple Notes&apos; folders, checklists,
        tables and note list, and adds those things.
      </p>
      <Figure shot={SHOTS.aiEdit} caption="A Groceries note in Pinto Notes on a Mac, right after ChatGPT added five lines. Each change is tinted, with Undo." />
      <ul>
        <li><strong>Markdown and links.</strong> Notes are stored as Markdown, and [[Title]] links one note to another. Each note lists the notes that link to it under Linked From.</li>
        <li><strong>Every earlier version.</strong> File, Version History shows each version and who made it, and restores any of them.</li>
        <li><strong>Your AI in your notes.</strong> ChatGPT, Claude, Claude Code and Codex can search, read and edit your notes from any device once you <a href="/blog/connect-chatgpt-to-your-notes">connect them</a>, which takes a minute. Notes are encrypted.</li>
      </ul>
      <PostFigure src="/blog/launch/import-obsidian-found-done" width={1600} height={1000} maxWidth={640}
        alt="Two Pinto Notes import screens on a Mac: Found it, a vault named Second brain with 27 notes and an Import Second brain button, then 27 notes from Obsidian are here, links between notes still work."
        caption="Importing an Obsidian vault in Pinto Notes on a Mac. The vault stays where it is." />
      <p>
        Coming from Obsidian, Pinto Notes finds your vault. Subfolders, pictures and the links between notes come too, and your vault stays
        where it is. Coming from Apple Notes, your folders and pictures come over in one import on your Mac, and Apple Notes isn&apos;t
        changed: <a href="/blog/move-from-apple-notes">moving from Apple Notes</a> walks through it.
      </p>
      <p>
        <strong>Where it falls short:</strong> Pinto Notes is Apple only, on iPhone and Mac, with no Windows, Android, Linux or web app.
        It has no graph view and none of Obsidian&apos;s community plugins. If you need those, Obsidian is the better fit.
      </p>
    </PostPage>
  );
}
