import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("mem-ai-alternative-for-mac-and-iphone", {
  title: "Mem is shutting down: 8 alternatives that keep your AI",
});

// Written 21 November 2026 for "mem ai alternative", topic-research-2026-11-24.md row 2.
// Google autocomplete rechecked today by direct HTTPS, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=mem%20ai%20alternative
// Full response suggestions: mem ai alternatives; mem ai alternatives reddit; mem ai open source
// alternative; ai alternative; ai alternative free; ai sound alternatives. The final three are
// unrelated noise. These match research appendix A2; no Mac/iPhone-specific demand is claimed.
// Maker pages read live today:
// https://help.mem.ai/migration confirms read-only notes on 18 December 2026, closure on
// 15 January 2027, continued reading/export until closure, and re-exporting after later edits.
// https://help.mem.ai/migration/save-a-copy supplies Settings, Exports, Start new export,
// My Computer, Next, Start export, Download; notes/, collections/, attachments/ and the optional
// export-report.md; available transcripts by default, audio recordings by export option.
// https://help.mem.ai/features/chat documents built-in note creation, editing and retrieval.
// https://help.mem.ai/features/collections documents multiple collections per note.
// Original version used no numeric Mem prices. Apple Notes sources are added below.
// Original Pinto source checks in the wave9 checkout, paths relative to its repo root:
// BRIEF.md and README.md:15-26, 62-75 supply Apple Notes feel, free Mac/iPhone apps,
// approved ChatGPT/Claude reading and editing, and earlier versions kept.
// BRIEF-compare.md supplies Mac/iPhone only, no Windows, Android or web app.
// web/app/blog/import-your-notes/page.tsx supplies the generic route verbatim:
// "a folder or .zip of Markdown or text files. Each folder becomes a folder."
// Pane/Model/MarkdownImport.swift:6-21, 30-60, 176-187, 232-256 confirms Markdown/text,
// folder/ZIP input and extension-based note classification. Index/report files becoming extra
// notes is an inference from that classification, not a tested Mem migration result.
// Pane/Views/ImportSheet.swift:6-23 lists import kinds, none for Mem, and the menu label.
// web/app/blog/connect-chatgpt-to-your-notes/page.tsx verified header confirms one Allow
// grants reading and editing. supabase/functions/mcp/files_tools.ts:46-110 confirms search,
// fetch and edit tools. Pane/Model/NoteHistory.swift:338-365 confirms version restore.
// This is a format-based trial, not a fresh Mem export/import test. Collection membership,
// internal links, dates, formatting, attachments and meeting audio preservation are unverified.
// Pictures: none. Body blog links point to published posts in lib/posts.ts.

