import { Figure } from "@/lib/blog";
import { MCP_URL } from "@/lib/facts";
import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer } from "@/lib/PostParts";
import { SHOTS } from "@/lib/posts";

export const dynamic = "force-static";
export const metadata = postMetadata("best-notes-apps-with-mcp", { title: "Best notes app with MCP: 6 apps compared" });

// Written 21 November 2026 for "best notes app with mcp". Research row 14 in topic-research-2026-11-20.md.
// Google autocomplete read live 21 Nov 2026, client=firefox, hl=en, gl=us, at
// https://suggestqueries.google.com/complete/search for all six brief queries: best notes app with mcp,
// notes app mcp, apple notes mcp, bear notes mcp, notesnook mcp, standard notes mcp. Returned variants include
// apple notes app mcp, bear notes app mcp, mac notes app mcp, apple notes mcp server, apple notes mcp claude,
// apple notes mcp github, apple notes mcp claude code, icloud notes mcp, ios notes mcp, bear notes mcp server,
// bear notes claude mcp, notesnook mcp server. Other results included which is the best app for notes,
// apps to take notes with, what is standard notes, is standard notes free, is standard notes secure.
// Maker sources read live 21 Nov 2026:
// https://bear.app/faq/command-line-interface/ (official local MCP, Mac only, Bear 2.8+, Claude Connector,
// read/write/search, tag scoping, encrypted notes excluded). No Bear prices or performance claims.
// https://obsidian.md/help/data-storage (vaults are local Markdown files, editable with other tools).
// https://community.obsidian.md/plugins/obsidian-local-rest-api (Adam Coddington's community plugin,
// built-in local MCP, API key, search/read/write, section edits). This is a community listing, not an Obsidian-made server.
// https://www.notion.com/help/notion-mcp and https://developers.notion.com/guides/mcp/overview
// (workspace search, page edits, databases, existing permissions), and
// https://developers.notion.com/guides/mcp/get-started-with-mcp (official hosted server, OAuth).
// https://notesnook.com/ and https://notesnook.com/help/ (open source, notebooks, tags, web clipper;
// no official MCP setup found in the help reviewed). https://github.com/streetwriters/notesnook/discussions/10571
// is a community author's experimental bridge announcement in the maker's repository, not maker documentation
// or endorsement. Only its unofficial, experimental, local status is reported; no tool capabilities inferred.
// https://support.apple.com/guide/notes/get-started-apd441e46563/mac (read directly after web fetch returned 429:
// iCloud, checklists, tables, media; no MCP setup in this guide). No Apple-made server found in docs reviewed.
// https://standardnotes.com/help (no official MCP setup found in help index; no claim that all community tools are absent).
// Pinto facts: BRIEF.md (Apple Notes feel, iPhone and Mac, Apple Notes import leaves source unchanged);
// app/blog/mcp-server/page.tsx (hosted address via MCP_URL, approval, tools, Undo, previous versions), and
// app/blog/obsidian-mcp/page.tsx (approval per AI app, remote use without a Mac left on, Apple-only apps).
// Picture: SHOTS.aiEdit, reused from obsidian-mcp's verified AI-change description and best-notes-app-for-mac.
// These are documentation comparisons. We did not test the other apps' MCP connections or community servers.

const ROWS = [
  { app: "Pinto Notes", route: "Official hosted MCP server", use: "Search, read, create and edit notes. You approve each AI app.",
    fit: "Apple Notes' feel on iPhone and Mac, with AI access from elsewhere.", limit: "Apple-only notes app. The hosted server works without leaving your Mac on." },
  { app: "Obsidian", route: "Community MCP plugin", use: "Local REST API with MCP adds search, reading and writing, including edits to one section.",
    fit: "A library of local Markdown files you can edit with other tools.", limit: "This plugin runs inside Obsidian on your computer. It is made by Adam Coddington, not Obsidian." },
  { app: "Bear", route: "Official local MCP server", use: "Bear's bundled bearcli lets an AI search, read, create and edit notes.",
    fit: "Keeping your Bear library and connecting it to a local AI client.", limit: "Mac only, Bear 2.8 or later. Encrypted notes cannot be read or changed through these tools." },
  { app: "Notesnook", route: "Community experiment; no official MCP setup found", use: "A community author announced a local bridge in Notesnook's Show and tell discussions.",
    fit: "Open-source notes with notebooks, tags and a web clipper.", limit: "The bridge is experimental and unofficial. Notesnook's help reviewed here does not document a supported MCP connection." },
  { app: "Notion", route: "Official hosted MCP server", use: "Search the workspace, create and edit pages, and manage databases.",
    fit: "Notes that belong with a team's documents and project databases.", limit: "The connection uses your Notion permissions. Review what your account can access." },
  { app: "Apple Notes", route: "No official MCP setup documented in the Notes guide", use: "Apple's guide covers using Notes itself, without an MCP connection.",
    fit: "Notes with iCloud, checklists, tables and media on Apple devices.", limit: "No Apple-made MCP route found in the documentation checked. See the Apple Notes section below." },
];

