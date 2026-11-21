import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("google-keep-alternative-for-iphone-and-mac", {
  title: "Google Keep alternative for iPhone and Mac",
});

// Written 21 November 2026 for "google keep alternative", row 3 of topic-research-2026-11-23.md.
// Live Google autocomplete rechecked today, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=google%20keep%20alternative
// Returned: google keep alternative, google keep alternative free, google keep alternative reddit,
// google keep alternative self hosted, google keep alternative open source, google keep alternative microsoft,
// google keep alternative for android, google keep alternative ios, google keep alternative nextcloud,
// google keep alternative linux. Android/Linux/self-hosted queries are outside this post's scope.
// Research notes: broad vendor roundups already cover alternatives. This post covers the Apple-only
// replacement decision and what a Takeout import preserves, without repeating the Apple Notes migration guide.
// Official maker pages read live 21 November 2026:
// https://support.google.com/keep/answer/2888240?hl=en (computer browser access, notes, lists, sharing);
// the same page with &co=GENIE.Platform%3DiOS and &co=GENIE.Platform%3DAndroid (phone apps).
// https://support.google.com/keep/answer/6101196?hl=en (collaborators can edit shared notes).
// https://support.google.com/keep/answer/10017039?hl=en (export includes text/list items, attachments,
// colours, pinned/archived state, collaborators and labels; export contents differ from importer support).
// https://support.google.com/accounts/answer/3024190 (select products, Next step, one-time archive,
// ZIP, Create export, Download archive; minutes to days; downloading does not delete Google data).
// Apple Notes facts: folders, checklists and tables, from BRIEF.md and Apple's guides read today:
// https://support.apple.com/guide/notes/welcome/mac
// https://support.apple.com/guide/iphone/iph1ac0b3a2/ios
// Apple pages fetched directly over HTTPS after the web reader returned 429. No Apple menu steps used.
// Pinto sources opened in this wave8 checkout, paths relative to the repo root:
// Pane/Model/KeepImport.swift: KeepNote, keepFolder, run, body and add confirm Takeout JSON/folder/ZIP
// input, text, checklist states, images, pins, creation/edit dates, first label as folder and remaining
// labels as tags, optional archive import, skipped trash, and omitted colours/drawings/reminders.
// The importer reads an exported copy; no ongoing Keep connection or shared-note permissions transfer.
// Pane/Model/ImportPipeline.swift:41-45 confirms default labels-as-folders and archived notes excluded.
// Pane/Views/ImportSheet.swift:507-516 confirms Labels become Folders/Tags and archive toggle.
// Pane/Views/ImportGuide.swift:66-91 confirms Keep-only Takeout link and drop-download guide.
// web/app/blog/import-your-notes/page.tsx supplies the Keep import wording and unchanged original app.
// BRIEF.md's Pinto facts and README.md:15-26, 62-66 confirm Apple Notes feel, free Mac download,
// iPhone app, connected ChatGPT/Claude read and edit access, and version history for changes in Pinto.
// BRIEF-compare.md confirms Mac/iPhone only, with no Windows, Android or web app.
// No running-app migration test or claim of complete Takeout preservation. Pictures: none.
// All four body blog links have draft: false in lib/posts.ts, checked today.
// Registration description: Compare Pinto Notes with staying in Google Keep on iPhone and Mac.
// See what its Takeout import keeps, what it leaves out, and what to check.

const IMPORT_CHECK = `Google Keep replacement check
- [ ] Compare a long note with its original in Keep
- [ ] Check both ticked and unticked list items
- [ ] Open an imported image
- [ ] Check a note with two labels
- [ ] Compare a pinned note and its dates
- [ ] Check archived notes if I chose to import them
- [ ] Record any meaning I gave to note colours
- [ ] Save important drawings separately
- [ ] Put any needed reminders in the app I will use for alerts
- [ ] Keep shared lists in Keep until everyone agrees to move
- [ ] Keep the original Takeout download`;

