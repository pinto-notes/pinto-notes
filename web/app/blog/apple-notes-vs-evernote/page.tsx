import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-vs-evernote", {
  title: "Evernote vs Apple Notes: which should you use?",
});

// Written 21 November 2026 for "evernote vs apple notes". Google autocomplete read live today, en-US,
// using suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q= for each brief query:
// evernote vs apple notes (2026, 2025, reddit), evernote or apple notes, evernote vs iphone notes,
// evernote vs ios notes, onenote vs evernote vs apple notes, notion vs evernote vs apple notes,
// google keep vs evernote vs apple notes, evernote to apple notes migration, evernote import apple notes,
// which is better onenote or evernote. The old topic-research-2026-11-20 row 12 concerns an Evernote
// alternative, so this comparison follows BRIEF-wave4's queries and today's live suggestions instead.
// Official pages read 21 November 2026:
// https://evernote.com/compare-plans: Free has 50 notes, 1 notebook, 1 device; apps for iOS, Android,
// Web, Windows and Mac; Connect Evernote to AI tools (MCP) names Claude and ChatGPT. No prices used.
// https://evernote.com/download: Mac and Windows downloads, mobile App Store and Google Play links.
// https://evernote.com/features/webclipper: saves articles, pages, PDFs and screen captures; annotations,
// notebook selection and tags. https://evernote.com/features/tasks: due dates, recurrences, reminders,
// task assignment and views by note, assignment or date.
// https://evernote.com/en-us/features/search: keyword, date and location filters, saved searches.
// https://evernote.com/en-us/features/ai-features: AI Assistant searches, creates content, organizes and
// adds tags; Semantic Search; AI Meeting Notes; AI Assistant has monthly and per-chat usage limits.
// https://support.apple.com/guide/icloud/mm000b55f946/icloud: notes stay updated on iCloud.com and
// devices with Notes enabled; sign in at icloud.com/notes. The page title is "View notes and locked notes
// on iCloud.com". https://support.apple.com/guide/notes/not201900c07/mac: ENEX import on Mac;
// Evernote tags import on macOS 13 or later. https://support.apple.com/en-us/102223: unsupported
// attachments or features are omitted. Apple pages read directly over HTTPS after web fetch returned 429.
// https://www.microsoft.com/en-us/microsoft-365/onenote/digital-note-taking-app: digital ink,
// shared work, searchable digital notebooks, iOS and Android apps. No Microsoft prices used.
// Apple Notes facts from BRIEF.md's verified list: checklists, tables, pinning, #tags, Smart Folders,
// search, sharing needs an Apple Account. Earlier verification: apple-notes-tags-smart-folders,
// apple-notes-tables, apple-notes-meal-planner-template and apple-notes-1-on-1-template.
// Pinto claims: BRIEF.md's Pinto facts for Apple Notes' look and behavior on iPhone and Mac, connected
// ChatGPT or Claude reading and editing notes, every earlier version, Apple Notes import leaving it unchanged.
// Markdown files and Apple-only availability: BRIEF-compare.md and apple-notes-vs-obsidian's verified header.
// Evernote import uses import-your-notes' exact wording. No other import guarantees claimed.
// Picture reused from import-your-notes: public/blog/launch/import-file-menu, 820 x 800. No new screenshots.

