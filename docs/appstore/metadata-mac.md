# App Store metadata: Pinto Notes for Mac

What was submitted for the Mac App Store page for version 1.2 on 10 October 2026: the same app
record as the iPhone app (app id 6817253103, platform macOS). Name, subtitle, category, privacy
policy, age rating, price and App Privacy are shared with the iPhone app and set there (see
[metadata.md](metadata.md)); this page is what's Mac-only.

`deno run -A scripts/asc.ts mac-store` writes the text below into App Store Connect: the macOS
version (at the `MARKETING_VERSION` in project.yml), its text, the screenshots and the App Review
details. It never submits. With a build number (`mac-store 2610102258`) it also selects that build.
It reads the app's name from the heading of this file and stops before sending anything if that
name is not Pinto Notes.
Character counts are checked by `python3 scripts/check-metadata.py docs/appstore/metadata-mac.md`.

## Version page

**Promotional text** (can change any time without review):

```
Tell ChatGPT "add oat milk to my groceries" and it's in your notes a second later, on your Mac and iPhone. End-to-end encrypted notes your AI can read and update.
```

**Description:**

```
Pinto Notes is a simple notes app your AI can use.

It works like the notes app you already know, with folders, checklists, tables and photos. The difference is that ChatGPT and Claude can read and update your notes when you let them.

ASK YOUR AI, IT'S IN YOUR NOTES
• "Add oat milk to my groceries." It's on your Mac and iPhone a second later.
• "What did we decide about the Lisbon hotel?" Your AI reads the note and answers.
• "Turn this meeting into a checklist in Work." Done, on every device.
• Every line an AI changes is highlighted, with Undo next to it.

BRING YOUR NOTES
• Import every note and folder from Apple Notes in one step. Nothing in Apple Notes changes.
• Import from Evernote, Google Keep, or Markdown and text files, with folders, checklists and attachments.
• Start from a template on pintonotes.com.

A NOTES APP FIRST
• Checklists that move ticked items to the bottom
• Headings, bullets, numbered lists and quotes
• Tables you edit cell by cell
• Photos, PDFs and files in your notes and folders
• Sub-notes that keep details one click away
• Keep writing offline. Changes sync when you're back.

ENCRYPTED END TO END
Your notes are encrypted on your Mac and iPhone before they sync. We can't read them. Two things work differently. An AI you connect reads the notes it asks for through our server. A note you share as a web page is readable by anyone with the link.

YOU DECIDE WHO GETS IN
• You approve every AI connection on your device, read only or read and edit
• Disconnect an AI at any time
• Every change keeps the earlier version, so you can go back
• Share a note as a web page and stop sharing whenever you like
• Delete your account and everything in it from Settings

No ads and no tracking. Open source. 2 GB of storage.

Sign in with Apple, Google or email. Connecting ChatGPT or Claude needs your own account with that service.

Pinto Notes was called Amber Notes until October 2026.
```

**Keywords** (no spaces after commas):

```
markdown,checklist,notepad,todo,journal,memo,writing,table,sync,menubar,notebook,planner,outline,mcp
```

**Support URL:** https://pintonotes.com/support

**Marketing URL:** https://pintonotes.com

**Copyright:** 2026 Emil Wagman

**Version:** 1.2, build 2610102258. Release: manual.

## Screenshots

Mac slot, five captioned frames at 1440 × 900 (2880 × 1800 when made on a Retina Mac), in this
order from `.shots/appstore/mac/`:

1. `1-ai-change.png`: "The notes app your AI can actually use." Groceries, five lines marked, with Undo
2. `2-connect.png`: "Works with ChatGPT and Claude". A note with the Connected panel in front
3. `3-notes.png`: "Checklists, tables and sub-notes". The welcome note
4. `4-import.png`: "Bring all your Apple Notes". Import from Apple Notes
5. `5-notes-dark.png`: "Simple notes, on every device". A trip plan in dark mode

They're the real app on the demo library, drawn in off-screen windows (nothing on the display):

```
scripts/store-art/capture-mac.sh            # windows → .shots/appstore/mac/captures
python3 scripts/store-art/render-mac.py     # captions and layout → .shots/appstore/mac
```

## App Review information

Contact, phone and demo account are copied from the iPhone version. `mac-store` puts the
recovery key from the iPhone version's notes where the text below says `[RECOVERY KEY]`; it isn't
kept here. The same screen recording is attached as for the iPhone version.

**Notes for the reviewer:**

```
Pinto Notes 1.2 for Mac. Same app record, account and service as the iPhone app. It was called Amber Notes before; only the name and icon changed.

SIGN IN
Enter the demo email, Continue, the password. You then see "Open your notes on this Mac", because the notes are encrypted with a key this Mac does not have yet. Click "Use a recovery key instead" and enter:
[RECOVERY KEY]
Please do not use "Start fresh". It erases the demo notes.

MAC ONLY
File > Import from Apple Notes asks macOS for permission to control Notes, lists the notes and copies the ones the user picks. It never changes or deletes anything in Apple Notes. This is the reason for the Apple Events entitlement, limited to com.apple.Notes.
"Also bring over pinned notes" is off by default. When turned on it asks for Full Disk Access, to read which notes are pinned.
The app is sandboxed and does not update itself.

THE REST
Sharing, reporting, AI connections and account deletion work as on iPhone. The iPhone version's notes describe each. The attached screen recording was made on an iPhone 17 running iOS 26.6.2 with version 1.2 and shows them: sharing and reporting at 1:49, an AI connection at 3:46, registration at 4:35, account deletion at 5:44.
Share: the Share button in a note's toolbar, Share Link.
AI: Settings, AI tab.
Delete account: Settings, Account tab, Delete Account. Please test it on a new account, not the demo account.

External services, AI and encryption: as in the iPhone notes. No purchases, ads, analytics or tracking.
Contact: hello@pintonotes.com
```

## After 1.2

The notes above are what was submitted for 1.2. From the first build after 1.2 the app sends its
own error reports and a few usage counts to PostHog (EU); Settings > General > Share diagnostics
and usage turns that off. The next version's notes must say so where these say "No purchases,
ads, analytics or tracking".
