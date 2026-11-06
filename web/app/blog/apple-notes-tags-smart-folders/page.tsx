import { SHOTS } from "@/lib/posts";
import { Figure } from "@/lib/blog";
import { PostPage, postMetadata } from "@/lib/PostPage";
import { Answer, PostFigure } from "@/lib/PostParts";
import { APP_STORE_LIVE } from "@/lib/site";

export const dynamic = "force-static";
export const metadata = postMetadata("apple-notes-tags-smart-folders", { title: "Apple Notes tags and Smart Folders not working? Fixes" });

// 14 Oct: tags and Smart Folders tested in a macOS 27 VM with On My Mac only: tags work there (captures/mac/tags).
// Checked on 4 October 2026 against Apple Support 102288 (tags and Smart Folders on iPhone, published
// 22 May 2026) and the Notes User Guide for Mac (Use tags, Use Smart Folders; macOS 27 back to 15). The
// Mac app's own messages (tags need iCloud, IMAP and Exchange refuse them, tagged notes can't be locked,
// the Convert to Smart Folder limits, deleting a tag deletes Smart Folders that use only it, unsupported
// Smart Folders) were read from Notes' Localizable.loctable on macOS 26.5. The rule menu and its options
// come from SmartFolderFilterRow.nib, SmartFolderTagFilterView.nib and SmartFolderDateFilterView.nib, and
// the Shortcuts actions from Notes' App Intents metadata, all on macOS 26.5.

const FAQ = [
  { q: "Why won't my hashtag turn into a tag in Apple Notes?", a: [
    "Check four things. The tag has to be one word: letters, numbers, hyphens and underscores, with no spaces. The note has to be in iCloud or On My Mac, not in Gmail, another IMAP account or Exchange. The note can't be locked. And on iPhone, Auto Convert to Tag has to be on in Settings, Apps, Notes.",
  ] },
  { q: "Can I put a note in a Smart Folder?", a: [
    "No. A Smart Folder only shows notes that match its rules, and the notes stay in their own folders. To get a note into a Smart Folder that filters by a tag, add that tag to the note.",
  ] },
  { q: "Should I use tags or folders in Apple Notes?", a: [
    "Use both. Apple's own tip in Notes says folders suit broad areas like work or personal projects, and tags suit specific topics like #Hiring or #Taxes. One exception: a note with a tag can't be locked, so keep locked notes organized by folder.",
  ] },
  { q: "Why did a Smart Folder disappear when I deleted a tag?", a: [
    "When a Smart Folder filters on that tag alone, deleting the tag deletes the Smart Folder too. Notes names the Smart Folders it will delete before you confirm. The notes themselves stay where they are.",
  ] },
];