const FAQ = [
  { q: "Evernote or Apple Notes for an iPhone and a Windows PC?", a: [
    "Evernote has apps for both. Apple lets you view iCloud notes in a browser at iCloud.com, so try that on your PC before deciding. Choose Evernote if a Windows app is part of your daily work.",
  ] },
  { q: "Does Evernote Free sync between a phone and a laptop?", a: [
    "Evernote's comparison page lists one device for Free, as read on 21 November 2026. Check a paid plan's device allowance if you want to use both regularly.",
  ] },
  { q: "Does Evernote have a ChatGPT or Claude connection?", a: [
    "Yes. Evernote's current plan page lists an MCP connection for Claude, ChatGPT and other compatible AI tools. It also has its own AI Assistant inside the app.",
  ] },
  { q: "Is Evernote vs iPhone Notes the same comparison?", a: [
    "Yes, if you mean Apple's built-in Notes app on iPhone. With Notes enabled in iCloud, your iCloud notes also stay updated on your Mac and at iCloud.com.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-vs-evernote"
      intro={<>Choose Apple Notes for personal notes and checklists on iPhone and Mac. Choose Evernote if you need its Windows or Android apps, save whole web articles, or manage dated tasks beside your notes.</>}
      answer={
        <Answer jump={[
          { href: "#at-a-glance", label: "At a glance" },
          { href: "#apple-notes", label: "Choose Apple Notes" },
          { href: "#evernote", label: "Choose Evernote" },
          { href: "#switching", label: "Before you move" },
          { href: "#pinto-notes", label: "Where Pinto fits" },
        ]}>
          <p>
            Apple Notes suits everyday writing on Apple devices, with checklists, tables and tags. Evernote is worth considering for
            its Web Clipper and task reminders, or when your notes need to work across Apple devices and a Windows PC or Android phone.
            Its Free plan allows 50 notes and one notebook, so check the limits before moving an archive.
          </p>
          <PostCta slug="apple-notes-vs-evernote" position="answer" title="Bring Evernote into an app that feels like Apple Notes.">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. It imports Evernote notebooks as folders with their tags, and lets ChatGPT or Claude read and edit the notes once connected.</p>
          </PostCta>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="at-a-glance">Evernote and Apple Notes at a glance</h2>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">What matters</th><th scope="col">Apple Notes</th><th scope="col">Evernote</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Devices</th><td>iPhone and Mac, plus iCloud.com in a browser</td><td>iPhone, Mac, Windows, Android and the web</td></tr>
            <tr><th scope="row">Organization</th><td>Folders, #tags and Smart Folders</td><td>Notebooks, tags and saved searches</td></tr>
            <tr><th scope="row">Lists and tasks</th><td>Checklists, including checked items moving to the bottom</td><td>Tasks with due dates, recurring schedules and reminders</td></tr>
            <tr><th scope="row">Saving web research</th><td>A note for your links and written notes</td><td>Web Clipper saves article content and PDFs</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Features checked on the makers&apos; pages on 21 November 2026. Evernote&apos;s{" "}
        <a href="https://evernote.com/compare-plans" rel="noopener">plan comparison</a> has the current allowances. Its Free plan is
        limited to one device, which matters if you want to use a phone and a computer.
      </p>

      <h2 id="apple-notes">Choose Apple Notes for everyday notes</h2>
      <p>
        A shopping list, a few meeting notes and a folder of ideas fit Apple Notes well. Pin the note you open each day. Use a checklist
        for errands and a table for information you want side by side. Search finds words throughout your notes.
      </p>
      <p>
        You can also organize a growing library. Type # and a word to add a tag, then use a Smart Folder to gather matching notes across
        folders. <a href="/blog/apple-notes-tags-smart-folders">Tags and Smart Folders in Apple Notes</a> explains that setup.
        To edit a shared note together, each person needs an Apple Account.
      </p>
      <p>
        Turn on Notes in iCloud and those notes stay updated on your devices and at{" "}
        <a href="https://support.apple.com/guide/icloud/mm000b55f946/icloud" rel="noopener">iCloud.com</a>.
        If you sometimes use a PC, try the browser version with a real note before moving your library. That will tell you whether
        browser access covers what you need.
      </p>

      <h2 id="evernote">Choose Evernote for web research and dated tasks</h2>
      <p>
        Evernote&apos;s <a href="https://evernote.com/features/webclipper" rel="noopener">Web Clipper</a> saves the content of an article
        or web page, including PDFs and screen captures. You can annotate a capture and choose its notebook and tags as you save it.
        If your project notes depend on material you collect online, try clipping a few of your usual sources before switching apps.
      </p>
      <p>
        <a href="https://evernote.com/features/tasks" rel="noopener">Tasks live inside Evernote notes</a>, with due dates, recurrences
        and reminders. You can assign them to someone else and view them by note or due date. That suits a project where the next
        action needs a reminder alongside the information behind it.
      </p>
      <p>
        For a large archive, Evernote also offers{" "}
        <a href="https://evernote.com/en-us/features/search" rel="noopener">search filters and saved searches</a>.
        Filters include keywords, dates and the location where a note was written.
      </p>

      <h2 id="ai">Evernote already has AI</h2>
      <p>
        Evernote&apos;s <a href="https://evernote.com/en-us/features/ai-features" rel="noopener">AI Assistant</a> can find information,
        create content and organize notes from a chat. Semantic Search finds related content, and AI Meeting Notes records,
        transcribes and summarizes conversations. Evernote says AI Assistant has monthly and per-chat usage limits.
      </p>
      <p>
        Its plan page also lists a connection for ChatGPT and Claude. If that is what you want, check your existing Evernote account
        before moving. You may already have the connection you need.
      </p>

      <h2 id="onenote">And if you&apos;re comparing OneNote too?</h2>
      <p>
        <a href="https://www.microsoft.com/en-us/microsoft-365/onenote/digital-note-taking-app" rel="noopener">Microsoft&apos;s OneNote</a>{" "}
        is worth trying if you want digital notebooks for shared work or handwritten notes and diagrams. Microsoft offers mobile apps
        for iPhone and Android. <a href="/blog/apple-notes-vs-onenote">Apple Notes vs OneNote</a> covers that choice in more detail.
        For this decision, first check which devices you use, then try the same working note in each app.
      </p>

      <h2 id="switching">Before you move from Evernote</h2>
      <p>
        Apple Notes on a Mac can import Evernote&apos;s .enex files, including tags on macOS 13 or later. Apple says unsupported
        attachments or features are left out. Our <a href="/blog/evernote-to-apple-notes">Evernote to Apple Notes guide</a> covers the
        export, import and checks afterwards. Start with one notebook and compare the notes you rely on before moving the rest.
      </p>

      <h2 id="pinto-notes">Where Pinto Notes fits</h2>
      <p>
        Pinto Notes is for readers who want Apple Notes&apos; look and behavior, with Markdown files and every earlier version of a
        note kept. ChatGPT or Claude can read and edit those notes once you{" "}
        <a href="/blog/connect-chatgpt-to-your-notes">connect them</a>.
      </p>
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
        alt="Pinto Notes on a Mac with the File menu open, showing Evernote among its import choices."
        caption="The File menu in Pinto Notes on a Mac. Choose Evernote to bring in your notebooks." />
      <p>
        On your Mac, open the File menu and choose Evernote. Export each notebook as an .enex file and drop them all in at once.
        Each notebook becomes a folder, and tags come too. <a href="/blog/import-your-notes">Importing your notes</a> shows that route.
        Your old app stays as it is.
      </p>
      <p>
        Pinto Notes runs on iPhone and Mac. It has no Windows, Android or web app, so Evernote suits you better if you need those.
        Already using Apple Notes? Your notes come over in <a href="/blog/move-from-apple-notes">one import on your Mac</a>,
        and Apple Notes isn&apos;t changed.
      </p>
    </PostPage>
  );
}
