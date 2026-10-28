import { PostPage, postMetadata } from "@/lib/PostPage";
import { Figure } from "@/lib/blog";
import { SHOTS } from "@/lib/posts";
import { Answer, PostFigure } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";
import { PRIVACY_PATH, READABLE } from "@/lib/privacy";

export const dynamic = "force-static";
export const metadata = postMetadata("encrypted-notes-app-for-ai", { title: "An encrypted notes app your AI can use" });

const FAQ = [
  { q: "Is Pinto Notes end-to-end encrypted?", a: [
    "With Advanced protection on, yes: we can't open your notes and can't help you back in. By default, no. Your notes are encrypted on your devices before they sync, and we keep a locked copy of your key so that signing in opens your notes on a new device. That means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account.",
  ] },
  { q: "If the notes are encrypted, how can ChatGPT read them?", a: [
    "When you approve an AI on your Mac, that connection gets a copy of your notes' key, locked with a key derived from that connection's own access token. We store only a hash of the token, so the copy can't be opened at rest; the AI sends the token with each request, and during that request our server unlocks the key in memory, reads the notes the AI asks for, and forgets the key when the request ends. Disconnecting deletes that copy.",
  ] },
  { q: "Can an AI read my locked notes?", a: [
    "No. Locked notes are encrypted a second time with a key made from your notes password, which never leaves your devices. An AI sees only their titles.",
  ] },
  { q: "What can Pinto Notes still see?", a: [
    "Without opening anything, account details and structure: your email address, the size and dates of notes, which folder each note is in, which notes are pinned or locked, your devices and your AI connections. The Privacy & Security page lists everything. By default we also keep a locked copy of your key, so we could open your notes if we had to. With Advanced protection on, we can't.",
  ] },
  { q: "Can I change my encryption key?", a: [
    "Not yet. Your notes' key stays the same for the life of your account. Disconnecting an AI deletes its copy of the key, but key rotation isn't built yet.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="encrypted-notes-app-for-ai"
      intro={<>Pinto Notes encrypts every note on your iPhone or Mac before it syncs, and ChatGPT and Claude can still read and edit them once you approve. Those two things pull against each other, so here&apos;s exactly how it works, what it doesn&apos;t protect, and how other notes apps handle the same trade-off.</>}
      answer={
        <Answer jump={[
          { href: "#encrypted", label: "What's encrypted" },
          { href: "#ai", label: "How an AI reads them" },
          { href: "#limits", label: "The limits" },
          { href: "#others", label: "Other apps" },
        ]}>
          <p>
            Every note is encrypted on your iPhone or Mac before it syncs. By default we keep a locked copy of your key, so signing in opens your notes on a new device; with Advanced protection on, only your devices hold it. When you approve ChatGPT or
            Claude, that connection gets its own locked copy of the key, which our server opens in memory only during the AI&apos;s
            requests. Locked notes stay out of reach of every AI. Disconnecting deletes the AI&apos;s copy at once.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="encrypted">What&apos;s encrypted</h2>
      <p>
        Your notes, their titles, folder names, file names and files, and every earlier version are encrypted on your device before
        they&apos;re uploaded. The key is made on your first device. We store the encrypted copies, in Frankfurt.
      </p>
      <p>
        Who holds the key is your choice. By default we keep a locked copy of it so that signing in opens your notes on a new
        device, with no other device and no recovery key. That means we could open your notes if we had to, for example under a
        court order, and so could someone who gets into your account. The copy is sealed with a secret that isn&apos;t in the
        database, so the sealed copy can&apos;t be opened with the database alone, but we hold both.
      </p>
      <p>
        Turn on Advanced protection, in Settings, Security, and we delete our copy. With Advanced protection on, your notes are
        end-to-end encrypted: we can&apos;t open them and can&apos;t help you back in. A new device gets your key from iCloud
        Keychain, is added from a device that has your notes, or is opened with your recovery key. If you lose every device and the
        recovery key, your notes are lost. It&apos;s the same split as Apple&apos;s standard protection and Advanced Data
        Protection. If your account is from before we kept copies, the app asks you once, and nothing is copied until you answer.
      </p>
      <PostFigure src="/blog/amber-notes-locked-notes-password" width={880} height={600} maxWidth={440}
        alt="Pinto Notes asking you to create a password for locked notes, saying a locked note can't be read by Pinto Notes or a connected AI."
        caption="Locked notes get a second key, made from a password that stays on your devices." />
      <ul>
        <li><strong>Your recovery key</strong> opens your notes without us. You save it yourself, from Settings, Security. We keep your notes&apos; key locked with it.</li>
        <li><strong>Locked notes</strong> are encrypted a second time, with a key made from your notes password. That key never leaves your devices.</li>
        <li><strong>Signing in</strong>, with Apple, Google or a password, says who you are. By default it is also what lets a new device get your key, with no wait after a password reset. Each time it happens, every device of yours shows &ldquo;A new device opened your notes&rdquo; and we email you.</li>
      </ul>

      <h2 id="ai">How an AI reads encrypted notes</h2>
      <Figure shot={SHOTS.consentE2ee} caption="What you see when you approve an AI: read and edit or read only, and a reminder that locked notes stay closed to it." />
      <p>
        ChatGPT and Claude run in the cloud, so something has to open your notes for them. Here&apos;s how it goes:
      </p>
      <ol>
        <li>You start connecting from ChatGPT or Claude. A page on pintonotes.com asks you to sign in and shows a two-digit number.</li>
        <li>Pinto Notes on your Mac asks whether to allow it. You type the number, choose Read Only or Read and Edit, and confirm with Touch ID or your Mac password.</li>
        <li>That connection gets a copy of your notes&apos; key, locked with a key derived from its own access token. We keep only a hash of the token, so the copy stays locked at rest.</li>
        <li>The AI sends its token with each request. During that request, our server uses it to unlock the key in memory, reads the notes it asks for, encrypts any change it makes, and forgets the key when the request ends.</li>
        <li>Disconnect it in Settings, Connect an AI, and its copy of the key is deleted at once.</li>
      </ol>
      <p>
        So the honest version is: by default we could open your notes if we had to, and with Advanced protection on we can&apos;t open
        them at rest. In both cases, while an AI you approved is connected, our server opens the notes it asks for, in memory, to
        answer it. Locked notes stay out of reach even then; an AI sees only their titles. The consent
        sheet says so before you allow anything.
      </p>

      <h2 id="limits">The limits</h2>
      <PostFigure src="/blog/amber-notes-connect-an-ai" width={1040} height={720} maxWidth={520}
        alt="Connect an AI in Pinto Notes' settings on a Mac: ChatGPT, Claude, Claude Code and Codex, with what's connected below."
        caption="Disconnecting an AI here ends its access at once." />
      <ul>
        <li><strong>Our copy of your key.</strong> Unless Advanced protection is on, we hold a copy of it, sealed with a secret kept outside the database. We hold both, so we could open your notes, and so could someone who took over our hosting account. The sealed copy can&apos;t be opened with a copy of the database alone. A recent copy of the database also holds sign-in sessions, though, and a session from a sign-in in the last hour can get your key as a device of yours would.</li>
        <li><strong>Signing in.</strong> Unless Advanced protection is on, anyone who can sign in as you can open your notes, also right after resetting your password from your mailbox. The notice on your devices and the email tell you it happened. They don&apos;t stop it.</li>
        <li><strong>AI requests.</strong> While an AI works, our server handles the text it asks for, and our hosts (Vercel and Supabase) carry that text on its way. Neither stores it, but a changed server could copy it. Disconnecting ends this at once.</li>
        <li><strong>The recovery key in the browser.</strong> Approving on pintonotes.com with your recovery key runs our code in your browser. It never stores or sends the key, but a changed page could read it. Approve from your iPhone or Mac when you can.</li>
        <li><strong>No key rotation yet.</strong> Your notes&apos; key stays the same for the life of your account.</li>
        <li><strong>The database.</strong> Someone with only an old copy of it can&apos;t read your notes. A recent copy holds sign-in sessions, and one from a sign-in in the last hour can get your key where we keep a copy. Someone running it could roll a note back to an earlier encrypted version, or hide notes from your devices. Where we keep a copy of your key, they could also sign in as you and get it.</li>
        <li><strong>Shared notes.</strong> A note you share as a web page is published as a readable copy while it&apos;s shared.</li>
      </ul>
      <p>Some details also stay readable to us, including:</p>
      <ul>
        {READABLE.slice(0, 8).map((r) => <li key={r}>{r}</li>)}
      </ul>
      <p>
        The full list, every log and how long each is kept are on <a href={PRIVACY_PATH}>Privacy &amp; Security</a>, and the code is
        open source.
      </p>

      <h2 id="others">How other notes apps handle it</h2>
      <p>
        End-to-end encryption and a cloud AI want opposite things: the first keeps the server blind, and the second needs someone to
        read the text. Every app picks a side, or finds a way round it on your own computer.
      </p>
      <div className="tableWrap">
        <table>
          <thead>
            <tr><th scope="col">App</th><th scope="col">End-to-end encrypted</th><th scope="col">Can a cloud AI reach it?</th><th scope="col">How</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">Pinto Notes</th><td>With Advanced protection turned on; by default we keep a locked copy of your key</td><td>Yes, from any device</td><td>Built-in MCP server; our server opens the notes an approved AI asks for, during its requests</td></tr>
            <tr><th scope="row">Apple Notes</th><td>With <a href="https://support.apple.com/en-us/102651" rel="noopener">Advanced Data Protection</a> turned on; locked notes always</td><td>No</td><td>No API; Claude&apos;s desktop extension and community servers work on your Mac only</td></tr>
            <tr><th scope="row">Standard Notes</th><td>Yes, <a href="https://standardnotes.com/help/3/how-does-standard-notes-secure-my-notes" rel="noopener">keys from your password</a></td><td>No official way</td><td>A <a href="https://github.com/lozit/mcp-standardnotes" rel="noopener">community MCP server</a> decrypts on your own computer, for Claude Desktop</td></tr>
            <tr><th scope="row">Notesnook</th><td>Yes</td><td>No official way</td><td>No official MCP server; third-party ones exist, so check how they get your key</td></tr>
            <tr><th scope="row">Obsidian</th><td>Files are local; <a href="https://obsidian.md/help/sync/security" rel="noopener">Obsidian Sync</a> is end to end</td><td>No official way</td><td>Community plugins and servers on your computer</td></tr>
            <tr><th scope="row">Notion</th><td>No; <a href="https://www.notion.com/help/security-and-privacy" rel="noopener">encrypted at rest</a>, readable to Notion</td><td>Yes</td><td>Official hosted MCP server</td></tr>
          </tbody>
        </table>
      </div>
      <PostFigure src="/blog/drawn/enc-split" width={1200} height={750} maxWidth={560}
        alt="A locked note on one side and the ChatGPT and Claude logos on the other, divided by a line with a closed eye."
        caption="Encryption keeps a server blind; a cloud AI needs something to read the text." />
      <p>
        If you never want a server to see your text, a local setup is the stricter choice: Standard Notes with a local MCP server, or
        Obsidian with a plugin, works while that computer is on. If you want ChatGPT on your phone to add to a list while you&apos;re out,
        something in the cloud has to read it, and the question becomes who, when, and whether you can see and end it. Pinto Notes&apos;
        answer is: only for an AI you approved on your own device, only during its requests, and never for locked notes.
      </p>
      <p>
        <a href="/blog/notes-apps-with-mcp">Notes apps with an MCP server, compared</a> covers the AI side in more depth, and <a href="/blog/apple-notes-api">Apple
        Notes has no API</a> covers the Mac-only route for Apple Notes.
      </p>

      <h2>Try it</h2>
      <PostFigure src="/blog/pinto/import-from-apple-notes-sheet" width={1090} height={1260} maxWidth={420}
        alt="Pinto Notes' Import from Apple Notes sheet on a Mac, with notes listed by folder, all selected, and an Import button."
        caption="Import from Apple Notes copies the notes you pick and leaves Apple Notes as it was." />
      <p>
        Pinto Notes is free and open source. The Mac app is on the <a href="/download">download page</a>, and the iPhone app is{" "}
        {APP_STORE_LIVE ? "on the App Store" : "in App Store review"}. Import your Apple Notes on the Mac, then <a href="/blog/connect-chatgpt-to-your-notes">connect
        ChatGPT or Claude</a>. You can pick Read Only first and see what it does.
      </p>
    </PostPage>
  );
}
