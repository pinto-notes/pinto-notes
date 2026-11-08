import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostFigure } from "@/lib/PostParts";
import { APP_STORE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("import-your-notes", { title: "Pinto Notes now imports from Apple Notes, Obsidian and more" });

export default function Page() {
  return (
    <PostPage
      slug="import-your-notes"
      intro={<>Moving notes apps usually means a weekend of exporting, unzipping and fixing. In Pinto Notes on the Mac it takes a few minutes, and the app walks you through every step for the app you&apos;re leaving.</>}
    >
      <h2>Pick where your notes are</h2>
      <p>
        On your Mac, open the File menu and choose the app you&apos;re leaving: Apple Notes, Obsidian, Evernote, Google Keep, Bear,
        or Markdown and text files. Pinto Notes shows you exactly what to click in that app, one step at a time, with a picture of
        the button. Your old app stays as it is.
      </p>
      <PostFigure src="/blog/launch/import-file-menu" width={820} height={800} maxWidth={520} kind="plain"
        alt="The File menu in Pinto Notes on a Mac: Import from Apple Notes, Obsidian, Bear, Evernote and Google Keep, each with its app's icon, and Import Markdown or Text."
        caption="The File menu on the Mac: pick the app your notes are in." />

      <h2>What comes with your notes</h2>
      <PostFigure src="/blog/launch/import-on-iphone" width={1080} height={1260} maxWidth={620} kind="plain"
        alt="An imported library on iPhone: folders Notes, Recipes, Work, Travel and Home with 1,284 notes, and the notes list with Ideas, Pasta night, Standup, Porto and more."
        caption="An imported library: the folders come with the notes, and it's all on your iPhone too." />
      <ul>
        <li><strong>Apple Notes:</strong> your folders and pictures. Checklists and pins too, once you give Pinto Notes Full Disk Access. Pick everything, or only some notes. Import again later and the notes already here are skipped.</li>
        <li><strong>Obsidian:</strong> Pinto Notes finds your vault. Subfolders, pictures and the links between notes come too, and your vault stays where it is.</li>
        <li><strong>Evernote:</strong> export each notebook as an .enex file and drop them all in at once. Each notebook becomes a folder, and tags come too.</li>
        <li><strong>Google Keep:</strong> Pinto Notes opens Google&apos;s download page with only Keep ticked. Drop the download in, and your labels become folders.</li>
        <li><strong>Bear:</strong> export your notes as Markdown with attachments, then choose the folder. Pictures come too.</li>
        <li><strong>Notion, Joplin, Logseq or anything else:</strong> a folder or .zip of Markdown or text files. Each folder becomes a folder.</li>
      </ul>
      <p>
        <a href="/blog/move-from-apple-notes">Moving from Apple Notes</a> goes through that import in detail.
      </p>

      <h2>On iPhone</h2>
      <p>
        A whole library is easiest to bring in on a Mac, and it&apos;s on your iPhone a moment later. No Mac? The iPhone guide
        shows how to bring notes in one at a time. Get the Mac app from the <a href="/download">download page</a> and the iPhone
        app from the <a href={APP_STORE_URL} rel="noopener">App Store</a>. Then <a href="/blog/connect-chatgpt-to-your-notes">connect
        ChatGPT or Claude</a>, and your AI can work with notes you&apos;ve had for years.
      </p>
    </PostPage>
  );
}
