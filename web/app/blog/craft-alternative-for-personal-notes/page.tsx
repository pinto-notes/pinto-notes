import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("craft-alternative-for-personal-notes", {
  title: "Craft Notes alternative for personal notes on Mac",
});

// Written 21 November 2026 for "craft notes alternative", research row 6 in
// topic-research-2026-11-23.md. Its collection date is 21 November.
// Google autocomplete rechecked directly over HTTPS today, client=firefox, hl=en-US, gl=us:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=craft%20notes%20alternative
// Returned: craft notes alternative, craft alternative words, craft notes review,
// craft ideas without paper, alternatives to cardboard. Only the first is replacement intent.
// Models: evernote-alternative and bear-notes-alternative-free; import wording from import-your-notes.
// Craft's own pages read live 21 November 2026:
// https://www.craft.do/pricing (Markdown export, AI, published pages and plan-dependent shared spaces;
// no numeric prices or plan limits used).
// https://www.craft.do/organize (blocks, cards, spaces and Collections).
// https://support.craft.do/en/organize-and-find/collections (custom properties, relational fields,
// table/gallery/kanban views, sorting and filtering).
// https://support.craft.do/en/import-and-export/export/document (Share, Export As, Markdown;
// basic structure/formatting; current collection Markdown export with frontmatter).
// https://support.craft.do/en/integrate/mcp (ChatGPT and Claude connections; all-document connections
// with write permission can create/update documents). AI access is not exclusive to Pinto.
// No Apple Notes menu instructions or independent Apple feature claims used.
// Pinto sources opened today, paths relative to the worktree root:
// README.md:15-26, 64-72, 114-129 confirms Mac/iPhone, Apple Notes layout, folders, headings,
// checklists, tables, linked sub-notes, approved ChatGPT/Claude reading/editing and version history.
// BRIEF.md confirms free Mac download/iPhone app; BRIEF-compare.md confirms no Windows, Android or web app.
// Pane/Model/MarkdownImport.swift:6-21 confirms folder/ZIP Markdown and text input and extensions.
// web/app/blog/import-your-notes/page.tsx supplies the exact wording "a folder or .zip of Markdown
// or text files. Each folder becomes a folder." It also verifies File, Import Markdown or Text.
// web/app/blog/chatgpt-prompt-library-in-notes/page.tsx verifies Allow grants reading and editing.
// This is a proposed format-based trial, not a dedicated Craft importer or a tested Craft migration.
// No promise of Craft block/card, Collections, internal-link or history conversion.
// Pictures: none. All three linked blog posts have draft: false in lib/posts.ts, checked today.

const IMPORT_CHECK = `Craft personal notes trial
- [ ] Compare the full text with the original document
- [ ] Check headings and checked checklist items
- [ ] Read every cell in a small table
- [ ] Open a picture and a file attachment
- [ ] Follow a link to another imported document
- [ ] Find the content of a nested page or card
- [ ] Open and edit the imported note on iPhone
- [ ] Keep the Craft originals and the export`;