const FAQ = [
  { q: "Can Pinto Notes import Google Keep labels as folders?", a: [
    "Yes. Labels become folders by default. A note goes in its first label's folder, and additional labels become tags. You can choose Tags instead to bring all labels in as tags. Check a note with several labels before deciding which organization you prefer.",
  ] },
  { q: "Will my Keep colours and reminders appear in Pinto Notes?", a: [
    "No. Pinto's Keep importer leaves out colours, drawings and reminders. The import summary reports notes that had them. Keep the export, save important drawings separately and arrange any alerts you still need before leaving Keep.",
  ] },
  { q: "Does a Takeout import keep Pinto Notes connected to Google Keep?", a: [
    "No. It imports an exported copy of your notes. Later edits in Keep do not automatically appear in Pinto, and edits in Pinto do not update Keep. Keep's collaborator permissions do not transfer with the imported notes.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="google-keep-alternative-for-iphone-and-mac"
      intro={<>Pinto Notes is a free Google Keep alternative for iPhone and Mac, with a direct Google Takeout import. Stay with Keep if you need Android access or want to keep using shared Google lists with the same people.</>}
      answer={
        <Answer jump={[
          { href: "#choose", label: "Choose a replacement" },
          { href: "#keep-google-keep", label: "Reasons to stay" },
          { href: "#preservation", label: "What comes across" },
          { href: "#import", label: "Bring your notes" },
          { href: "#check", label: "Check the import" },
        ]}>
          <p>
            Choose Pinto Notes if you want Apple Notes-style editing on iPhone and Mac, with your Keep notes imported on a Mac.
            Text, checklists and images come across, along with labels, pins and dates.
            Colours, drawings and reminders do not, so review those before switching.
          </p>
          <PostCta slug="google-keep-alternative-for-iphone-and-mac" position="answer" title="Try your Keep notes in Pinto Notes.">
            <p>Download Pinto Notes free on your Mac and import your Google Keep download. Once connected, ChatGPT or Claude can read and edit the imported notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="choose">Choose by the notes you want to keep using</h2>
      <p>
        Pinto Notes looks and works like Apple Notes. It suits personal notes you want to bring into that kind of editor,
        especially if you also want ChatGPT or Claude to work in them. It runs on Mac and iPhone only.
        There is no Windows, Android or web app. If you need a browser editor, Keep already provides one.
      </p>
      <p>
        Apple Notes is another option for folders, checklists and tables. Our <a href="/blog/apple-notes-vs-google-keep">Apple Notes
        vs Google Keep comparison</a> covers that choice. If you have already chosen Apple Notes, use the{" "}
        <a href="/blog/google-keep-to-apple-notes"> Google Keep to Apple Notes guide</a> for that move.
        The checks below are for Pinto&apos;s direct Keep import.
      </p>

      <h2 id="keep-google-keep">When staying with Google Keep makes sense</h2>
      <p>
        Keep has an iPhone app, an Android app and browser access at keep.google.com. Google documents those routes in its{" "}
        <a href="https://support.google.com/keep/answer/2888240?hl=en" rel="noopener"> Keep guide</a>.
        If you use an Android phone alongside a Mac, Pinto cannot replace Keep on both.
      </p>
      <p>
        A shared shopping list is another reason to stay. Keep lets collaborators edit a note, as described in{" "}
        <a href="https://support.google.com/keep/answer/6101196?hl=en" rel="noopener"> Google&apos;s sharing guide</a>.
        Importing a copy into Pinto does not bring that shared list&apos;s permissions with it.
        You can move your personal notes and keep a shared list in Keep until the people using it agree on a move.
      </p>

      <h2 id="preservation">What Pinto keeps from a Takeout download</h2>
      <p>
        Google&apos;s <a href="https://support.google.com/keep/answer/10017039?hl=en" rel="noopener">export guide</a> lists what
        goes into the download. The receiving app decides what it can use. Pinto&apos;s importer handles the following.
      </p>
      <div className="tableWrap">
        <table>
          <thead><tr><th scope="col">In Google Keep</th><th scope="col">After importing into Pinto Notes</th></tr></thead>
          <tbody>
            <tr><th scope="row">Text and checklists</th><td>Note text and ticked or unticked checklist states come across</td></tr>
            <tr><th scope="row">Labels</th><td>Folders by default, or tags if you choose</td></tr>
            <tr><th scope="row">Pins and dates</th><td>Pinned state and available creation and edit dates come across</td></tr>
            <tr><th scope="row">Images</th><td>Imported as attachments when the files are in the download</td></tr>
            <tr><th scope="row">Archived notes</th><td>Excluded by default; choose to include them in an Archive folder</td></tr>
            <tr><th scope="row">Notes in the trash</th><td>Skipped</td></tr>
            <tr><th scope="row">Colours, drawings and reminders</th><td>Left out; the summary reports notes that had them</td></tr>
            <tr><th scope="row">Collaborator permissions</th><td>Do not transfer to the imported copy</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        The label choice matters if one note has several labels. With Folders selected, its first label becomes its folder,
        and the other labels become tags. With Tags selected, all its labels become tags.
        For example, a note labelled Home and Repairs goes in Home with a Repairs tag if Home is its first label.
      </p>
      <p>
        If red means urgent in your Keep notes, write that meaning into the important notes before moving.
        Save drawings you need separately. Put any reminders you still need in the app you will use for alerts.
        An imported checklist does not preserve a reminder attached to it.
      </p>

      <h2 id="import">Bring the download into Pinto on a Mac</h2>
      <p>
        On your Mac, open Pinto Notes&apos; File menu and choose Google Keep. Pinto Notes opens Google&apos;s download page
        with only Keep ticked. Drop the download in, and your labels become folders.
        The <a href="/blog/import-your-notes">import guide</a> shows where to start.
      </p>
      <p>
        In Google Takeout, select Next step, choose a one-time export and ZIP, then Create export.
        Download the archive when Google emails you. Google says preparing it can take a few minutes to a few days.
        Its <a href="https://support.google.com/accounts/answer/3024190" rel="noopener">download instructions</a> also confirm
        that downloading your data does not delete it from Google.
      </p>
      <p>
        Pinto accepts the Takeout ZIP, the extracted Takeout folder or its Keep folder. Keep the image files beside the note
        files if you use the extracted folder. Choose whether labels become Folders or Tags, and whether to include archived
        notes. Review the import summary before comparing your notes.
      </p>

      <h2 id="check">Check the notes you rely on before leaving Keep</h2>
      <p>
        Compare an imported note with its original in Keep. Include a long note, a checklist with completed items and a note
        with an image. Then check one with several labels. Those examples tell you more than a total note count alone.
      </p>
      <Keep title="Keep import review" text={IMPORT_CHECK}
        note="Copy this checklist to keep with your Takeout download. Check your own notes before deciding to leave Keep." />
      <p>
        This is an import of an exported copy. It does not keep the two apps connected.
        Once you are happy with the imported notes, choose which app you will edit each note in so the copies do not drift apart.
      </p>

      <h2 id="pinto-notes">Let your AI work with the imported notes</h2>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> and approve the connection,
        it can read and edit your Pinto notes. You can ask it to find an imported project note and add a short list of next steps.
        Open the note and check the result, especially any dates or tasks it inferred.
      </p>
      <p>
        Pinto keeps every earlier version as you edit a note in Pinto. That history covers your changes there,
        including AI edits. It does not recreate versions from before the Keep import.
      </p>
    </PostPage>
  );
}
