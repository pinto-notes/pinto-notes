# Proposed App Store text for the release that keeps a copy of the key

Not live, and nothing here has been sent to Apple. `metadata.md` and `metadata-mac.md` hold the text that is on the store or in review (1.2), where only a person's devices hold the key. This file lists, field by field, what changes in the release where the server keeps a sealed copy of the key for a standard account and Advanced protection is the opt-in. The store text changes on the day the server's `KEY_COPY` switch goes on. Every sentence here has to be true that day.

The two modes, in the words used everywhere else:

- Default: "Your notes are encrypted on your devices before they sync. We keep a locked copy of your key so that signing in opens your notes on a new device. That means we could open your notes if we had to, for example under a court order, and so could someone who gets into your account."
- Strict: "With Advanced protection on, your notes are end-to-end encrypted: we can't open them and can't help you back in."

## metadata.md (iPhone and iPad)

### Promotional text

Current:

```
Notes, checklists and tables that sync between your iPhone and Mac, end-to-end encrypted. Connect ChatGPT or Claude and let it read and update your notes.
```

Proposed:

```
Notes, checklists and tables that sync between your iPhone and Mac, encrypted on your devices. Connect ChatGPT or Claude and let it read and update your notes.
```

### Description, the section headed ENCRYPTED END TO END

Current:

```
ENCRYPTED END TO END
Your notes are encrypted on your iPhone and Mac before they sync. We can't read them. Two things work differently. An AI you connect reads the notes it asks for through our server. A note you share as a web page is readable by anyone with the link.
```

Proposed:

```
ENCRYPTED ON YOUR DEVICES
Your notes are encrypted on your iPhone and Mac before they sync. We keep a locked copy of your key, so signing in opens your notes on a new device, and we could open them if we had to. Turn on Advanced protection and we keep no copy: your notes are end-to-end encrypted, and we can't open them or help you back in. Two things work the same either way. An AI you connect reads the notes it asks for through our server. A note you share as a web page is readable by anyone with the link.
```

### What's New

Current: the 1.2 text (the rename to Pinto Notes). Proposed for the release that ships this:

```
Signing in is now all a new iPhone or Mac needs to open your notes. No other device, no recovery key. We keep a locked copy of your key for this, which means we could open your notes if we had to. If you'd rather only your devices hold your key, as before, turn on Advanced protection in Settings, Security. Accounts made before this version are asked first, and nothing is copied until you answer.
```

### Notes for the reviewer, 2. PURPOSE

Current:

```
A notes app for iPhone and Mac with checklists, tables, files and folders, synced and end-to-end encrypted.
```

Proposed:

```
A notes app for iPhone and Mac with checklists, tables, files and folders, synced and encrypted on the person's devices.
```

### Notes for the reviewer, 3. HOW TO TEST, the sign-in step

Current:

```
Sign in: tap "I already have an account", enter the demo email, Continue, the password.
Next you see "Open your notes on this iPhone". The notes are encrypted and your device has no key yet. Tap "Use a recovery key instead" and enter:
[RECOVERY KEY]
Please do not use "No device left?" and "Start fresh". It erases the demo notes.
```

Proposed:

```
Sign in: tap "I already have an account", enter the demo email, Continue, the password. Your notes open.
```

This is true only if the demo account is a standard account with a copy stored. It was made before copies were kept, so it is asked first, like any account from before. Before submitting: on a device that already has the demo account's notes, with the new build, answer the sheet "Signing in now opens your notes" with Continue. Then sign in on a clean device and check that the notes open with no recovery key. Until that has been checked, keep the current recovery key lines.

## metadata-mac.md (Mac)

### Promotional text

Current:

```
Tell ChatGPT "add oat milk to my groceries" and it's in your notes a second later, on your Mac and iPhone. End-to-end encrypted notes your AI can read and update.
```

Proposed:

```
Tell ChatGPT "add oat milk to my groceries" and it's in your notes a second later, on your Mac and iPhone. Notes encrypted on your devices, that your AI can read and update.
```

### Description, the section headed ENCRYPTED END TO END

Current:

```
ENCRYPTED END TO END
Your notes are encrypted on your Mac and iPhone before they sync. We can't read them. Two things work differently. An AI you connect reads the notes it asks for through our server. A note you share as a web page is readable by anyone with the link.
```

Proposed:

```
ENCRYPTED ON YOUR DEVICES
Your notes are encrypted on your Mac and iPhone before they sync. We keep a locked copy of your key, so signing in opens your notes on a new device, and we could open them if we had to. Turn on Advanced protection and we keep no copy: your notes are end-to-end encrypted, and we can't open them or help you back in. Two things work the same either way. An AI you connect reads the notes it asks for through our server. A note you share as a web page is readable by anyone with the link.
```

### What's New

The same text as the iPhone page.

### Notes for the reviewer, SIGN IN

Current:

```
SIGN IN
Enter the demo email, Continue, the password. You then see "Open your notes on this Mac", because the notes are encrypted with a key this Mac does not have yet. Click "Use a recovery key instead" and enter:
[RECOVERY KEY]
Please do not use "Start fresh". It erases the demo notes.
```

Proposed, under the same condition as on the iPhone page:

```
SIGN IN
Enter the demo email, Continue, the password. The notes open.
```

## Fields that stay as they are

Name, subtitle, keywords, the rest of the description, the screenshots' captions and the answers in `docs/app-privacy-answers.md` make no claim about who can read notes.
