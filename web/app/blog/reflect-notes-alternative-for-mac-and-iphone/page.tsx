import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Keep, Steps } from "@/lib/PostParts";
import { PostCta } from "@/lib/PostCta";

export const dynamic = "force-static";
export const metadata = postMetadata("reflect-notes-alternative-for-mac-and-iphone", {
  title: "Reflect Notes alternative for Mac and iPhone",
});

// Written 21 November 2026 for "reflect notes alternative", research row 6 and A6 in
// topic-research-2026-11-24.md. The row notes an existing comparison and Reflect's own
// Open migration route. This post answers the Apple-only switching decision, not a ranking.
// Google autocomplete rechecked today over direct HTTPS after the web reader failed:
// https://suggestqueries.google.com/complete/search?client=firefox&hl=en-US&gl=us&q=reflect%20notes%20alternative
// Full suggestions: reflect notes alternative; reflect notes free alternative;
// what is reflection note; reflective notes example. The last two concern writing, not
// necessarily the app. These are suggestions, not search-volume evidence.
// Maker pages read live 21 November 2026:
// https://reflect.academy/moving-to-reflect-open (Open is a separate, open-source app;
// Markdown files in an owned folder; no deadline to move; daily notes, links, backlinks
// and tags in its documented import; note history is excluded from that Open import).
// https://reflect.academy/import-export-backups (Classic Graph preferences, select the
// graph, Markdown zip, Export Reflect). No Reflect prices or Apple Notes procedures used.
// Pinto sources opened in the wave9 checkout, paths relative to its repo root:
// BRIEF.md supplies Apple Notes look/behavior, free Mac download, connected ChatGPT/Claude
// read/edit access and every earlier version kept. README.md:15-26, 62-69 confirms these.
// BRIEF-compare.md supplies Mac/iPhone only, no Windows, Android or web app.
// web/app/blog/import-your-notes/page.tsx supplies the exact generic import wording:
// "a folder or .zip of Markdown or text files. Each folder becomes a folder."
// Pane/Model/MarkdownImport.swift:6-21, 220-282 confirms folder/ZIP and Markdown/text input.
// Pane/Views/ImportSheet.swift:6-24, 54-59 confirms no dedicated Reflect choice and the
// Import Markdown or Text menu name. web/app/blog/connect-chatgpt-to-your-notes/page.tsx
// verified header confirms one Allow grants reading and editing. No fresh Reflect export
// or running-app migration tested. Daily-note behavior, tags, backlinks, attachments,
// dates and Reflect history preservation are not promised. No pictures used.
// Both body blog links and suggested inbound source import-your-notes are draft: false.

const IMPORT_CHECK = `Reflect trial import
- [ ] Read a long note from beginning to end beside the original
- [ ] Check a daily note and its date
- [ ] Follow a link to another imported note
- [ ] Check whether backlinks still support the way I find notes
- [ ] Compare tags and where the notes appear
- [ ] Check a table and a checklist
- [ ] Open each image and attachment in the sample
- [ ] Open the imported copies on iPhone
- [ ] Keep the original ZIP and access to Reflect`;

