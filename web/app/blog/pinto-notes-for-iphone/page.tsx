import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostFigure } from "@/lib/PostParts";
import { Loop } from "@/lib/Loop";

export const dynamic = "force-static";
export const metadata = postMetadata("pinto-notes-for-iphone", { title: "Pinto Notes is on iPhone" });

export default function Page() {
  return (
    <PostPage
      slug="pinto-notes-for-iphone"
      intro={<>Pinto Notes for iPhone is out now on the App Store. Until now it was a Mac app. Today the same notes are on your phone, and it&apos;s free.</>}
      hero={<></>}
    >
      <h2>Your notes, a second after your AI writes them</h2>
      <p>
        Ask ChatGPT or Claude to add something, and it&apos;s in the note on your phone a second later. Ask for the shopping list
        from your laptop, and it&apos;s on your phone when you&apos;re in the shop.
      </p>
      <Loop src="/blog/loops/iphone-chatgpt-adds-groceries.mp4" poster="/blog/loops/iphone-chatgpt-adds-groceries.webp" width={640} height={1280} phone
        label="Pinto Notes on iPhone: five grocery items ChatGPT just added land in the list, tinted, with ChatGPT changed 5 lines and Undo."
        caption="Recorded on an iPhone: the five lines ChatGPT added, a second after it was asked." />
      <p>
        The lines it changed are tinted for a moment, with Undo next to them. Every version is kept, so nothing an AI does is
        final.
      </p>

      <h2>A notes app first</h2>
      <PostFigure src="/blog/launch/iphone-framed-files" width={760} height={1560} maxWidth={340} kind="plain"
        alt="A Trip documents note in Pinto Notes on iPhone in dark mode: a PDF, a CSV file, a photo and a link to a website."
        caption="Files, photos and links in a note, on your phone." />
      <p>It works the way you expect a notes app on iPhone to:</p>
      <ul>
        <li>Checklists that move ticked items to the bottom</li>
        <li>Tables you edit cell by cell</li>
        <li>Photos, PDFs and files in your notes and folders</li>
        <li>Keep writing offline. Changes sync when you&apos;re back.</li>
        <li>Lock a note with a password and Face ID</li>
      </ul>

      <h2>Connect your AI from your phone</h2>
      <PostFigure src="/blog/launch/iphone-framed-connect" width={760} height={1560} maxWidth={340} kind="plain"
        alt="Connect an AI in Pinto Notes on iPhone: ChatGPT and Claude connected, Codex and another AI below, and what's connected with when it was last used."
        caption="Connect an AI on iPhone, with what's connected and when it was last used." />
      <p>
        Tap your photo at the top right, then Connect an AI. ChatGPT connects right there. For Claude, Claude Code and Codex, the
        phone sends you the steps to finish on your computer. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT or
        Claude</a> has every step, and <a href="/blog/notes-in-claude-code-and-codex">Claude Code and Codex</a> take one command.
      </p>

      <h2>Already on the Mac?</h2>
      <p>
        Sign in on your iPhone with the same account and your notes are there. New to Pinto Notes? <a href="/blog/import-your-notes">Bring
        your notes</a> from Apple Notes or another app on the Mac, and they show up on your phone a moment later.
      </p>
    </PostPage>
  );
}