// Rewritten 21 November 2026 as a comparison for Mem users who want to keep AI access.
// All URLs below were opened and read today. Product/AI-provider documentation, not listicles.
// Mem: https://get.mem.ai/blog/mem-is-shutting-down (announcement dated 16 November 2026).
// https://help.mem.ai/migration and /migration/save-a-copy rechecked for dates/export details.
// https://help.mem.ai/migration/onenote documents a direct OneNote export, separate from Markdown.
// Apple:
// https://support.apple.com/en-us/102223 (Markdown on Mac and iPhone since OS 26; Files sharing).
// https://support.apple.com/guide/iphone/writing-tools-write-improve-summarize-iph6f08da1d2/27/ios/27
// (selected-text rewrite/summary, Compose with ChatGPT, compatible devices/languages/regions).
// https://apps.apple.com/us/app/notes/id1110145109 (free). No library-wide AI connector claimed.
// Obsidian:
// https://help.obsidian.md/import/markdown (files/folders moved into a vault).
// https://help.obsidian.md/cli (official CLI search/read/create/append, desktop app must run).
// https://obsidian.md/download (Mac, Windows, Linux, iOS, Android).
// https://obsidian.md/pricing (free app; Sync USD 4/month billed yearly or USD 5 monthly).
// https://github.com/coddingtonbear/obsidian-local-rest-api (community plugin, local MCP
// search/read/write; not an Obsidian-hosted service). Local phone limitations refer to this route.
// Notion:
// https://www.notion.com/help/import-data-into-notion (Text & Markdown, desktop/web import only).
// https://www.notion.com/help/notion-mcp (official ChatGPT/Claude read/write connection).
// https://www.notion.com/pricing (Free with AI trial; Business includes Agent; paid plans).
// No numeric Notion price quoted: the page served KRW, not a verified USD quote.
// https://www.notion.com/help/system-requirements-for-notion (Mac/Windows/web/iOS/Android).
// https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities
// (connectors usable in Claude for iOS; per-tool permissions and organization controls).
// Google:
// https://support.google.com/docs/answer/12014036?hl=en (import Markdown as a Google Doc).
// https://support.google.com/docs/answer/18289341?co=GENIE.Platform%3DiOS&hl=en
// (iPhone Markdown editing in Docs keeps .md; internet required, not a Mem migration test).
// https://support.google.com/docs/answer/7068618?co=GENIE.Platform%3DDesktop&hl=en
// and its Android tab (web/mobile apps, document sharing).
// https://support.google.com/docs/answer/14206696?co=GENIE.Platform%3DiOS&hl=en-7
// (Gemini in Docs; eligible Google AI/Workspace plan; iPhone summary/Q&A).
// https://support.google.com/drive/answer/16685111?co=GENIE.Platform%3DiOS&hl=en-en
// (Gemini search/read on iPhone; eligible plan).
// https://support.google.com/drive/answer/2375123?hl=en (15 GB shared storage at no charge).
// https://help.openai.com/en/articles/10929079-google-drive-app-and-setup-in-chatgpt
// (official search/read/update actions, plan/region/workspace/Google permission limits).
// https://support.claude.com/en/articles/10166901-use-google-workspace-connectors
// (Drive search/read; separate Docs connector for live editing on web/desktop).
// Markdown support does not establish identical AI support for raw .md and native Google Docs.
// Microsoft:
// https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks
// (OneNote notebook formats; no Markdown import stated; notebook importer deprecated).
// https://support.microsoft.com/en-us/onenote/frequently-asked-questions-about-copilot-in-onenote
// (draft/rewrite/summarize/organize; Windows/Mac, web rollout; iPhone availability not stated).
// https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions
// (free apps, Mac/Windows/web/iOS/Android).
// https://support.microsoft.com/en-us/microsoft-365-copilot/what-copilot-license-do-i-have
// (qualifying subscription/license required; no numeric Copilot price quoted).
// Bear:
// https://bear.app/faq/import-your-notes/ (Markdown; Mac Markdown Folder includes referenced
// attachments inside that folder; iOS import available, Mem preservation not tested).
// https://bear.app/faq/command-line-interface/ (official Bear 2.8+ CLI/Claude connector/MCP;
// search/read/create/edit; macOS only, Claude desktop required, not a hosted phone connector).
// https://bear.app/ (Mac/iPhone, free local notes; Pro USD 2.99/month or USD 29.99/year, sync).
// Evernote:
// https://help.evernote.com/hc/en-us/articles/208314308-Import-content-from-other-apps-into-Evernote
// (.md into editable notes through Settings, Import; desktop, no mobile import).
// https://help.evernote.com/hc/en-us/articles/46319409880211-AI-Assistant
// (built-in search/read/rewrite/create, desktop/web/mobile).
// https://help.evernote.com/hc/en-us/articles/51596325640339-Evernote-MCP-Model-Context-Protocol
// (paid users; Read and Create only stated). Some marketing pages still say waitlist;
// use the released help article, and don't promise editing existing notes through MCP.
// https://evernote.com/compare-plans (platforms, Free 50 notes/1 device; no numeric price used).
// Pinto rechecked today: README.md, MarkdownImport.swift, ImportSheet.swift, and local
// connect-chatgpt-to-your-notes, notion-alternative-for-personal-notes-on-mac, obsidian-mcp posts.
// https://pintonotes.com/ (free, Mac/iPhone); https://pintonotes.com/blog/import-your-notes
// (generic Markdown folder/ZIP import); https://pintonotes.com/blog/connect-chatgpt-to-your-notes
// (directory since 28 October, Allow, earlier versions); https://pintonotes.com/blog/mcp-server
// (remote tools). Phone access is confirmed by the task brief and README.md, not a new device test.
// No live Mem import was performed. Formatting, collection membership, links, dates,
// attachments and meeting audio in Pinto remain unverified. No new images.

