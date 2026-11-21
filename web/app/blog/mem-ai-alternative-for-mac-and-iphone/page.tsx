import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Facts, FigurePair, FolderTree, Keep, More, PostFigure, Sorter, Steps } from "@/lib/PostParts";
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
// Pictures (21 Nov visual pass, B35): sorter, folder tree, facts strips, Notion's import capture, Pinto's ChatGPT edit pair. Body blog links point to published posts in lib/posts.ts.

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
        The seven apps <a href="https://help.mem.ai/migration" rel="noopener">Mem recommends</a>, plus Pinto Notes,
        sorted by where they leave your AI. Checked against each vendor&apos;s own pages on 21 November 2026.
      </p>
      <Sorter groups={[
        { tone: "leaf", ais: ["openai", "claude"], title: "ChatGPT and Claude edit your notes, from your phone too",
          items: [{ name: "Notion", href: "#notion" }, { name: "Pinto Notes", href: "#pinto-notes" }],
          line: "An official connection that reads and writes, after you allow it." },
        { tone: "sky", ais: ["openai", "claude"], title: "ChatGPT and Claude, for documents",
          items: [{ name: "Google Docs", href: "#google-docs" }],
          line: "Official connections search and edit Google Docs. Claude edits on web or desktop." },
        { tone: "amber", ais: ["claude"], title: "AI on a computer only",
          items: [{ name: "Bear", href: "#bear" }, { name: "Obsidian", href: "#obsidian" }],
          line: "Their AI tools run on the computer. An assistant on your phone can't reach them." },
        { tone: "rose", title: "Their own AI, inside the app",
          items: [{ name: "Evernote", href: "#evernote" }, { name: "OneNote", href: "#onenote" }, { name: "Apple Notes", href: "#apple-notes" }],
          line: "Evernote's assistant and OneNote's Copilot. Apple Notes helps with the text you select." },
      ]} />
      <More summary="Every detail, with a source for each line">
      <p>
        Markdown support means the format is accepted, not that a full Mem move was tested.
        MCP is how an AI assistant connects to an app.
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
              <td><a href="https://support.apple.com/guide/iphone/writing-tools-write-improve-summarize-iph6f08da1d2/27/ios/27" rel="noopener">Writing Tools</a> rewrite/summarize selected text and compose with ChatGPT. Claude desktop on a Mac can use <a href="https://claude.com/connectors/read-and-write-apple-notes" rel="noopener">Anthropic&apos;s Apple Notes extension</a>.</td>
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
      </More>

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
      <FolderTree root="Your Mem export (.zip)" items={[
        { name: "notes/", note: "one .md file per note" },
        { name: "collections/", note: "an index for each collection" },
        { name: "attachments/", note: "your files" },
        { name: "export-report.md", note: "what the export could not include (optional)", file: true },
      ]} caption="What the download holds, from Mem's download guide." />
      <p>
        A note in two collections appears in both indexes. Transcripts come by default; audio recordings are an option you pick
        before starting. See Mem&apos;s <a href="https://help.mem.ai/migration/save-a-copy" rel="noopener">download guide</a>, and work from a copy.
      </p>

      <h2 id="notion">Notion for a workspace with connected AI</h2>
      <Facts items={[
        { label: "Mem import", value: "Markdown, on desktop or web" },
        { label: "ChatGPT and Claude", value: "Read and write pages" },
        { label: "Also on", value: "Windows, Android, web" },
      ]} />
      <PostFigure src="/blog/apple/notion-settings-import" width={2136} height={1340} maxWidth={700}
        alt="Notion's Settings window open at Import: a drop area for ZIP, CSV, PDF, text, Markdown or HTML files up to 5 GB, and tiles for each kind."
        caption="Notion's Settings, Import, where the Mem ZIP goes. Image: Notion." />
      <p>
        Choose Notion if ChatGPT or Claude reading and writing pages matters more than a small notes editor.
        Its <a href="https://www.notion.com/help/notion-mcp" rel="noopener">official MCP connection</a> does both, and{" "}
        <a href="https://support.claude.com/en/articles/11176164-use-connectors-to-extend-claude-s-capabilities" rel="noopener">Claude supports connectors on iPhone</a>,
        with workspace permissions still applying.
      </p>
      <p>
        The free plan includes an AI trial; Notion Agent is in Business. Test the imported pages and their links before relying on them.
        For a smaller personal notebook, compare the <a href="/blog/notion-alternative-for-personal-notes-on-mac">personal-notes trade-offs</a>.
      </p>

      <h2 id="google-docs">Google Docs or Drive for documents and sharing</h2>
      <Facts items={[
        { label: "Mem import", value: "As Google Docs, or .md files in Drive" },
        { label: "ChatGPT and Claude", value: "Search, read and edit Docs" },
        { label: "On iPhone", value: "Gemini; Claude edits on web or desktop" },
      ]} />
      <p>
        Pick Google if the notes should become documents other people edit.{" "}
        <a href="https://help.openai.com/en/articles/10929079-google-drive-app-and-setup-in-chatgpt" rel="noopener">ChatGPT&apos;s official Drive app</a>{" "}
        can search, read and update them when your plan and Google permissions allow it.{" "}
        <a href="https://support.claude.com/en/articles/10166901-use-google-workspace-connectors" rel="noopener">Claude edits Docs through a separate connector</a>,
        on web or desktop. On iPhone, Gemini offers <a href="https://support.google.com/drive/answer/16685111?co=GENIE.Platform%3DiOS&amp;hl=en-en" rel="noopener">Drive search</a>{" "}
        and <a href="https://support.google.com/docs/answer/14206696?co=GENIE.Platform%3DiOS&amp;hl=en-7" rel="noopener">Docs questions</a>{" "}
        with an eligible plan, and <a href="https://support.google.com/docs/answer/18289341?co=GENIE.Platform%3DiOS&amp;hl=en" rel="noopener">Docs can edit .md files</a>.
        Test native Google Docs with your AI first; raw .md files may not behave the same.
      </p>
      <h2 id="evernote">Evernote for AI inside the notes app</h2>
      <Facts items={[
        { label: "Mem import", value: ".md, through Settings, Import" },
        { label: "AI", value: "Built-in assistant; Claude reads and creates (paid)" },
        { label: "Free plan", value: "50 notes, one device" },
      ]} />
      <p>
        Evernote fits if you want to ask questions and change notes without opening another assistant. Its{" "}
        <a href="https://help.evernote.com/hc/en-us/articles/46319409880211-AI-Assistant" rel="noopener">AI Assistant</a>{" "}
        searches, creates and rewrites notes on desktop, web and mobile. Through{" "}
        <a href="https://help.evernote.com/hc/en-us/articles/51596325640339-Evernote-MCP-Model-Context-Protocol" rel="noopener">MCP</a>,
        paid users can let Claude read and create notes, but edits to existing notes aren&apos;t promised. Import through Settings, Import:
        dropping a file into the note list can attach it instead of converting it.
      </p>
      <h2 id="obsidian">Obsidian for a library of Markdown files</h2>
      <Facts items={[
        { label: "Mem import", value: "Copy the files into a vault" },
        { label: "AI", value: "Official CLI or a community MCP, on a computer" },
        { label: "From your phone", value: "No" },
      ]} />
      <p>
        Obsidian fits if keeping your notes as plain Markdown files matters most. Its official CLI lets an agent such as Claude Code
        search, read and add to notes on that computer, while the app runs. The{" "}
        <a href="https://github.com/coddingtonbear/obsidian-local-rest-api" rel="noopener">Local REST API MCP plugin</a>{" "}
        is a community option, and it also runs locally, so an assistant on your phone can&apos;t reach the vault.
        The <a href="/blog/obsidian-mcp">Obsidian MCP comparison</a> covers those setups. Sync is a separate paid service.
      </p>
      <h2 id="bear">Bear for writing with Claude on a Mac</h2>
      <Facts items={[
        { label: "Mem import", value: ".md, or Markdown Folder on a Mac" },
        { label: "AI", value: "Claude on a Mac, Bear 2.8 or later" },
        { label: "From your phone", value: "No" },
      ]} />
      <p>
        Bear fits a Markdown writing notebook with Claude at the desk. Its own Claude connector and MCP server can search, read,
        create and edit notes, from Bear 2.8, on a Mac only; the connector needs Claude desktop.
        On a Mac, Markdown Folder import brings in the attachments the notes point to. Bear Pro adds sync; the free plan keeps notes on the device.
      </p>
      <h2 id="onenote">OneNote for an existing Microsoft workflow</h2>
      <Facts items={[
        { label: "Mem import", value: "Mem's own OneNote transfer" },
        { label: "AI", value: "Copilot, with a license" },
        { label: "On iPhone", value: "Not stated by Microsoft" },
      ]} />
      <p>
        OneNote fits if Microsoft notebooks already run your work. Copilot can summarize, draft and rewrite, but{" "}
        <a href="https://support.microsoft.com/en-us/microsoft-365-copilot/what-copilot-license-do-i-have" rel="noopener">it depends on your license</a>,
        and Microsoft lists Windows, Mac and web, not iPhone.{" "}
        <a href="https://support.microsoft.com/en-us/onenote/export-and-import-onenote-notebooks" rel="noopener">Microsoft&apos;s notebook guide</a>{" "}
        has no Markdown import, but{" "}
        <a href="https://help.mem.ai/migration/onenote" rel="noopener">Mem offers its own OneNote export</a>.
        Mem warns that links and attachments need checking, so save the ZIP first.
      </p>
      <h2 id="apple-notes">Apple Notes for selected-text writing help</h2>
      <Facts items={[
        { label: "Mem import", value: ".md files, OS 26 or later" },
        { label: "AI", value: "Writing Tools on selected text" },
        { label: "Price", value: "Free" },
      ]} />
      <p>
        Apple Notes fits if a familiar free editor matters more than chatting with your whole library. On a Mac, use Import Markdown;
        on iPhone, share a Markdown file from Files to Notes. Writing Tools work on the text you select, and can compose with ChatGPT.
        For Claude to search the whole library, Claude desktop on a Mac has an Apple Notes extension; that route runs through the Mac.
      </p>
      <h2 id="pinto-notes">Pinto Notes for connected AI on Mac and iPhone</h2>
      <Facts items={[
        { label: "Mem import", value: "Markdown folder or .zip; untested with Mem" },
        { label: "AI", value: "ChatGPT, Claude, Claude Code, Codex read and edit" },
        { label: "From your phone", value: "Yes" },
      ]} />
      <FigurePair caption="ChatGPT added five items to a grocery list. The note shows what changed, with Undo, on iPhone and Mac. Image: Pinto Notes." items={[
        { src: "/blog/amber-notes-iphone-chatgpt-edited-checklist", width: 1206, height: 2622, alt: "A grocery list in Pinto Notes on iPhone, five lines highlighted and a bar reading ChatGPT changed 5 lines, Undo." },
        { src: "/blog/amber-notes-chatgpt-edit-undo", width: 1260, height: 1520, alt: "The same grocery list in Pinto Notes on a Mac, the five new lines highlighted, with an Undo button." },
      ]} />
      <p>
        Pinto Notes is free and looks and works like Apple Notes. ChatGPT, Claude, Claude Code and Codex can search, read and edit
        your notes after one approval per assistant in the app, from any device, including iPhone.
        ChatGPT finds Pinto in its plugin directory. The <a href="/blog/connect-chatgpt-to-your-notes">connection guide</a> explains setup.
      </p>
      <p>
        There is no Mem importer, and a Mem import hasn&apos;t been tested. On a Mac, File, Import Markdown or Text takes a folder or
        .zip of Markdown files, and each folder becomes a folder (see <a href="/blog/import-your-notes">Import your notes</a>).
        Check collections, links, dates and attachments. Pinto keeps earlier versions of each note from here on, not Mem&apos;s history.
        It runs on Mac and iPhone only; pick Notion or Google Docs if you need a browser, Windows or Android.
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
