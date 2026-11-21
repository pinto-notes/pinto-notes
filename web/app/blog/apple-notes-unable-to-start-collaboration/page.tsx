import { PostCta } from "@/lib/PostCta";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, Paths, PostFigure, Steps } from "@/lib/PostParts";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-unable-to-start-collaboration", { title: "Apple Notes unable to start collaboration? 8 checks" });

// Written 21 November 2026 for "apple notes unable to start collaboration". Google autocomplete, en-US, 21 Nov: apple notes
// unable to start collaboration, iphone notes unable to start collaboration, ios notes unable to start collaboration, icloud
// notes unable to start collaboration, apple notes error unable to start collaboration, why does apple notes say unable to
// start collaboration, apple notes unable to collaborate, iphone notes unable to collaborate, iphone notes unable to share,
// apple notes not showing collaborate option, iphone notes not showing collaborate, apple notes cannot open shared note,
// why can't i open shared notes on my iphone, why can't i collaborate on notes.
// Apple pages read on 21 Nov 2026: Apple Support 102462 (If you can't collaborate in the Notes app, published 23 Sep 2026:
// the device checks, Share a Link or Send a Copy on iOS 27, Collaborate on iOS 18 to 26, pending requests, locked notes,
// Apple devices only on iOS 26 or earlier, 100 people); iPhone User Guide iOS 27, Share notes and collaborate (iphe4d04f674:
// participants signed in with Notes on in iCloud, "People you choose can edit", Edit or View and Download Only, Stop sharing
// deletes the note from others' devices) and Lock notes (iphf177bb154: Note Actions button, Remove; notes shared in iCloud
// can't be locked); Notes User Guide for Mac, macOS 27: Share notes and collaborate (apd4e6e2c9a6: upgraded iCloud notes,
// Share a Link, click the link then Open, the invitation address must be on your Apple Account, two-factor and iCloud
// Keychain for instant changes), Manage shared notes and folders (apd881ec5518), Upgraded iCloud notes (aside glosedbd72f8:
// the Upgrade button, can't add people until you upgrade), Why notes are hidden on some devices (apd5be85b5ce); Mac User
// Guide, Verify your email address or phone number to open a shared item (mchl267b6234); iCloud User Guide, Share notes
// (mmc0cd6c83: participants need an Apple Account) and Edit shared notes (mmf181271571: Accept Invitation, ask the owner to
// resend). From apple-notes-not-syncing's header: the macOS 27 Turn On iCloud prompt (the picture), the Mac Settings path,
// and the Mac message when a shared note's owner has full iCloud storage. Apple doesn't document the words "Unable to start
// collaboration", so the post doesn't say what causes that message. Pinto side: only the facts verified in
// share-a-note-and-edit-it-together (1.4). Pictures: drawn/shared-pause, apple/iphone-notes-remove-lock-menu,
// macos27/notes27-turn-on-icloud-prompt and launch/share-iphone-can-edit, each used as in the posts above.