const IMPORT_CHECK = `Mem trial import
- [ ] Compare the full text of a long note with the original
- [ ] Check a table and a checklist
- [ ] Follow a link to another note
- [ ] Open a picture and a PDF
- [ ] Compare creation and modification dates
- [ ] Check a note that belonged to two collections
- [ ] Find the meeting transcript and play the saved recording separately
- [ ] Account for collection indexes or reports imported as extra notes
- [ ] Open the imported notes on iPhone
- [ ] Keep the original Mem ZIP and extracted folder`;

const FAQ = [
  { q: "What are Mem's read-only and shutdown dates?", a: [
    "Mem announced its shutdown on 16 November 2026. Notes become read-only on 18 December 2026. Reading and export remain available until the service closes on 15 January 2027. Save a copy before then and export again after later edits.",
  ] },
  { q: "What are the best Mem alternatives?", a: [
    "For connected ChatGPT or Claude access, compare Notion, Google Docs and Pinto Notes. For AI inside the notes app, consider Evernote or Notion, or OneNote with an eligible Copilot subscription. Obsidian suits a Markdown library with desktop tools; Bear has an official Mac-only Claude connector. Apple Notes suits readers who need selected-text writing help rather than a connected AI notebook.",
  ] },
  { q: "Can AI still work with notes after Mem closes?", a: [
    "Yes, once the notes are in a destination that supports it. Notion and Pinto Notes offer MCP read/write access. Google Docs works with Gemini and official ChatGPT and Claude connections. Evernote's built-in assistant can edit notes, but its MCP help page only promises reading and creating new notes. Exporting files alone does not reconnect an assistant.",
  ] },
  { q: "Does Pinto Notes have a dedicated Mem importer?", a: [
    "No. On a Mac, use Import Markdown or Text with a folder or .zip of Markdown or text files. A Mem import has not been tested. Try a small copy first and check collection membership, links, dates and attachments before moving the full library.",
  ] },
  { q: "Will Mem collections become the same collections in Pinto?", a: [
    "That is not verified. Pinto's general importer follows folders in the export. Check a note that belonged to more than one Mem collection, and keep the collection indexes with the original export.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="mem-ai-alternative-for-mac-and-iphone"
      intro={<>Moving the text is only part of leaving Mem. The next app also needs a way for AI to find those notes and save changes. These options differ on both, especially from an iPhone.</>}
      answer={
        <Answer jump={[
          { href: "#compared", label: "Compare destinations" },
          { href: "#save", label: "Save your export" },
          { href: "#notion", label: "Notion" },
          { href: "#google-docs", label: "Google Docs" },
          { href: "#pinto-notes", label: "Pinto Notes" },
          { href: "#check", label: "Trial-import checklist" },
        ]}>
          <p>
            Mem makes notes read-only on 18 December 2026 and closes on 15 January 2027, so save your export now. If you want
            ChatGPT or Claude to keep searching and editing your notes, including from your phone, move to Notion or Pinto Notes:
            both have an official connection that reads and writes. Google Docs also has official ChatGPT and Claude connections, for documents. Bear and Obsidian
            keep AI on a Mac only, and Evernote and OneNote have their own built-in AI.
          </p>
          <p>
            Apple Notes offers Writing Tools for selected text on compatible devices.
            That is different from giving an assistant access to search and edit the library.
            Save the export first, then test both an import and a real AI edit in the destination.
          </p>
          <PostCta slug="mem-ai-alternative-for-mac-and-iphone" position="answer" title="Try a small Mem export in Pinto Notes">
            <p>Pinto Notes is free for Mac and iPhone, with connected AI access. Its Mem import is untested, so compare a few copied notes before moving everything.</p>
          </PostCta>
        </Answer>
      }
      // No picture between the answer and the table: the comparison is what a Mem reader came for.
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="compared">Mem alternatives and what their AI can do</h2>
      <p>
        Checked against the vendors&apos; own pages on 21 November 2026. The table covers Apple Notes, Obsidian, Notion,
        Google Docs or Drive, OneNote, Bear and Evernote from <a href="https://help.mem.ai/migration" rel="noopener">Mem&apos;s recommendations</a>,
        plus Pinto Notes. Markdown support means a format is accepted, not that a complete Mem migration has been tested.
        MCP connects an AI assistant to an app&apos;s tools. Reading, creating a note and editing an existing note are separate capabilities.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Destination</th><th scope="col">Mem Markdown export</th><th scope="col">AI on the notes</th>
              <th scope="col">AI from iPhone?</th><th scope="col">Platforms</th><th scope="col">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row"><a href="#apple-notes">Apple Notes</a></th>
              <td><a href="https://support.apple.com/en-us/102223" rel="noopener">Yes, .md files</a> on Mac or iPhone, OS 26 or later.</td>
              <td><a href="https://support.apple.com/guide/iphone/writing-tools-write-improve-summarize-iph6f08da1d2/27/ios/27" rel="noopener">Writing Tools</a> rewrite/summarize selected text and compose with ChatGPT. Library search/edit by ChatGPT or Claude not stated.</td>
              <td>Writing Tools on compatible iPhone models; language and region limits.</td>
              <td>Mac, iPhone.</td>
              <td><a href="https://apps.apple.com/us/app/notes/id1110145109" rel="noopener">Free</a>.</td>
            </tr>
            <tr>
              <th scope="row"><a href="#obsidian">Obsidian</a></th>
              <td><a href="https://help.obsidian.md/import/markdown" rel="noopener">Yes, copy files/folders into a vault</a>.</td>
              <td>External tools: official <a href="https://help.obsidian.md/cli" rel="noopener">CLI</a> can search/read/write for a desktop agent. Local REST API MCP is a community plugin.</td>
              <td>Those CLI/local MCP routes run on desktop, not iPhone.</td>
              <td><a href="https://obsidian.md/download" rel="noopener">Mac, Windows, Linux, iPhone, Android</a>.</td>
              <td><a href="https://obsidian.md/pricing" rel="noopener">Free app</a>. Optional Sync: US$4/month billed yearly, US$5 monthly.</td>
            </tr>
            <tr>
              <th scope="row"><a href="#notion">Notion</a></th>
              <td><a href="https://www.notion.com/help/import-data-into-notion" rel="noopener">Yes, Text &amp; Markdown</a>. Import on desktop/web.</td>
              <td>Built-in Notion AI; official <a href="https://www.notion.com/help/notion-mcp" rel="noopener">MCP</a> lets ChatGPT/Claude read and write pages.</td>
              <td>Claude supports connectors on iPhone. Client and workspace permissions apply; import needs desktop/web.</td>
              <td><a href="https://www.notion.com/help/system-requirements-for-notion" rel="noopener">Mac, Windows, web, iPhone, Android</a>.</td>
              <td><a href="https://www.notion.com/pricing" rel="noopener">Free plan with AI trial</a>. Business includes Notion Agent.</td>
            </tr>
            <tr>
              <th scope="row"><a href="#google-docs">Google Docs or Drive</a></th>
              <td><a href="https://support.google.com/docs/answer/12014036?hl=en" rel="noopener">Yes, import as Google Docs</a>, or keep .md files in Drive.</td>
              <td>Gemini in Docs/Drive; official ChatGPT Drive and Claude Drive/Docs connections can search/read and, with permissions, edit Google Docs.</td>
              <td>Gemini search and document Q&amp;A on iPhone. Claude&apos;s live Docs editing is documented for web/desktop.</td>
              <td><a href="https://support.google.com/docs/answer/7068618?co=GENIE.Platform%3DDesktop&amp;hl=en" rel="noopener">Web, iPhone, Android</a>.</td>
              <td><a href="https://support.google.com/drive/answer/2375123?hl=en" rel="noopener">15 GB shared storage free</a>. Gemini in Docs/Drive needs an eligible Google AI or Workspace plan.</td>
            </tr>
            <tr>
              <th scope="row"><a href="#onenote">Microsoft OneNote</a></th>
              <td>Markdown import not stated in Microsoft&apos;s notebook guide. Mem offers a separate direct OneNote transfer.</td>
              <td>Built-in <a href="https://support.microsoft.com/en-us/onenote/frequently-asked-questions-about-copilot-in-onenote" rel="noopener">Copilot</a> summarizes/drafts/rewrites. ChatGPT/Claude read/write route not stated in these sources.</td>
              <td>Copilot FAQ lists Windows/Mac and a web rollout; iPhone AI availability not stated there.</td>
              <td><a href="https://support.microsoft.com/en-us/onenote/what-s-the-difference-between-the-onenote-versions" rel="noopener">Mac, Windows, web, iPhone, Android</a>.</td>
              <td>Free app. Copilot requires a qualifying subscription/license; price not stated in its licensing guide.</td>
            </tr>
            <tr>
              <th scope="row"><a href="#bear">Bear</a></th>
              <td><a href="https://bear.app/faq/import-your-notes/" rel="noopener">Yes, .md</a>. Mac Markdown Folder import includes referenced files inside the folder.</td>
              <td>Official <a href="https://bear.app/faq/command-line-interface/" rel="noopener">Claude desktop connector, MCP and CLI</a> search/read/create/edit. Requires Bear 2.8 or later.</td>
              <td>Those AI tools are Mac-only.</td>
              <td>Mac, iPhone.</td>
              <td><a href="https://bear.app/" rel="noopener">Free local notes</a>. Pro with sync: US$2.99/month or US$29.99/year.</td>
            </tr>
            <tr>
              <th scope="row"><a href="#evernote">Evernote</a></th>
              <td><a href="https://help.evernote.com/hc/en-us/articles/208314308-Import-content-from-other-apps-into-Evernote" rel="noopener">Yes, .md through Settings, Import</a> on desktop.</td>
              <td>Built-in AI Assistant searches/rewrites. Claude can read/create through official paid MCP; editing existing notes not stated.</td>
              <td>Built-in AI Assistant is available on mobile. MCP phone support not stated in its help article.</td>
              <td><a href="https://evernote.com/compare-plans" rel="noopener">Mac, Windows, web, iPhone, Android</a>.</td>
              <td>Free: 50 notes, one device. Paid plan required for MCP; paid price not stated on the comparison page read.</td>
            </tr>
            <tr>
              <th scope="row"><a href="#pinto-notes">Pinto Notes</a></th>
              <td>Generic Markdown folder/.zip import on Mac. No dedicated Mem importer; Mem import untested.</td>
              <td>Connected AI through remote MCP: ChatGPT, Claude, Claude Code and Codex can search/read/edit after approval.</td>
              <td>Yes, connected AI can use notes from any device, including iPhone, after approval in the app.</td>
              <td>Mac and iPhone only. No Windows, Android or web app.</td>
              <td>Free.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Free storage or a free notes app does not include every assistant subscription.
        Where a vendor does not state a capability or price in the linked sources, the table says so.
      </p>

      <h2 id="save">Save your export first</h2>
      <p>
        Mem <a href="https://get.mem.ai/blog/mem-is-shutting-down" rel="noopener">announced the shutdown on 16 November 2026</a>.
        Download a copy before choosing a replacement. Export again after later edits.
      </p>
      <Steps>
        <li>On a computer, open Settings, Exports at <a href="https://mem.ai/settings/exports" rel="noopener">mem.ai/settings/exports</a>.</li>
        <li>Choose Start new export, then My Computer and Next. Review the options and choose Start export.</li>
        <li>Return to Exports. When the copy is ready, choose Download. Keep the ZIP and an extracted copy.</li>
      </Steps>
      <p>
        Mem&apos;s <a href="https://help.mem.ai/migration/save-a-copy" rel="noopener">download guide</a> describes <code>notes/</code>
        with one <code>.md</code> file per note, <code>collections/</code> with an index per collection, and <code>attachments/</code>.
        A note in two collections appears in both indexes. An optional <code>export-report.md</code> lists items the export could not include.
      </p>
      <p>
        Available transcripts are included by default. Audio recordings are optional, so select them before starting if needed.
        Keep the folders together and work from a copy during trial imports.
      </p>

      <h2 id="notion">Notion for a workspace with connected AI</h2>
      <p>
        Choose Notion if keeping ChatGPT or Claude able to read and write pages matters more than keeping a small notes editor.
        Its <a href="https://www.notion.com/help/notion-mcp" rel="noopener">official MCP connection</a> supports both.
        The free plan includes an AI trial; the pricing page puts Notion Agent in Business.
        Import the Markdown on desktop or web, then test the pages and their links before relying on them.
      </p>
      <p>
        <a href="https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities" rel="noopener">Claude supports connectors on iPhone</a>,
        with organization and tool permissions still applying. Notion is the better pick here if the same notebook also needs Windows,
        Android or a browser. For a smaller personal notebook, compare the <a href="/blog/notion-alternative-for-personal-notes-on-mac">personal-notes trade-offs</a>.
      </p>

      <h2 id="google-docs">Google Docs or Drive for documents and sharing</h2>
      <p>
        Google is a useful choice if the notes should become documents other people can edit.
        <a href="https://support.google.com/docs/answer/18289341?co=GENIE.Platform%3DiOS&amp;hl=en" rel="noopener">Docs can also edit .md files on iPhone</a>
        while keeping that file type, with an internet connection. For connected AI, test native Google Docs first;
        Markdown editing support alone does not prove that every AI tool handles raw .md files the same way.
      </p>
      <p>
        <a href="https://help.openai.com/en/articles/10929079-google-drive-app-and-setup-in-chatgpt" rel="noopener">ChatGPT&apos;s official Drive app</a>
        can search, read and update documents when the plan, workspace and Google permissions allow it.
        <a href="https://support.claude.com/en/articles/10166901-use-google-workspace-connectors" rel="noopener">Claude uses Drive for search and a separate Docs connector for live edits</a>
        on web or desktop. Gemini offers <a href="https://support.google.com/drive/answer/16685111?co=GENIE.Platform%3DiOS&amp;hl=en-en" rel="noopener">Drive search</a>
        and <a href="https://support.google.com/docs/answer/14206696?co=GENIE.Platform%3DiOS&amp;hl=en-7" rel="noopener">Docs questions and summaries on iPhone</a>
        with an eligible plan. Check the exact phone workflow before moving the full library.
      </p>

      <h2 id="evernote">Evernote for AI inside the notes app</h2>
      <p>
        Evernote is a serious option if the goal is to ask questions and change notes without opening another assistant.
        Its <a href="https://help.evernote.com/hc/en-us/articles/46319409880211-AI-Assistant" rel="noopener">AI Assistant</a>
        searches, creates and rewrites notes on desktop, web and mobile.
        Import Markdown through Settings, Import on desktop; dropping a file into the note list instead can attach it rather than convert it.
      </p>
      <p>
        The <a href="https://help.evernote.com/hc/en-us/articles/51596325640339-Evernote-MCP-Model-Context-Protocol" rel="noopener">MCP help article</a>
        says paid users get Read and Create. It does not promise edits to existing notes through MCP.
        The free plan&apos;s 50-note and one-device limits also matter for a Mem library.
      </p>

      <h2 id="obsidian">Obsidian for a library of Markdown files</h2>
      <p>
        Obsidian is the better pick if keeping the notes as ordinary Markdown files matters most.
        Copy files and folders into a vault. Its official CLI can search, read, create and append text,
        so an agent such as Claude Code can work through commands on that computer. The desktop app must be running.
      </p>
      <p>
        The <a href="https://github.com/coddingtonbear/obsidian-local-rest-api" rel="noopener">Local REST API MCP plugin</a>
        is a community route for connected reading and writing. It runs locally, so it does not by itself give an assistant on iPhone
        access to the vault. The <a href="/blog/obsidian-mcp">Obsidian MCP comparison</a> explains those desktop setups.
        Budget separately for sync if using Obsidian&apos;s paid Sync service.
      </p>

      <h2 id="bear">Bear for writing with Claude on a Mac</h2>
      <p>
        Bear is worth considering for a Markdown writing notebook with Claude at the desk.
        Its own connector and MCP server can search, read, create and edit notes. They are official Bear tools,
        require Bear 2.8 or later, and run only on Mac. The connector needs Claude desktop.
        Bear on iPhone does not make those local tools available from the phone.
      </p>
      <p>
        On Mac, use Markdown Folder import to include referenced attachments inside the selected folder.
        Try a copy with its files together. Bear Pro includes sync; the free plan keeps notes locally.
        Bear is a better fit than a workspace app if writing is the main task and Mac-only AI access is enough.
      </p>

      <h2 id="onenote">OneNote for an existing Microsoft workflow</h2>
      <p>
        OneNote makes sense if Microsoft notebooks and Copilot already fit the work.
        Copilot can summarize, draft and rewrite, but <a href="https://support.microsoft.com/en-us/microsoft-365-copilot/what-copilot-license-do-i-have" rel="noopener">access depends on the subscription or license</a>.
        Microsoft&apos;s Copilot FAQ lists Windows and Mac and a web rollout; it does not establish the same AI workflow on iPhone.
      </p>
      <p>
        A direct Markdown importer is not stated in <a href="https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks" rel="noopener">Microsoft&apos;s notebook guide</a>.
        <a href="https://help.mem.ai/migration/onenote" rel="noopener">Mem offers a separate OneNote export</a> that creates pages,
        including collection indexes. Mem warns that links and attachments need checking.
        Save the local ZIP as well, before attempting that transfer.
      </p>

      <h2 id="apple-notes">Apple Notes for selected-text writing help</h2>
      <p>
        Apple Notes is a reasonable free destination if a familiar notes editor matters more than chatting with the whole library.
        On Mac, use Import Markdown. On iPhone, share a Markdown file from Files to Notes.
        Writing Tools can summarize or rewrite selected text and compose with ChatGPT on compatible devices.
      </p>
      <p>
        Those controls do not establish a library-wide ChatGPT or Claude connection.
        Choose Apple Notes if working on the text in front of you is enough.
        If the daily task is asking an assistant to find an old note and save a change to it, test a destination with a documented connector.
      </p>

      <h2 id="pinto-notes">Pinto Notes for connected AI on Mac and iPhone</h2>
      <p>
        Pinto Notes is free and looks and works like Apple Notes.
        ChatGPT, Claude, Claude Code and Codex can search, read and edit the same notes after one approval per assistant in the app.
        The remote connection works from any device, including iPhone.
        ChatGPT uses Pinto&apos;s listing in its plugin directory, available since 28 October 2026.
        The <a href="/blog/connect-chatgpt-to-your-notes">connection guide</a> explains setup.
      </p>
      <p>
        Pinto keeps earlier versions of each note. That covers changes made in Pinto, not a transfer of Mem&apos;s version history.
        It runs on Mac and iPhone only, with no Windows, Android or web app.
        Choose Notion or Google Docs instead if browser access or other platforms are required.
      </p>
      <p>
        There is no dedicated Mem importer, and a Mem import has not been tested.
        On a Mac, Import Markdown or Text takes a folder or .zip of Markdown or text files. Each folder becomes a folder.
        This is the generic route described in <a href="/blog/import-your-notes">Import your notes</a>.
        Collection membership, links, dates, formatting and attachments from Mem are unverified.
      </p>
      <Steps>
        <li>Duplicate the extracted Mem export. Keep a few representative notes in the working copy, along with their folders and attachments.</li>
        <li>On a Mac, choose File, Import Markdown or Text in Pinto Notes and select that copy.</li>
        <li>Compare the imported notes with Mem. Collection indexes or the export report may appear as extra notes.</li>
        <li>Connect an assistant, ask it to find one imported note, then make a small edit and check the result in the app.</li>
      </Steps>

      <h2 id="check">Check a small copy before moving everything</h2>
      <p>
        A readable note does not prove that its dates, attachments or collection membership survived.
        Check familiar examples before committing the full library to any destination.
      </p>
      <Keep title="A check for your Mem import" text={IMPORT_CHECK}
        note="Use the items relevant to the library. Record anything missing beside the source filename." />
      <p>
        Keep the original Mem ZIP after the move. It remains a reference for missing text and files after the service closes.
        Keep later exports separately so a newer copy is easy to identify.
      </p>
    </PostPage>
  );
}
