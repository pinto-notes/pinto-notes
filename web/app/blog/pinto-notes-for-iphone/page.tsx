import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostFigure } from "@/lib/PostParts";
import { APP_STORE_URL } from "@/lib/site";

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
        Ask ChatGPT or Claude to add something, and it&apos;s in the note on your phone a second later. &ldquo;Add the paella
        things to my groceries&rdquo; from your laptop, and they&apos;re on the list when you&apos;re in the shop.
      </p>
      <p>
        The lines it changed are tinted for a moment, with Undo next to them. Every version is kept, so nothing an AI does is
        final.
      </p>

      <h2>A notes app first</h2>
      <PostFigure src="/blog/launch/iphone-lisbon-note" width={1600} height={1000} maxWidth={720}
        alt="A Lisbon trip note in Pinto Notes on iPhone with a checklist, places, a hotel booking file and a table of food, on painted trees."
        caption="Headings, checklists, files and tables, on your phone." />
      <p>It works the way you expect a notes app on iPhone to:</p>
      <ul>
        <li>Checklists that move ticked items to the bottom</li>
        <li>Tables you edit cell by cell</li>
        <li>Photos, PDFs and files in your notes and folders</li>
        <li>Keep writing offline. Changes sync when you&apos;re back.</li>
        <li>Lock a note with a password and Face ID</li>
      </ul>

      <h2>Connect your AI from your phone</h2>
      <PostFigure src="/blog/launch/iphone-connect-framed" width={1600} height={1000} maxWidth={720}
        alt="Connect an AI in Pinto Notes on iPhone: ChatGPT and Claude connected, Codex and another AI below, on a painted dusk."
        caption="Connect an AI on iPhone, with what's connected and when it was last used." />
      <p>
        Tap your photo at the top right, then Connect an AI. ChatGPT connects right there. For Claude, Claude Code and Codex, the
        phone sends you the steps to finish on your computer. <a href="/blog/connect-chatgpt-to-your-notes">Connecting ChatGPT or
        Claude</a> has every step, and <a href="/blog/notes-in-claude-code-and-codex">Claude Code and Codex</a> take one command.
      </p>

      <h2>Get it</h2>
      <p>
        Pinto Notes is free on the <a href={APP_STORE_URL} rel="noopener">App Store</a> for iPhone. Already use it on
        your Mac? Sign in with the same account and your notes are there. New to it? <a href="/blog/import-your-notes">Bring your
        notes</a> from Apple Notes or another app on the Mac, from the <a href="/download">download page</a>, and they show up on
        your phone a moment later.
      </p>
    </PostPage>
  );
}