const FAQ = [
  { q: "Do I have to leave Reflect Classic by a deadline?", a: [
    "No. Reflect's migration guide, checked 21 November 2026, says there is no deadline to move to Reflect Open. Take time to compare your options and check an export before changing your daily app.",
  ] },
  { q: "Does Pinto have a dedicated Reflect importer?", a: [
    "No. Use Reflect Classic's Markdown zip export with Pinto's general Markdown and text import on a Mac. Try a few notes first. This route has not been tested here with a fresh Reflect export.",
  ] },
  { q: "Will my Reflect daily notes and backlinks work the same in Pinto?", a: [
    "That is not verified. Import a daily note and two notes linked to each other, then compare them with Reflect. Check dates, navigation and tags as well as the text before deciding to move the rest.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="reflect-notes-alternative-for-mac-and-iphone"
      intro={<>Pinto Notes is a free Reflect Notes alternative for Mac and iPhone if you want Apple Notes-style editing with connected ChatGPT or Claude access. Reflect Open is another option, and Reflect says there is no deadline to leave Classic.</>}
      answer={
        <Answer jump={[
          { href: "#stay-with-reflect", label: "Reasons to stay" },
          { href: "#export", label: "Export from Classic" },
          { href: "#import", label: "Try Pinto on Mac" },
          { href: "#check", label: "Check your notes" },
          { href: "#pinto-notes", label: "Use your AI" },
        ]}>
          <p>
            Choose Pinto Notes for Apple Notes-style editing on Mac and iPhone, with ChatGPT or Claude able to read and edit
            your notes once connected. Try Reflect Open first if you want to keep a Reflect workflow with Markdown files in
            a folder you own. For a Pinto trial from Classic, export Markdown and check a small sample before moving everything.
          </p>
          <PostCta slug="reflect-notes-alternative-for-mac-and-iphone" position="answer" title="Try your Reflect notes in Pinto Notes.">
            <p>Download Pinto Notes free on your Mac. Import a few exported Markdown notes, compare the copies, then connect ChatGPT or Claude if you want AI access.</p>
          </PostCta>
        </Answer>
      }
      hero={<></>}
      faq={FAQ}
    >
      <h2 id="stay-with-reflect">Who should stay with Reflect?</h2>
      <p>
        Stay if daily notes and backlinks suit how you write and find things. Reflect&apos;s own
        <a href="https://reflect.academy/moving-to-reflect-open"> guide to Reflect Open</a> describes a separate app with
        public source code and Markdown notes in a folder you own. File ownership alone is no reason to choose Pinto over it.
      </p>
      <p>
        Reflect documents an Open import for daily notes, backlinks and tags, among other content. It excludes note history.
        That gives you a Reflect-specific route to compare with a general Markdown import elsewhere. You can also keep using
        Classic while deciding. Check the current guide before moving.
      </p>
      <p>
        Pinto makes sense if you want an editor that looks and works like Apple Notes and want connected ChatGPT or Claude to
        work in those notes. Pinto is Mac and iPhone only. It has no Windows, Android or web app, so check that these are the
        devices where you need to write.
      </p>

      <h2 id="export">Export Markdown from Reflect Classic</h2>
      <p>
        Reflect&apos;s <a href="https://reflect.academy/import-export-backups">export guide</a> lists Markdown zip as an export
        format. Use that for this trial. The Reflect Open export named in its migration guide is intended for Reflect Open;
        this Pinto route uses the general Markdown format.
      </p>
      <Steps>
        <li>In Reflect Classic, open your Graph&apos;s preferences with Command-comma and select the graph in the sidebar.</li>
        <li>Choose Markdown zip as the export format, then click Export Reflect.</li>
        <li>Save the original ZIP somewhere you can find again. Make a separate working copy for the trial.</li>
      </Steps>
      <p>
        Extract the working copy and choose a few notes that will test the move. Include a daily note, a long project note,
        and two notes linked to each other. Include a picture or attachment you use. Keep the sample files in their relative
        folders with any assets they refer to, so moving them around does not itself break their links.
      </p>
      <p>
        Already using Reflect Open? Its guide says the notes are Markdown files in your chosen folder. Copy a few notes and
        their related assets into a separate sample folder. Keep your working graph intact while you test the copies.
      </p>

      <h2 id="import">Use Pinto&apos;s general import on a Mac</h2>
      <p>
        Open Pinto Notes on your Mac. In the File menu, choose Import Markdown or Text and select your sample folder.
        Follow the import steps. The route described in <a href="/blog/import-your-notes">Import your notes</a> accepts
        a folder or .zip of Markdown or text files. Each folder becomes a folder.
      </p>
      <p>
        There is no dedicated Reflect importer. A supported file format gives you a way to try the notes; it does not establish
        that Reflect&apos;s organization or navigation transfers. This guide has not tested a fresh Reflect export in Pinto.
      </p>

      <h2 id="check">Check the parts you use every day</h2>
      <p>
        Open an imported note beside its Reflect original. Read the whole note, then try the links and attachments.
        For a daily note, check how its date appears and how you would find it again. Seeing the text is only one part of
        deciding whether the new app suits the way you use those notes.
      </p>
      <Keep title="A check for your Reflect trial" text={IMPORT_CHECK}
        note="Use this with the sample before deciding whether to import the rest of your library." />
      <p>
        Write down anything that needs repair. Check tags and backlinks separately from ordinary links. An imported tag word
        does not establish that you can browse it the same way. Keep access to Reflect for its earlier note versions;
        bringing that history into Pinto is not verified.
      </p>
      <p>
        If the sample works, try a larger batch and repeat the checks before making Pinto your daily app.
        If the missing behavior matters more than the new editing workflow, keep using Reflect. Retain the original export
        either way so you can compare a detail you notice later.
      </p>

      <h2 id="pinto-notes">Let ChatGPT or Claude work in the imported notes</h2>
      <p>
        Once you <a href="/blog/connect-chatgpt-to-your-notes">connect ChatGPT or Claude</a> to Pinto Notes, choose Allow
        when Pinto asks. That grants reading and editing access. Start with one imported project note you have already checked.
      </p>
      <p>
        Ask the AI to read that note and summarize its unfinished work in the chat. Compare the answer with the note.
        If the summary is accurate, ask it to add one next action you supply. Open the edited note and check that it kept the
        original text and put your action in the right place. An AI can miss a detail or change the wrong passage.
      </p>
      <p>
        Pinto keeps every earlier version of a note. That covers changes made in Pinto; it does not recreate Reflect&apos;s
        history. Keep the source app and export available until you have checked the notes you rely on.
      </p>
    </PostPage>
  );
}