export default function Page() {
  return (
    <PostPage
      slug="apple-notes-tags-smart-folders"
      intro={<>
        Tags in Apple Notes look simple, a word after a #, until one refuses to turn yellow. Here&apos;s how tags and Smart Folders work on
        iPhone and Mac, the four reasons a tag won&apos;t form, and when tags are worth it over plain folders.
      </>}
      answer={
        <Answer jump={[
          { href: "#tags", label: "How tags work" },
          { href: "#smart-folders", label: "Smart Folders" },
          { href: "#not-working", label: "When tags don't work" },
        ]}>
          <p>
            A tag is a word after a # anywhere in a note, like #taxes. A Smart Folder is a saved filter that lists notes from every folder
            matching its rules, such as a tag or an edit date. When a tag won&apos;t form, it&apos;s almost always a space in the tag, a
            note in Gmail or another mail account, a locked note, or Auto Convert to Tag turned off on iPhone.
          </p>
        </Answer>
      }
      faq={FAQ}
    >
      <h2 id="tags">How tags work</h2>
      <PostFigure src="/blog/macos27/notes27-tag-on-my-mac" width={2000} height={900} maxWidth={700}
        alt="Apple Notes on macOS 27 with a note reading Receipts #taxes 2026. The tag #taxes is orange, and the sidebar shows Tags with All Tags, #taxes and #weekend."
        caption="Type #taxes and a space: the word turns orange and the tag appears in the sidebar. This note is in On My Mac, not iCloud." />
      <p>
        Type # and a word in any note, then a space or Return. The word changes color once it&apos;s a tag. Since iOS 15 a tag can go
        anywhere, the title included. It has to be one continuous word, but hyphens, numbers and underscores are fine, so #gardening-supplies
        and #q4_budget both work. A note can carry as many tags as you like.
      </p>
      <p>
        Every tag you use appears in the Tags browser: below your folders on iPhone, and at the bottom of the sidebar on a Mac. Tap a tag
        to see every note that has it, across all your folders. On iPhone, pick two or more to show notes with all of them or with any of
        them.
      </p>
      <p>
        To tag several notes at once on iPhone, open a folder, tap the More button, then Select Notes. Select the notes, tap Tags at the
        bottom of the screen and choose the tags. On a Mac, drag a note onto a tag in the Tags browser. To rename or delete a tag, touch
        and hold it on iPhone, or Control-click it on a Mac, and choose Rename Tag or Delete Tag. A rename changes the tag in every note and
        Smart Folder that uses it.
      </p>

      <PostFigure src="/blog/apple/iphone-notes-tag-browser-gardening" width={640} height={1324} maxWidth={280}
        alt="The #Gardening tag open in Notes on iPhone, showing its two notes, Landscaping and DIY Wall Garden, with other tags in a row above."
        caption="A tag on iPhone: every note that has it, from any folder. Image: Apple." />

      <h2 id="smart-folders">How Smart Folders work</h2>
      <PostFigure src="/blog/macos27/notes27-smart-folder-checklists-unchecked" width={1400} height={700} maxWidth={700}
        alt="The New Smart Folder dialog in Apple Notes on macOS 27, named Open to-dos, with one rule: Checklists, Unchecked."
        caption="A Smart Folder for every note with an unticked item: Checklists, Unchecked. Tested on macOS 27, On My Mac." />
      <p>
        A Smart Folder shows notes that match rules you set. The notes stay in their own folders, so deleting a Smart Folder deletes no
        notes.
      </p>
      <ul>
        <li>
          <strong>On iPhone.</strong> Tap the New Folder button, type a name, tap Make Into Smart Folder, choose the filters and tap the
          Checkmark button twice. You can also start from a tag: tap it in the Tags browser, tap the More button, then Create Smart Folder.
        </li>
        <li>
          <strong>On a Mac.</strong> Choose File, New Smart Folder. Set the first rule with its pop-up menus, add more rules with the plus
          button, and choose whether a note must match all of the rules or any of them.
        </li>
      </ul>
      <PostFigure src="/blog/apple/iphone-notes-smart-folder-filters" width={640} height={1324} maxWidth={280}
        alt="The Filters screen for a new Smart Folder on iPhone: include notes matching all filters, Tags set to Any Selected Tag with #Home and #Projects chosen, plus Pinned Notes, Mentions, Shared, Created and Edited."
        caption="A Smart Folder's filters on iPhone. Image: Apple." />
      <p>
        On macOS 26 a rule can filter by Tags, Date Created, Date Edited, Shared, Mentions, Checklists, Attachments, Folders, Quick Notes,
        Pinned Notes or Locked Notes. A Tags rule offers Any Tag, All Selected, Any Selected and Untagged Notes Only, and the last one is a
        quick way to find everything you never tagged. A date rule can be Today, Yesterday, a number of days, weeks, months or years back,
        or a specific range. Checklists can be Checked, Unchecked or No Checklists, which makes a Smart Folder of every list with unticked
        items easy to build.
      </p>
      <p>
        A Smart Folder can&apos;t be locked, shared or put inside another folder, though it can list shared notes.
      </p>

      <h2>Tags or folders?</h2>
      <PostFigure src="/blog/apple/iphone-notes-ios27-folders-list" width={640} height={1320} maxWidth={280}
        alt="The Folders list in Notes on iPhone with iOS 27: Quick Notes and Shared, iCloud folders such as Notes, Gift Ideas and Grocery List, and a Tags section below."
        caption="Folders above and tags below, in one list. Image: Apple." />
      <p>
        A note sits in one folder and can carry many tags. Apple&apos;s own tip in Notes says folders suit broad areas, like work or personal
        projects, and tags suit specific topics, like #Hiring or #Taxes. That holds up. A note about a client meeting goes in Work and gets
        #acme, and a Smart Folder for #acme then pulls in that client&apos;s notes from Work, Personal and anywhere else.
      </p>
      <p>
        There&apos;s one real cost. Notes won&apos;t lock a note that has a tag, and won&apos;t add a tag to a locked note. If you lock notes,
        organize those by folder. <a href="/blog/forgot-apple-notes-password">What to do if you forgot your Apple Notes password</a> covers
        how the lock itself works.
      </p>

      <h2 id="not-working">When tags don&apos;t work</h2>
      <h3>The # stays plain text</h3>
      <p>
        On iPhone, open Settings, tap Apps, then Notes, and check that Auto Convert to Tag is on. Then check the tag itself: a space ends it,
        so #tax return gives you the tag #tax and the plain word &quot;return&quot;. Write #tax-return instead.
      </p>
      <h3>The note won&apos;t take a tag at all</h3>
      <p>
        Tags don&apos;t work in Gmail, another IMAP account or Exchange, and on a Mac Notes says so when you try. They do work in iCloud
        and, in my test on macOS 27, in On My Mac. Move the note into one of those first, which <a href="/blog/move-apple-notes-to-icloud">how to move
        Apple Notes to iCloud</a> walks through. A locked note refuses tags too, until you remove the lock.
      </p>
      <h3>Tags show up as plain text on another device</h3>
      <p>
        Tags show as tags on devices with iOS 14 or macOS Big Sur and later. On anything older, Apple says a tag may show as plain text. The
        same goes for people you share a tagged note with.
      </p>
      <h3>A tag vanished from the Tags browser</h3>
      <p>
        The browser only lists tags that some note still uses. Once the last note with a tag loses it, the tag disappears. Type it again in
        any note and it comes back.
      </p>
      <h3>A Smart Folder is empty, or shows the wrong notes</h3>
      <PostFigure src="/blog/apple/iphone-notes-edit-smart-folder" width={640} height={1324} maxWidth={280}
        alt="Notes on iPhone with a Smart Folder called New home ideas held down, showing a preview of its notes and a menu with Delete and Edit Smart Folder."
        caption="Touch and hold a Smart Folder, then Edit Smart Folder, to check its rules. Image: Apple." />
      <p>
        Open it with Edit Smart Folder (touch and hold it on iPhone, Control-click it on a Mac) and check whether it needs all of the rules
        or any of them. With all, every extra rule narrows the list. Also check the Tags rule: All Selected needs every chosen tag on the
        same note, and Any Selected needs one.
      </p>
      <h3>You can&apos;t move a note into a Smart Folder</h3>
      <p>
        That&apos;s by design. A Smart Folder holds no notes of its own, so Notes won&apos;t move a note into it: it only lists notes that match
        its rules. Add the tag the Smart Folder filters on and the note appears.
      </p>
      <h3>Convert to Smart Folder is refused</h3>
      <p>
        Notes can turn an ordinary folder into a Smart Folder. It won&apos;t if the folder is shared, holds a locked or shared note, or has
        subfolders. Read the warning before you convert: Notes moves every note in the folder into the Notes folder and tags each one with
        the folder&apos;s name, and that can&apos;t be undone.
      </p>
      <h3>Deleting a tag deleted a Smart Folder</h3>
      <PostFigure src="/blog/apple/iphone-notes-rename-delete-tag" width={640} height={1324} maxWidth={280}
        alt="The Tags section in Notes on iPhone with #Shopping held down and a menu offering Rename Tag and Delete Tag."
        caption="Touch and hold a tag to rename or delete it. Image: Apple." />
      <p>
        If a Smart Folder filters on that tag alone, deleting the tag deletes the Smart Folder too. Notes lists them in the confirmation
        before it does, so read it. The notes stay put.
      </p>
      <h3>&quot;This Smart Folder uses unsupported features&quot;</h3>
      <p>
        A Smart Folder made on a newer version of Notes can use filters an older Mac doesn&apos;t know. Notes shows this message and asks
        you to update macOS to view or edit it.
      </p>

      <h2>Tag notes with Shortcuts</h2>
      <PostFigure src="/blog/macos27/notes27-api-shortcut-append" width={2048} height={980} maxWidth={640}
        alt="Shortcuts on macOS 27 with its actions filtered to Notes."
        caption="The Notes actions in Shortcuts on macOS 27." />
      <p>
        On macOS 26 the Shortcuts app has Notes actions named Add Tags to Notes, Remove Tags from Notes, Create Tag, Delete Tags and Open
        Tag. They&apos;re useful for tagging a batch of notes at once. Tags live in the notes themselves, so keep a copy of those too:
        <a href="/blog/export-apple-notes-to-markdown"> how to export Apple Notes to Markdown</a> covers one note or all of them.
      </p>

      <h2>If you want an assistant to do the sorting</h2>
      <Figure shot={SHOTS.connectList} caption="Connect ChatGPT or Claude in Pinto Notes, then ask it to sort your notes." />
      <p>
        Pinto Notes, the notes app for iPhone and Mac that I make, has no tags or Smart Folders. It has folders, sub-folders, pins and
        search across every word, and you can connect ChatGPT or Claude to it after approving them on your device. Then the job a Smart Folder does,
        like &quot;find every note about the kitchen renovation&quot;, becomes a request: the assistant searches your notes and lists them,
        or moves them into one folder. {APP_STORE_LIVE ? null : <>The Mac app is out now, and the iPhone app is coming soon to the App
        Store. </>}<a href="/blog/move-from-apple-notes">Moving from Apple Notes</a> takes one import on a Mac and leaves Apple Notes as it
        was.
      </p>
    </PostPage>
  );
}
