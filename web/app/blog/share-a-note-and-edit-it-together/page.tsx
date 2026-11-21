import { PostPage, postMetadata } from "@/lib/PostPage";
import { PostFigure } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("share-a-note-and-edit-it-together", { title: "Share a note in Pinto Notes and edit it together" });

// Launch post for 1.4 (iPhone live 17 Nov 2026, Mac 18 Nov, from the Mac App Store and the site's download). Facts checked
// on origin/main 6d83cf9ab, the code that shipped: Share menu, then Collaborate…, then Invite People… on iPhone
// (Pane/Views/NoteDetailView.swift shareItems; Pane/Collab/ShareSheet.swift); Join by Link Can edit, Can view, Off and
// the lines under it (ShareController.swift ShareCopy); a person's Access picker and Remove from Note, swipe to Remove,
// Leave Note, the Remove and Leave questions (ShareSheet.swift, ShareController.swift); what can't be shared
// (SharedNoteLimits.swift); the privacy line (ShareCopy.privacy); carets with a name flag (CollabSession);
// AI in a shared note credited to the person's AI (supabase/functions/mcp/shared_notes.ts); offline edits merge and
// "you were removed" said (web/content/changelog.json 1.4); the link in a browser (web/app/s/[id]/NoteLink.tsx).
// Pictures: PaneTests/HIG/CollabShareSnapshots (iPhone sheet, Mac editor carets), rendered offscreen from 6d83cf9ab.

export default function Page() {
  return (
    <PostPage
      slug="share-a-note-and-edit-it-together"
      intro={<>Pinto Notes 1.4 lets you share a note with people and write in it together, on iPhone and Mac. You see their changes as they type, and the note stays encrypted.</>}
    >
      <h2>Invite people with a link</h2>
      <p>
        Open a note, tap Share at the top, then Collaborate, then Invite People. Pinto Notes makes a link, and you send it the way
        you like: Messages, Mail, WhatsApp, a text to your partner. Whoever opens it joins the note in Pinto Notes and can start writing.
      </p>
      <PostFigure src="/blog/launch/share-iphone-can-edit" width={1206} height={1820} maxWidth={360}
        alt="The Share sheet in Pinto Notes on iPhone: Emil as owner, Sara who can edit and Jonas who can view, an Invite People button, and Join by Link set to Can edit."
        caption="Share, then Collaborate, on iPhone. Everyone in the note, what they can do, and the link." />

      <h2>Edit, or only read</h2>
      <p>
        Further down, Join by Link decides what the link does. Can edit lets anyone with it join and write. Can view lets them join
        and read. Off means only the people already in the note can open it, and turning it back on makes a new link. Tap someone to
        change what they can do after they joined, and Pinto Notes says it plainly: &ldquo;Sara can view now.&rdquo;
      </p>

      <h2>Write at the same time</h2>
      <p>
        Each person&apos;s cursor shows in the note in their own colour, with their first name on a small flag while they type. Their
        words land as they write them, and yours land on their screen. There&apos;s nothing to save and no versions to merge. If you
        write on a train with no signal, your changes merge when you&apos;re back online.
      </p>
      <PostFigure src="/blog/launch/share-mac-carets" width={1280} height={560} maxWidth={640}
        alt="A Team offsite note in Pinto Notes with an agenda and a Bring checklist. Sara's cursor sits after Roadmap review with her name on a flag, and someone else has Printed customer quotes selected."
        caption="Sara is typing in the agenda while someone else selects a line, on the Mac." />

      <h2>Your AI can help too</h2>
      <p>
        If someone in the note has <a href="/blog/connect-chatgpt-to-your-notes">connected ChatGPT or Claude</a>, their AI can read the
        shared note and write in it when they ask. Its edits merge with what people are typing, and they&apos;re marked with whose AI
        made them, like &ldquo;Sara&apos;s Claude&rdquo;. Someone who can only view gets an AI that can only read.
      </p>

      <h2>Leave, or remove someone</h2>
      <p>
        To remove someone, swipe their name in Share and tap Remove. Pinto Notes asks first, and the link changes so the old one stops
        working. To leave a note someone shared with you, tap Leave Note. If you&apos;re removed, or the owner stops sharing, Pinto Notes
        tells you which.
      </p>

      <h2>Encrypted, like your other notes</h2>
      <p>
        A shared note is encrypted with a key of its own, and only the people in it can read it. Their AI reads it only when they ask.
        <a href="/privacy-security"> Privacy and security</a> has the details, including what we could and couldn&apos;t open.
      </p>

      <p>
        Sharing in Apple Notes instead, and it won&apos;t start? <a href="/blog/apple-notes-unable-to-start-collaboration">Apple Notes unable
        to start collaboration</a> has Apple&apos;s checks in order.
      </p>

      <h2>What can&apos;t be shared yet</h2>
      <p>
        A note with files, photos or an app in it can&apos;t be shared with people yet: send a copy instead. Once a note is shared, files
        can&apos;t be added to it, it can&apos;t be locked, and it can&apos;t also be a public web page. These come later.
      </p>

      <h2>Get 1.4</h2>
      <p>
        Pinto Notes 1.4 is out on iPhone and Mac, so update the app on both. New to Pinto Notes on iPhone?
        <a href="/blog/pinto-notes-for-iphone">Here&apos;s the iPhone app</a>. Someone who doesn&apos;t have Pinto Notes yet can still open your link: it tells them how to get
        the app and join.
      </p>
    </PostPage>
  );
}