const FAQ = [
  { q: "What does \"Unable to start collaboration\" mean in Apple Notes?", a: [
    "Apple doesn't explain that message. Its article on collaboration problems lists what to check: both people on the latest iOS, signed in to an Apple Account with Notes turned on for iCloud, the note in iCloud and not locked, and fewer than 100 people in it.",
  ] },
  { q: "Why is there no Collaborate option in Notes on iOS 27?", a: [
    "In iOS 27 it's called Share a Link. Tap the Share button, then the menu under the note title, and choose Share a Link. The Collaborate option is what iOS 18 to iOS 26 show in the same place.",
  ] },
  { q: "Can I collaborate on a note with someone who doesn't have an iPhone?", a: [
    "Apple says participants need an Apple Account to view and edit a shared note. On iOS 26 or earlier, collaboration only works with someone who has an Apple device signed in to an Apple Account. Otherwise, send a copy of the note by email or message.",
  ] },
  { q: "Why can't I open a note someone shared with me?", a: [
    "Most often the invitation went to an email address or phone number that isn't on your Apple Account. Add it to your account when Notes asks, or ask the owner to send the invitation again to the address your Apple Account uses.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-unable-to-start-collaboration"
      intro={<>You tap Share on a note and Notes says it&apos;s unable to start collaboration, or the Collaborate option isn&apos;t there at all. Here are Apple&apos;s checks, most likely first.</>}
      answer={
        <Answer jump={[
          { href: "#checks", label: "The checks in order" },
          { href: "#iphone", label: "Start on iPhone" },
          { href: "#mac", label: "Start on a Mac" },
          { href: "#cant-open", label: "Can't open a shared note" },
        ]}>
          <p>
            Collaboration in Apple Notes needs a note in iCloud that isn&apos;t locked, and everyone signed in to an Apple Account with
            Notes turned on for iCloud. Apple also asks both people to be on the latest iOS. On iOS 27 the option is called Share a
            Link, so if you&apos;re looking for Collaborate, that&apos;s the one.
          </p>
          <PostCta slug="apple-notes-unable-to-start-collaboration" position="answer" title="Want to share a note with one link?">
            <p>Pinto Notes looks and works like Apple Notes on iPhone and Mac. Send a link to a note, and the people you invite write in it with you, with their cursors showing as they type. Shared notes are encrypted.</p>
          </PostCta>
        </Answer>
      }
      hero={<PostFigure priority src="/blog/drawn/shared-pause" width={1200} height={750} maxWidth={560}
        alt="Two drawn notes icons, each with a person above it, joined by a dotted line with a pause sign in the middle."
        caption="A shared note needs the same few things on both sides before it starts." />}
      faq={FAQ}
    >
      <h2 id="checks">The checks, in order</h2>
      <p>
        Apple doesn&apos;t document the words &ldquo;Unable to start collaboration&rdquo;, so nobody can tell you from the message alone
        which check failed. These are the requirements Apple does list, in the order worth trying them.
      </p>
      <Steps>
        <li id="option-name">
          <strong>You&apos;re choosing the right option</strong>
          On iOS 27, tap the Share button, then the menu under the note title, and choose Share a Link. Send a Copy sends a copy nobody
          else can edit. On iOS 18 to iOS 26 the same menu says Collaborate or Send Copy.
        </li>
        <li id="in-icloud">
          <strong>The note is in iCloud</strong>
          Apple&apos;s steps start in the All iCloud folder, and its Mac guide says you must use upgraded iCloud notes to collaborate.
          A note under On My iPhone, On My Mac or a Gmail account isn&apos;t in iCloud. <a href="/blog/move-apple-notes-to-icloud">Move
          it into an iCloud folder</a> first.
        </li>
        <li id="locked">
          <strong>The note isn&apos;t locked</strong>
          You can&apos;t collaborate on a locked note, or on a folder that has a locked note in it. Open the note and unlock it, then
          tap the Note Actions button and tap Remove.
        </li>
        <li id="icloud-on">
          <strong>You&apos;re signed in, with Notes on for iCloud</strong>
          Open Settings, tap your name, then iCloud. Under Saved to iCloud, tap Notes and check that Sync this iPhone is on. Apple says
          the people you invite need this too.
        </li>
        <li id="update">
          <strong>Both of you are on the latest iOS</strong>
          Apple asks for the latest version of iOS on your iPhone and on the other person&apos;s. The Collaborate steps for iOS 26 and
          earlier need iOS 18 or later.
        </li>
        <li id="other-person">
          <strong>The other person has an Apple Account</strong>
          Participants need an Apple Account to view and edit a shared note. On iOS 26 or earlier, Apple says you can only collaborate
          with someone who has an Apple device signed in to an Apple Account. If they don&apos;t, send a copy instead.
        </li>
        <li id="pending">
          <strong>Your request isn&apos;t still waiting</strong>
          If you asked for access to someone&apos;s note on iOS 27, the request may be pending. The owner sees it under the Collaborate
          button, and Apple says the request also sends an email to the owner&apos;s Apple Account address.
        </li>
        <li id="limit">
          <strong>The note has room</strong>
          Up to 100 people can collaborate on a note.
        </li>
      </Steps>
      <PostFigure src="/blog/apple/iphone-notes-remove-lock-menu" width={760} height={910} maxWidth={300}
        alt="The More menu of an unlocked note in Notes on iPhone, with Remove highlighted at the top next to Scan and Pin Note."
        caption="Remove takes the lock off an unlocked note, so it can be shared. Image: Apple." />
      <p>
        Apple&apos;s iPhone guide also says notes shared in iCloud can&apos;t be locked, so you can&apos;t lock it again while it&apos;s
        shared.
      </p>

      <h2 id="iphone">Start collaborating on iPhone</h2>
      <p className="label" id="iphone-ios-27"><strong>iOS 27</strong></p>
      <Steps>
        <li>In Notes, go to the All iCloud folder and open the note.</li>
        <li>Tap the Share button at the top of the screen.</li>
        <li>Under the note title, choose Share a Link.</li>
        <li>To change who can join, tap &ldquo;People you choose can edit&rdquo;. Pick People you choose or Anyone with the link, and Edit or View and Download Only.</li>
        <li>Choose how to send the invitation. The first person joins automatically. To add more, tap the Collaborate button, then Manage Shared Note, then Add Participant.</li>
      </Steps>
      <p className="label" id="iphone-ios-26"><strong>iOS 18 to iOS 26</strong></p>
      <Steps>
        <li>In Notes, go to the All iCloud folder and open the note.</li>
        <li>Tap the Share button, then choose Collaborate under the note title.</li>
        <li>Tap &ldquo;Only invited people can edit&rdquo; to set who can access it, what they can do, and whether they can invite others.</li>
        <li>Send the invitation with Messages or Mail.</li>
      </Steps>
      <p>
        The steps are from Apple&apos;s <a href="https://support.apple.com/en-us/102462" rel="noopener">If you can&apos;t collaborate in
        the Notes app</a> and the iPhone guide&apos;s <a href="https://support.apple.com/guide/iphone/iphe4d04f674/ios" rel="noopener">Share
        notes and collaborate</a>.
      </p>

      <h2 id="mac">Start collaborating on a Mac</h2>
      <Steps>
        <li>Open the note, then click the Share button in the toolbar.</li>
        <li>Click the pop-up menu and choose Share a Link.</li>
        <li>Click &ldquo;People you choose can edit&rdquo; to set who can access it, and Can edit or Can view and download.</li>
        <li>Send the link the way you like. To share a whole folder, Control-click it and choose Share Folder.</li>
      </Steps>
      <p>
        If there&apos;s an Upgrade button next to iCloud in the Notes sidebar, your iCloud notes haven&apos;t been upgraded, and Apple
        says you can&apos;t add people to notes until you upgrade. Upgraded notes can&apos;t be opened on devices older than OS X 10.11 or
        iOS 9.
      </p>
      <PostFigure src="/blog/macos27/notes27-turn-on-icloud-prompt" width={1336} height={1080} maxWidth={560}
        alt="Apple Notes on macOS 27 without iCloud: Turn On iCloud. To access your notes from all your devices, turn on iCloud for Notes. System Settings and Cancel."
        caption="What Notes shows on a Mac where iCloud is off for Notes. Turn it on before you share." />
      <Paths rows={[
        { on: "Mac, macOS 15 or later", steps: ["System Settings", "Your name", "iCloud", "Notes"] },
      ]} />

      <h2 id="cant-open">When you can&apos;t open a note shared with you</h2>
      <ul>
        <li><strong>Open it from the link.</strong> On a Mac, click the link you received, then click Open. On icloud.com/notes, select the link, then Accept Invitation. After the first time, the note stays in your notes list on every iPhone and Mac signed in to the same Apple Account.</li>
        <li><strong>Check the address it was sent to.</strong> You can only open a shared note if the email address or phone number the invitation went to is on your Apple Account. Notes asks you to add it, and on a Mac, System Settings sends a verification link to it first. Or ask the owner to send the invitation again to the address you use.</li>
        <li><strong>Update the device.</strong> A note with a tag, a mention or a link that shows another note&apos;s title can only be viewed on iOS 14.5, macOS 11.3 or later. On older devices it&apos;s hidden, for you and everyone it&apos;s shared with.</li>
        <li><strong>Ask the owner.</strong> When the owner stops sharing, Apple says the note is deleted from the other people&apos;s devices.</li>
      </ul>

      <h2 id="not-updating">When it opens but won&apos;t update</h2>
      <p>
        Apple&apos;s Mac guide says people who have two-factor authentication and iCloud Keychain turned on see others&apos; changes
        immediately. A shared note is stored in its owner&apos;s iCloud, so when the owner&apos;s storage is full, Notes on a Mac says your
        edits are saved on your device and will upload once the owner makes space. <a href="/blog/apple-notes-not-syncing">Apple Notes not syncing</a> has the rest of the
        sync checks.
      </p>

      <h2 id="pinto-notes">Sharing a note in Pinto Notes</h2>
      <PostFigure src="/blog/launch/share-iphone-can-edit" width={1206} height={1820} maxWidth={360}
        alt="The Share sheet in Pinto Notes on iPhone: Emil as owner, Sara who can edit and Jonas who can view, an Invite People button, and Join by Link set to Can edit."
        caption="Share, then Collaborate, in Pinto Notes on iPhone." />
      <p>
        Pinto Notes, a notes app that looks and works like Apple Notes on iPhone and Mac, shares a note with a link. On iPhone, tap Share,
        then Collaborate, then Invite People, and send the link any way you like. Join by Link sets whether the link lets people edit or only
        view, and Off means only the people already in the note can open it. Everyone&apos;s cursor shows in the note with their name as they type, and the note is encrypted with a key
        of its own. If someone in the note has <a href="/blog/connect-chatgpt-to-your-notes">connected ChatGPT or Claude</a>, their AI
        can write in it too, marked with whose AI it was.
      </p>
      <p>
        It has limits of its own. Everyone writes in it from Pinto Notes on iPhone or Mac; someone without the app who opens the link is
        told how to get it and join. A note with files, photos or an app in it can&apos;t be shared yet, and a shared note can&apos;t be locked.
        <a href="/blog/share-a-note-and-edit-it-together"> Share a note and edit it together</a> has the details. Your Apple Notes come
        over in one import on your Mac (<a href="/blog/move-from-apple-notes">moving from Apple Notes</a>), and Apple Notes isn&apos;t
        changed.
      </p>
    </PostPage>
  );
}