const FAQ = [
  { q: "Which notes apps document their own MCP server?", a: [
    "Pinto Notes and Notion have hosted MCP servers. Bear documents an official server that runs locally on a Mac. The Obsidian plugin and Notesnook experiment described here are community projects. We have not tested the other apps' connections.",
  ] },
  { q: "Does Bear's MCP connection run on an iPhone?", a: [
    "No. Bear says its CLI, Claude Connector and MCP server are macOS-only and require Bear 2.8 or later. Its Claude Connector requires the Claude desktop app.",
  ] },
  { q: "Is Notesnook MCP an official Notesnook feature?", a: [
    "No official MCP setup was found in the Notesnook help reviewed on 21 November 2026. A community author posted an experimental local bridge in the project's Show and tell discussions. It is unofficial, and we have not tested it.",
  ] },
  { q: "Does Standard Notes document an MCP connection?", a: [
    "The Standard Notes help index checked on 21 November 2026 did not document an MCP setup. That does not establish whether a community project exists. We have not tested a Standard Notes MCP connection.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="best-notes-apps-with-mcp"
      intro={<>Pinto Notes and Notion have hosted MCP servers. Bear has an official local server for Mac. Obsidian has community plugins, while Notesnook has a community experiment and Apple&apos;s Notes guide documents no MCP setup.</>}
      answer={
        <Answer jump={[
          { href: "#compared", label: "The six apps" },
          { href: "#hosted", label: "Hosted connections" },
          { href: "#local", label: "Local connections" },
          { href: "#apple-notes", label: "Apple Notes" },
          { href: "#pinto-notes", label: "Pinto Notes" },
        ]}>
          <p>
            Choose Pinto Notes if you want an Apple Notes-style app whose hosted MCP lets ChatGPT or Claude read and edit your notes.
            Choose Notion for a shared workspace with pages and databases, or Bear if you want an official MCP connection to your existing Bear notes on a Mac.
            Obsidian&apos;s community route suits a local Markdown library; treat Notesnook&apos;s experimental bridge as something to investigate before switching.
          </p>
          <PostCta slug="best-notes-apps-with-mcp" position="answer" title="Your notes, connected to your AI">
            <p>Pinto Notes works like Apple Notes on iPhone and Mac. Its hosted MCP lets ChatGPT or Claude search, read and edit your notes, with Undo and earlier versions kept.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="compared">Six notes apps and their MCP connections</h2>
      <p>
        MCP stands for Model Context Protocol. It lets a compatible AI app call tools to work with your notes.
        This table compares the apps and the connections their documentation describes, checked on 21 November 2026.
        We publish Pinto Notes. We haven&apos;t tested the other apps&apos; MCP connections or the community servers mentioned here.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">Notes app</th><th scope="col">MCP route</th><th scope="col">What the docs describe</th><th scope="col">Who it suits</th><th scope="col">What to know</th></tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.app}><th scope="row">{row.app}</th><td>{row.route}</td><td>{row.use}</td><td>{row.fit}</td><td>{row.limit}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 id="hosted">Pinto Notes and Notion have hosted connections</h2>
      <p>
        A hosted MCP server gives a compatible AI app an internet address to connect to. You authorize the connection, then ask the AI
        to use the tools it exposes. Pinto Notes&apos; address is <code>{MCP_URL}</code>. You approve each AI app, and its changes come with Undo and earlier versions.
      </p>
      <p>
        <a href="https://developers.notion.com/guides/mcp/get-started-with-mcp" rel="noopener">Notion&apos;s official hosted server</a> is at{" "}
        <code>https://mcp.notion.com/mcp</code>. Its <a href="https://developers.notion.com/guides/mcp/overview" rel="noopener">documented tools</a>{" "}
        search the workspace, edit pages and manage databases. That makes it worth considering when meeting notes belong beside a team&apos;s project work.
        The connection respects your existing Notion permissions.
      </p>

      <h2 id="local">Bear and Obsidian connect on your computer</h2>
      <p>
        Bear has its own server. Its <a href="https://bear.app/faq/command-line-interface/" rel="noopener">official MCP guide</a> documents{" "}
        <code>bearcli mcp-server</code>, bundled with Bear for Mac. The Claude Connector installs through Help, Advanced, Install Claude Connector.
        Both use the local Bear database. Bear also documents tag filters to limit visible notes. Encrypted notes stay out of reach.
      </p>
      <p>
        Obsidian&apos;s strength is its <a href="https://obsidian.md/help/data-storage" rel="noopener">folder of plain Markdown files</a>.
        Its community directory lists <a href="https://community.obsidian.md/plugins/obsidian-local-rest-api" rel="noopener">Local REST API with MCP</a>{" "}
        by Adam Coddington. The plugin adds a local server with an API key and can edit a particular heading or block.
        It runs inside Obsidian, so keep the app and computer running for that route.
      </p>
      <p>
        Bear&apos;s connection is made by Bear. The Obsidian plugin is community-made. Neither connection described above is a hosted service.
        The <a href="/blog/obsidian-mcp">Obsidian MCP comparison</a> covers other approaches, including servers that work on the vault&apos;s files.
      </p>

      <h2 id="notesnook">Notesnook has a community experiment</h2>
      <p>
        <a href="https://notesnook.com/" rel="noopener">Notesnook</a> is open source and has notebooks, tags and a web clipper.
        Its <a href="https://notesnook.com/help/" rel="noopener">help pages</a> reviewed for this comparison did not document an official MCP setup.
      </p>
      <p>
        A community author posted an <a href="https://github.com/streetwriters/notesnook/discussions/10571" rel="noopener">experimental local MCP bridge</a>{" "}
        in the maker&apos;s repository. The author explicitly calls it unofficial. A post in Show and tell is a community announcement,
        and does not make the bridge a supported Notesnook feature. We haven&apos;t tested it. If you already use Notesnook, read the project&apos;s
        current requirements before deciding whether to try it.
      </p>

      <h2 id="apple-notes">What about Apple Notes MCP?</h2>
      <p>
        Apple Notes remains useful if you want iCloud notes with checklists, tables and media.{" "}
        <a href="https://support.apple.com/guide/notes/get-started-apd441e46563/mac" rel="noopener">Apple&apos;s Notes guide</a> explains those tools,
        but does not document an MCP server. We found no Apple-made MCP setup in the documentation checked for this article.
      </p>
      <p>
        Keep that distinction in mind when a search result says &ldquo;Apple Notes MCP&rdquo;. This table gives no assurance about a community project&apos;s capabilities.
        The <a href="/blog/apple-notes-api">Apple Notes API guide</a> covers the separate routes into an existing Apple Notes library.
      </p>

      <h2 id="pinto-notes">Pinto Notes keeps the Apple Notes feel</h2>
      <p>
        Pinto Notes is for iPhone and Mac. There is no Windows, Android or web app.
        Its hosted server lets ChatGPT and Claude use your notes without leaving your Mac on. Claude Code and Codex can connect too.
        The <a href="/blog/mcp-server">Pinto Notes MCP server guide</a> lists the tools and explains approval.
      </p>
      <Figure shot={SHOTS.aiEdit} caption="ChatGPT added five lines to a Groceries note in Pinto Notes on a Mac. The changes are tinted, with Undo." />
      <p>
        An AI can search and read notes, create one, or edit an existing note. You see what it changed, can undo it, and can return to an earlier version.
        To bring an existing library over, <a href="/blog/move-from-apple-notes">import Apple Notes on your Mac</a>. Apple Notes stays unchanged.
      </p>
    </PostPage>
  );
}