const FAQ = [
  { q: "Which Craft alternative suits personal notes on Mac and iPhone?", a: [
    "Pinto Notes is an option if you want Apple Notes-style editing, folders and connected ChatGPT or Claude. Try a small Markdown export first. Keep Craft if you depend on its Collections, card layouts or shared workspace.",
  ] },
  { q: "Does Pinto Notes have a dedicated Craft importer?", a: [
    "The route here uses Pinto's general Markdown and text importer on a Mac. Export a few Craft documents as Markdown and import the folder. This does not promise to recreate a Craft space or preserve every link and layout.",
  ] },
  { q: "Do I have to leave Craft to use ChatGPT or Claude with my notes?", a: [
    "No. Craft documents connections for both ChatGPT and Claude through MCP. It also has its own AI assistant. Try Craft's existing connection if AI access is your only reason for switching.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="craft-alternative-for-personal-notes"
      intro={<>Pinto Notes is a Craft Notes alternative for personal notes on Mac and iPhone, with editing that works like Apple Notes. Keep Craft if its Collections or shared documents are central to your work.</>}
      answer={
        <Answer jump={[
          { href: "#personal-notes", label: "Choose by your notes" },
          { href: "#keep-craft", label: "When to keep Craft" },
          { href: "#export", label: "Try a Markdown move" },
          { href: "#check", label: "Check the result" },
          { href: "#pinto-notes", label: "Use Pinto Notes" },
        ]}>
          <p>
            Choose Pinto Notes for personal notes you want to write in an Apple Notes-style editor on Mac and iPhone.
            Try a few Craft documents through Markdown export and import before moving more.
            Craft already has AI and Markdown export, so neither is a reason on its own to leave.
          </p>
          <PostCta slug="craft-alternative-for-personal-notes" position="answer" title="Try a few personal notes in Pinto Notes.">
            <p>Download Pinto Notes free on your Mac and import a small folder of Markdown files. Connect ChatGPT or Claude when you want it to read and edit those notes.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="personal-notes">Choose by the documents you actually use</h2>
      <p>
        Start with a note you opened this week. A running list of house repairs needs different tools from a
        project database with related records. If most of your Craft documents are text with a few headings
        and checkboxes, try those in Pinto Notes first.
      </p>
      <p>
        Pinto Notes has folders, checklists and tables, with links between notes. Its editor looks and works
        like Apple Notes. That suits a personal library you want to keep writing in on your Mac and iPhone.
        Pinto has no Windows, Android or web app. If you need access on one of those, choose another app.
      </p>
      <p>
        For other options alongside Craft, the <a href="/blog/best-notes-app-for-mac">Mac notes app comparison</a>{" "}
        covers the broader choice. Here, the useful test is whether your own personal documents work after a small move.
      </p>

      <h2 id="keep-craft">When to keep Craft</h2>
      <p>
        Craft lets you build documents from blocks and cards. Its{" "}
        <a href="https://support.craft.do/en/organize-and-find/collections">Collections</a> have custom properties
        and relationships, with table, gallery and Kanban views. Keep Craft if you use those views to manage
        records or browse a visual library. Pinto&apos;s folders and linked notes do not recreate that setup.
      </p>
      <p>
        Shared work is another reason to stay. Craft&apos;s <a href="https://www.craft.do/pricing">plan table</a>{" "}
        lists shared spaces on eligible plans and document publishing. If colleagues work in your Craft space,
        try moving only your private notes. Leave the shared documents where everyone can still work on them.
      </p>
      <p>
        Craft also has its own AI assistant and{" "}
        <a href="https://support.craft.do/en/integrate/mcp">connections for ChatGPT and Claude</a>.
        Its connection options include creating and updating documents with the appropriate access.
        Try that before switching if your main aim is to let an AI work with your Craft notes.
      </p>

      <h2 id="export">Try a small Markdown export on your Mac</h2>
      <p>
        Pick a plain document you can compare easily, such as &ldquo;Hallway repairs&rdquo; with a checklist
        and a paragraph about paint. Then pick a document with an attachment or a nested page.
        The second checks the parts a plain text note cannot tell you about.
      </p>
      <ol>
        <li>In Craft, open the first document and click Share in the top-right corner.</li>
        <li>Choose Export As, then Markdown. Repeat for the other sample document.</li>
        <li>Keep the exported files together in a folder, including any accompanying assets.</li>
        <li>On your Mac, open Pinto Notes&apos; File menu, choose Import Markdown or Text, and select the folder.</li>
      </ol>
      <p>
        The export steps come from <a href="https://support.craft.do/en/import-and-export/export/document">Craft&apos;s
        current export guide</a>. Pinto accepts a folder or .zip of Markdown or text files. Each folder becomes a folder.
        The <a href="/blog/import-your-notes">Pinto import guide</a> describes that route.
      </p>
      <p>
        This is a Markdown move to try with your own documents. Keep the Craft originals while you check it.
        A Markdown export carries basic structure and formatting. It does not establish that the receiving app
        can recreate Craft&apos;s cards or convert its links correctly.
      </p>

      <h2 id="check">Check the imported copies before moving more</h2>
      <p>
        Open each Craft document beside its imported copy. Read the last paragraph as well as the first,
        and follow the links you use. A familiar title in the note list is only the start of the check.
      </p>
      <Keep title="A check for your Craft export" text={IMPORT_CHECK}
        note="Use this as a review list. These items describe what to check, not a promise that each part transfers." />
      <p>
        Craft now offers Markdown exports of Collection items with their property values saved as text.
        That still does not verify a Collections migration into Pinto Notes. Keep important Collections in Craft
        until you have checked what an export contains and how the imported copies behave.
        Craft&apos;s earlier document versions are also outside the transfer promised here.
      </p>

      <h2 id="pinto-notes">Write and revise the notes in Pinto Notes</h2>
      <p>
        Once the sample works for you, bring over the personal notes you want to keep in Pinto.
        You can write in them yourself, use folders to organize them and link related notes.
        Pinto keeps every earlier version of a note as you edit it there. That history starts in Pinto;
        it is no promise to recover revisions from Craft.
      </p>
      <p>
        If you want AI help, <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a>{" "}
        and approve the connection in Pinto Notes. Allow grants reading and editing access.
        Try asking it to read &ldquo;Hallway repairs&rdquo; and suggest a next step from the unfinished items.
        Check its suggestion, then ask it to add the step to the note. Open the note and check the edit too.
      </p>
    </PostPage>
  );
}
